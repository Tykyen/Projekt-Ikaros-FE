import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import {
  worldPageTemplatesQueryKey,
  type WorldPageTemplate,
} from './worldPageTemplates.types';

/**
 * 8.1b — GET seznam šablon světa. Endpoint je dostupný všem členům světa
 * (čtení), mutace mají Korektor+ guard.
 */
export function useWorldPageTemplates(worldId: string | undefined) {
  return useQuery({
    queryKey: worldPageTemplatesQueryKey.all(worldId ?? ''),
    queryFn: () =>
      api.get<WorldPageTemplate[]>(`/worlds/${worldId}/page-templates`),
    enabled: !!worldId,
    staleTime: 60_000,
  });
}
