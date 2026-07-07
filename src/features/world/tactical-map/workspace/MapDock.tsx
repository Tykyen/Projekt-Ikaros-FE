/**
 * 17.10 A2 — `<MapDock>`: spodní lišta „Zmenšené".
 *
 * Vykresluje minimalizované panely jako čipy; klik = nahodí (state →
 * `collapsed`). Objeví se jen když je aspoň jeden panel minimalizovaný
 * (rozhodnutí: nezabírat plochu prázdná). Metadata čipů (titul + ikona) dodává
 * konzument (`TacticalMapView`), protože registr drží jen stav, ne popisky.
 */
import React from 'react';
import { type PanelId, useMapWorkspace } from './workspaceStore';
import styles from './MapDock.module.css';

export interface DockPanelMeta {
  id: PanelId;
  title: string;
  icon?: React.ReactNode;
}

interface Props {
  /** Panely, které lze minimalizovat (pořadí = pořadí čipů v liště). */
  panels: readonly DockPanelMeta[];
}

export function MapDock({ panels }: Props): React.ReactElement | null {
  const { workspace, setPanelState } = useMapWorkspace();
  const minimized = panels.filter((p) => workspace[p.id]?.state === 'minimized');

  if (minimized.length === 0) return null;

  return (
    <div className={styles.dock} role="toolbar" aria-label="Zmenšené panely">
      <span className={styles.label}>Zmenšené</span>
      {minimized.map((p) => (
        <button
          key={p.id}
          type="button"
          className={styles.chip}
          onClick={() => setPanelState(p.id, 'collapsed')}
          title={`Nahodit: ${p.title}`}
        >
          {p.icon != null && (
            <span className={styles.dot} aria-hidden="true">
              {p.icon}
            </span>
          )}
          {p.title}
        </button>
      ))}
    </div>
  );
}
