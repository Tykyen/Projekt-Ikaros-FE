import styles from './ProfileSections.module.css';

/**
 * Placeholder sekce „Přátelé" v profilu (pod osobní kartou).
 * Reálná funkčnost (friend requests, list, online stav) přijde ve fázi 3.
 */
export function FriendsPlaceholder() {
  return (
    <section id="pratele" className={styles.card} aria-label="Přátelé">
      <header className={styles.headerRow}>
        <h2 className={styles.sectionTitle}>Přátelé</h2>
      </header>
      <div className={styles.empty}>
        <p>Tvoji přátelé a žádosti o přátelství.</p>
        <p className={styles.placeholderHint}>
          Bude dostupné v dalším updatu (fáze 3).
        </p>
      </div>
    </section>
  );
}
