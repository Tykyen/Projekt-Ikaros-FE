import { UserRole } from '@/shared/types';
import { RoleStar, roleHasStar } from '@/shared/ui/RoleStar/RoleStar';
import { SupporterBadge } from '@/shared/ui/SupporterBadge/SupporterBadge';

type Size = 'sm' | 'md' | 'lg';

type Props = {
  role: UserRole;
  isSupporter?: boolean;
  size?: Size;
  showLabel?: boolean;
  className?: string;
};

/**
 * 19.4 (spec-19.4) — jednotný odznak identity u jména. PRIORITA (nikdy obojí):
 * hvězda (role admin/superadmin/správce) > odznak Ikara (podporovatel) > nic.
 * Admin má výhody podporovatele dál (entitlement), jen vizuálně nosí hvězdu.
 */
export function IdentityBadge({
  role,
  isSupporter,
  size = 'md',
  showLabel = false,
  className,
}: Props) {
  if (roleHasStar(role)) {
    return (
      <RoleStar
        role={role}
        size={size}
        showLabel={showLabel}
        className={className}
      />
    );
  }
  if (isSupporter) {
    return <SupporterBadge size={size} className={className} />;
  }
  return null;
}
