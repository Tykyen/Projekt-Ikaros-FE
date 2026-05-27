/**
 * 10.2a — floating zoom + fullscreen controls panel.
 *
 * Pozice bottom-right plátna. Tlačítka:
 *   - `+` / `-` — zoom in/out (centered anchor, viz useViewportPanZoom.setZoom)
 *   - `100%` — reset zoom + offset
 *   - `⛶` / `⊗` — fullscreen toggle (HTML Fullscreen API na viewport elementu)
 *
 * Pro pozdější podkroky se sem přidají další: fog perf toggle (10.2h),
 * dice toggle (10.2j), atd.
 *
 * Spec: docs/arch/phase-10/spec-10.2a.md §5 (MapZoomControls).
 */
import { useCallback, useEffect, useState, type RefObject } from 'react';
import styles from './MapZoomControls.module.css';

interface Props {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  /** Element, který se má fullscreen-ovat (typicky viewport wrapper). */
  fullscreenTargetRef: RefObject<HTMLElement | null>;
}

export function MapZoomControls({
  zoom,
  onZoomIn,
  onZoomOut,
  onReset,
  fullscreenTargetRef,
}: Props): React.ReactElement {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sleduj externí změnu fullscreen state (uživatel zmáčkne Escape)
  useEffect(() => {
    const onFsChange = (): void => {
      setIsFullscreen(document.fullscreenElement !== null);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const el = fullscreenTargetRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => {
        /* user denied — ignore */
      });
    } else {
      void el.requestFullscreen().catch(() => {
        /* user denied — ignore */
      });
    }
  }, [fullscreenTargetRef]);

  const zoomPct = Math.round(zoom * 100);

  return (
    <div className={styles.controls} role="toolbar" aria-label="Ovládání mapy">
      <button
        type="button"
        className={styles.btn}
        onClick={onZoomIn}
        aria-label="Přiblížit"
        title="Přiblížit (Ctrl+koleso nahoru)"
      >
        +
      </button>
      <button
        type="button"
        className={styles.btn}
        onClick={onZoomOut}
        aria-label="Oddálit"
        title="Oddálit (Ctrl+koleso dolů)"
      >
        −
      </button>
      <button
        type="button"
        className={`${styles.btn} ${styles.btnReset}`}
        onClick={onReset}
        aria-label="Reset zoom"
        title="Reset 100 %"
      >
        100%
      </button>
      <button
        type="button"
        className={styles.btn}
        onClick={toggleFullscreen}
        aria-label={isFullscreen ? 'Opustit celou obrazovku' : 'Celá obrazovka'}
        title={isFullscreen ? 'Opustit celou obrazovku (Esc)' : 'Celá obrazovka'}
      >
        {isFullscreen ? '⊗' : '⛶'}
      </button>
      <div className={styles.zoomDisplay} aria-live="polite">
        {zoomPct}%
      </div>
    </div>
  );
}
