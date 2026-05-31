import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import clsx from 'clsx';
import type { PageDirectoryEntry } from '../../api/pages.types';
import { pageTypeIcon } from '../lib/pageTypeMeta';
import s from './PageCard.module.css';

interface Props {
  entry: PageDirectoryEntry;
  worldSlug: string;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

/**
 * 7.3 — Karta stránky v indexu. Celá karta je odkaz na viewer; hvězdička
 * (toggle oblíbených) je samostatné tlačítko nad odkazem.
 */
export function PageCard({
  entry,
  worldSlug,
  isFavorite,
  onToggleFavorite,
}: Props) {
  const Icon = pageTypeIcon(entry.type);

  return (
    <div className={s.card}>
      <Link
        to={`/svet/${worldSlug}/${entry.slug}`}
        className={s.link}
        aria-label={`Otevřít stránku ${entry.title}`}
      >
        <span className={s.icon}>
          {/* eslint-disable-next-line react-hooks/static-components -- pageTypeIcon vrací existující Lucide komponentu z mapy, ne novou (R19 false-positive) */}
          <Icon size={20} aria-hidden />
        </span>
        <span className={s.body}>
          <span className={s.title}>{entry.title}</span>
          <span className={s.meta}>
            <span className={s.typeBadge}>{entry.type}</span>
            <span className={s.slug}>/{entry.slug}</span>
          </span>
        </span>
      </Link>
      <button
        type="button"
        className={clsx(s.star, isFavorite && s.starActive)}
        onClick={onToggleFavorite}
        aria-pressed={isFavorite}
        aria-label={
          isFavorite ? 'Odebrat z oblíbených' : 'Přidat do oblíbených'
        }
        title={isFavorite ? 'Odebrat z oblíbených' : 'Přidat do oblíbených'}
      >
        <Star size={16} aria-hidden fill={isFavorite ? 'currentColor' : 'none'} />
      </button>
    </div>
  );
}
