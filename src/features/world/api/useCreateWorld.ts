import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import type { World } from '@/shared/types';
import type { CreateCalendarConfigDto } from '@/features/world/api/useCalendarConfigs';

export type WorldAccessMode = 'public' | 'open' | 'private';

export interface CreateWorldInput {
  name: string;
  slug: string;
  description?: string;
  genre?: string;
  tones?: string[];
  playersWanted?: string;
  maxPlayers?: number | null;
  accessMode: WorldAccessMode;
  system: string;
  dice?: string[];
  /** 5.0 — motiv světa zvolený ve wizardu. */
  themeId?: string;
  /**
   * 9.3-F-I-Q1 — explicit seznam kalendářů k seednutí.
   * - `undefined` → BC: BE auto-seedne Gregorian
   * - `[]` → svět vznikne bez kalendáře (PJ řekl „neplatí")
   * - `[c1, c2]` → seedne každý preset
   */
  calendars?: CreateCalendarConfigDto[];
  /** Který z `calendars` je ⭐ default svět (defaultCalendarConfigSlug). */
  defaultCalendarSlug?: string;
}

/**
 * 2.3 — Mutation pro vytvoření nového světa.
 * Po success invaliduje veřejný i osobní seznam světů (sidebar + dashboard
 * + WorldsPage se okamžitě obnoví).
 */
export function useCreateWorld() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateWorldInput) => api.post<World>('/worlds', input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['worlds', 'public'] });
      qc.invalidateQueries({ queryKey: ['worlds', 'my'] });
    },
  });
}
