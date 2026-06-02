import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import s from './StatCard.module.css';

export interface StatCardProps {
  label: string;
  value: number | string;
  icon: ReactNode;
  /** Volitelný cíl — celá karta se stane odkazem. */
  to?: string;
  /** Zvýraznění (např. nenulová fronta k vyřízení). */
  tone?: 'default' | 'accent';
  /** Index pro staggered fade-in (animation-delay). */
  index?: number;
  /** Skeleton stav místo hodnoty. */
  loading?: boolean;
}

/**
 * 12.1 — karta metriky na admin dashboardu. Token-based (laděno se všemi tématy),
 * klikací varianta přes `<Link>`. Staggered reveal řízený `--stat-index`.
 */
export function StatCard({
  label,
  value,
  icon,
  to,
  tone = 'default',
  index = 0,
  loading = false,
}: StatCardProps) {
  const className = clsx(
    s.card,
    tone === 'accent' && s.accent,
    to && s.clickable,
  );
  const style = { '--stat-index': index } as React.CSSProperties;

  const inner = (
    <>
      <span className={s.icon} aria-hidden>
        {icon}
      </span>
      <span className={s.value}>{loading ? '—' : value}</span>
      <span className={s.label}>{label}</span>
    </>
  );

  if (to) {
    return (
      <Link to={to} className={className} style={style}>
        {inner}
      </Link>
    );
  }
  return (
    <div className={className} style={style}>
      {inner}
    </div>
  );
}
