import { useMemo } from 'react';
import { X } from 'lucide-react';
import {
  daysInMonth,
  type CalendarConfig,
  type FantasyDate,
} from '@/shared/lib/calendarEngine';
import s from './FantasyDatePicker.module.css';

interface Props {
  config: CalendarConfig;
  value: FantasyDate | null;
  onChange: (date: FantasyDate | null) => void;
  /** Pokud true, přidá hour/minute selectory. */
  allowHour?: boolean;
  /** Pokud true, místo `null` se nemůže být — required field. */
  required?: boolean;
  /** Visual label pro aria. */
  ariaLabel?: string;
}

/**
 * 9.2c — Picker fantasy datumu pro libovolný kalendář.
 *
 * 3-4 select boxy: rok (text) / měsíc (z config.months) / den (1..daysInMonth)
 * / hodina (volitelně). Reaktivní — měsíc change → max day se přepočítá.
 *
 * Pokud `value === null` a `!required`, X tlačítko clear; jinak picker
 * defaultně inicializuje na rok 0, měsíc 0, den 1.
 */
export function FantasyDatePicker({
  config,
  value,
  onChange,
  allowHour = false,
  required = false,
  ariaLabel,
}: Props) {
  const current = value ?? { year: 0, monthIndex: 0, day: 1 };

  const maxDay = useMemo(
    () => daysInMonth(current.monthIndex, current.year, config),
    [config, current.monthIndex, current.year],
  );

  // Pokud `value.day > maxDay` (např. po změně měsíce na kratší), clamp.
  const safeDay = Math.min(current.day, maxDay);

  function patch(next: Partial<FantasyDate>) {
    const merged: FantasyDate = { ...current, ...next };
    // Clamp day pokud nový month/year má míň dní.
    const dim = daysInMonth(merged.monthIndex, merged.year, config);
    if (merged.day > dim) merged.day = dim;
    onChange(merged);
  }

  return (
    <div className={s.picker} role="group" aria-label={ariaLabel ?? 'Datum'}>
      {/* Pořadí den / měsíc / rok (česká konvence) — request 2026-05-25. */}
      <select
        className={`${s.field} ${s.day}`}
        value={safeDay}
        onChange={(e) => patch({ day: parseInt(e.target.value) })}
        aria-label="Den"
      >
        {Array.from({ length: maxDay }, (_, i) => i + 1).map((d) => (
          <option key={d} value={d}>
            {d}.
          </option>
        ))}
      </select>
      <select
        className={s.field}
        value={current.monthIndex}
        onChange={(e) => patch({ monthIndex: parseInt(e.target.value) })}
        aria-label="Měsíc"
      >
        {config.months.map((m, i) => (
          <option key={i} value={i}>
            {m.name}
          </option>
        ))}
      </select>
      <input
        type="number"
        className={`${s.field} ${s.year}`}
        value={current.year}
        onChange={(e) => patch({ year: parseInt(e.target.value) || 0 })}
        aria-label="Rok"
      />
      {allowHour && (
        <input
          type="time"
          className={`${s.field} ${s.hour}`}
          value={
            current.hour !== undefined
              ? `${String(current.hour).padStart(2, '0')}:${String(current.minute ?? 0).padStart(2, '0')}`
              : ''
          }
          onChange={(e) => {
            const v = e.target.value;
            if (!v) {
              patch({ hour: undefined, minute: undefined });
            } else {
              const [h, m] = v.split(':').map((n) => parseInt(n, 10));
              patch({ hour: h, minute: m });
            }
          }}
          aria-label="Čas"
        />
      )}
      {!required && value !== null && (
        <button
          type="button"
          className={s.clearBtn}
          onClick={() => onChange(null)}
          aria-label="Vymazat datum"
          title="Vymazat datum"
        >
          <X size={14} aria-hidden />
        </button>
      )}
    </div>
  );
}
