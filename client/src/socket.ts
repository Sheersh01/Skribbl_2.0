import { io, type Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@skribbl/shared';

/** Same origin in dev (Vite proxies /socket.io) and in production. */
export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io();
