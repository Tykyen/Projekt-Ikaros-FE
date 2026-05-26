import { KOPPEN_ARCHETYPES } from './koppen';
import { SEA_ARCHETYPES } from './seas';
import { FANTASY_ARCHETYPES } from './fantasy';
import { SCIFI_ARCHETYPES } from './scifi';

/**
 * Archetype catalog — all categories.
 *
 * Slouží jako one-click přednastavení v wizardu pro tvorbu generátoru počasí.
 *
 * 9.4-I: koppen (16) + sea (6) = 22
 * 9.4-II: + fantasy (53)  = 75
 * 9.4-III: + scifi (45)   = 120 archetypů celkem
 *
 * Plus real-world katalog (~810 zemí + měst) + 7 extrémů = ~937 presetů.
 */
export const ARCHETYPE_CATALOG = {
  koppen: KOPPEN_ARCHETYPES,
  sea: SEA_ARCHETYPES,
  fantasy: FANTASY_ARCHETYPES,
  scifi: SCIFI_ARCHETYPES,
} as const;

export type { ArchetypePreset } from './types';
export { KOPPEN_ARCHETYPES } from './koppen';
export { SEA_ARCHETYPES } from './seas';
export { FANTASY_ARCHETYPES } from './fantasy';
export { SCIFI_ARCHETYPES } from './scifi';
