import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import type { WorldMembership } from '@/shared/types';

/**
 * Spec 2.4 — žádost o vstup do světa.
 *
 * Backend (`POST /api/worlds/:id/join`) podle `accessMode` automaticky vytvoří:
 * - `public` → membership s rolí `Hrac` (přímý vstup)
 * - `open` / `private` → membership s rolí `Zadatel` (čeká na schválení PJ)
 * - `closed` → 403
 *
 * Idempotentní — opakované volání pro stejného usera vrátí existující membership.
 *
 * Po success invalidujeme `worlds/my` (aby dispatcher v `useWorldLink`
 * správně přepnul na `/svet/:id`) i konkrétní `worlds/:id` (aby se v Detail
 * přerendroval CTA stav).
 */
export function useJoinWorld() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (worldId: string) =>
      api.post<{ membership: WorldMembership }>(
        `/worlds/${worldId}/join`,
        {},
      ),
    onSuccess: (_, worldId) => {
      qc.invalidateQueries({ queryKey: ['worlds', 'my'] });
      qc.invalidateQueries({ queryKey: ['worlds', worldId] });
    },
  });
}
