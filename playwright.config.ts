import { defineConfig, devices } from '@playwright/test';

/**
 * 14.5 — Playwright E2E smoke. Testy v `e2e/`, běží proti `vite preview`
 * (produkční build na portu 4173). BE je mockovaný v testu (mock-api.ts),
 * žádný backend ani DB. Jen chromium — na smoke stačí jeden prohlížeč.
 *
 * Vitest unit testy `e2e/` ignorují (viz `vitest.config.ts` exclude), takže
 * se oba runnery nepřekrývají.
 */
const PORT = 4173;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // `vite preview` servíruje `dist/` → před během musí proběhnout `npm run build`
  // (CI to dělá samostatným krokem; lokálně reuse běžícího serveru).
  webServer: {
    command: `npm run preview -- --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
