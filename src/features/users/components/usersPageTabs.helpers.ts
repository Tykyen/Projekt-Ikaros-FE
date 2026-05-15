import { UserRole } from '@/shared/types';

export type UsersPageTab =
  | 'pratele'
  | 'uzivatele'
  | 'zpracovat'
  | 'audit'
  | 'friendship-debug';

/**
 * Spec 1.4 (+ side-task „uzivatele-tab-ikarus" + D-056 friendship debug)
 * — role-aware viditelnost tabů. 3.1b: tab „Novinky" odstraněn — správa
 * novinek je nyní na veřejné stránce `/ikaros/novinky` (hub).
 *  - Admin/Superadmin: 5 tabů (Přátelé / Uživatelé / Zpracovat / Audit / Friendship debug)
 *  - ostatní role: 3 taby (Přátelé / Uživatelé / Zpracovat) — Audit/Friendship debug admin-only.
 */
export function visibleTabsForRole(role: UserRole | undefined): UsersPageTab[] {
  if (role === UserRole.Superadmin || role === UserRole.Admin) {
    return [
      'pratele',
      'uzivatele',
      'zpracovat',
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
