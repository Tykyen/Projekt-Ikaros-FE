import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import s from './StatBar.module.css';

export interface StatItem {
  icon: ReactNode;
  /** Hlavní velké číslo. Volitelné — dlaždice „Chat" číslo nemá. */
  value?: number | string;
  label: string;
  /** 5.6 — když je zadáno, dlaždice je klikací odkaz. */
  to?: string;
  /** Svítící počet (např. nepřečtené zprávy). Zobrazí se jen když > 0. */
  badge?: number;
}

interface Props {
  stats: StatItem[];
}

/**
 * 5.2 — spodní lišta dashboardu: statistiky světa (hráčů / akcí / novinek).
 * 5.6 — dlaždice s `to` je klikací odkaz.
 * 5.x — dlaždice „Chat" — `badge` svítí počtem nepřečtených (fáze 6).
 */
export function StatBar({ stats }: Props) {
  return (
    <div className={s.bar}>
      {stats.map((st) => {
        const inner = (
          <>
            {st.badge !== undefined && st.badge > 0 && (
              <span className={s.badge}>{st.badge}</span>
            )}
            <span className={s.icon} aria-hidden>
              {st.icon}
            </span>
            {st.value !== undefined && (
              <span className={s.value}>{st.value}</span>
            )}
            <span className={s.label}>{st.label}</span>
          </>
        );
        return st.to ? (
          <Link key={st.label} to={st.to} className={`${s.stat} ${s.statLink}`}>
            {inner}
          </Link>
        ) : (
          <div key={st.label} className={s.stat}>
            {inner}
          </div>
        );
      })}
    </div>
  );
}
