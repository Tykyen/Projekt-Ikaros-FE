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
  return Array.isArray(a) ? (a as BestieAbility[]) : [];
}
