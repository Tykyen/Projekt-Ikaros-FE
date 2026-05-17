import { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import { Palette, RotateCcw, Check } from 'lucide-react';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { useWorldTheme } from '@/themes/useWorldTheme';
import { listThemes } from '@/themes/registry';
import s from './WorldThemeSwitcher.module.css';

/**
 * Spec 5.0e — preset switcher „Vzhled světa" v headeru WorldLayout.
 * Hráč si pro sebe (per zařízení) přepne motiv světa mezi 21 motivy +
 * Matrix skinem; „Reset" vrací na sdílený základ PJ. Plný editor
 * (color pickery, upload pozadí) = krok 5.3f.
 */
export function WorldThemeSwitcher() {
  const { world } = useWorldContext();
  const { themeId, isOverridden, setOverride, reset } = useWorldTheme(world);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const themes = listThemes('world');

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  return (
    <div ref={ref} className={s.wrapper}>
      <button
        type="button"
        className={s.trigger}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Vzhled světa"
        title="Vzhled světa"
      >
        <Palette size={18} aria-hidden="true" />
      </button>

      {open && (
        <div className={s.popover} role="menu">
          <div className={s.title}>Vzhled světa</div>
          <ul className={s.list}>
            {themes.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={t.id === themeId}
                  className={clsx(s.option, t.id === themeId && s.optionActive)}
                  onClick={() => {
                    setOverride(t.id);
                    setOpen(false);
                  }}
                  style={
                    t.thumbnail
                      ? { backgroundImage: `url(${t.thumbnail})` }
                      : undefined
                  }
                >
                  <span className={s.optionName}>{t.name}</span>
                  {t.id === themeId && (
                    <Check size={14} className={s.check} aria-hidden="true" />
                  )}
                </button>
              </li>
            ))}
          </ul>
          {isOverridden && (
            <button
              type="button"
              className={s.resetBtn}
              onClick={() => {
                reset();
                setOpen(false);
              }}
            >
              <RotateCcw size={14} aria-hidden="true" />
              Reset na výchozí
            </button>
          )}
        </div>
      )}
    </div>
  );
}
