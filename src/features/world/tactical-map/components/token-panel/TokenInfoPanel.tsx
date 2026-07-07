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
import { type ReactNode, useEffect } from 'react';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { getDiaryPreset } from '@/features/world/pages/CharacterDetailPage/diary-systems/registry';
import { useDiarySkin } from '@/features/world/pages/CharacterDetailPage/diary-systems/skins/useDiarySkin';
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
  /** 17.10 A4 — minimalizace karty do spodní lišty (parent řídí mount). */
  onMinimize?: () => void;
}

// 17.10 A4 — karta má jen 2 módy: 📌 ukotvit vpravo (dock) ↔ 🪟 plovoucí okno
// na pevné pozici (overlay). Drag (volné přetahování) VYŘAZEN (rozhodnutí
// 2026-07-06) — mode 'drag' zůstává v typu, ale NENÍ v MODE_ORDER, takže se
// nikdy nenastaví a drag handlery v headeru (mode === 'drag' ? …) zůstanou
// nečinné (žádné volné přetahování).
const MODE_ORDER: PanelMode[] = ['dock', 'overlay'];
const MODE_ICON: Record<PanelMode, string> = {
  dock: '📌',
  drag: '🪟',
  overlay: '🪟',
};
const MODE_LABEL: Record<PanelMode, string> = {
  dock: 'Ukotvit k pravému okraji',
  drag: 'Volně přesouvat',
  overlay: 'Plovoucí okno',
};

export function TokenInfoPanel({ open, header, children, onMinimize }: Props): React.ReactElement | null {
  const { mode, setMode } = usePanelMode();
  const layout = usePanelLayout();
  // 16.2c-F3 — chrome panelu (badge BODY OSUDU, mode toggle/📌, close, identity)
  // nese DENÍKOVÝ SKIN viewera. Override v CSS je scoped na `[data-diary-system='matrix']`
  // → pro ostatní systémy zůstává mapový motiv (--map-ui-*) beze změny.
  const { world } = useWorldContext();
  const diarySystem = getDiaryPreset(world?.system).id;
  const { skin: diarySkin } = useDiarySkin(world?.id ?? '');

  // 10.2g — v dock módu vystav šířku panelu jako CSS proměnnou na <html>,
  // aby se floating prvky vpravo (paleta efektů, zoom controls) odsunuly
  // doleva vedle deníku a zůstaly viditelné. Cleanup → 0px (zavřeno / drag).
  useEffect(() => {
    const root = document.documentElement;
    // 17.10 A1 — rezervace pravého okraje. Nový název `--map-inset-right`
    // (generalizace); `--map-dock-width` zůstává jako dočasný alias, dokud ho
    // čtenáři (.stack) nepustí. Obě nesou stejnou hodnotu.
    const width = open && mode === 'dock' ? `${layout.width}px` : '0px';
    root.style.setProperty('--map-inset-right', width);
    root.style.setProperty('--map-dock-width', width);
    return () => {
      root.style.setProperty('--map-inset-right', '0px');
      root.style.setProperty('--map-dock-width', '0px');
    };
  }, [open, mode, layout.width]);

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
      {/* 17.10 — overlay = PLOVOUCÍ okno nad viditelnou mapou, BEZ ztmavovacího
          backdropu (dřív modal-like dim přes celou mapu → mapa šedá). Mapa pod
          kartou zůstává vidět i interaktivní; karta se zavírá přes ✕ v hlavičce. */}
      <aside
        className={wrapperClass}
        style={wrapperStyle}
        data-diary-system={diarySystem}
        data-diary-skin={diarySkin}
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

          {/* 17.10 A4 — minimalizace karty do spodní lišty „Zmenšené" */}
          {onMinimize && (
            <button
              type="button"
              className={styles.closeBtn}
              onClick={onMinimize}
              data-no-drag
              aria-label="Zmenšit do lišty"
              title="Zmenšit do lišty"
            >
              —
            </button>
          )}

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

        {/* Akční pruh — oddělený od ovládacího headeru, aby ✕ a mode toggle
            zůstaly vždy v pravém horním rohu a akce mohly zalomit (flex-wrap)
            místo přetékání mimo úzký dock panel. */}
        {header.actions && (
          <div className={styles.actionBar} data-no-drag>{header.actions}</div>
        )}

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
