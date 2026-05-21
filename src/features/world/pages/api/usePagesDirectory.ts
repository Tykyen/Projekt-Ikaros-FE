import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { pagesQueryKey } from './usePage';
import type { PageDirectoryEntry } from './pages.types';

/**
 * 7.1 — Adresář všech stránek světa pro:
 *  • broken-link detekci v PageViewer (7.1d)
 *  • Cmd+K palette / fuzzy search (7.1j)
 *  • AKJ banner lookup meta stránky (7.1c)
 *
 * BE: `GET /worlds/:worldId/pages/directory` — vrací `{id, slug, title, type, order}[]`.
 * Endpoint je rychlý (jen project select, žádný `content`/`plainText`), takže
 * staleTime 5 min stačí. Refetch po vytvoření/smazání stránky řeší 7.2/7.4 invalidací.
 */
export function usePagesDirectory(worldId: string) {
  return useQuery({
    queryKey: pagesQueryKey.directory(worldId),
    queryFn: () =>
      api.get<PageDirectoryEntry[]>(`/worlds/${worldId}/pages/directory`),
    enabled: !!worldId,
    staleTime: 5 * 60_000,
    placeholderData: [],
  });
}
