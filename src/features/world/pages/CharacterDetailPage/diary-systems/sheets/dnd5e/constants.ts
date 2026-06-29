/**
 * 8.7d — D&D 5e konstanty (atributy, dovednosti, spell typy).
 * 8.7s — multipovolání + obory, zázemí select, přidávatelné sekce.
 *        Data povolání/zázemí dle zadání uživatele (D&D 5e CZ).
 */

export const ABILITY_KEYS = [
  'str',
  'dex',
  'con',
  'int',
  'wis',
  'cha',
] as const;

export type AbilityKey = (typeof ABILITY_KEYS)[number];

export const ABILITY_LABELS: Record<AbilityKey, string> = {
  str: 'Síla',
  dex: 'Obratnost',
  con: 'Odolnost',
  int: 'Inteligence',
  wis: 'Moudrost',
  cha: 'Charisma',
};

export interface DndSkillDef {
  /** Český název dovednosti — slouží i jako klíč v customData (`dnd_skill_prof_<name>`). */
  name: string;
  /** Navázaná ability (`str` / `dex` / …). */
  ability: AbilityKey;
}

/** 18 dovedností D&D 5e (česky). */
export const SKILLS: DndSkillDef[] = [
  { name: 'Akrobacie', ability: 'dex' },
  { name: 'Atletika', ability: 'str' },
  { name: 'Čachry', ability: 'dex' },
  { name: 'Historie', ability: 'int' },
  { name: 'Klamání', ability: 'cha' },
  { name: 'Lékařství', ability: 'wis' },
  { name: 'Mystika', ability: 'int' },
  { name: 'Náboženství', ability: 'int' },
  { name: 'Nenápadnost', ability: 'dex' },
  { name: 'Ovládání zvířat', ability: 'wis' },
  { name: 'Pátrání', ability: 'int' },
  { name: 'Přesvědčování', ability: 'cha' },
  { name: 'Přežití', ability: 'wis' },
  { name: 'Příroda', ability: 'int' },
  { name: 'Umění', ability: 'cha' },
  { name: 'Vhled', ability: 'wis' },
  { name: 'Vnímání', ability: 'wis' },
  { name: 'Zastrašování', ability: 'cha' },
];

/** Personality blocky (textarea) — D&D specifikum, zůstává. */
export const DND_PERSONALITY_FIELDS: {
  key: string;
  label: string;
  rows: number;
}[] = [
  { key: 'traits', label: 'Osobnostní rysy', rows: 3 },
  { key: 'ideals', label: 'Ideály', rows: 2 },
  { key: 'bonds', label: 'Pouta', rows: 2 },
  { key: 'flaws', label: 'Vady', rows: 2 },
];

/** Útok v `dnd_attacks` JSON poli. */
export interface DndAttack {
  name: string;
  bonus: string;
  damage: string;
}

/** Jedno kouzlo v `dnd_spellLevel_<lvl>.spells`. */
export interface DndSpellEntry {
  name: string;
  prepared: boolean;
  note: string;
}

/** Celá spell level data v `dnd_spellLevel_<lvl>` (JSON object). */
export interface DndSpellLevel {
  totalSlots: number;
  usedSlots: number;
  spells: DndSpellEntry[];
}

// ════════════════════════════════════════════════════════════════
// 8.7s — Multipovolání, obory, zázemí, přidávatelné sekce
// ════════════════════════════════════════════════════════════════

/** Definice povolání: prahová úroveň výběru oboru + seznam oborů. */
export interface DndClassDef {
  /** Úroveň, na které se vybírá obor (1. osa). */
  sub: number;
  /** Dostupné obory / specializace (1. osa). */
  list: string[];
  /** Popisek 1. osy (default „Obor"). */
  label?: string;
  /** Práh 2. osy (jen Černokněžník — pakt). */
  sub2?: number;
  /** Seznam 2. osy. */
  list2?: string[];
  /** Popisek 2. osy. */
  label2?: string;
}

/** 12 povolání D&D 5e → práh oboru + obory (a u Černokněžníka 2. osa). */
export const DND_CLASSES: Record<string, DndClassDef> = {
  Barbar: {
    sub: 3,
    label: 'Stezka',
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
  Bard: { sub: 3, label: 'Kolej', list: ['Bojový', 'Znalostní'] },
  Bojovník: {
    sub: 3,
    label: 'Archetyp',
    list: ['Čaroknecht', 'Šampión', 'Taktik', 'Rytíř'],
  },
  'Čaroděj': {
    sub: 1,
    label: 'Původ',
    list: ['Divoká magie', 'Démoní rod', 'Bouřný čaroděj'],
  },
  'Černokněžník': {
    sub: 1,
    label: 'Patron',
    list: ['Arcivíla', 'Běs', 'Prastarý', 'Nehynoucí'],
    sub2: 3,
    label2: 'Pakt',
    list2: ['Pakt čepele', 'Pakt rukověti', 'Pakt řetězu'],
  },
  Druid: {
    sub: 2,
    label: 'Kruh',
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
  'Hraničář': {
    sub: 3,
    label: 'Archetyp',
    list: ['Lovec', 'Pán zvířat'],
  },
  Klerik: {
    sub: 1,
    label: 'Doména',
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
    label: 'Škola',
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
    label: 'Tradice',
    list: [
      'Cesta čtyř živlů',
      'Cesta otevřené ruky',
      'Cesta stínů',
      'Cesta dlouhé smrti',
      'Sluneční duše',
    ],
  },
  Paladin: {
    sub: 3,
    label: 'Přísaha',
    list: ['Oddanost', 'Pomsta', 'Starověku', 'Koruny'],
  },
  'Tulák': {
    sub: 3,
    label: 'Archetyp',
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

/** Osobní zázemí D&D 5e (výběr v hlavičce). */
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
