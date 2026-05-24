/**
 * 8.7e — Dračí Hlídka (DrdH) konstanty.
 * 1:1 přenos z `c:/Matrix/Matrix/frontend/src/components/diary/DrdhCharacterSheet.tsx`.
 */

export type DrdhProfessionId =
  | 'valecnik'
  | 'hranicar'
  | 'alchymista'
  | 'kouzelnik'
  | 'zlodej'
  | 'klerik';

export const DRDH_PROFESSIONS: { id: DrdhProfessionId; label: string }[] = [
  { id: 'valecnik', label: 'Válečník' },
  { id: 'hranicar', label: 'Hraničář' },
  { id: 'alchymista', label: 'Alchymista' },
  { id: 'kouzelnik', label: 'Kouzelník' },
  { id: 'zlodej', label: 'Zloděj' },
  { id: 'klerik', label: 'Klerik' },
];

export interface DrdhAttrDef {
  id: string;
  label: string;
}

/** 5 hlavních atributů DrdH. */
export const DRDH_ATTRS: DrdhAttrDef[] = [
  { id: 'str', label: 'Síla' },
  { id: 'dex', label: 'Obratnost' },
  { id: 'con', label: 'Odolnost' },
  { id: 'int', label: 'Inteligence' },
  { id: 'cha', label: 'Charisma' },
];

/** Konfigurace sekundárního zdroje per povolání. */
export interface DrdhResourceConfig {
  title: string;
  /** klíč suffix v customData (`drdh_<key>` + `_max`, `_note`) */
  valueKey: string;
  maxKey: string;
  noteKey: string;
  notePlaceholder: string;
}

/** Mapování povolání → sekundární zdroj (jeden box). Alchymista má 2 (řešen samostatně). */
export const DRDH_RESOURCE_BY_PROF: Partial<
  Record<DrdhProfessionId, DrdhResourceConfig>
> = {
  valecnik: {
    title: 'Adrenalin',
    valueKey: 'res_adr',
    maxKey: 'res_adr_max',
    noteKey: 'res_adr_note',
    notePlaceholder: 'Kola nebo spotřeba',
  },
  hranicar: {
    title: 'Duševní Síla',
    valueKey: 'res_ds',
    maxKey: 'res_ds_max',
    noteKey: 'res_ds_note',
    notePlaceholder: 'Obnova odpočinkem',
  },
  kouzelnik: {
    title: 'Mana',
    valueKey: 'res_mana',
    maxKey: 'res_mana_max',
    noteKey: 'res_mana_note',
    notePlaceholder: 'Denní nasátí',
  },
  zlodej: {
    title: 'Kostýmy',
    valueKey: 'res_costume',
    maxKey: 'res_costume_max',
    noteKey: 'res_costume_note',
    notePlaceholder: 'Aktivní kostýmové efekty',
  },
  klerik: {
    title: 'Přízeň',
    valueKey: 'res_favor',
    maxKey: 'res_favor_max',
    noteKey: 'res_favor_note',
    notePlaceholder: 'Dopoledne / Odpoledne',
  },
};

/** Profession-specific tabulka — definice sloupců. */
export interface DrdhProfTableCol {
  /** Klíč v row objectu. */
  key: string;
  /** Sloupcový header (česky). */
  header: string;
  /** Width class: `td-slim` (50px) / `td-mid` (80px) nebo undefined. */
  width?: 'td-slim' | 'td-mid';
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

/** Definice profession-tabulky per povolání. */
export const DRDH_PROF_TABLE: Record<DrdhProfessionId, DrdhProfTable> = {
  valecnik: {
    arrKey: 'w_triky',
    title: 'Válečníkovy triky',
    addLabel: '+ Přidat Trik',
    cols: [
      { key: 'name', header: 'Název' },
      { key: 'adr', header: 'Adrenalin', width: 'td-slim' },
      { key: 'use', header: 'Použití' },
      { key: 'check', header: 'Ověření' },
      { key: 'note', header: 'Poznámka', width: 'td-mid' },
    ],
  },
  hranicar: {
    arrKey: 'r_kouzla',
    title: 'Hraničářova kouzla',
    addLabel: '+ Přidat Kouzlo',
    cols: [
      { key: 'name', header: 'Název' },
      { key: 'power', header: 'Síla', width: 'td-slim' },
      { key: 'diff', header: 'Obtížnost' },
      { key: 'note', header: 'Poznámka', width: 'td-mid' },
    ],
  },
  alchymista: {
    arrKey: 'a_recepty',
    title: 'Alchymistovy recepty',
    addLabel: '+ Přidat Recept',
    cols: [
      { key: 'name', header: 'Název' },
      { key: 'mana', header: 'Mana', width: 'td-slim' },
      { key: 'sur', header: 'Surovina', width: 'td-slim' },
      { key: 'zak', header: 'Základ' },
      { key: 'diff', header: 'Obtížnost' },
      { key: 'note', header: 'Pozn', width: 'td-mid' },
    ],
  },
  kouzelnik: {
    arrKey: 'm_kouzla',
    title: 'Kouzelníkova kouzla',
    addLabel: '+ Přidat Kouzlo',
    cols: [
      { key: 'name', header: 'Název' },
      { key: 'mana', header: 'Mana', width: 'td-slim' },
      { key: 'diff', header: 'Obtížnost' },
      { key: 'note', header: 'Poznámka', width: 'td-mid' },
    ],
  },
  zlodej: {
    arrKey: 't_triky',
    title: 'Zlodějovy triky',
    addLabel: '+ Přidat Trik',
    cols: [
      { key: 'name', header: 'Název' },
      { key: 'action', header: 'Činnost' },
      { key: 'use', header: 'Použití' },
      { key: 'check', header: 'Ověření' },
      { key: 'note', header: 'Poznámka', width: 'td-mid' },
    ],
  },
  klerik: {
    arrKey: 'c_prosby',
    title: 'Klerikovy prosby',
    addLabel: '+ Přidat Prosbu',
    cols: [
      { key: 'name', header: 'Název' },
      { key: 'favor', header: 'Přízeň', width: 'td-slim' },
      { key: 'diff', header: 'Obtížnost' },
      { key: 'note', header: 'Poznámka', width: 'td-mid' },
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

/** Zbroj v `drdh_armors` JSON poli. */
export interface DrdhArmor {
  name: string;
  quality: string;
  def: string;
  note: string;
}

/** Dovednost v `drdh_skills` JSON poli. */
export interface DrdhSkill {
  name: string;
  lvl: string;
  sum: string;
  pts: string;
}
