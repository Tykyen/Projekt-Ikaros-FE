import type { ReactNode } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { currentUserAtom } from '@/shared/store/authStore';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { Spinner } from '@/shared/ui';
import { UserRole, WorldRole } from '@/shared/types';
import ForbiddenPage from '@/pages/errors/ForbiddenPage';

interface Props {
  /** Minimální world role v aktuálním světě (např. `WorldRole.PJ`). */
  minWorldRole: WorldRole;
  /** Globální role, které projdou bez ohledu na membership (Sa/Admin shortcut). */
  fallbackGlobalRoles?: UserRole[];
  /**
   * Spec 2.4 — pokud zadáno, fallback je redirect (silent) místo `ForbiddenPage`.
   * Použito pro sub-routes `/svet/:worldId/*` — non-member přesměrujeme na
   * index detail-page, ne na 403 (tam si vybere Vstoupit/Požádat).
   *
   * Speciální token `:worldId` v cíli se nahradí aktuálním worldId z URL.
   */
  redirectTo?: string;
  children: ReactNode;
}

/**
 * D-053b — Per-world membership-based guard.
 *
 * Logika (přesně v tomto pořadí):
 * 1. `WorldContext.loading` → Spinner (membership ještě nedotaženo).
 * 2. `currentUserAtom` v `fallbackGlobalRoles` → projde (Sa/Admin bypass).
 * 3. `WorldContext.userRole >= minWorldRole` → projde (membership match).
 * 4. Jinak → `redirectTo` (pokud zadáno) nebo `ForbiddenPage`.
 *
 * Anon / nepřihlášený dopadne na fallback. Pending Žadatel (role 0) projde
 * pro `minWorldRole=Zadatel`, ale ne pro `Ctenar+`.
 */
export function WorldMembershipGuard({
  minWorldRole,
  fallbackGlobalRoles,
  redirectTo,
  children,
}: Props) {
  const user = useAtomValue(currentUserAtom);
  const { userRole: worldRole, loading } = useWorldContext();
  const { worldId } = useParams<{ worldId: string }>();

  if (loading) return <Spinner center />;

  if (user && fallbackGlobalRoles?.includes(user.role)) {
    return <>{children}</>;
  }

  if (worldRole != null && worldRole >= minWorldRole) {
    return <>{children}</>;
  }

  if (redirectTo) {
    const resolved = redirectTo.replace(':worldId', worldId ?? '');
    return <Navigate to={resolved} replace />;
  }

  return <ForbiddenPage />;
}
