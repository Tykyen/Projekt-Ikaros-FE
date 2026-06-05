import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useSocketEvent } from '@/features/chat/api/useSocket';
import {
  toastFriendRequestAccepted,
  toastIncomingFriendRequest,
} from '../lib/toasts';

interface IncomingPayload {
  friendshipId: string;
  from: { username: string };
}
interface AcceptedPayload {
  friendshipId: string;
  by: { username: string };
}
// W-2 — declined/canceled/removed handlery payload nečtou (jen invalidace),
// a canceled/removed `by` ani neemitují → typ zúžen na to, co opravdu chodí.
interface SimplePayload {
  friendshipId: string;
}
// W-1 — blokace (ruší přátelství). Obě strany refetchnou seznam přátel.
interface BlockedPayload {
  blockerId: string;
  blockedId: string;
}

/**
 * Spec 1.8 §4.6 — socket listeners pro friendship eventy.
 *
 * Mount v `IkarosLayout` (jednou per session). Invaliduje query klíče
 * `['friends']`, `['friendship-status']` a `['pending-actions']` — UI se
 * obnoví bez ručního refreshe.
 *
 * Toasty: `incoming` (s akcí „Zobrazit") a `accepted` (success). Ostatní
 * eventy diskrétní (jen invalidace queries).
 */
export function useFriendshipsSocket(): void {
  const qc = useQueryClient();
  const navigate = useNavigate();

  useSocketEvent<IncomingPayload>('friend:request:incoming', (p) => {
    qc.invalidateQueries({ queryKey: ['pending-actions'] });
    qc.invalidateQueries({ queryKey: ['friendship-status'] });
    toastIncomingFriendRequest(p.from, navigate);
  });

  useSocketEvent<AcceptedPayload>('friend:request:accepted', (p) => {
    qc.invalidateQueries({ queryKey: ['friends'] });
    qc.invalidateQueries({ queryKey: ['friendship-status'] });
    qc.invalidateQueries({ queryKey: ['pending-actions'] }); // C-13 — badge žádostí
    toastFriendRequestAccepted(p.by);
  });

  useSocketEvent<SimplePayload>('friend:request:declined', () => {
    qc.invalidateQueries({ queryKey: ['friendship-status'] });
    qc.invalidateQueries({ queryKey: ['friends', 'outgoing'] });
  });

  useSocketEvent<SimplePayload>('friend:request:canceled', () => {
    qc.invalidateQueries({ queryKey: ['pending-actions'] });
    qc.invalidateQueries({ queryKey: ['friendship-status'] }); // C-13 — tlačítko na profilu
  });

  useSocketEvent<SimplePayload>('friend:removed', () => {
    qc.invalidateQueries({ queryKey: ['friends'] });
    qc.invalidateQueries({ queryKey: ['friendship-status'] });
    qc.invalidateQueries({ queryKey: ['pending-actions'] }); // C-13 — badge žádostí
  });

  // W-1 — blokace zruší přátelství; tichá invalidace bez toastu (blokovanému
  // se „byl jsi zablokován" záměrně nepushuje).
  useSocketEvent<BlockedPayload>('friend:blocked', () => {
    qc.invalidateQueries({ queryKey: ['friends'] });
    qc.invalidateQueries({ queryKey: ['friendship-status'] });
    qc.invalidateQueries({ queryKey: ['pending-actions'] });
  });

  // C-31 — admin změnil identitu (role/ban/unban/username); BE pushuje do
  // user:{id} roomu. Obnov vlastní profil i veřejný profil (role chip / overlay).
  useSocketEvent<{ kind: string }>('user:identity:changed', () => {
    qc.invalidateQueries({ queryKey: ['users', 'me'] });
    qc.invalidateQueries({ queryKey: ['public-user-profile'] });
  });
}
