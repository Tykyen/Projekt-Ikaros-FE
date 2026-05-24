/**
 * 8.7g — GURPS konstanty.
 * Adaptováno z `c:/Matrix/Matrix/frontend/src/components/Map/GurpsMapDiaryOverlay.tsx`
 * (overlay v Matrix/Matrix sloužil i jako primary display — Ikaros si z něj
 * staví full editovatelný sheet).
 */

export interface GurpsAttrDef {
  /** klíč v customData (`gurps_<key>`) */
  key: string;
  /** český label + zkratka v závorce */
  label: string;
}

/** 6 hlavních atributů GURPS (česky + EN zkratka). */
export const GURPS_CORE_ATTRS: GurpsAttrDef[] = [
  { key: 'st', label: 'Síla (ST)' },
  { key: 'dx', label: 'Obratnost (DX)' },
  { key: 'iq', label: 'Inteligence (IQ)' },
  { key: 'ht', label: 'Zdraví (HT)' },
  { key: 'will', label: 'Vůle (Will)' },
  { key: 'per', label: 'Vnímání (Per)' },
];

/** Konfigurace sekundárního atributu. */
export interface GurpsSecAttrDef {
  key: string;
  label: string;
  /** Výchozí (zobrazený fallback). */
  fallback?: string;
}

/** Sekundární atributy zobrazené v defenses row. */
export const GURPS_DEFENSES: GurpsSecAttrDef[] = [
  { key: 'dr', label: 'DR (Zbroj)', fallback: '0' },
  { key: 'parry', label: 'Odražení', fallback: '0' },
  { key: 'block', label: 'Blok', fallback: '0' },
  { key: 'tl', label: 'TL', fallback: '0' },
];

/** Sekundární derived attrs (BL, Thrust, Swing). */
export const GURPS_DERIVED: GurpsSecAttrDef[] = [
  { key: 'basic_lift', label: 'BL (Nosnost)', fallback: '0' },
  { key: 'dmg_thr', label: 'Thr (Bodnutí)', fallback: '0' },
  { key: 'dmg_sw', label: 'Sw (Švih)', fallback: '0' },
];

/** Encumbrance levels (5×). */
export const GURPS_ENC_LEVELS: { label: string; m: string; d: string }[] = [
  { label: 'Žádné (0)', m: 'enc_move_0', d: 'enc_dodge_0' },
  { label: 'Lehké (1)', m: 'enc_move_1', d: 'enc_dodge_1' },
  { label: 'Střední (2)', m: 'enc_move_2', d: 'enc_dodge_2' },
  { label: 'Těžké (3)', m: 'enc_move_3', d: 'enc_dodge_3' },
  { label: 'Velmi těžké (4)', m: 'enc_move_4', d: 'enc_dodge_4' },
];

/** Meta info pole v header. */
export const GURPS_META_FIELDS: { key: string; label: string }[] = [
  { key: 'age', label: 'Věk' },
  { key: 'height', label: 'Výška' },
  { key: 'weight', label: 'Váha' },
  { key: 'sm', label: 'SM' },
  { key: 'appearance', label: 'Vzhled' },
  { key: 'culture', label: 'Kultura' },
];

/** Skill row v `gurps_skills`. */
export interface GurpsSkill {
  name: string;
  lvl: string;
  base: string;
}

/** Trait (advantage/disadvantage) row. */
export interface GurpsTrait {
  name: string;
  note: string;
}

/** Reaction modifier row. */
export interface GurpsReactionMod {
  name: string;
  val: string;
}

/** Language row. */
export interface GurpsLanguage {
  name: string;
  spk: string; // mluvený
  wrt: string; // psaný
}

/** Melee weapon row. */
export interface GurpsMelee {
  name: string;
  dmg: string;
  reach: string;
  parry: string;
}

/** Ranged weapon row. */
export interface GurpsRanged {
  name: string;
  dmg: string;
  acc: string;
  rng: string;
  rof: string;
  shots: string;
}

/** Armor / inventory row. */
export interface GurpsArmor {
  name: string;
  loc: string;
  wgt: string;
  cost: string;
}
