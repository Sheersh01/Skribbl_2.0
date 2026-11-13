import { create } from 'zustand';
import type { ChatMessage, JoinInfo, Profile, Result, RoomState, Settings } from '@skribbl/shared';
import { codeFromPath, navigate } from './lib/route';
import { loadProfile, loadSession, saveProfile, saveSession } from './lib/storage';
import { socket } from './socket';

type Status = 'idle' | 'joining' | 'in-room';

const MAX_MESSAGES = 150;

interface GameStore {
  status: Status;
  room: RoomState | null;
  session: JoinInfo | null;
  /** Message shown on the home screen (errors, "you were kicked", ...). */
  notice: string | null;
  /** Bumps on every successful (re)join so the canvas knows to resync. */
  joinCount: number;
  connected: boolean;
  messages: ChatMessage[];
  /** Local Date.now() at which the current phase ends (for the countdown). */
  deadline: number | null;
}

// Rejoin automatically if this tab already has a session for the room in the URL.
const saved = loadSession();
const resumable = saved && saved.code === codeFromPath() ? saved : null;
if (saved && !resumable) saveSession(null);

export const useGame = create<GameStore>(() => ({
  status: resumable ? 'joining' : 'idle',
  room: null,
  session: resumable,
  notice: null,
  joinCount: 0,
  connected: socket.connected,
  messages: [],
  deadline: null,
}));

const set = useGame.setState;
const get = useGame.getState;

const outOfRoom = (notice: string | null) => ({
  status: 'idle' as const,
  room: null,
  session: null,
  notice,
  messages: [],
  deadline: null,
});

function onJoined(res: Result<JoinInfo>, replaceUrl: boolean) {
  if (!res.ok) {
    saveSession(null);
    set(outOfRoom(res.error));
    return;
  }
  const session: JoinInfo = { code: res.code, playerId: res.playerId, sessionId: res.sessionId };
  const sameRoom = get().room?.code === res.code;
  saveSession(session);
  navigate(`/r/${res.code}`, replaceUrl);
  set((s) => ({
    session,
    notice: null,
    joinCount: s.joinCount + 1,
    messages: sameRoom ? s.messages : [],
  }));
}

export function createRoom(profile: Profile) {
  saveProfile(profile);
  set({ status: 'joining', notice: null });
  socket.emit('room:create', profile, (res) => onJoined(res, false));
}

export function joinRoom(code: string, profile: Profile) {
  saveProfile(profile);
  const s = get().session;
  // A silent rejoin (after a dropped connection) keeps the current screen up.
  set((st) => ({ status: st.status === 'in-room' ? 'in-room' : 'joining', notice: null }));
  socket.emit(
    'room:join',
    { code, ...profile, sessionId: s?.code === code ? s.sessionId : undefined },
    (res) => onJoined(res, codeFromPath() === code),
  );
}

export function leaveRoom(notice: string | null = null) {
  socket.emit('room:leave');
  saveSession(null);
  set(outOfRoom(notice));
  navigate('/');
}

export const updateSettings = (patch: Partial<Settings>) => socket.emit('room:settings', patch);
export const kickPlayer = (playerId: string) => socket.emit('room:kick', playerId);
export const endGame = () => socket.emit('game:end');
export const startGame = () => new Promise<Result>((resolve) => socket.emit('game:start', resolve));
export const chooseWord = (index: number) => socket.emit('turn:chooseWord', index);
export const sendChat = (text: string) => socket.emit('chat:send', text);

// ---- server events ----------------------------------------------------------

socket.on('room:state', (room) => {
  const s = get().session;
  if (!s || room.code !== s.code) return;
  if (!room.players.some((p) => p.id === s.playerId)) return; // we were removed; room:kicked follows
  set({ room, status: 'in-room', deadline: room.turn ? Date.now() + room.turn.endsIn : null });
});

socket.on('chat:message', (msg) => {
  set((s) => ({ messages: [...s.messages, msg].slice(-MAX_MESSAGES) }));
});

socket.on('room:kicked', (reason) => {
  saveSession(null);
  set(outOfRoom(reason));
  navigate('/');
});

// On (re)connect, reclaim our slot if we have one.
socket.on('connect', () => {
  set({ connected: true });
  const s = get().session;
  if (s) joinRoom(s.code, loadProfile());
});

socket.on('disconnect', () => set({ connected: false }));

// Browser back/forward away from the room = leave it.
window.addEventListener('popstate', () => {
  const room = get().room;
  if (room && codeFromPath() !== room.code) leaveRoom();
});
