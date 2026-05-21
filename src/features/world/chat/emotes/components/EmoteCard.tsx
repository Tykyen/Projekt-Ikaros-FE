import { type CSSProperties } from 'react';
import { Trash2, Copy as CopyIcon, Star, Pencil } from 'lucide-react';
import clsx from 'clsx';
import type { WorldEmote } from '../lib/types';
import { buildEmoteUrl } from '../lib/buildEmoteUrl';
import s from './EmoteCard.module.css';

interface EmoteCardProps {
  emote: WorldEmote;
  /** Globální karty mají hvězdu vlevo dole + skryté „Kopírovat". */
  variant: 'world' | 'global';
  onDelete?: () => void;
  onEdit?: () => void;
  onCopy?: () => void;
}

/**
 * Krok 6.4c/d — karta jednoho emote v admin gridu.
 * Vizuál: fialový rámeček, ornament kosočtverec v rohu, neonový glow na hover.
 */
export function EmoteCard({
  emote,
  variant,
  onDelete,
  onEdit,
  onCopy,
}: EmoteCardProps) {
  const url = buildEmoteUrl(emote.imageUrl);
  const label = `:${emote.shortcode}:`;

  return (
    <article
      className={clsx(s.card, variant === 'global' && s.cardGlobal)}
      aria-label={`Emote ${label} — ${emote.name}`}
      style={{ '--card-glow': 'var(--theme-glow)' } as CSSProperties}
    >
      <span className={s.cornerOrnament} aria-hidden="true">
        ◆
      </span>
      {variant === 'global' && (
        <span className={s.globalBadge} aria-label="Globální emote">
          <Star size={10} />
        </span>
      )}
      <div className={s.imageWrap}>
        <img className={s.image} src={url} alt={label} loading="lazy" />
      </div>
      <span className={s.shortcode} title={label}>
        {label}
      </span>
      <span className={s.name} title={emote.name}>
        {emote.name}
      </span>
      <div className={s.actions}>
        {onEdit && (
          <button
            type="button"
            className={s.actionBtn}
            onClick={onEdit}
            title="Upravit emote"
            aria-label="Upravit emote"
          >
            <Pencil size={14} />
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            className={s.actionBtn}
            onClick={onDelete}
            title="Smazat emote"
            aria-label="Smazat emote"
          >
            <Trash2 size={14} />
          </button>
        )}
        {onCopy && variant === 'world' && (
          <button
            type="button"
            className={s.actionBtn}
            onClick={onCopy}
            title="Kopírovat do jiného světa"
            aria-label="Kopírovat do jiného světa"
          >
            <CopyIcon size={14} />
          </button>
        )}
      </div>
    </article>
  );
}
