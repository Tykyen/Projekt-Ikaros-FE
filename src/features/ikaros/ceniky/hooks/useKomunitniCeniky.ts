/**
 * 21.5f — TanStack Query hooky pro komunitní ceníky (list / detail / komentáře).
 */
import { useQuery } from '@tanstack/react-query';
import {
  listCommunityPriceLists,
  getCommunityPriceList,
  listPriceListComments,
} from '../api/cenikyApi';
import type { CenikyLibraryFilter } from '../types';

export const komunitniCenikyKey = (filter: CenikyLibraryFilter) =>
  ['komunitni-ceniky', filter.status ?? 'all', filter.tag ?? 'all'] as const;

/** Jedna knihovna (approved / draft) — filtry se přidávají do query. */
export function useKomunitniCenikyList(
  filter: CenikyLibraryFilter,
  enabled = true,
) {
  return useQuery({
    queryKey: komunitniCenikyKey(filter),
    queryFn: () => listCommunityPriceLists(filter),
    enabled,
    staleTime: 30_000,
  });
}

export function useKomunitniCenik(id: string | null) {
  return useQuery({
    queryKey: ['komunitni-cenik', id ?? 'none'],
    queryFn: () => getCommunityPriceList(id!),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

export function useCenikComments(id: string | null) {
  return useQuery({
    queryKey: ['komunitni-cenik-comments', id ?? 'none'],
    queryFn: () => listPriceListComments(id!),
    enabled: Boolean(id),
    staleTime: 15_000,
  });
}
