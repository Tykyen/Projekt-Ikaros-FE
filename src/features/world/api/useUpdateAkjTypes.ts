import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import type { AkjType, WorldSettings } from '@/shared/types';

/**
 * 5.3d — uložení AKJ úrovní (`PUT /worlds/:worldId/settings/akj-types`).
 * Dedikovaný endpoint s guardem PomocnyPJ+ (na rozdíl od plného
 * `PUT .../settings`, které je PJ-only).
 */
export function useUpdateAkjTypes(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (akjTypes: AkjType[]) =>
      api.put<WorldSettings>(`/worlds/${worldId}/settings/akj-types`, {
        akjTypes,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['worlds', worldId, 'settings'] });
    },
  });
}
