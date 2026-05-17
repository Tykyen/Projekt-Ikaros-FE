import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import type { WorldSettings } from '@/shared/types';

/**
 * 5.3 — nastavení světa (`GET /worlds/:worldId/settings`). Member-only.
 * FE čte `customGroups` + `groupColors` (tab Členové) a `akjTypes` (tab AKJ).
 */
export function useWorldSettings(worldId: string) {
  return useQuery({
    queryKey: ['worlds', worldId, 'settings'],
    queryFn: () =>
      api.get<WorldSettings | null>(`/worlds/${worldId}/settings`),
    enabled: !!worldId,
    staleTime: 60_000,
  });
}
