/**
 * 10.2c — overlay pro hráče když `scene.isHidden=true`.
 *
 * PJ scénu vidí normálně. Hráč: black plachta s textem „MAPA SKRYTÁ".
 * Blokuje všechny pointer eventy — i kdyby pod tím byl interactive token,
 * hráč na něj nedosáhne.
 *
 * Spec: docs/arch/phase-10/spec-10.2c.md §3.4 (PJ vs hráč branching).
 */
import styles from './MapHiddenOverlay.module.css';

export function MapHiddenOverlay(): React.ReactElement {
  return (
    <div className={styles.overlay} role="status" aria-live="polite">
      <div className={styles.icon} aria-hidden="true">
        🚫
      </div>
      <p className={styles.title}>Mapa skrytá</p>
      <p className={styles.subtitle}>
        PJ ještě nepřipravil herní plochu nebo ji dočasně zakryl.
      </p>
    </div>
  );
}
