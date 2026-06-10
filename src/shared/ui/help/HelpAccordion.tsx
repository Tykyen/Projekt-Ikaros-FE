import { useState, type CSSProperties, type ReactNode, type SyntheticEvent } from 'react';
import { ChevronRight } from 'lucide-react';
import { ACCENT_VAR, type HelpAccent } from './accents';
import s from './Help.module.css';

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
  /**
   * Když je nastaven, stav otevřeno/zavřeno přežije refresh — ukládá se do
   * `localStorage` pod tímto klíčem (opt-in, accordion se stane controlled).
   * Bez něj zůstává `<details>` uncontrolled a řídí se jen `defaultOpen`
   * (nutné pro deep-link `?sekce=` na stránce Nápovědy).
   */
  persistKey?: string;
  /** Kotva pro deep-link (`?sekce=`). */
  id?: string;
  children: ReactNode;
};

function accentStyle(accent: HelpAccent = 'accent'): CSSProperties {
  return { ['--acc' as string]: ACCENT_VAR[accent] } as CSSProperties;
}

/** Přečte uložený stav otevřeno/zavřeno; fallback na `defaultOpen`. */
function readPersistedOpen(key: string | undefined, fallback: boolean): boolean {
  if (!key) return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw === '1') return true;
    if (raw === '0') return false;
  } catch {
    /* ignore */
  }
  return fallback;
}

/** Top-level rozevírací sekce nápovědy. */
export function HelpAccordion({
  icon,
  title,
  accent = 'accent',
  tag,
  defaultOpen,
  persistKey,
  id,
  children,
}: CommonProps) {
  const [open, setOpen] = useState(() => readPersistedOpen(persistKey, !!defaultOpen));

  function handleToggle(e: SyntheticEvent<HTMLDetailsElement>) {
    const next = e.currentTarget.open;
    setOpen(next);
    try {
      if (persistKey) localStorage.setItem(persistKey, next ? '1' : '0');
    } catch {
      /* ignore */
    }
  }

  // S persistKey řídí stav React (a ukládá ho); bez něj zůstává původní
  // uncontrolled chování kvůli deep-linku `?sekce=` na stránce Nápovědy.
  const detailsProps = persistKey ? { open, onToggle: handleToggle } : { open: defaultOpen };

  return (
    <details className={s.accordion} {...detailsProps} id={id} style={accentStyle(accent)}>
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
