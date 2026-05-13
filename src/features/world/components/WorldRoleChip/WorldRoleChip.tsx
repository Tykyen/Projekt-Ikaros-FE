import clsx from 'clsx';
import { Crown, Shield, PenLine, User, Eye, Hourglass, type LucideIcon } from 'lucide-react';
import { WorldRole } from '@/shared/types';
import s from './WorldRoleChip.module.css';

interface ChipConfig {
  label: string;
  longLabel: string;
  icon: LucideIcon;
  className: string;
}

const CONFIG: Record<WorldRole, ChipConfig> = {
  [WorldRole.PJ]: {
    label: 'PJ',
    longLabel: 'Pán jeskyně — vede svět',
    icon: Crown,
    className: s.chipPj,
  },
  [WorldRole.PomocnyPJ]: {
    label: 'Pomocný PJ',
    longLabel: 'Pomocný PJ — zástup vedení světa',
    icon: Shield,
    className: s.chipPjAsst,
  },
  [WorldRole.Korektor]: {
    label: 'Korektor',
    longLabel: 'Korektor — opravuje obsah světa',
    icon: PenLine,
    className: s.chipCorrector,
  },
  [WorldRole.Hrac]: {
    label: 'Hráč',
    longLabel: 'Hráč — aktivní účast ve světě',
    icon: User,
    className: s.chipPlayer,
  },
  [WorldRole.Ctenar]: {
    label: 'Čtenář',
    longLabel: 'Čtenář — pasivní přístup k obsahu',
    icon: Eye,
    className: s.chipReader,
  },
  [WorldRole.Zadatel]: {
    label: 'Žadatel',
    longLabel: 'Žadatel — čeká na schválení vstupu',
    icon: Hourglass,
    className: s.chipApplicant,
  },
};

interface WorldRoleChipProps {
  role: WorldRole;
  size?: 'sm' | 'md';
  tooltip?: boolean;
}

export function WorldRoleChip({
  role,
  size = 'md',
  tooltip = true,
}: WorldRoleChipProps) {
  const cfg = CONFIG[role];
  const Icon = cfg.icon;
  const iconSize = size === 'sm' ? 10 : 12;
  return (
    <span
      className={clsx(s.chip, cfg.className, size === 'sm' && s.sm)}
      title={tooltip ? cfg.longLabel : undefined}
      aria-label={tooltip ? cfg.longLabel : cfg.label}
    >
      <span className={s.icon} aria-hidden="true">
        <Icon size={iconSize} strokeWidth={2} />
      </span>
      <span className={s.label}>{cfg.label}</span>
    </span>
  );
}
