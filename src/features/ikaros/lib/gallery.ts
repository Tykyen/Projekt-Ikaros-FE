import type { CSSProperties } from 'react';
import type { GalleryCategory, IkarosGalleryItem } from '@/shared/types';

const FALLBACK_CATEGORY: GalleryCategory = {
  key: 'ostatni',
  label: 'Ostatní',
  color: 'var(--gal-cat-ostatni)',
  order: 999,
};

/**
 * 3.3 — vloží Cloudinary transformace do URL (thumbnaily v mřížce nestahují
 * full-res). `mode` `fill` ořízne na rozměr, `fit` zachová celý obraz.
 */
export function cloudinaryThumb(
  url: string,
  width: number,
  height?: number,
  mode: 'fill' | 'fit' = 'fill',
): string {
  if (!url || !url.includes('/upload/')) return url;
  const parts = [
    `w_${width}`,
    height ? `h_${height}` : '',
    `c_${mode}`,
    'q_auto',
    'f_auto',
  ].filter(Boolean);
  return url.replace('/upload/', `/upload/${parts.join(',')}/`);
}

/** Poměr stran pro masonry placeholder; fallback 1:1 u starých dokumentů. */
export function aspectRatio(item: Pick<IkarosGalleryItem, 'width' | 'height'>): number {
  if (item.width > 0 && item.height > 0) return item.width / item.height;
  return 1;
}

/** N° label — posledních 4 znaků ID, uppercase. */
export function imageNumber(imageId: string): string {
  return imageId.slice(-4).toUpperCase();
}

/** Inline style s `--gal-cat-current` (předává barvu kategorie do CSS module). */
export function categoryStyle(
  category: GalleryCategory | undefined,
): CSSProperties {
  if (!category) return {};
  return { ['--gal-cat-current' as never]: category.color };
}

/** Najde kategorii podle key; fallback `ostatni` nebo hardcoded fallback. */
export function categoryByKey(
  categories: GalleryCategory[],
  key: string,
): GalleryCategory {
  return (
    categories.find((c) => c.key === key) ??
    categories.find((c) => c.key === 'ostatni') ??
    FALLBACK_CATEGORY
  );
}

/** Relativní čas („před 30 min", „před 3 d", absolute pro starší). */
export function timeAgo(iso: string): string {
  const sec = Math.max(
    0,
    Math.round((Date.now() - new Date(iso).getTime()) / 1000),
  );
  if (sec < 60) return 'právě teď';
  const min = Math.round(sec / 60);
  if (min < 60) return `před ${min} min`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `před ${hr} h`;
  const days = Math.round(hr / 24);
  if (days < 7) return `před ${days} d`;
  return new Date(iso).toLocaleDateString('cs-CZ', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });
}

/** CS locale date (např. „12. listopadu 2026"). */
export function formatDateCs(iso: string): string {
  return new Date(iso).toLocaleDateString('cs-CZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** Status label CZ. */
export function statusLabel(status: IkarosGalleryItem['status']): string {
  return (
    {
      Draft: 'Koncept',
      Pending: 'Čeká na schválení',
      Published: 'Publikováno',
      Rejected: 'Zamítnuto',
    } as const
  )[status];
}

/** Status CSS var (badge color). */
export function statusColor(status: IkarosGalleryItem['status']): string {
  return (
    {
      Draft: 'var(--status-draft)',
      Pending: 'var(--status-pending)',
      Published: 'var(--status-published)',
      Rejected: 'var(--status-rejected)',
    } as const
  )[status];
}

export type SortKey = 'new' | 'top' | 'most-rated';

/**
 * 3.3c — filter + sort obrázků pro Přehled tab. Published only, client-side
 * search (title + description), multi-kategorie OR filter.
 */
export function filterImages(
  images: IkarosGalleryItem[],
  query: string,
  catFilter: Set<string>,
  sort: SortKey,
): IkarosGalleryItem[] {
  const q = query.trim().toLowerCase();
  const filtered = images.filter((img) => {
    if (img.status !== 'Published') return false;
    if (catFilter.size > 0 && !catFilter.has(img.category)) return false;
    if (q) {
      const inTitle = img.title.toLowerCase().includes(q);
      const inDesc = (img.description ?? '').toLowerCase().includes(q);
      if (!inTitle && !inDesc) return false;
    }
    return true;
  });

  return [...filtered].sort((a, b) => {
    if (sort === 'top') {
      if (b.averageRating !== a.averageRating)
        return b.averageRating - a.averageRating;
      return b.ratings.length - a.ratings.length;
    }
    if (sort === 'most-rated') {
      return b.ratings.length - a.ratings.length;
    }
    const aDate = new Date(a.publishedAtUtc ?? a.createdAtUtc).getTime();
    const bDate = new Date(b.publishedAtUtc ?? b.createdAtUtc).getTime();
    return bDate - aDate;
  });
}
