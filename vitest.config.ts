/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// `vitest run` = jen unit testy (jsdom). Storybook component testy
// (@storybook/addon-vitest, browser/playwright) byly odděleny — jejich plugin
// se vyhodnocoval i při běžném `vitest run` a padal na ESM/CJS race v
// @chromatic-com/storybook (Node 24 require(ESM)), čímž shazoval i unit testy
// (D-033). Storybook jako vizuální katalog běží dál přes `npm run storybook`.
//
// react() plugin se NEuvádí — vitest auto-merguje root vite.config.ts (react je
// odtud); duplicitní react() rozbíjel test context („failed to find current
// suite"). resolve.alias ponecháno (auto-merge ho spolehlivě nepřenese).
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(dirname, 'src'),
    },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          environment: 'jsdom',
          setupFiles: ['./src/__tests__/setup.ts'],
          css: false,
          // 2026-05-25: 6 testů flaky v parallel mode kvůli sdíleným globálům
          // (jotai default store, vi.mock state). Serial běh garantuje stabilitu;
          // ztráta výkonu ~30 % (1315 testů, ~2 min serial vs ~1 min parallel)
          // je akceptovatelná cena za 100% reprodukovatelnost.
          fileParallelism: false,
        },
      },
    ],
  },
});
