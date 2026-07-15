import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { adminKeys } from './adminKeys';
import type { ThemeUsageStats } from './themeUsage.types';

/**
 * 20.6 — využití motivů a skinů pro admin Přehled.
 * Snapshot (ne realtime); BE cachuje 15 min, FE `staleTime` 60 s.
 */
export function useThemeUsageStats(enabled = true) {
  return useQuery({
    queryKey: adminKeys.themeUsage,
    queryFn: () => api.get<ThemeUsageStats>('/admin/stats/theme-usage'),
    enabled,
    staleTime: 60_000,
  });
}
