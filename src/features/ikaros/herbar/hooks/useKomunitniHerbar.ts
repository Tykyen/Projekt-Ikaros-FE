/**
 * 21.5a — TanStack Query hooky pro komunitní herbář (list / detail).
 */
import { useQuery } from '@tanstack/react-query';
import { listCommunityPlants, getCommunityPlant } from '../api/herbarApi';
import type { HerbarLibraryFilter } from '../types';

export const komunitniHerbarKey = (filter: HerbarLibraryFilter) =>
  [
    'komunitni-herbar',
    filter.status ?? 'all',
    filter.rarity ?? 'all',
    filter.tag ?? 'all',
  ] as const;

/** Jedna knihovna (approved / draft) — filtry se přidávají do query. */
export function useKomunitniHerbarList(
  filter: HerbarLibraryFilter,
  enabled = true,
) {
  return useQuery({
    queryKey: komunitniHerbarKey(filter),
    queryFn: () => listCommunityPlants(filter),
    enabled,
    staleTime: 30_000,
  });
}

export function useKomunitniPlant(id: string | null) {
  return useQuery({
    queryKey: ['komunitni-plant', id ?? 'none'],
    queryFn: () => getCommunityPlant(id!),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}
