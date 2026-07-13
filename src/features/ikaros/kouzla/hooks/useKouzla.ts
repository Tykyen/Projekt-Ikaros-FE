/**
 * 21.5c — TanStack Query hooky pro komunitní katalog kouzel
 * (list / detail / diskuse). Vzor: useKomunitniBestiar.
 */
import { useQuery } from '@tanstack/react-query';
import {
  listCommunitySpells,
  getCommunitySpell,
  listSpellComments,
} from '../api/kouzlaApi';
import type { SpellLibraryFilter } from '../types';

export const kouzlaKey = (filter: SpellLibraryFilter) =>
  [
    'komunitni-kouzla',
    filter.status ?? 'all',
    filter.systemId ?? 'all',
    filter.tag ?? 'all',
  ] as const;

/** Jedna knihovna (approved / draft) s filtry systém/tag. */
export function useKouzla(filter: SpellLibraryFilter, enabled = true) {
  return useQuery({
    queryKey: kouzlaKey(filter),
    queryFn: () => listCommunitySpells(filter),
    enabled,
    staleTime: 30_000,
  });
}

export function useKouzlo(id: string | null) {
  return useQuery({
    queryKey: ['komunitni-kouzlo', id ?? 'none'],
    queryFn: () => getCommunitySpell(id!),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

/** Komentáře jedné úrovně (kouzlo, nebo statblok daného systému). */
export function useSpellComments(
  spellId: string | null,
  targetType: 'spell' | 'statblock',
  systemId?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: [
      'kouzlo-comments',
      spellId ?? 'none',
      targetType,
      systemId ?? 'none',
    ],
    queryFn: () => listSpellComments(spellId!, targetType, systemId),
    enabled: enabled && Boolean(spellId),
    staleTime: 15_000,
  });
}
