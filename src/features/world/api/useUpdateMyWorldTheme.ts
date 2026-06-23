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
  /** 5.9b — vlastní motiv (jen pro mě). `null` = zpět na motiv PJ. */
  themeId?: string | null;
  /** 5.9b — vlastní pozadí (jen pro mě). `null` = bez vlastního pozadí. */
  themeBackgroundUrl?: string | null;
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
