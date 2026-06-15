import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { toast } from 'sonner';
import { api, parseApiError } from '@/shared/api/client';
import { accessTokenAtom } from '@/shared/store/authStore';
import type { World } from '@/shared/types';

/**
 * Soft-delete světa (`DELETE /worlds/:id`). Smí PJ vlastník i Admin/Superadmin.
 * Data zůstávají — Admin může do 30 dní obnovit přes recovery panel.
 */
export function useDeleteWorld() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (worldId: string) =>
      api.delete<{ message: string }>(`/worlds/${worldId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['worlds'] });
    },
    onError: (err) => toast.error(parseApiError(err)),
  });
}

/** Seznam soft-smazaných světů pro Admin recovery panel (`GET /worlds/deleted`). */
export function useDeletedWorlds(enabled = true) {
  const token = useAtomValue(accessTokenAtom);
  return useQuery({
    queryKey: ['worlds', 'deleted'],
    queryFn: () => api.get<World[]>('/worlds/deleted'),
    enabled: enabled && !!token,
    staleTime: 30_000,
  });
}

/**
 * Obnova soft-smazaného světa (`POST /worlds/:id/restore`) — jen Admin/Superadmin,
 * do 30 dní. Volitelně přiřadí nového vlastníka (převzetí světa).
 */
export function useRestoreWorld() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      worldId,
      newOwnerId,
    }: {
      worldId: string;
      newOwnerId?: string;
    }) =>
      api.post<{ message: string }>(
        `/worlds/${worldId}/restore`,
        newOwnerId ? { newOwnerId } : {},
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['worlds'] });
    },
    onError: (err) => toast.error(parseApiError(err)),
  });
}
