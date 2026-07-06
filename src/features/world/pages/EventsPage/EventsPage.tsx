import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { WorldRole } from '@/shared/types';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { useWorldSettings } from '@/features/world/api/useWorldSettings';
import {
  useUpcomingGameEvents,
  useArchiveGameEvents,
} from '@/features/world/api/useGameEvents';
import { GameEventModal } from '@/features/world/components/GameEventModal/GameEventModal';
import {
  EventsToolbar,
  type EventsView,
} from './components/EventsToolbar';
import { EventsList } from './components/EventsList';
import s from './EventsPage.module.css';

/**
 * 9.1-I — stránka /svet/:worldSlug/akce.
 *
 * URL state: `?view=upcoming|archive&group=<name>`. Hráč nemá tab Archiv —
 * při ručním `?view=archive` se replacuje na `upcoming`.
 */
export default function EventsPage() {
  const { worldId, userRole, world, loading: worldLoading } = useWorldContext();
  // Elevation — nahozený admin dostává plnou PJ moc v tomto světě; `viewerRole`
  // se předává i do `EventsToolbar`/`EventsList`/`GameEventCard`, takže OR
  // stačí zavést tady jednou.
  const isElevatedHere = world?.elevated === true;
  const viewerRole = isElevatedHere
    ? WorldRole.PJ
    : (userRole ?? WorldRole.Zadatel);
  const settingsQ = useWorldSettings(worldId);
  const customGroups = settingsQ.data?.customGroups ?? [];
  const groupColors = settingsQ.data?.groupColors ?? {};

  const [searchParams, setSearchParams] = useSearchParams();
  const viewParam = searchParams.get('view');
  const groupParam = searchParams.get('group') ?? '';
  const view: EventsView = viewParam === 'archive' ? 'archive' : 'upcoming';

  // Hráč nesmí archiv — silent redirect na upcoming (spec §8.2).
  useEffect(() => {
    if (view === 'archive' && viewerRole < WorldRole.PomocnyPJ) {
      const next = new URLSearchParams(searchParams);
      next.set('view', 'upcoming');
      setSearchParams(next, { replace: true });
    }
  }, [view, viewerRole, searchParams, setSearchParams]);

  const upcomingQ = useUpcomingGameEvents(worldId);
  const archiveQ = useArchiveGameEvents(worldId, viewerRole);

  const activeQ = view === 'archive' ? archiveQ : upcomingQ;

  // Klient-side group filter (spec §6 — group filter v toolbaru)
  const filteredEvents = useMemo(() => {
    const data = activeQ.data ?? [];
    if (!groupParam) return data;
    return data.filter((e) => e.targetGroup === groupParam);
  }, [activeQ.data, groupParam]);

  const [createOpen, setCreateOpen] = useState(false);

  function setView(v: EventsView) {
    const next = new URLSearchParams(searchParams);
    if (v === 'upcoming') next.delete('view');
    else next.set('view', v);
    setSearchParams(next, { replace: true });
  }

  function setGroup(g: string) {
    const next = new URLSearchParams(searchParams);
    if (!g) next.delete('group');
    else next.set('group', g);
    setSearchParams(next, { replace: true });
  }

  const canCreate = viewerRole >= WorldRole.PomocnyPJ;
  const loading = worldLoading || activeQ.isLoading;

  return (
    <div className={s.page}>
      <header className={s.header}>
        <h1 className={s.title}>Akce</h1>
        <p className={s.subtitle}>
          {view === 'archive'
            ? 'Archiv proběhlých akcí (starší 24 h)'
            : 'Nadcházející akce světa'}
        </p>
      </header>

      <EventsToolbar
        viewerRole={viewerRole}
        view={view}
        onViewChange={setView}
        groupFilter={groupParam}
        onGroupFilterChange={setGroup}
        customGroups={customGroups}
        groupColors={groupColors}
        onCreate={() => setCreateOpen(true)}
      />

      <EventsList
        events={filteredEvents}
        loading={loading}
        view={view}
        viewerRole={viewerRole}
        worldId={worldId}
        customGroups={customGroups}
        groupColors={groupColors}
        onCreate={() => setCreateOpen(true)}
        canCreate={canCreate}
      />

      {createOpen && canCreate && (
        <GameEventModal
          open
          onClose={() => setCreateOpen(false)}
          worldId={worldId}
          customGroups={customGroups}
          groupColors={groupColors}
        />
      )}
    </div>
  );
}
