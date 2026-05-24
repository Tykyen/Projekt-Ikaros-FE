/**
 * 8.7l — Dračí doupě 1.6 (Drd16) konstanty.
 * 1:1 z `c:/Matrix/Matrix/frontend/src/components/diary/Drd16CharacterSheet.tsx`.
 */

/** 7 primárních vlastností Drd 1.6. */
export const DRD16_PRIMARY_STATS = [
  { key: 'str', label: 'Síla' },
  { key: 'dex', label: 'Obratnost' },
  { key: 'con', label: 'Odolnost' },
  { key: 'int', label: 'Inteligence' },
  { key: 'cha', label: 'Charisma' },
  { key: 'siz', label: 'Velikost' },
  { key: 'mov', label: 'Pohyb' },
];

/** Sekundární vlastnosti. */
export const DRD16_SECONDARY_STATS = [
  { key: 'per', label: 'Postřeh' },
  { key: 'obj', label: 'Objevení obj.' },
  { key: 'mec', label: 'Objev. mech.' },
  { key: 'rnd', label: 'Rovnov. nadání' },
  { key: 'sea', label: 'Hledání' },
];

/** Povolání Drd 1.6 (rodiny). */
export const DRD16_CLASSES = [
  'Bojovník',
  'Šermíř',
  'Válečník',
  'Hraničář',
  'Druid',
  'Chodec',
  'Zloděj',
  'Lupič',
  'Sicco',
  'Kouzelník',
  'Mág',
  'Čaroděj',
  'Alchymista',
  'Theurg',
  'Pyrofor',
];

/**
 * Bonus z vlastnosti dle Drd 1.6 pravidel.
 * val ≤ 0 → -5; <10 → floor((val-10)/2); 10-12 → 0; ≥13 → floor((val-11)/2).
 */
export function getDrdBonus(val: number): number {
  if (val <= 0) return -5;
  if (val < 10) return Math.floor((val - 10) / 2);
  if (val >= 10 && val <= 12) return 0;
  return Math.floor((val - 11) / 2);
}

/** Stupně zvládnutí dovedností. */
export const DRD16_SKILL_LEVELS = [
  'Velmi špatně',
  'Špatně',
  'Průměrně',
  'Dobře',
  'Velmi dobře',
  'Dokonale',
];

export interface Drd16Weapon {
  weapon: string;
  where: string;
  uc: string;
  utoc: string;
  oz: string;
}

export interface Drd16RangedWeapon {
  weapon: string;
  uc: string;
  utoc: string;
  small: string;
  medium: string;
  large: string;
}

export interface Drd16Skill {
  name: string;
  level: string;
}
