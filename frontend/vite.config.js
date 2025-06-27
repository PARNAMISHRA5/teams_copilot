import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    https: {
      key: fs.readFileSync(path.resolve(__dirname, '../backend/localhost-key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, '../backend/localhost.pem')),
    },
    port: 3000,
    proxy: {
      '/api': 'https://localhost:3001',
    }
  },
});