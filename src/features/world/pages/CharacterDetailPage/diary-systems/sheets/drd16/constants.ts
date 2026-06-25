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

/** Povolání Drd 1.6 (plochý seznam — BC, ponecháno). */
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
 * 16.2b — 5 základních rodin povolání. Od 6. úrovně se každá štěpí na 2
 * specializace (`DRD16_SPECIALIZATIONS`). Base select nabízí jen tyto.
 */
export const DRD16_CLASS_FAMILIES = [
  'Válečník',
  'Hraničář',
  'Zloděj',
  'Alchymista',
  'Kouzelník',
] as const;

/** Rozdělení rodiny na 2 specializace (odemčeno od `DRD16_SPEC_UNLOCK_LEVEL`). */
export const DRD16_SPECIALIZATIONS: Record<string, readonly [string, string]> = {
  Válečník: ['Bojovník', 'Šermíř'],
  Hraničář: ['Chodec', 'Druid'],
  Zloděj: ['Lupič', 'Sicco'],
  Alchymista: ['Pyrofor', 'Theurg'],
  Kouzelník: ['Čaroděj', 'Mág'],
};

/** Úroveň, od které se odemyká výběr specializace. */
export const DRD16_SPEC_UNLOCK_LEVEL = 6;

/**
 * Soft-cap primární vlastnosti hráče (PC). Nad ní červené varování, ale
 * NEblokuje (přechodný buff je v pořádku). NPC strop nemá — bonus
 * extrapoluje stejnou formulí (`getDrdBonus`).
 */
export const DRD16_PC_STAT_CAP = 21;

/**
 * 5 „háznových" vlastností se zlatým auto-bonusem (`getDrdBonus`).
 * Velikost (písmeno) a Pohyblivost (čísla bez bonusu) stojí mimo.
 */
export const DRD16_HAZ_STATS = [
  { key: 'str', label: 'Síla' },
  { key: 'dex', label: 'Obratnost' },
  { key: 'con', label: 'Odolnost' },
  { key: 'int', label: 'Inteligence' },
  { key: 'cha', label: 'Charisma' },
] as const;

/** Pohyblivost při naložení (reuse `enc_*` klíčů, nová sémantika). */
export const DRD16_LOAD_ROWS = [
  { key: 'enc_light', label: 'Mírné naložení' },
  { key: 'enc_med', label: 'Střední naložení' },
  { key: 'enc_heavy', label: 'Velké naložení' },
] as const;

/** Zbroj / štít — řádek tabulky u OČ. */
export interface Drd16Armor {
  name: string;
  oc: string;
  note: string;
}

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

/**
 * 16.2b-mapa — strukturovaná karta kouzla (spellbook). Vše string, bez
 * parsování (magenergie je proměnlivá: „3 + za další 2"). Editor sdílený
 * mezi listem (`Drd16Sheet`) a oknem „Kouzla" v combat panelu na mapě;
 * jediný zdroj = `customData.spells` (změna typu textarea→JSON, v drd16
 * denících zatím žádná data → bez migrace).
 */
export interface Drd16Spell {
  name: string;
  incantation: string;
  mana: string;
  trap: string;
  range: string;
  scope: string;
  casting: string;
  duration: string;
  domain: string;
  description: string;
}

export const DRD16_EMPTY_SPELL: Drd16Spell = {
  name: '',
  incantation: '',
  mana: '',
  trap: '',
  range: '',
  scope: '',
  casting: '',
  duration: '',
  domain: '',
  description: '',
};

/** Popisky polí karty kouzla (pořadí = pořadí v gridu). */
export const DRD16_SPELL_FIELDS: ReadonlyArray<{
  key: keyof Drd16Spell;
  label: string;
}> = [
  { key: 'mana', label: 'Magenergie' },
  { key: 'trap', label: 'Past' },
  { key: 'range', label: 'Dosah' },
  { key: 'scope', label: 'Rozsah' },
  { key: 'casting', label: 'Vyvolání' },
  { key: 'duration', label: 'Trvání' },
];
