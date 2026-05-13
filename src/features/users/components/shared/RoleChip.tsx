import {
  FileText,
  Image as ImageIcon,
  MessageSquare,
  Shield,
  ShieldAlert,
  type LucideIcon,
} from 'lucide-react';
import clsx from 'clsx';
import { UserRole } from '@/shared/types';
import s from './RoleChip.module.css';

interface ChipConfig {
  label: string;
  longLabel: string;
  icon: LucideIcon;
  className: string;
}

/**
 * Spec 1.4 — design audit §2.4. Role chip pro adresářovou kartu, veřejný
 * profil i tabulkový view. `label` je krátká doménová zkratka (8 znaků),
 * `longLabel` v tooltipu doplní plné jméno (čte i screenreader přes title).
 *
 * D-053 — Po cleanupu UserRole jen 6 hodnot. `Ikarus` (base user) = null
 * (žádný chip pro běžné uživatele).
 */
const CHIP_CONFIG: Partial<Record<UserRole, ChipConfig>> = {
  [UserRole.Superadmin]: {
    label: 'Superadmin',
    longLabel: 'Superadmin — nejvyšší autorita platformy',
    icon: ShieldAlert,
    className: s['chip--superadmin'],
  },
  [UserRole.Admin]: {
    label: 'Admin',
    longLabel: 'Admin — platformový administrátor',
    icon: Shield,
    className: s['chip--admin'],
  },
  [UserRole.SpravceClanku]: {
    label: 'Články',
    longLabel: 'Správce článků',
    icon: FileText,
    className: s['chip--spravce-clanku'],
  },
  [UserRole.SpravceGalerie]: {
    label: 'Galerie',
    longLabel: 'Správce galerie',
    icon: ImageIcon,
    className: s['chip--spravce-galerie'],
  },
  [UserRole.SpravceDiskuzi]: {
    label: 'Diskuze',
    longLabel: 'Správce diskuzí',
    icon: MessageSquare,
    className: s['chip--spravce-diskuzi'],
  },
};

interface RoleChipProps {
  role: UserRole;
  size?: 'sm' | 'md';
  /** Tooltip + aria-label s longLabel. Default true. */
  tooltip?: boolean;
}

export function RoleChip({ role, size = 'md', tooltip = true }: RoleChipProps) {
  const cfg = CHIP_CONFIG[role];
  if (!cfg) return null;
  const Icon = cfg.icon;
  const iconSize = size === 'sm' ? 10 : 12;
  return (
    <span
      className={clsx(s.chip, cfg.className, size === 'sm' && s.sm)}
      title={tooltip ? cfg.longLabel : undefined}
      aria-label={tooltip ? cfg.longLabel : cfg.label}
    >
      <span className={s.icon} aria-hidden="true">
        <Icon size={iconSize} />
      </span>
      <span className={s.label}>{cfg.label}</span>
    </span>
  );
}
