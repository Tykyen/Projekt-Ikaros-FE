import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Modal, Button, Spinner } from '@/shared/ui';
import type { GameEvent } from '@/shared/types';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { useAllWorldGameEvents } from '@/features/world/api/useGameEvents';
import {
  buildMonthGrid,
  dayKey,
  isSameDay,
  WEEKDAY_LABELS,
} from '@/shared/lib/calendarGrid';
import { WorldEventCard } from './WorldDashboardPage/WorldDashboard/components/WorldEventCard';
import s from './CalendarPage.module.css';

function formatTime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Spec 5.5c — kalendář akcí světa (`/svet/:worldSlug/kalendar`). Desktop =
 * měsíční mřížka (minulé i budoucí akce), mobil ≤768px = seznam
 * (nadcházející / proběhlé). Klik na akci → detail v modalu. Předloha:
 * globální `AkcePage`. Tvorba akcí = fáze 9 (mimo rozsah).
 */
export default function CalendarPage() {
  const { worldId, loading } = useWorldContext();
  const { data: events = [], isError, isLoading } =
    useAllWorldGameEvents(worldId);

  const today = new Date();
  const [cursor, setCursor] = useState(() => ({
    year: today.getFullYear(),
    month: today.getMonth(),
  }));
  const [selected, setSelected] = useState<GameEvent | null>(null);

  const grid = useMemo(
    () => buildMonthGrid(cursor.year, cursor.month),
    [cursor],
  );

  const eventsByDay = useMemo(() => {
    const map = new Map<string, GameEvent[]>();
    for (const ev of events) {
      const k = dayKey(new Date(ev.date));
      const arr = map.get(k) ?? [];
      arr.push(ev);
      map.set(k, arr);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => +new Date(a.date) - +new Date(b.date));
    }
    return map;
  }, [events]);

  // Mobilní fallback — seznam nadcházející / proběhlé.
  const nowMs = today.getTime();
  const upcoming = events
    .filter((ev) => +new Date(ev.date) >= nowMs)
    .sort((a, b) => +new Date(a.date) - +new Date(b.date));
  const past = events
    .filter((ev) => +new Date(ev.date) < nowMs)
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));

  function shiftMonth(delta: number) {
    setCursor((c) => {
      const d = new Date(c.year, c.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  function goToday() {
    const n = new Date();
    setCursor({ year: n.getFullYear(), month: n.getMonth() });
  }

  const monthLabel = new Date(cursor.year, cursor.month).toLocaleDateString(
    'cs-CZ',
    { month: 'long', year: 'numeric' },
  );

  if (loading) return <Spinner center />;

  return (
    <article className={s.page}>
      <header className={s.header}>
        <h1 className={s.title}>Kalendář akcí</h1>
      </header>

      <div className={s.toolbar}>
        <button
          type="button"
          className={s.navBtn}
          onClick={() => shiftMonth(-1)}
          aria-label="Předchozí měsíc"
        >
          <ChevronLeft size={18} aria-hidden="true" />
        </button>
        <span className={s.monthLabel}>{monthLabel}</span>
        <button
          type="button"
          className={s.navBtn}
          onClick={() => shiftMonth(1)}
          aria-label="Další měsíc"
        >
          <ChevronRight size={18} aria-hidden="true" />
        </button>
        <Button variant="ghost" size="sm" onClick={goToday}>
          Dnes
        </Button>
      </div>

      {isError ? (
        <p className={s.empty}>Nepodařilo se načíst akce.</p>
      ) : isLoading ? (
        <p className={s.empty}>Načítám…</p>
      ) : (
        <>
          <div
            className={s.grid}
            role="grid"
            aria-label={`Kalendář ${monthLabel}`}
          >
            {WEEKDAY_LABELS.map((w) => (
              <div key={w} className={s.weekday}>
                {w}
              </div>
            ))}
            {grid.map((day) => {
              const inMonth = day.getMonth() === cursor.month;
              const dayEvents = eventsByDay.get(dayKey(day)) ?? [];
              return (
                <div
                  key={dayKey(day)}
                  className={s.cell}
                  data-outside={!inMonth}
                  data-today={isSameDay(day, today)}
                >
                  <span className={s.dayNum}>{day.getDate()}</span>
                  {dayEvents.map((ev) => (
                    <button
                      key={ev.id}
                      type="button"
                      className={s.eventChip}
                      onClick={() => setSelected(ev)}
                      title={ev.title}
                    >
                      <span className={s.chipTime}>
                        {formatTime(ev.date)}
                      </span>
                      <span className={s.chipTitle}>{ev.title}</span>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>

          <div className={s.mobileList}>
            <h2 className={s.listHeading}>Nadcházející</h2>
            {upcoming.length === 0 ? (
              <p className={s.empty}>Žádné nadcházející akce.</p>
            ) : (
              upcoming.map((ev) => <WorldEventCard key={ev.id} event={ev} />)
            )}
            <h2 className={s.listHeading}>Proběhlé</h2>
            {past.length === 0 ? (
              <p className={s.empty}>Žádné proběhlé akce.</p>
            ) : (
              past.map((ev) => <WorldEventCard key={ev.id} event={ev} />)
            )}
          </div>
        </>
      )}

      {selected && (
        <Modal
          open
          onClose={() => setSelected(null)}
          title="Detail akce"
          size="md"
        >
          <WorldEventCard event={selected} />
          {selected.description && (
            <p className={s.detailDesc}>{selected.description}</p>
          )}
        </Modal>
      )}
    </article>
  );
}
