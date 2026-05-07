import type { HTMLAttributes } from 'react';
import clsx from 'clsx';
import s from './Card.module.css';

type Padding = 'sm' | 'md' | 'lg';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: Padding;
  clickable?: boolean;
}

export function Card({ padding = 'md', clickable, className, ...rest }: CardProps) {
  return (
    <div
      className={clsx(s.card, s[padding], clickable && s.clickable, className)}
      {...rest}
    />
  );
}
