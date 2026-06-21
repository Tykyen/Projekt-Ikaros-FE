/**
 * 15.4 — ovládání kreslení (dock). Druh kresby + barva + viditelnost + mazání.
 * Viditelné PJ vždy; hráči jen když scéna povolí (`allowPlayerDrawing`).
 */
import { PALETTE_COLORS } from './effects/effectColors';
import type {
  DrawKind,
  DrawingToolState,
} from '../hooks/useDrawingTool';
import styles from './MapDrawingControls.module.css';

const KINDS: { key: Exclude<DrawKind, null>; label: string }[] = [
  { key: 'line', label: '╱ Čára' },
  { key: 'arrow', label: '➤ Šipka' },
  { key: 'circle', label: '◯ Kruh' },
  { key: 'text', label: '🅣 Text' },
];

interface Props {
  tool: DrawingToolState;
  isPJ: boolean;
  onClearMine: () => void;
  onClearAll: () => void;
}

export function MapDrawingControls({
  tool,
  isPJ,
  onClearMine,
  onClearAll,
}: Props): React.ReactElement {
  const { activeKind, setKind, color, setColor, visibility, setVisibility } =
    tool;

  return (
    <div className={styles.wrap}>
      <div className={styles.kinds}>
        {KINDS.map((k) => (
          <button
            key={k.key}
            type="button"
            className={
              activeKind === k.key
                ? `${styles.kindBtn} ${styles.kindBtnActive}`
                : styles.kindBtn
            }
            onClick={() => setKind(activeKind === k.key ? null : k.key)}
          >
            {k.label}
          </button>
        ))}
      </div>

      <div className={styles.colors}>
        {PALETTE_COLORS.map((c) => (
          <button
            key={c.value}
            type="button"
            className={
              color === c.value
                ? `${styles.swatch} ${styles.swatchActive}`
                : styles.swatch
            }
            style={{ backgroundColor: c.dot }}
            onClick={() => setColor(c.value)}
            title={c.label}
            aria-label={c.label}
          />
        ))}
      </div>

      <button
        type="button"
        className={styles.visBtn}
        onClick={() => setVisibility(visibility === 'all' ? 'pj' : 'all')}
        title="Kdo kresbu uvidí"
      >
        {visibility === 'all' ? '👁 Všichni' : '🔒 Jen PJ'}
      </button>

      <div className={styles.clearRow}>
        <button type="button" className={styles.clearBtn} onClick={onClearMine}>
          Smazat moje
        </button>
        {isPJ && (
          <button type="button" className={styles.clearBtn} onClick={onClearAll}>
            Smazat vše
          </button>
        )}
      </div>
    </div>
  );
}
