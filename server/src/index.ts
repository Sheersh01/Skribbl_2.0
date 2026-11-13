import { existsSync } from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';
import express from 'express';
import { Server } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '@skribbl/shared';
import { registerSocketHandlers, type SocketData } from './socket';

const PORT = Number(process.env.PORT) || 3001;

const app = express();
const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents, object, SocketData>(httpServer, {
  maxHttpBufferSize: 64 * 1024,
});

const registry = registerSocketHandlers(io);

app.get('/health', (_req, res) => {
  res.json({ ok: true, rooms: registry.size, sockets: io.engine.clientsCount });
});

// In production, serve the built client from the same server.
const clientDist = path.resolve(import.meta.dirname, '../../client/dist');
if (existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.use((_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

httpServer.listen(PORT, () => {
  console.log(`server listening on http://localhost:${PORT}`);
});
