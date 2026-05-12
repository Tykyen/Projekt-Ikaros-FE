import { UserRole } from '@/shared/types';

export type UsersPageTab = 'pratele' | 'uzivatele' | 'zpracovat' | 'audit';

/**
 * Spec 1.4 — role-aware viditelnost tabů.
 *  - Admin/Superadmin: 4 taby (Přátelé / Uživatelé / Zpracovat / Audit)
 *  - ostatní role: 2 taby (Přátelé + Zpracovat)
 */
export function visibleTabsForRole(role: UserRole | undefined): UsersPageTab[] {
  if (role === UserRole.Superadmin || role === UserRole.Admin) {
    return ['pratele', 'uzivatele', 'zpracovat', 'audit'];
  }
  return ['pratele', 'zpracovat'];
}

export function defaultTabForRole(role: UserRole | undefined): UsersPageTab {
  return role === UserRole.Superadmin || role === UserRole.Admin
    ? 'uzivatele'
    : 'pratele';
}
