import type { CSSProperties, ReactNode } from 'react';
import s from '../HelpPage.module.css';

// Audience / role / stav. Barva z role tokenů kde dává smysl; ok/soon
// reuse statusPill sémantiky (✅ Funguje / 🚧 Připravujeme).
export type TagKind =
  | 'hrac'
  | 'pj'
  | 'pjasst'
  | 'corrector'
  | 'admin'
  | 'vse'
  | 'ok'
  | 'soon';

const TAG_COLOR: Record<TagKind, string> = {
  hrac: 'var(--role-world-player)',
  pj: 'var(--role-world-pj)',
  pjasst: 'var(--role-world-pj-asst)',
  corrector: 'var(--role-world-corrector)',
  admin: 'var(--role-star-admin)',
  vse: 'var(--theme-accent, var(--accent))',
  ok: 'var(--theme-accent, var(--accent))',
  soon: 'var(--theme-text-muted, var(--text-muted))',
};

/** Malý pill: audience („Hráč + PJ"), role nebo stav (✅/🚧). */
export function TagChip({
  kind,
  label,
  icon,
}: {
  kind: TagKind;
  label: string;
  icon?: ReactNode;
}) {
  // ok = výrazný solid akcent; ostatní = jemný outline.
  const cls = kind === 'ok' ? `${s.tagChip} ${s.tagChipSolid}` : s.tagChip;
  const style = { ['--acc' as string]: TAG_COLOR[kind] } as CSSProperties;
  return (
    <span className={cls} style={style}>
      {icon}
      {label}
    </span>
  );
}
