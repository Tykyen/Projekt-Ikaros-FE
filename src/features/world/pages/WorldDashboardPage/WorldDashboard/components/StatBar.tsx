import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import s from './StatBar.module.css';

export interface StatItem {
  icon: ReactNode;
  value: number | string;
  label: string;
  /** 5.6 — když je zadáno, dlaždice je klikací odkaz. */
  to?: string;
}

interface Props {
  stats: StatItem[];
}

/**
 * 5.2 — spodní lišta dashboardu: 3 statistiky světa (hráčů / akcí / novinek).
 * 5.6 — dlaždice s `to` je klikací odkaz.
 */
export function StatBar({ stats }: Props) {
  return (
    <div className={s.bar}>
      {stats.map((st) => {
        const inner = (
          <>
            <span className={s.icon} aria-hidden>
              {st.icon}
            </span>
            <span className={s.value}>{st.value}</span>
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
