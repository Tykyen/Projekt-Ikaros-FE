/**
 * 10.2f — sdílená HP-tier logika (token HP bar na mapě + border bojovníka
 * v iniciativní liště). Jeden zdroj pravdy, ať se barvy nerozcházejí.
 *
 * Tier barvy převzaty ze starého Matrixu (MapToken.tsx):
 *   green #4CAF50 / yellow #ffb300 / red #d32f2f / dead #555.
 */
import type { SystemEntitySchema } from '../schemas/types';

export const HP_GREEN = 0x4caf50;
export const HP_YELLOW = 0xffb300;
export const HP_RED = 0xd32f2f;
export const HP_DEAD = 0x555555;

export const HP_GREEN_CSS = '#4CAF50';
export const HP_YELLOW_CSS = '#ffb300';
export const HP_RED_CSS = '#d32f2f';
export const HP_DEAD_CSS = '#555555';

/** Najde klíč pole označeného `combatBehavior: 'damageable'`. */
export function findDamageableField(
  schema: SystemEntitySchema | null,
): string | null {
  if (!schema) return null;
  for (const section of schema.sections) {
    for (const field of section.fields) {
      if (field.combatBehavior === 'damageable') return field.key;
    }
  }
  return null;
}

export interface ResolvedHp {
  current: number;
  max: number;
  percent: number;
}

/**
 * Vyřeší current/max HP ze `systemStats` dle schématu. `null` pokud schéma
 * nemá damageable pole nebo chybí hodnota / max ≤ 0.
 */
export function resolveHp(
  schema: SystemEntitySchema | null,
  systemStats: Record<string, unknown>,
): ResolvedHp | null {
  const key = findDamageableField(schema);
  if (!key) return null;
  const current = typeof systemStats[key] === 'number' ? (systemStats[key] as number) : 0;
  const maxKey = key.includes('.current') ? key.replace('.current', '.max') : `${key}.max`;
  const max =
    typeof systemStats[maxKey] === 'number'
      ? (systemStats[maxKey] as number)
      : current > 0
        ? current
        : 10;
  if (max <= 0) return null;
  return { current, max, percent: Math.max(0, Math.min(1, current / max)) };
}

/** Tier barva (PIXI hex) z percentu; `current<=0` → dead. */
export function hpTierHex(percent: number, current: number): number {
  if (current <= 0) return HP_DEAD;
  return percent > 0.6 ? HP_GREEN : percent > 0.3 ? HP_YELLOW : HP_RED;
}

/** Tier barva (CSS string) z percentu; `current<=0` → dead. */
export function hpTierCss(percent: number, current: number): string {
  if (current <= 0) return HP_DEAD_CSS;
  return percent > 0.6 ? HP_GREEN_CSS : percent > 0.3 ? HP_YELLOW_CSS : HP_RED_CSS;
}
