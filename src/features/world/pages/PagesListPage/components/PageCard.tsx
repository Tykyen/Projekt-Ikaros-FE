import { Link } from 'react-router-dom';
import { Star, Lock } from 'lucide-react';
import clsx from 'clsx';
import type { PageDirectoryEntry } from '../../api/pages.types';
import type { ShieldedRequirement } from '../../api/usePageMeta';
import { pageTypeIcon } from '../lib/pageTypeMeta';
import s from './PageCard.module.css';

interface Props {
  entry: PageDirectoryEntry;
  worldSlug: string;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

/**
 * D-062c — popis AKJ ochrany pro stub kartu. Nejvyšší AKJ úroveň (přímá nebo přes
 * AKJType label), fallback na Role / vyhrazený přístup. `shieldedBy` už nese
 * level+label z BE (žádný settings lookup).
 */
function shieldedLabel(shieldedBy: ShieldedRequirement[]): string {
  let topLevel = -1;
  let topLabel: string | null = null;
  for (const r of shieldedBy) {
    if (r.type === 'AKJ' || r.type === 'AKJType') {
      const lvl = r.level ?? 0;
      if (lvl > topLevel) {
        topLevel = lvl;
        topLabel = r.akjLabel ?? null;
      }
    }
  }
  if (topLevel >= 0) {
    return topLabel ? `AKJ: ${topLevel} — ${topLabel}` : `AKJ: ${topLevel}`;
  }
  const role = shieldedBy.find((r) => r.type === 'Role');
  if (role) return role.roleLabel ?? `Role ${role.level ?? '?'}`;
  return 'Vyhrazený přístup';
}

/**
 * 7.3 — Karta stránky v indexu. Celá karta je odkaz na viewer; hvězdička
 * (toggle oblíbených) je samostatné tlačítko nad odkazem.
 * D-062c — AKJ-chráněná stránka (current user nemá klíč) → stub varianta:
 * 🔒 + AKJ úroveň/label místo typu+slugu. Klik vede na AccessDenied (BE 403).
 */
export function PageCard({
  entry,
  worldSlug,
  isFavorite,
  onToggleFavorite,
}: Props) {
  const Icon = pageTypeIcon(entry.type);
  const shielded = (entry.shieldedBy?.length ?? 0) > 0;

  return (
    <div className={clsx(s.card, shielded && s.shielded)}>
      <Link
        to={`/svet/${worldSlug}/${entry.slug}`}
        className={s.link}
        aria-label={
          shielded
            ? `Utajená stránka ${entry.title} — vyžaduje přístup`
            : `Otevřít stránku ${entry.title}`
        }
      >
        <span className={s.icon}>
          {shielded ? (
            <Lock size={20} aria-hidden />
          ) : (
            /* eslint-disable-next-line react-hooks/static-components -- pageTypeIcon vrací existující Lucide komponentu z mapy, ne novou (R19 false-positive) */
            <Icon size={20} aria-hidden />
          )}
        </span>
        <span className={s.body}>
          <span className={s.title}>{entry.title}</span>
          <span className={s.meta}>
            {shielded ? (
              <span className={s.shieldedBadge}>
                🔒 {shieldedLabel(entry.shieldedBy!)}
              </span>
            ) : (
              <>
                <span className={s.typeBadge}>{entry.type}</span>
                <span className={s.slug}>/{entry.slug}</span>
              </>
            )}
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
