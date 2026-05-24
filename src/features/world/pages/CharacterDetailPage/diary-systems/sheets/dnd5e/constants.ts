/**
 * 8.7d — D&D 5e konstanty.
 * 1:1 z `c:/Matrix/Matrix/frontend/src/components/diary/DndCharacterSheet.tsx`.
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

/** Header fields (Identity). */
export const DND_HEADER_FIELDS: { key: string; label: string }[] = [
  { key: 'classLevel', label: 'Povolání a úroveň' },
  { key: 'background', label: 'Zázemí' },
  { key: 'playerName', label: 'Jméno hráče' },
  { key: 'race', label: 'Rasa' },
  { key: 'alignment', label: 'Přesvědčení' },
  { key: 'xp', label: 'Body zkušeností' },
];

/** Personality blocky (textarea). */
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
