/**
 * 10.2-prep-3 — registry mapových pluginů + resolver.
 *
 * Klíč = `World.system`. Aliasy jsou identické s `diary-systems/registry.ts`
 * (jediná zdrojová pravda pro alias mapping; klienti FE 10.2 budou volat
 * `getMapSystemPlugin(world.system)` namísto bool flagů `isDndWorld` atd.).
 *
 * Spec: docs/takticka-mapa-matrix.md §23.2.
 */
import {
  cocPlugin,
  dnd5ePlugin,
  drd16Plugin,
  drd2Plugin,
  drdhPlugin,
  drdplusPlugin,
  faePlugin,
  fatePlugin,
  genericPlugin,
  gurpsPlugin,
  jadPlugin,
  matrixPlugin,
  piPlugin,
  shadowrunPlugin,
} from './plugins';
import { resolveSystemId } from '@/features/world/systemId';
import type { MapSystemPlugin, SystemId } from './types';

const REGISTRY: Partial<Record<SystemId, MapSystemPlugin>> = {
  generic: genericPlugin,
  matrix: matrixPlugin,
  coc: cocPlugin,
  dnd5e: dnd5ePlugin,
  drd2: drd2Plugin,
  drd16: drd16Plugin,
  drdh: drdhPlugin,
  drdplus: drdplusPlugin,
  fae: faePlugin,
  fate: fatePlugin,
  gurps: gurpsPlugin,
  jad: jadPlugin,
  pi: piPlugin,
  shadowrun: shadowrunPlugin,
};

/**
 * Vrátí plugin pro daný `world.system`. Neznámé / null → `genericPlugin`.
 * Žádný crash, žádné neexistující komponenty.
 *
 * Normalizace (lowercase + aliasy) je sdílená v `@/features/world/systemId`
 * — identická pro diary registry i `COMBAT_PANELS`, jediná zdrojová pravda.
 */
export function getMapSystemPlugin(
  systemId: string | undefined | null,
): MapSystemPlugin {
  const canonical = resolveSystemId(systemId);
  if (canonical && canonical in REGISTRY) {
    return REGISTRY[canonical as SystemId]!;
  }
  return genericPlugin;
}

/** List všech registrovaných systémů (debug / admin). */
export function listMapSystems(): SystemId[] {
  return Object.keys(REGISTRY) as SystemId[];
}
