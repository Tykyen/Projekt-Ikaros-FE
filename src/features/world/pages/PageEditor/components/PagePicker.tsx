import { useEffect, useMemo, useRef, useState } from 'react';
import { Link2, FileText, FilePlus2, X } from 'lucide-react';
import type { PageDirectoryEntry } from '../../api/pages.types';
import { slugify } from '../lib/slugify';
import s from './PagePicker.module.css';

interface Props {
  /** Slug cílové stránky tohoto světa (prázdné = nevybráno). */
  value: string;
  /**
   * Volá se s `slug` a `title` zvolené stránky. `title` je název vybrané
   * stránky pro auto-label v rodiči — u „zatím neexistující" stránky se
   * předává surový dotaz uživatele.
   */
  onChange: (slug: string, title: string) => void;
  /** Adresář všech stránek světa pro autocomplete. */
  directory: PageDirectoryEntry[];
}

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/**
 * 7.2 — Picker stránky tohoto světa jako kompaktní 🔗 tlačítko (UX shodná
 * s linkem v SmartCellInput / Atributy). Klik → popover se search a seznamem.
 *
 * Lze odkázat i na **zatím neexistující** stránku (volba se objeví, když
 * žádná existující stránka neodpovídá zadanému dotazu) — slug se odvodí
 * `slugify(query)`, až se stránka založí, odkaz se spáruje sám.
 */
export function PagePicker({ value, onChange, directory }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(
    () => directory.find((d) => d.slug === value),
    [directory, value],
  );

  const hasValue = value !== '';
  // „Zatím neexistující" = hodnota je vyplněna, ale stránka s tímto slugem
  // v adresáři chybí. Není to chyba — uživatel vědomě odkazuje dopředu.
  const isPending = hasValue && !selected;

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const matches = useMemo(() => {
    const q = normalize(query.trim());
    const list = q
      ? directory.filter(
          (d) => normalize(d.title).includes(q) || normalize(d.slug).includes(q),
        )
      : directory;
    return list.slice(0, 8);
  }, [directory, query]);

  const trimmedQuery = query.trim();
  const newPageSlug = slugify(trimmedQuery);
  const showCreateOption =
    newPageSlug.length > 0 && !directory.some((d) => d.slug === newPageSlug);

  function applySelect(entry: PageDirectoryEntry) {
    onChange(entry.slug, entry.title);
    setOpen(false);
    setQuery('');
  }

  function applyCreate() {
    if (!newPageSlug) return;
    onChange(newPageSlug, trimmedQuery);
    setOpen(false);
    setQuery('');
  }

  function clearValue() {
    onChange('', '');
    setOpen(false);
    setQuery('');
  }

  const btnClass = `${s.linkBtn} ${hasValue ? s.linkBtnActive : ''}`;

  const btnTitle = selected
    ? `Odkazuje na: ${selected.title} (/${selected.slug})`
    : isPending
      ? `Odkazuje na: /${value} (stránka zatím neexistuje)`
      : 'Vybrat cílovou stránku';

  return (
    <div className={s.wrap} ref={wrapRef}>
      <button
        type="button"
        className={btnClass}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Odkaz na stránku"
        title={btnTitle}
      >
        <Link2 size={14} aria-hidden />
      </button>

      {open && (
        <div className={s.picker} role="dialog" aria-label="Odkaz na stránku">
          {selected && (
            <div className={s.currentLink}>
              <FileText size={12} aria-hidden />
              <span className={s.currentLinkText}>
                {selected.title}{' '}
                <span className={s.currentLinkSlug}>/{selected.slug}</span>
              </span>
              <button
                type="button"
                onClick={clearValue}
                className={s.clearBtn}
                aria-label="Odebrat odkaz"
                title="Odebrat odkaz"
              >
                <X size={12} aria-hidden />
              </button>
            </div>
          )}

          {isPending && (
            <div className={`${s.currentLink} ${s.currentLinkPending}`}>
              <FilePlus2 size={12} aria-hidden />
              <span className={s.currentLinkText}>
                /{value}{' '}
                <span className={s.currentLinkSlug}>(zatím neexistuje)</span>
              </span>
              <button
                type="button"
                onClick={clearValue}
                className={s.clearBtn}
                aria-label="Odebrat odkaz"
                title="Odebrat odkaz"
              >
                <X size={12} aria-hidden />
              </button>
            </div>
          )}

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Hledat stránku nebo zadat název…"
            className={s.search}
            onKeyDown={(e) => {
              if (
                e.key === 'Enter' &&
                matches.length === 0 &&
                showCreateOption
              ) {
                e.preventDefault();
                applyCreate();
              }
            }}
          />
          <ul className={s.list}>
            {matches.length === 0 && !showCreateOption ? (
              <li className={s.empty}>
                {directory.length === 0
                  ? 'Tento svět zatím nemá žádné stránky.'
                  : 'Žádná stránka neodpovídá.'}
              </li>
            ) : (
              matches.map((d) => {
                const isCurrent = d.slug === value;
                return (
                  <li key={d.id}>
                    <button
                      type="button"
                      className={`${s.option} ${isCurrent ? s.optionCurrent : ''}`}
                      onClick={() => applySelect(d)}
                    >
                      <FileText size={13} aria-hidden />
                      <span className={s.optionTitle}>{d.title}</span>
                      <span className={s.optionSlug}>/{d.slug}</span>
                    </button>
                  </li>
                );
              })
            )}
            {showCreateOption && (
              <li>
                <button
                  type="button"
                  className={`${s.option} ${s.optionCreate}`}
                  onClick={applyCreate}
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
        </div>
      )}
    </div>
  );
}
