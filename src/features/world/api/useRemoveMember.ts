import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';

/**
 * 5.3 — odebrání / odchod člena světa (`DELETE .../members/:membershipId`).
 * BE: self (odchod) NEBO PomocnyPJ+ (odebrání). PJ se odebrat nemůže.
 */
export function useRemoveMember(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (membershipId: string) =>
      api.delete<{ message: string }>(
        `/worlds/${worldId}/members/${membershipId}`,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['worlds', worldId, 'members'] });
      qc.invalidateQueries({ queryKey: ['worlds', 'my'] });
    },
  });
}
