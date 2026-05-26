import { useEffect, useMemo, useRef, useState } from 'react';
import type { UseInfiniteQueryResult } from '@tanstack/react-query';
import { ImageLightbox, type LightboxImage } from '@/shared/ui';
import type { CalendarConfig } from '@/shared/lib/calendarEngine';
import { YearMarker } from './components/YearMarker';
import { TimelineEventCard } from './components/TimelineEventCard';
import type {
  TimelineEventResponse,
  TimelineEventsPage,
} from './api/types';
import s from './TimelineAxis.module.css';

interface Props {
  query: UseInfiniteQueryResult<{ pages: TimelineEventsPage[] }, Error>;
  config: CalendarConfig | null;
  /** 9.3-F-I — všechny calendar configs světa pro DateConversionPopup. */
  allConfigs: CalendarConfig[];
  worldId: string;
  worldSlug: string;
  canManage: boolean;
  onEdit: (eventId: string) => void;
  onDelete: (eventId: string) => void;
}

interface YearGroup {
  year: number;
  events: TimelineEventResponse[];
}

function groupByYear(events: TimelineEventResponse[]): YearGroup[] {
  const groups: YearGroup[] = [];
  let current: YearGroup | null = null;
  for (const e of events) {
    if (!current || current.year !== e.year) {
      current = { year: e.year, events: [] };
      groups.push(current);
    }
    current.events.push(e);
  }
  return groups;
}

/**
 * 9.3 — vertikální osa s year grouping + infinite scroll.
 *
 * Layout:
 * - Desktop ≥1024 px: centrální čára, karty střídavě levo/pravo.
 * - Mobil <1024 px: levý rail, všechny karty napravo.
 *
 * Bottom sentinel observer → `fetchNextPage()` 200 px před koncem.
 */
export function TimelineAxis({
  query,
  config,
  allConfigs,
  worldId,
  worldSlug,
  canManage,
  onEdit,
  onDelete,
}: Props) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const allEvents = useMemo<TimelineEventResponse[]>(
    () => query.data?.pages.flatMap((p) => p.events) ?? [],
    [query.data],
  );

  const groups = useMemo(() => groupByYear(allEvents), [allEvents]);

  const lightboxImages = useMemo<LightboxImage[]>(
    () =>
      allEvents
        .filter((e) => !!e.imageUrl)
        .map((e) => ({ url: e.imageUrl as string, alt: e.title })),
    [allEvents],
  );

  // Map z event.id na index v `lightboxImages` (jen s obrázky).
  const lightboxIndexById = useMemo(() => {
    const map = new Map<string, number>();
    let i = 0;
    for (const e of allEvents) {
      if (e.imageUrl) {
        map.set(e.id, i);
        i++;
      }
    }
    return map;
  }, [allEvents]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const el = sentinelRef.current;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (
            entry.isIntersecting &&
            query.hasNextPage &&
            !query.isFetchingNextPage
          ) {
            void query.fetchNextPage();
          }
        }
      },
      { rootMargin: '200px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [query]);

  if (allEvents.length === 0) return null;

  // Side alternuje napříč všemi events všech groups (zigzag layout).
  // Spočítáme cumulative offset každé group dopředu, side per-event pak je čistá funkce indexu.
  const groupStartIndex: number[] = [];
  {
    let acc = 0;
    for (const g of groups) {
      groupStartIndex.push(acc);
      acc += g.events.length;
    }
  }

  return (
    <>
      <div className={s.axis}>
        <div className={s.line} aria-hidden />
        {groups.map((group, gi) => (
          <div key={group.year} className={s.group}>
            <YearMarker year={group.year} />
            {group.events.map((event, ei) => {
              const cardIndex = groupStartIndex[gi] + ei;
              const side: 'left' | 'right' = cardIndex % 2 === 0 ? 'left' : 'right';
              return (
                <div
                  key={event.id}
                  className={s.node}
                  data-side={side}
                >
                  <div className={s.dot} aria-hidden />
                  <div className={s.cardWrap} data-side={side}>
                    <TimelineEventCard
                      event={event}
                      config={config}
                      allConfigs={allConfigs}
                      worldId={worldId}
                      worldSlug={worldSlug}
                      canManage={canManage}
                      side={side}
                      onEdit={() => onEdit(event.id)}
                      onDelete={() => onDelete(event.id)}
                      onLightbox={() => {
                        const idx = lightboxIndexById.get(event.id);
                        if (idx !== undefined) setLightboxIndex(idx);
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        <div ref={sentinelRef} className={s.sentinel} aria-hidden />

        {query.isFetchingNextPage && (
          <div className={s.loadingMore}>Načítám starší události…</div>
        )}

        {!query.hasNextPage && allEvents.length > 0 && (
          <div className={s.endMarker}>⏳ Konec osy (nejstarší událost)</div>
        )}
      </div>

      {lightboxIndex !== null && (
        <ImageLightbox
          images={lightboxImages}
          index={lightboxIndex}
          onIndexChange={setLightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}
