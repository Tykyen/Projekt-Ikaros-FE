import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import type { WorldMembership, WorldThemeAdjust } from '@/shared/types';

/**
 * Krok 5.9 — uložení vlastního doladění vzhledu světa (přístupnost).
 * `PUT /worlds/:worldId/members/me/theme` — člen edituje jen své membership.
 */
export interface UpdateMyThemeInput {
  themeAdjust?: WorldThemeAdjust;
  themeUserOverrides?: Record<string, string>;
}

export function useUpdateMyWorldTheme(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateMyThemeInput) =>
      api.put<WorldMembership>(
        `/worlds/${worldId}/members/me/theme`,
        input,
      ),
    onSuccess: () => {
      // Obnoví `my` (membership uživatele) → projeví se ve WorldLayout.
      qc.invalidateQueries({ queryKey: ['worlds'] });
    },
  });
}
