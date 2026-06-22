import { Link } from 'react-router-dom';
import s from './Breadcrumbs.module.css';

export interface Crumb {
  label: string;
  /** Cílová cesta; poslední (aktuální) položka je bez odkazu. */
  href?: string;
}

/**
 * 15B.2 — vizuální drobečková navigace na veřejných detailech (svět/článek/galerie).
 * Pole `items` je zároveň datový tvar, který 15B.3 přemapuje na `BreadcrumbList`
 * JSON-LD (proto sdílený `Crumb` typ).
 *
 * Poslední položka = aktuální stránka: bez odkazu, `aria-current="page"`.
 */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Drobečková navigace" className={s.nav}>
      <ol className={s.list}>
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${c.label}-${i}`} className={s.item}>
              {c.href && !last ? (
                <Link to={c.href} className={s.link}>
                  {c.label}
                </Link>
              ) : (
                <span
                  className={s.current}
                  aria-current={last ? 'page' : undefined}
                >
                  {c.label}
                </span>
              )}
              {!last && (
                <span className={s.sep} aria-hidden="true">
                  ›
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
