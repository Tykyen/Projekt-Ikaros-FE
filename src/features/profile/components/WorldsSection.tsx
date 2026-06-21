import { Link } from 'react-router-dom';
import { useMyWorlds } from '@/features/world/api/useWorlds';
import { Spinner, Badge, EmptyState, ErrorState } from '@/shared/ui';
import styles from './ProfileSections.module.css';

/**
 * 1.3a — read-only readout světů uživatele.
 * Klik na svět = navigace na /svet/:slug.
 * PJ badge: zatím TODO — vyžaduje WorldMembership read (přidá 5.3).
 */
export function WorldsSection() {
  const { data, isPending, isError, refetch } = useMyWorlds();

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
        <ErrorState
          size="panel"
          title="Nepodařilo se načíst světy"
          onRetry={() => void refetch()}
        />
      )}
      {data && data.length === 0 && (
        <EmptyState
          size="panel"
          illustration="worlds"
          title="Ještě nejsi součástí žádného světa"
          description="Až tě vypravěč přizve nebo se přidáš, světy se objeví tady."
        />
      )}
      {data && data.length > 0 && (
        <ul className={styles.worldList}>
          {data.map(({ world }) => (
            <li key={world.id}>
              <Link to={`/svet/${world.slug}`} className={styles.worldLink}>
                <span className={styles.worldName}>{world.name}</span>
                {world.genre && (
                  <span className={styles.worldGenre}>{world.genre}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
