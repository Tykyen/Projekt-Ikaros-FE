import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import type { WorldMapFolder } from '../types';

/** 13.4b — strom složek atlasu (BE filtruje leak-safe dle viditelnosti). */
export function useWorldMapFolders(worldId: string) {
  return useQuery({
    queryKey: ['world-map-folders', worldId],
    queryFn: () =>
      api.get<WorldMapFolder[]>('/world-maps/folders', { worldId }),
    enabled: !!worldId,
    staleTime: 60_000,
  });
}
