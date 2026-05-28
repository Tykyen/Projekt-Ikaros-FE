/**
 * 10.2c-edit-9g — Token info panel (3-mode side panel).
 *
 * Nahrazuje TokenStatbarModal (modal byl chybný design, blokoval mapu).
 * 3 módy mirror Matrix `CharacterDiary.tsx`:
 *   - `dock` — fixed right side, resize handle vlevo
 *   - `drag` — absolute, draggable přes header
 *   - `overlay` — centered (mobile force / fallback)
 *
 * Render struktura:
 *   <aside>
 *     <header pointerHandlers>
 *       avatar | name + Body osudu | actions | mode toggle | close
 *     </header>
 *     <body>{children}</body>
 *     {dock && <resizeHandle>}
 *   </aside>
 *
 * Plán: docs/arch/phase-10/plan-10.2c-edit-9g.md §A.
 */
import { type ReactNode } from 'react';
import { usePanelMode, type PanelMode } from '../../hooks/usePanelMode';
import { usePanelLayout } from '../../hooks/usePanelLayout';
import styles from './TokenInfoPanel.module.css';

export interface TokenInfoPanelHeaderProps {
  avatar?: string;
  name: string;
  /** Volitelné tag/info vlevo od jména (např. „BODY OSUDU: 2"). */
  badge?: ReactNode;
  /** Volitelné rychlé akce vpravo (např. Odstranit z mapy). */
  actions?: ReactNode;
  onClose: () => void;
}

interface Props {
  open: boolean;
  header: TokenInfoPanelHeaderProps;
  children: ReactNode;
}

const MODE_ORDER: PanelMode[] = ['dock', 'drag', 'overlay'];
const MODE_ICON: Record<PanelMode, string> = {
  dock: '📌',
  drag: '🪟',
  overlay: '🗖',
};
const MODE_LABEL: Record<PanelMode, string> = {
  dock: 'Ukotvit k pravému okraji',
  drag: 'Volně přesouvat',
  overlay: 'Vystředit',
};

export function TokenInfoPanel({ open, header, children }: Props): React.ReactElement | null {
  const { mode, setMode } = usePanelMode();
  const layout = usePanelLayout();

  if (!open) return null;

  // Per-mode styling
  const wrapperClass = [
    styles.panel,
    mode === 'dock' && styles.modeDock,
    mode === 'drag' && styles.modeDrag,
    mode === 'overlay' && styles.modeOverlay,
    layout.isDragging && styles.dragging,
  ]
    .filter(Boolean)
    .join(' ');

  const wrapperStyle: React.CSSProperties =
    mode === 'drag'
      ? {
          transform: `translate(calc(-50% + ${layout.position.x}px), calc(-50% + ${layout.position.y}px))`,
          transition: layout.isDragging ? 'none' : 'transform 0.12s',
        }
      : mode === 'dock'
        ? { width: layout.width }
        : {};

  return (
    <>
      {/* Overlay mode má backdrop (klik = close) */}
      {mode === 'overlay' && (
        <div
          className={styles.overlayBackdrop}
          onClick={header.onClose}
        />
      )}

      <aside
        className={wrapperClass}
        style={wrapperStyle}
        role="dialog"
        aria-label={`Detail tokenu: ${header.name}`}
      >
        {/* Resize handle (jen dock mode, na levé hraně) */}
        {mode === 'dock' && (
          <div
            className={styles.resizeHandle}
            onPointerDown={layout.onResizeStart}
            title="Změnit šířku panelu (drag)"
            aria-label="Změnit šířku panelu"
          />
        )}

        <header
          className={styles.header}
          onPointerDown={mode === 'drag' ? layout.onDragStart : undefined}
          onPointerMove={mode === 'drag' ? layout.onDragMove : undefined}
          onPointerUp={mode === 'drag' ? layout.onDragEnd : undefined}
          style={{ cursor: mode === 'drag' ? (layout.isDragging ? 'grabbing' : 'grab') : 'default' }}
        >
          {/* Badge (např. BODY OSUDU) */}
          {header.badge && <div className={styles.badge} data-no-drag>{header.badge}</div>}

          {/* Spacer push */}
          <div className={styles.headerSpacer} />

          {/* Actions */}
          {header.actions && (
            <div className={styles.actions} data-no-drag>{header.actions}</div>
          )}

          {/* Mode toggle */}
          <div className={styles.modeToggle} data-no-drag>
            {MODE_ORDER.map((m) => (
              <button
                key={m}
                type="button"
                className={`${styles.modeBtn} ${mode === m ? styles.modeBtnActive : ''}`}
                onClick={() => setMode(m)}
                title={MODE_LABEL[m]}
                aria-label={MODE_LABEL[m]}
                aria-pressed={mode === m}
              >
                {MODE_ICON[m]}
              </button>
            ))}
          </div>

          {/* Close */}
          <button
            type="button"
            className={styles.closeBtn}
            onClick={header.onClose}
            data-no-drag
            aria-label="Zavřít panel"
            title="Zavřít"
          >
            ×
          </button>
        </header>

        {/* Avatar + jméno blok pod headerem */}
        <div className={styles.identity}>
          <div className={styles.avatar}>
            {header.avatar ? (
              <img src={header.avatar} alt={header.name} />
            ) : (
              <div className={styles.avatarFallback}>
                {header.name.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <h2 className={styles.name}>{header.name}</h2>
        </div>

        <div className={styles.body}>{children}</div>
      </aside>
    </>
  );
}
