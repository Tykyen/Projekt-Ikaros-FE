import type { ArchetypePreset } from '../types';
import { LITERARY_PRESETS } from './literary';
import { MYTHOLOGICAL_PRESETS } from './mythological';
import { PREHISTORIC_PRESETS } from './prehistoric';
import { STEAMPUNK_PRESETS } from './steampunk';
import { HORROR_PRESETS } from './horror';
import { AERIAL_PRESETS } from './aerial';
import { MAGICAL_PRESETS } from './magical';

/**
 * 9.4-II — Fantasy & Mytologie presety (53 archetypů).
 *
 * Slučuje 7 sub-souborů:
 *   - literary (28) — Středozem, Westeros/Essos, Faerůn, Witcher, Tamriel
 *   - mythological (6) — Olymp, Asgard, Helheim, Hádes, Duat, Avalon
 *   - prehistoric (4) — křída, doba ledová, karbon, perm
 *   - steampunk (3) — viktoriánský smog/industrial/plynové ulice
 *   - horror (4) — Lovecraft mythos
 *   - aerial (3) — vzdušné a stratosférické
 *   - magical (5) — bioluminiscentní + FICTIONAL fantasy
 */
export const FANTASY_ARCHETYPES: readonly ArchetypePreset[] = [
  ...LITERARY_PRESETS,
  ...MYTHOLOGICAL_PRESETS,
  ...PREHISTORIC_PRESETS,
  ...STEAMPUNK_PRESETS,
  ...HORROR_PRESETS,
  ...AERIAL_PRESETS,
  ...MAGICAL_PRESETS,
] as const;

export {
  LITERARY_PRESETS,
  MYTHOLOGICAL_PRESETS,
  PREHISTORIC_PRESETS,
  STEAMPUNK_PRESETS,
  HORROR_PRESETS,
  AERIAL_PRESETS,
  MAGICAL_PRESETS,
};
