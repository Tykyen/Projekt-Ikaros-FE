import clsx from 'clsx';
import { listThemes } from '@/themes/registry';
import s from './ThemePresetGrid.module.css';

interface Props {
  value: string;
  onChange: (themeId: string) => void;
}

/**
 * 5.3f — mřížka preset motivů světa (`scope: 'world'`). Radiogroup.
 */
export function ThemePresetGrid({ value, onChange }: Props) {
  const themes = listThemes('world');

  return (
    <div role="radiogroup" aria-label="Motiv světa" className={s.grid}>
      {themes.map((t) => {
        const active = t.id === value;
        return (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={active}
            className={clsx(s.card, active && s.active)}
            onClick={() => onChange(t.id)}
          >
            <img
              src={t.thumbnail}
              alt=""
              className={s.thumb}
              loading="lazy"
            />
            <span className={s.name}>{t.name}</span>
          </button>
        );
      })}
    </div>
  );
}
