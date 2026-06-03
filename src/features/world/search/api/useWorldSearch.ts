import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { DEFAULT_PROVIDER_KEY, type SearchResult } from '../types';

interface UseWorldSearchParams {
  /** Reálné ObjectId světa — BE filtruje výsledky jen na stránky tohoto světa. */
  worldId: string;
  /** Hledaný text (už debounced volajícím). */
  query: string;
  provider?: string | null;
  count?: number;
}

/**
 * 13.1 — vyhledávání stránek v rámci JEDNOHO světa. `worldId` je povinný →
 * BE zaručí izolaci (žádný leak mezi světy). Dotaz se neposílá prázdný.
 */
export function useWorldSearch({
  worldId,
  query,
  provider,
  count = 10,
}: UseWorldSearchParams) {
  const q = query.trim();
  const providerKey = provider ?? DEFAULT_PROVIDER_KEY;

  return useQuery({
    queryKey: ['world-search', worldId, providerKey, q],
    queryFn: () =>
      api.get<SearchResult[]>('/search', {
        q,
        worldId,
        count,
        provider: providerKey,
      }),
    enabled: !!worldId && q.length > 0,
    staleTime: 30_000,
  });
}
