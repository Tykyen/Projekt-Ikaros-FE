/**
 * 14.5 — mockuje BE pro E2E smoke. Jeden catch-all handler na všechny `/api`
 * requesty (přesný switch dle pathname + metody; deterministický, žádné glob
 * pasti) + abort socket.io (mapa WS nepotřebuje — má polling fallback a render
 * je read-only). Neznámé `/api` GET dostanou `[]`, ať žádný TanStack query
 * nevisí v `isLoading` (jinak by `WorldContext.loading` zůstalo true).
 */
import type { Page, Route } from '@playwright/test';
import {
  LOGIN_RESPONSE,
  TEST_USER,
  TEST_WORLD,
  TEST_MY_WORLD_ENTRY,
  TEST_SCENE,
} from './fixtures';

function json(route: Route, body: unknown, status = 200): Promise<void> {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

export async function mockBackend(page: Page): Promise<void> {
  // WS — nech spadnout (mapa to přežije). Registrováno první = nejnižší priorita.
  await page.route('**/socket.io/**', (route) => route.abort());

  await page.route('**/api/**', (route) => {
    const req = route.request();
    const { pathname } = new URL(req.url());
    const method = req.method();

    // /api prefix odřízneme až za ním porovnáváme čistou cestu.
    const path = pathname.replace(/^\/api/, '');

    if (path === '/auth/login' && method === 'POST') {
      return json(route, LOGIN_RESPONSE);
    }
    if (path === '/users/me') {
      return json(route, TEST_USER);
    }
    if (path === '/worlds/my') {
      return json(route, [TEST_MY_WORLD_ENTRY]);
    }
    if (path === '/worlds') {
      return json(route, [TEST_WORLD]);
    }
    if (path.startsWith('/worlds/slug/')) {
      return json(route, TEST_WORLD);
    }
    if (path === '/maps/active') {
      return json(route, TEST_SCENE);
    }

    // Default — neblokující prázdná kolekce (settings/directory/access-requests/…).
    return json(route, []);
  });
}
