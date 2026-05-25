import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { useWorldSettings } from '@/features/world/api/useWorldSettings';
import { useCalendarConfigs } from '@/features/world/api/useCalendarConfigs';
import { WorldRole } from '@/shared/types';
import { Spinner } from '@/shared/ui';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/shared/ui';
import { TimelineToolbar } from './TimelineToolbar';
import { TimelineAxis } from './TimelineAxis';
import { YearScrubber } from './YearScrubber';
import { TimelineEventModal } from './components/TimelineEventModal';
import {
  useDeleteTimelineEvent,
  useInfiniteTimelineEvents,
} from './api/useTimelineEvents';
import { useTimelineYearCounts } from './api/useTimelineYearCounts';
import { getActiveCalendarConfig } from './lib/getActiveCalendarConfig';
import type { TimelineFilters, TimelineSort } from './api/types';
import s from './TimelinePage.module.css';

function parseFiltersFromUrl(params: URLSearchParams): TimelineFilters {
  const fromYear = params.get('fromYear');
  const toYear = params.get('toYear');
  const search = params.get('q');
  const sortRaw = params.get('sort');
  return {
    fromYear: fromYear !== null && fromYear !== '' ? Number(fromYear) : undefined,
    toYear: toYear !== null && toYear !== '' ? Number(toYear) : undefined,
    search: search ?? undefined,
    sort: sortRaw === 'asc' || sortRaw === 'desc' ? (sortRaw as TimelineSort) : 'desc',
  };
}

function filtersToParams(filters: TimelineFilters): URLSearchParams {
  const out = new URLSearchParams();
  if (filters.fromYear !== undefined) out.set('fromYear', String(filters.fromYear));
  if (filters.toYear !== undefined) out.set('toYear', String(filters.toYear));
  if (filters.search) out.set('q', filters.search);
  if (filters.sort && filters.sort !== 'desc') out.set('sort', filters.sort);
  return out;
}

/**
 * 9.3 — `/svet/:worldSlug/timeline` — vertikální historická osa světa.
 *
 * Členové (Hrac+) čtou, PomocnyPJ+ spravuje. Cursor pagination + year scrubber.
 */
export default function TimelinePage() {
  const { worldId, worldSlug, world, userRole, loading: worldLoading } = useWorldContext();
  const { data: settings } = useWorldSettings(worldId);
  const { data: configs } = useCalendarConfigs(worldId);
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => parseFiltersFromUrl(searchParams), [searchParams]);

  const activeConfig = useMemo(
    () =>
      getActiveCalendarConfig(
        configs,
        settings?.timelineCalendarSlug,
        world?.defaultCalendarConfigSlug,
      ),
    [configs, settings?.timelineCalendarSlug, world?.defaultCalendarConfigSlug],
  );

  const eventsQuery = useInfiniteTimelineEvents(worldId, filters);
  const yearCountsQuery = useTimelineYearCounts(worldId);

  const [scrubberOpen, setScrubberOpen] = useState(false);
  const [modalState, setModalState] = useState<
    { mode: 'create' } | { mode: 'edit'; eventId: string } | null
  >(null);
  const [deleteEventId, setDeleteEventId] = useState<string | null>(null);

  const canWrite = (userRole ?? -1) >= WorldRole.PomocnyPJ;
  const hasEvents = (eventsQuery.data?.pages?.[0]?.events.length ?? 0) > 0;
  const deleteMutation = useDeleteTimelineEvent(worldId);

  const allEvents = eventsQuery.data?.pages.flatMap((p) => p.events) ?? [];
  const editingEvent =
    modalState?.mode === 'edit'
      ? allEvents.find((e) => e.id === modalState.eventId)
      : undefined;
  const deletingEvent = deleteEventId
    ? allEvents.find((e) => e.id === deleteEventId)
    : null;

  async function handleConfirmDelete() {
    if (!deleteEventId) return;
    try {
      await deleteMutation.mutateAsync(deleteEventId);
      toast.success('Událost smazána.');
    } catch {
      toast.error('Nepodařilo se smazat událost.');
    } finally {
      setDeleteEventId(null);
    }
  }

  function onFiltersChange(next: TimelineFilters) {
    setSearchParams(filtersToParams(next), { replace: true });
  }

  // Loading orchestrace.
  if (worldLoading) {
    return (
      <div className={s.page}>
        <Spinner />
      </div>
    );
  }

  const noConfigs = configs !== undefined && configs.length === 0;

  return (
    <div className={s.page}>
      <header className={s.header}>
        <h1 className={s.title}>Časová osa</h1>
        <p className={s.subtitle}>
          Historie světa — nejdůležitější události, lidé a místa v chronologickém pořadí.
        </p>
      </header>

      {noConfigs && (
        <div className={s.warningBox} role="alert">
          <p>
            <strong>Tento svět nemá žádný kalendář.</strong> PJ musí nejprve vytvořit kalendář
            v sekci{' '}
            <Link to={`/svet/${worldSlug}/admin/kalendare`}>Admin → Kalendáře</Link>,
            než půjde přidávat události na osu.
          </p>
        </div>
      )}

      <TimelineToolbar
        filters={filters}
        onFiltersChange={onFiltersChange}
        canWrite={canWrite && !noConfigs}
        onAddClick={() => setModalState({ mode: 'create' })}
        onScrubberToggle={() => setScrubberOpen((v) => !v)}
      />

      <div className={s.body}>
        <div className={s.axisColumn}>
          {eventsQuery.isLoading && (
            <div className={s.skeleton} aria-label="Načítám">
              <div className={s.skeletonCard} />
              <div className={s.skeletonCard} />
              <div className={s.skeletonCard} />
            </div>
          )}

          {!eventsQuery.isLoading && !hasEvents && (
            <div className={s.emptyState}>
              {canWrite ? (
                <p>Osa je prázdná. Přidej první událost.</p>
              ) : (
                <p>Osa je zatím prázdná. PJ teprve píše historii.</p>
              )}
            </div>
          )}

          {hasEvents && (
            <TimelineAxis
              query={eventsQuery}
              config={activeConfig}
              allConfigs={configs ?? []}
              worldId={worldId}
              worldSlug={worldSlug}
              canManage={canWrite}
              onEdit={(eventId) => setModalState({ mode: 'edit', eventId })}
              onDelete={(eventId) => setDeleteEventId(eventId)}
            />
          )}
        </div>
        <aside className={s.scrubberColumn}>
          <YearScrubber
            yearCounts={yearCountsQuery.data}
            filters={filters}
            onFiltersChange={onFiltersChange}
          />
        </aside>
      </div>

      {modalState && (
        <TimelineEventModal
          open
          onClose={() => setModalState(null)}
          worldId={worldId}
          config={activeConfig}
          event={editingEvent}
        />
      )}

      <ConfirmDialog
        open={!!deleteEventId}
        title="Smazat událost"
        message={
          deletingEvent
            ? `Smazat událost „${deletingEvent.title}"? Tato akce je nevratná.`
            : 'Smazat tuto událost?'
        }
        confirmLabel="Smazat"
        cancelLabel="Zrušit"
        confirmVariant="danger"
        isPending={deleteMutation.isPending}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteEventId(null)}
      />

      {scrubberOpen && (
        <YearScrubber
          yearCounts={yearCountsQuery.data}
          filters={filters}
          onFiltersChange={onFiltersChange}
          drawerOpen
          onDrawerClose={() => setScrubberOpen(false)}
        />
      )}
    </div>
  );
}
