import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Modal, Spinner } from '@/shared/ui';
import { PrintButton, usePrintMode } from '@/features/world/export/print';
import {
  GREGORIAN_DEFAULT_CONFIG,
  expandEventDays,
  fantasyDayKey,
  formatFantasyDate,
  fromAbsDay,
  generateMonthGrid,
  toAbsDay,
  type CalendarConfig,
  type FantasyDate,
} from '@/shared/lib/calendarEngine';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { useAllWorldGameEvents } from '@/features/world/api/useGameEvents';
import { useCalendarConfigs } from '@/features/world/api/useCalendarConfigs';
import { useWorldSettings } from '@/features/world/api/useWorldSettings';
import {
  useCalendarsAggregate,
  type AggregatedCalendarEvent,
} from '@/features/world/api/useCalendarsAggregate';
import { useSetCalendarColor } from '@/features/world/pages/api/useCharacterMutations';
import { usePersistedCalendarCursor } from '@/features/world/hooks/usePersistedCalendarCursor';
import { resolveCalendarColor } from '@/shared/lib/calendarColor';
import { GroupColorPicker } from '@/features/world/chat/components/GroupColorPicker';
import type { GameEvent } from '@/shared/types';
import { useDensity } from './CalendarPage/hooks/useDensity';
import { EventDensityToggle } from './CalendarPage/components/EventDensityToggle';
import { DayDetailDrawer, type DrawerEvent } from './CalendarPage/components/DayDetailDrawer';
import { EntityFilterTree } from './CalendarPage/components/EntityFilterTree';
import { useEntityIndex, type EntityGroup } from './CalendarPage/hooks/useEntityIndex';
import { CalendarCell } from './CalendarPage/components/CalendarCell';
import s from './CalendarPage.module.css';

interface UnifiedEvent {
  id: string;
  title: string;
  /** První den eventu — pro lookup primary chipu. */
  date: FantasyDate;
  /** Volitelný end pro multi-day expand. */
  endDate?: FantasyDate;
  color: string;
  origin:
    | { kind: 'gameEvent'; raw: GameEvent }
    | { kind: 'character'; raw: AggregatedCalendarEvent };
}

/**
 * 9.2d — PJ aggregate kalendář (`/svet/:worldSlug/kalendar`).
 *
 * Sjednocuje game events + character/NPC/Lokace calendar agregát do
 * jedné měsíční mřížky. Display kalendář přepínatelný (multi-config 9.2b),
 * eventy z různých kalendářů se konvertují přes absDay engine.
 *
 * Sidebar filter: typy (akce/postavy/NPC/Lokace) + per-entita toggle.
 * Cell overlay: lunar fáze ikony + sezóna top-border tint.
 */
/** Posun {year, monthIndex} o `delta` měsíců s přetečením roku. */
function addMonthsTo(
  c: { year: number; monthIndex: number },
  delta: number,
  monthCount: number,
): { year: number; monthIndex: number } {
  let m = c.monthIndex + delta;
  let y = c.year;
  while (m < 0) {
    m += monthCount;
    y--;
  }
  while (m >= monthCount) {
    m -= monthCount;
    y++;
  }
  return { year: y, monthIndex: m };
}

