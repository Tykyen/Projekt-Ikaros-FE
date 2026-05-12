import { useEffect, useRef } from 'react';
import { useAtomValue } from 'jotai';
import { toast } from 'sonner';
import {
  useAuthBootstrap,
  useCurrentUserHydration,
} from '@/features/auth/api/useAuth';
import { accessTokenAtom } from '@/shared/store/authStore';
import {
  useMyLastUnseenDecidedRequest,
  useMarkUsernameRequestSeen,
} from '@/features/admin/users/api/useAdminUsers';

/**
 * Mountuj jednou v root stromu.
 * 1) `useAuthBootstrap` — hydratuje currentUserAtom z JWT (rychlý optimistic
 *    state); smaže expirovaný token.
 * 2) `useCurrentUserHydration` (1.3a) — plnohodnotná hydratace z `/users/me`.
 *    Přepíše atom plnými daty (D-005). Závisí na QueryClientProvider.
 * 3) `UsernameRequestToast` (D-030) — po login zobrazí toast s rozhodnutou
 *    username žádostí, kterou žadatel ještě neviděl.
 */
export function AuthBootstrap() {
  useAuthBootstrap();
  useCurrentUserHydration();
  return <UsernameRequestToast />;
}

function UsernameRequestToast() {
  const accessToken = useAtomValue(accessTokenAtom);
  const { data } = useMyLastUnseenDecidedRequest(!!accessToken);
  const markSeen = useMarkUsernameRequestSeen();
  const shownIdRef = useRef<string | null>(null);

  useEffect(() => {
    const request = data?.request;
    if (!request) return;
    if (shownIdRef.current === request.id) return;
    shownIdRef.current = request.id;

    if (request.status === 'approved') {
      toast.success(
        `Tvoje žádost o změnu username byla schválena. Nový username: ${request.requestedUsername}`,
        { duration: 8000 },
      );
    } else if (request.status === 'rejected') {
      const reason = request.decisionReason
        ? ` Důvod: ${request.decisionReason}`
        : '';
      toast.error(
        `Tvoje žádost o změnu username na "${request.requestedUsername}" byla odmítnuta.${reason}`,
        { duration: 10000 },
      );
    }
    markSeen.mutate(request.id);
  }, [data, markSeen]);

  return null;
}
