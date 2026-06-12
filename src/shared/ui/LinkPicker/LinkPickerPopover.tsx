import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { FileText, FilePlus2, ExternalLink, X } from 'lucide-react';
import { useAnchoredPosition } from './useAnchoredPosition';
import type { LinkSuggestion } from './types';
import s from './LinkPickerPopover.module.css';

export interface LinkPickerPopoverProps {
  /** Tlačítko, ke kterému se popover ukotví. */
  anchorRef: RefObject<HTMLElement | null>;
  open: boolean;
  onClose: () => void;
  /**
   * Aplikuje cíl. `title` = název vybrané stránky (auto-label u value-based
   * konzumentů); u URL / „zatím neexistující" stránky se předává surový dotaz.
   */
  onPick: (href: string, title?: string) => void;
  /** Odebrání aktuálního odkazu (zobrazí ✕ u current link banneru). */
  onRemove?: () => void;
  /** Adresář stránek světa pro autocomplete. Bez něj = jen URL režim. */
  directory?: LinkSuggestion[];
  /** Odvození slugu z dotazu pro „zatím neexistuje" volbu (typicky `slugify`). */
  makeSlug?: (query: string) => string;
  /** Povolit URL fallback input (text vs. menu = jen stránky). */
  allowUrl?: boolean;
  /** Aktuální cíl odkazu (zobrazí current link banner). */
  currentHref?: string;
  /** Předvyplnění hledání (např. označený text). */
  initialQuery?: string;
}

/** Strop zobrazených návrhů; seznam scrolluje (CSS max-height + overflow). */
const MAX_RESULTS = 30;

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/**
 * 7.2n — Sdílený picker odkazu pro celou platformu. Jedno UI (search stránek +
 * „zatím neexistuje" + volitelně URL + current link/odebrání) renderované přes
 * **Portal do body** s pozicí z `useAnchoredPosition` → nikdy ho neořízne
 * `overflow` panelu ani nepřekryje sousední sekce (fix „zalézání").
 *
 * Konzumenti jsou tencí adaptéry, které jen namapují `onPick`:
 *  - editor-based (StyleRail / BubbleMenu / SmartCellInput) → `setLink`,
 *  - value-based (PagePicker / MenuPanel) → `onChange(href)`.
 */
