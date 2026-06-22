import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { adminKeys } from './adminKeys';
import type { AnalyticsSummary, AnalyticsDays } from './analytics.types';

/**
 * 15B.7 — agregovaná návštěvnost pro admin Přehled.
 * Snapshot (BE cache 5 min); `staleTime` 60 s, ať přepínání období nemlátí síť.
 */
export function useAnalyticsSummary(days: AnalyticsDays, enabled = true) {
  return useQuery({
    queryKey: [...adminKeys.analytics, days],
    queryFn: () =>
      api.get<AnalyticsSummary>('/analytics/summary', { days }),
    enabled,
    staleTime: 60_000,
  });
}
