import { useCallback, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { pushDeviceKeys } from './usePushSubscriptions';

/** VAPID base64url → Uint8Array (formát pro `applicationServerKey`). */
function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(normalized);
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

const pushSupported =
  typeof navigator !== 'undefined' &&
  'serviceWorker' in navigator &&
  typeof window !== 'undefined' &&
  'PushManager' in window &&
  'Notification' in window;

/** Poslední endpoint nahlášený BE — detekce rotace odběru (viz `enable`/mount). */
const PUSH_ENDPOINT_KEY = 'push:endpoint';

/**
 * Spec 13.2c — správa push notifikací na **tomto zařízení**: zjištění stavu,
 * zapnutí (permission → `pushManager.subscribe` → `POST /push/subscribe`),
 * vypnutí (`POST /push/unsubscribe` + `subscription.unsubscribe()`).
 *
 * Push reálně dorazí jen z HTTPS/serveru (VAPID); lokálně se ověří jen flow
 * (permission, subscription objekt, volání API).
 */
export function usePush() {
  const qc = useQueryClient();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [denied, setDenied] = useState(
    pushSupported && Notification.permission === 'denied',
  );
  // D-030 — endpoint aktuální subscription; pro označení „toto zařízení" v seznamu.
  const [currentEndpoint, setCurrentEndpoint] = useState<string | null>(null);

  useEffect(() => {
    if (!pushSupported) return;
    let cancelled = false;
    void navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then(async (sub) => {
        if (cancelled) return;
        setIsSubscribed(!!sub);
        setCurrentEndpoint(sub?.endpoint ?? null);
        if (!sub) return;
        // Detekce rotace odběru: SW při `pushsubscriptionchange` re-subscribne,
        // ale nový endpoint nenahlásí na BE (nemá Bearer token). Tady to dohnáme
        // autentizovaně — pošleme nový endpoint + starý (ke smazání), ať se na
        // BE nehromadí mrtvé subscriptions stejného zařízení (= duplicitní push).
        const stored = localStorage.getItem(PUSH_ENDPOINT_KEY);
        if (stored === sub.endpoint) return;
        if (!stored) {
          // První záznam (migrace / subscribe z jiné session) — jen zapamatuj.
          localStorage.setItem(PUSH_ENDPOINT_KEY, sub.endpoint);
          return;
        }
        try {
          const json = sub.toJSON() as {
            keys?: { p256dh?: string; auth?: string };
          };
          await api.post('/push/subscribe', {
            endpoint: sub.endpoint,
            p256dh: json.keys?.p256dh ?? '',
            auth: json.keys?.auth ?? '',
            oldEndpoint: stored,
          });
          localStorage.setItem(PUSH_ENDPOINT_KEY, sub.endpoint);
        } catch {
          // best-effort — zkusí se znovu při příštím mountu / otevření appky.
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const enable = useCallback(async () => {
    if (!pushSupported || busy) return;
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setDenied(permission === 'denied');
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const { publicKey } = await api.get<{ publicKey: string }>(
        '/push/vapid-public-key',
      );
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      const json = sub.toJSON() as { keys?: { p256dh?: string; auth?: string } };
      await api.post('/push/subscribe', {
        endpoint: sub.endpoint,
        p256dh: json.keys?.p256dh ?? '',
        auth: json.keys?.auth ?? '',
      });
      localStorage.setItem(PUSH_ENDPOINT_KEY, sub.endpoint);
      setIsSubscribed(true);
      setCurrentEndpoint(sub.endpoint);
      void qc.invalidateQueries({ queryKey: pushDeviceKeys.all });
    } finally {
      setBusy(false);
    }
  }, [busy, qc]);

  const disable = useCallback(async () => {
    if (!pushSupported || busy) return;
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await api
          .post('/push/unsubscribe', { endpoint: sub.endpoint })
          .catch(() => {});
        await sub.unsubscribe();
      }
      localStorage.removeItem(PUSH_ENDPOINT_KEY);
      setIsSubscribed(false);
      setCurrentEndpoint(null);
      void qc.invalidateQueries({ queryKey: pushDeviceKeys.all });
    } finally {
      setBusy(false);
    }
  }, [busy, qc]);

  return {
    supported: pushSupported,
    isSubscribed,
    busy,
    denied,
    currentEndpoint,
    enable,
    disable,
  };
}
