/**
 * 8.7f — Dračí doupě Plus (DrdPlus) konstanty.
 * 1:1 přenos z `c:/Matrix/Matrix/frontend/src/components/diary/DrdPlusCharacterSheet.tsx`.
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
}[] = [
  { id: 'bojovnik', label: 'Bojovník' },
  { id: 'carodej', label: 'Čaroděj' },
  { id: 'hranicar', label: 'Hraničář' },
  { id: 'knez', label: 'Kněz' },
  { id: 'theurg', label: 'Theurg' },
  { id: 'zlodej', label: 'Zloděj' },
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

/** Tab IDs. */
export type DrdPlusTab = 'postava' | 'boj' | 'cesty' | 'profese';

export const DRDPLUS_TABS: { id: DrdPlusTab; label: string }[] = [
  { id: 'postava', label: '1. Postava' },
  { id: 'boj', label: '2. Boj' },
  { id: 'cesty', label: '3. Na Cesty' },
  { id: 'profese', label: '4. Profese' },
];

/** Bojovník archetypy. */
export const WARRIOR_ARCHETYPES = [
  'Rytíř',
  'Šermíř',
  'Gladiátor',
  'Bijec',
  'Barbar',
  'Kondotiér',
];

/** Knězovy základní schopnosti. */
export const PRIEST_BASIC_ABILITIES = [
  'Empatie',
  'Jasnozřivost',
  'Trans',
  'Exorcismus',
];

/** Theurgova nakloněnost. */
export const THEURG_INCLINATIONS = ['Denní', 'Měsíční', 'Roční', 'Životní'];
