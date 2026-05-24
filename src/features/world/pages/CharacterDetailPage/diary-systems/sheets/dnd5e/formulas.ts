/**
 * 8.7d — D&D 5e formule. Sdílí semantiku s JaD (D&D-derived).
 * Drženo lokálně, aby DnD a JaD mohly nezávisle evolvovat.
 */

/**
 * Ability modifier = floor((score - 10) / 2).
 * Examples: 10→0, 14→+2, 8→-1, 18→+4.
 */
export function abilityMod(score: number): number {
  return Math.floor((score - 10) / 2);
}

/** Formátuje modifier jako `+3` / `-1` / `+0`. */
export function fmtMod(m: number): string {
  return m >= 0 ? `+${m}` : `${m}`;
}

/**
 * Skill modifier:
 * - prof 0 (žádná) = base
 * - prof 1 (zdatnost) = base + profBonus
 * - prof 2 (expertíza) = base + profBonus × 2
 */
export function calcSkillMod(
  abilityModifier: number,
  profLevel: number,
  profBonus: number,
): number {
  if (profLevel === 2) return abilityModifier + profBonus * 2;
  if (profLevel === 1) return abilityModifier + profBonus;
  return abilityModifier;
}

/** Save modifier = ability_mod + (proficient ? profBonus : 0). */
export function calcSaveMod(
  abilityModifier: number,
  isProficient: boolean,
  profBonus: number,
): number {
  return abilityModifier + (isProficient ? profBonus : 0);
}
