/**
 * 10.2n — sbalitelná sekce spawn palety (PC / NPC / Bestiář).
 *
 * Hlavička = klikací řádek (chevron + název + počet aktivních). Tělo se při
 * sbalení **neodmountuje** (jen skryje přes CSS) — paleta uvnitř drží query
 * živé a může hlásit `count` i ve sbaleném stavu. Otevřený stav per sekce
 * v localStorage (`ikr-map-pal-{id}`), default sbalené.
 */
import { useState } from 'react';
import styles from './PaletteAccordion.module.css';

interface Props {
  /** Stabilní id pro LS klíč (`pc` / `npc` / `bestie`). */
  id: string;
  title: string;
  /** Počet aktivních entit — chip v hlavičce (viditelný i ve sbaleném stavu). */
  count?: number;
  children: React.ReactNode;
}

export function PaletteAccordion({
  id,
  title,
  count,
  children,
}: Props): React.ReactElement {
  const lsKey = `ikr-map-pal-${id}`;
  const [open, setOpen] = useState<boolean>(() => {
    try {
      return localStorage.getItem(lsKey) === '1';
    } catch {
      return false;
    }
  });

  const toggle = (): void => {
    setOpen((v) => {
      const next = !v;
      try {
        localStorage.setItem(lsKey, next ? '1' : '0');
      } catch {
        /* private mode — collapse je čistě UI, ignoruj */
      }
      return next;
    });
  };

  return (
    <div className={styles.accordion}>
      <button
        type="button"
        className={styles.header}
        onClick={toggle}
        aria-expanded={open}
      >
        <span className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}>
          ▸
        </span>
        <span className={styles.title}>{title}</span>
        {count !== undefined && <span className={styles.count}>{count}</span>}
      </button>
      <div className={`${styles.body} ${open ? '' : styles.bodyCollapsed}`}>
        {children}
      </div>
    </div>
  );
}
