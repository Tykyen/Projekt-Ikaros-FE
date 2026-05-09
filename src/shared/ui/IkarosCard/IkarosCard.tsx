import type { ReactNode } from 'react';
import clsx from 'clsx';
import { CornerOrnament } from '@/shared/ui/CornerOrnament/CornerOrnament';
import s from './IkarosCard.module.css';

type Variant = 'welcome' | 'news';

const FRAME_PANEL: Record<Variant, string> = {
  welcome: 'card',
  news: 'novinky',
};

const VARIANT_CLASS: Record<Variant, string> = {
  welcome: s.welcome,
  news: s.news,
};

export interface IkarosCardProps {
  variant: Variant;
  header?: ReactNode;
  medallion?: ReactNode;
  className?: string;
  children: ReactNode;
}

/**
 * Glass-styled fantasy/sci-fi karta s 4 SVG corner ornamenty.
 * Vizuál je řízen per-tématem přes `data-frame-panel` v decorations.css
 * (viz themes/themes/modre-nebe/decorations.css). Komponenta vždy renderuje
 * 4× CornerOrnament — pokud aktivní téma ornamenty nepoužívá, jsou neviditelné.
 */
export function IkarosCard({
  variant,
  header,
  medallion,
  className,
  children,
}: IkarosCardProps) {
  return (
    <article
      className={clsx(s.card, VARIANT_CLASS[variant], className)}
      data-frame-panel={FRAME_PANEL[variant]}
    >
      <CornerOrnament position="tl" />
      <CornerOrnament position="tr" />
      <CornerOrnament position="bl" />
      <CornerOrnament position="br" />
      {header && <header className={s.header}>{header}</header>}
      <div className={s.body}>
        {medallion && <div className={s.medallionSlot}>{medallion}</div>}
        <div className={s.content}>{children}</div>
      </div>
    </article>
  );
}
