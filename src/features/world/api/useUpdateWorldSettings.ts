import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import type { CharacterTabVisibility, WorldSettings } from '@/shared/types';

/**
 * 5.3c — uložení nastavení světa (`PUT /worlds/:worldId/settings`).
 * BE guard: PJ+ (`canAdminWorld`). FE ho používá pro `groupColors`
 * (barvy skupin); AKJ úrovně mají vlastní hook `useUpdateAkjTypes`.
 */
export interface UpdateWorldSettingsInput {
  customGroups?: string[];
  groupColors?: Record<string, string>;
  /** Side-task character-tab-visibility — per-typ whitelist viditelných tabů. */
  characterTabVisibility?: CharacterTabVisibility;
  /** 9.3 — slug CalendarConfig pro timeline (null = fallback první). */
  timelineCalendarSlug?: string | null;
  /** 9.3-followup — PJ skryje volitelné top-nav položky (whitelist `HIDEABLE_NAV_IDS`). */
  hiddenNavItems?: string[];
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
