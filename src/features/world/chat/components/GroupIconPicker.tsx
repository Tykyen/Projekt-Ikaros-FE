/**
 * Picker ikony kanálu (krok 6.5c).
 *
 * Grid 6×4 ikon z `GROUP_ICONS` mapy + chip „Bez ikony" (reset). Klík vybere klíč.
 *
 * `accentColor` — `var(--chat-group-N)` v barvě právě editovaného kanálu;
 * propsne se do CSS proměnné `--icon-accent` pro hover/selected tint
 * (color-mix v module.css). Pokud neuvedeno, použije se `--theme-accent`.
 */
import type { CSSProperties } from 'react';
import { Ban } from 'lucide-react';
import { GROUP_ICON_KEYS, GroupIcon } from '../lib/groupIcons';
import s from './GroupIconPicker.module.css';

interface Props {
  value?: string;
  onChange: (iconKey: string | undefined) => void;
  accentColor?: string;
}

export function GroupIconPicker({ value, onChange, accentColor }: Props) {
  const style = { '--icon-accent': accentColor ?? 'var(--theme-accent)' } as CSSProperties;
  return (
    <div className={s.wrap} style={style} role="radiogroup" aria-label="Ikona kanálu">
      <div className={s.grid}>
        {GROUP_ICON_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={value === key}
            aria-label={`Ikona ${key}`}
            className={s.tile}
            data-selected={value === key || undefined}
            onClick={() => onChange(key)}
            title={key}
          >
            <GroupIcon iconKey={key} size={18} />
          </button>
        ))}
      </div>
      <button
        type="button"
        role="radio"
        aria-checked={!value}
        aria-label="Bez ikony"
        className={s.none}
        data-selected={!value || undefined}
        onClick={() => onChange(undefined)}
      >
        <Ban size={14} aria-hidden="true" />
        <span>Bez ikony</span>
      </button>
    </div>
  );
}
