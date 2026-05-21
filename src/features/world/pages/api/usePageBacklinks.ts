import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { pagesQueryKey } from './usePage';
import type { PageBacklink } from './pages.types';

/**
 * 7.1l — Backlinks „Odkazuje sem". BE: `GET /worlds/:worldId/pages/:slug/backlinks`
 * vrací stránky odkazující na aktuální stránku, filtrované per-user access.
 *
 * Lehký endpoint (jen `{slug, title, type}`), cache 1 min. Vrací 404 pokud
 * cílová stránka neexistuje nebo k ní user nemá přístup (BE assertAccess).
 */
export function usePageBacklinks(worldId: string, slug: string) {
  return useQuery({
    queryKey: pagesQueryKey.backlinks(worldId, slug),
    queryFn: () =>
      api.get<PageBacklink[]>(`/worlds/${worldId}/pages/${slug}/backlinks`),
    enabled: !!worldId && !!slug,
    staleTime: 60_000,
    retry: false,
  });
}
