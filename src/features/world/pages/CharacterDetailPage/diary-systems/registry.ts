/**
 * 8.7a — Registry diary system presetů.
 *
 * Klíč = `World.system` (string, volný). Pokud value v registry chybí,
 * `getDiaryPreset` vrací `generic` preset (fallback bez crashe).
 *
 * Přidání nového systému: vytvoř `presets/<id>.ts` + `styles/<id>.css`
 * + `sheets/<id>/...`, importuj a zaregistruj zde. Aktualizuj i
 * `SYSTEM_IDS` v `types.ts`.
 */
import { cocPreset } from './presets/coc';
import { dnd5ePreset } from './presets/dnd5e';
import { drd2Preset } from './presets/drd2';
import { drd16Preset } from './presets/drd16';
import { drdhPreset } from './presets/drdh';
import { drdplusPreset } from './presets/drdplus';
import { fatePreset } from './presets/fate';
import { genericPreset } from './presets/generic';
import { gurpsPreset } from './presets/gurps';
import { jadPreset } from './presets/jad';
import { matrixPreset } from './presets/matrix';
import { piPreset } from './presets/pi';
import { shadowrunPreset } from './presets/shadowrun';
import type { DiarySystemPreset, SystemId } from './types';

const REGISTRY: Partial<Record<SystemId, DiarySystemPreset>> = {
  generic: genericPreset,
  matrix: matrixPreset,
  coc: cocPreset,
  dnd5e: dnd5ePreset,
  drd2: drd2Preset,
  drd16: drd16Preset,
  drdh: drdhPreset,
  drdplus: drdplusPreset,
  fate: fatePreset,
  gurps: gurpsPreset,
  jad: jadPreset,
  pi: piPreset,
  shadowrun: shadowrunPreset,
};

/**
 * Aliasy pro `world.system` — některé legacy hodnoty z Matrix/Matrix
 * mapují na canonical ID. Aplikuje se v `getDiaryPreset` před lookup.
 */
const SYSTEM_ALIASES: Record<string, SystemId> = {
  // legacy DnD ID
  dnd: 'dnd5e',
  // legacy PI hodnoty z `world.system`
  pribehy: 'pi',
  pribehy_imperia: 'pi',
  'pribehy-imperia': 'pi',
  // 16.2a — nabídka (RPG_SYSTEMS) ukládá do `world.system` „dlouhá" id,
  // engine je zná krátce. Bez těchto aliasů svět spadne na generic sheet.
  'draci-hlidka': 'drdh',
  'drd-plus': 'drdplus',
  'call-of-cthulhu': 'coc',
};

/**
 * Vrátí preset pro daný `world.system`. Pokud systém není znám
 * (prázdný, neexistující ID, libovolný PJ-zadaný string), vrací
 * `generic` preset — žádný crash, žádný shadow.
 */
export function getDiaryPreset(
  systemId: string | undefined | null,
): DiarySystemPreset {
  if (!systemId) return genericPreset;
  const normalized = systemId.toLowerCase();
  // Alias rezolve (legacy `dnd` → `dnd5e`, `pribehy_imperia` → `pi`, …)
  const canonical = SYSTEM_ALIASES[normalized] ?? normalized;
  if (canonical in REGISTRY) {
    return REGISTRY[canonical as SystemId]!;
  }
  return genericPreset;
}

/** Vrátí ID všech zaregistrovaných presetů. Pro debug/admin UI. */
export function listKnownSystems(): SystemId[] {
  return Object.keys(REGISTRY) as SystemId[];
}

/** True, pokud daný systém má dedikovaný sheet (ne jen styles). */
export function hasDedicatedSheet(
  systemId: string | undefined | null,
): boolean {
  return Boolean(getDiaryPreset(systemId).SystemSheet);
}
