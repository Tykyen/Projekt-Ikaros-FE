import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import type { WorldMapEntry } from '../types';

/** 13.4 — atlas map světa. `GET /world-maps?worldId=` (BE visibility filtr). */
export function useWorldMaps(worldId: string) {
  return useQuery({
    queryKey: ['world-maps', worldId],
    queryFn: () =>
      api.get<WorldMapEntry[]>('/world-maps', { worldId }),
    enabled: !!worldId,
    staleTime: 60_000,
  });
}
