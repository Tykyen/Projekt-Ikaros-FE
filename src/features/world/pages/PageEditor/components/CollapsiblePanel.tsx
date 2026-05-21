import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import s from './CollapsiblePanel.module.css';

interface Props {
  title: string;
  /** Volitelné info v hlavičce (např. počet položek). */
  badge?: ReactNode;
  /** Default rozbalení (sticky komp jako Identity = true; sekce = false). */
  defaultOpen?: boolean;
  /** Volitelná ikona vlevo od title. */
  icon?: ReactNode;
  children: ReactNode;
}

/**
 * 7.2 — Reusable shell pro každý panel editoru. Collapse/expand, sticky header.
 * Konzistentní s WorldSettings accordionem (vizuálně).
 */
export function CollapsiblePanel({
  title,
  badge,
  defaultOpen = false,
  icon,
  children,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className={s.panel}>
      <button
        type="button"
        className={s.header}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {icon && <span className={s.icon}>{icon}</span>}
        <h2 className={s.title}>{title}</h2>
        {badge && <span className={s.badge}>{badge}</span>}
        <ChevronDown
          size={18}
          aria-hidden
          className={`${s.chevron} ${open ? s.chevronOpen : ''}`}
        />
      </button>
      {open && <div className={s.body}>{children}</div>}
    </section>
  );
}
