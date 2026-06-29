/**
 * 8.7s — D&D 5e konstanty. Klon JaD (`sheets/jad/constants.ts`) — STEJNÝ tvar,
 * jediný rozdíl = povolání (`DND_CLASSES`) a zázemí (`DND_BACKGROUNDS`).
 * D&D specifikum: Černokněžník má 2 osy (patron + pakt) přes optional `sub2/list2`.
 */

export interface AbilityDef {
  /** Krátký klíč (`str`, `dex`, …) — používá se v customData (např. `dnd_abi_str`). */
  k: string;
  /** Plný český název (zobrazený v UI). */
  l: string;
}

/** 6 hlavních atributů (D&D 5e). */
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

/** 18 dovedností (česky), s navázanou ability — shodné s JaD. */
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

/** Tvar jedné zbraně v `dnd_weapons` JSON poli. */
export interface DndWeapon {
  n: string; // název
  b: string; // bonus k zásahu
  d: string; // zranění
  t: string; // typ zranění (legacy field)
  r: string; // dosah (legacy field)
  o: string; // OČ (defense override) nebo poznámka
}

/** Tvar jednoho kouzla v `dnd_spl_<level>` JSON poli. */
export interface DndSpell {
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
// Multipovolání, obory, zázemí, přidávatelné sekce
// Jediný rozdíl proti JaD — D&D 5e povolání a zázemí (zadání uživatele).
// ════════════════════════════════════════════════════════════════

/** Definice povolání: prahová úroveň výběru oboru + seznam oborů.
 *  Černokněžník navíc 2. osa (pakt) přes `sub2`/`list2`/`label2`. */
export interface DndClassDef {
  /** Úroveň, na které se vybírá obor (1. osa). */
  sub: number;
  /** Dostupné obory / specializace (1. osa). */
  list: string[];
  /** Práh 2. osy (jen Černokněžník — pakt). */
  sub2?: number;
  /** Seznam 2. osy. */
  list2?: string[];
  /** Popisek 2. osy. */
  label2?: string;
}

/** 12 povolání D&D 5e → práh oboru + obory (Černokněžník 2 osy). */
export const DND_CLASSES: Record<string, DndClassDef> = {
  Barbar: {
    sub: 3,
    list: [
      'Berserkr',
      'Totemový — Medvěd',
      'Totemový — Vlk',
      'Totemový — Orel',
      'Totemový — Los',
      'Totemový — Tygr',
      'Bojechtivec',
    ],
  },
  Bard: { sub: 3, list: ['Bojový', 'Znalostní'] },
  Bojovník: { sub: 3, list: ['Čaroknecht', 'Šampión', 'Taktik', 'Rytíř'] },
  'Čaroděj': {
    sub: 1,
    list: ['Divoká magie', 'Démoní rod', 'Bouřný čaroděj'],
  },
  'Černokněžník': {
    sub: 1,
    list: ['Arcivíla', 'Běs', 'Prastarý', 'Nehynoucí'],
    sub2: 3,
    label2: 'Pakt',
    list2: ['Pakt čepele', 'Pakt rukověti', 'Pakt řetězu'],
  },
  Druid: {
    sub: 2,
    list: [
      'Kruh měsíce',
      'Kruh země — Arktida',
      'Kruh země — Bažina',
      'Kruh země — Hory',
      'Kruh země — Lesy',
      'Kruh země — Pláně',
      'Kruh země — Pobřeží',
      'Kruh země — Poušť',
      'Kruh země — Podzemí',
    ],
  },
  'Hraničář': { sub: 3, list: ['Lovec', 'Pán zvířat'] },
  Klerik: {
    sub: 1,
    list: [
      'Bouře',
      'Příroda',
      'Světlo',
      'Šalba',
      'Válka',
      'Znalost',
      'Život',
      'Mystika',
    ],
  },
  'Kouzelník': {
    sub: 2,
    list: [
      'Škola iluze',
      'Škola nekromancie',
      'Škola očarování',
      'Škola transmutace',
      'Škola věštění',
      'Škola vymítání',
      'Škola zaklínání',
      'Zpěv meče',
    ],
  },
  'Mnich': {
    sub: 3,
    list: [
      'Cesta čtyř živlů',
      'Cesta otevřené ruky',
      'Cesta stínů',
      'Cesta dlouhé smrti',
      'Sluneční duše',
    ],
  },
  Paladin: { sub: 3, list: ['Oddanost', 'Pomsta', 'Starověku', 'Koruny'] },
  'Tulák': {
    sub: 3,
    list: ['Mystický šejdíř', 'Vrah', 'Lupič', 'Šibal', 'Švihák'],
  },
};

/** Povolání pracující s kouzly (auto-zapnou sekci kouzel). Plné + půlcasteři. */
export const DND_CASTERS = [
  'Bard',
  'Čaroděj',
  'Černokněžník',
  'Druid',
  'Klerik',
  'Kouzelník',
  'Paladin',
  'Hraničář',
];

/** 25 osobních zázemí D&D 5e (výběr v hlavičce). */
export const DND_BACKGROUNDS = [
  'Agent frakce',
  'Akolyta',
  'Bavič',
  'Cechovní řemeslník',
  'Daleký cestovatel',
  'Dědic',
  'Dvořan',
  'Hlubinný šlechtic',
  'Chodec',
  'Klanový řemeslník',
  'Klášterní učenec',
  'Lidový hrdina',
  'Městská hlídka',
  'Mudrc',
  'Nájemný lovec',
  'Námořník',
  'Poustevník',
  'Příslušník kmene',
  'Rytíř řádu',
  'Šarlatán',
  'Šlechtic',
  'Uličník',
  'Voják',
  'Zločinec',
  'Žoldnéř',
];

/** Jeden řádek multipovolání v `dnd_classes` JSON poli. */
export interface DndClassRow {
  c: string; // povolání
  l: string; // úroveň v povolání
  s: string; // obor / specializace (1. osa)
  s2: string; // 2. osa (jen Černokněžník — pakt)
}

/** Jedna schopnost v `dnd_feats` JSON poli. */
export interface DndFeat {
  n: string; // název
  d: string; // popis / účinek
}
