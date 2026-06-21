import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, Plus } from 'lucide-react';
import { useAtomValue } from 'jotai';
import { IkarosCard, EmptyState, ErrorState } from '@/shared/ui';
import { useUpcomingIkarosEvents } from '@/features/ikaros/api/useIkarosEvents';
import { IkarosEventCard } from '@/features/ikaros/components/IkarosEventCard';
import { IkarosEventModal } from '@/features/ikaros/components/IkarosEventModal';
import { currentUserAtom } from '@/shared/store/authStore';
import { UserRole } from '@/shared/types';
import { SectionHeader } from '../components/SectionHeader';
import s from './IkarosEventsSection.module.css';

export function IkarosEventsSection() {
  // Spec 3.1b — dashboard ukazuje jen 3 akce, zbytek na `/ikaros/akce`.
  const { data, isError, refetch } = useUpcomingIkarosEvents(3);
  const items = data ?? [];
  const currentUser = useAtomValue(currentUserAtom);
  const canCreate =
    currentUser?.role === UserRole.Admin ||
    currentUser?.role === UserRole.Superadmin;
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <IkarosCard
      variant="news"
      header={
        <SectionHeader
          title="Akce"
          icon={<CalendarClock size={20} aria-hidden="true" />}
          action={
            canCreate ? (
              <button
                type="button"
                className={s.addBtn}
                aria-label="Nová akce"
                onClick={() => setCreateOpen(true)}
              >
                <Plus size={18} aria-hidden="true" />
              </button>
            ) : null
          }
        />
      }
    >
      {isError ? (
        <ErrorState
          size="panel"
          title="Nepodařilo se načíst akce."
          onRetry={() => void refetch()}
        />
      ) : items.length === 0 ? (
        <EmptyState
          size="panel"
          illustration="events"
          title="Žádné nadcházející akce"
        />
      ) : (
        <>
          <div className={s.list}>
            {items.map((event) => (
              <IkarosEventCard key={event.id} event={event} />
            ))}
          </div>
          <Link to="/ikaros/akce" className={s.moreLink}>
            Kalendář akcí →
          </Link>
        </>
      )}

      {canCreate && createOpen && (
        <IkarosEventModal open onClose={() => setCreateOpen(false)} />
      )}
    </IkarosCard>
  );
}
