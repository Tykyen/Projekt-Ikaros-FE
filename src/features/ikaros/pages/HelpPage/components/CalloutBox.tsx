import type { ReactNode } from 'react';
import { Lightbulb, AlertTriangle, Code2, type LucideIcon } from 'lucide-react';
import s from '../HelpPage.module.css';

export type CalloutVariant = 'tip' | 'pozor' | 'priklad';

const VARIANT: Record<CalloutVariant, { cls: string; Icon: LucideIcon; title: string }> = {
  tip: { cls: s.calloutTip, Icon: Lightbulb, title: 'Tip' },
  pozor: { cls: s.calloutPozor, Icon: AlertTriangle, title: 'Pozor' },
  priklad: { cls: s.calloutPriklad, Icon: Code2, title: 'Příklad' },
};

/** Zvýrazněný box: tip (akcent) / pozor (warning) / příklad (mono blok). */
export function CalloutBox({
  variant,
  title,
  children,
}: {
  variant: CalloutVariant;
  /** Vlastní nadpis; výchozí dle varianty. */
  title?: ReactNode;
  children: ReactNode;
}) {
  const { cls, Icon, title: defaultTitle } = VARIANT[variant];
  return (
    <div className={`${s.calloutBox} ${cls}`}>
      <span className={s.calloutIcon}>
        <Icon size={18} aria-hidden="true" />
      </span>
      <div className={s.calloutContent}>
        <div className={s.calloutTitle}>{title ?? defaultTitle}</div>
        {children}
      </div>
    </div>
  );
}
