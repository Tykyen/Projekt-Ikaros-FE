/**
 * 8.7e / 16b — Dračí Hlídka (DrdH) konstanty.
 *
 * Datový model = schválený prototyp `c:/tmp/drdh-denik-audit.html`.
 * 6 povolání, každé s vlastním sekundárním zdrojem (mega-box vpravo od HP)
 * a vlastní profession-tabulkou (full-width blok).
 */

export type DrdhProfessionId =
  | 'valecnik'
  | 'hranicar'
  | 'alchymista'
  | 'kouzelnik'
  | 'zlodej'
  | 'klerik';

export interface DrdhProfessionDef {
  id: DrdhProfessionId;
  label: string;
  /** Symbol povolání (glyph na erbu + pečeti). */
  glyph: string;
  /** Specializace dostupné od 6. úrovně. */
  spec: string[];
}

export const DRDH_PROFESSIONS: DrdhProfessionDef[] = [
  { id: 'valecnik', label: 'Válečník', glyph: '⚔', spec: ['Berserker', 'Šermíř', 'Rytíř'] },
  { id: 'hranicar', label: 'Hraničář', glyph: '🍃', spec: ['Chodec', 'Druid', 'Pán zvířat'] },
  { id: 'alchymista', label: 'Alchymista', glyph: '⚗', spec: ['Medicus', 'Pyromant', 'Theurg'] },
  { id: 'kouzelnik', label: 'Kouzelník', glyph: '✦', spec: ['Bojový mág', 'Čaroděj', 'Nekromant'] },
  { id: 'zlodej', label: 'Zloděj', glyph: '🗝', spec: ['Assassin', 'Lupič', 'Sicco'] },
  { id: 'klerik', label: 'Klerik', glyph: '✝', spec: ['Bojový mnich', 'Exorcista', 'Kněz'] },
];

/** Mapa id → def pro rychlý lookup. */
export const DRDH_PROF_BY_ID: Record<DrdhProfessionId, DrdhProfessionDef> =
  DRDH_PROFESSIONS.reduce(
    (acc, p) => {
      acc[p.id] = p;
      return acc;
    },
    {} as Record<DrdhProfessionId, DrdhProfessionDef>,
  );

export interface DrdhAttrDef {
  /** customData suffix (`drdh_attr_<id>` = stupeň). */
  id: string;
  label: string;
  /** Zkratka zobrazená v UI (SIL/OBR/ODO/INT/CHAR). */
  abbr: string;
}

/**
 * 5 hlavních atributů DrdH (pořadí dle prototypu).
 * Stupeň se ukládá pod `drdh_attr_<id>`; oprava se NEukládá (auto = ⌊st/2⌋−5).
 */
export const DRDH_ATTRS: DrdhAttrDef[] = [
  { id: 'str', label: 'Síla', abbr: 'SIL' },
  { id: 'dex', label: 'Obratnost', abbr: 'OBR' },
  { id: 'con', label: 'Odolnost', abbr: 'ODO' },
  { id: 'int', label: 'Inteligence', abbr: 'INT' },
  { id: 'cha', label: 'Charisma', abbr: 'CHAR' },
];

/** Zkratky atributů (pro dovednostní select). */
export const DRDH_ATTR_ABBRS = ['SIL', 'OBR', 'ODO', 'INT', 'CHAR'] as const;
export type DrdhAttrAbbr = (typeof DRDH_ATTR_ABBRS)[number];

/** Mapování zkratky atributu → customData suffix (pro lookup opravy). */
export const DRDH_ABBR_TO_ID: Record<DrdhAttrAbbr, string> = {
  SIL: 'str',
  OBR: 'dex',
  ODO: 'con',
  INT: 'int',
  CHAR: 'cha',
};

/** Oprava atributu = ⌊stupeň/2⌋ − 5. */
export function drdhAttrMod(degree: string | number): number {
  const d = typeof degree === 'number' ? degree : parseInt(degree, 10);
  if (Number.isNaN(d)) return 0;
  return Math.floor(d / 2) - 5;
}

/** Formátuje opravu se znaménkem (+3 / 0 / -2). */
export function fmtMod(m: number): string {
  return m > 0 ? `+${m}` : String(m);
}

/** Typ sekundárního zdroje (řídí render mega-boxu). */
export type DrdhResourceKind =
  | 'adrenalin'
  | 'dusevni'
  | 'mana_sur'
  | 'mana'
  | 'kostymy'
  | 'prizen';

/** Per-povolání sekundární zdroj (pečeť + typ). */
export const DRDH_RESOURCE_BY_PROF: Record<
  DrdhProfessionId,
  { kind: DrdhResourceKind; title: string }
