import { useEffect, useMemo, useRef, useState } from 'react';
import { FileText, Search, X } from 'lucide-react';
import clsx from 'clsx';
import { usePagesDirectory } from '@/features/world/pages/api/usePagesDirectory';
import s from './PagePicker.module.css';

interface Props {
  worldId: string;
  /** Page slug nebo null. */
  value: string | null;
  onChange: (slug: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Voláno po vybrání → např. zavřít externí link input. */
  onPick?: () => void;
}

const MAX_RESULTS = 8;

/**
 * 9.5 — autocomplete pro výběr wiki stránky světa (use case: link u
 * světové novinky, budoucí use cases sdílené).
 *
 * Zdroj dat: `usePagesDirectory(worldId)` — cache TanStack 5 min,
 * sdílená napříč konzumenty.
 *
 * UX:
 * - `value !== null` → chip s názvem stránky + clear button (`×`).
 * - `value === null` → input s search; on focus dropdown s max 8 výsledky.
 * - Search: case-insensitive substring na `title` + `slug` (cs locale).
 * - Esc / click outside zavře dropdown.
 */
export function PagePicker({
  worldId,
  value,
  onChange,
  placeholder = 'Vyhledej stránku…',
  disabled = false,
  onPick,
}: Props) {
  const { data, isLoading } = usePagesDirectory(worldId);
  // useMemo: stabilní reference, jinak `?? []` mění deps downstream useMemo každý render.
  const pages = useMemo(() => data ?? [], [data]);

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // Najít již vybranou stránku pro chip render
  const selected = useMemo(
    () => (value ? pages.find((p) => p.slug === value) : null),
    [pages, value],
  );

  const results = useMemo(() => {
    if (!query.trim()) return pages.slice(0, MAX_RESULTS);
    const q = query.trim().toLocaleLowerCase('cs');
    return pages
      .filter(
        (p) =>
          p.title.toLocaleLowerCase('cs').includes(q) ||
          p.slug.toLocaleLowerCase('cs').includes(q),
      )
      .slice(0, MAX_RESULTS);
  }, [pages, query]);

  // Click outside → zavřít
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  function handlePick(slug: string) {
    onChange(slug);
    setQuery('');
    setOpen(false);
    onPick?.();
  }

  function handleClear() {
    onChange(null);
    setQuery('');
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      setOpen(false);
      e.currentTarget.blur();
    } else if (e.key === 'Enter' && results.length > 0) {
      e.preventDefault();
      handlePick(results[0]!.slug);
    }
  }

  // Vybráno → chip
  if (selected) {
    return (
      <div className={s.wrap} ref={wrapRef}>
        <div className={s.chip}>
          <FileText size={14} aria-hidden="true" />
          <span className={s.chipTitle} title={selected.slug}>
            {selected.title}
          </span>
          <span className={s.chipType}>{selected.type}</span>
          {!disabled && (
            <button
              type="button"
              className={s.clearBtn}
              onClick={handleClear}
              aria-label="Odstranit vybranou stránku"
              title="Odstranit"
            >
              <X size={14} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Vybráno NEní — input + dropdown
  return (
    <div className={s.wrap} ref={wrapRef}>
      <div className={clsx(s.inputWrap, disabled && s.disabled)}>
        <Search size={14} aria-hidden="true" className={s.icon} />
        <input
          type="text"
          className={s.input}
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
        />
      </div>

      {open && !disabled && (
        <div className={s.dropdown} role="listbox">
          {isLoading ? (
            <p className={s.empty}>Načítám…</p>
          ) : results.length === 0 ? (
            <p className={s.empty}>
              {query ? 'Žádná stránka neodpovídá hledání.' : 'Tento svět nemá žádné stránky.'}
            </p>
          ) : (
            results.map((p) => (
              <button
                key={p.slug}
                type="button"
                role="option"
                aria-selected="false"
                className={s.option}
                onClick={() => handlePick(p.slug)}
              >
                <FileText size={14} aria-hidden="true" />
                <span className={s.optionTitle}>{p.title}</span>
                <span className={s.optionType}>{p.type}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
