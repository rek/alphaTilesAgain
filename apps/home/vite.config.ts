import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/home',
  base: '/alphaTilesAgain/',
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
