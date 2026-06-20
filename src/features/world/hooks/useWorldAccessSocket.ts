import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useSocketEvent, useSocketReconnect } from '@/features/chat/api/useSocket';

interface AccessRequestedPayload {
  accessRequestId: string;
  worldId: string;
  worldName: string;
  worldSlug: string;
  ownerId: string;
  requesterId: string;
}

interface AccessApprovedPayload {
  accessRequestId: string;
  worldId: string;
  worldName: string;
  worldSlug: string;
  requesterId: string;
}

interface AccessRejectedPayload {
  accessRequestId: string;
  worldId: string;
  worldName: string;
  requesterId: string;
}

interface AccessCancelledPayload {
  accessRequestId: string;
  worldId: string;
  ownerId: string;
}

/**
 * Spec 2.4 — socket listeners pro world access request eventy.
 *
 * Mount v `IkarosLayout` (jednou per session, vedle `useFriendshipsSocket`).
 *
 *  - `world:access-requested` → PJ vlastník (toast „nová žádost").
 *  - `world:access-approved`  → žadatel (toast success + invalidate worlds/my).
 *  - `world:access-rejected`  → žadatel (toast info).
 *  - `world:access-cancelled` → PJ vlastník (badge count update, bez toastu).
 */
export function useWorldAccessSocket(): void {
  const qc = useQueryClient();

  useSocketEvent<AccessRequestedPayload>('world:access-requested', (p) => {
    qc.invalidateQueries({ queryKey: ['pending-actions'] });
    toast.info(`Nová žádost o vstup do světa „${p.worldName}".`);
  });

  useSocketEvent<AccessApprovedPayload>('world:access-approved', (p) => {
    qc.invalidateQueries({ queryKey: ['worlds', 'my-access-requests'] });
    qc.invalidateQueries({ queryKey: ['worlds', 'my'] });
    // C-01 — broad ['worlds'] (ne ['worlds',worldId]) ať se obnoví i world detail.
    qc.invalidateQueries({ queryKey: ['worlds'] });
    toast.success(`Tvá žádost o vstup do „${p.worldName}" byla přijata.`);
  });

  useSocketEvent<AccessRejectedPayload>('world:access-rejected', (p) => {
    qc.invalidateQueries({ queryKey: ['worlds', 'my-access-requests'] });
    toast.info(`Tvá žádost o vstup do „${p.worldName}" byla odmítnuta.`);
  });

  useSocketEvent<AccessCancelledPayload>('world:access-cancelled', () => {
    qc.invalidateQueries({ queryKey: ['pending-actions'] });
  });

  // S-RUN-01 — access eventy jdou do user:{id} (server re-joinne sám), ale
  // vyslané během výpadku jsou pryč → po reconnectu refetch dotčených klíčů
  // (vzor S-05 z useFriendshipsSocket). Bez toho PJ neuvidí novou žádost ani
  // žadatel schválení, dokud něco neudělá / nezmáčkne F5.
  useSocketReconnect(() => {
    qc.invalidateQueries({ queryKey: ['pending-actions'] });
    qc.invalidateQueries({ queryKey: ['worlds', 'my-access-requests'] });
    qc.invalidateQueries({ queryKey: ['worlds', 'my'] });
    qc.invalidateQueries({ queryKey: ['worlds'] });
  });
}
