// 10.1 — vizuální shell ovládacího panelu (plovoucí vlevo / mobil bottom-sheet).
// Drží jen chrome (header + sbalování); obsah dodá orchestrátor jako children.
import { useState, type ReactNode } from 'react';
import styles from './UniversePanel.module.css';

interface Props {
  title: string;
  onBack?: () => void;
  /** Akce v hlavičce (např. přepínač edit módu). */
  headerExtra?: ReactNode;
  children: ReactNode;
}

export function UniversePanel({ title, onBack, headerExtra, children }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`${styles.panel} ${collapsed ? styles.collapsed : ''}`}
    >
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          {onBack && (
            <button
              type="button"
              className={styles.iconBtn}
              onClick={onBack}
              title="Zpět"
            >
              ←
            </button>
          )}
          <h2 className={styles.title}>{title}</h2>
        </div>
        <div className={styles.headerRight}>
          {headerExtra}
          <button
            type="button"
            className={styles.iconBtn}
            onClick={() => setCollapsed((c) => !c)}
            aria-expanded={!collapsed}
            title={collapsed ? 'Rozbalit' : 'Sbalit'}
          >
            {collapsed ? '▸' : '▾'}
          </button>
        </div>
      </header>

      {!collapsed && <div className={styles.body}>{children}</div>}
    </aside>
  );
}
