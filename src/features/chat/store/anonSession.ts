import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

/**
 * Spec 15.8 — host (anonym) session pro Hospodu. Guest JWT + jméno anonym{N},
 * dlouhodobé (TTL 14 d na BE). Oddělené od `currentUserAtom` — členský flow se
 * tím nedotkne. Token se posílá v api klientu / WS handshake, když není členský.
 */
export interface AnonSession {
  token: string;
  anonName: string;
  anonId: string;
}

export const anonSessionAtom = atomWithStorage<AnonSession | null>(
  'ikaros.anonToken',
  null,
);

/** Jméno hosta (`anonym{N}`) nebo null, když host session není. */
export const anonNameAtom = atom((get) => get(anonSessionAtom)?.anonName ?? null);
