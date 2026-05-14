import { Link } from 'react-router-dom';
import { CalendarClock } from 'lucide-react';
import { IkarosCard } from '@/shared/ui';
import { useUpcomingEventsMine } from '@/features/world/api/useGameEvents';
import { SectionHeader } from '../components/SectionHeader';
import { EventCard } from '../components/EventCard';
import s from './UpcomingEventsSection.module.css';

export function UpcomingEventsSection() {
  const { data, isPending, isError } = useUpcomingEventsMine({ limit: 5 });

  return (
    <IkarosCard
      variant="news"
      header={
        <SectionHeader
          title="Akce"
          icon={<CalendarClock size={20} aria-hidden="true" />}
          action={
            data && data.length > 0 ? (
              <Link to="/ikaros/vesmiry">Zobrazit vše →</Link>
            ) : null
          }
        />
      }
    >
      {isPending && (
        <div className={s.skeleton} aria-label="Načítám akce">
          <div className={s.skeletonRow} />
          <div className={s.skeletonRow} />
        </div>
      )}

      {isError && (
        <p className={s.empty}>Nepodařilo se načíst akce.</p>
      )}

      {data && data.length === 0 && (
        <p className={s.empty}>Žádné nadcházející akce.</p>
      )}

      {data && data.length > 0 && (
        <div className={s.list}>
          {data.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </IkarosCard>
  );
}
