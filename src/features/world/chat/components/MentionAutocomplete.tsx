import { useEffect, useMemo, useRef, useState } from 'react';
import s from './MentionAutocomplete.module.css';

/**
 * Krok 6.2i — Discord-style mention picker pod composer textareou.
 *
 * Otevírá se napsáním `@` + 0..N znaků (regex `(?:^|\s)@(\w*)$` na pozici
 * kurzoru); composer řídí lifecycle a posílá `query` + `onSelect`. ↑/↓
 * naviguje, Enter/Tab vloží `@username `, Esc zavře.
 *
 * Filtr drží uvnitř — `members` je vstup; tady jen `startsWith(username)` /
 * `characterPath.includes(query)` (case-insensitive).
 */

export interface MentionCandidate {
  userId: string;
  username: string;
  characterPath?: string;
  avatarUrl?: string;
  /**
   * D-NEW-chat-mention-all (2026-05-21) — `@all` / `@here` virtuální položky.
   * BE chat.service.ts rozpozná tokeny `all`/`here` a rozšíří `mentions` na
   * všechny recipients konverzace.
   */
  isSpecial?: 'all' | 'here';
  /**
   * D-NEW-chat-mention-character (2026-05-23) — jak byl kandidát matchnut:
   * `'user'` (login) = token bude `username`,
   * `'character'` (slug postavy) = token bude `characterPath`.
   * Default `'user'` pro zpětnou kompatibilitu (specials zůstávají user-like).
   */
  matchedAs?: 'user' | 'character';
}

/** Special `@all` a `@here` položky — jsou vždy nahoře pickeru. */
const SPECIAL_CANDIDATES: MentionCandidate[] = [
  {
    userId: '__all__',
    username: 'all',
    characterPath: 'všichni v této konverzaci',
    isSpecial: 'all',
  },
  {
    userId: '__here__',
    username: 'here',
    characterPath: 'všichni online v této konverzaci',
    isSpecial: 'here',
  },
];

interface Props {
  query: string;
  members: MentionCandidate[];
  /** Vybrat → composer vloží `@username ` a zavře picker. */
  onSelect: (member: MentionCandidate) => void;
  onClose: () => void;
}

const MAX_VISIBLE = 6;

export function MentionAutocomplete({
  query,
  members,
  onSelect,
  onClose,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    // D-NEW-chat-mention-all (2026-05-21) — special tokens always at the top
    // if query is empty or matches their prefix.
    const matchedSpecials = SPECIAL_CANDIDATES.filter((sp) =>
      !q ? true : sp.username.startsWith(q),
    );
    if (!q) {
      return [...matchedSpecials, ...members.slice(0, MAX_VISIBLE - matchedSpecials.length)];
    }
    // D-NEW-chat-mention-character — annotace `matchedAs` rozhoduje, co vloží
    // composer (`@username` vs `@character-slug`).
    const matchedMembers = members.flatMap<MentionCandidate>((m) => {
      const u = m.username.toLowerCase();
      const c = (m.characterPath ?? '').toLowerCase();
      const matchUser = u.startsWith(q);
      const matchChar = c.length > 0 && c.includes(q);
      if (matchUser) return [{ ...m, matchedAs: 'user' }];
      if (matchChar) return [{ ...m, matchedAs: 'character' }];
      return [];
    });
    return [...matchedSpecials, ...matchedMembers].slice(0, MAX_VISIBLE);
  }, [members, query]);

  // Reset active při změně filtru — R19 adjustment-during-render (primitivní klíč).
  const filterKey = `${query}|${members.length}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setActive(0);
  }

  // Klávesové ovládání: composer drží focus, takže listener na window.
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
        <div className={s.empty}>Nikoho jsme nenašli.</div>
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className={s.popover}
      role="listbox"
      aria-label="Zmínit hráče"
    >
      <div className={s.head}>Členové konverzace</div>
      {filtered.map((m, i) => (
        <button
          key={m.userId}
          type="button"
          role="option"
          aria-selected={i === active}
          className={[
            s.row,
            i === active && s.rowActive,
            m.isSpecial && s.rowSpecial,
          ]
            .filter(Boolean)
            .join(' ')}
          onMouseEnter={() => setActive(i)}
          onMouseDown={(e) => {
            // mousedown ne click — ať composer textarea nezhasne fokus dřív.
            e.preventDefault();
            onSelect(m);
          }}
        >
          <span className={s.avatar} aria-hidden="true">
            {m.isSpecial ? (
              <span className={s.specialIcon}>@</span>
            ) : m.avatarUrl ? (
              <img src={m.avatarUrl} alt="" />
            ) : (
              m.username.slice(0, 1).toUpperCase()
            )}
          </span>
          <span className={s.username}>
            @
            {m.matchedAs === 'character' && m.characterPath
              ? m.characterPath
              : m.username}
          </span>
          {m.characterPath && (
            <span className={s.character}>
              {m.matchedAs === 'character' ? `🎭 ${m.username}` : m.characterPath}
            </span>
          )}
        </button>
      ))}
      <div className={s.foot}>↵ vložit · esc zavřít</div>
    </div>
  );
}
