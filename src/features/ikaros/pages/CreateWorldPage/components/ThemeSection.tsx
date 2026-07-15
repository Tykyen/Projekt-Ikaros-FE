import { useState } from 'react';
import clsx from 'clsx';
import { listThemes, getTheme } from '@/themes/registry';
import { themeForGenre } from '../constants/genres';
import { SectionCard } from './SectionCard';
import s from './ThemeSection.module.css';

interface Props {
  /** Zvolený žánr (label) — určuje výchozí motiv. */
  genre: string;
  /** Ruční přepis motivu PJ, nebo `null` = odvozeno ze žánru. */
  themeOverride: string | null;
  onThemeOverrideChange: (v: string | null) => void;
}

/**
 * 5.0 / 5.7 — motiv světa ve wizardu. Výchozí motiv se **odvozuje ze
 * žánru** (`themeForGenre`); PJ ho může přepsat výběrem ze světových
 * vzhledů (`listThemes('world')`). „Zpět na žánrový" override zruší.
 */
export function ThemeSection({
  genre,
  themeOverride,
  onThemeOverrideChange,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  const derived = themeForGenre(genre);
  const effective = themeOverride ?? derived;
  const theme = getTheme(effective);
  // Krok 5.7 — wizard tvorby světa nabízí jen světové vzhledy.
  const themes = listThemes('world');

  return (
    <SectionCard
      index={9}
      title="Motiv světa"
      description="Vizuální styl světa. Výchozí motiv se odvozuje ze žánru — můžeš ho přepsat."
    >
      <div className={s.current}>
        <div
          className={s.preview}
          style={
            theme.thumbnail
              ? { backgroundImage: `url(${theme.thumbnail})` }
              : undefined
          }
        >
          <span className={s.previewName}>{theme.name}</span>
        </div>
        <div className={s.currentMeta}>
          <span className={s.origin}>
            {themeOverride
              ? 'Vlastní volba'
              : `Odvozeno ze žánru${genre ? ` — ${genre}` : ''}`}
          </span>
          <div className={s.actions}>
            <button
              type="button"
              className={s.changeBtn}
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? 'Skrýt' : 'Změnit motiv'}
            </button>
            {themeOverride && (
              <button
                type="button"
                className={s.resetBtn}
                onClick={() => {
                  onThemeOverrideChange(null);
                  setExpanded(false);
                }}
              >
                Zpět na žánrový
              </button>
            )}
          </div>
        </div>
      </div>

      {expanded && (
        <div className={s.grid} role="radiogroup" aria-label="Motiv světa">
          {themes.map((t) => (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={t.id === effective}
              className={clsx(s.tile, t.id === effective && s.tileActive)}
              onClick={() => {
                onThemeOverrideChange(t.id);
                setExpanded(false);
              }}
              style={
                t.thumbnail
                  ? { backgroundImage: `url(${t.thumbnail})` }
                  : undefined
              }
            >
              <span className={s.tileName}>{t.name}</span>
            </button>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