export default function CalendarPage() {
  const { worldId, world, loading } = useWorldContext();
  const { data: gameEvents = [] } = useAllWorldGameEvents(worldId);
  const { data: aggregate } = useCalendarsAggregate(worldId);
  const { data: configs = [] } = useCalendarConfigs(worldId);
  const { data: settings } = useWorldSettings(worldId);
  const setColor = useSetCalendarColor(worldId);

  // 9.2-followup — entita, jejíž barvu PJ právě edituje (swatch v sidebaru).
  const [colorEntry, setColorEntry] = useState<{
    id: string;
    slug: string;
    name: string;
  } | null>(null);
  const colorEntryRaw = colorEntry
    ? (aggregate?.characters.find((c) => c.characterId === colorEntry.id)?.color ?? '')
    : '';

  const defaultSlug = world?.defaultCalendarConfigSlug ?? 'gregorian';
  const [displaySlug, setDisplaySlug] = useState<string | null>(null);
  const displayConfig: CalendarConfig =
    configs.find((c) => c.slug === (displaySlug ?? defaultSlug))
      ?? configs[0]
      ?? GREGORIAN_DEFAULT_CONFIG;

  // 9.4 — hiddenEntities Set drží IDs filtrovaných pryč. Pokrývá oba flat group
  // (přes synthetic 'game-events' id) i jednotlivé postavy. Persistence session-only
  // (PJ často přepíná, ne uložené per world).
  const [hiddenEntities, setHiddenEntities] = useState<Set<string>>(new Set());

  // Expanded groups v EntityFilterTree — persistovat per worldId.
  const STORAGE_GROUPS_KEY = worldId ? `calendar-expanded-groups-${worldId}` : null;
  const [expandedGroups, setExpandedGroups] = useState<Set<EntityGroup>>(() => {
    if (!STORAGE_GROUPS_KEY) return new Set();
    try {
      const v = localStorage.getItem(STORAGE_GROUPS_KEY);
      if (v) return new Set(JSON.parse(v) as EntityGroup[]);
    } catch {
      /* ignore */
    }
    return new Set();
  });

  useEffect(() => {
    if (!STORAGE_GROUPS_KEY) return;
    try {
      localStorage.setItem(STORAGE_GROUPS_KEY, JSON.stringify([...expandedGroups]));
    } catch {
      /* ignore */
    }
  }, [STORAGE_GROUPS_KEY, expandedGroups]);

  // D-NEW-INV-CASCADE-INGAME-DATE — „Dnes" sleduje **in-game datum** světa
  // (advance-day v Počasí / Nastavit datum), pokud je nastaveno; jinak reálné
  // dnešní datum. In-game datum je uloženo v timeline kalendáři (UTC pole =
  // {year, monthIndex, day}); přepočítá se přes absolutní den do prohlíženého
  // `displayConfig` (stejně jako eventy z jiných kalendářů).
  const inGameISO = settings?.currentInGameDate ?? null;
  const timelineSlug = settings?.timelineCalendarSlug ?? null;
  const today = useMemo<FantasyDate>(() => {
    const inGame = inGameISO ? new Date(inGameISO) : null;
    if (inGame && !Number.isNaN(inGame.getTime())) {
      const inGameDate: FantasyDate = {
        year: inGame.getUTCFullYear(),
        monthIndex: inGame.getUTCMonth(),
        day: inGame.getUTCDate(),
      };
      const originConfig =
        (timelineSlug ? configs.find((c) => c.slug === timelineSlug) : null) ??
        GREGORIAN_DEFAULT_CONFIG;
      return fromAbsDay(toAbsDay(inGameDate, originConfig), displayConfig);
    }
    const now = new Date();
    const greg: FantasyDate = {
      year: now.getFullYear(),
      monthIndex: now.getMonth(),
      day: now.getDate(),
    };
    return fromAbsDay(toAbsDay(greg, GREGORIAN_DEFAULT_CONFIG), displayConfig);
  }, [inGameISO, timelineSlug, configs, displayConfig]);

  // 9.2-followup — pozice se pamatuje per svět v localStorage (přes refresh).
  const STORAGE_CURSOR_KEY = worldId ? `calendar-cursor-${worldId}` : null;
  const [cursor, setCursor] = usePersistedCalendarCursor(STORAGE_CURSOR_KEY, () => {
    const now = new Date();
    return { year: now.getFullYear(), monthIndex: now.getMonth() };
  });

  // 14.7b — tisk kalendáře s rozsahem: kolik měsíců od aktuálního vytisknout.
  const printMode = usePrintMode();
  const [printMonths, setPrintMonths] = useState(1);

  // Všechny eventy bez filtru (pro entity index → checkbox seznam v sidebaru).
  const allEvents = useMemo<UnifiedEvent[]>(() => {
    const out: UnifiedEvent[] = [];

    for (const ev of gameEvents) {
      const d = new Date(ev.date);
      const gregDate: FantasyDate = {
        year: d.getFullYear(),
        monthIndex: d.getMonth(),
        day: d.getDate(),
        hour: d.getHours(),
        minute: d.getMinutes(),
      };
      const abs = toAbsDay(gregDate, GREGORIAN_DEFAULT_CONFIG);
      const displayDate = fromAbsDay(abs, displayConfig);
      out.push({
        id: `ge-${ev.id}`,
        title: ev.title,
        date: displayDate,
        color: '#7c5cff',
        origin: { kind: 'gameEvent', raw: ev },
      });
    }

    if (aggregate) {
      for (const ev of aggregate.events) {
        if (!ev.start) continue;
        const originSlug = ev.calendarConfigId ?? defaultSlug;
        const originConfig =
          configs.find((c) => c.slug === originSlug) ?? displayConfig;
        const abs = toAbsDay(ev.start, originConfig);
        const displayDate = fromAbsDay(abs, displayConfig);
        const displayEnd = ev.end
          ? fromAbsDay(toAbsDay(ev.end, originConfig), displayConfig)
          : undefined;
        out.push({
          id: `ch-${ev.characterId}-${ev.id}`,
          title: `${ev.name}: ${ev.title}`,
          date: displayDate,
          endDate: displayEnd,
          color: resolveCalendarColor(ev.characterId, ev.color),
          origin: { kind: 'character', raw: ev },
        });
      }
    }

    return out;
  }, [gameEvents, aggregate, displayConfig, configs, defaultSlug]);

  // Filtrované eventy podle hiddenEntities (pro grid render). hiddenEntities
  // obsahuje buď 'game-events' (synthetic id) nebo characterId.
  const unifiedEvents = useMemo<UnifiedEvent[]>(() => {
    return allEvents.filter((ev) => {
      if (ev.origin.kind === 'gameEvent') {
        return !hiddenEntities.has('game-events');
      }
      return !hiddenEntities.has(ev.origin.raw.characterId);
    });
  }, [allEvents, hiddenEntities]);

  const eventsByDay = useMemo(() => {
    const map = new Map<
      string,
      { event: UnifiedEvent; position: 'start' | 'middle' | 'end' | 'single' }[]
    >();
    for (const ev of unifiedEvents) {
      const days = expandEventDays(ev.date, ev.endDate, displayConfig);
      const len = days.length;
      days.forEach((d, idx) => {
        const k = fantasyDayKey(d);
        const arr = map.get(k) ?? [];
        let position: 'start' | 'middle' | 'end' | 'single';
        if (len === 1) position = 'single';
        else if (idx === 0) position = 'start';
        else if (idx === len - 1) position = 'end';
        else position = 'middle';
        arr.push({ event: ev, position });
        map.set(k, arr);
      });
    }
    return map;
  }, [unifiedEvents, displayConfig]);

  const grid = useMemo(
    () => generateMonthGrid(cursor.year, cursor.monthIndex, displayConfig),
    [cursor, displayConfig],
  );

  // 9.4 — Density mode + auto-fallback. Spočítáme max events per cell v aktuálním měsíci.
  const maxEventsPerDay = useMemo(() => {
    let max = 0;
    for (const cell of grid) {
      const k = fantasyDayKey(cell.date);
      const len = eventsByDay.get(k)?.length ?? 0;
      if (len > max) max = len;
    }
    return max;
  }, [grid, eventsByDay]);

  const densityCtl = useDensity({ worldId, maxEventsPerDay });

  const [selected, setSelected] = useState<UnifiedEvent | null>(null);

  // 9.4 — Day detail drawer state. Otevírá se z "+N dalších" nebo z heat cell.
  const [expandedDay, setExpandedDay] = useState<FantasyDate | null>(null);

  // Detail mode limit: max 4 viditelné chipy + „+N dalších" odkaz.
  const DETAIL_VISIBLE_LIMIT = 4;
  const COMPACT_VISIBLE_LIMIT = 20;

  // Map UnifiedEvent → DrawerEvent pro drawer prop (drawer nemá vědět o UnifiedEvent strukturu).
  function toDrawerEvent(ev: UnifiedEvent): DrawerEvent {
    if (ev.origin.kind === 'gameEvent') {
      return {
        id: ev.id,
        title: ev.title,
        date: ev.date,
        endDate: ev.endDate,
        color: ev.color,
        kind: 'gameEvent',
      };
    }
    const ch = ev.origin.raw;
    const k: DrawerEvent['kind'] =
      ch.kind === 'location' ? 'location' : ch.isNpc ? 'npc' : 'player';
    return {
      id: ev.id,
      title: ev.title,
      date: ev.date,
      endDate: ev.endDate,
      color: ev.color,
      kind: k,
      entityName: ch.name,
    };
  }

  // Stable lookup: id → UnifiedEvent → setSelected. Použit z CalendarCell i drawer.
  const eventByIdMap = useMemo(() => {
    const m = new Map<string, UnifiedEvent>();
    for (const ev of unifiedEvents) m.set(ev.id, ev);
    return m;
  }, [unifiedEvents]);

  const handleSelectByEventId = useCallback(
    (eventId: string) => {
      const ev = eventByIdMap.get(eventId);
      if (ev) setSelected(ev);
    },
    [eventByIdMap],
  );

  const handleDrawerEventClick = useCallback(
    (eventId: string) => {
      const ev = eventByIdMap.get(eventId);
      if (ev) {
        setSelected(ev);
        setExpandedDay(null);
      }
    },
    [eventByIdMap],
  );

  // 9.2-FIX2 — jump popover. Při otevření resetuj na current cursor (pattern
  // "adjustment during render" pro track jumpOpen prev → current, React 19).
  const [jumpOpen, setJumpOpen] = useState(false);
  const [jumpYear, setJumpYear] = useState(cursor.year);
  const [jumpMonth, setJumpMonth] = useState(cursor.monthIndex);
  const [prevJumpOpen, setPrevJumpOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  if (jumpOpen && !prevJumpOpen) {
    setPrevJumpOpen(true);
    setJumpYear(cursor.year);
    setJumpMonth(cursor.monthIndex);
  } else if (!jumpOpen && prevJumpOpen) {
    setPrevJumpOpen(false);
  }

  useEffect(() => {
    if (!jumpOpen) return;
    function handler(e: MouseEvent) {
      if (!popoverRef.current) return;
      if (!popoverRef.current.contains(e.target as Node)) {
        setJumpOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [jumpOpen]);

  function applyJump() {
    setCursor({ year: jumpYear, monthIndex: jumpMonth });
    setJumpOpen(false);
  }

  function goToday() {
    setCursor({ year: today.year, monthIndex: today.monthIndex });
  }

  function shift(delta: number) {
    // Guard: prázdný months array by udělal `while` smyčky níže nekonečné
    // (m by nikdy nekleslo pod 0 / nevešlo se pod length) → zamrzlý tab.
    if (!displayConfig.months?.length) return;
    setCursor((c) => {
      let m = c.monthIndex + delta;
      let y = c.year;
      while (m < 0) {
        m += displayConfig.months.length;
        y--;
      }
      while (m >= displayConfig.months.length) {
        m -= displayConfig.months.length;
        y++;
      }
      return { year: y, monthIndex: m };
    });
  }

  const handleEntityColorClick = useCallback(
    (entry: { id: string; slug?: string; name: string }) => {
      if (!entry.slug) return; // gameEvents nemají kalendář k obarvení
      setColorEntry({ id: entry.id, slug: entry.slug, name: entry.name });
    },
    [],
  );

  const toggleEntity = useCallback((entityId: string) => {
    setHiddenEntities((prev) => {
      const next = new Set(prev);
      if (next.has(entityId)) next.delete(entityId);
      else next.add(entityId);
      return next;
    });
  }, []);

  const toggleGroup = useCallback((group: EntityGroup) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  }, []);

  // 9.4 — Entity index pro filter tree.
  const entityIndex = useEntityIndex(allEvents);

  const handleHideAll = useCallback(() => {
    const all = new Set<string>();
    for (const g of Object.values(entityIndex.groups)) {
      for (const e of g) all.add(e.id);
    }
    setHiddenEntities(all);
  }, [entityIndex]);

  const handleResetFilter = useCallback(() => {
    setHiddenEntities(new Set());
  }, []);

  const monthName = displayConfig.months[cursor.monthIndex]?.name ?? '';

  // Render jednoho měsíce — reuse pro normální (1) i tiskový (N pod sebou) režim.
  const renderMonth = (year: number, monthIndex: number) => {
    const g = generateMonthGrid(year, monthIndex, displayConfig);
    const mName = displayConfig.months[monthIndex]?.name ?? '';
    return (
      <div key={`${year}-${monthIndex}`} className="print-month">
        {printMode && (
          <h2 className="print-month-title">
            {mName} {year}
          </h2>
        )}
        <div
          className={`${s.grid} print-cal-grid`}
          style={{
            gridTemplateColumns: `repeat(${displayConfig.daysOfWeek.length}, 1fr)`,
          }}
          role="grid"
          aria-label={`Kalendář ${mName} ${year}`}
        >
          {displayConfig.daysOfWeek.map((w) => (
            <div key={w} className={s.weekday}>
              {w}
            </div>
          ))}
          {g.map((cell) => {
            const k = fantasyDayKey(cell.date);
            const dayEvents = eventsByDay.get(k) ?? [];
            return (
              <CalendarCell
                key={k}
                cell={cell}
                dayEvents={dayEvents}
                // Tisk: vždy DETAIL (texty akcí) — kompakt/heat by vytiskl jen
                // barevné proužky bez názvů. A bez limitu (všechny akce dne).
                density={printMode ? 'detail' : densityCtl.effectiveDensity}
                today={today}
                config={displayConfig}
                detailVisibleLimit={printMode ? 999 : DETAIL_VISIBLE_LIMIT}
                compactVisibleLimit={COMPACT_VISIBLE_LIMIT}
                onSelectEvent={handleSelectByEventId}
                onExpandDay={setExpandedDay}
              />
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) return <Spinner center />;

  return (
    <article className={s.page} data-print-scope>
      <header className={s.header}>
        <h1 className={s.title}>Kalendář světa — PJ pohled</h1>
      </header>

      <div className={s.layout}>
        <aside className={`${s.sidebar} print-hide`}>
          <div className={s.sidebarSection}>
            <h3 className={s.sidebarHeading}>Filtr entit</h3>
            <EntityFilterTree
              index={entityIndex}
              hiddenEntities={hiddenEntities}
              onToggleEntity={toggleEntity}
              onEntityColorClick={handleEntityColorClick}
              onHideAll={handleHideAll}
              onReset={handleResetFilter}
              expandedGroups={expandedGroups}
              onToggleGroup={toggleGroup}
            />
          </div>
        </aside>

        <section>
          <div className={`${s.toolbar} print-hide`}>
            <button
              type="button"
              className={s.navBtn}
              onClick={() => shift(-1)}
              aria-label="Předchozí měsíc"
            >
              <ChevronLeft size={16} aria-hidden />
            </button>
            <button
              type="button"
              className={s.monthLabel}
              onClick={() => setJumpOpen((v) => !v)}
              aria-haspopup="dialog"
              aria-expanded={jumpOpen}
              title="Klikni pro skok na konkrétní rok a měsíc"
            >
              {monthName} {cursor.year}
            </button>
            <button
              type="button"
              className={s.navBtn}
              onClick={() => shift(1)}
              aria-label="Další měsíc"
            >
              <ChevronRight size={16} aria-hidden />
            </button>
            <button
              type="button"
              className={s.todayBtn}
              onClick={goToday}
              title="Skok na dnešní měsíc"
            >
              Dnes
            </button>
            <EventDensityToggle
              density={densityCtl.density}
              effectiveDensity={densityCtl.effectiveDensity}
              isFallback={densityCtl.isFallback}
              forced={densityCtl.forced}
              maxEventsPerDay={maxEventsPerDay}
              onChange={densityCtl.setDensity}
              onForce={densityCtl.forceUserChoice}
            />
            {configs.length > 1 && (
              <select
                className={s.calSelect}
                value={displayConfig.slug}
                onChange={(e) => setDisplaySlug(e.target.value)}
                aria-label="Zobrazený kalendář"
              >
                {configs.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
            {jumpOpen && (
              <div
                ref={popoverRef}
                className={s.jumpPopover}
                role="dialog"
                aria-label="Skok na datum"
              >
                <select
                  className={s.jumpField}
                  value={jumpMonth}
                  onChange={(e) => setJumpMonth(parseInt(e.target.value, 10))}
                  aria-label="Měsíc"
                >
                  {displayConfig.months.map((m, i) => (
                    <option key={i} value={i}>
                      {m.name}
                    </option>
                  ))}
                </select>
                {/* eslint-disable jsx-a11y/no-autofocus -- autofocus do pole při otevření skok-popoveru (role=dialog) je záměr */}
                <input
                  type="number"
                  className={`${s.jumpField} ${s.jumpYear}`}
                  value={jumpYear}
                  onChange={(e) =>
                    setJumpYear(parseInt(e.target.value, 10) || 0)
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') applyJump();
                    if (e.key === 'Escape') setJumpOpen(false);
                  }}
                  aria-label="Rok"
                  autoFocus
                />
                {/* eslint-enable jsx-a11y/no-autofocus */}
                <button
                  type="button"
                  className={s.jumpApply}
                  onClick={applyJump}
                >
                  Skočit
                </button>
              </div>
            )}
            <label
              className="print-hide"
              style={{
                marginLeft: 'auto',
                display: 'inline-flex',
                gap: '0.35rem',
                alignItems: 'center',
                fontSize: '0.85rem',
              }}
            >
              Tisk:
              <select
                value={printMonths}
                onChange={(e) => setPrintMonths(Number(e.target.value))}
                aria-label="Rozsah tisku (počet měsíců)"
              >
                <option value={1}>1 měsíc</option>
                <option value={3}>3 měsíce</option>
                <option value={6}>6 měsíců</option>
                <option value={12}>12 měsíců</option>
              </select>
            </label>
            <PrintButton title="Vytisknout kalendář (zvolený rozsah)" />
          </div>

          {printMode
            ? Array.from({ length: printMonths }, (_, i) => {
                const d = addMonthsTo(cursor, i, displayConfig.months.length);
                return renderMonth(d.year, d.monthIndex);
              })
            : renderMonth(cursor.year, cursor.monthIndex)}
        </section>
      </div>

      {selected && (
        <Modal
          open
          onClose={() => setSelected(null)}
          title={selected.title}
          size="md"
        >
          <p>
            <strong>Datum:</strong>{' '}
            {formatFantasyDate(selected.date, displayConfig)}
          </p>
          <p>
            <strong>Kalendář:</strong> {displayConfig.name}
          </p>
          {selected.origin.kind === 'character' && (
            <>
              <p>
                <strong>Vlastník:</strong> {selected.origin.raw.name} (
                {selected.origin.raw.kind === 'location'
                  ? 'Lokace'
                  : selected.origin.raw.isNpc
                    ? 'NPC'
                    : 'Postava'})
              </p>
              {selected.origin.raw.description && (
                <p>{selected.origin.raw.description}</p>
              )}
            </>
          )}
          {selected.origin.kind === 'gameEvent' &&
            selected.origin.raw.description && (
              <p>{selected.origin.raw.description}</p>
            )}
        </Modal>
      )}

      {expandedDay && (() => {
        const k = fantasyDayKey(expandedDay);
        const dayEvs = (eventsByDay.get(k) ?? []).map((d) => toDrawerEvent(d.event));
        return (
          <DayDetailDrawer
            day={expandedDay}
            events={dayEvs}
            config={displayConfig}
            onClose={() => setExpandedDay(null)}
            onEventClick={handleDrawerEventClick}
          />
        );
      })()}

      {colorEntry && (
        <Modal
          open
          onClose={() => setColorEntry(null)}
          title={`Barva v kalendáři — ${colorEntry.name}`}
          size="sm"
        >
          <p className={s.colorHint}>
            Vyber barvu této entity, nebo „Auto" pro automatické přiřazení podle názvu.
          </p>
          <GroupColorPicker
            value={colorEntryRaw}
            onChange={(slot) => {
              setColor.mutate({ slug: colorEntry.slug, color: slot ?? '' });
              setColorEntry(null);
            }}
          />
        </Modal>
      )}
    </article>
  );
}

