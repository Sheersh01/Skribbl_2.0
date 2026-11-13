import type { ChatMessage, JoinInfo, Profile, Result, RoomState, Settings } from './types';

export type Tool = 'pen' | 'eraser';

/**
 * A stroke, or a chunk of one. The drawer sends the same `id` repeatedly with
 * only the new points; receivers append them to the existing stroke.
 * `points` is a flat list: [x0, y0, x1, y1, ...] in logical canvas coordinates.
 */
export interface StrokeOp {
  type: 'stroke';
  id: string;
  tool: Tool;
  color: string;
  size: number;
  points: number[];
}

export interface ClearOp {
  type: 'clear';
  id: string;
}

export type DrawOp = StrokeOp | ClearOp;

export interface JoinRequest extends Profile {
  code: string;
  /** Present when rejoining after a refresh or dropped connection. */
  sessionId?: string;
}

export interface ServerToClientEvents {
  'room:state': (state: RoomState) => void;
  /** You were removed from the room (kicked, or opened in another tab). */
  'room:kicked': (reason: string) => void;
  'chat:message': (msg: ChatMessage) => void;
  /** Full canvas, sent in reply to draw:requestSync. */
  'draw:sync': (ops: DrawOp[]) => void;
  /** One op from another player. */
  'draw:op': (op: DrawOp) => void;
}

export interface ClientToServerEvents {
  'room:create': (profile: Profile, ack: (res: Result<JoinInfo>) => void) => void;
  'room:join': (req: JoinRequest, ack: (res: Result<JoinInfo>) => void) => void;
  'room:leave': () => void;
  'room:settings': (patch: Partial<Settings>) => void;
  'room:kick': (playerId: string) => void;
  'game:start': (ack: (res: Result) => void) => void;
  /** Host sends everyone back to the lobby. */
  'game:end': () => void;
  /** Drawer picks one of the offered words. */
  'turn:chooseWord': (index: number) => void;
  /** Chat message or guess. */
  'chat:send': (text: string) => void;
  'draw:op': (op: DrawOp) => void;
  'draw:requestSync': () => void;
}
