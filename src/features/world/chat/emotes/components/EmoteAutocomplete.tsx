import { useEffect, useMemo, useRef, useState } from 'react';
import type { WorldEmote } from '../lib/types';
import { buildEmoteUrl } from '../lib/buildEmoteUrl';
import s from './EmoteAutocomplete.module.css';

/**
 * D-NEW-emote-autocomplete — Discord-style picker pod composer textareou.
 *
 * Otevírá se napsáním `:` + 1..N znaků (regex `(?:^|\s):(\w{1,})$` na pozici
 * kurzoru); composer řídí lifecycle a posílá `query` + `onSelect`. ↑/↓
 * naviguje, Enter/Tab vloží `:shortcode: `, Esc zavře.
 *
 * Filtr drží uvnitř — vstup je sjednocený seznam world+global emotes.
 */

interface Props {
  query: string;
  emotes: WorldEmote[];
  onSelect: (emote: WorldEmote) => void;
  onClose: () => void;
}

const MAX_VISIBLE = 6;

export function EmoteAutocomplete({ query, emotes, onSelect, onClose }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return emotes.slice(0, MAX_VISIBLE);
    // Prefix match má prioritu, pak contains.
    const prefix = emotes.filter((e) =>
      e.shortcode.toLowerCase().startsWith(q),
    );
    const contains = emotes.filter(
      (e) =>
        !e.shortcode.toLowerCase().startsWith(q) &&
        (e.shortcode.toLowerCase().includes(q) ||
          e.name.toLowerCase().includes(q)),
    );
    return [...prefix, ...contains].slice(0, MAX_VISIBLE);
  }, [emotes, query]);

  useEffect(() => setActive(0), [query, emotes]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
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
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [filtered, active, onSelect, onClose]);

  if (filtered.length === 0) {
    return (
      <div ref={rootRef} className={s.popover}>
        <div className={s.empty}>Žádný emote neodpovídá.</div>
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className={s.popover}
      role="listbox"
      aria-label="Vložit emote"
    >
      <div className={s.head}>Emotes — :{query}</div>
      {filtered.map((e, i) => (
        <button
          key={e.id}
          type="button"
          role="option"
          aria-selected={i === active}
          className={i === active ? `${s.row} ${s.rowActive}` : s.row}
          onMouseEnter={() => setActive(i)}
          onMouseDown={(ev) => {
            ev.preventDefault();
            onSelect(e);
          }}
        >
          <img
            className={s.image}
            src={buildEmoteUrl(e.imageUrl)}
            alt={`:${e.shortcode}:`}
            loading="lazy"
          />
          <span className={s.shortcode}>:{e.shortcode}:</span>
          <span className={s.name}>{e.name}</span>
          {!e.worldId && <span className={s.badgeGlobal}>★</span>}
        </button>
      ))}
      <div className={s.foot}>↵ vložit · esc zavřít</div>
    </div>
  );
}
