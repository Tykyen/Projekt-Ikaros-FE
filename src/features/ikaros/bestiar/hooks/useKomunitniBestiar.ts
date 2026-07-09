/**
 * 16.2b-2 — TanStack Query hooky pro komunitní bestiář (list / detail / diskuse).
 */
import { useQuery } from '@tanstack/react-query';
import {
  listCommunityBestie,
  getCommunityBestie,
  listBestieComments,
} from '../api/komunitniBestiarApi';
import type { CommunityLibraryFilter } from '../types';

export const komunitniBestiarKey = (filter: CommunityLibraryFilter) =>
  [
    'komunitni-bestiar',
    filter.status ?? 'all',
    filter.kind ?? 'all',
    filter.systemId ?? 'all',
  ] as const;

/** Jedna knihovna (approved / draft) s filtry typ/systém. */
export function useKomunitniBestiar(
  filter: CommunityLibraryFilter,
  enabled = true,
) {
  return useQuery({
    queryKey: komunitniBestiarKey(filter),
    queryFn: () => listCommunityBestie(filter),
    enabled,
    staleTime: 30_000,
  });
}

export function useKomunitniBestie(id: string | null) {
  return useQuery({
    queryKey: ['komunitni-bestie', id ?? 'none'],
    queryFn: () => getCommunityBestie(id!),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

/** Komentáře jedné úrovně (bytost, nebo statblok daného systému). */
export function useBestieComments(
  bestieId: string | null,
  targetType: 'beast' | 'statblock',
  systemId?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: [
      'bestie-comments',
      bestieId ?? 'none',
      targetType,
      systemId ?? 'none',
    ],
    queryFn: () => listBestieComments(bestieId!, targetType, systemId),
    enabled: enabled && Boolean(bestieId),
    staleTime: 15_000,
  });
}
