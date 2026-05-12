import { UserRole } from './index';

/**
 * 1.3b — lidský český popisek pro každou roli.
 * Source-of-truth pro role labelování v admin UI (dropdown role-change,
 * role chip tooltipy). Spec §2.5 — hierarchie pravomocí.
 */
export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.Superadmin]: 'Superadmin',
  [UserRole.Admin]: 'Admin',
  [UserRole.PJ]: 'PJ',
  [UserRole.Korektor]: 'Korektor',
  [UserRole.Hrac]: 'Hráč',
  [UserRole.Ctenar]: 'Čtenář',
  [UserRole.Zadatel]: 'Žadatel',
  [UserRole.Ikarus]: 'Ikarus',
  [UserRole.SpravceClanku]: 'Správce článků',
  [UserRole.SpravceGalerie]: 'Správce galerie',
  [UserRole.SpravceDiskuzi]: 'Správce diskuzí',
};

/**
 * Role, které se zobrazí v dropdown role-change v AdminUsersPage.
 * `Zakaz` je vyloučena (deprecated — viz D-029).
 */
export const ASSIGNABLE_ROLES: UserRole[] = [
  UserRole.Superadmin,
  UserRole.Admin,
  UserRole.PJ,
  UserRole.Korektor,
  UserRole.Hrac,
  UserRole.Ctenar,
  UserRole.Zadatel,
  UserRole.Ikarus,
  UserRole.SpravceClanku,
  UserRole.SpravceGalerie,
  UserRole.SpravceDiskuzi,
];
