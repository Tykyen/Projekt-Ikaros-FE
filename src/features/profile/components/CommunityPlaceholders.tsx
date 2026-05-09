import styles from './ProfileSections.module.css';

const SECTIONS = [
  { title: 'Moje diskuze', detail: 'Diskuze, které jsi založil/a' },
  { title: 'Moje články', detail: 'Články, které jsi napsal/a (s hodnocením)' },
  { title: 'Moje galerie', detail: 'Obrázky v galerii (s hodnocením)' },
] as const;

/**
 * 1.3a — placeholder sekce pro 3.x (komunita). Zatím prázdné karty
 * s hláškou „Bude dostupné v dalším updatu". Žádné requesty.
 */
export function CommunityPlaceholders() {
  return (
    <>
      {SECTIONS.map((s) => (
        <section
          key={s.title}
          className={styles.card}
          aria-label={s.title}
        >
          <header className={styles.headerRow}>
            <h2 className={styles.sectionTitle}>{s.title}</h2>
          </header>
          <div className={styles.empty}>
            <p>{s.detail}</p>
            <p className={styles.placeholderHint}>
              Bude dostupné v dalším updatu (fáze 3).
            </p>
          </div>
        </section>
      ))}
    </>
  );
}
