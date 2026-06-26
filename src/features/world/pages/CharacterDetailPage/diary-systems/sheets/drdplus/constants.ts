/**
 * 16.2d — Dračí doupě Plus (DrdPlus) konstanty.
 * Jednotný list, výběr povolání erbem. Bez tabů.
 */

export type DrdPlusProfessionId =
  | 'bojovnik'
  | 'carodej'
  | 'hranicar'
  | 'knez'
  | 'theurg'
  | 'zlodej';

export const DRDPLUS_PROFESSIONS: {
  id: DrdPlusProfessionId;
  label: string;
  /** Iniciála do erbu (blackletter). */
  glyph: string;
  /** Bodový rozpočet zobrazený v hlavičce profese. */
  pointsKey: string;
  pointsLabel: string;
}[] = [
  { id: 'bojovnik', label: 'Bojovník', glyph: 'B', pointsKey: 'w_finty_left', pointsLabel: 'Zbývající finty' },
  { id: 'carodej', label: 'Čaroděj', glyph: 'Č', pointsKey: 'wiz_body', pointsLabel: 'Body kouzel' },
  { id: 'hranicar', label: 'Hraničář', glyph: 'H', pointsKey: 'ran_body', pointsLabel: 'Body' },
  { id: 'knez', label: 'Kněz', glyph: 'K', pointsKey: 'pri_body', pointsLabel: 'Body víry' },
  { id: 'theurg', label: 'Theurg', glyph: 'T', pointsKey: 'the_body', pointsLabel: 'Theurgické body' },
  { id: 'zlodej', label: 'Zloděj', glyph: 'Z', pointsKey: 'thi_profibody', pointsLabel: 'Profibody' },
];

/** 6 hlavních vlastností. */
export const DRDPLUS_STATS = [
  'Síla',
  'Obratnost',
  'Zručnost',
  'Vůle',
  'Inteligence',
  'Charisma',
];

/** 9 odvozených vlastností. */
export const DRDPLUS_DERIVED = [
  'Odolnost',
  'Výdrž',
  'Rychlost',
  'Smysly',
  'Velikost',
  'Hmotnost',
  'Krása',
  'Nebezpečnost',
  'Důstojnost',
];

/** Odvozené vlastnosti se vzorcem (nápověda pod políčkem). */
export const DRDPLUS_DERIVED_FORMULAS: Record<string, string> = {
  Krása: '(Obr+Zrč)/2+Chr',
  Nebezpečnost: '(Síl+Vůle)/2+Chr',
  Důstojnost: '(Int+Vůle)/2+Chr',
};

/** Bojovník archetypy (stupnice 1–10). */
export const WARRIOR_ARCHETYPES = [
  'Rytíř',
  'Šermíř',
  'Gladiátor',
  'Bijec',
  'Barbar',
  'Kondotiér',
];

/** Čaroděj — projevy (sféry magie), stupnice 1–10. */
export const WIZARD_PROJEVY = [
  'Vitální',
  'Mentální',
  'Investigativní',
  'Materiální',
  'Energetická',
  'Časová',
];

/** Knězovy základní schopnosti (stupnice 1–10). */
export const PRIEST_BASIC_ABILITIES = [
  'Empatie',
  'Jasnozřivost',
  'Trans',
  'Exorcismus',
];

/** Kněz — principy (hexagon, protiklady Dobro↔Zlo, Řád↔Chaos, Život↔Smrt). */
export const PRIEST_PRINCIPLES = ['Dobro', 'Řád', 'Smrt', 'Zlo', 'Chaos', 'Život'];
export const PRIEST_PRINCIPLE_BUDGET = 6;

/** Theurgova nakloněnost. */
export const THEURG_INCLINATIONS = ['Denní', 'Měsíční', 'Roční', 'Životní'];

/** Forma kouzla — 4 osy. */
export const FORMA_AXES: { key: string; label: string; options: string[] }[] = [
  { key: 'action', label: 'Působení', options: ['Přímá', 'Nepřímá'] },
  { key: 'shape', label: 'Projev', options: ['Paprsek', 'Plocha', 'Objem'] },
  { key: 'matter', label: 'Hmota', options: ['Hmotná', 'Nehmotná'] },
  { key: 'vis', label: 'Viditelnost', options: ['Viditelná', 'Neviditelná'] },
];

/** Druhy démonů. */
export const DEMON_KINDS = ['Vazbochyt', 'Nižší', 'Vyšší'];
