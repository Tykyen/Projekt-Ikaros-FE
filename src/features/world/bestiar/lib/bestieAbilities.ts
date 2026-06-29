import type { Bestie } from '../types';

export interface BestieAbility {
  label: string;
  value: string;
}

/**
 * Schopnosti bestie — kanonicky v `systemStats.abilities` (per-system schéma,
 * sekce „Schopnosti" v `<system>/bestie.json`, typ `list` {label,value}).
 * Jediný zdroj pravdy pro všechny čtenáře (katalogová karta, spawn na mapu).
 * Dřív existovalo i mrtvé top-level pole `bestie.abilities` — odebráno
 * (D-NEW-BESTIE-ABILITIES-DUP).
 */
export function getBestieAbilities(
  bestie: Pick<Bestie, 'systemStats'>,
): BestieAbility[] {
  const a = bestie.systemStats?.abilities;
  if (!Array.isArray(a)) return [];
  // Robustní coerce: schéma drží {label,value}, ale cross-system / starší
  // snapshoty mívají {name,description} → čteme oba tvary a coerce na string,
  // ať `undefined` label neshodí render konzumentů (`a.label.trim()`).
  return a.map((it) => {
    const raw = it as {
      label?: string;
      value?: string;
      name?: string;
      description?: string;
    };
    return {
      label: raw.label ?? raw.name ?? '',
      value: raw.value ?? raw.description ?? '',
    };
  });
}
