import { UserRole } from '@/shared/types';

/**
 * 19.4 (spec-19.4) — role, které mají výhody podporovatele automaticky
 * (tým platformy). Zrcadlo BE `supporter.util.ts`.
 */
const SUPPORTER_ROLES: ReadonlySet<UserRole> = new Set<UserRole>([
  UserRole.Superadmin,
  UserRole.Admin,
  UserRole.SpravceClanku,
  UserRole.SpravceGalerie,
  UserRole.SpravceDiskuzi,
]);

/**
 * Efektivní podporovatel = má ENTITLEMENT na výhody (víc světů, prémiové kostky,
 * vězení) — z uděleného `isSupporter`, nebo z týmové role. Používá FE gating UX
 * (limit světů, zámky skinů). BE je ale autorita — tohle jen skrývá/odemyká UI.
 *
 * POZOR: pro VIZUÁLNÍ odznak platí jiné pravidlo (hvězda role > Ikaros odznak);
 * to řeší komponenta `IdentityBadge`, ne tenhle helper.
 */
export function isEffectiveSupporter(
  role: UserRole,
  isSupporter?: boolean,
): boolean {
  return !!isSupporter || SUPPORTER_ROLES.has(role);
}
