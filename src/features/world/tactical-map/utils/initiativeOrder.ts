/**
 * 10.2f — řazení bojovníků v iniciativní liště.
 *
 * Stav A (boj neaktivní): tokeny `inCombat` seřazené dle `initiative` desc,
 * tie-break dle jména (cs locale). Stav B používá `combat.order` (snapshot).
 */
import type { MapToken } from '../types';

/** Zobrazované jméno bojovníka (instanceName > characterData.name > '?'). */
export function combatantName(t: MapToken): string {
  return t.instanceName ?? t.characterData?.name ?? '?';
}

/** Seřadí tokeny dle iniciativy sestupně; shoda → dle jména. Nemutuje vstup. */
export function sortByInitiativeDesc(tokens: MapToken[]): MapToken[] {
  return [...tokens].sort((a, b) => {
    const d = (b.initiative ?? 0) - (a.initiative ?? 0);
    if (d !== 0) return d;
    return combatantName(a).localeCompare(combatantName(b), 'cs');
  });
}
