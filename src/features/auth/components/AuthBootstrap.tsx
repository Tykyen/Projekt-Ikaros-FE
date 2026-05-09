import {
  useAuthBootstrap,
  useCurrentUserHydration,
} from '@/features/auth/api/useAuth';

/**
 * Mountuj jednou v root stromu.
 * 1) `useAuthBootstrap` — hydratuje currentUserAtom z JWT (rychlý optimistic
 *    state); smaže expirovaný token.
 * 2) `useCurrentUserHydration` (1.3a) — plnohodnotná hydratace z `/users/me`.
 *    Přepíše atom plnými daty (D-005). Závisí na QueryClientProvider.
 */
export function AuthBootstrap() {
  useAuthBootstrap();
  useCurrentUserHydration();
  return null;
}
