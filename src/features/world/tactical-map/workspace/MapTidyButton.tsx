/**
 * 17.10 A2.3 — „Uklidit mapu" / „Vrátit panely" (toggle).
 *
 * Uklidit = minimalizuje všechny registrované panely do `<MapDock>`; kostky
 * (`DiceRollButton`) nejsou registrovaný panel, takže zůstávají (výjimka je
 * automatická). Vrátit = obnoví minimalizované. Toggle se řídí tím, zda je
 * aspoň jeden ze sledovaných panelů ne-minimalizovaný.
 */
import React from 'react';
import { type PanelId, useMapWorkspace } from './workspaceStore';
import styles from './MapTidyButton.module.css';

interface Props {
  /** Panely, podle nichž se rozhoduje směr toggle (typicky = DOCK_META). */
  panels: readonly { id: PanelId }[];
}

export function MapTidyButton({ panels }: Props): React.ReactElement {
  const { workspace, minimizeAll, restoreAll } = useMapWorkspace();
  const anyOpen = panels.some((p) => workspace[p.id]?.state !== 'minimized');

  return (
    <button
      type="button"
      className={styles.tidy}
      onClick={() => (anyOpen ? minimizeAll() : restoreAll())}
      title={anyOpen ? 'Uklidit mapu — schovat panely dolů' : 'Vrátit panely'}
    >
      {anyOpen ? '✧ Uklidit' : '✦ Vrátit'}
    </button>
  );
}
