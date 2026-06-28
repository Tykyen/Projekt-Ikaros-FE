/**
 * 8.7b — JaD (Jeskyně a draci) konstanty.
 * 1:1 přenos z `c:/Matrix/Matrix/frontend/src/components/diary/JadCharacterSheet.tsx`.
 */

export interface AbilityDef {
  /** Krátký klíč (`str`, `dex`, …) — používá se v customData (např. `jad_abi_str`). */
  k: string;
  /** Plný český název (zobrazený v UI). */
  l: string;
}

/** 6 hlavních atributů JaD (D&D 5e shared). */
export const ABIL_MAP: AbilityDef[] = [
  { k: 'str', l: 'Síla' },
  { k: 'dex', l: 'Obratnost' },
  { k: 'con', l: 'Odolnost' },
  { k: 'int', l: 'Inteligence' },
  { k: 'wis', l: 'Moudrost' },
  { k: 'cha', l: 'Charisma' },
];

export interface SkillDef {
  /** Český název dovednosti (zobrazený). Slouží i jako klíč v customData. */
  n: string;
  /** Navázaná ability (`str` / `dex` / `con` / `int` / `wis` / `cha`). */
  a: string;
}

/** 18 dovedností JaD (česky), s navázanou ability. */
export const SKILLS: SkillDef[] = [
  { n: 'Akrobacie', a: 'dex' },
  { n: 'Atletika', a: 'str' },
  { n: 'Čachry', a: 'dex' },
  { n: 'Historie', a: 'int' },
  { n: 'Klamání', a: 'cha' },
  { n: 'Lékařství', a: 'wis' },
  { n: 'Mystika', a: 'int' },
  { n: 'Náboženství', a: 'int' },
  { n: 'Nenápadnost', a: 'dex' },
  { n: 'Ovládání zvířat', a: 'wis' },
  { n: 'Pátrání', a: 'int' },
  { n: 'Přesvědčování', a: 'cha' },
  { n: 'Přežití', a: 'wis' },
  { n: 'Příroda', a: 'int' },
  { n: 'Vhled', a: 'wis' },
  { n: 'Vnímání', a: 'wis' },
  { n: 'Vystupování', a: 'cha' },
  { n: 'Zastrašování', a: 'cha' },
];

/** Tvar jedné zbraně v `jad_weapons` JSON poli. */
export interface JadWeapon {
  n: string; // název
  b: string; // bonus k zásahu
  d: string; // zranění
  t: string; // typ zranění (legacy field, zobrazený sloupec není)
  r: string; // dosah (legacy field, zobrazený sloupec není)
  o: string; // OČ (defense override) nebo poznámka
}

/** Tvar jednoho kouzla v `jad_spl_<level>` JSON poli. */
export interface JadSpell {
  p: boolean; // Prepared (jen pro lvl > 0)
  s: boolean; // V kouzelníkovi (spellbook)
  n: string; // Název
  u: string; // Útok / SO
  d: string; // Doba sesílání
  z: string; // (rezervovaný field)
  r: string; // Dosah
  t: string; // Trvání
}

// ════════════════════════════════════════════════════════════════
// 8.7p — Multipovolání, obory, zázemí, přidávatelné sekce
// Zdroj: JaD „přehled povolání a oborů pro hráče" (veřejné SRD).
// ════════════════════════════════════════════════════════════════

/** Definice povolání: prahová úroveň výběru oboru + seznam oborů. */
export interface JadClassDef {
  /** Úroveň, na které se vybírá hlavní specializace (obor). */
  sub: number;
  /** Dostupné obory / specializace. */
  list: string[];
}

/** 11 povolání JaD → kdy se větví obor + jaké obory. */
export const JAD_CLASSES: Record<string, JadClassDef> = {
  Alchymista: { sub: 3, list: ['Divotvůrce', 'Pyrofor', 'Theurg'] },
  Barbar: { sub: 3, list: ['Berserk', 'Bijec', 'Kmenový válečník', 'Ničitel'] },
  Bard: {
    sub: 3,
    list: ['Kolej dramatu', 'Kolej romance', 'Kolej písní světských'],
  },
  Bojovník: {
    sub: 3,
    list: [
      'Gardista',
      'Chodec',
      'Chrámový rytíř',
      'Šampion',
      'Střelec',
      'Veterán',
      'Vojevůdce',
    ],
  },
  'Čaroděj': {
    sub: 1,
    list: ['Fantaskní magie', 'Sférický čaroděj', 'Živlový čaroděj'],
  },
  'Černokněžník': {
    sub: 1,
    list: ['Bouřný titán', 'Pradávný drak', 'Ztracený mistr'],
  },
  Druid: { sub: 2, list: ['Kruh bylin', 'Kruh města', 'Kruh pohromy'] },
  Klerik: { sub: 1, list: ['Inkvizitor', 'Kazatel', 'Misionář'] },
  'Kouzelník': {
    sub: 2,
    list: ['Mistr svitků / Škola svitků', 'Průzkumník', 'Psychický mág'],
  },
  'Lovec netvorů': {
    sub: 3,
    list: [
      'Řád bestie',
      'Řád konečné smrti',
      'Řád pozměněnců',
      'Řád zaprodanců',
    ],
  },
  'Tulák': {
    sub: 3,
    list: [
      'Kejklíř',
      'Mistr zloděje',
      'Šedá eminence',
      'Svatokupec',
      'Vykradač hrobek',
    ],
  },
};

/** Povolání pracující s kouzly / alchymií (auto-zapnou sekci kouzel). */
export const JAD_CASTERS = [
  'Alchymista',
  'Bard',
  'Čaroděj',
  'Černokněžník',
  'Druid',
  'Klerik',
  'Kouzelník',
];

/** 16 osobních zázemí JaD (výběr v hlavičce). */
export const JAD_BACKGROUNDS = [
  'Akolyta',
  'Bylinkář',
  'Dělník',
  'Strážce',
  'Lovec',
  'Chovatel',
  'Kramář',
  'Mudrc',
  'Pobuda',
  'Právník',
  'Sluha',
  'Šlechtic',
  'Úředník',
  'Voják',
  'Zasvěcenec',
  'Zbojník',
];

/** Jeden řádek multipovolání v `jad_classes` JSON poli. */
export interface JadClassRow {
  c: string; // povolání
  l: string; // úroveň v povolání
  s: string; // obor / specializace
}

/** Jedna schopnost v `jad_feats` JSON poli. */
export interface JadFeat {
  n: string; // název
  d: string; // popis / účinek
}
