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
import { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import styles from './MapToolDock.module.css';

interface Props {
  /** Titulek v hlavičce (např. „🎨 Efekty"). */
  title: string;
  /** Unikátní klíč pro persist sbaleného stavu (např. „effects" / „view"). */
  storageKey: string;
  /** Výchozí sbalený stav, pokud v LS nic není. */
  defaultCollapsed?: boolean;
  /**
   * 17.13 — opt-in „?" nápověda v hlavičce. Objeví se jen když je předán;
   * ostatní docky (Mlha, Zobrazení) zůstávají beze změny. Klik má
   * `stopPropagation`, takže nepřepne sbalení docku.
   */
  onHelp?: () => void;
  children: React.ReactNode;
}

export function MapToolDock({
  title,
  storageKey,
  defaultCollapsed = false,
  onHelp,
  children,
}: Props): React.ReactElement {
  // v2: dřív se výchozí stav zapisoval do LS hned při mountu (eager) → změna
  // `defaultCollapsed` by se netýkala nikoho, komu se mapa už jednou otevřela.
  // Teď persistujeme JEN při explicitním přepnutí; bump prefixu na `v2` zahodí
  // starý (rozbalený) stav, aby nový default platil i pro vracející se uživatele.
  const lsKey = `ikr-map-tooldock-v2-${storageKey}`;
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return defaultCollapsed;
    const v = localStorage.getItem(lsKey);
    return v === null ? defaultCollapsed : v === '1';
  });

  const toggle = (): void =>
    setCollapsed((v) => {
      const next = !v;
      try {
        localStorage.setItem(lsKey, next ? '1' : '0');
      } catch {
        // ignore
      }
      return next;
    });

  return (
    <div
      className={`${styles.dock} ${collapsed ? styles.dockCollapsed : ''}`}
      role="toolbar"
      aria-label="Nástroje mapy"
    >
      {/* 17.13 — header je `div role=button` (ne `<button>`), aby mohl obsahovat
          vnořené „?" tlačítko (button-in-button je nevalidní). */}
      <div
        className={styles.header}
        onClick={toggle}
        role="button"
        tabIndex={0}
        aria-expanded={!collapsed}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggle();
          }
        }}
        title={collapsed ? 'Rozbalit nástroje' : 'Sbalit nástroje'}
      >
        <span className={styles.headerLabel}>{title}</span>
        <div className={styles.headerActions}>
          {onHelp && (
            <button
              type="button"
              className={styles.help}
              aria-label="Nápověda k panelu"
              title="Nápověda k panelu"
              onClick={(e) => {
                e.stopPropagation();
                onHelp();
              }}
            >
              <HelpCircle size={15} aria-hidden="true" />
            </button>
          )}
          <span className={styles.chevron}>{collapsed ? '▸' : '▾'}</span>
        </div>
      </div>

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
