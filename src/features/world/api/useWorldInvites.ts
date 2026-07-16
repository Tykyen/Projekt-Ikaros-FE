import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import type { WorldInviteListItem } from '@/shared/types';

/** 15.10 fáze B — aktivní (pending) pozvánky světa; PJ přehled. */
export function useWorldInvites(worldId: string, enabled = true) {
  return useQuery({
    queryKey: ['worlds', worldId, 'invites'],
    queryFn: () => api.get<WorldInviteListItem[]>(`/worlds/${worldId}/invites`),
    enabled: !!worldId && enabled,
    staleTime: 30_000,
  });
}

/** Vytvořit pozvánku: cílenou (`user`) nebo odkaz (`link`). */
export function useCreateInvite(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      kind: 'user' | 'link';
      invitedUserId?: string;
      expiresInDays?: number;
      maxUses?: number;
    }) => api.post<WorldInviteListItem>(`/worlds/${worldId}/invites`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['worlds', worldId, 'invites'] });
    },
  });
}

/** Zrušit (revoke) pozvánku/odkaz. */
export function useRevokeInvite(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (inviteId: string) =>
      api.delete<void>(`/worlds/${worldId}/invites/${inviteId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['worlds', worldId, 'invites'] });
    },
  });
}

/** Pozvaný přijme cílenou pozvánku (→ membership Čtenář). */
export function useAcceptInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      worldId,
      inviteId,
    }: {
      worldId: string;
      inviteId: string;
    }) => api.post<{ ok: true }>(`/worlds/${worldId}/invites/${inviteId}/accept`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pending-actions'] });
      qc.invalidateQueries({ queryKey: ['worlds'] });
    },
  });
}

/** Pozvaný odmítne cílenou pozvánku. */
export function useDeclineInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      worldId,
      inviteId,
    }: {
      worldId: string;
      inviteId: string;
    }) =>
      api.post<{ ok: true }>(`/worlds/${worldId}/invites/${inviteId}/decline`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pending-actions'] });
    },
  });
}

/** Přijetí pozvacího ODKAZU přihlášeným uživatelem. */
export function useAcceptLinkInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (token: string) =>
      api.post<{ ok: true; worldId: string; worldSlug: string }>(
        `/worlds/invite-token/${token}/accept`,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['worlds'] });
    },
  });
}
