import { Star } from 'lucide-react';
import clsx from 'clsx';
import { UserRole } from '@/shared/types';
import s from './RoleStar.module.css';

type Size = 'sm' | 'md' | 'lg';

type Props = {
  role: UserRole;
  size?: Size;
  showLabel?: boolean;
  className?: string;
};

const SIZE_PX: Record<Size, number> = {
  sm: 14,
  md: 18,
  lg: 24,
};

type RoleStarConfig = { color: string; label: string };

const ROLE_STAR: Partial<Record<UserRole, RoleStarConfig>> = {
  [UserRole.Superadmin]:     { color: '#3ecf8e', label: 'Superadmin' },
  [UserRole.Admin]:          { color: '#f5a623', label: 'Admin' },
  [UserRole.SpravceDiskuzi]: { color: '#f0c040', label: 'Správce diskuzí' },
  [UserRole.SpravceClanku]:  { color: '#c04040', label: 'Správce článků' },
  [UserRole.SpravceGalerie]: { color: '#3b82f6', label: 'Správce galerie' },
};

export function RoleStar({ role, size = 'md', showLabel = false, className }: Props) {
  const config = ROLE_STAR[role];
  if (!config) return null;
  const px = SIZE_PX[size];
  return (
    <span
      className={clsx(s.wrapper, className)}
      title={config.label}
      aria-label={config.label}
    >
      <Star
        size={px}
        strokeWidth={2}
        fill={config.color}
        color={config.color}
        aria-hidden="true"
      />
      {showLabel && <span className={s.label}>{config.label}</span>}
    </span>
  );
}
