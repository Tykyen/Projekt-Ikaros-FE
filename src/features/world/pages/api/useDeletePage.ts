import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { pagesQueryKey } from './usePage';

/**
 * 7.2 — `DELETE /worlds/:worldId/pages/:id`. PomocnyPJ+ guard.
 * Invaliduje directory + smaže detail/backlinks cache pro daný slug.
 */
export function useDeletePage(worldId: string, worldSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; slug: string }) =>
      api.delete<void>(`/worlds/${worldId}/pages/${id}`),
    onSuccess: (_void, vars) => {
      void qc.invalidateQueries({
        queryKey: pagesQueryKey.directory(worldId),
      });
      qc.removeQueries({
        queryKey: pagesQueryKey.detail(worldId, vars.slug),
      });
      qc.removeQueries({
        queryKey: pagesQueryKey.backlinks(worldId, vars.slug),
      });
      // C-17 — meta cache smazané stránky (parita s backlinks remove).
      qc.removeQueries({
        queryKey: pagesQueryKey.meta(worldId, vars.slug),
      });
      // C-16 — backlinks cílů, na které mazaná odkazovala (FE je nezná) → broad.
      void qc.invalidateQueries({ queryKey: ['pages', worldId, 'backlinks'] });
      // C-15 — postava mohla být smazána přes Page → obnov character directory.
      void qc.invalidateQueries({
        queryKey: ['characters', worldId, 'directory'],
      });
      // Favorite slug může obsahovat smazanou stránku — invalidovat world cache
      void qc.invalidateQueries({
        queryKey: ['worlds', 'slug', worldSlug],
      });
    },
  });
}
