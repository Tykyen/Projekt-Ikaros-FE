import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import type { WorldMembership } from '@/shared/types';

/**
 * 8.2 — Přiřazení / odpojení postavy členovi světa.
 * BE: `PATCH /worlds/:worldId/members/:membershipId/character`.
 * `characterPath` = slug postavy; `undefined` = odpojit.
 * BE guard: PomocnyPJ+ nebo úprava sebe sama.
 */
export interface UpdateMemberCharacterPayload {
  membershipId: string;
  characterPath?: string;
  /** Obrázek přiřazené postavy → world-scoped avatar člena. */
  avatarUrl?: string;
}

export function useUpdateMemberCharacter(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateMemberCharacterPayload) =>
      api.patch<WorldMembership>(
        `/worlds/${worldId}/members/${payload.membershipId}/character`,
        // null (ne undefined) — undefined by JSON zahodil a BE by neodpojil.
        {
          characterPath: payload.characterPath ?? null,
          avatarUrl: payload.avatarUrl ?? null,
        },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['worlds', worldId, 'members'] });
      // 8.3 — slot postavy v WorldContext se odvozuje z `useMyWorlds`
      // (membership.characterPath aktuálního uživatele). Bez této invalidace
      // by se header / `/moje-postava` aktualizoval až po staleTime 5 min.
      qc.invalidateQueries({ queryKey: ['worlds', 'my'] });
    },
  });
}
