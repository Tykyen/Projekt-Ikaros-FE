import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import {
  worldPageTemplatesQueryKey,
  type CreateWorldPageTemplateInput,
  type WorldPageTemplate,
} from './worldPageTemplates.types';

/**
 * 8.1b — `POST /worlds/:worldId/page-templates`. Korektor+ guard na BE.
 * Po úspěchu invaliduje seznam (refetch v editoru i settings).
 */
export function useCreateWorldPageTemplate(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateWorldPageTemplateInput) =>
      api.post<WorldPageTemplate>(
        `/worlds/${worldId}/page-templates`,
        input,
      ),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: worldPageTemplatesQueryKey.all(worldId),
      });
    },
  });
}
