import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import {
  worldPageTemplatesQueryKey,
  type UpdateWorldPageTemplateInput,
  type WorldPageTemplate,
} from './worldPageTemplates.types';

/** 8.1b — `PATCH /worlds/:worldId/page-templates/:id`. Korektor+ guard. */
export function useUpdateWorldPageTemplate(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: UpdateWorldPageTemplateInput;
    }) =>
      api.patch<WorldPageTemplate>(
        `/worlds/${worldId}/page-templates/${id}`,
        input,
      ),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: worldPageTemplatesQueryKey.all(worldId),
      });
    },
  });
}
