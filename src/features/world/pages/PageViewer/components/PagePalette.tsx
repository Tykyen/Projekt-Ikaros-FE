import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, Lock } from 'lucide-react';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { usePagesDirectory } from '../../api/usePagesDirectory';
import { fuzzyRank } from '../lib/fuzzyMatch';
import s from './PagePalette.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
}

/**
 * 7.1j — Cmd+K / Ctrl+K palette pro skok mezi stránkami světa. Fuzzy match
 * přes [src/.../lib/fuzzyMatch.ts]. Klávesy: šipky nahoru/dolů = navigate
 * v seznamu, Enter = vybrat, Esc = zavřít.
 */
export function PagePalette({ open, onClose }: Props) {
  const navigate = useNavigate();
  const { worldId, worldSlug } = useWorldContext();
  const { data: directory = [] } = usePagesDirectory(worldId);
  const [query, setQuery] = useState('');
  const [highlightIdx, setHighlightIdx] = useState(0);

  const ranked = useMemo(
    () => fuzzyRank(directory, query, 8),
    [directory, query],
  );

  // R19 adjustment-during-render místo useEffect (open/query jsou primitivní).
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setQuery('');
      setHighlightIdx(0);
    }
  }

  const [prevQuery, setPrevQuery] = useState(query);
  if (query !== prevQuery) {
    setPrevQuery(query);
    setHighlightIdx(0);
  }

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightIdx((i) => Math.min(i + 1, ranked.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightIdx((i) => Math.max(0, i - 1));
      } else if (e.key === 'Enter') {
        const target = ranked[highlightIdx];
        if (target) {
          navigate(`/svet/${worldSlug}/${target.slug}`);
          onClose();
        }
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, ranked, highlightIdx, navigate, worldSlug, onClose]);

  if (!open) return null;

  return createPortal(
    // Backdrop klik = myší zkratka pro zavření; klávesová cesta existuje
    // (Esc handler + výběr z listu), overlay tak nemusí být fokusovatelný.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <div className={s.overlay} role="dialog" aria-modal="true" onClick={onClose}>
      {/* Obsahový obal: onClick jen stopPropagation; zavření přes Esc. */}
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div className={s.panel} onClick={(e) => e.stopPropagation()}>
        <div className={s.searchRow}>
          <Search size={16} aria-hidden className={s.searchIcon} />
          {/* eslint-disable jsx-a11y/no-autofocus -- autofocus do hledání při otevření palety je záměr */}
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Najít stránku…"
            className={s.input}
            autoFocus
            aria-label="Vyhledat stránku"
          />
          {/* eslint-enable jsx-a11y/no-autofocus */}
        </div>

        {ranked.length === 0 ? (
          <p className={s.empty}>
            {query.length === 0
              ? 'Tento svět ještě nemá žádné stránky.'
              : 'Nic neodpovídá.'}
          </p>
        ) : (
          <ul className={s.list}>
            {ranked.map((p, i) => {
              // D-062c — utajená stránka (bez klíče): zámek + „utajeno" místo typu.
              const shielded = (p.shieldedBy?.length ?? 0) > 0;
              return (
                <li key={p.slug}>
                  <button
                    type="button"
                    className={`${s.item} ${
                      i === highlightIdx ? s.itemActive : ''
                    }`}
                    onMouseEnter={() => setHighlightIdx(i)}
                    onClick={() => {
                      navigate(`/svet/${worldSlug}/${p.slug}`);
                      onClose();
                    }}
                  >
                    {shielded ? (
                      <Lock size={14} aria-hidden className={s.itemIcon} />
                    ) : (
                      <FileText size={14} aria-hidden className={s.itemIcon} />
                    )}
                    <span className={s.itemTitle}>{p.title}</span>
                    <span className={s.itemMeta}>
                      {shielded ? '🔒 utajeno' : p.type}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <footer className={s.footer}>
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd> navigace
          </span>
          <span>
            <kbd>↵</kbd> otevřít
          </span>
          <span>
            <kbd>Esc</kbd> zavřít
          </span>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
