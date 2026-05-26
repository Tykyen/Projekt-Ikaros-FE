import { LayoutList, Minus, Flame } from 'lucide-react';
import type { Density } from '../hooks/useDensity';
import s from './EventDensityToggle.module.css';

interface Props {
  density: Density;
  effectiveDensity: Density;
  isFallback: boolean;
  forced: boolean;
  maxEventsPerDay: number;
  onChange: (next: Density) => void;
  onForce: () => void;
}

const OPTIONS: { value: Density; label: string; icon: React.ReactNode; hint: string }[] = [
  { value: 'detail',  label: 'Detail',  icon: <LayoutList size={14} />, hint: 'Plné názvy eventů (≤8 na den)' },
  { value: 'compact', label: 'Kompakt', icon: <Minus size={14} />,      hint: 'Barevné proužky (≤30 na den)' },
  { value: 'heat',    label: 'Heat',    icon: <Flame size={14} />,      hint: 'Heatmap intenzity (neomezeně)' },
];

/**
 * 9.4 — Segmented control density toggle + fallback badge.
 * Arrow keys (←/→) přepínají mezi modes (role=radiogroup).
 */
export function EventDensityToggle({
  density,
  effectiveDensity,
  isFallback,
  forced,
  maxEventsPerDay,
  onChange,
  onForce,
}: Props) {
  function handleKey(e: React.KeyboardEvent, idx: number) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const delta = e.key === 'ArrowRight' ? 1 : -1;
    const next = (idx + delta + OPTIONS.length) % OPTIONS.length;
    onChange(OPTIONS[next].value);
  }

  return (
    <div className={s.wrap}>
      <div role="radiogroup" aria-label="Hustota zobrazení eventů" className={s.group}>
        {OPTIONS.map((opt, idx) => {
          const active = density === opt.value;
          const effActive = !active && effectiveDensity === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              tabIndex={active ? 0 : -1}
              className={`${s.btn} ${active ? s.active : ''} ${effActive ? s.effective : ''}`}
              onClick={() => onChange(opt.value)}
              onKeyDown={(e) => handleKey(e, idx)}
              title={opt.hint}
            >
              {opt.icon}
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
      {isFallback && !forced && (
        <button
          type="button"
          className={s.fallbackBadge}
          onClick={onForce}
          title={`Klik pro vynucení režimu „${density}" (může přetékat)`}
          aria-label={`Auto-fallback ${density} → ${effectiveDensity} (${maxEventsPerDay} eventů na den). Klik pro vynucení.`}
        >
          auto → {effectiveDensity}
        </button>
      )}
    </div>
  );
}
