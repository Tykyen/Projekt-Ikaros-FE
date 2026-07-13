/**
 * 21.5b — TanStack Query hooky pro komunitní katalog lektvarů
 * (list / detail / diskuse). Vzor: useKouzla (21.5c).
 */
import { useQuery } from '@tanstack/react-query';
import {
  listCommunityPotions,
  getCommunityPotion,
  listPotionComments,
} from '../api/lektvaryApi';
import type { PotionLibraryFilter } from '../types';

export const lektvaryKey = (filter: PotionLibraryFilter) =>
  [
    'komunitni-lektvary',
    filter.status ?? 'all',
    filter.systemId ?? 'all',
    filter.kind ?? 'all',
    filter.tag ?? 'all',
  ] as const;

/** Jedna knihovna (approved / draft) s filtry systém/druh/tag. */
export function useLektvary(filter: PotionLibraryFilter, enabled = true) {
  return useQuery({
    queryKey: lektvaryKey(filter),
    queryFn: () => listCommunityPotions(filter),
    enabled,
    staleTime: 30_000,
  });
}

export function useLektvar(id: string | null) {
  return useQuery({
    queryKey: ['komunitni-lektvar', id ?? 'none'],
    queryFn: () => getCommunityPotion(id!),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

/** Komentáře jedné úrovně (lektvar, nebo statblok daného systému). */
export function usePotionComments(
  potionId: string | null,
  targetType: 'potion' | 'statblock',
  systemId?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: [
      'lektvar-comments',
      potionId ?? 'none',
      targetType,
      systemId ?? 'none',
    ],
    queryFn: () => listPotionComments(potionId!, targetType, systemId),
    enabled: enabled && Boolean(potionId),
    staleTime: 15_000,
  });
}
