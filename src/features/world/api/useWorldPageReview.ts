import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { worldPendingActionsKey } from './useWorldPendingActions';

/** 15.11 — PJ schválí návrh obsahu hráče → live (approved). */
export function useApproveProposal(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) =>
      api.post<{ pageStatus: string }>(
        `/worlds/${worldId}/pages/${slug}/approve`,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: worldPendingActionsKey(worldId) });
      // Adresář / wiki / postavy — schválená stránka se objeví.
      qc.invalidateQueries({ queryKey: ['pages'] });
      qc.invalidateQueries({ queryKey: ['characters'] });
    },
  });
}

/** 15.11 — PJ vrátí návrh k přepracování (`rework`) nebo zahodí (`discard`). */
export function useRejectProposal(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      slug,
      mode,
    }: {
      slug: string;
      mode: 'rework' | 'discard';
    }) =>
      api.post<{ ok: true }>(`/worlds/${worldId}/pages/${slug}/reject`, {
        mode,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: worldPendingActionsKey(worldId) });
      qc.invalidateQueries({ queryKey: ['pages'] });
      qc.invalidateQueries({ queryKey: ['characters'] });
    },
  });
}
