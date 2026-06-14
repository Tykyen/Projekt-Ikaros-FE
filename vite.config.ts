import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(dirname, 'src'),
    },
  },
  // PC-09: v produkčním buildu odstranit console.* a debugger z bundlu
  // (esbuild je jinak nechává). V dev ponecháno pro ladění.
  esbuild: mode === 'production' ? { drop: ['console', 'debugger'] } : {},
}));
