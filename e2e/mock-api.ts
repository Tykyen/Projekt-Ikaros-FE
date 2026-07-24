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
  TEST_CHARACTER,
  TEST_DIARY,
  TEST_CHAT_GROUP,
  TEST_CHAT_APPEARANCE,
  TEST_INVITE_ACCEPT,
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
    // Vypravěč (spec 26.6): default = ZAVEDENÝ účet s personou — persona
    // dialog se v happy-path smoke NEotvírá (testuje ho persona.spec.ts,
    // který tuhle routu přepíše). PATCH vrací tentýž stav, telemetrie 204.
    if (path === '/users/me/onboarding') {
      return json(route, {
        state: {
          persona: 'pj',
          journeys: {},
          seenRoutes: [],
          dismissed: [],
          milestones: {},
          mode: 'active',
          backfilled: false,
          updatedAt: new Date().toISOString(),
        },
        legacy: false,
      });
    }
    if (path === '/vypravec/telemetry' && method === 'POST') {
      return route.fulfill({ status: 204, body: '' });
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
    // Svět dle ID (useWorld) — ChannelView čte `world.dice` odsud; bez toho
    // je dice picker prázdný. PŘESNÉ ID (ne `[^/]+`, jinak by chytlo i jiné
    // 1-segmentové /worlds/* endpointy vracející pole → .find/.map crash).
    if (path === `/worlds/${TEST_WORLD.id}` && method === 'GET') {
      return json(route, TEST_WORLD);
    }
    if (path === '/maps/active') {
      return json(route, TEST_SCENE);
    }

    // ── 27.1 golden ① — přijetí pozvánky (link i cílená) → redirect do světa ──
    if (/\/worlds\/invite-token\/[^/]+\/accept$/.test(path) && method === 'POST') {
      return json(route, TEST_INVITE_ACCEPT, 201);
    }
    if (/\/worlds\/[^/]+\/invites\/[^/]+\/accept$/.test(path) && method === 'POST') {
      return json(route, TEST_INVITE_ACCEPT, 201);
    }

    // ── 27.1 golden ② — postava + deník ──
    // POZOR: `/pages/directory` (adresář postav) musí být PŘED obecným
    // `/pages/:slug`, jinak by directory dostal objekt místo pole → `.map` crash.
    if (/\/pages\/directory$/.test(path) && method === 'GET') {
      return json(route, []);
    }
    if (/\/characters\/[^/]+\/diary$/.test(path)) {
      return json(route, TEST_DIARY);
    }
    if (/\/characters\/[^/]+$/.test(path) && method === 'GET') {
      return json(route, TEST_CHARACTER);
    }
    // Page load pro PostavaLayout (PageViewer čte stránku dle slug). Kompletní
    // Page dle pages.types.ts — povinná pole (sections/galleryImages/videos/
    // menu/accessRequirements) MUSÍ být pole (ne null → .filter/.map crash).
    if (/\/pages\/[^/]+$/.test(path) && method === 'GET') {
      return json(route, {
        ...TEST_CHARACTER,
        title: TEST_CHARACTER.name,
        content: '<p>Statečný hrdina.</p>',
        plainText: 'Statečný hrdina.',
        sections: [],
        galleryImages: [],
        videos: [],
        menu: [],
        isWoodWide: false,
        accessRequirements: [],
        order: 0,
        pageStatus: 'approved',
        // Link na character entity — subdoc taby (Deník/Finance/…) se odemknou.
        characterRef: { characterId: TEST_CHARACTER.id },
      });
    }

    // ── 27.1 golden ② — chat (groups s kanálem → composer se vykreslí) ──
    if (/\/chat\/groups$/.test(path)) {
      return json(route, [TEST_CHAT_GROUP]);
    }
    if (/\/chat\/appearance$/.test(path) && method === 'GET') {
      return json(route, TEST_CHAT_APPEARANCE);
    }
    if (/\/chat\/unread$/.test(path)) {
      return json(route, []);
    }
    if (/\/chat\/(channels\/[^/]+\/)?messages/.test(path) && method === 'GET') {
      return json(route, []);
    }
    // Odeslání zprávy (běžná i hod) → echo, ať optimistic insert má co potvrdit.
    if (/\/chat\/channels\/[^/]+\/messages$/.test(path) && method === 'POST') {
      const body = (req.postDataJSON() ?? {}) as Record<string, unknown>;
      return json(
        route,
        {
          id: `msg-${Date.now()}`,
          worldId: TEST_WORLD.id,
          senderId: TEST_USER.id,
          senderName: TEST_USER.displayName,
          content: body.content ?? '',
          isDiceRoll: !!body.dicePayload,
          dicePayload: body.dicePayload ?? null,
          createdAt: new Date().toISOString(),
        },
        201,
      );
    }

    // Default — neblokující prázdná kolekce (settings/directory/access-requests/…).
    return json(route, []);
  });
}
