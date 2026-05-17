import type { ReactNode } from 'react';
import s from './StatBar.module.css';

export interface StatItem {
  icon: ReactNode;
  value: number | string;
  label: string;
}

interface Props {
  stats: StatItem[];
}

/**
 * 5.2 — spodní lišta dashboardu: 3 statistiky světa (hráčů / akcí / novinek).
 */
export function StatBar({ stats }: Props) {
  return (
    <div className={s.bar}>
      {stats.map((st) => (
        <div key={st.label} className={s.stat}>
          <span className={s.icon} aria-hidden>
            {st.icon}
          </span>
          <span className={s.value}>{st.value}</span>
          <span className={s.label}>{st.label}</span>
        </div>
      ))}
    </div>
  );
}
