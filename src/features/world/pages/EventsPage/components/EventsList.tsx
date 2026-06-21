import type { GameEvent, WorldRole } from '@/shared/types';
import { GameEventCard } from '@/features/world/components/GameEventCard/GameEventCard';
import { EmptyState } from '@/shared/ui';
import type { EventsView } from './EventsToolbar';
import s from './EventsList.module.css';

interface Props {
  events: GameEvent[];
  loading: boolean;
  view: EventsView;
  viewerRole: WorldRole;
  worldId: string;
  customGroups: string[];
  groupColors: Record<string, string>;
  /** Otevře modal pro vytvoření nové akce (z empty-state CTA pro PJ+). */
  onCreate?: () => void;
  canCreate: boolean;
}

/**
 * 9.1-I — grid herních akcí + loading skeleton + empty state per role/view.
 */
export function EventsList({
  events,
  loading,
  view,
  viewerRole,
  worldId,
  customGroups,
  groupColors,
  onCreate,
  canCreate,
}: Props) {
  if (loading) {
    return (
      <div className={s.grid} aria-busy="true" aria-label="Načítání akcí">
        {[0, 1, 2].map((i) => (
          <div key={i} className={s.skeleton} aria-hidden="true" />
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    if (view === 'archive') {
      return (
        <EmptyState
          size="hero"
          illustration="events"
          title="Zatím žádná historie"
          description="Až nějaká akce proběhne, najdeš ji tady v archivu."
        />
      );
    }
    return (
      <EmptyState
        size="hero"
        illustration="events"
        title="Žádné nadcházející akce"
        description={
          canCreate
            ? 'Naplánuj první událost a dej družině vědět, kdy se hraje.'
            : 'Vypravěč teprve plánuje. Mrkni sem zase za chvíli.'
        }
        action={
          canCreate && onCreate
            ? { label: 'Naplánovat akci', onClick: onCreate }
            : undefined
        }
      />
    );
  }

  return (
    <div className={s.grid}>
      {events.map((event) => (
        <GameEventCard
          key={event.id}
          event={event}
          viewerRole={viewerRole}
          worldId={worldId}
          customGroups={customGroups}
          groupColors={groupColors}
        />
      ))}
    </div>
  );
}
