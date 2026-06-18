import { memo } from 'react';
import {
  getLunarPhasesForDay,
  getSeasonForDay,
  isSameFantasyDay,
  type CalendarConfig,
  type FantasyDate,
} from '@/shared/lib/calendarEngine';
import { CellHeatLayer } from './CellHeatLayer';
import { EventChipCompact } from './EventChipCompact';
import { heatA11yLabel } from '../lib/heatLabels';
import type { Density } from '../hooks/useDensity';
import s from '../../CalendarPage.module.css';

interface CellEvent {
  event: {
    id: string;
    title: string;
    color: string;
  };
  position: 'start' | 'middle' | 'end' | 'single';
}

interface Props {
  cell: {
    date: FantasyDate;
    absDay: number;
    weekdayIndex: number;
    inCurrentMonth: boolean;
  };
  dayEvents: CellEvent[];
  density: Density;
  today: FantasyDate;
  config: CalendarConfig;
  detailVisibleLimit: number;
  compactVisibleLimit: number;
  onSelectEvent: (eventId: string) => void;
  onExpandDay: (day: FantasyDate) => void;
}

/**
 * 9.4 — Jedna buňka kalendářního gridu. Memoized aby filter/density change
 * nepřerenderoval celý měsíc (42 cells × 10 events = 420 nodes při worst case).
 */
function CalendarCellImpl({
  cell,
  dayEvents,
  density,
  today,
  config,
  detailVisibleLimit,
  compactVisibleLimit,
  onSelectEvent,
  onExpandDay,
}: Props) {
  const lunar = getLunarPhasesForDay(cell.absDay, config.celestialBodies);
  const season = getSeasonForDay(cell.date, config);
  const isToday = isSameFantasyDay(cell.date, today);
  const isHeatMode = density === 'heat';
  const isCompact = density === 'compact';
  const cellStyle = season
    ? { borderTop: `2px solid ${season.color}` }
    : undefined;
  const cellClasses = [
    s.cell,
    !cell.inCurrentMonth && s.cellOutside,
    isToday && s.cellToday,
    isHeatMode && dayEvents.length > 0 && s.cellHeatClickable,
  ]
    .filter(Boolean)
    .join(' ');
  const a11yLabel =
    isHeatMode && dayEvents.length > 0
      ? `${cell.date.day}., ${heatA11yLabel(dayEvents.length)}`
      : undefined;

  const visibleLimit = isCompact ? compactVisibleLimit : detailVisibleLimit;
  const overflowCount = Math.max(0, dayEvents.length - visibleLimit);
  const visible = dayEvents.slice(0, visibleLimit);

  const handleCellClick =
    isHeatMode && dayEvents.length > 0 ? () => onExpandDay(cell.date) : undefined;
  const handleCellKey =
    isHeatMode && dayEvents.length > 0
      ? (e: React.KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onExpandDay(cell.date);
          }
        }
      : undefined;

  return (
    <div
      className={cellClasses}
      style={cellStyle}
      role={isHeatMode && dayEvents.length > 0 ? 'button' : undefined}
      tabIndex={isHeatMode && dayEvents.length > 0 ? 0 : undefined}
      aria-label={a11yLabel}
      onClick={handleCellClick}
      onKeyDown={handleCellKey}
    >
      {isHeatMode && <CellHeatLayer eventCount={dayEvents.length} />}
      <div className={s.cellHeader}>
        {!isHeatMode && dayEvents.length > 0 ? (
          // Klik na číslo dne → Day Drawer se VŠEMI akcemi dne (Detail i Compact,
          // kde „+N dalších" nemusí vzniknout). Počet akcí signalizuje klikatelnost.
          <button
            type="button"
            className={`${s.dayNum} ${s.dayNumBtn}`}
            onClick={() => onExpandDay(cell.date)}
            aria-label={`Zobrazit všechny události dne (${dayEvents.length})`}
            title="Všechny události dne"
          >
            {cell.date.day}.
            <span className={s.heatCount}> · {dayEvents.length}</span>
          </button>
        ) : (
          <span className={s.dayNum}>
            {cell.date.day}.
            {isHeatMode && dayEvents.length > 0 && (
              <span className={s.heatCount}> · {dayEvents.length}</span>
            )}
          </span>
        )}
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

      {!isHeatMode && (
        <>
          {visible.map(({ event: ev, position }) => {
            const isOriginStart = position === 'start' || position === 'single';
            const isWeekRestart =
              !isOriginStart && cell.weekdayIndex === 0;

            if (isCompact) {
              return (
                <EventChipCompact
                  key={ev.id}
                  title={ev.title}
                  color={ev.color}
                  position={position}
                  isWeekRestart={isWeekRestart}
                  onClick={() => onSelectEvent(ev.id)}
                />
              );
            }

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
                key={ev.id}
                type="button"
                className={chipClasses}
                style={{
                  ['--chip-color' as string]: ev.color,
                  // color-mix → funguje s var(--chat-group-N) i HEX.
                  ['--chip-bg' as string]: `color-mix(in srgb, ${ev.color} 14%, transparent)`,
                }}
                onClick={() => onSelectEvent(ev.id)}
                title={ev.title}
                aria-label={
                  isOriginStart ? ev.title : `${ev.title} — pokračování`
                }
              >
                {showTitle ? ev.title : <span aria-hidden>&nbsp;</span>}
              </button>
            );
          })}
          {overflowCount > 0 && (
            <button
              type="button"
              className={s.overflowLink}
              onClick={() => onExpandDay(cell.date)}
              aria-label={`Zobrazit všechny události dne (${dayEvents.length})`}
            >
              + {overflowCount} dalších
            </button>
          )}
        </>
      )}
    </div>
  );
}

export const CalendarCell = memo(CalendarCellImpl);
