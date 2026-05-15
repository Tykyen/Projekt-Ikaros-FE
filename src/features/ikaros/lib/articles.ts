import type { CSSProperties } from 'react';
import type { ArticleCategory, IkarosArticle } from '@/shared/types';

const FALLBACK_CATEGORY: ArticleCategory = {
  key: 'ostatni',
  label: 'Ostatní',
  // CSS var — categoryStyle ji předá do `--cat-current`; var() lze nestovat.
  color: 'var(--cat-ostatni)',
  order: 999,
};

const GLYPHS = ['✦', '❦', '❧', '☙'] as const;

/** Spec 3.2 — minimální čtenářská doba v minutách (200 slov/min). */
export function readingTime(html: string): number {
  const plain = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const words = plain.split(' ').filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

/** Deterministický glyph divider per article ID — variabilita bez chaosu. */
export function glyphFor(articleId: string): string {
  const code = articleId.charCodeAt(0) || 0;
  return GLYPHS[code % GLYPHS.length];
}

/** N° label — posledních 4 znaků ID, uppercase. */
export function articleNumber(articleId: string): string {
  return articleId.slice(-4).toUpperCase();
}

/** Inline style s `--cat-current` (předává barvu do CSS module). */
export function categoryStyle(
  category: ArticleCategory | undefined,
): CSSProperties {
  if (!category) return {};
  return { ['--cat-current' as never]: category.color };
}

/** Najde kategorii podle key; fallback `ostatni` nebo hardcoded fallback. */
export function categoryByKey(
  categories: ArticleCategory[],
  key: string,
): ArticleCategory {
  return (
    categories.find((c) => c.key === key) ??
    categories.find((c) => c.key === 'ostatni') ??
    FALLBACK_CATEGORY
  );
}

/** Relativní čas („před 30 min", „před 3 d", absolute pro starší). */
export function timeAgo(iso: string): string {
  const sec = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
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

/** Strip HTML pro plain text preview / search. */
export function stripHtml(html: string, maxLen?: number): string {
  const plain = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  return maxLen !== undefined ? plain.slice(0, maxLen) : plain;
}

/** Status label CZ. */
export function statusLabel(status: IkarosArticle['status']): string {
  return (
    {
      Draft: 'Koncept',
      Pending: 'Čeká na schválení',
      Published: 'Publikováno',
      Rejected: 'Zamítnuto',
    } as const
  )[status];
}

export type SortKey = 'new' | 'top' | 'most-rated';

export interface TOCEntry {
  id: string;
  text: string;
  level: 2 | 3;
}

/** 3.2e — extrahuje H2/H3 nadpisy z TipTap HTML pro AutoTOC. */
export function extractHeadings(html: string): TOCEntry[] {
  if (typeof window === 'undefined' || !html) return [];
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const elements = doc.querySelectorAll('h2, h3');
  return Array.from(elements).map((el, idx) => ({
    id: `heading-${idx}`,
    text: el.textContent ?? '',
    level: el.tagName === 'H2' ? 2 : 3,
  }));
}

/**
 * 3.2c — filter + sort article list pro Přehled tab. Published only,
 * client-side search (title + stripped content), multi-kategorie OR filter.
 */
export function filterArticles(
  articles: IkarosArticle[],
  query: string,
  catFilter: Set<string>,
  sort: SortKey,
): IkarosArticle[] {
  const q = query.trim().toLowerCase();
  const filtered = articles.filter((a) => {
    if (a.status !== 'Published') return false;
    if (catFilter.size > 0 && !catFilter.has(a.category)) return false;
    if (q) {
      const inTitle = a.title.toLowerCase().includes(q);
      const inContent = stripHtml(a.content).toLowerCase().includes(q);
      if (!inTitle && !inContent) return false;
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

/** Status CSS var (badge color). */
export function statusColor(status: IkarosArticle['status']): string {
  return (
    {
      Draft: 'var(--status-draft)',
      Pending: 'var(--status-pending)',
      Published: 'var(--status-published)',
      Rejected: 'var(--status-rejected)',
    } as const
  )[status];
}
