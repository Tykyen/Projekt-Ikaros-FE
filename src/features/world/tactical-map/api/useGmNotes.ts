/**
 * 10.2j — PJ poznámkový blok na svět (world-level, per-PJ). Otevírá se z mapy
 * tlačítkem pod počasím. Hráč používá místo toho `useCharacterNotes` své
 * postavy (jiný endpoint) — viz `MapNotebookButton`.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';

export interface WorldGmNotes {
  id: string;
  worldId: string;
  userId: string;
  content: string;
  updatedAt?: string;
}

const gmNotesKey = (worldId: string) =>
  ['world', worldId, 'gm-notes'] as const;

export function useGmNotes(worldId: string, enabled: boolean) {
  return useQuery({
    queryKey: gmNotesKey(worldId),
    queryFn: () => api.get<WorldGmNotes>(`/worlds/${worldId}/gm-notes`),
    enabled: !!worldId && enabled,
    staleTime: 30_000,
  });
}

export function useUpdateGmNotes(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) =>
      api.patch<WorldGmNotes>(`/worlds/${worldId}/gm-notes`, { content }),
    onSuccess: (notes) => qc.setQueryData(gmNotesKey(worldId), notes),
  });
}
