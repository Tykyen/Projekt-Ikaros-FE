import { atom } from 'jotai';

export type SocketStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export const socketStatusAtom = atom<SocketStatus>('disconnected');

/**
 * D-AUDIT-2026-07-11 (socket-swap listener leak) — generace socket INSTANCE.
 * `getSocket()` ji inkrementuje při každém vytvoření nové instance (po
 * `disconnectSocket()` / `reconnectSocket()`). Effecty, které drží listener
 * nebo room membership na konkrétní instanci, ji mají v deps → po swapu se
 * re-bindnou na aktuální instanci (starou uklidí cleanup se STEJNOU referencí).
 * Na rozdíl od `socketStatusAtom` se NEmění při běžném reconnectu téže
 * instance (výpadek sítě) → join/leave emity zbytečně nečeří presence.
 */
export const socketGenerationAtom = atom(0);
