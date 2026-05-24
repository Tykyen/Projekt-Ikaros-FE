/**
 * 8.7k — Shadowrun konstanty.
 * 1:1 z `c:/Matrix/Matrix/frontend/src/components/diary/ShadowrunCharacterSheet.tsx`.
 */

/** 8 hlavních atributů (česky). */
export const SR_CORE_ATTRS = [
  { key: 'bod', label: 'Tělo' },
  { key: 'agi', label: 'Obratnost' },
  { key: 'rea', label: 'Reakce' },
  { key: 'str', label: 'Síla' },
  { key: 'wil', label: 'Vůle' },
  { key: 'log', label: 'Logika' },
  { key: 'int', label: 'Intuice' },
  { key: 'cha', label: 'Charisma' },
];

/** Speciální + odvozené atributy. */
export const SR_SPECIAL_ATTRS = [
  { key: 'edg', label: 'Hrana (MAX / PT)' },
  { key: 'mag', label: 'Magie/Rezonance' },
  { key: 'ess', label: 'Esence' },
  { key: 'ini', label: 'Iniciativa' },
  { key: 'ini_astral', label: 'Astrální Inic.' },
  { key: 'ini_matrix', label: 'Matrix Inic.' },
];
