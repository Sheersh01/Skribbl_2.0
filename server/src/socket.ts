import type { Server, Socket } from 'socket.io';
import {
  sanitizeAvatar,
  sanitizeName,
  type ClientToServerEvents,
  type JoinInfo,
  type Result,
  type ServerToClientEvents,
} from '@skribbl/shared';
import type { Room } from './engine/Room';
import { RoomRegistry, normalizeCode } from './engine/RoomRegistry';
import { validateOp } from './validate';

export interface SocketData {
  code?: string;
  playerId?: string;
}

export type IO = Server<ClientToServerEvents, ServerToClientEvents, object, SocketData>;
type GameSocket = Socket<ClientToServerEvents, ServerToClientEvents, object, SocketData>;

/** Wires socket events to the room engine. All game rules live in the engine. */
export function registerSocketHandlers(io: IO): RoomRegistry {
  /** `${code}:${playerId}` -> socket id of the player's current connection. */
  const playerSockets = new Map<string, string>();
  const key = (code: string, playerId: string) => `${code}:${playerId}`;

  const registry = new RoomRegistry({
    // Each player gets their own view: the word is only included for those allowed to see it.
    onChange: (room) => {
      for (const playerId of room.playerIds()) {
        const sid = playerSockets.get(key(room.code, playerId));
        if (sid) io.to(sid).emit('room:state', room.toState(playerId));
      }
    },
    onChat: (room, msg, to) => {
      if (!to) {
        io.to(room.code).emit('chat:message', msg);
        return;
      }
      for (const playerId of to) {
        const sid = playerSockets.get(key(room.code, playerId));
        if (sid) io.to(sid).emit('chat:message', msg);
      }
    },
  });

  const attach = (socket: GameSocket, room: Room, playerId: string) => {
    const k = key(room.code, playerId);
    const prevId = playerSockets.get(k);
    if (prevId && prevId !== socket.id) {
      // Same player connected from somewhere else (e.g. duplicated tab): the newest wins.
      const prev = io.sockets.sockets.get(prevId);
      if (prev) {
        prev.data = {};
        prev.leave(room.code);
        prev.emit('room:kicked', 'You joined this room from another tab.');
      }
    }
    playerSockets.set(k, socket.id);
    socket.data = { code: room.code, playerId };
    socket.join(room.code);
  };

  /** Detaches the socket from its room. `leave` frees the slot now; `disconnect` keeps it for a while. */
  const detach = (socket: GameSocket, mode: 'leave' | 'disconnect') => {
    const { code, playerId } = socket.data;
    socket.data = {};
    if (!code || !playerId) return;
    socket.leave(code);
    const k = key(code, playerId);
    if (playerSockets.get(k) !== socket.id) return; // replaced by a newer connection
    playerSockets.delete(k);
    const room = registry.get(code);
    if (!room) return;
    if (mode === 'leave') room.leave(playerId);
    else room.disconnect(playerId);
  };

  /** The room + player this socket belongs to, if still valid. */
  const current = (socket: GameSocket) => {
    const room = registry.get(socket.data.code);
    const playerId = socket.data.playerId;
    if (!room || !playerId || !room.has(playerId)) return null;
    return { room, playerId };
  };

  io.on('connection', (socket) => {
    socket.on('room:create', (profile, ack) => {
      if (typeof ack !== 'function') return;
      const name = sanitizeName(profile?.name);
      if (!name) return ack({ ok: false, error: 'Please enter a name.' });

      detach(socket, 'leave');
      const room = registry.create();
      const res = room.addPlayer(name, sanitizeAvatar(profile?.avatar));
      if (!res.ok) return ack(res);
      attach(socket, room, res.player.id);
      ack({ ok: true, code: room.code, playerId: res.player.id, sessionId: res.sessionId });
      socket.emit('room:state', room.toState(res.player.id));
    });

    socket.on('room:join', (req, ack) => {
      if (typeof ack !== 'function') return;
      const code = normalizeCode(req?.code);
      const room = registry.get(code);
      if (!room) return ack({ ok: false, error: "That room doesn't exist (anymore)." });

      let result: Result<JoinInfo>;

      // Rejoin with an existing session first.
      const reclaimed = typeof req.sessionId === 'string' ? room.reconnect(req.sessionId) : null;
      if (reclaimed) {
        if (socket.data.code !== room.code || socket.data.playerId !== reclaimed.id) detach(socket, 'leave');
        attach(socket, room, reclaimed.id);
        result = { ok: true, code: room.code, playerId: reclaimed.id, sessionId: req.sessionId! };
      } else {
        const name = sanitizeName(req?.name);
        if (!name) return ack({ ok: false, error: 'Please enter a name.' });
        detach(socket, 'leave');
        const res = room.addPlayer(name, sanitizeAvatar(req?.avatar));
        if (!res.ok) return ack(res);
        attach(socket, room, res.player.id);
        result = { ok: true, code: room.code, playerId: res.player.id, sessionId: res.sessionId };
      }

      ack(result);
      if (result.ok) socket.emit('room:state', room.toState(result.playerId));
    });

    socket.on('room:leave', () => detach(socket, 'leave'));

    socket.on('room:settings', (patch) => {
      const c = current(socket);
      if (c) c.room.updateSettings(c.playerId, patch);
    });

    socket.on('room:kick', (targetId) => {
      const c = current(socket);
      if (!c || typeof targetId !== 'string') return;
      const targetSocketId = playerSockets.get(key(c.room.code, targetId));
      const res = c.room.kick(c.playerId, targetId);
      if (!res.ok) return;
      playerSockets.delete(key(c.room.code, targetId));
      const target = targetSocketId ? io.sockets.sockets.get(targetSocketId) : undefined;
      if (target) {
        target.data = {};
        target.leave(c.room.code);
        target.emit('room:kicked', 'The host removed you from the room.');
      }
    });

    socket.on('game:start', (ack) => {
      if (typeof ack !== 'function') return;
      const c = current(socket);
      if (!c) return ack({ ok: false, error: 'You are not in a room.' });
      ack(c.room.start(c.playerId));
    });

    socket.on('game:end', () => {
      const c = current(socket);
      if (c) c.room.endGame(c.playerId);
    });

    socket.on('turn:chooseWord', (index) => {
      const c = current(socket);
      if (c) c.room.chooseWord(c.playerId, index);
    });

    socket.on('chat:send', (text) => {
      const c = current(socket);
      if (c) c.room.chat(c.playerId, text);
    });

    socket.on('draw:requestSync', () => {
      const c = current(socket);
      if (c) socket.emit('draw:sync', c.room.board.snapshot());
    });

    socket.on('draw:op', (raw) => {
      const c = current(socket);
      if (!c || !c.room.canDraw(c.playerId)) return;
      const op = validateOp(raw);
      if (!op || !c.room.board.apply(op)) return;
      socket.to(c.room.code).emit('draw:op', op);
    });

    socket.on('disconnect', () => detach(socket, 'disconnect'));
  });

  return registry;
}
