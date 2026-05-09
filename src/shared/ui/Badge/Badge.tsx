import type { HTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';
import s from './Badge.module.css';

type Variant = 'default' | 'accent' | 'success' | 'warning' | 'danger';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
  icon?: ReactNode;
}

export function Badge({ variant = 'default', icon, className, children, ...rest }: BadgeProps) {
  return (
    <span className={clsx(s.badge, s[variant], className)} {...rest}>
      {icon}
      {children}
    </span>
  );
}
