import { Link } from 'react-router-dom';
import {
  Star,
  Edit3,
  Globe2,
  ChevronRight,
  Link as LinkIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { WorldRole } from '@/shared/types';
import { useFavoritePages } from '../../api/useFavoritePages';
import type { Page } from '../../api/pages.types';
import s from './PageHeader.module.css';

interface Props {
  page: Page;
  /** Volitelný read-time (zobrazí se mezi metadaty). Null = skrýt. */
  readTimeMinutes: number | null;
}

/**
 * 7.1d — Hlavička viewer stránky:
 *  • Breadcrumbs 4-level (Ikaros / Svět / Stránky / aktuální)
 *  • Title
 *  • Read-time estimate (kromě Galerie)
 *  • isWoodWide badge (pokud true)
 *  • Favorite hvězda (optimistic)
 *  • Edit btn (jen PomocnyPJ+)
 */
export function PageHeader({ page, readTimeMinutes }: Props) {
  const { worldSlug, worldId, world, userRole } = useWorldContext();
  const favorites = useFavoritePages(worldId);
  const isFavorite = favorites.isFavorite(page.slug);
  const canEdit = (userRole ?? -1) >= WorldRole.PomocnyPJ;

  function handleCopyUrl() {
    void navigator.clipboard.writeText(window.location.href);
    toast.success('Odkaz zkopírován');
  }

  return (
    <header className={s.header}>
      <nav className={s.breadcrumbs} aria-label="Drobečková navigace">
        <Link to="/" className={s.crumb}>
          Ikaros
        </Link>
        <ChevronRight size={12} aria-hidden className={s.crumbSep} />
        <Link to={`/svet/${worldSlug}`} className={s.crumb}>
          {world?.name ?? 'Svět'}
        </Link>
        <ChevronRight size={12} aria-hidden className={s.crumbSep} />
        <Link to={`/svet/${worldSlug}/stranky`} className={s.crumb}>
          Stránky
        </Link>
        <ChevronRight size={12} aria-hidden className={s.crumbSep} />
        <span className={s.crumbCurrent} aria-current="page">
          {page.title}
        </span>
      </nav>

      <div className={s.titleRow}>
        <h1 className={s.title}>{page.title}</h1>

        <div className={s.actions}>
          {page.isWoodWide && (
            <span
              className={s.woodWide}
              title="Wood-Wide • součást celosvětového lore"
            >
              <Globe2 size={14} aria-hidden />
              <span className={s.woodWideText}>Wood-Wide</span>
            </span>
          )}
          {/* 5.2-followup — osobní oblíbené: hvězda VŠEM členům (ne jen PJ).
              Ukládá do User.favoritePageSlugs per svět, izolované per uživatel. */}
          <button
            type="button"
            className={`${s.starBtn} ${isFavorite ? s.starActive : ''}`}
            onClick={() => favorites.toggle(page.slug)}
            aria-label={
              isFavorite ? 'Odebrat z oblíbených' : 'Přidat do oblíbených'
            }
            aria-pressed={isFavorite}
          >
            <Star
              size={20}
              aria-hidden
              fill={isFavorite ? 'currentColor' : 'none'}
            />
          </button>
          <button
            type="button"
            className={s.starBtn}
            onClick={handleCopyUrl}
            aria-label="Zkopírovat odkaz"
            title="Zkopírovat odkaz"
          >
            <LinkIcon size={18} aria-hidden />
          </button>
          {canEdit && (
            <Link
              to={`/svet/${worldSlug}/edit/${page.slug}`}
              className={s.editBtn}
              title="Upravit stránku"
            >
              <Edit3 size={16} aria-hidden />
              <span className={s.editLabel}>Upravit</span>
            </Link>
          )}
        </div>
      </div>

      {readTimeMinutes !== null && (
        <div className={s.meta}>
          <span className={s.readTime}>
            📖 ~{readTimeMinutes} min čtení
          </span>
          <span className={s.metaSep}>·</span>
          <span className={s.pageType}>{page.type}</span>
        </div>
      )}
    </header>
  );
}
