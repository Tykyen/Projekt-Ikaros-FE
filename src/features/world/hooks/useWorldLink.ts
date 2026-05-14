import { useMemo } from 'react';
import { useMyWorlds } from '../api/useWorlds';
import { WorldRole } from '@/shared/types';

/**
 * Spec 2.4 — link dispatch pro karty světů.
 *
 * - Member tohoto světa (role !== Zadatel) → `/svet/:id` (gameplay welcome).
 * - Nečlen / anon / Zadatel → `/svet/:id/info` (public detail s Join CTA).
 *
 * Pro anon je `useMyWorlds` disabled (no token) → `myWorlds` undefined →
 * isMember false → fallback `/info`.
 */
export function useWorldLink(worldId: string): string {
  const { data: myWorlds } = useMyWorlds();
  return useMemo(() => {
    const entry = myWorlds?.find((m) => m.world.id === worldId);
    const isMember = entry && entry.membership.role !== WorldRole.Zadatel;
    return isMember ? `/svet/${worldId}` : `/svet/${worldId}/info`;
  }, [myWorlds, worldId]);
}
