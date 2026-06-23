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
  fatePlugin,
  genericPlugin,
  gurpsPlugin,
  jadPlugin,
  matrixPlugin,
  piPlugin,
  shadowrunPlugin,
} from './plugins';
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
  fate: fatePlugin,
  gurps: gurpsPlugin,
  jad: jadPlugin,
  pi: piPlugin,
  shadowrun: shadowrunPlugin,
};

/**
 * Aliasy pro `world.system` — identické s diary-systems pro konzistenci.
 *
 * Když PJ vytvoří svět s legacy `system: 'pribehy_imperia'`, oba registry
 * (diary + map) resolvují na canonical `pi`.
 */
const SYSTEM_ALIASES: Record<string, SystemId> = {
  dnd: 'dnd5e',
  pribehy: 'pi',
  pribehy_imperia: 'pi',
  'pribehy-imperia': 'pi',
  // 16.2a — viz diary-systems/registry.ts: nabídka ukládá „dlouhá" id
  // (draci-hlidka/drd-plus/call-of-cthulhu), engine zná krátká.
  'draci-hlidka': 'drdh',
  'drd-plus': 'drdplus',
  'call-of-cthulhu': 'coc',
};

/**
 * Vrátí plugin pro daný `world.system`. Neznámé / null → `genericPlugin`.
 * Žádný crash, žádné neexistující komponenty.
 */
export function getMapSystemPlugin(
  systemId: string | undefined | null,
): MapSystemPlugin {
  if (!systemId) return genericPlugin;
  const normalized = systemId.toLowerCase();
  const canonical = SYSTEM_ALIASES[normalized] ?? normalized;
  if (canonical in REGISTRY) {
    return REGISTRY[canonical as SystemId]!;
  }
  return genericPlugin;
}

/** List všech registrovaných systémů (debug / admin). */
export function listMapSystems(): SystemId[] {
  return Object.keys(REGISTRY) as SystemId[];
}
