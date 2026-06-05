import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { adminKeys } from './adminKeys';
import type { AdminStatsOverview } from './adminStats.types';

/**
 * 12.1 — platformové statistiky pro admin dashboard.
 * Snapshot (ne realtime); `staleTime` 60 s, ať dashboard nehází zbytečné refetche.
 */
export function useAdminStats(enabled = true) {
  return useQuery({
    queryKey: [...adminKeys.stats, 'overview'],
    queryFn: () => api.get<AdminStatsOverview>('/admin/stats/overview'),
    enabled,
    staleTime: 60_000,
  });
}
