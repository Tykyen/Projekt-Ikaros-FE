import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import type { User } from '../types';

export const accessTokenAtom = atomWithStorage<string | null>('ikaros.jwt', null);
export const refreshTokenAtom = atomWithStorage<string | null>('ikaros.rt', null);
export const currentUserAtom = atomWithStorage<User | null>('ikaros.user', null);

// 5s undo logout — když je nastavený, UI se chová jako logged-out
// (token zůstává v store kdyby user kliknul "Vrátit")
export const pendingLogoutAtom = atom<{ startedAt: number } | null>(null);

// Login modal open/close
export const loginModalOpenAtom = atom<boolean>(false);

export const isAuthenticatedAtom = atom(
  (get) => get(accessTokenAtom) !== null && get(pendingLogoutAtom) === null,
);
