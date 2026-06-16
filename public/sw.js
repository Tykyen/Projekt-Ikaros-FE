/*
 * Spec 13.2c — service worker pro web push notifikace.
 * Vanilla (bez workboxu) — řeší jen příjem push a klik na notifikaci. BE
 * `PushService` posílá payload { title, body, icon?, url? }.
 */

self.addEventListener('install', () => {
  // Nová verze SW se aktivuje hned (žádné čekání na zavření všech klientů).
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
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
