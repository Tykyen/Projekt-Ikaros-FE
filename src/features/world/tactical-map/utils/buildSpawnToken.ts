/**
 * 10.2c-edit-9a — token factory pro spawn z palety.
 *
 * Extrahuje duplicitní stavbu `MapToken` z PcPalette/NpcCharacterPalette/
 * BestiePalette (3× stejný 14+ field setup). Konzument předá `q, r` z
 * placement-mode / drop handleru.
 *
 * Pending ID: `_pending_<ts>_<prefix>` — BE při `token.add` přepíše UUID-em.
 *
 * Plán: docs/arch/phase-10/plan-10.2c-edit-9a.md §3.3.
 */
import type { MapToken } from '../types';
import type { SpawnPayload } from './spawnPayload';
import type { Bestie } from '@/features/world/bestiar/types';

function pendingId(prefix: string): string {
  // Náhodný suffix proti kolizi ID: multi-placement bestií ve stejné
  // milisekundě by jinak dal dvěma tokenům stejné `_pending_<ts>_<id>` →
  // BE token.add je `$push` bez přidělení UUID → sdílené id → token.update
  // by zasáhl/překreslil oba (vypadalo to jako „propisování" mezi duplikáty).
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `_pending_${Date.now()}_${rand}_${prefix}`;
}

/**
 * 10.2c-edit-6: fixed fields (`currentHp`, `armor`, ...) musí být 0 a
 * `systemStats` se NEPOSÍLÁ (chybějící klíč, ne `{}`). BE `validateForCreate`
 * soft-skip reaguje na chybějící klíč.
 */
const FIXED_DEFAULTS = {
  currentHp: 0,
  maxHp: 0,
  baseHp: 0,
  armor: 0,
  baseArmor: 0,
  injury: 0,
  initiative: 0,
  initiativeBase: 0,
  inCombat: false,
  movement: 5,
  abilities: [] as MapToken['abilities'],
  customData: {} as Record<string, unknown>,
};

export function buildPcToken(
  payload: Extract<SpawnPayload, { kind: 'pc' }>,
  q: number,
  r: number,
): MapToken {
  return {
    id: pendingId(payload.characterSlug),
    characterSlug: payload.characterSlug,
    characterId: payload.characterId,
    isNpc: false,
    q,
    r,
    instanceName: payload.name,
    ...FIXED_DEFAULTS,
  } as MapToken;
}

export function buildNpcToken(
  payload: Extract<SpawnPayload, { kind: 'npc' }>,
  q: number,
  r: number,
): MapToken {
  return {
    id: pendingId(payload.characterSlug),
    characterSlug: payload.characterSlug,
    characterId: payload.characterId,
    isNpc: true,
    q,
    r,
    instanceName: payload.name,
    ...FIXED_DEFAULTS,
  } as MapToken;
}

/**
 * Bestie token drží **snapshot** stats z bestie šablony (project-bestiar-design
 * memory): šablona nezávislá od instance, edit instance neprosakuje zpět.
 */
export function buildBestieToken(
  bestie: Bestie,
  q: number,
  r: number,
): MapToken {
  const hp = (bestie.systemStats['health.max'] as number) ?? 10;
  const armor = (bestie.systemStats.armor as number) ?? 0;
  const injury = (bestie.systemStats.injury as number) ?? 0;
  const initBase = (bestie.systemStats['initiative.base'] as number) ?? 0;
  const movement = (bestie.systemStats.movement as number) ?? 5;
  return {
    id: pendingId(bestie.id),
    isNpc: true,
    templateId: bestie.id,
    characterId: `bestie:${bestie.id}`,
    characterSlug: bestie.id,
    q,
    r,
    instanceName: bestie.name,
    // Seed `health.current` = `health.max` (bestie schema definuje jen max).
    // Bez toho zůstane HP pole v token panelu nenaplněné → nesedí MAX a damage
    // (combatBehavior `damageable` visí na health.current) nemá co snižovat.
    systemStats: { ...bestie.systemStats, 'health.current': hp },
    currentHp: hp,
    maxHp: hp,
    baseHp: hp,
    armor,
    baseArmor: armor,
    injury,
    initiative: initBase,
    initiativeBase: initBase,
    inCombat: false,
    movement,
    abilities: bestie.abilities.map((a) => ({
      name: a.label,
      description: a.value,
    })),
    // Instanční poznámky = snapshot šablony; dál editovatelné nezávisle.
    notes: bestie.notes,
    customData: {},
  } as MapToken;
}
