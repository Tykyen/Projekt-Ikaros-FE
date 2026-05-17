import type { ReactNode } from 'react';
import s from './SettingsPanel.module.css';

interface Props {
  title: string;
  description?: string;
  /** Akční prvek vpravo nahoře (např. tlačítko Uložit). */
  action?: ReactNode;
  children: ReactNode;
}

/**
 * 5.3 — obal sekce uvnitř tabu. Vizuální jazyk `SectionCard` z CreateWorldPage,
 * ale bez číslovaného markeru (taby nemají pořadí jako wizard).
 */
export function SettingsPanel({ title, description, action, children }: Props) {
  return (
    <section className={s.panel}>
      <header className={s.header}>
        <div>
          <h2 className={s.title}>{title}</h2>
          {description && <p className={s.description}>{description}</p>}
        </div>
        {action && <div className={s.action}>{action}</div>}
      </header>
      <div className={s.body}>{children}</div>
    </section>
  );
}
