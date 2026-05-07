import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { useTheme } from './useTheme';
import { listThemes } from './registry';
import type { ThemeId } from './types';
import s from './ThemeSwitcher.module.css';

export function ThemeSwitcher() {
  const { themeId, theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [focusIndex, setFocusIndex] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLUListElement>(null);

  const themes = listThemes();

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

  const onKeyDown = (e: KeyboardEvent<HTMLUListElement>) => {
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
      >
        <img src={theme.thumbnail} alt="" className={s.triggerThumb} />
        <span className={s.triggerName}>{theme.name}</span>
        <span className={s.triggerCaret} aria-hidden="true">▼</span>
      </button>

      {open && (
        <ul
          ref={popoverRef}
          className={s.popover}
          role="listbox"
          aria-label="Motivy aplikace"
          aria-activedescendant={`theme-option-${focusIndex}`}
          onKeyDown={onKeyDown}
          tabIndex={-1}
        >
          {themes.map((t, idx) => (
            <li key={t.id}>
              <button
                type="button"
                id={`theme-option-${idx}`}
                className={`${s.option} ${t.id === themeId ? s.optionActive : ''} ${idx === focusIndex ? s.optionFocused : ''}`}
                onClick={() => handleSelect(t.id)}
                role="option"
                aria-selected={t.id === themeId}
                data-index={idx}
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
