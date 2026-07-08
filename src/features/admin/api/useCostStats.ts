import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { adminKeys } from './adminKeys';
import type { CostStats } from './costs.types';

/**
 * 19.2 — počítadla nákladů pro admin Přehled.
 * Snapshot bez období (aktuální stav); BE cachuje 1 h, FE `staleTime` 5 min.
 */
export function useCostStats(enabled = true) {
  return useQuery({
    queryKey: adminKeys.costs,
    queryFn: () => api.get<CostStats>('/admin/stats/costs'),
    enabled,
    staleTime: 5 * 60_000,
  });
}
