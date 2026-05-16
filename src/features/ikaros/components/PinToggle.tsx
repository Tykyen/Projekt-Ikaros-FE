import { Pin } from 'lucide-react';
import clsx from 'clsx';
import s from './PinToggle.module.css';

interface Props {
  /** Je položka připnutá v sidebaru. */
  isPinned: boolean;
  /** Klik na špendlík — caller spustí toggle-pin mutaci. */
  onToggle: () => void;
  /** Probíhá mutace. */
  pending?: boolean;
  /** Limit 5 dosažen — nepřipnuté položky mají špendlík zablokovaný. */
  disabled?: boolean;
  className?: string;
}

/**
 * 3.7 — přepínač připnutí do sidebaru. Připnout lze jen oblíbenou položku
 * (BE guard), max 5 na typ. Při dosažení limitu jsou nepřipnuté špendlíky
 * `disabled` s vysvětlujícím tooltipem; reálný limit enforcuje BE (409).
 */
export function PinToggle({
  isPinned,
  onToggle,
  pending,
  disabled,
  className,
}: Props) {
  const blocked = !!disabled && !isPinned;
  const label = blocked
    ? 'Připnout lze max 5 — nejdřív něco odepni'
    : isPinned
      ? 'Odepnout ze sidebaru'
      : 'Připnout do sidebaru';
  return (
    <button
      type="button"
      className={clsx(s.iconBtn, isPinned && s.active, className)}
      disabled={pending || blocked}
      aria-pressed={isPinned}
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
    >
      <Pin
        size={16}
        className={clsx(s.icon, isPinned && s.iconActive)}
        fill={isPinned ? 'currentColor' : 'none'}
        aria-hidden
      />
    </button>
  );
}
