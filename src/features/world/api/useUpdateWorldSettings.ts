import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import type { WorldSettings } from '@/shared/types';

/**
 * 5.3c — uložení nastavení světa (`PUT /worlds/:worldId/settings`).
 * BE guard: PJ+ (`canAdminWorld`). FE ho používá pro `groupColors`
 * (barvy skupin); AKJ úrovně mají vlastní hook `useUpdateAkjTypes`.
 */
export interface UpdateWorldSettingsInput {
  customGroups?: string[];
  groupColors?: Record<string, string>;
}

export function useUpdateWorldSettings(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateWorldSettingsInput) =>
      api.put<WorldSettings>(`/worlds/${worldId}/settings`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['worlds', worldId, 'settings'] });
    },
  });
}