> = {
  valecnik: { kind: 'adrenalin', title: 'Adrenalin' },
  hranicar: { kind: 'dusevni', title: 'Duševní síla' },
  alchymista: { kind: 'mana_sur', title: 'Mana & Suroviny' },
  kouzelnik: { kind: 'mana', title: 'Mana' },
  zlodej: { kind: 'kostymy', title: 'Kostýmy' },
  klerik: { kind: 'prizen', title: 'Přízeň' },
};

/** Profession-specific tabulka — definice sloupců. */
export interface DrdhProfTableCol {
  /** Klíč v row objectu. */
  key: string;
  /** Sloupcový header (česky). */
  header: string;
}

export interface DrdhProfTable {
  /** customData klíč (`drdh_<arrKey>`). */
  arrKey: string;
  /** Titulek panelu. */
  title: string;
  /** Label tlačítka „+ Přidat …". */
  addLabel: string;
  /** Definice sloupců (mimo Akce ✕). */
  cols: DrdhProfTableCol[];
}

/** Definice profession-tabulky per povolání (sloupce dle prototypu). */
export const DRDH_PROF_TABLE: Record<DrdhProfessionId, DrdhProfTable> = {
  valecnik: {
    arrKey: 'w_triky',
    title: 'Válečníkovy triky',
    addLabel: '+ Přidat trik',
    cols: [
      { key: 'name', header: 'Název' },
      { key: 'adr', header: 'Adrenalin' },
      { key: 'use', header: 'Použití' },
      { key: 'req', header: 'Vyžaduje' },
      { key: 'check', header: 'Ověření' },
      { key: 'note', header: 'Poznámka' },
    ],
  },
  hranicar: {
    arrKey: 'r_kouzla',
    title: 'Hraničářova kouzla',
    addLabel: '+ Přidat kouzlo',
    cols: [
      { key: 'name', header: 'Název' },
      { key: 'power', header: 'Duševní síla' },
      { key: 'diff', header: 'Obtížnost' },
      { key: 'note', header: 'Poznámka' },
    ],
  },
  alchymista: {
    arrKey: 'a_recepty',
    title: 'Alchymistovy recepty',
    addLabel: '+ Přidat recept',
    cols: [
      { key: 'name', header: 'Název' },
      { key: 'mana', header: 'Mana' },
      { key: 'sur', header: 'Suroviny' },
      { key: 'zak', header: 'Základ' },
      { key: 'diff', header: 'Obtížnost' },
      { key: 'note', header: 'Poznámka' },
    ],
  },
  kouzelnik: {
    arrKey: 'm_kouzla',
    title: 'Kouzelníkova kouzla',
    addLabel: '+ Přidat kouzlo',
    cols: [
      { key: 'name', header: 'Název' },
      { key: 'mana', header: 'Mana' },
      { key: 'diff', header: 'Obtížnost' },
      { key: 'note', header: 'Poznámka' },
    ],
  },
  zlodej: {
    arrKey: 't_triky',
    title: 'Zlodějovy triky',
    addLabel: '+ Přidat trik',
    cols: [
      { key: 'name', header: 'Název' },
      { key: 'freq', header: 'Četnost' },
      { key: 'use', header: 'Použití' },
      { key: 'check', header: 'Ověření' },
      { key: 'note', header: 'Poznámka' },
    ],
  },
  klerik: {
    arrKey: 'c_prosby',
    title: 'Klerikovy prosby',
    addLabel: '+ Přidat prosbu',
    cols: [
      { key: 'name', header: 'Název' },
      { key: 'favor', header: 'Přízeň' },
      { key: 'diff', header: 'Obtížnost' },
      { key: 'note', header: 'Poznámka' },
    ],
  },
};

/** Zbraň v `drdh_weapons` JSON poli. */
export interface DrdhWeapon {
  name: string;
  atk: string;
  dmg: string;
  def: string;
  uc: string;
  oc: string;
}

/** Zbroj / štít v `drdh_armors` JSON poli. */
export interface DrdhArmor {
  name: string;
  quality: string;
  /** Základ obrany (ZO). */
  zo: string;
  note: string;
}

/** Dovednost v `drdh_skills` JSON poli. Součet = oprava atributu + stupeň (auto). */
export interface DrdhSkill {
  name: string;
  /** Zkratka atributu (SIL/OBR/ODO/INT/CHAR). */
  attr: string;
  /** Stupeň dovednosti. */
  deg: string;
}

/** Zvláštní schopnost v `drdh_abilities` JSON poli. */
export interface DrdhAbility {
  name: string;
  desc: string;
}
