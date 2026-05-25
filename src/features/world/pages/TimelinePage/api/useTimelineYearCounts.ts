import { useQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { api } from '@/shared/api/client';
import { accessTokenAtom } from '@/shared/store/authStore';
import { timelineKeys } from './useTimelineEvents';
import type { TimelineYearCount } from './types';

/**
 * 9.3 — list `{year, count}` DESC pro YearScrubber.
 * Cache 5 min — counts se mění jen na mutation timeline events
 * (invalidace v useCreate/Update/DeleteTimelineEvent).
 */
export function useTimelineYearCounts(worldId: string | undefined) {
  const token = useAtomValue(accessTokenAtom);
  return useQuery({
    queryKey: worldId
      ? timelineKeys.yearCounts(worldId)
      : ['timeline-year-counts', 'noop'],
    queryFn: () =>
      api.get<TimelineYearCount[]>('/timeline/year-counts', { worldId }),
    enabled: !!token && !!worldId,
    staleTime: 5 * 60_000,
  });
}
