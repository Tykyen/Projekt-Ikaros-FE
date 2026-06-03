import { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Modal } from '@/shared/ui';
import { useDebouncedValue } from '@/shared/lib/useDebouncedValue';
import { useWorldSearch } from '../api/useWorldSearch';
import s from './WorldSearchModal.module.css';

interface WorldSearchModalProps {
  open: boolean;
  onClose: () => void;
  /** Reálné ObjectId světa (filtr výsledků na BE). */
  worldId: string;
  worldSlug: string;
}

/**
 * 13.1 — vyhledávání stránek v rámci světa. Staví na sdíleném `Modal`
 * (Esc / backdrop / focus trap / autofocus inputu zdarma). Debounce 300 ms,
 * keyboard nav (↑/↓ + Enter). Provider = vždy `combined` (fulltext + sémantika);
 * volba enginu je vývojářský detail, hráči ho neukazujeme.
 */
export function WorldSearchModal({
  open,
  onClose,
  worldId,
  worldSlug,
}: WorldSearchModalProps) {
  const navigate = useNavigate();
  const [term, setTerm] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const debounced = useDebouncedValue(term, 300);
  const listRef = useRef<HTMLUListElement>(null);

  const { data: results, isFetching } = useWorldSearch({
    worldId,
    query: debounced,
  });

  const items = useMemo(() => results ?? [], [results]);
  const hasQuery = debounced.trim().length > 0;

  // Nový výsledek → zvýraznění zpět na 1. položku. React „adjust state during
  // render" pattern (ne effect → žádné cascading renders):
  // https://react.dev/learn/you-might-not-need-an-effect
  // (modal se mountuje čerstvý při každém otevření → `term` netřeba resetovat)
  const [prevItems, setPrevItems] = useState(items);
  if (prevItems !== items) {
    setPrevItems(items);
    setActiveIndex(0);
  }

  function goTo(slug: string) {
    navigate(`/svet/${worldSlug}/${slug}`);
    onClose();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (items.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % items.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + items.length) % items.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = items[activeIndex] ?? items[0];
      if (target) goTo(target.slug);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Hledat ve světě" size="lg">
      <div className={s.searchRow}>
        <Search size={18} className={s.searchIcon} aria-hidden="true" />
        <input
          type="search"
          className={s.input}
          placeholder="Hledat stránky…"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Hledat stránky ve světě"
        />
      </div>

      <div className={s.results}>
        {!hasQuery && (
          <p className={s.hint}>Začni psát pro vyhledávání ve stránkách světa.</p>
        )}

        {hasQuery && items.length === 0 && !isFetching && (
          <p className={s.hint}>Nic nenalezeno.</p>
        )}

        {items.length > 0 && (
          <ul ref={listRef} className={s.list}>
            {items.map((r, i) => (
              <li key={`${r.providerKey}:${r.slug}`}>
                <button
                  type="button"
                  className={i === activeIndex ? `${s.item} ${s.itemActive}` : s.item}
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => goTo(r.slug)}
                >
                  <span className={s.itemTitle}>{r.title}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
