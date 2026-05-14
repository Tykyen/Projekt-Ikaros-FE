import { useState } from 'react';
import { CalendarClock, Plus } from 'lucide-react';
import { useAtomValue } from 'jotai';
import { IkarosCard } from '@/shared/ui';
import { useUpcomingIkarosEvents } from '@/features/ikaros/api/useIkarosEvents';
import { IkarosEventCard } from '@/features/ikaros/components/IkarosEventCard';
import { IkarosEventModal } from '@/features/ikaros/components/IkarosEventModal';
import { currentUserAtom } from '@/shared/store/authStore';
import { UserRole } from '@/shared/types';
import { SectionHeader } from '../components/SectionHeader';
import s from './IkarosEventsSection.module.css';

export function IkarosEventsSection() {
  const { data, isError } = useUpcomingIkarosEvents(5);
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
        <p className={s.empty}>Nepodařilo se načíst akce.</p>
      ) : items.length === 0 ? (
        <p className={s.empty}>Žádné nadcházející akce.</p>
      ) : (
        <div className={s.list}>
          {items.map((event) => (
            <IkarosEventCard key={event.id} event={event} />
          ))}
        </div>
      )}

      {canCreate && createOpen && (
        <IkarosEventModal open onClose={() => setCreateOpen(false)} />
      )}
    </IkarosCard>
  );
}
