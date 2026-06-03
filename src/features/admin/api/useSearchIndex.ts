import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';

/** 13.1c — zrcadlí BE `SearchIndexStats` (search-index-stats schema). */
export interface SearchIndexStats {
  provider: string;
  status: string;
  processedPages: number;
  totalPages: number;
  indexedCount: number;
  vectorCount: number;
  pendingPages: number;
  lastEmbeddedPageSlug?: string;
  lastEmbeddedAtUtc?: string;
}

const STATS_KEY = ['admin', 'search-index-stats'] as const;

/**
 * 13.1c — stav indexace search indexu (Admin+). Během rebuildu se průběžně
 * obnovuje (`refetchInterval`), aby šel sledovat progress.
 */
export function useSearchIndexStats() {
  return useQuery({
    queryKey: STATS_KEY,
    queryFn: () => api.get<SearchIndexStats>('/stats/search'),
    refetchInterval: 5000,
  });
}

/** 13.1c — spustí úplný rebuild indexu (Admin+). */
export function useRebuildSearchIndex() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<{ message: string }>('/stats/search/rebuild'),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: STATS_KEY });
    },
  });
}
