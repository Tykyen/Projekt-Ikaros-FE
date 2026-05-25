/**
 * Krok 6.3b — Textová reprezentace hodu pro `ChatMessage.content`.
 *
 * Drží shape, který BE regex `/^(🎲\s*HOD\s+FATE:|Hod\s+Kostkou)/i`
 * rozpozná jako fallback (primární signál je `dicePayload`, ale text se
 * zobrazí v notifikacích / push / hledání).
 */

import { getOverpressureFromRollTotal } from './rollEngine';
import type { FateRollResult, GenericRollResult } from './rollEngine';

/** Formát Fate hodu — zachovává shape ze starého Matrixu. */
export function formatFateMessage(
  label: string | null,
  modifier: number | null,
  roll: FateRollResult,
): string {
  const total = roll.sum + (modifier || 0);
  const totalStr = total >= 0 ? `+${total}` : `${total}`;

  let result: string;
  if (label) {
    const modValue = modifier || 0;
    const signedMod = modValue >= 0 ? `+${modValue}` : `${modValue}`;
    const subtotalSign = roll.sum >= 0 ? '+' : '-';
    const subtotalAbs = Math.abs(roll.sum);
    result = `Hod Kostkou: ${roll.symbols} = ${label} (${signedMod}) ${subtotalSign} ${subtotalAbs} = ${totalStr}`;
  } else {
    result = `Hod Kostkou: ${roll.symbols} = ${totalStr}`;
  }

  const overpressure = getOverpressureFromRollTotal(total);
  if (overpressure !== null) {
    result += `\nPřetlak: +${overpressure}`;
  }

  return result;
}

/** Formát generic hodu (d20, pool, mixed, d100). */
export function formatGenericDiceMessage(
  label: string | null,
  modifier: number | null,
  roll: GenericRollResult,
): string {
  if (roll.type === 'fate') {
    return formatFateMessage(label, modifier, {
      rolls: roll.rolls as never,
      sum: roll.sum,
      symbols: roll.symbols,
    });
  }

  const total = roll.sum + (modifier || 0);
  const totalStr = total >= 0 ? `+${total}` : `${total}`;

  if (roll.type === 'mixed') {
    if (label) {
      const modValue = modifier || 0;
      const signedMod = modValue >= 0 ? `+${modValue}` : `${modValue}`;
      const subtotalSign = roll.sum >= 0 ? '+' : '-';
      const subtotalAbs = Math.abs(roll.sum);
      return `Hod Kostkou (Mix): ${roll.symbols} = ${label} (${signedMod}) ${subtotalSign} ${subtotalAbs} = ${totalStr}`;
    }
    return `Hod Kostkou (Mix): ${roll.symbols} = ${totalStr}`;
  }

  if (roll.type === 'd100' || roll.type === 'k100') {
    const tens = roll.rolls[0] === 0 ? '00' : roll.rolls[0];
    const ones = roll.rolls[1];
    if (label) {
      const modValue = modifier || 0;
      const signedMod = modValue >= 0 ? `+${modValue}` : `${modValue}`;
      return `Hod Kostkou (${roll.type}): ${label} (${signedMod})\nDesítky: ${tens}\nJednotky: ${ones}\nVýsledek: ${totalStr}`;
    }
    return `Hod Kostkou (${roll.type}):\nDesítky: ${tens}\nJednotky: ${ones}\nVýsledek: ${totalStr}`;
  }

  if (label) {
    const modValue = modifier || 0;
    const signedMod = modValue >= 0 ? `+${modValue}` : `${modValue}`;
    const subtotalSign = roll.sum >= 0 ? '+' : '-';
    const subtotalAbs = Math.abs(roll.sum);
    return `Hod Kostkou (${roll.type}): ${roll.symbols} = ${label} (${signedMod}) ${subtotalSign} ${subtotalAbs} = ${totalStr}`;
  }
  return `Hod Kostkou (${roll.type}): ${roll.symbols} = ${totalStr}`;
}

/**
 * Detekce v textu — kompatibilní se starým Matrixem (`🎲 HOD FATE:`)
 * i s novým formátem (`Hod Kostkou`).
 */
export function isDiceMessage(content?: string | null): boolean {
  if (!content) return false;
  const trimmed = content.trim();
  return (
    trimmed.startsWith('🎲 HOD FATE:') || trimmed.startsWith('Hod Kostkou')
  );
}
