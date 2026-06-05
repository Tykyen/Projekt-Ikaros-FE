import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import type { WorldMembership, WorldRole } from '@/shared/types';

/**
 * 5.3c — změna role / skupiny / AKJ úrovně člena světa. Každé pole má
 * vlastní BE endpoint; hook je sjednocuje pod jednu mutaci.
 * BE guard: PomocnyPJ+ (`canManageMembers`).
 */
export type UpdateMemberPayload =
  | { membershipId: string; field: 'role'; value: WorldRole }
  | { membershipId: string; field: 'group'; value: string | undefined }
  | { membershipId: string; field: 'akj'; value: number };

export function useUpdateMember(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateMemberPayload) => {
      const base = `/worlds/${worldId}/members/${payload.membershipId}`;
      switch (payload.field) {
        case 'role':
          return api.patch<WorldMembership>(`${base}/role`, {
            role: payload.value,
          });
        case 'group':
          return api.patch<WorldMembership>(`${base}/group`, {
            group: payload.value,
          });
        case 'akj':
          return api.patch<WorldMembership>(`${base}/akj`, {
            akj: payload.value,
          });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['worlds', worldId, 'members'] });
      // C-03 — změna vlastní role se promítá do useMyWorlds (WorldContext role/slot).
      qc.invalidateQueries({ queryKey: ['worlds', 'my'] });
    },
  });
}
