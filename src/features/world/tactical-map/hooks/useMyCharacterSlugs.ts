/**
 * 10.2d — derivace „mé postavy" v současném světě (per memory: workaround
 * pro absence WorldMembership.characterIds[] — používá singular characterPath).
 *
 * Plán: docs/arch/phase-10/plan-10.2d.md C4.
 */
import { useMemo } from 'react';
import { useWorldMembers } from '@/features/world/api/useWorldMembers';

export function useMyCharacterSlugs(
  worldId: string | null,
  currentUserId: string | null,
): string[] {
  const members = useWorldMembers(worldId ?? '');
  return useMemo(() => {
    if (!worldId || !currentUserId) return [];
    const me = members.data?.find((m) => m.userId === currentUserId);
    if (!me?.characterPath) return [];
    const slug = me.characterPath.split('/').pop();
    return slug ? [slug] : [];
  }, [members.data, worldId, currentUserId]);
}
