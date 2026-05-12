import { atom } from 'jotai';

/**
 * Spec 1.5 D-049 — Map<userId, status> kde status = 'online' | 'idle'.
 * Pokud userId není v mapě, je offline.
 */
export type PresenceStatus = 'online' | 'idle';

export const presenceStatusMapAtom = atom<Map<string, PresenceStatus>>(
  new Map(),
);
