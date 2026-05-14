import { useId } from 'react';
import s from './PillChips.module.css';

interface Props {
  options: readonly string[];
  value: string[];
  onChange: (next: string[]) => void;
  ariaLabel: string;
}

/**
 * 2.3 — Multi-select pill chips. Klik na chip = toggle (přidat / odebrat
 * z hodnoty). Skin-agnostické: jen `var(--frame-border)` / `var(--accent)`.
 */
export function PillChips({ options, value, onChange, ariaLabel }: Props) {
  const groupId = useId();

  const toggle = (opt: string) => {
    onChange(
      value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt],
    );
  };

  return (
    <div
      className={s.group}
      role="group"
      aria-label={ariaLabel}
      data-group-id={groupId}
    >
      {options.map((opt) => {
        const checked = value.includes(opt);
        return (
          <button
            type="button"
            key={opt}
            className={`${s.chip} ${checked ? s.checked : ''}`}
            aria-pressed={checked}
            onClick={() => toggle(opt)}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}
