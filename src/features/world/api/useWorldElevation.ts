import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';

/**
 * Elevation („nahození práv") — platform admin si zapne/vypne admin pravomoci
 * v daném světě. Stav `elevated` nese world detail (`useWorld`) + `/worlds/my`.
 *
 * Po přepnutí se invaliduje CELÁ query cache: elevace mění práva napříč moduly
 * (pages/chat/mapy/...), takže se musí přenačíst vše s novým rozsahem. Toggle je
 * vzácná akce, plný refetch je přijatelný a spolehlivý.
 * Spec: docs/arch/phase-1/_side-tasks/spec-world-admin-elevation.md.
 */
export function useElevateWorld() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (worldId: string) =>
      api.post<{ elevated: boolean }>(`/worlds/${worldId}/elevation`),
    onSuccess: () => void qc.invalidateQueries(),
  });
}

export function useDeElevateWorld() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (worldId: string) =>
      api.delete<{ elevated: boolean }>(`/worlds/${worldId}/elevation`),
    onSuccess: () => void qc.invalidateQueries(),
  });
}
