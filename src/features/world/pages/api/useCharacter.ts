import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { charactersQueryKey, type Character } from './characters.types';

/**
 * 8.1 — Detail postavy. BE: `GET /worlds/:worldId/characters/:slug`.
 * Vrací view s kontrolou přístupu — `privateBio`/`privateInfoBlocks`
 * přijdou prázdné, pokud uživatel není PJ ani vlastník.
 */
export function useCharacter(worldId: string, slug: string) {
  return useQuery({
    queryKey: charactersQueryKey.detail(worldId, slug),
    queryFn: () =>
      api.get<Character>(`/worlds/${worldId}/characters/${slug}`),
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
