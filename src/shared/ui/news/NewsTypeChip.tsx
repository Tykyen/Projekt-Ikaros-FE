import { Info, AlertTriangle, Settings } from 'lucide-react';
import clsx from 'clsx';
import type { NewsTone } from './newsVm';
import s from './NewsTypeChip.module.css';

interface Props {
  tone: NewsTone;
  label: string;
  size?: 'sm' | 'md';
}

const TONE_META: Record<NewsTone, { cssVar: string; Icon: typeof Info }> = {
  info: { cssVar: 'var(--accent)', Icon: Info },
  warning: { cssVar: 'var(--danger)', Icon: AlertTriangle },
  system: { cssVar: 'var(--warning, #f59e0b)', Icon: Settings },
};

/**
 * Barevný štítek důležitosti novinky (info / warning / system). Vizuál řídí
 * `tone`, text je doménový (`label`). Zobecnění původního world `TypeChip`,
 * sdílené globální i světovou novinkou.
 */
export function NewsTypeChip({ tone, label, size = 'md' }: Props) {
  const meta = TONE_META[tone];
  return (
    <span
      className={clsx(s.chip, size === 'sm' && s.sm)}
      style={{ background: meta.cssVar }}
      title={label}
    >
      <meta.Icon size={size === 'sm' ? 11 : 13} aria-hidden="true" />
      <span className={s.label}>{label}</span>
    </span>
  );
}
