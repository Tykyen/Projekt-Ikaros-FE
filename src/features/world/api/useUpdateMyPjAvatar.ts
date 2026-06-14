import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import type { WorldMembership } from '@/shared/types';

/**
 * 6.8-followup — self-service avatar vedení.
 * `PUT /worlds/:worldId/members/me/pj-avatar` — člen vedení (PomocnyPJ+) edituje
 * jen své membership. `null` = odebrat avatar (fallback na účet).
 */
export function useUpdateMyPjAvatar(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (avatarUrl: string | null) =>
      api.put<WorldMembership>(`/worlds/${worldId}/members/me/pj-avatar`, {
        avatarUrl,
      }),
    onSuccess: () => {
      // Obnoví my-membership (header) + members (chat) + status.
      qc.invalidateQueries({ queryKey: ['worlds'] });
    },
  });
}
