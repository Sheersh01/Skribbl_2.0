import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true, // reachable from other devices on your LAN (phone testing)
    proxy: {
      '/socket.io': { target: 'http://localhost:3001', ws: true },
    },
  },
});
