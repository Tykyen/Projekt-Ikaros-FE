/**
 * 10.2c-edit-9b — sjednocená derivace per-token view permission pro
 * `TokenStatbarModal`.
 *
 * 3 módy:
 *   - `pj` — PJ + globální admin. Vidí Staty + Deník + Poznámky tabs,
 *     vše edituje. Bestie: edituje staty + vidí bestie.notes.
 *   - `owner` — hráč na vlastní PC postavu. Vidí Staty + Deník + Poznámky,
 *     edituje vlastní (HP, vlastní deník, vlastní notes).
 *   - `limited` — hráč na cizí token (PC, NPC, Bestie). Vidí jen Staty
 *     read-only s subset polí (jméno, status badge, HP %, zranění).
 *     Žádné tabs.
 *
 * Plán: docs/arch/phase-10/plan-10.2c-edit-9bc.md §3.1.
 */
import type { MapToken } from '../types';

export type TokenViewMode = 'pj' | 'owner' | 'limited';

export function tokenViewMode(
  token: MapToken,
  currentUserId: string | null,
  isPJ: boolean,
  mySlugs: string[],
): TokenViewMode {
  if (isPJ) return 'pj';
  if (!currentUserId) return 'limited';
  // Vlastní PC = token.characterSlug match v mých slug listech (z `useMyCharacterSlugs`)
  if (!token.isNpc && mySlugs.includes(token.characterSlug)) return 'owner';
  return 'limited';
}
