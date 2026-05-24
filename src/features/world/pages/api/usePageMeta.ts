import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { pagesQueryKey } from './usePage';

/**
 * D-062a — popis konkrétní AKJ překážky, kterou user nesplnil.
 * BE vrací jen nesplněné requirements; UserId requirement se záměrně skrývá
 * (privacy — kdo má přístup je tajné).
 */
export interface ShieldedRequirement {
  type: 'AKJ' | 'AKJType' | 'Role';
  /** AKJ úroveň / Role enum / AKJType resolved level. */
  level?: number;
  /** Pouze pro AKJType — surový key (debug/fallback). */
  akjKey?: string;
  /** Pouze pro AKJType — lidský název z WorldSettings; fallback = key. */
  akjLabel?: string;
  /** Pouze pro Role — český label. */
  roleLabel?: string;
}

export interface PageMeta {
  isWoodWide: boolean;
  /** D-062a — undefined pokud user má přístup nebo stránka nemá restrikce. */
  shieldedBy?: ShieldedRequirement[];
}

/**
 * 7.1 + D-062a — Lehká meta-info stránky. BE: `GET /worlds/:worldId/pages/meta/:slug`
 * vrací `{ isWoodWide, shieldedBy? }`. Není auth-guarded jako `findBySlug` —
 * vrací 404 jen pokud stránka opravdu neexistuje, **i když user nemá přístup**.
 *
 * Použití:
 * - AccessDenied (D-062a) — `shieldedBy` říká konkrétní AKJ úroveň / Role
 * - AccessDenied (7.1) — `isWoodWide` říká „existuje, ale je utajna v lore"
 */
export function usePageMeta(worldId: string, slug: string, enabled = true) {
  return useQuery({
    queryKey: pagesQueryKey.meta(worldId, slug),
    queryFn: () =>
      api.get<PageMeta>(`/worlds/${worldId}/pages/meta/${slug}`),
    enabled: enabled && !!worldId && !!slug,
    staleTime: 60_000,
    retry: false,
  });
}
