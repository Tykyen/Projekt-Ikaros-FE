/**
 * 17.10 A2 — `<MapDock>`: spodní lišta „Zmenšené".
 *
 * Vykresluje minimalizované panely jako čipy; klik = nahodí (state →
 * `collapsed`). Objeví se jen když je aspoň jeden panel minimalizovaný
 * (rozhodnutí: nezabírat plochu prázdná). Metadata čipů (titul + ikona) dodává
 * konzument (`TacticalMapView`), protože registr drží jen stav, ne popisky.
 */
import React, { useLayoutEffect, useRef } from 'react';
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
  const ref = useRef<HTMLDivElement>(null);
  const minimized = panels.filter((p) => workspace[p.id]?.state === 'minimized');

  // 17.10 A2 fix — vystav výšku lišty jako --map-inset-bottom, aby se panely
  // dole (Hody/Orchestrace vlevo, nástroje/kostky vpravo) posunuly nad ni a
  // lišta je nepřekrývala. Prázdná lišta = 0.
  useLayoutEffect(() => {
    const root = document.documentElement;
    const h = minimized.length > 0 ? (ref.current?.offsetHeight ?? 0) : 0;
    root.style.setProperty('--map-inset-bottom', `${h}px`);
    return () => root.style.setProperty('--map-inset-bottom', '0px');
  }, [minimized.length]);

  if (minimized.length === 0) return null;

  return (
    <div ref={ref} className={styles.dock} role="toolbar" aria-label="Zmenšené panely">
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
