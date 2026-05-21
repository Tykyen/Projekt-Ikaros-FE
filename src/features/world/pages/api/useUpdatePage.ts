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
    mutationFn: ({ id, input }: { id: string; input: UpdatePageInput }) =>
      api.patch<Page>(`/worlds/${worldId}/pages/${id}`, input),
    onSuccess: (page, vars) => {
      void qc.invalidateQueries({
        queryKey: pagesQueryKey.directory(worldId),
      });
      // Refresh detail s novými daty (slug mohl se změnit)
      qc.setQueryData(pagesQueryKey.detail(worldId, page.slug), page);
      // Pokud slug se změnil, smaž starou detail cache
      const previousSlug = vars.input.slug;
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
