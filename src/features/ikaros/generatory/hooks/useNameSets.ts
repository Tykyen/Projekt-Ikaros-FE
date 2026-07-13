/**
 * 21.2a — TanStack Query hooky jmenných sad (list souhrnů / detail s poli).
 */
import { useQuery } from '@tanstack/react-query';
import { listNameSets, getNameSet } from '../api/nameSetsApi';
import type { NameSetsFilter } from '../types';

export const nameSetsKey = (filter: NameSetsFilter) =>
  [
    'name-sets',
    filter.status ?? 'all',
    filter.category ?? 'all',
    filter.tag ?? 'all',
  ] as const;

export function useNameSetsList(filter: NameSetsFilter, enabled = true) {
  return useQuery({
    queryKey: nameSetsKey(filter),
    queryFn: () => listNameSets(filter),
    enabled,
    staleTime: 60_000,
  });
}

/** Detail s plnými seznamy jmen — drž dlouhý staleTime (sady se mění zřídka). */
export function useNameSet(id: string | null) {
  return useQuery({
    queryKey: ['name-set', id ?? 'none'],
    queryFn: () => getNameSet(id!),
    enabled: Boolean(id),
    staleTime: 5 * 60_000,
  });
}
