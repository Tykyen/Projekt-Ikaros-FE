import { Link } from 'react-router-dom';
import { User, Skull, Star } from 'lucide-react';
import type { CharacterDirectoryEntry } from '../../api/characters.types';
import s from './CharacterCard.module.css';

interface Props {
  entry: CharacterDirectoryEntry;
  worldSlug: string;
  /** Jméno přiřazeného hráče (jen PC). */
  playerName?: string;
  /** 8.3 — Herní skupina hráče. Zobrazí se jen když je `groupBy` aktivní. */
  groupLabel?: string;
  /** 8.3 — Barva skupiny (z `WorldSettings.groupColors`). */
  groupColor?: string;
  /** 8.3 — Oblíbená postava? Hvězdička toggle, persistované v localStorage. */
  isFavorite?: boolean;
  onToggleFavorite?: (slug: string) => void;
}

/**
 * 8.2e — Karta postavy v adresáři. Čtvercový avatar (odlišení od kruhových
 * UserAvatar = lidé), jméno, badge typu, u PC i jméno hráče. Celá karta je link.
 * 8.3 — Hvězdička oblíbených (top-right overlay) + volitelný group chip.
 */
export function CharacterCard({
  entry,
  worldSlug,
  playerName,
  groupLabel,
  groupColor,
  isFavorite,
  onToggleFavorite,
}: Props) {
  const handleFav = (e: React.MouseEvent) => {
    // Hvězdička nesmí aktivovat proklik karty (Link wrap).
    e.preventDefault();
    e.stopPropagation();
    onToggleFavorite?.(entry.slug);
  };

  return (
    <Link
      to={`/svet/${worldSlug}/${entry.slug}`}
      className={s.card}
      data-elev="card"
    >
      {onToggleFavorite && (
        <button
          type="button"
          className={`${s.favBtn} ${isFavorite ? s.favBtnActive : ''}`}
          aria-pressed={isFavorite}
          aria-label={isFavorite ? 'Odebrat z oblíbených' : 'Přidat do oblíbených'}
          onClick={handleFav}
        >
          <Star
            size={18}
            aria-hidden
            fill={isFavorite ? 'currentColor' : 'none'}
          />
        </button>
      )}
      <div className={s.avatar}>
        {entry.imageUrl ? (
          <img src={entry.imageUrl} alt="" loading="lazy" />
        ) : (
          <User size={36} aria-hidden className={s.avatarPlaceholder} />
        )}
      </div>
      <h3 className={s.name}>{entry.name}</h3>
      {/* 9.1 (cleanup) — Lokace odebrány z adresáře postav; typ je jen PC/NPC. */}
      <span className={s.typeBadge}>
        {entry.isNpc ? (
          <>
            <Skull size={11} aria-hidden /> NPC
          </>
        ) : (
          <>
            <User size={11} aria-hidden /> Hráčská postava
          </>
        )}
      </span>
      {!entry.isNpc && playerName && (
        <span className={s.player}>
          <User size={11} aria-hidden /> {playerName}
        </span>
      )}
      {groupLabel && (
        <span
          className={s.groupChip}
          style={
            groupColor
              ? ({ '--group-accent': groupColor } as React.CSSProperties)
              : undefined
          }
        >
          {groupLabel}
        </span>
      )}
    </Link>
  );
}
