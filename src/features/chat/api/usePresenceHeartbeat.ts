import { useEffect } from 'react';
import { getSocket } from './socket';

/** Interval heartbeatu — kratší než BE 60min threshold, ať jeden zaškobrtnutý
 *  signál uživatele neodpojí. */
const HEARTBEAT_MS = 5 * 60_000;

/**
 * Posílá `chat:heartbeat` co 5 min — drží chat presence „naživu" (4.2d §4).
 * Volá se globálně v layoutu, ne v `ChatRoom`: uživatel může být přítomný
 * v místnosti, i když zrovna kouká na jinou stránku. Zavřená/uspaná záložka
 * heartbeat zastaví → BE po 60 min odebere z místností.
 */
export function usePresenceHeartbeat(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;
    // D-AUDIT-2026-07-11 — `getSocket()` volat ČERSTVĚ v každém ticku, ne
    // jednou zachycenou proměnnou z mountu: po swapu instance (re-auth,
    // toggle neviditelnosti) by heartbeat mířil na mrtvý socket a BE by
    // uživatele po 60 min vyhodil z místností, i když je aktivní.
    const id = setInterval(
      () => getSocket().emit('chat:heartbeat'),
      HEARTBEAT_MS,
    );
    return () => clearInterval(id);
  }, [enabled]);
}
