import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import {
  expandEventDays,
  fantasyDayKey,
  fromAbsDay,
  generateMonthGrid,
  getLunarPhasesForDay,
  getSeasonForDay,
  isSameFantasyDay,
  toAbsDay,
  GREGORIAN_DEFAULT_CONFIG,
  type CalendarConfig,
  type FantasyDate,
} from '@/shared/lib/calendarEngine';
import type { CalendarEvent } from '../../api/characters.types';
import { usePersistedCalendarCursor } from '@/features/world/hooks/usePersistedCalendarCursor';
import s from './CalendarTabGrid.module.css';

interface Props {
  events: CalendarEvent[];
  config: CalendarConfig;
  color: string;
  /** Volitelně více configs — dropdown přepínač zobrazeného kalendáře. */
  availableConfigs?: CalendarConfig[];
  onConfigChange?: (slug: string) => void;
  onEventClick?: (event: CalendarEvent) => void;
  /** Klik na prázdné místo v buňce → create flow s preset datem. */
  onDayClick?: (date: FantasyDate) => void;
  /** 9.2-followup — localStorage klíč pro persistenci pozice (null = bez persistence). */
  cursorStorageKey?: string | null;
}

type EventPosition = 'start' | 'middle' | 'end' | 'single';

interface DayEventEntry {
  event: CalendarEvent;
  /**
   * Pozice v rámci multi-day rozpětí:
   *  - 'single' = 1-denní event (kompletní chip).
   *  - 'start' = první den (chip s názvem + rounded left, bez right radius).
   *  - 'middle' = vnitřní den (prázdný plný color bar).
   *  - 'end' = poslední den (prázdný plný color bar, rounded right).
   */
  position: EventPosition;
}

/** Dnešní reálný datum přepočítaný do display kalendáře (přes Gregorian abs). */
function todayInConfig(config: CalendarConfig): FantasyDate {
  const now = new Date();
  const gregToday: FantasyDate = {
    year: now.getFullYear(),
    monthIndex: now.getMonth(),
    day: now.getDate(),
  };
  const abs = toAbsDay(gregToday, GREGORIAN_DEFAULT_CONFIG);
  return fromAbsDay(abs, config);
}

/**
 * 9.2c + 9.2-FIX2 — Měsíční mřížka per-entita kalendáře.
 *
 * - Multi-day eventy se rozprostírají přes všechny dny mezi start/end
 *   (první den plný chip, další dny continuation `↳ název`).
 * - Klik na month label → jump popover (skok na konkrétní rok+měsíc).
 * - Dnešní den (Gregorian → display kalendář přes absDay) zvýrazněn.
 * - Hover na prázdnou buňku → „+" hint (klik → create flow).
 */
