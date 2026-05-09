import { Link } from 'react-router-dom';
import { useMyWorlds } from '@/features/world/api/useWorlds';
import { Spinner, Badge } from '@/components/ui';
import styles from './ProfileSections.module.css';

/**
 * 1.3a — read-only readout světů uživatele.
 * Klik na svět = navigace na /svet/:slug.
 * PJ badge: zatím TODO — vyžaduje WorldMembership read (přidá 5.3).
 */
export function WorldsSection() {
  const { data, isPending, isError } = useMyWorlds();

  return (
    <section className={styles.card} aria-label="Moje světy">
      <header className={styles.headerRow}>
        <h2 className={styles.sectionTitle}>Moje světy</h2>
        {data && <Badge variant="accent">{data.length}</Badge>}
      </header>

      {isPending && (
        <div className={styles.empty}>
          <Spinner /> Načítám…
        </div>
      )}
      {isError && (
        <div className={styles.empty}>Nepodařilo se načíst světy.</div>
      )}
      {data && data.length === 0 && (
        <div className={styles.empty}>
          Ještě nejsi součástí žádného světa.
        </div>
      )}
      {data && data.length > 0 && (
        <ul className={styles.worldList}>
          {data.map((w) => (
            <li key={w.id}>
              <Link to={`/svet/${w.slug}`} className={styles.worldLink}>
                <span className={styles.worldName}>{w.name}</span>
                {w.genre && (
                  <span className={styles.worldGenre}>{w.genre}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
