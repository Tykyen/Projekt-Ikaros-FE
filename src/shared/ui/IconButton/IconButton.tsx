import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import clsx from 'clsx';
import s from './IconButton.module.css';

type Size = 'sm' | 'md' | 'lg';
type Variant = 'ghost' | 'solid' | 'danger';

/**
 * 17.8 — sdílené icon-only tlačítko. `aria-label` je POVINNÉ (TS ho vynutí),
 * takže žádné nové ikonové tlačítko nezůstane pro čtečku bez jména. Na hrubém
 * ukazateli (prst) min. 44×44 (WCAG 2.5.8, synergie s 17.4). Fokusový prsten
 * dědí z globálního `:focus-visible` (reset.css) — komponenta ho neruší.
 */
interface IconButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> {
  /** Přístupné jméno pro čtečku — POVINNÉ. */
  'aria-label': string;
  size?: Size;
  variant?: Variant;
  /** Ikona (SVG / glyph / lucide komponenta). */
  children: ReactNode;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ size = 'md', variant = 'ghost', className, children, type, ...rest }, ref) => (
    <button
      ref={ref}
      type={type ?? 'button'}
      className={clsx(s.iconBtn, s[size], s[variant], className)}
      {...rest}
    >
      {children}
    </button>
  ),
);
IconButton.displayName = 'IconButton';
