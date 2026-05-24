import { Lock } from 'lucide-react';
import clsx from 'clsx';
import s from './GroupChip.module.css';

interface Props {
  /** Název skupiny (`WorldSettings.customGroups[]`). */
  name: string;
  /** Hex barva z `WorldSettings.groupColors[name]`. */
  color: string;
  size?: 'sm' | 'md';
  /** True = zobrazí Lock ikonu vlevo (groupOnly event). */
  locked?: boolean;
}

/**
 * 9.1-I — barevný štítek skupiny pro `GameEventCard` (a budoucí znovupoužití).
 * Bílý text s tmavým text-shadow zajistí čitelnost na libovolné barvě pozadí.
 */
export function GroupChip({ name, color, size = 'md', locked = false }: Props) {
  return (
    <span
      className={clsx(s.chip, size === 'sm' && s.sm)}
      style={{ background: color }}
      title={locked ? `Skupinová akce — vidí jen ${name}` : name}
    >
      {locked && <Lock size={size === 'sm' ? 10 : 12} aria-hidden="true" />}
      <span className={s.label}>{name}</span>
    </span>
  );
}
