import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import type { User } from '../types';

export const accessTokenAtom = atomWithStorage<string | null>('ikaros.jwt', null);
export const refreshTokenAtom = atomWithStorage<string | null>('ikaros.rt', null);
export const currentUserAtom = atom<User | null>(null);

export const isAuthenticatedAtom = atom((get) => get(accessTokenAtom) !== null);
