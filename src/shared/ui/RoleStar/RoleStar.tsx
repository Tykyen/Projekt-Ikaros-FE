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

type RoleStarConfig = { className: string; label: string };

const ROLE_STAR: Partial<Record<UserRole, RoleStarConfig>> = {
  [UserRole.Superadmin]:     { className: s.starSuperadmin,     label: 'Superadmin' },
  [UserRole.Admin]:          { className: s.starAdmin,          label: 'Admin' },
  [UserRole.SpravceDiskuzi]: { className: s.starSpravceDiskuzi, label: 'Správce diskuzí' },
  [UserRole.SpravceClanku]:  { className: s.starSpravceClanku,  label: 'Správce článků' },
  [UserRole.SpravceGalerie]: { className: s.starSpravceGalerie, label: 'Správce galerie' },
};

export function RoleStar({ role, size = 'md', showLabel = false, className }: Props) {
  const config = ROLE_STAR[role];
  if (!config) return null;
  const px = SIZE_PX[size];
  return (
    <span
      className={clsx(s.wrapper, config.className, className)}
      title={config.label}
      aria-label={config.label}
    >
      <Star size={px} strokeWidth={2} aria-hidden="true" />
      {showLabel && <span className={s.label}>{config.label}</span>}
    </span>
  );
}
