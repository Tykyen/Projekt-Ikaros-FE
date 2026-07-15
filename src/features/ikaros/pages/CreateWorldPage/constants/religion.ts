/**
 * 2.3g — Role náboženství (škála 0–14) + typy náboženství pro sekci Náboženství
 * ve formu tvorby světa. Volby se při založení vypíšou na stránku Náboženství.
 *
 * ⚠️ Názvy jsou duplikované s BE (`religion-template.ts`) — cross-repo import
 * nelze. Při změně uprav obě místa. Popisy úrovní (`core`) drží jen BE.
 *
 * Viz spec: docs/arch/phase-2/spec-2.3g-religion-seed.md
 */

export interface ReligionLevelOption {
  level: number;
  name: string;
}

/** Škála role a přítomnosti božského (0–14) pro single select ve formu. */
export const RELIGION_LEVELS: ReligionLevelOption[] = [
  { level: 0, name: 'Bez náboženství / militantní ateismus' },
  { level: 1, name: 'Sekulární' },
  { level: 2, name: 'Pověra a folklor' },
  { level: 3, name: 'Animismus / kult předků' },
  { level: 4, name: 'Lidový polyteismus' },
  { level: 5, name: 'Městské / státní kulty' },
  { level: 6, name: 'Organizovaná církev' },
  { level: 7, name: 'Mocná církev' },
  { level: 8, name: 'Státní náboženství' },
  { level: 9, name: 'Teokratické prvky' },
  { level: 10, name: 'Teokracie' },
  { level: 11, name: 'Prokázané zázraky' },
  { level: 12, name: 'Přítomní poslové' },
  { level: 13, name: 'Chodící bohové' },
  { level: 14, name: 'Živá božská realita' },
];

/** Výchozí role nového světa — organizovaná církev (typické fantasy). */
export const DEFAULT_RELIGION_INFLUENCE = 6;

/** Typy náboženství (zatrhávací chipy ve formu tvorby). */
export const RELIGION_TYPES = [
  'Monoteismus',
  'Polyteismus',
  'Henoteismus',
  'Dualismus',
  'Panteismus',
  'Animismus',
  'Kult předků',
  'Kult přírody',
  'Šamanismus',
  'Mystika',
  'Kult smrti',
  'Vládní / císařský kult',
  'Non-teismus (filozofie)',
  'Temné kulty',
] as const;

/** Krátké popisky typů (native tooltip přes `title` na chipech). */
export const RELIGION_TYPE_DESCRIPTIONS: Record<string, string> = {
  Monoteismus: 'Jeden nejvyšší bůh, výlučné uctívání.',
  Polyteismus: 'Panteon mnoha bohů s doménami.',
  Henoteismus: 'Uctívá se jeden, existenci dalších se nepopírá.',
  Dualismus: 'Dva protikladné principy — světlo × tma, řád × chaos.',
  Panteismus: 'Božské je svět a příroda sama.',
  Animismus: 'Duchové v přírodě, věcech a místech.',
  'Kult předků': 'Uctívání zemřelých předků a rodu.',
  'Kult přírody': 'Posvátné háje, živly, roční cyklus.',
  Šamanismus: 'Prostředníci komunikují s duchy v transu.',
  Mystika: 'Osobní splynutí s božstvím, tajné poznání.',
  'Kult smrti': 'Bohové smrti, posmrtný život, pohřební kulty.',
  'Vládní / císařský kult': 'Zbožštěný panovník nebo stát.',
  'Non-teismus (filozofie)': 'Etický či duchovní systém bez bohů.',
  'Temné kulty': 'Pakty, oběti, zakázaná božstva a démoni.',
};
