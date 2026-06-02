import { UserRole } from './index';

/**
 * 1.3b — lidský český popisek pro každou roli.
 * D-053 — Zúženo na 6 globálních rolí; world labely (PJ/Korektor/Hráč/Čtenář/Žadatel/PomocnyPJ)
 * jsou ve `WorldRoleIcon` komponentě.
 */
export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.Superadmin]: 'Superadmin',
  [UserRole.Admin]: 'Admin',
  [UserRole.Ikarus]: 'Ikarus',
  [UserRole.SpravceClanku]: 'Správce článků',
  [UserRole.SpravceGalerie]: 'Správce galerie',
  [UserRole.SpravceDiskuzi]: 'Správce diskuzí',
};

/**
 * Role, které se zobrazí v dropdown role-change v `/admin` Uživatelé (a v role-filtru
 * a bulk role-change modalu). Záměrně **jen globální** role — world role
 * (PJ / Korektor / Hráč / Čtenář / Žadatel) patří do správy konkrétního světa,
 * nikoli do platformního adminu (viz D-054).
 *
 * D-053 (2026-05-13) — `UserRole.PJ/Korektor/Hrac/Ctenar/Zadatel` odstraněny z enumu;
 * world role jsou nyní výhradně v `WorldRole`. ASSIGNABLE_ROLES zachycuje 6 globálních.
 */
export const ASSIGNABLE_ROLES: UserRole[] = [
  UserRole.Superadmin,
  UserRole.Admin,
  UserRole.SpravceDiskuzi,
  UserRole.SpravceClanku,
  UserRole.SpravceGalerie,
  UserRole.Ikarus,
];
