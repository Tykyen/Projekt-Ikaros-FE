/**
 * Spec 8.x-prep §4.4 (B4) — sdílený field pro herní datum transakce.
 *
 * Controlled `FantasyDate | null` field. Interně reuse infrastruktury z 9.4
 * (`worldSettings.currentInGameDate`, `useCalendarConfigs`) — pokud má svět
 * custom kalendář, použije ho; jinak fallback na Gregorian.
 *
 * Default value je řešení **callera** (`<InGameDateField value={...} />`).
 * Pomocný `useDefaultInGameDate(worldId)` helper převede `currentInGameDate`
 * z worldSettings na FantasyDate (caller ho použije při init state).
 *
 * Tlačítko „Dnes" (allowReset) volá `onChange(default)`.
 */
import { useId } from 'react';
import { Input } from '@/shared/ui';
import { useWorldSettings } from '@/features/world/api/useWorldSettings';
import { useCalendarConfigs } from '@/features/world/api/useCalendarConfigs';
import type { FantasyDateLike } from '@/features/world/pages/api/characters.types';
import { useDefaultInGameDate } from './useDefaultInGameDate';
import s from './InGameDateField.module.css';

interface InGameDateFieldProps {
  value: FantasyDateLike | null;
  onChange: (value: FantasyDateLike) => void;
  worldId: string;
  label?: string;
  allowReset?: boolean;
  allowHour?: boolean;
}

interface MonthDescriptor {
  name: string;
  daysCount: number;
}

const GREGORIAN_MONTHS: MonthDescriptor[] = [
  { name: 'Leden', daysCount: 31 },
  { name: 'Únor', daysCount: 29 },
  { name: 'Březen', daysCount: 31 },
  { name: 'Duben', daysCount: 30 },
  { name: 'Květen', daysCount: 31 },
  { name: 'Červen', daysCount: 30 },
  { name: 'Červenec', daysCount: 31 },
  { name: 'Srpen', daysCount: 31 },
  { name: 'Září', daysCount: 30 },
  { name: 'Říjen', daysCount: 31 },
  { name: 'Listopad', daysCount: 30 },
  { name: 'Prosinec', daysCount: 31 },
];

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.round(value)));
}

export function InGameDateField({
  value,
  onChange,
  worldId,
  label = 'Herní datum',
  allowReset = true,
  allowHour = true,
}: InGameDateFieldProps) {
  const { data: settings } = useWorldSettings(worldId);
  const { data: calendars = [] } = useCalendarConfigs(worldId);
  const defaultDate = useDefaultInGameDate(worldId);
  const uid = useId();

  const activeCalendar = settings?.timelineCalendarSlug
    ? calendars.find((c) => c.slug === settings.timelineCalendarSlug)
    : undefined;

  const monthsList: MonthDescriptor[] =
    activeCalendar && activeCalendar.months.length > 0
      ? activeCalendar.months.map((m, idx) => ({
          name: m.name || `${idx + 1}. měsíc`,
          daysCount: m.daysCount,
        }))
      : GREGORIAN_MONTHS;

  // Pokud caller nedal value, fallback na default (uncontrolled-ish — caller
  // by ale měl řídit). Aspoň nic se nerozbije.
  const effective: FantasyDateLike = value ?? defaultDate;

  const dayMax =
    monthsList[effective.monthIndex]?.daysCount ?? 31;
  const clampedDay = Math.min(effective.day, dayMax);

  function patch(p: Partial<FantasyDateLike>) {
    const next: FantasyDateLike = { ...effective, ...p };
    // Clamp day pokud měsíc skočil na shorter měsíc
    const newDayMax =
      monthsList[next.monthIndex]?.daysCount ?? 31;
    if (next.day > newDayMax) next.day = newDayMax;
    onChange(next);
  }

  function reset() {
    onChange(defaultDate);
  }

  return (
    <div className={s.wrapper}>
      <div className={s.header}>
        <span className={s.label}>{label}</span>
        {allowReset && (
          <button
            type="button"
            className={s.todayBtn}
            onClick={reset}
            title={`Reset na aktuální herní datum světa`}
          >
            Dnes
          </button>
        )}
      </div>
      <div className={s.grid}>
        <label className={s.field} htmlFor={`${uid}-day`}>
          <span className={s.fieldLabel}>Den</span>
          <Input
            id={`${uid}-day`}
            type="number"
            value={clampedDay}
            onChange={(e) =>
              patch({ day: clamp(Number(e.target.value), 1, dayMax) })
            }
            min={1}
            max={dayMax}
            data-testid="igdf-day"
          />
        </label>
        <label className={s.field}>
          <span className={s.fieldLabel}>Měsíc</span>
          <select
            className={s.select}
            value={effective.monthIndex}
            onChange={(e) => patch({ monthIndex: Number(e.target.value) })}
            data-testid="igdf-month"
          >
            {monthsList.map((m, idx) => (
              <option key={idx} value={idx}>
                {idx + 1}. {m.name}
              </option>
            ))}
          </select>
        </label>
        <label className={s.field} htmlFor={`${uid}-year`}>
          <span className={s.fieldLabel}>Rok</span>
          <Input
            id={`${uid}-year`}
            type="number"
            value={effective.year}
            onChange={(e) =>
              patch({ year: clamp(Number(e.target.value), -25000, 99999) })
            }
            min={-25000}
            max={99999}
            data-testid="igdf-year"
          />
        </label>
        {allowHour && (
          <>
            <label className={s.field} htmlFor={`${uid}-hour`}>
              <span className={s.fieldLabel}>Hodina</span>
              <Input
                id={`${uid}-hour`}
                type="number"
                value={effective.hour ?? 12}
                onChange={(e) =>
                  patch({ hour: clamp(Number(e.target.value), 0, 23) })
                }
                min={0}
                max={23}
                data-testid="igdf-hour"
              />
            </label>
            <label className={s.field} htmlFor={`${uid}-minute`}>
              <span className={s.fieldLabel}>Minuta</span>
              <Input
                id={`${uid}-minute`}
                type="number"
                value={effective.minute ?? 0}
                onChange={(e) =>
                  patch({ minute: clamp(Number(e.target.value), 0, 59) })
                }
                min={0}
                max={59}
                data-testid="igdf-minute"
              />
            </label>
          </>
        )}
      </div>
    </div>
  );
}
