import { useState, useRef, useEffect } from 'react';
import { useTheme } from './useTheme';
import { listThemes } from './registry';
import type { ThemeId } from './types';
import s from './ThemeSwitcher.module.css';

export function ThemeSwitcher() {
  const { themeId, theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  const handleSelect = async (id: ThemeId) => {
    await setTheme(id);
    setOpen(false);
  };

  const themes = listThemes();

  return (
    <div ref={wrapperRef} className={s.wrapper}>
      <button
        type="button"
        className={s.trigger}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Vybrat motiv aplikace"
      >
        <img src={theme.thumbnail} alt="" className={s.triggerThumb} />
        <span className={s.triggerName}>{theme.name}</span>
        <span className={s.triggerCaret} aria-hidden="true">▼</span>
      </button>

      {open && (
        <ul className={s.popover} role="listbox" aria-label="Motivy aplikace">
          {themes.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                className={`${s.option} ${t.id === themeId ? s.optionActive : ''}`}
                onClick={() => void handleSelect(t.id)}
                role="option"
                aria-selected={t.id === themeId}
              >
                <img src={t.thumbnail} alt="" className={s.optionThumb} />
                <span className={s.optionName}>{t.name}</span>
                {t.id === themeId && <span className={s.optionCheck} aria-hidden="true">✓</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
