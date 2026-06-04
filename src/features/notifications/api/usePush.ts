import { useCallback, useEffect, useState } from 'react';
import { api } from '@/shared/api/client';

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

/**
 * Spec 13.2c — správa push notifikací na **tomto zařízení**: zjištění stavu,
 * zapnutí (permission → `pushManager.subscribe` → `POST /push/subscribe`),
 * vypnutí (`POST /push/unsubscribe` + `subscription.unsubscribe()`).
 *
 * Push reálně dorazí jen z HTTPS/serveru (VAPID); lokálně se ověří jen flow
 * (permission, subscription objekt, volání API).
 */
export function usePush() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [denied, setDenied] = useState(
    pushSupported && Notification.permission === 'denied',
  );

  useEffect(() => {
    if (!pushSupported) return;
    let cancelled = false;
    void navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => {
        if (!cancelled) setIsSubscribed(!!sub);
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
      setIsSubscribed(true);
    } finally {
      setBusy(false);
    }
  }, [busy]);

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
      setIsSubscribed(false);
    } finally {
      setBusy(false);
    }
  }, [busy]);

  return { supported: pushSupported, isSubscribed, busy, denied, enable, disable };
}
