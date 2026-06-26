/**
 * 2.3 — Možné kostky / mechaniky systému (multi-select).
 */
export const DICE = [
  'd4',
  'd6',
  'd6+',
  'd8',
  'd10',
  'd12',
  'd20',
  'd100 / procenta',
  '2d6',
  '2d6+',
  '3d6',
  'Pool d6',
  'Pool d10',
  'Mixed polyhedral',
  'Fate kostky',
] as const;

export type DiceOption = (typeof DICE)[number];

/**
 * 2.3 D-NEW-tooltips — krátké popisky kostek / mechanik (zobrazí se
 * jako native tooltip přes `title` attribut na chipech).
 */
export const DICE_DESCRIPTIONS: Record<string, string> = {
  d4: 'Čtyřboká kostka (1–4). Drobné efekty, dýky, kouzla.',
  d6: 'Šestiboká kostka (1–6). Standardní v mnoha systémech.',
  'd6+':
    'Nafukovací k6 (DrD 1.6): padne-li 6, házíš znovu a přičteš hodnotu. Jen nahoru.',
  d8: 'Osmiboká kostka (1–8). Střední zbraně, kouzla.',
  d10: 'Desetiboká kostka (1–10). Procenta, World of Darkness.',
  d12: 'Dvanáctiboká kostka (1–12). Velké zbraně, silná kouzla.',
  d20: 'Dvacetiboká kostka (1–20). D&D útok a hod proti TC.',
  'd100 / procenta': 'Procentuální hod 1–100 (obvykle dvě d10).',
  '2d6': 'Součet dvou šestek (2–12). Powered by the Apocalypse, GURPS.',
  '2d6+':
    'Otevřený hod (DrD+): 2k6; dvojice 2×6 eskaluje +1, 2×1 −1 (i do záporu).',
  '3d6': 'Součet tří šestek (3–18). Klasická generace atributů.',
  'Pool d6': 'Hází se více d6, počítají se úspěchy. Shadowrun, ORE.',
  'Pool d10': 'Více d10, počítají se úspěchy. WoD / Storyteller.',
  'Mixed polyhedral': 'Kombinace různých kostek dle situace. Savage Worlds, Cortex.',
  'Fate kostky': '4× šestiboká kostka se symboly +/0/−. Fate Core.',
};
