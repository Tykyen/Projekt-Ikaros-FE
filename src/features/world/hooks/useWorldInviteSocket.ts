import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  useSocketEvent,
  useSocketReconnect,
} from '@/features/chat/api/useSocket';

interface InviteReceivedPayload {
  inviteId: string;
  worldId: string;
  worldName: string;
  worldSlug: string;
  invitedUserId: string;
}

/**
 * 15.10 fáze B — listener cílených pozvánek do světa. Mount v `IkarosLayout`
 * (jednou per session, vedle `useWorldAccessSocket`).
 *
 *  - `world:invite-received` → pozvaný (toast + invalidate `pending-actions`).
 *
 * Reconnect refetch (S-RUN-01 vzor): pozvánky vyslané během výpadku jsou pryč,
 * bez refetche by je pozvaný neuviděl bez F5.
 */
export function useWorldInviteSocket(): void {
  const qc = useQueryClient();

  useSocketEvent<InviteReceivedPayload>('world:invite-received', (p) => {
    qc.invalidateQueries({ queryKey: ['pending-actions'] });
    toast.info(`Dostal jsi pozvánku do světa „${p.worldName}".`);
  });

  useSocketReconnect(() => {
    qc.invalidateQueries({ queryKey: ['pending-actions'] });
  });
}
