import type { ReactNode } from 'react';
import s from './DashColumn.module.css';

interface Props {
  icon: ReactNode;
  title: string;
  /** Akční prvek vpravo v nadpisové liště (např. „Nové oznámení"). */
  action?: ReactNode;
  children: ReactNode;
}

/**
 * 5.2 — obal sloupce dashboardu. Nadpisová lišta (ikona + titulek) nad
 * panelem — vizuální jazyk starého Matrixu (`sectionLabelStyle`).
 */
export function DashColumn({ icon, title, action, children }: Props) {
  return (
    <section className={s.column}>
      <header className={s.label}>
        <span className={s.icon} aria-hidden>
          {icon}
        </span>
        <h2 className={s.title}>{title}</h2>
        {action && <span className={s.action}>{action}</span>}
      </header>
      <div className={s.panel}>{children}</div>
    </section>
  );
}
