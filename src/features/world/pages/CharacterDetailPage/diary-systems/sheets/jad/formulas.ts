/**
 * 8.7b — JaD formule. 1:1 D&D 5e logika.
 */

/**
 * Ability modifier = floor((score - 10) / 2).
 * Examples: 10→0, 12→+1, 8→-1, 16→+3.
 */
export function calcMod(score: number): number {
  return Math.floor((score - 10) / 2);
}

/** Formátuje modifier jako `+3` / `-1` / `+0`. */
export function fmtMod(m: number): string {
  return m >= 0 ? `+${m}` : `${m}`;
}

/**
 * Skill modifier = ability_mod + prof multiplier.
 * `prof`: 0 = žádná, 1 = zdatnost (+profBonus), 2 = expertíza (+2×profBonus).
 */
export function calcSkillMod(
  abilityMod: number,
  profLevel: number,
  profBonus: number,
): number {
  if (profLevel === 2) return abilityMod + profBonus * 2;
  if (profLevel === 1) return abilityMod + profBonus;
  return abilityMod;
}

/**
 * Save modifier = ability_mod + (proficient ? profBonus : 0).
 */
export function calcSaveMod(
  abilityMod: number,
  isProficient: boolean,
  profBonus: number,
): number {
  return abilityMod + (isProficient ? profBonus : 0);
}
