import { useEffect } from 'react';
import { useAtomValue, getDefaultStore } from 'jotai';
import { getSocket } from '@/features/chat/api/socket';
import { presenceStatusMapAtom, type PresenceStatus } from './store';

type SnapshotEntry = { userId: string; status: PresenceStatus };
type SnapshotPayload = { entries: SnapshotEntry[] };
type UpdatePayload = {
  userId: string;
  status: PresenceStatus | 'offline';
};

/**
 * Spec 1.5 — inicializace presence listenerů + idle activity tracker.
 * Volá se jednou v root layoutu po `useSocketInit()`. Po reconnectu server
 * pošle nový `presence:snapshot` automaticky (v `handleConnection`).
 *
 * D-049 — activity tracker:
 *   - listenery `mousemove`/`keydown`/`focus`/`visibilitychange`
 *   - po IDLE_THRESHOLD_MS nečinnosti emit `presence:idle`
 *   - při návratu aktivity emit `presence:active`
 */
export const IDLE_THRESHOLD_MS = 5 * 60 * 1000;

export function usePresenceInit(): void {
  useEffect(() => {
    const socket = getSocket();
    const store = getDefaultStore();

    const onSnapshot = (data: SnapshotPayload) => {
      const next = new Map<string, PresenceStatus>();
      for (const entry of data.entries) next.set(entry.userId, entry.status);
      store.set(presenceStatusMapAtom, next);
    };

    const onUpdate = (data: UpdatePayload) => {
      const current = store.get(presenceStatusMapAtom);
      const next = new Map(current);
      if (data.status === 'offline') next.delete(data.userId);
      else next.set(data.userId, data.status);
      store.set(presenceStatusMapAtom, next);
    };

    socket.on('presence:snapshot', onSnapshot);
    socket.on('presence:update', onUpdate);

    // D-049 — activity tracker
    let isIdle = false;
    let lastActivity = Date.now();
    let intervalId: ReturnType<typeof setInterval> | null = null;

    function markActive() {
      lastActivity = Date.now();
      if (isIdle) {
        isIdle = false;
        socket.emit('presence:active');
      }
    }

    function tick() {
      if (document.hidden) return; // visibilitychange handler řeší skryté karty
      if (!isIdle && Date.now() - lastActivity >= IDLE_THRESHOLD_MS) {
        isIdle = true;
        socket.emit('presence:idle');
      }
    }

    function onVisibility() {
      if (document.hidden) {
        if (!isIdle) {
          isIdle = true;
          socket.emit('presence:idle');
        }
      } else {
        markActive();
      }
    }

    window.addEventListener('mousemove', markActive, { passive: true });
    window.addEventListener('keydown', markActive);
    window.addEventListener('focus', markActive);
    document.addEventListener('visibilitychange', onVisibility);
    intervalId = setInterval(tick, 30_000);

    return () => {
      socket.off('presence:snapshot', onSnapshot);
      socket.off('presence:update', onUpdate);
      window.removeEventListener('mousemove', markActive);
      window.removeEventListener('keydown', markActive);
      window.removeEventListener('focus', markActive);
      document.removeEventListener('visibilitychange', onVisibility);
      if (intervalId) clearInterval(intervalId);
    };
  }, []);
}

/** True pokud user má aktivní socket (online OR idle). */
export function useIsOnline(userId: string | undefined | null): boolean {
  const map = useAtomValue(presenceStatusMapAtom);
  if (!userId) return false;
  return map.has(userId);
}

/** Detailní status: 'online' | 'idle' | 'offline'. */
export function usePresenceStatus(
  userId: string | undefined | null,
): PresenceStatus | 'offline' {
  const map = useAtomValue(presenceStatusMapAtom);
  if (!userId) return 'offline';
  return map.get(userId) ?? 'offline';
}
