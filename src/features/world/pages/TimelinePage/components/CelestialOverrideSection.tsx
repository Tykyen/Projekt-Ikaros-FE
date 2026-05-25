import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { CalendarConfig, LunarPhase } from '@/shared/lib/calendarEngine';
import type { CelestialOverride } from '../api/types';
import s from './CelestialOverrideSection.module.css';

const PHASES: { value: LunarPhase; label: string; icon: string }[] = [
  { value: 'new', label: 'nov', icon: '🌑' },
  { value: 'waxing-crescent', label: 'dorůstající srpek', icon: '🌒' },
  { value: 'first-quarter', label: 'první čtvrt', icon: '🌓' },
  { value: 'waxing-gibbous', label: 'dorůstající měsíc', icon: '🌔' },
  { value: 'full', label: 'úplněk', icon: '🌕' },
  { value: 'waning-gibbous', label: 'couvající měsíc', icon: '🌖' },
  { value: 'last-quarter', label: 'poslední čtvrt', icon: '🌗' },
  { value: 'waning-crescent', label: 'couvající srpek', icon: '🌘' },
];

interface Props {
  config: CalendarConfig | null;
  value: CelestialOverride[];
  onChange: (next: CelestialOverride[]) => void;
}

/**
 * 9.3 — collapsible sekce v modalu pro override fází nebeských těles
 * pro daný den události. Default = bez override (BE auto-výpočet).
 *
 * Use case: „den bitvy bylo zatmění Slunce" — narativní override mimo cyklus.
 */
export function CelestialOverrideSection({ config, value, onChange }: Props) {
  const [expanded, setExpanded] = useState(value.length > 0);

  if (!config || config.celestialBodies.length === 0) {
    return null;
  }

  function findOverride(bodyId: string): CelestialOverride | undefined {
    return value.find((o) => o.bodyId === bodyId);
  }

  function toggleOverride(bodyId: string, enabled: boolean) {
    if (enabled) {
      onChange([...value, { bodyId, phase: 'full' }]);
    } else {
      onChange(value.filter((o) => o.bodyId !== bodyId));
    }
  }

  function setPhase(bodyId: string, phase: LunarPhase) {
    onChange(value.map((o) => (o.bodyId === bodyId ? { ...o, phase } : o)));
  }

  return (
    <fieldset className={s.section}>
      <button
        type="button"
        className={s.toggleHeader}
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        {expanded ? (
          <ChevronDown size={16} aria-hidden />
        ) : (
          <ChevronRight size={16} aria-hidden />
        )}
        <span>Nebeská tělesa pro tento den</span>
        {value.length > 0 && (
          <span className={s.badge}>{value.length} přepsáno</span>
        )}
      </button>

      {expanded && (
        <div className={s.body}>
          <p className={s.hint}>
            Bez přepsání BE vypočte fáze z cyklu. Přepsání použij pro narativní
            efekt (zatmění, úplněk na den bitvy…).
          </p>
          {config.celestialBodies.map((body) => {
            const override = findOverride(body.id);
            return (
              <div key={body.id} className={s.row}>
                <label className={s.toggleLabel}>
                  <input
                    type="checkbox"
                    checked={!!override}
                    onChange={(e) =>
                      toggleOverride(body.id, e.target.checked)
                    }
                  />
                  <span>{body.name}</span>
                </label>
                {override && (
                  <select
                    className={s.phaseSelect}
                    value={override.phase}
                    onChange={(e) =>
                      setPhase(body.id, e.target.value as LunarPhase)
                    }
                  >
                    {PHASES.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.icon} {p.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            );
          })}
        </div>
      )}
    </fieldset>
  );
}
