import { Button } from '../../../components/ui';
import styles from './ProfileSections.module.css';

/**
 * 1.3a — Sekce Účet.
 * Tlačítko „Smazat účet" je disabled (logika přijde v 1.3c — soft delete + tombstone).
 */
export function AccountSection() {
  return (
    <section className={styles.card} aria-label="Účet">
      <header className={styles.headerRow}>
        <h2 className={styles.sectionTitle}>Účet</h2>
      </header>
      <div className={styles.body}>
        <p className={styles.text}>
          Smazání účtu spustí 30denní hold; po něm dojde k trvalému anonymizování
          v komunitních příspěvcích (chat, články, galerie, diskuze zůstanou).
        </p>
        <Button
          type="button"
          variant="danger"
          disabled
          title="Smazání účtu bude dostupné v 1.3c (tombstone + cleanup job)"
        >
          Smazat účet
        </Button>
        <p className={styles.placeholderHint}>
          Bude dostupné v 1.3c.
        </p>
      </div>
    </section>
  );
}
