/**
 * 16.2c — Selector skinu deníku „🎨 Vzhled".
 *
 * Malé dropdown menu se 7 styly (emoji + label). Klik → `onPick(id)`.
 * Bez vlastní theme-závislosti: drží se neutrálních inline barev, aby
 * fungoval nad libovolným skinem světa i nad libovolným skinem deníku.
 */
import { useEffect, useRef, useState } from 'react';
import { DIARY_SKINS, type DiarySkinId } from './registry';

interface Props {
  active: DiarySkinId;
  onPick: (id: DiarySkinId) => void;
  disabled?: boolean;
}

export function DiarySkinSelector({ active, onPick, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Klik mimo → zavřít.
  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const activeMeta = DIARY_SKINS.find((s) => s.id === active) ?? DIARY_SKINS[0];

  return (
    <div className="diary-skin-picker" ref={ref}>
      <button
        type="button"
        className="diary-skin-picker__btn"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Změnit vzhled deníku"
      >
        🎨 Vzhled <span className="diary-skin-picker__cur">{activeMeta.emoji} {activeMeta.label}</span>
      </button>
      {open && (
        // Menu jako <div> (ne <ul>): role="menu" na <ul> spouští
        // no-noninteractive-element-to-interactive-role; div + role="menuitemradio"
        // na tlačítkách je validní menu.
        <div className="diary-skin-picker__menu" role="menu">
          {DIARY_SKINS.map((s) => (
            <div key={s.id} role="none">
              <button
                type="button"
                role="menuitemradio"
                aria-checked={s.id === active}
                className={`diary-skin-picker__item${s.id === active ? ' is-active' : ''}`}
                onClick={() => {
                  onPick(s.id);
                  setOpen(false);
                }}
              >
                <span className="diary-skin-picker__emoji">{s.emoji}</span>
                {s.label}
                {s.id === active && <span className="diary-skin-picker__check">✓</span>}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
