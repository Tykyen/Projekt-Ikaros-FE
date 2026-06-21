import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import type {
  CharacterTabVisibility,
  HeadlineNode,
  MapDefaults,
  MenuTemplate,
  PjChatPersona,
  WorldSettings,
} from '@/shared/types';

/**
 * 5.3c — uložení nastavení světa (`PUT /worlds/:worldId/settings`).
 * BE guard: PJ+ (`canAdminWorld`). FE ho používá pro `groupColors`
 * (barvy skupin); AKJ úrovně mají vlastní hook `useUpdateAkjTypes`.
 */
export interface UpdateWorldSettingsInput {
  customGroups?: string[];
  groupColors?: Record<string, string>;
  /** Znak skupiny (emblém): název skupiny → url. Ikona linkovaného chat kanálu. */
  groupImages?: Record<string, string>;
  /** Side-task character-tab-visibility — per-typ whitelist viditelných tabů. */
  characterTabVisibility?: CharacterTabVisibility;
  /** 9.3 — slug CalendarConfig pro timeline (null = fallback první). */
  timelineCalendarSlug?: string | null;
  /** 9.3-followup — PJ skryje volitelné top-nav položky (whitelist `HIDEABLE_NAV_IDS`). */
  hiddenNavItems?: string[];
  /** 12.2 — vlastní navigace světa (strom skupin + odkazů). */
  customHeadline?: HeadlineNode[];
  /** 12.2 — šablony menu. */
  menuTemplates?: MenuTemplate[];
  /** 12.2 — „Last info" box. `null` = smazat; `updatedAt` plní server. */
  lastInfo?: { text: string; visible: boolean } | null;
  /** 6.8 — PJ persona v chatu. `null` = reset na výchozí. */
  pjChatPersona?: PjChatPersona | null;
  /** 15.4 (E) — výchozí nastavení map světa. `null` = reset. */
  mapDefaults?: MapDefaults | null;
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
