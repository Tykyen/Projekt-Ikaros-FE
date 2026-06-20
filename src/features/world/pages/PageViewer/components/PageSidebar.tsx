import { useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { useBrokenLinks } from '../hooks/useBrokenLinks';
import type { Page } from '../../api/pages.types';
import { getImageStyle } from '@/shared/lib/imageStyle';
import s from './PageSidebar.module.css';

interface Props {
  page: Page;
}

/**
 * 7.1b — Boční panel typů Lokace/Ostatní (a podobných):
 *  • Hero obrázek (pokud `imageUrl` a NE `bigImage` — bigImage = full-width nahoře)
 *  • Datová tabulka (pokud `table.hasTable`)
 *
 * Desktop: pevná šířka 320px, sticky pod headerem.
 * Mobile (≤1024px): collapsible — default sbalený, toggle „Profil ⌃".
 */
export function PageSidebar({ page }: Props) {
  const hasImage = !!page.imageUrl && !page.bigImage;
  const hasTable =
    page.table?.hasTable === true &&
    (page.table.headers?.length ?? 0) > 0;
  const [open, setOpen] = useState(false);

  if (!hasImage && !hasTable) return null;

  return (
    <aside className={s.sidebar} aria-label="Profil stránky">
      <button
        type="button"
        className={s.mobileToggle}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="page-sidebar-content"
      >
        <span>Profil</span>
        <ChevronDown
          size={16}
          aria-hidden
          className={open ? s.chevronOpen : ''}
        />
      </button>
      <div
        id="page-sidebar-content"
        className={`${s.content} ${open ? s.contentOpen : ''}`}
      >
        {hasImage && page.imageUrl && (
          <div className={s.heroWrap}>
            <img
              src={page.imageUrl}
              alt={page.title}
              className={s.hero}
              loading="lazy"
              style={getImageStyle(
                page.imageFocalX,
                page.imageFocalY,
                page.imageZoom,
                page.imageFit,
              )}
            />
          </div>
        )}
        {hasTable && page.table && <PageDataTable table={page.table} />}
      </div>
    </aside>
  );
}

/**
 * 8.5 — Datová tabulka. Buňky (klíče i hodnoty) jsou rich-text HTML s
 * inline odkazy (sanitizováno na BE). `useBrokenLinks` po renderu označí
 * odkazy na neexistující stránky (`.brokenLink` → červené přeškrtnutí).
 *
 * Export: tisk (OstatniLayout printMode) staví tabulku nad text (jiné pořadí
 * než sidebar) — reuse stejné komponenty, ne kopie.
 */
export function PageDataTable({ table }: { table: NonNullable<Page['table']> }) {
  const { worldId, worldSlug } = useWorldContext();
  // Ref na celý wrap (ne jen table) — broken-link hook musí scannit i odkazy
  // v title (h3), který stojí mimo <table>.
  const wrapRef = useRef<HTMLDivElement>(null);
  const headers = table.headers ?? [];
  const values = table.values ?? [];
  const rowCount = Math.max(headers.length, values.length);

  useBrokenLinks(wrapRef, worldId, worldSlug, table);

  if (rowCount === 0) return null;

  return (
    <div className={s.tableWrap} ref={wrapRef}>
      {table.title && (
        <h3
          className={s.tableTitle}
          dangerouslySetInnerHTML={{ __html: table.title }}
        />
      )}
      <table className={s.table}>
        <tbody>
          {Array.from({ length: rowCount }).map((_, i) => (
            <tr key={i}>
              <th
                scope="row"
                className={s.cell}
                dangerouslySetInnerHTML={{ __html: headers[i] ?? '' }}
              />
              <td
                className={s.cell}
                dangerouslySetInnerHTML={{ __html: values[i] || '—' }}
              />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
