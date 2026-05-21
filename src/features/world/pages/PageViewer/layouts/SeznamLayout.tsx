import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { RichTextEditor } from '@/shared/ui/RichTextEditor';
import { AkjBanner } from '../components/AkjBanner';
import { PageSidebar } from '../components/PageSidebar';
import { PageSections } from '../components/PageSections';
import type { Page } from '../../api/pages.types';
import s from './SeznamLayout.module.css';

interface Props {
  page: Page;
}

/**
 * 7.1b — Layout pro typ Seznam. 3-sloupcový grid:
 *   ┌────────┬──────────────┬────────┐
 *   │ MENU   │   CONTENT    │  TABLE │
 *   │ (page  │              │        │
 *   │  menu) │              │        │
 *   └────────┴──────────────┴────────┘
 *      2fr        5fr         2.5fr   (desktop)
 *
 * `page.menu[]` = levý nav s odkazy (label/href). Aktivní položka = ta,
 * jejíž `href` matchne `?item=<href>` query param (či první v pořadí).
 *
 * Variantu „item per page se samostatným obrázkem" jsme zamítli v specu §10.5
 * (vyžadovala by BE migraci `menu` schematu). Tady = jednoduchý nav.
 */
export function SeznamLayout({ page }: Props) {
  const { worldSlug } = useWorldContext();
  const [searchParams] = useSearchParams();
  const activeHref = searchParams.get('item');

  const sortedMenu = useMemo(
    () => [...page.menu].sort((a, b) => a.order - b.order),
    [page.menu],
  );

  return (
    <div className={s.layout}>
      <nav className={s.menu} aria-label="Položky seznamu">
        <h2 className={s.menuTitle}>{page.title}</h2>
        {sortedMenu.length === 0 ? (
          <p className={s.menuEmpty}>Seznam je zatím prázdný.</p>
        ) : (
          <ul className={s.menuList}>
            {sortedMenu.map((it) => {
              const isExternal = /^https?:\/\//i.test(it.href);
              const isActive = it.href === activeHref;
              const cls = `${s.menuItem} ${isActive ? s.menuItemActive : ''}`;
              if (isExternal) {
                return (
                  <li key={it.href}>
                    <a
                      href={it.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cls}
                    >
                      {it.label}
                    </a>
                  </li>
                );
              }
              const internalSlug = it.href.startsWith('/')
                ? it.href
                : `/svet/${worldSlug}/${it.href}`;
              return (
                <li key={it.href}>
                  <Link to={internalSlug} className={cls}>
                    {it.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </nav>

      <main className={s.main}>
        <AkjBanner accessRequirements={page.accessRequirements} />
        <div className={s.proseWrap} data-article-content>
          <RichTextEditor value={page.content} readOnly className={s.prose} />
        </div>
        <PageSections sections={page.sections} />
      </main>

      <aside className={s.aside}>
        <PageSidebar page={page} />
      </aside>
    </div>
  );
}