export function CalendarTabGrid({
  events,
  config,
  color,
  availableConfigs,
  onConfigChange,
  onEventClick,
  onDayClick,
  cursorStorageKey,
}: Props) {
  // Fallback pozice (když není uložená): první event, jinak dnešek.
  const initialCursor = useMemo<{ year: number; monthIndex: number }>(() => {
    const firstEventDate = events.find((e) => e.start)?.start;
    if (firstEventDate)
      return { year: firstEventDate.year, monthIndex: firstEventDate.monthIndex };
    const t = todayInConfig(config);
    return { year: t.year, monthIndex: t.monthIndex };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 9.2-followup — pozice se pamatuje per entita (přes refresh).
  const [cursor, setCursor] = usePersistedCalendarCursor(
    cursorStorageKey ?? null,
    () => initialCursor,
  );
  const today = useMemo(() => todayInConfig(config), [config]);

  const grid = useMemo(
    () => generateMonthGrid(cursor.year, cursor.monthIndex, config),
    [cursor, config],
  );

  const eventsByDay = useMemo(() => {
    const map = new Map<string, DayEventEntry[]>();
    for (const ev of events) {
      if (!ev.start) continue;
      const days = expandEventDays(ev.start, ev.end, config);
      const len = days.length;
      days.forEach((d, idx) => {
        const k = fantasyDayKey(d);
        const arr = map.get(k) ?? [];
        let position: EventPosition;
        if (len === 1) position = 'single';
        else if (idx === 0) position = 'start';
        else if (idx === len - 1) position = 'end';
        else position = 'middle';
        arr.push({ event: ev, position });
        map.set(k, arr);
      });
    }
    return map;
  }, [events, config]);

  function shift(delta: number) {
    setCursor((c) => {
      let m = c.monthIndex + delta;
      let y = c.year;
      while (m < 0) {
        m += config.months.length;
        y--;
      }
      while (m >= config.months.length) {
        m -= config.months.length;
        y++;
      }
      return { year: y, monthIndex: m };
    });
  }

  const monthName = config.months[cursor.monthIndex]?.name ?? '';

  const [jumpOpen, setJumpOpen] = useState(false);
  const [jumpYear, setJumpYear] = useState(cursor.year);
  const [jumpMonth, setJumpMonth] = useState(cursor.monthIndex);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Seed jump popoveru při otevření — R19 adjustment-during-render (jumpOpen primitivní).
  const [prevJumpOpen, setPrevJumpOpen] = useState(jumpOpen);
  if (jumpOpen !== prevJumpOpen) {
    setPrevJumpOpen(jumpOpen);
    if (jumpOpen) {
      setJumpYear(cursor.year);
      setJumpMonth(cursor.monthIndex);
    }
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

  return (
    <div className={s.wrap}>
      <div className={s.toolbar}>
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
        {availableConfigs && availableConfigs.length > 1 && onConfigChange && (
          <select
            className={s.calSelect}
            value={config.slug}
            onChange={(e) => onConfigChange(e.target.value)}
            aria-label="Zobrazený kalendář"
          >
            {availableConfigs.map((c) => (
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
              {config.months.map((m, i) => (
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
              onChange={(e) => setJumpYear(parseInt(e.target.value, 10) || 0)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') applyJump();
                if (e.key === 'Escape') setJumpOpen(false);
              }}
              aria-label="Rok"
              autoFocus
            />
            {/* eslint-enable jsx-a11y/no-autofocus */}
            <button type="button" className={s.jumpApply} onClick={applyJump}>
              Skočit
            </button>
          </div>
        )}
      </div>

      <div
        className={s.grid}
        style={{ gridTemplateColumns: `repeat(${config.daysOfWeek.length}, 1fr)` }}
        role="grid"
        aria-label={`Kalendář ${monthName} ${cursor.year}`}
      >
        {config.daysOfWeek.map((w) => (
          <div key={w} className={s.weekday}>
            {w}
          </div>
        ))}
        {grid.map((cell) => {
          const k = fantasyDayKey(cell.date);
          const dayEvents = eventsByDay.get(k) ?? [];
          const lunar = getLunarPhasesForDay(cell.absDay, config.celestialBodies);
          const season = getSeasonForDay(cell.date, config);
          const isToday = isSameFantasyDay(cell.date, today);
          return (
            <DayCell
              key={k}
              date={cell.date}
              weekdayIndex={cell.weekdayIndex}
              inCurrentMonth={cell.inCurrentMonth}
              isToday={isToday}
              lunar={lunar}
              seasonColor={season?.color}
              dayEvents={dayEvents}
              eventColor={color}
              onEventClick={onEventClick}
              onDayClick={onDayClick}
            />
          );
        })}
      </div>
    </div>
  );
}

interface DayCellProps {
  date: FantasyDate;
  weekdayIndex: number;
  inCurrentMonth: boolean;
  isToday: boolean;
  lunar: ReturnType<typeof getLunarPhasesForDay>;
  seasonColor: string | undefined;
  dayEvents: DayEventEntry[];
  eventColor: string;
  onEventClick: ((event: CalendarEvent) => void) | undefined;
  onDayClick: ((date: FantasyDate) => void) | undefined;
}

function DayCell({
  date,
  weekdayIndex,
  inCurrentMonth,
  isToday,
  lunar,
  seasonColor,
  dayEvents,
  eventColor,
  onEventClick,
  onDayClick,
}: DayCellProps) {
  const cellStyle = seasonColor
    ? { borderTop: `2px solid ${seasonColor}` }
    : undefined;

  function handleCellClick(e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest('button')) return;
    onDayClick?.(date);
  }

  const classes = [
    s.cell,
    !inCurrentMonth && s.cellOutside,
    isToday && s.cellToday,
    onDayClick && s.cellClickable,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- role/tabIndex/onKeyDown podmíněné (klikací jen když onDayClick); dynamickou roli linter nedetekuje
    <div
      className={classes}
      style={cellStyle}
      onClick={onDayClick ? handleCellClick : undefined}
      role={onDayClick ? 'button' : undefined}
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- tabIndex jen když je buňka klikací (onDayClick)
      tabIndex={onDayClick ? 0 : undefined}
      onKeyDown={
        onDayClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onDayClick(date);
              }
            }
          : undefined
      }
      aria-label={onDayClick ? `Přidat událost k ${date.day}.` : undefined}
    >
      <div className={s.cellHeader}>
        <span className={s.dayNum}>{date.day}.</span>
        {lunar.length > 0 && (
          <div className={s.lunarRow}>
            {lunar.map((info) => (
              <span
                key={info.body.id}
                className={s.lunarIcon}
                title={`${info.body.name}: ${info.phase}`}
                style={{ color: info.body.color }}
              >
                {info.icon}
              </span>
            ))}
          </div>
        )}
      </div>
      {dayEvents.map(({ event: ev, position }) => {
        const isOriginStart = position === 'start' || position === 'single';
        // 9.2-FIX3 — pokud event přechází přes víc týdnů/měsíců, název se
        // restartuje na začátku každého týdne (pondělí = weekdayIndex 0).
        const isWeekRestart =
          !isOriginStart && weekdayIndex === 0;
        const showTitle = isOriginStart || isWeekRestart;
        const chipClasses = [
          s.eventChip,
          position === 'start' && s.chipSpanStart,
          position === 'middle' && s.chipSpanMiddle,
          position === 'end' && s.chipSpanEnd,
          isWeekRestart && s.chipSpanRestart,
        ]
          .filter(Boolean)
          .join(' ');
        return (
          <button
            key={`${ev.id}-${fantasyDayKey(date)}`}
            type="button"
            className={chipClasses}
            style={{
              ['--chip-color' as string]: eventColor,
              // color-mix → funguje s var(--chat-group-N) i HEX (alpha nelze appendovat k var()).
              ['--chip-bg' as string]: `color-mix(in srgb, ${eventColor} 14%, transparent)`,
            }}
            onClick={(e) => {
              e.stopPropagation();
              onEventClick?.(ev);
            }}
            title={ev.title + (ev.description ? ` — ${ev.description}` : '')}
            aria-label={
              isOriginStart
                ? ev.title || '(bez názvu)'
                : `${ev.title || '(bez názvu)'} — pokračování`
            }
          >
            {showTitle ? (
              <>
                {isOriginStart && ev.symbol && (
                  <span aria-hidden>{ev.symbol} </span>
                )}
                {ev.title || '(bez názvu)'}
              </>
            ) : (
              <span aria-hidden>&nbsp;</span>
            )}
          </button>
        );
      })}
      {onDayClick && dayEvents.length === 0 && inCurrentMonth && (
        <span className={s.addHint} aria-hidden>
          <Plus size={14} />
        </span>
      )}
    </div>
  );
}
