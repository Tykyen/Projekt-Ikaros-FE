import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import type { World } from '@/shared/types';

/**
 * D-NEW-world-transfer — předání vlastnictví světa jinému členovi
 * (`PATCH /worlds/:id/owner`). Smí jen současný vlastník / globální admin.
 */
export function useTransferOwnership(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (newOwnerId: string) =>
      api.patch<World>(`/worlds/${worldId}/owner`, { newOwnerId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['worlds'] });
    },
  });
}
