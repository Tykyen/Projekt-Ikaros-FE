/**
 * 17.10 A1 — `<MapPanel>`: sdílený shell overlay panelů taktické mapy.
 *
 * Obaluje obsah existujících panelů (EffectsPalette, DiceLogPanel, MapPjPanel,
 * …) jednotnou hlavičkou (titul + akce: „?" nápověda / „—" sbalit / „📌" ukotvit
 * / „✕" zavřít) a napojuje jejich stav na `useMapWorkspace` registr. **Obaluje,
 * nepřepisuje** — obsah panelu jde dovnitř jako `children`.
 *
 * A1 = shell + jednotkové testy. Napojení reálných panelů (přesun jejich
 * hlaviček sem) = A2. `minimized` stav vykreslí až `<MapDock>` (A2) jako čip;
 * shell v tom případě nerenderuje nic.
 */
import React from 'react';
import { type PanelId, useMapWorkspace, usePanelState } from './workspaceStore';
import styles from './MapPanel.module.css';

interface Props {
  id: PanelId;
  title: string;
  /** Ikona/emoji v hlavičce. */
  icon?: React.ReactNode;
  /** `chrome` = fialová lišta nástrojů; `game` = herní panel (Hody, Orchestrace). */
  variant?: 'chrome' | 'game';
  /** Kontextová nápověda — zobrazí „?" v hlavičce (17.10: Orchestrace, Efekty). */
  onHelp?: () => void;
  /** Zavření (✕). Bez callbacku se tlačítko nezobrazí. */
  onClose?: () => void;
  /** Ukotvení k okraji (📌). Bez callbacku se tlačítko nezobrazí. */
  onDock?: () => void;
  /** Lze sbalit do rolety (—). Default true. */
  collapsible?: boolean;
  children: React.ReactNode;
}

function cx(...parts: Array<string | false | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export function MapPanel({
  id,
  title,
  icon,
  variant = 'game',
  onHelp,
  onClose,
  onDock,
  collapsible = true,
  children,
}: Props): React.ReactElement | null {
  const { setPanelState } = useMapWorkspace();
  const { state } = usePanelState(id);

  // Minimalizované panely kreslí <MapDock> jako čip (A2) — shell nic nevykreslí.
  if (state === 'minimized') return null;

  const collapsed = state === 'collapsed';

  return (
    <section
      className={cx(styles.panel, styles[variant], collapsed && styles.collapsed)}
      aria-label={title}
    >
      <header className={styles.header}>
        {icon != null && (
          <span className={styles.icon} aria-hidden="true">
            {icon}
          </span>
        )}
        <span className={styles.title}>{title}</span>
        {onHelp && (
          <button
            type="button"
            className={cx(styles.action, styles.help)}
            onClick={onHelp}
            title={`Nápověda: ${title}`}
            aria-label={`Nápověda: ${title}`}
          >
            ?
          </button>
        )}
        {collapsible && (
          <button
            type="button"
            className={styles.action}
            onClick={() => setPanelState(id, collapsed ? 'open' : 'collapsed')}
            title={collapsed ? 'Rozbalit' : 'Sbalit'}
            aria-label={collapsed ? 'Rozbalit' : 'Sbalit'}
            aria-expanded={!collapsed}
          >
            —
          </button>
        )}
        {onDock && (
          <button
            type="button"
            className={styles.action}
            onClick={onDock}
            title="Ukotvit k okraji"
            aria-label="Ukotvit k okraji"
          >
            📌
          </button>
        )}
        {onClose && (
          <button
            type="button"
            className={cx(styles.action, styles.close)}
            onClick={onClose}
            title="Zavřít"
            aria-label="Zavřít"
          >
            ✕
          </button>
        )}
      </header>
      {!collapsed && <div className={styles.body}>{children}</div>}
    </section>
  );
}
