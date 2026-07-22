import { useMutation, useQueryClient } from '@tanstack/react-query';
import { vypravecEmit } from '@/shared/vypravec/engine/events';
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
    onSuccess: (_membership, worldId) => {
      // C-01 — broad ['worlds'] prefixuje VŠECHNY world dotazy vč. detailu
      // ['worlds','id'|'slug',key]; ['worlds',worldId] detail netrefí (segment [1]).
      qc.invalidateQueries({ queryKey: ['worlds'] });
      vypravecEmit('join.requested', { worldId }); // Vypravěč (spec 26.4)
    },
  });
}

/**
 * Spec 2.4 — žádost o vstup do open/private světa (vytvoří `WorldAccessRequest`).
 * 15.10 fáze C — volitelný `characterDraft` = „Chci hrát" (approve → Hráč +
 * živá stránka postavy). Bez draftu = „Jen číst" (approve → Čtenář).
 */
export function useRequestAccess() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      worldId,
      characterDraft,
    }: {
      worldId: string;
      characterDraft?: { name: string; note?: string };
    }) =>
      api.post<WorldAccessRequest>(
        `/worlds/${worldId}/access-request`,
        characterDraft ? { characterDraft } : {},
      ),
    onSuccess: (_req, vars) => {
      qc.invalidateQueries({ queryKey: ['worlds', 'my-access-requests'] });
      vypravecEmit('join.requested', { worldId: vars.worldId }); // Vypravěč (spec 26.4)
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
    onSuccess: (_data, { worldId }) => {
      qc.invalidateQueries({ queryKey: ['pending-actions'] });
      // 15.10 — world-scoped fronta (stránka Hráči, drawer, badge).
      qc.invalidateQueries({ queryKey: ['worlds', worldId, 'pending-actions'] });
      // C-02 — REST fallback k WS world:membership:changed: obnov seznam členů
      // i bez socketu (jinak PJ nového člena neuvidí, dokud nedorazí WS echo).
      qc.invalidateQueries({ queryKey: ['worlds', worldId, 'members'] });
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
    onSuccess: (_data, { worldId }) => {
      qc.invalidateQueries({ queryKey: ['pending-actions'] });
      // 15.10 — world-scoped fronta (stránka Hráči, drawer, badge).
      qc.invalidateQueries({ queryKey: ['worlds', worldId, 'pending-actions'] });
    },
  });
}
