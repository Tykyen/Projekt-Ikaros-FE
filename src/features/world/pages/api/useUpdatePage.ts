import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { pagesQueryKey } from './usePage';
import type { CreatePageInput } from './useCreatePage';
import type { Page } from './pages.types';

/**
 * 7.2 — Update page DTO = Partial<CreatePageInput> (BE: `UpdatePageDto extends PartialType(CreatePageDto)`).
 * `expectedUpdatedAt` posílá optimistic concurrency token — server vrátí 409 PAGE_CONFLICT
 * pokud se stránka mezitím změnila (krok 7.2k).
 */
export type UpdatePageInput = Partial<CreatePageInput> & {
  /** ISO timestamp z `page.updatedAt` při hydraci form state — pro 7.2k concurrency check. */
  expectedUpdatedAt?: string;
};

/**
 * 7.2 — `PATCH /worlds/:worldId/pages/:id`. PomocnyPJ+ guard. Invaliduje
 * detail + directory + (pokud slug se změnil) starý slug cache.
 *
 * Pozor: BE PATCH bere `id`, ne `slug`.
 */
export function useUpdatePage(worldId: string, worldSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: UpdatePageInput;
      /** N-38 — původní slug stránky (před případným rename). */
      previousSlug?: string;
    }) => api.patch<Page>(`/worlds/${worldId}/pages/${id}`, input),
    onSuccess: (page, vars) => {
      void qc.invalidateQueries({
        queryKey: pagesQueryKey.directory(worldId),
      });
      // C-15 — postava/NPC editovaná přes Page → obnov i character directory.
      void qc.invalidateQueries({
        queryKey: ['characters', worldId, 'directory'],
      });
      // C-16 — backlinks cílových stránek (FE nezná cíle wikilinků) → broad.
      void qc.invalidateQueries({ queryKey: ['pages', worldId, 'backlinks'] });
      // C-17 — meta této stránky (AKJ shield na AccessDenied) po změně accessRequirements.
      void qc.invalidateQueries({
        queryKey: pagesQueryKey.meta(worldId, page.slug),
      });
      // Refresh detail s novými daty (slug mohl se změnit)
      qc.setQueryData(pagesQueryKey.detail(worldId, page.slug), page);
      // N-38 — původní slug bereme z callera (`vars.previousSlug`); dřív se
      // bral `vars.input.slug`, což je NOVÝ slug → po rename se podmínka nikdy
      // nesplnila a stará detail cache zůstala stale.
      const previousSlug = vars.previousSlug;
      if (previousSlug && previousSlug !== page.slug) {
        qc.removeQueries({
          queryKey: pagesQueryKey.detail(worldId, previousSlug),
        });
      }
      void qc.invalidateQueries({
        queryKey: ['worlds', 'slug', worldSlug],
      });
    },
  });
}
