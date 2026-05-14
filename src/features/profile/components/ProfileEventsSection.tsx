import { Link } from 'react-router-dom';
import { useUpcomingEventsMine } from '@/features/world/api/useGameEvents';
import { EventCard } from '@/features/ikaros/pages/DashboardPage/components/EventCard';
import { Spinner } from '@/shared/ui';
import styles from './ProfileSections.module.css';

/**
 * Cross-world agregátor blížících se herních akcí napříč světy uživatele.
 * Přesun z dashboardu (2.1) v rámci 2.1b — globální vs. světové oddělení.
 */
export function ProfileEventsSection() {
  const { data, isPending, isError } = useUpcomingEventsMine({ limit: 5 });
  const items = data ?? [];

  return (
    <section
      className={styles.card}
      aria-label="Moje blížící se akce ve světech"
    >
      <header className={styles.headerRow}>
        <h2 className={styles.sectionTitle}>Moje akce ve světech</h2>
        {items.length > 0 && (
          <Link to="/ikaros/vesmiry" className={styles.headerLink}>
            Zobrazit vše →
          </Link>
        )}
      </header>

      {isPending && (
        <div className={styles.empty}>
          <Spinner /> Načítám…
        </div>
      )}
      {isError && (
        <div className={styles.empty}>Nepodařilo se načíst akce.</div>
      )}
      {!isPending && !isError && items.length === 0 && (
        <div className={styles.empty}>
          Žádné nadcházející akce ve tvých světech.
        </div>
      )}
      {items.length > 0 && (
        <div className={styles.eventList}>
          {items.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </section>
  );
}
