import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FileText, Search, X } from 'lucide-react';
import clsx from 'clsx';
import { usePagesDirectory } from '@/features/world/pages/api/usePagesDirectory';
import { rankPageSuggestions, useAnchoredPosition } from '@/shared/ui/LinkPicker';
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

/**
 * 9.5 — autocomplete pro výběr wiki stránky světa (use case: link u
 * světové novinky, vlastní navigace světa).
 *
 * Zdroj dat: `usePagesDirectory(worldId)` — cache TanStack 5 min,
 * sdílená napříč konzumenty.
 *
 * UX:
 * - `value !== null` → chip s názvem stránky + clear button (`×`).
 * - `value === null` → input s search; on focus dropdown (scroll, viz CSS).
 * - Hledání + relevance řazení sdílí `rankPageSuggestions` se sdíleným
 *   `LinkPickerPopover` → jedna logika napříč všemi pickery odkazů.
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
  // Anchor = input wrapper; dropdown se renderuje přes Portal do body a kotví se
  // k němu přes `useAnchoredPosition` (position: fixed) → neuvězní ho stacking
  // context panelu (SettingsPanel má opacity-animaci) ani overflow sekce.
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const dropdownOpen = open && !disabled;
  const pos = useAnchoredPosition(anchorRef, dropdownRef, dropdownOpen);
  // Šířka dropdownu = šířka inputu (hook zarovná pravý okraj → levý sedí k anchoru).
  const [anchorWidth, setAnchorWidth] = useState(0);
  useLayoutEffect(() => {
    if (dropdownOpen && anchorRef.current) {
      setAnchorWidth(anchorRef.current.offsetWidth);
    }
  }, [dropdownOpen]);

  // Najít již vybranou stránku pro chip render
  const selected = useMemo(
    () => (value ? pages.find((p) => p.slug === value) : null),
    [pages, value],
  );

  const results = useMemo(
    () => rankPageSuggestions(pages, query),
    [pages, query],
  );

  // Click outside → zavřít. Dropdown je v Portálu (mimo wrapRef), proto se
  // kontroluje i `dropdownRef` zvlášť — jinak by mousedown na položku zavřel
  // dropdown dřív, než proběhne click → výběr by se ztratil.
  useEffect(() => {
    if (!open) return;
    function onDocPointer(e: MouseEvent) {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t)) return;
      if (dropdownRef.current?.contains(t)) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', onDocPointer);
    return () => document.removeEventListener('mousedown', onDocPointer);
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

  // Vybráno NEní — input + dropdown (Portal)
  return (
    <div className={s.wrap} ref={wrapRef}>
      <div
        ref={anchorRef}
        className={clsx(s.inputWrap, disabled && s.disabled)}
      >
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

      {dropdownOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            className={s.dropdown}
            role="listbox"
            style={
              pos
                ? { left: pos.left, top: pos.top, width: anchorWidth || undefined }
                : { left: 0, top: 0, visibility: 'hidden' }
            }
          >
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
          </div>,
          document.body,
        )}
    </div>
  );
}
