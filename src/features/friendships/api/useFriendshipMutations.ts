import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, parseApiError, parseApiErrorCode } from '@/shared/api/client';
import type { FriendshipDto } from '@/shared/types';

/**
 * Spec 1.8 — invaliduje query klíče dotčené friendship mutací.
 * Společné pro send / accept / remove — odlišnost jen v toastech a body.
 */
function invalidateFriendshipQueries(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['friends'] });
  qc.invalidateQueries({ queryKey: ['friendship-status'] });
  qc.invalidateQueries({ queryKey: ['pending-actions'] });
}

/** D-055 — invalidace dotčená block/unblock akcí (přidává `['friends', 'blocked']`). */
function invalidateBlockQueries(qc: ReturnType<typeof useQueryClient>) {
  invalidateFriendshipQueries(qc);
  qc.invalidateQueries({ queryKey: ['friends', 'blocked'] });
}

export function useSendFriendRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      api.post<{ friendship: FriendshipDto }>('/friends/request', { userId }),
    onSuccess: () => {
      invalidateFriendshipQueries(qc);
      toast.success('Žádost o přátelství odeslána');
    },
    onError: (err) => {
      const code = parseApiErrorCode(err);
      if (code === 'REJECTED_RECENTLY') {
        toast.error(
          'Tento uživatel ti nedávno odmítl žádost. Zkus to později.',
        );
        return;
      }
      if (code === 'ALREADY_FRIENDS') {
        toast.error('S tímto uživatelem už jste přátelé.');
        return;
      }
      if (code === 'REQUEST_EXISTS') {
        toast.error('Žádost už čeká na rozhodnutí.');
        return;
      }
      toast.error(parseApiError(err));
    },
  });
}

export function useAcceptFriendRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (friendshipId: string) =>
      api.post<{ friendship: FriendshipDto }>(
        `/friends/${friendshipId}/accept`,
      ),
    onSuccess: () => {
      invalidateFriendshipQueries(qc);
      toast.success('Žádost přijata');
    },
    onError: (err) => {
      toast.error(parseApiError(err));
    },
  });
}

export function useRemoveFriend() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (friendshipId: string) =>
      api.delete<void>(`/friends/${friendshipId}`),
    onSuccess: () => {
      invalidateFriendshipQueries(qc);
    },
    onError: (err) => {
      toast.error(parseApiError(err));
    },
  });
}

export function useRemoveFriendByUserId() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      api.delete<void>(`/friends/by-user/${userId}`),
    onSuccess: () => {
      invalidateFriendshipQueries(qc);
    },
    onError: (err) => {
      toast.error(parseApiError(err));
    },
  });
}

// ── D-055 block flow ─────────────────────────────────────────────────────

export function useBlockUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      api.post<{ friendship: FriendshipDto }>(`/friends/block/${userId}`),
    onSuccess: () => {
      invalidateBlockQueries(qc);
      toast.success('Uživatel zablokován');
    },
    onError: (err) => {
      const code = parseApiErrorCode(err);
      if (code === 'BLOCKED_BY_PEER') {
        toast.error('Tento uživatel ti zablokoval kontakt.');
        return;
      }
      toast.error(parseApiError(err));
    },
  });
}

export function useUnblockUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      api.delete<void>(`/friends/block/${userId}`),
    onSuccess: () => {
      invalidateBlockQueries(qc);
      toast.success('Odblokováno');
    },
    onError: (err) => {
      toast.error(parseApiError(err));
    },
  });
}
