import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import type { World } from '@/shared/types';

/**
 * 5.3 — částečná aktualizace světa (`PATCH /worlds/:id`). Posílá se jen
 * podmnožina polí (metadata, accessMode, theme). BE guard: Korektor+.
 */
export interface UpdateWorldInput {
  name?: string;
  description?: string;
  imageUrl?: string;
  genre?: string;
  system?: string;
  dice?: string[];
  maxPlayers?: number | null;
  playersWanted?: string;
  accessMode?: World['accessMode'];
  themeId?: string;
  themeOverrides?: Record<string, string>;
  themeBackgroundUrl?: string;
}

export function useUpdateWorld(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateWorldInput) =>
      api.patch<World>(`/worlds/${worldId}`, input),
    onSuccess: () => {
      // Prefix invalidace — obnoví detail (id/slug), public list i 'my'.
      qc.invalidateQueries({ queryKey: ['worlds'] });
    },
  });
}
