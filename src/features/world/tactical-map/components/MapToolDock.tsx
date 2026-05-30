/**
 * 10.2g — sbalitelný dock nástrojů mapy (jeden panel s vlastní hlavičkou).
 * Použito ve dvou kategoriích: nástroje kreslení na mapu (efekty; později mlha)
 * a ovládání zobrazení (zoom; později další). Každý dock má vlastní titulek a
 * nezávislý sbalený stav (persist v localStorage pod `storageKey`).
 *
 * Sám NEpozicuje — sází se ve `MapToolDock` stacku (`MapDockStack`), který je
 * vpravo dole a stackuje docky pod sebe (flex-column řeší proměnnou výšku při
 * sbalení bez překryvu).
 */
import { useEffect, useState } from 'react';
import styles from './MapToolDock.module.css';

interface Props {
  /** Titulek v hlavičce (např. „🎨 Efekty"). */
  title: string;
  /** Unikátní klíč pro persist sbaleného stavu (např. „effects" / „view"). */
  storageKey: string;
  /** Výchozí sbalený stav, pokud v LS nic není. */
  defaultCollapsed?: boolean;
  children: React.ReactNode;
}

export function MapToolDock({
  title,
  storageKey,
  defaultCollapsed = false,
  children,
}: Props): React.ReactElement {
  const lsKey = `ikr-map-tooldock-${storageKey}`;
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return defaultCollapsed;
    const v = localStorage.getItem(lsKey);
    return v === null ? defaultCollapsed : v === '1';
  });

  useEffect(() => {
    try {
      localStorage.setItem(lsKey, collapsed ? '1' : '0');
    } catch {
      // ignore
    }
  }, [lsKey, collapsed]);

  return (
    <div
      className={`${styles.dock} ${collapsed ? styles.dockCollapsed : ''}`}
      role="toolbar"
      aria-label="Nástroje mapy"
    >
      <button
        type="button"
        className={styles.header}
        onClick={() => setCollapsed((v) => !v)}
        aria-expanded={!collapsed}
        title={collapsed ? 'Rozbalit nástroje' : 'Sbalit nástroje'}
      >
        <span className={styles.headerLabel}>{title}</span>
        <span className={styles.chevron}>{collapsed ? '▸' : '▾'}</span>
      </button>

      {!collapsed && <div className={styles.body}>{children}</div>}
    </div>
  );
}

/**
 * Kontejner pro docky vpravo dole — naskládá je pod sebe (flex-column) bez
 * překryvu a řeší odsazení od otevřeného deníku.
 */
export function MapDockStack({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return <div className={styles.stack}>{children}</div>;
}
