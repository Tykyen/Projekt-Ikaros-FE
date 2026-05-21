import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { worldPageTemplatesQueryKey } from './worldPageTemplates.types';

/** 8.1b — `DELETE /worlds/:worldId/page-templates/:id`. Korektor+ guard. */
export function useDeleteWorldPageTemplate(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<void>(`/worlds/${worldId}/page-templates/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: worldPageTemplatesQueryKey.all(worldId),
      });
    },
  });
}
