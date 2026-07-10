import { useState, useRef, useEffect, type KeyboardEvent, type CSSProperties } from 'react';
import { useTheme } from './useTheme';
import { listThemes } from './registry';
import type { ThemeId } from './types';
import s from './ThemeSwitcher.module.css';

export function ThemeSwitcher() {
  const { themeId, theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [focusIndex, setFocusIndex] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Krok 5.7 — platformový switcher nabízí jen platformové skiny;
  // světové vzhledy (ikaros, žánrové) sem nepatří.
  const themes = listThemes('platform');

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onEsc = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      popoverRef.current?.focus();
    }
  }, [open]);

  const handleOpen = () => {
    const idx = themes.findIndex((t) => t.id === themeId);
    setFocusIndex(idx >= 0 ? idx : 0);
    setOpen(true);
  };

  const handleSelect = (id: ThemeId) => {
    setTheme(id);
    setOpen(false);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusIndex((i) => Math.min(i + 1, themes.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Home') {
      e.preventDefault();
      setFocusIndex(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setFocusIndex(themes.length - 1);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const t = themes[focusIndex];
      if (t) handleSelect(t.id);
    }
  };

  return (
    <div ref={wrapperRef} className={s.wrapper}>
      <button
        type="button"
        className={s.trigger}
        onClick={() => (open ? setOpen(false) : handleOpen())}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Vybrat motiv aplikace"
        style={theme.background ? { backgroundImage: `url(${theme.background})` } : undefined}
      >
        <span className={s.triggerName}>{theme.name}</span>
        <span className={s.triggerCaret} aria-hidden="true">▼</span>
      </button>

      {open && (
        // Listbox jako <div> (ne <ul>): role="listbox" na <ul> spouští
        // no-noninteractive-element-to-interactive-role; div + role="option"
        // na tlačítkách je kanonický ARIA listbox.
        <div
          ref={popoverRef}
          className={s.popover}
          role="listbox"
          aria-label="Motivy aplikace"
          aria-activedescendant={`theme-option-${focusIndex}`}
          onKeyDown={onKeyDown}
          tabIndex={-1}
        >
          {themes.map((t, idx) => {
            const previewFont = t.fonts?.display ?? t.fonts?.logo;
            const optionStyle: CSSProperties = {};
            if (t.background) optionStyle.backgroundImage = `url(${t.background})`;
            return (
              <div key={t.id} role="presentation">
                <button
                  type="button"
                  id={`theme-option-${idx}`}
                  className={`${s.option} ${t.id === themeId ? s.optionActive : ''} ${idx === focusIndex ? s.optionFocused : ''}`}
                  onClick={() => handleSelect(t.id)}
                  role="option"
                  aria-selected={t.id === themeId}
                  data-index={idx}
                  data-theme-id={t.id}
                  style={optionStyle}
                >
                  <span
                    className={s.optionName}
                    style={previewFont ? { fontFamily: `"${previewFont}", Georgia, serif` } : undefined}
                  >
                    {t.name}
                  </span>
                  {t.id === themeId && <span className={s.optionCheck} aria-hidden="true">✓</span>}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
