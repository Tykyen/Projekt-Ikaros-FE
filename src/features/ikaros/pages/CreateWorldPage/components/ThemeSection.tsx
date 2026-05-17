import clsx from 'clsx';
import { listThemes } from '@/themes/registry';
import { SectionCard } from './SectionCard';
import s from './ThemeSection.module.css';

interface Props {
  themeId: string;
  onThemeChange: (v: string) => void;
}

/**
 * 5.0 — výběr motivu světa ve wizardu tvorby. Sdílený základ vzhledu
 * (kanonický vzhled světa); každý člen si ho pak může pro sebe přenastavit
 * (preset switcher v headeru). Nabídka = `listThemes('world')`.
 */
export function ThemeSection({ themeId, onThemeChange }: Props) {
  const themes = listThemes('world');

  return (
    <SectionCard
      index={6}
      title="Motiv světa"
      description="Vizuální styl, který uvidí všichni členové. Každý si ho pak může pro sebe přenastavit."
    >
      <div className={s.grid} role="radiogroup" aria-label="Motiv světa">
        {themes.map((t) => (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={t.id === themeId}
            className={clsx(s.tile, t.id === themeId && s.tileActive)}
            onClick={() => onThemeChange(t.id)}
            style={
              t.thumbnail ? { backgroundImage: `url(${t.thumbnail})` } : undefined
            }
          >
            <span className={s.tileName}>{t.name}</span>
          </button>
        ))}
      </div>
    </SectionCard>
  );
}
