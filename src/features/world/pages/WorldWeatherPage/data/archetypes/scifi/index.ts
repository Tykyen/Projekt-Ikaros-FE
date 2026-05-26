import type { ArchetypePreset } from '../types';
import { PLANETARY_PRESETS } from './planetary';
import { EXOPLANETARY_PRESETS } from './exoplanetary';
import { CYBERPUNK_PRESETS } from './cyberpunk';
import { STATION_PRESETS } from './stations';
import { SHIP_INTERIOR_PRESETS } from './ship-interiors';
import { SHIP_TYPE_PRESETS } from './ship-types';
import { EVA_PRESETS } from './eva';

/**
 * 9.4-III — Sci-fi & vesmír archetype catalog (45 presetů).
 *
 * Sloučení 7 kategorií:
 * - planetary (11): reálná planetární tělesa (NASA/JPL/ESA MEASURED)
 * - exoplanetary (5): teoretické exoplanety (DOCUMENTED / INFERRED)
 * - cyberpunk (4): urbánní dystopie (DOCUMENTED Delhi, ANALOGY ostatní)
 * - stations (5): vesmírné stanice (MEASURED ISS/Mir/Skylab, DOCUMENTED O'Neill)
 * - ship-interiors (10): per-room lodní prostředí (NASA-STD-3001)
 * - ship-types (6): typy lodí (DOCUMENTED / ANALOGY)
 * - eva (4): exteriérové výstupy (MEASURED Apollo/ISS, DOCUMENTED Mars/asteroid)
 *
 * EVA presety drží monthlyTemps okolo 22°C protože pro variance model je
 * rozhodující mikroklima skafandru (co PJ cítí), ne -150°C exteriér.
 */
export const SCIFI_ARCHETYPES: readonly ArchetypePreset[] = [
  ...PLANETARY_PRESETS,
  ...EXOPLANETARY_PRESETS,
  ...CYBERPUNK_PRESETS,
  ...STATION_PRESETS,
  ...SHIP_INTERIOR_PRESETS,
  ...SHIP_TYPE_PRESETS,
  ...EVA_PRESETS,
] as const;

export {
  PLANETARY_PRESETS,
  EXOPLANETARY_PRESETS,
  CYBERPUNK_PRESETS,
  STATION_PRESETS,
  SHIP_INTERIOR_PRESETS,
  SHIP_TYPE_PRESETS,
  EVA_PRESETS,
};
