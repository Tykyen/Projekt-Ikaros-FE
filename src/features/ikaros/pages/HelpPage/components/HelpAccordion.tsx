import type { CSSProperties, ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { ACCENT_VAR, type HelpAccent } from './accents';
import s from '../HelpPage.module.css';

type CommonProps = {
  /** Ikona vlevo (lucide). */
  icon?: ReactNode;
  /** Titulek sekce (uppercase, font-display). */
  title: ReactNode;
  /** Barevný akcent levého pruhu + ikony. */
  accent?: HelpAccent;
  /** Volitelný štítek vpravo od titulku (TagChip apod.). */
  tag?: ReactNode;
  /** Otevřená po načtení? `<details>` je uncontrolled — stav drží sám. */
  defaultOpen?: boolean;
  /** Kotva pro deep-link (`?sekce=`). */
  id?: string;
  children: ReactNode;
};

function accentStyle(accent: HelpAccent = 'accent'): CSSProperties {
  return { ['--acc' as string]: ACCENT_VAR[accent] } as CSSProperties;
}

/** Top-level rozevírací sekce nápovědy. */
export function HelpAccordion({
  icon,
  title,
  accent = 'accent',
  tag,
  defaultOpen,
  id,
  children,
}: CommonProps) {
  return (
    <details className={s.accordion} open={defaultOpen} id={id} style={accentStyle(accent)}>
      <summary className={s.accordionSummary}>
        {icon && <span className={s.accordionIcon}>{icon}</span>}
        <span className={s.accordionTitle}>{title}</span>
        {tag}
        <span className={s.accordionChevron} aria-hidden="true">
          <ChevronRight size={18} />
        </span>
      </summary>
      <div className={s.accordionBody}>{children}</div>
    </details>
  );
}

/** Vnořená pod-sekce (nástroj) uvnitř HelpAccordion. */
export function HelpSubAccordion({
  icon,
  title,
  accent = 'accent',
  tag,
  defaultOpen,
  id,
  children,
}: CommonProps) {
  return (
    <details className={s.accordionSub} open={defaultOpen} id={id} style={accentStyle(accent)}>
      <summary className={s.accordionSubSummary}>
        {icon && <span className={s.accordionIcon}>{icon}</span>}
        <span className={s.accordionSubTitle}>{title}</span>
        {tag}
        <span className={s.accordionChevron} aria-hidden="true">
          <ChevronRight size={16} />
        </span>
      </summary>
      <div className={s.accordionSubBody}>{children}</div>
    </details>
  );
}
