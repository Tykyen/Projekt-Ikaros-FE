/**
 * 8.7c — Call of Cthulhu 7e konstanty.
 * 1:1 přenos z `c:/Matrix/Matrix/frontend/src/components/diary/CocCharacterSheet.tsx`.
 */

export interface CocCharDef {
  /** Klíč v customData prefixu `coc_<key>_reg/half/fifth`. */
  key: string;
  /** Krátký český label (zobrazený). */
  label: string;
}

/** 8 hlavních vlastností CoC 7e (česky). */
export const COC_CHARS: CocCharDef[] = [
  { key: 'str', label: 'SIL' },
  { key: 'con', label: 'ODL' },
  { key: 'dex', label: 'OBR' },
  { key: 'int', label: 'INT' },
  { key: 'siz', label: 'VEL' },
  { key: 'pow', label: 'VŮL' },
  { key: 'app', label: 'VZH' },
  { key: 'edu', label: 'VZD' },
];

export interface CocSkillDef {
  /** Stabilní klíč (anglicky, snake_case) — v customData `coc_sk_<key>_reg/half/fifth/chk`. */
  key: string;
  /** Český název (zobrazený). */
  name: string;
  /** Textový popis základu (např. „05 %" nebo „pol. OBR"). */
  base: string;
}

/** 44 výchozích dovedností CoC 7e (česky). */
export const DEFAULT_SKILLS: CocSkillDef[] = [
  { key: 'accounting', name: 'Účetnictví', base: '05 %' },
  { key: 'anthropology', name: 'Antropologie', base: '01 %' },
  { key: 'appraise', name: 'Odhad ceny', base: '05 %' },
  { key: 'archaeology', name: 'Archeologie', base: '01 %' },
  { key: 'art_craft', name: 'Umění / Řemeslo', base: '05 %' },
  { key: 'charm', name: 'Šarm', base: '15 %' },
  { key: 'climb', name: 'Šplh', base: '20 %' },
  { key: 'credit_rating', name: 'Majetnost', base: '00 %' },
  { key: 'cthulhu_mythos', name: 'Mýtus Cthulhu', base: '00 %' },
  { key: 'disguise', name: 'Převlek', base: '05 %' },
  { key: 'dodge', name: 'Úhyb', base: 'pol. OBR' },
  { key: 'drive_auto', name: 'Řízení auta', base: '20 %' },
  { key: 'elec_repair', name: 'Oprava elektro', base: '10 %' },
  { key: 'fast_talk', name: 'Ukecávání', base: '05 %' },
  { key: 'fighting_brawl', name: 'Boj zblízka (Rvačka)', base: '25 %' },
  { key: 'firearms_handgun', name: 'Stř. zbraně (Pistole)', base: '20 %' },
  { key: 'firearms_rifle', name: 'Stř. zbraně (Puška)', base: '25 %' },
  { key: 'first_aid', name: 'První pomoc', base: '30 %' },
  { key: 'history', name: 'Historie', base: '05 %' },
  { key: 'intimidate', name: 'Zastrašování', base: '15 %' },
  { key: 'jump', name: 'Skok', base: '20 %' },
  { key: 'language_other', name: 'Jazyk cizí', base: '01 %' },
  { key: 'language_own', name: 'Rodný jazyk', base: 'VZD' },
  { key: 'law', name: 'Právo', base: '05 %' },
  { key: 'library_use', name: 'Práce s knihovnou', base: '20 %' },
  { key: 'listen', name: 'Naslouchání', base: '20 %' },
  { key: 'locksmith', name: 'Zámečnictví', base: '01 %' },
  { key: 'mech_repair', name: 'Mechanické opravy', base: '10 %' },
  { key: 'medicine', name: 'Lékařství', base: '01 %' },
  { key: 'natural_world', name: 'Příroda', base: '10 %' },
  { key: 'navigate', name: 'Navigace', base: '10 %' },
  { key: 'occult', name: 'Okultismus', base: '05 %' },
  { key: 'persuade', name: 'Přesvědčování', base: '10 %' },
  { key: 'pilot', name: 'Pilotáž', base: '01 %' },
  { key: 'psychoanalysis', name: 'Psychoanalýza', base: '01 %' },
  { key: 'psychology', name: 'Psychologie', base: '10 %' },
  { key: 'ride', name: 'Jízda na zvířeti', base: '05 %' },
  { key: 'science', name: 'Věda', base: '01 %' },
  { key: 'sleight_of_hand', name: 'Mrštné prsty', base: '10 %' },
  { key: 'spot_hidden', name: 'Postřeh', base: '25 %' },
  { key: 'stealth', name: 'Plížení', base: '20 %' },
  { key: 'survival', name: 'Přežití', base: '10 %' },
  { key: 'swim', name: 'Plavání', base: '20 %' },
  { key: 'throw', name: 'Hod', base: '20 %' },
  { key: 'track', name: 'Stopování', base: '10 %' },
];

/** Header fields (Identity). */
export const COC_HEADER_FIELDS: { key: string; label: string }[] = [
  { key: 'coc_name', label: 'Jméno' },
  { key: 'coc_occupation', label: 'Povolání' },
  { key: 'coc_birthplace', label: 'Místo narození' },
  { key: 'coc_residence', label: 'Bydliště' },
  { key: 'coc_pronoun', label: 'Zájmeno' },
  { key: 'coc_age', label: 'Věk' },
];

/** Status flags (6 toggle checkboxů). */
export const COC_STATUS_FLAGS: { key: string; label: string }[] = [
  { key: 'coc_max_sanity', label: 'Max. příčetnost' },
  { key: 'coc_temp_insanity', label: 'Dočasné šílenství' },
  { key: 'coc_indef_insanity', label: 'Neurčité šílenství' },
  { key: 'coc_major_wound', label: 'Těžké zranění' },
  { key: 'coc_unconscious', label: 'V bezvědomí' },
  { key: 'coc_dying', label: 'Umírá' },
];

/** Tvar zbraně v `coc_weapons` JSON poli. */
export interface CocWeapon {
  name: string;
  skill: string;
  dmg: string;
  attacks: string;
  range: string;
  ammo: string;
  malf: string;
}

/** Tvar dodatečné dovednosti v `coc_custom_skills` JSON poli. */
export interface CocCustomSkill {
  name: string;
  reg: string;
  half: string;
  fifth: string;
  chk: string; // 'true' / 'false'
}
