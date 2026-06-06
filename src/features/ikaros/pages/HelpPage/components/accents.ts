// 13.5 — sdílená paleta barevných akcentů bloků nápovědy.
// Klíč → CSS proměnná (theme-aware token). Komponenty ji vkládají do
// inline `--acc`, takže jedna CSS třída pokryje libovolnou barvu bez
// hardcode (lint:colors clean). Barvy z role tokenů + semantických tokenů.

export type HelpAccent =
  | 'accent'
  | 'pj'
  | 'pjasst'
  | 'corrector'
  | 'player'
  | 'reader'
  | 'warning'
  | 'success'
  | 'info';

export const ACCENT_VAR: Record<HelpAccent, string> = {
  accent: 'var(--theme-accent, var(--accent))',
  pj: 'var(--role-world-pj)',
  pjasst: 'var(--role-world-pj-asst)',
  corrector: 'var(--role-world-corrector)',
  player: 'var(--role-world-player)',
  reader: 'var(--role-world-reader)',
  warning: 'var(--warning)',
  success: 'var(--success)',
  info: 'var(--news-info)',
};
