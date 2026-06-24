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
  /** Accent varianta — zvýrazněný fill/obrys/glow (chat, tester-feedback). */
  accent?: boolean;
  /** Výzva vpravo místo čísla (např. „Otevřít") — naplní jinak prázdnou dlaždici. */
  cta?: string;
  /** Grid-area třída z rodiče. */
  className?: string;
}

/**
 * Side-task dashboard layout — kompaktní klikací dlaždice nad obsahovým
 * sloupcem (Hráči / Chat). Nahrazuje lištu `StatBar`.
 */
export function DashTile({
  icon,
  label,
  to,
  value,
  badge,
  accent,
  cta,
  className,
}: Props) {
  return (
    <Link
      to={to}
      className={`${s.tile} ${accent ? s.tileAccent : ''} ${className ?? ''}`}
      data-elev="card"
    >
      <span className={s.icon} aria-hidden>
        {icon}
      </span>
      <span className={s.label}>{label}</span>
      {value !== undefined && <span className={s.value}>{value}</span>}
      {cta !== undefined && value === undefined && (
        <span className={s.cta}>{cta} ›</span>
      )}
      {badge !== undefined && badge > 0 && (
        <span className={s.badge}>{badge}</span>
      )}
    </Link>
  );
}
