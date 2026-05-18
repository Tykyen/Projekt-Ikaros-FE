import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import s from './DashTile.module.css';

interface Props {
  icon: ReactNode;
  label: string;
  to: string;
  /** Velké číslo vpravo (např. počet členů). */
  value?: number | string;
  /** Svítící počet (nepřečtené); zobrazí se jen když > 0. */
  badge?: number;
  /** Grid-area třída z rodiče. */
  className?: string;
}

/**
 * Side-task dashboard layout — kompaktní klikací dlaždice nad obsahovým
 * sloupcem (Hráči / Chat). Nahrazuje lištu `StatBar`.
 */
export function DashTile({ icon, label, to, value, badge, className }: Props) {
  return (
    <Link to={to} className={`${s.tile} ${className ?? ''}`}>
      <span className={s.icon} aria-hidden>
        {icon}
      </span>
      <span className={s.label}>{label}</span>
      {value !== undefined && <span className={s.value}>{value}</span>}
      {badge !== undefined && badge > 0 && (
        <span className={s.badge}>{badge}</span>
      )}
    </Link>
  );
}
