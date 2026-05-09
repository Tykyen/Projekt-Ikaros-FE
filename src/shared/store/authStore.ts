import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import type { User } from '@/shared/types';

export const accessTokenAtom = atomWithStorage<string | null>('ikaros.jwt', null);
export const refreshTokenAtom = atomWithStorage<string | null>('ikaros.rt', null);
export const currentUserAtom = atomWithStorage<User | null>('ikaros.user', null);

// 5s undo logout — když je nastavený, UI se chová jako logged-out
// (token zůstává v store kdyby user kliknul "Vrátit")
export const pendingLogoutAtom = atom<{ startedAt: number } | null>(null);

// Login / Register modal open/close — vždy max jeden otevřený
export const loginModalOpenAtom = atom<boolean>(false);
export const registerModalOpenAtom = atom<boolean>(false);

// Write-only akce: zaručí, že druhý modal je zavřený (cross-link mezi modaly)
export const openLoginModalAtom = atom(null, (_get, set) => {
  set(registerModalOpenAtom, false);
  set(loginModalOpenAtom, true);
});
export const openRegisterModalAtom = atom(null, (_get, set) => {
  set(loginModalOpenAtom, false);
  set(registerModalOpenAtom, true);
});

export const isAuthenticatedAtom = atom(
  (get) => get(accessTokenAtom) !== null && get(pendingLogoutAtom) === null,
);
