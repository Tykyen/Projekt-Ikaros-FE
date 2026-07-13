/**
 * 21.5d — TanStack Query hooky pro komunitní katalog hádanek
 * (list / detail / diskuse).
 */
import { useQuery } from '@tanstack/react-query';
import {
  listCommunityRiddles,
  getCommunityRiddle,
  listRiddleComments,
} from '../api/hadankyApi';
import type { RiddleLibraryFilter } from '../types';

export const hadankyKey = (filter: RiddleLibraryFilter) =>
  [
    'komunitni-hadanky',
    filter.status ?? 'all',
    filter.difficulty ?? 'all',
    filter.tag ?? 'all',
  ] as const;

/** Jedna knihovna (approved / draft) s filtry úroveň/tag. */
export function useHadanky(filter: RiddleLibraryFilter, enabled = true) {
  return useQuery({
    queryKey: hadankyKey(filter),
    queryFn: () => listCommunityRiddles(filter),
    enabled,
    staleTime: 30_000,
  });
}

export function useHadanka(id: string | null) {
  return useQuery({
    queryKey: ['komunitni-hadanka', id ?? 'none'],
    queryFn: () => getCommunityRiddle(id!),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

/** Komentáře hádanky (jedna úroveň). */
export function useRiddleComments(riddleId: string | null, enabled = true) {
  return useQuery({
    queryKey: ['hadanka-comments', riddleId ?? 'none'],
    queryFn: () => listRiddleComments(riddleId!),
    enabled: enabled && Boolean(riddleId),
    staleTime: 15_000,
  });
}
