import { forwardRef, type ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';
import s from './Button.module.css';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, className, children, disabled, ...rest }, ref) => (
    <button
      ref={ref}
      className={clsx(s.btn, s[variant], s[size], loading && s.loading, className)}
      disabled={disabled || loading}
      {...rest}
    >
      {children}
    </button>
  ),
);
Button.displayName = 'Button';
