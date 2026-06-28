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

/** Podporované kostky pro skládaný hod zásahu (8.7q). */
const DMG_DICE = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'];

/**
 * 8.7q — naparsuje formuli zásahu `"2k10 + 2k6 + 2k4 + 5"` (akceptuje `k` i `d`,
 * mezery, znaménka) na počty kostek + číselný modifikátor. Vrátí `null`, pokud
 * z řetězce nic rozpoznatelného nevzejde (prázdné / nesmysl).
 *
 * Příklad: `"2k10+2k6+2k4+5"` → `{ mixed: { d10: 2, d6: 2, d4: 2 }, modifier: 5 }`.
 */
export function parseDamageFormula(
  input: string,
): { mixed: Record<string, number>; modifier: number } | null {
  if (!input) return null;
  const cleaned = input.toLowerCase().replace(/\s+/g, '');
  const parts = cleaned.match(/[+-]?[^+-]+/g);
  if (!parts) return null;
  const mixed: Record<string, number> = {};
  let modifier = 0;
  let any = false;
  for (const part of parts) {
    const sign = part.startsWith('-') ? -1 : 1;
    const body = part.replace(/^[+-]/, '');
    const dice = body.match(/^(\d*)[dk](\d+)$/);
    if (dice) {
      const count = dice[1] ? parseInt(dice[1], 10) : 1;
      const key = `d${dice[2]}`;
      if (DMG_DICE.includes(key) && count > 0) {
        mixed[key] = (mixed[key] ?? 0) + count;
        any = true;
      }
    } else {
      const num = parseInt(body, 10);
      if (Number.isFinite(num)) {
        modifier += num * sign;
        any = true;
      }
    }
  }
  return any ? { mixed, modifier } : null;
}
