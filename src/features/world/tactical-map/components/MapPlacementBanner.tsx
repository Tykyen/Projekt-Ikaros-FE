/**
 * 10.2c-edit-9a — banner pro placement mode (2-step spawn).
 *
 * Fixní top-center nad mapou. Zobrazuje název umisťované entity + Zrušit
 * tlačítko + ESC hint. V multi mode (NPC/Bestie) ukazuje suffix „(opakovaně,
 * ESC = konec)".
 *
 * Plán: docs/arch/phase-10/plan-10.2c-edit-9a.md §3.4.
 */
import type { SpawnPayload } from '../utils/spawnPayload';
import styles from './MapPlacementBanner.module.css';

interface Props {
  payload: SpawnPayload;
  multi: boolean;
  onCancel: () => void;
}

function payloadKindLabel(kind: SpawnPayload['kind']): string {
  switch (kind) {
    case 'pc':
      return 'PC';
    case 'npc':
      return 'NPC';
    case 'bestie':
      return 'Bestie';
  }
}

export function MapPlacementBanner({
  payload,
  multi,
  onCancel,
}: Props): React.ReactElement {
  return (
    <div className={styles.banner} role="status" aria-live="polite">
      <div className={styles.content}>
        <span className={styles.kind}>{payloadKindLabel(payload.kind)}</span>
        <span className={styles.divider}>·</span>
        <span className={styles.title}>
          Klikni na hex pro umístění:{' '}
          <strong className={styles.name}>{payload.name}</strong>
        </span>
        {multi && (
          <span className={styles.hint}>(opakovaně, ESC = konec)</span>
        )}
      </div>
      <button
        type="button"
        className={styles.cancel}
        onClick={onCancel}
        title="Zrušit umístění (ESC)"
      >
        Zrušit
      </button>
    </div>
  );
}
