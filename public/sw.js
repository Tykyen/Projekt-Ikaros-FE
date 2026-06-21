/*
 * Spec 13.2c — service worker pro web push notifikace.
 * Spec 15.1 — + offline shell cache (cache-first assety, navigace network-first
 * → offline.html). Vanilla (bez workboxu).
 * BE `PushService` posílá payload { title, body, icon?, url?, tag? }
 * (tag = klientský dedup klíč pro slučování notifikací).
 */

// BE origin + běhový režim předané z `main.tsx` přes query (SW je mimo bundler,
// nemá env). `api` → fetch VAPID klíče při `pushsubscriptionchange`. Prázdný =
// fallback na relativní URL (same-origin přes reverzní proxy).
const SW_PARAMS = (() => {
  try {
    return new URL(self.location.href).searchParams;
  } catch {
    return new URLSearchParams();
  }
})();
const API_BASE = SW_PARAMS.get('api') || '';

// 15.1 — cache logika běží JEN v produkci (`mode=prod`). V dev by `fetch`
// handler cacheoval Vite moduly a rozbil HMR → dev zůstává push-only (jako 13.2c).
const CACHE_ENABLED = SW_PARAMS.get('mode') === 'prod';
const CACHE = 'ikaros-shell-v1';
const OFFLINE_URL = '/offline.html';

/** VAPID base64url → Uint8Array (formát pro `applicationServerKey`). */
function urlBase64ToUint8Array(base64) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(normalized);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

self.addEventListener('install', (event) => {
  // 15.1 — precache offline fallback (jen prod; v dev nic neřešíme).
  if (CACHE_ENABLED) {
    event.waitUntil(caches.open(CACHE).then((c) => c.add(OFFLINE_URL)));
  }
  // Nová verze SW se aktivuje hned (žádné čekání na zavření všech klientů).
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // 15.1 — úklid starých verzí cache (po bumpu CACHE).
      if (CACHE_ENABLED) {
        const keys = await caches.keys();
        await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      }
      await self.clients.claim();
    })(),
  );
});

// 15.1 — offline shell. Jen prod (mode=prod), jen GET na vlastním originu;
// cross-origin (fonty, API jiného hostu) a non-GET necháváme projít beze změny.
self.addEventListener('fetch', (event) => {
  if (!CACHE_ENABLED) return;
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Navigace = network-first → při výpadku sítě offline.html (žádný stale shell).
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  // Hashované assety jsou immutable (Vite mění název při změně obsahu) →
  // cache-first: z cache okamžitě, jinak stáhni a ulož.
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            // Cacheuj jen úspěšné basic odpovědi (ne chyby/opaque).
            if (res.ok && res.type === 'basic') {
              const copy = res.clone();
              void caches.open(CACHE).then((c) => c.put(req, copy));
            }
            return res;
          }),
      ),
    );
  }
});

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: 'Ikaros', body: event.data ? event.data.text() : '' };
  }
  const title = payload.title || 'Ikaros';
  const options = {
    body: payload.body || '',
    // Velká ikona v těle notifikace — Ikaros logo (barevné).
    icon: payload.icon || '/icons/icon-192.png',
    // Badge = monochromní silueta ve stavové liště (Android bere jen alfu).
    badge: '/icons/badge-96.png',
    data: { url: payload.url || '/' },
  };
  // tag = slučování na zařízení: víc zpráv z jedné konverzace přepíše jednu
  // bublinu místo hromady. renotify = i při sloučení znovu upozorni (zvuk).
  if (payload.tag) {
    options.tag = payload.tag;
    options.renotify = true;
  }
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Pokud už je appka otevřená, jen ji zaostři a navéduj na URL.
        for (const client of clientList) {
          if ('focus' in client) {
            client.focus();
            if ('navigate' in client && targetUrl !== '/') {
              client.navigate(targetUrl).catch(() => {});
            }
            return undefined;
          }
        }
        return self.clients.openWindow(targetUrl);
      }),
  );
});

// Prohlížeč/OS občas zrotuje push odběr (expirace, update) — bez obnovy by
// `getSubscription()` vrátil null a push by přestal chodit. Tady jen lokálně
// re-subscribneme (auth není v SW dostupný); nahlášení nového endpointu na BE
// a smazání starého řeší FE `usePush` autentizovaně při příštím otevření appky.
// Starý mrtvý endpoint mezitím dostane od BE 410 → auto-cleanup.
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/push/vapid-public-key`);
        if (!res.ok) return;
        const { publicKey } = await res.json();
        await self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      } catch {
        // best-effort — push se obnoví při dalším `usePush` enable/sync.
      }
    })(),
  );
});