export function LinkPickerPopover({
  anchorRef,
  open,
  onClose,
  onPick,
  onRemove,
  directory,
  makeSlug,
  allowUrl = false,
  currentHref,
  initialQuery,
}: LinkPickerPopoverProps) {
  const [query, setQuery] = useState('');
  const [urlDraft, setUrlDraft] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pos = useAnchoredPosition(anchorRef, popoverRef, open);

  // Reset stavu při každém otevření; předvyplň hledání označeným textem.
  useEffect(() => {
    if (open) {
      setQuery(initialQuery ?? '');
      setUrlDraft('');
      inputRef.current?.focus();
    }
  }, [open, initialQuery]);

  // Zavři na klik mimo (popover i anchor) / Escape. Popover je v portálu, proto
  // se kontroluje i anchorRef zvlášť (není v DOM podstromu popoveru).
  useEffect(() => {
    if (!open) return;
    function onDocPointer(e: MouseEvent) {
      const t = e.target as Node;
      if (popoverRef.current?.contains(t)) return;
      if (anchorRef.current?.contains(t)) return;
      onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('mousedown', onDocPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose, anchorRef]);

  const dir = directory ?? [];
  const matches = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return dir.slice(0, MAX_RESULTS);

    // Relevance skóre (nižší = lepší). Řadí přesnou shodu a shodu na začátku
    // názvu/slova nad shodu „někde uprostřed" → „Magické organizace" vyplave
    // nahoru místo aby se pohřbila mezi desítkami konkrétních položek.
    function score(d: LinkSuggestion): number | null {
      const title = normalize(d.title);
      if (title === q) return 0;
      if (title.startsWith(q)) return 1;
      if (title.split(/\s+/).some((w) => w.startsWith(q))) return 2;
      if (title.includes(q)) return 3;
      if (normalize(d.slug).includes(q)) return 4;
      return null; // bez shody
    }

    return dir
      .map((d) => ({ d, sc: score(d) }))
      .filter((x): x is { d: LinkSuggestion; sc: number } => x.sc !== null)
      .sort((a, b) => a.sc - b.sc) // stabilní → při shodě skóre drží pořadí adresáře
      .slice(0, MAX_RESULTS)
      .map((x) => x.d);
  }, [dir, query]);

  const trimmedQuery = query.trim();
  const newPageSlug = makeSlug ? makeSlug(trimmedQuery) : '';
  const showCreateOption =
    !!makeSlug &&
    newPageSlug.length > 0 &&
    !dir.some((d) => d.slug === newPageSlug);

  const currentEntry = currentHref
    ? dir.find((d) => d.slug === currentHref)
    : undefined;
  const isExternal = !!currentHref && /^https?:\/\//i.test(currentHref);
  const isPending = !!currentHref && !currentEntry && !isExternal;

  function pick(href: string, title?: string) {
    onPick(href, title);
    onClose();
  }

  if (!open) return null;

  return createPortal(
    <div
      ref={popoverRef}
      className={s.picker}
      role="dialog"
      aria-label="Odkaz"
      style={
        pos
          ? { left: pos.left, top: pos.top }
          : { left: 0, top: 0, visibility: 'hidden' }
      }
    >
      {currentHref && (
        <div
          className={`${s.currentLink} ${isPending ? s.currentLinkPending : ''}`}
        >
          {isExternal ? (
            <ExternalLink size={12} aria-hidden />
          ) : isPending ? (
            <FilePlus2 size={12} aria-hidden />
          ) : (
            <FileText size={12} aria-hidden />
          )}
          <span className={s.currentLinkText}>
            {currentEntry ? (
              <>
                {currentEntry.title}{' '}
                <span className={s.currentLinkSlug}>/{currentEntry.slug}</span>
              </>
            ) : isExternal ? (
              currentHref
            ) : (
              <>
                <span className={s.currentLinkSlug}>/{currentHref}</span>{' '}
                (zatím neexistuje)
              </>
            )}
          </span>
          {onRemove && (
            <button
              type="button"
              onClick={() => {
                onRemove();
                onClose();
              }}
              className={s.clearBtn}
              aria-label="Odebrat odkaz"
              title="Odebrat odkaz"
            >
              <X size={12} aria-hidden />
            </button>
          )}
        </div>
      )}

      {directory && (
        <>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Hledat stránku nebo zadat název…"
            className={s.search}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && matches.length === 0 && showCreateOption) {
                e.preventDefault();
                pick(newPageSlug, trimmedQuery);
              }
            }}
          />
          <ul className={s.list}>
            {matches.length === 0 && !showCreateOption ? (
              <li className={s.empty}>
                {dir.length === 0
                  ? 'Tento svět zatím nemá žádné stránky.'
                  : 'Žádná stránka neodpovídá.'}
              </li>
            ) : (
              matches.map((d) => (
                <li key={d.id}>
                  <button
                    type="button"
                    className={`${s.option} ${d.slug === currentHref ? s.optionCurrent : ''}`}
                    onClick={() => pick(d.slug, d.title)}
                  >
                    <FileText size={13} aria-hidden />
                    <span className={s.optionTitle}>{d.title}</span>
                    <span className={s.optionSlug}>/{d.slug}</span>
                  </button>
                </li>
              ))
            )}
            {showCreateOption && (
              <li>
                <button
                  type="button"
                  className={`${s.option} ${s.optionCreate}`}
                  onClick={() => pick(newPageSlug, trimmedQuery)}
                >
                  <FilePlus2 size={13} aria-hidden />
                  <span className={s.optionTitle}>
                    Odkázat na „{trimmedQuery}"
                  </span>
                  <span className={s.optionSlug}>zatím neexistuje</span>
                </button>
              </li>
            )}
          </ul>
        </>
      )}

      {allowUrl && (
        <div className={s.urlRow}>
          <input
            type="text"
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            placeholder={directory ? '…nebo URL (https://)' : 'URL (https://)'}
            className={s.urlInput}
            autoFocus={!directory}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && urlDraft.trim()) {
                e.preventDefault();
                pick(urlDraft.trim());
              }
            }}
          />
          <button
            type="button"
            className={s.urlBtn}
            disabled={!urlDraft.trim()}
            onClick={() => pick(urlDraft.trim())}
          >
            OK
          </button>
        </div>
      )}
    </div>,
    document.body,
  );
}
