import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { adminKeys } from './adminKeys';
import type { GrowthStats, GrowthDays } from './growth.types';

/**
 * 19.1 — onboarding funnel + retence pro admin Přehled.
 * Snapshot (ne realtime); BE cachuje 15 min, FE `staleTime` 60 s.
 */
export function useGrowthStats(days: GrowthDays = 30, enabled = true) {
  return useQuery({
    queryKey: [...adminKeys.growth, days],
    queryFn: () => api.get<GrowthStats>('/admin/stats/growth', { days }),
    enabled,
    staleTime: 60_000,
  });
}
