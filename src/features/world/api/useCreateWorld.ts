import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import type { World } from '@/shared/types';

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
