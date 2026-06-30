/**
 * 2.3b — Auto-preset kostek dle herního systému.
 *
 * Mapuje `system` id (z {@link RPG_SYSTEMS}) na doporučenou sadu kostek /
 * mechanik. Hodnoty jsou **chip labely** z {@link DICE} (druhy, ne počty).
 *
 * Viz spec: docs/arch/phase-2/spec-2.3b-dice-presets.md
 */
import type { DiceOption } from './dice';

/**
 * Systémy bez záznamu (např. `vlastni`) preset nemají — výběr se u nich
 * nikdy automaticky nemění.
 */
export const SYSTEM_DICE_PRESETS: Record<string, readonly DiceOption[]> = {
  matrix: ['Fate kostky'],
  dnd5e: ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100 / procenta'],
  jad: ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100 / procenta'],
  drd16: ['d6', 'd6+', 'd10', 'd100 / procenta'],
  'drd-plus': ['d6', '2d6+'],
  drd2: ['d6', '2d6', '3d6'],
  'draci-hlidka': ['d6', 'd6+', 'd10'],
  pi: ['Fate kostky'],
  shadowrun: ['d6', 'Pool d6'],
  gurps: ['d6', '3d6'],
  fae: ['Fate kostky'],
  fate: ['Fate kostky'],
  'call-of-cthulhu': ['d4', 'd6', 'd8', 'd10', 'd20', 'd100 / procenta'],
};

/** Vrátí kopii presetu pro systém (prázdné pole, pokud preset nemá). */
export function getDicePreset(systemId: string): string[] {
  return [...(SYSTEM_DICE_PRESETS[systemId] ?? [])];
}

/** Porovná dvě sady kostek bez ohledu na pořadí. */
function sameSet(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((v) => b.includes(v));
}

/** True, pokud `dice` přesně odpovídá presetu daného systému (a ten existuje). */
export function diceMatchesPreset(systemId: string, dice: string[]): boolean {
  const preset = SYSTEM_DICE_PRESETS[systemId];
  return !!preset && sameSet(dice, preset);
}

/**
 * Smart-replace (spec B2): při změně systému vrátí kostky pro `nextSystem`,
 * ale jen pokud uživatel aktuální výběr ručně neupravil.
 *
 * - `nextSystem` bez presetu (`vlastni`/neznámý) → výběr beze změny.
 * - aktuální výběr je prázdný NEBO odpovídá presetu `prevSystem` → přepiš
 *   presetem `nextSystem`.
 * - jinak (ruční úprava) → výběr beze změny.
 */
export function applySystemChange(
  prevSystem: string,
  nextSystem: string,
  currentDice: string[],
): string[] {
  const nextPreset = SYSTEM_DICE_PRESETS[nextSystem];
  if (!nextPreset) return currentDice;

  const untouched =
    currentDice.length === 0 || diceMatchesPreset(prevSystem, currentDice);
  return untouched ? [...nextPreset] : currentDice;
}
