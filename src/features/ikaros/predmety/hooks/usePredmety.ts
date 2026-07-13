/**
 * 21.5e — TanStack Query hooky pro komunitní katalog předmětů
 * (list / detail / diskuse). Vzor: useLektvary (21.5b).
 */
import { useQuery } from '@tanstack/react-query';
import {
  listCommunityItems,
  getCommunityItem,
  listItemComments,
} from '../api/predmetyApi';
import type { ItemLibraryFilter } from '../types';

export const predmetyKey = (filter: ItemLibraryFilter) =>
  [
    'komunitni-predmety',
    filter.status ?? 'all',
    filter.systemId ?? 'all',
    filter.kind ?? 'all',
    filter.tag ?? 'all',
  ] as const;

/** Jedna knihovna (approved / draft) s filtry systém/druh/tag. */
export function usePredmety(filter: ItemLibraryFilter, enabled = true) {
  return useQuery({
    queryKey: predmetyKey(filter),
    queryFn: () => listCommunityItems(filter),
    enabled,
    staleTime: 30_000,
  });
}

export function usePredmet(id: string | null) {
  return useQuery({
    queryKey: ['komunitni-predmet', id ?? 'none'],
    queryFn: () => getCommunityItem(id!),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

/** Komentáře jedné úrovně (předmět, nebo statblok daného systému). */
export function useItemComments(
  itemId: string | null,
  targetType: 'item' | 'statblock',
  systemId?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: [
      'predmet-comments',
      itemId ?? 'none',
      targetType,
      systemId ?? 'none',
    ],
    queryFn: () => listItemComments(itemId!, targetType, systemId),
    enabled: enabled && Boolean(itemId),
    staleTime: 15_000,
  });
}
