import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import type { Page } from './pages.types';

/**
 * 7.1 — Plný obsah wiki stránky. BE: `GET /worlds/:worldId/pages/:slug`.
 * Vrací 403 pokud user nesplňuje `accessRequirements` (PageViewerPage to
 * mapuje na AccessDenied screen), 404 pokud stránka neexistuje.
 */
export function usePage(worldId: string, slug: string) {
  return useQuery({
    queryKey: ['pages', worldId, 'detail', slug],
    queryFn: () => api.get<Page>(`/worlds/${worldId}/pages/${slug}`),
    enabled: !!worldId && !!slug,
    staleTime: 30_000,
    retry: (failureCount, error) => {
      const status = (error as { response?: { status?: number } })?.response
        ?.status;
      if (status === 403 || status === 404) return false;
      return failureCount < 2;
    },
  });
}

export const pagesQueryKey = {
  detail: (worldId: string, slug: string) =>
    ['pages', worldId, 'detail', slug] as const,
  directory: (worldId: string) => ['pages', worldId, 'directory'] as const,
  meta: (worldId: string, slug: string) =>
    ['pages', worldId, 'meta', slug] as const,
  backlinks: (worldId: string, slug: string) =>
    ['pages', worldId, 'backlinks', slug] as const,
};
