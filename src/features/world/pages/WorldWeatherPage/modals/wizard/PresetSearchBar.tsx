/**
 * 9.4-I — Sticky search bar nad wizardem.
 *
 * Debounce 150ms. Při nonempty query > 1 znak signalizuje parent přes
 * `onQueryChange` → parent přeskočí stage rozcestí/kategorie a pushne
 * filtrovaný preset list rovnou do stage 3.
 *
 * `prefersReducedMotion` neaplikujeme — input nemá animaci.
 */
import { useEffect, useId, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import s from './PresetSearchBar.module.css';

interface Props {
  /** Stable debounce hodnota = rodičovský filtrační stav. */
  value: string;
  onChange: (query: string) => void;
  placeholder?: string;
  /** Auto-focus při mount (např. po stisknutí „/" shortcutu — nemáme zatím). */
  autoFocus?: boolean;
  /** Debounce window v ms (default 150). */
  debounceMs?: number;
}

export function PresetSearchBar({
  value,
  onChange,
  placeholder = 'Hledej preset… (např. „praha", „mars", „les")',
  autoFocus,
  debounceMs = 150,
}: Props) {
  const inputId = useId();
  // Local state pro debounce. Search input vyžaduje immediate visual feedback
  // (každý keystroke v inputu) + debounced fire do parentu. To znamená:
  // - Local state = current input value (immediate)
  // - Parent state = debounced query (po 150ms idle)
  // - Parent reset (např. wizard close) → sync z props přes useEffect
  //
  // useEffect-setState pattern je zde JUSTIFIED — alternativy (key prop reset,
  // useState initializer) nepokrývají use case parent-driven mid-life reset.
  const [local, setLocal] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- viz komentář výše
    setLocal(value);
  }, [value]);

  // Debounce parent change.
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (local === value) return;
    timerRef.current = setTimeout(() => {
      onChange(local);
    }, debounceMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local, debounceMs]);

  return (
    <div className={s.row}>
      <label className={s.wrap} htmlFor={inputId}>
        <Search className={s.icon} size={18} aria-hidden />
        <input
          id={inputId}
          type="search"
          className={s.input}
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          aria-label="Hledat preset počasí"
          autoComplete="off"
        />
      </label>
    </div>
  );
}
