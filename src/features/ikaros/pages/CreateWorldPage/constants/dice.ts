/**
 * 2.3 — Možné kostky / mechaniky systému (multi-select).
 */
export const DICE = [
  'd4',
  'd6',
  'd8',
  'd10',
  'd12',
  'd20',
  'd100 / procenta',
  '2d6',
  '3d6',
  'Pool d6',
  'Pool d10',
  'Mixed polyhedral',
  'Fate kostky',
] as const;

export type DiceOption = (typeof DICE)[number];
