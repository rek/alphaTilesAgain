import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig(({ mode: _mode }) => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/home',
  base: '/',
  plugins: [react()],
  build: {
    outDir: '../../dist/apps/home',
    emptyOutDir: true,
    reportCompressedSize: true,
  },
  server: {
    port: 4200,
  },
}));
