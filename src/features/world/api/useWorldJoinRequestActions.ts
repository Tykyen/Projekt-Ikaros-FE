import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';

interface ResolveArgs {
  worldId: string;
  membershipId: string;
}

/**
 * Spec 2.4 — PJ schvaluje pending Zadatel žádost (Zpracovat tab).
 * BE atomicky promote → Hrac + increment `playerCount`.
 */
export function useAcceptWorldJoinRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ worldId, membershipId }: ResolveArgs) =>
      api.post(`/worlds/${worldId}/join-requests/${membershipId}/accept`, {}),
    onSuccess: (_, { worldId }) => {
      qc.invalidateQueries({ queryKey: ['pending-actions'] });
      qc.invalidateQueries({ queryKey: ['worlds', worldId] });
      qc.invalidateQueries({ queryKey: ['worlds', 'my'] });
    },
  });
}

/**
 * Spec 2.4 — PJ zamítá pending Zadatel žádost (delete membership).
 * Žadatel může poslat žádost znovu (žádný cooldown v MVP).
 */
export function useRejectWorldJoinRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ worldId, membershipId }: ResolveArgs) =>
      api.post(`/worlds/${worldId}/join-requests/${membershipId}/reject`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pending-actions'] });
    },
  });
}
