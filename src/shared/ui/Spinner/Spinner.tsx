import clsx from 'clsx';
import s from './Spinner.module.css';

type Size = 'sm' | 'md' | 'lg';

interface SpinnerProps {
  size?: Size;
  center?: boolean;
  className?: string;
}

export function Spinner({ size = 'md', center, className }: SpinnerProps) {
  const el = <span className={clsx(s.spinner, s[size], className)} />;
  return center ? <div className={s.center}>{el}</div> : el;
}
