import { Link, NavLink } from 'react-router-dom';
import clsx from 'clsx';
import s from './ShowcaseBar.module.css';

/** Vitrínové sekce (spec 22.4 §2) — musí sedět s `showcaseOrMember` routami. */
const SECTIONS = [
  { label: 'Novinky', slug: 'novinky' },
  { label: 'Stránky', slug: 'stranky' },
  { label: 'Postavy', slug: 'postavy' },
  { label: 'Mapa vesmíru', slug: 'mapa' },
  { label: 'Atlas map', slug: 'mapy' },
  { label: 'Bestiář', slug: 'bestiar' },
  { label: 'Pravidla', slug: 'pravidla' },
] as const;

/**
 * 22.4 — navigační lišta veřejného nahlížení. Ukazuje se anonymovi/nečlenovi
 * místo plné member navigace, když má svět zapnuté `publicShowcase`. CTA vede
 * na index světa, kde `JoinCTA` řeší vstup (anonym → login modal).
 */
export function ShowcaseBar({ worldSlug }: { worldSlug: string }) {
  const base = `/svet/${worldSlug}`;
  return (
    <div className={s.bar}>
      <span className={s.tag}>Nahlížíš do světa</span>
      <nav className={s.links} aria-label="Veřejné sekce světa">
        {SECTIONS.map((section) => (
          <NavLink
            key={section.slug}
            to={`${base}/${section.slug}`}
            className={({ isActive }) =>
              clsx(s.link, isActive && s.linkActive)
            }
          >
            {section.label}
          </NavLink>
        ))}
      </nav>
      <Link to={base} className={s.cta}>
        Přidat se
      </Link>
    </div>
  );
}
