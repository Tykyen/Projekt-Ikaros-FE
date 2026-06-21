/**
 * 15.3 — toggle sdíleného pravítka v dock stacku. Hráč i PJ. Když zapnuté,
 * tažení po mapě měří vzdálenost A↔B (vidí všichni přes WS).
 */
import styles from './MapMeasureControls.module.css';

interface Props {
  active: boolean;
  onToggle: () => void;
}

export function MapMeasureControls({
  active,
  onToggle,
}: Props): React.ReactElement {
  return (
    <div className={styles.controls}>
      <button
        type="button"
        className={active ? `${styles.btn} ${styles.btnActive}` : styles.btn}
        onClick={onToggle}
        aria-pressed={active}
        title="Pravítko — táhni z bodu A do B; vzdálenost vidí všichni"
      >
        📏 Pravítko{active ? ' · zap' : ''}
      </button>
    </div>
  );
}
