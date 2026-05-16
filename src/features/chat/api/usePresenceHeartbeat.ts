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
    const socket = getSocket();
    const id = setInterval(() => socket.emit('chat:heartbeat'), HEARTBEAT_MS);
    return () => clearInterval(id);
  }, [enabled]);
}
