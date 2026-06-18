import { useEffect, useMemo, useRef, useState } from 'react';
import type { PageDirectoryEntry } from '@/features/world/pages/api/pages.types';
import s from './PersonaAutocomplete.module.css';

/**
 * 6.2-followup — našeptávač existujících postav/NPC pro masku (NpcOverridePanel).
 *
 * Vzor: `MentionAutocomplete` (@zmínka). Otevírá se z pole „Jméno NPC", filtruje
 * adresář světa (`usePersonaDirectory`) substringem podle `title` (case +
 * diakritika insensitive). Výběr vyplní jméno + avatar + slug; NpcOverridePanel
 * řídí lifecycle (open/close) a posílá `query` + `onSelect`.
 *
 * ↑/↓ naviguje, Enter/Tab vybere, Esc zavře.
 */

interface Props {
  query: string;
  entries: PageDirectoryEntry[];
  onSelect: (entry: PageDirectoryEntry) => void;
  onClose: () => void;
}

const MAX_VISIBLE = 6;

/** Diakritika-insensitive normalizace pro porovnání jmen (š→s, á→a, …). */
function norm(v: string): string {
  return v
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

export function PersonaAutocomplete({
  query,
  entries,
  onSelect,
  onClose,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const filtered = useMemo(() => {
    const q = norm(query.trim());
    const pool = q
      ? entries.filter((e) => norm(e.title).includes(q))
      : entries;
    return pool.slice(0, MAX_VISIBLE);
  }, [entries, query]);

  // Reset active při změně filtru — R19 adjustment-during-render (primitivní klíč).
  const filterKey = `${query}|${entries.length}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setActive(0);
  }

  // Klávesové ovládání: fokus drží input pole jména, listener na window (capture).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (filtered.length === 0) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActive((i) => (i + 1) % filtered.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActive((i) => (i - 1 + filtered.length) % filtered.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        const m = filtered[active];
        if (m) onSelect(m);
      }
    }
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [filtered, active, onSelect, onClose]);

  if (filtered.length === 0) {
    return (
      <div ref={rootRef} className={s.popover}>
        <div className={s.empty}>Žádná postava ani NPC neodpovídá.</div>
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className={s.popover}
      role="listbox"
      aria-label="Vybrat postavu nebo NPC"
    >
      <div className={s.head}>Postavy a NPC světa</div>
      {filtered.map((e, i) => (
        <button
          key={e.id}
          type="button"
          role="option"
          aria-selected={i === active}
          className={[s.row, i === active && s.rowActive]
            .filter(Boolean)
            .join(' ')}
          onMouseEnter={() => setActive(i)}
          onMouseDown={(ev) => {
            // mousedown ne click — ať input pole nezhasne fokus dřív.
            ev.preventDefault();
            onSelect(e);
          }}
        >
          <span className={s.avatar} aria-hidden="true">
            {e.imageUrl ? (
              <img src={e.imageUrl} alt="" />
            ) : (
              (e.title || '?').slice(0, 1).toUpperCase()
            )}
          </span>
          <span className={s.name}>{e.title}</span>
          <span className={s.type}>
            {e.type === 'NPC' ? 'NPC' : 'postava'}
          </span>
        </button>
      ))}
      <div className={s.foot}>↵ vybrat · esc zavřít</div>
    </div>
  );
}
