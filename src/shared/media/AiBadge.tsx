import clsx from 'clsx';
import { Sparkles } from 'lucide-react';
import s from './AiBadge.module.css';

type Size = 'sm' | 'md';

interface Props {
  /** `sm` = přes thumbnail, `md` = v detailu. */
  size?: Size;
  className?: string;
}

const TOOLTIP = 'Vytvořeno pomocí AI (uvedl autor)';

/**
 * 20D (D2) — štítek „AI" u obsahu, který autor dobrovolně označil jako
 * vytvořený AI (`aiOrigin === 'ai_image'`). Renderuj podmíněně na volajícím
 * místě; komponenta sama nezná stav položky.
 */
export function AiBadge({ size = 'md', className }: Props) {
  return (
    <span
      className={clsx(s.badge, size === 'sm' && s.sm, className)}
      title={TOOLTIP}
      aria-label={TOOLTIP}
    >
      <Sparkles className={s.icon} aria-hidden />
      AI
    </span>
  );
}
