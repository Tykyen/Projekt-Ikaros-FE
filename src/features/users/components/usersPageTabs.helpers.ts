import { UserRole } from '@/shared/types';

export type UsersPageTab = 'pratele' | 'uzivatele' | 'zpracovat';

/**
 * 12.1 — `/ikaros/uzivatele` je komunitní stránka pro VŠECHNY role:
 * Přátelé / Uživatelé (veřejné karty) / Zpracovat (osobní fronta žádostí).
 * Hloubková správa uživatelů, Audit log i dev nástroj Friendship debug
 * žijí pod `/admin` (PlatformAdminPage). „Zpracovat" zůstává i tady —
 * je to osobní fronta každého uživatele, ne admin nástroj.
 */
export function visibleTabsForRole(role: UserRole | undefined): UsersPageTab[] {
  void role;
  return ['pratele', 'uzivatele', 'zpracovat'];
}

export function defaultTabForRole(role: UserRole | undefined): UsersPageTab {
  void role;
  return 'uzivatele';
}
