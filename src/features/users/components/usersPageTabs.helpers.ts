import { UserRole } from '@/shared/types';

export type UsersPageTab =
  | 'pratele'
  | 'uzivatele'
  | 'zpracovat'
  | 'novinky'
  | 'audit'
  | 'friendship-debug';

/**
 * Spec 1.4 (+ side-task „uzivatele-tab-ikarus" + D-056 friendship debug
 * + 3.2f Novinky tab) — role-aware viditelnost tabů.
 *  - Admin/Superadmin: 6 tabů (Přátelé / Uživatelé / Zpracovat / Novinky / Audit / Friendship debug)
 *  - ostatní role: 3 taby (Přátelé / Uživatelé / Zpracovat) — Novinky/Audit/Friendship debug admin-only.
 */
export function visibleTabsForRole(role: UserRole | undefined): UsersPageTab[] {
  if (role === UserRole.Superadmin || role === UserRole.Admin) {
    return [
      'pratele',
      'uzivatele',
      'zpracovat',
      'novinky',
      'audit',
      'friendship-debug',
    ];
  }
  return ['pratele', 'uzivatele', 'zpracovat'];
}

export function defaultTabForRole(role: UserRole | undefined): UsersPageTab {
  void role;
  return 'uzivatele';
}
