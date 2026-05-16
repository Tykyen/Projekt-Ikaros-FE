import { atom } from 'jotai';
import type { RoomKey } from '../lib/types';

/**
 * Místnosti, kde je uživatel aktuálně přihlášený (multi-room, 4.2d §1/§6).
 * Klientský stav — joinRoom přidá, explicitní leave odebere. Slouží navigaci
 * k zobrazení „×" (odejít) u místností, kde uživatel je.
 */
export const myRoomsAtom = atom<Set<RoomKey>>(new Set<RoomKey>());
