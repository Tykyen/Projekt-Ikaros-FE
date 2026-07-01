/**
 * GURPS 4E — konstanty deníku.
 *
 * Data v `diary.customData` s prefixem `gurps_*`. 4. edice: 4 hlavní atributy
 * (ST/DX/IQ/HT) + sekundární charakteristiky (Vůle/Vnímání), zbroj jen DR po
 * částech těla (4E zrušilo pasivní obranu). Odvozené hodnoty viz `formulas.ts`.
 */

export interface GurpsAttrDef {
  /** klíč v customData (`gurps_<key>`) */
  key: string;
  /** český název */
  label: string;
  /** originální zkratka (ST/DX/…) */
  abbr: string;
}

/** 4 hlavní atributy GURPS 4E. */
export const GURPS_CORE_ATTRS: GurpsAttrDef[] = [
  { key: 'st', label: 'Síla', abbr: 'ST' },
  { key: 'dx', label: 'Obratnost', abbr: 'DX' },
  { key: 'iq', label: 'Inteligence', abbr: 'IQ' },
  { key: 'ht', label: 'Zdraví', abbr: 'HT' },
];

/** Sekundární charakteristiky (default = IQ). */
export const GURPS_SECONDARY: GurpsAttrDef[] = [
  { key: 'will', label: 'Vůle', abbr: 'Will' },
  { key: 'per', label: 'Vnímání', abbr: 'Per' },
];

/** Meta pole v hlavičce (mimo Jméno/Hráč, které mají vlastní řádek). */
export const GURPS_META_FIELDS: { key: string; label: string; wide?: boolean }[] =
  [
    { key: 'desc', label: 'Popis', wide: true },
    { key: 'race', label: 'Rasa / TL' },
  ];

/** Malé čipy v pravém rohu hlavičky (Věk/SM jsou volné, body dopočet). */
export const GURPS_CHIP_FIELDS: { key: string; label: string }[] = [
  { key: 'age', label: 'Věk' },
  { key: 'sm', label: 'SM' },
];

/** Části těla pro zbroj (DR). */
export const GURPS_ARMOR_LOCS: { key: string; label: string }[] = [
  { key: 'head', label: 'Hlava' },
  { key: 'torso', label: 'Trup' },
  { key: 'arms', label: 'Paže' },
  { key: 'legs', label: 'Nohy' },
  { key: 'hands', label: 'Ruce' },
  { key: 'feet', label: 'Chodidla' },
];

/** Dovednost v `gurps_skills` (base = např. „DX/A", pts = body, lvl = úroveň). */
export interface GurpsSkill {
  name: string;
  base: string;
  pts: string;
  lvl: string;
}

/** Trait (výhoda/nevýhoda/zvláštnost) — pts je signed (výhody +, ostatní −). */
export interface GurpsTrait {
  name: string;
  pts: string;
}

/** Zbraň na blízko. */
export interface GurpsMelee {
  name: string;
  dmg: string;
  reach: string;
  parry: string;
}

/** Střelná / vrhací zbraň. */
export interface GurpsRanged {
  name: string;
  dmg: string;
  acc: string;
  range: string;
  shots: string;
}
