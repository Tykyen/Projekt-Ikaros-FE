import { useMyWorlds } from './useWorlds';
import { useMyAccessRequests } from './useMyAccessRequests';
import type { WorldAccessRequest, WorldMembership } from '@/shared/types';

export type WorldStatus = 'non-member' | 'pending-access' | 'member';

/**
 * Spec 2.4 — kombinovaný status current usera v daném světě.
 *
 *  - `member` — má `WorldMembership` (libovolná role 0–5).
 *  - `pending-access` — má `WorldAccessRequest` (čeká na schválení PJ).
 *  - `non-member` — žádné z výše.
 *
 * Jediný zdroj pravdy pro JoinCTA, WorldLayout split a sub-route guard.
 */
export function useWorldStatus(worldId: string): {
  status: WorldStatus;
  membership: WorldMembership | null;
  pendingAccessRequest: WorldAccessRequest | null;
  isLoading: boolean;
} {
  const myWorlds = useMyWorlds();
  const myAr = useMyAccessRequests();

  const membership =
    myWorlds.data?.find((w) => w.world.id === worldId)?.membership ?? null;
  const pendingAccessRequest =
    myAr.data?.find((r) => r.world.id === worldId)?.accessRequest ?? null;

  const status: WorldStatus = membership
    ? 'member'
    : pendingAccessRequest
      ? 'pending-access'
      : 'non-member';

  return {
    status,
    membership,
    pendingAccessRequest,
    isLoading: myWorlds.isLoading || myAr.isLoading,
  };
}
