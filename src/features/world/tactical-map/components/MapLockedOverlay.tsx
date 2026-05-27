/**
 * 10.2c — pulse banner pro hráče, když `scene.isLocked=true`.
 *
 * PJ banner nevidí (operuje normálně). Hráč ho vidí jako vizuální
 * upozornění: „PJ zastavil hru, nemůžeš teď hýbat tokeny." Mechanika
 * zákazu pohybů je BE side (assertCanDo gate v 10.2d), tady jen UI signál.
 *
 * Banner je pointer-events: none — neblokuje, jen informuje.
 *
 * Spec: docs/arch/phase-10/spec-10.2c.md §3.4.
 */
import styles from './MapLockedOverlay.module.css';

export function MapLockedOverlay(): React.ReactElement {
  return (
    <div className={styles.banner} role="status" aria-live="polite">
      <span className={styles.icon} aria-hidden="true">
        🔒
      </span>
      <span>Hra zastavena</span>
    </div>
  );
}
