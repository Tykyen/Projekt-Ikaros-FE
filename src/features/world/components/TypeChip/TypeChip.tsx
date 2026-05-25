import { Info, AlertTriangle, Settings } from 'lucide-react';
import clsx from 'clsx';
import type { WorldNewsType } from '@/shared/types';
import s from './TypeChip.module.css';

interface Props {
  type: WorldNewsType;
  size?: 'sm' | 'md';
}

const TYPE_META: Record<
  WorldNewsType,
  { label: string; cssVar: string; Icon: typeof Info }
> = {
  info: { label: 'Informace', cssVar: 'var(--accent)', Icon: Info },
  alert: { label: 'Důležité', cssVar: 'var(--danger)', Icon: AlertTriangle },
  system: {
    label: 'Systém',
    cssVar: 'var(--warning, #f59e0b)',
    Icon: Settings,
  },
};

/**
 * 9.5 — barevný štítek typu novinky (info / alert / system). Vizuální
 * paralela `GroupChip` u game events — bílý text + ikonka.
 */
export function TypeChip({ type, size = 'md' }: Props) {
  const meta = TYPE_META[type];
  return (
    <span
      className={clsx(s.chip, size === 'sm' && s.sm)}
      style={{ background: meta.cssVar }}
      title={meta.label}
    >
      <meta.Icon
        size={size === 'sm' ? 11 : 13}
        aria-hidden="true"
      />
      <span className={s.label}>{meta.label}</span>
    </span>
  );
}
