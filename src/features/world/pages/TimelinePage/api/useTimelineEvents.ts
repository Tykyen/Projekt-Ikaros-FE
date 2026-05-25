import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { api } from '@/shared/api/client';
import { accessTokenAtom } from '@/shared/store/authStore';
import type {
  CreateTimelineEventDto,
  TimelineEventResponse,
  TimelineEventsPage,
  TimelineFilters,
  UpdateTimelineEventDto,
} from './types';

const PAGE_LIMIT = 100;

export const timelineKeys = {
  all: (worldId: string) => ['timeline', worldId] as const,
  list: (worldId: string, filters: TimelineFilters) =>
    ['timeline', worldId, filters] as const,
  yearCounts: (worldId: string) =>
    ['timeline-year-counts', worldId] as const,
};

/**
 * 9.3 — infinite list timeline events. Cursor pagination, sort default `desc`.
 *
 * Filter změna invaliduje query přes queryKey (TanStack auto-refetch).
 */
export function useInfiniteTimelineEvents(
  worldId: string | undefined,
  filters: TimelineFilters,
) {
  const token = useAtomValue(accessTokenAtom);
  return useInfiniteQuery({
    queryKey: worldId
      ? timelineKeys.list(worldId, filters)
      : ['timeline', 'noop'],
    queryFn: ({ pageParam }) =>
      api.get<TimelineEventsPage>('/timeline', {
        worldId,
        limit: PAGE_LIMIT,
        sort: filters.sort ?? 'desc',
        ...(filters.fromYear !== undefined && { fromYear: filters.fromYear }),
        ...(filters.toYear !== undefined && { toYear: filters.toYear }),
        ...(filters.search && filters.search.length > 0 && {
          search: filters.search,
        }),
        ...(pageParam ? { cursor: pageParam } : {}),
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: !!token && !!worldId,
    staleTime: 30_000,
  });
}

function invalidateTimeline(qc: QueryClient, worldId: string) {
  void qc.invalidateQueries({ queryKey: timelineKeys.all(worldId) });
  void qc.invalidateQueries({ queryKey: timelineKeys.yearCounts(worldId) });
}

export function useCreateTimelineEvent(worldId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateTimelineEventDto) =>
      api.post<TimelineEventResponse>('/timeline', dto),
    onSuccess: () => {
      if (worldId) invalidateTimeline(qc, worldId);
    },
  });
}

export function useUpdateTimelineEvent(worldId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateTimelineEventDto }) =>
      api.put<TimelineEventResponse>(`/timeline/${id}`, dto),
    onSuccess: () => {
      if (worldId) invalidateTimeline(qc, worldId);
    },
  });
}

export function useDeleteTimelineEvent(worldId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/timeline/${id}`),
    onSuccess: () => {
      if (worldId) invalidateTimeline(qc, worldId);
    },
  });
}
