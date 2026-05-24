import { useMemo, useState } from 'react';
import { Plus, X } from 'lucide-react';
import type { WorldEmote } from '../lib/types';
import { EmoteCard } from './EmoteCard';
import s from './EmoteGrid.module.css';

interface EmoteGridProps {
  emotes: WorldEmote[];
  variant: 'world' | 'global';
  onUpload: () => void;
  onDelete: (emote: WorldEmote) => void;
  onEdit?: (emote: WorldEmote) => void;
  onCopy?: (emote: WorldEmote) => void;
}

/**
 * Krok 6.4 + D-NEW-emote-categories — grid karet s tag filter chip-row.
 * Filtr se zobrazí pouze pokud aspoň jeden emote má `tags`. Klik na chip
 * filtruje grid (toggle). „Vymazat filtr" reset.
 */
export function EmoteGrid({
  emotes,
  variant,
  onUpload,
  onDelete,
  onEdit,
  onCopy,
}: EmoteGridProps) {
  const [activeTags, setActiveTags] = useState<string[]>([]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const e of emotes) for (const t of e.tags ?? []) set.add(t);
    return [...set].sort();
  }, [emotes]);

  const filtered = useMemo(() => {
    if (activeTags.length === 0) return emotes;
    return emotes.filter((e) =>
      activeTags.every((t) => (e.tags ?? []).includes(t)),
    );
  }, [emotes, activeTags]);

  function toggleTag(tag: string) {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  return (
    <>
      {allTags.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
            padding: '8px 0 12px',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '0.85em', opacity: 0.7 }}>Filtr:</span>
          {allTags.map((tag) => {
            const active = activeTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '999px',
                  border: '1px solid var(--frame-border, #444)',
                  background: active
                    ? 'var(--accent, #4c6fff)'
                    : 'transparent',
                  color: active
                    ? 'var(--text-on-accent, #fff)'
                    : 'var(--text-secondary, #aaa)',
                  fontSize: '0.85em',
                  cursor: 'pointer',
                }}
              >
                {tag}
              </button>
            );
          })}
          {activeTags.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTags([])}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary, #aaa)',
                fontSize: '0.85em',
                cursor: 'pointer',
              }}
            >
              <X size={12} aria-hidden /> Vymazat
            </button>
          )}
        </div>
      )}
      <div className={s.grid}>
        {filtered.map((e, i) => (
          <div
            key={e.id}
            className={s.cell}
            style={{ animationDelay: `${Math.min(i, 12) * 60}ms` }}
          >
            <EmoteCard
              emote={e}
              variant={variant}
              onDelete={() => onDelete(e)}
              onEdit={onEdit ? () => onEdit(e) : undefined}
              onCopy={variant === 'world' && onCopy ? () => onCopy(e) : undefined}
            />
          </div>
        ))}
        <button
          type="button"
          className={s.uploadTile}
          onClick={onUpload}
          aria-label="Nový emote"
          title="Nový emote"
        >
          <Plus size={32} aria-hidden="true" />
          <span className={s.uploadLabel}>Nový emote</span>
        </button>
      </div>
    </>
  );
}
