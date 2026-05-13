import { Crown, Shield, PenLine, User, Eye, Hourglass, type LucideIcon } from 'lucide-react';
import clsx from 'clsx';
import s from './WorldRoleIcon.module.css';

export type WorldRoleKey =
  | 'pj'
  | 'pj-asst'
  | 'corrector'
  | 'player'
  | 'reader'
  | 'applicant';

type Size = 'sm' | 'md' | 'lg';

type Props = {
  role: WorldRoleKey;
  size?: Size;
  showLabel?: boolean;
  className?: string;
};

const SIZE_PX: Record<Size, number> = {
  sm: 14,
  md: 18,
  lg: 24,
};

type WorldRoleConfig = { icon: LucideIcon; label: string; className: string };

const CONFIG: Record<WorldRoleKey, WorldRoleConfig> = {
  'pj':        { icon: Crown,     label: 'PJ',          className: s.iconPj },
  'pj-asst':   { icon: Shield,    label: 'Pomocný PJ',  className: s.iconPjAsst },
  'corrector': { icon: PenLine,   label: 'Korektor',    className: s.iconCorrector },
  'player':    { icon: User,      label: 'Hráč',        className: s.iconPlayer },
  'reader':    { icon: Eye,       label: 'Čtenář',      className: s.iconReader },
  'applicant': { icon: Hourglass, label: 'Žadatel',     className: s.iconApplicant },
};

export function WorldRoleIcon({ role, size = 'md', showLabel = false, className }: Props) {
  const { icon: Icon, label, className: roleCls } = CONFIG[role];
  const px = SIZE_PX[size];
  return (
    <span
      className={clsx(s.wrapper, roleCls, className)}
      title={label}
      aria-label={label}
    >
      <Icon size={px} strokeWidth={2} aria-hidden="true" />
      {showLabel && <span className={s.label}>{label}</span>}
    </span>
  );
}
