import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import type { WorldMembership, WorldAccessRequest } from '@/shared/types';

/**
 * Spec 2.4 — vstup do public světa (role Čtenář).
 * Pro open/private použij `useRequestAccess`.
 */
export function useJoinWorld() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (worldId: string) =>
      api.post<WorldMembership>(`/worlds/${worldId}/join`),
    onSuccess: (_data, worldId) => {
      qc.invalidateQueries({ queryKey: ['worlds', worldId] });
      qc.invalidateQueries({ queryKey: ['worlds', 'my'] });
    },
  });
}

/**
 * Spec 2.4 — žádost o vstup do open/private světa (vytvoří `WorldAccessRequest`).
 */
export function useRequestAccess() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (worldId: string) =>
      api.post<WorldAccessRequest>(`/worlds/${worldId}/access-request`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['worlds', 'my-access-requests'] });
    },
  });
}

/**
 * Spec 2.4 — žadatel zruší vlastní pending žádost o vstup.
 */
export function useCancelAccessRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (worldId: string) =>
      api.delete<void>(`/worlds/${worldId}/access-request`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['worlds', 'my-access-requests'] });
    },
  });
}

/**
 * Spec 2.4 — PJ schválí žádost o vstup (AR → membership Čtenář).
 */
export function useApproveAccessRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      worldId,
      requestId,
    }: {
      worldId: string;
      requestId: string;
    }) =>
      api.post<{ ok: true; membership: WorldMembership }>(
        `/worlds/${worldId}/access-requests/${requestId}/approve`,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pending-actions'] });
    },
  });
}

/**
 * Spec 2.4 — PJ zamítne žádost o vstup (delete AR).
 */
export function useRejectAccessRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      worldId,
      requestId,
    }: {
      worldId: string;
      requestId: string;
    }) =>
      api.post<{ ok: true }>(
        `/worlds/${worldId}/access-requests/${requestId}/reject`,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pending-actions'] });
    },
  });
}
