import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FilePlus2, Star, FileText } from 'lucide-react';
import { Spinner } from '@/shared/ui';
import { WorldRole } from '@/shared/types';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { usePagesDirectory } from '../api/usePagesDirectory';
import { useFavoritePage, isPageFavorite } from '../api/useFavoritePage';
import type { PageDirectoryEntry } from '../api/pages.types';
import { PagesToolbar, type SortValue, type TypeFilter } from './components/PagesToolbar';
import { PageCard } from './components/PageCard';
import s from './PagesListPage.module.css';

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/**
 * 7.3 — Index wiki stránek světa. Member-facing přehled: hledání, filtr
 * dle typu, řazení, sekce oblíbených. PJ/PomocnyPJ má tlačítko „Nová
 * stránka".
 */
export default function PagesListPage() {
  const { world, worldId, worldSlug, userRole, loading } = useWorldContext();
  const { data: directory = [], isLoading } = usePagesDirectory(worldId);
  const favorite = useFavoritePage(worldId, worldSlug);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [sort, setSort] = useState<SortValue>('order');

  const favoriteSlugs = world?.favoritePageSlugs ?? [];
  const canCreate = (userRole ?? -1) >= WorldRole.PomocnyPJ;

  const favoriteEntries = useMemo(
    () => directory.filter((e) => favoriteSlugs.includes(e.slug)),
    [directory, favoriteSlugs],
  );

  const visibleEntries = useMemo(() => {
    const q = normalize(search.trim());
    let list = directory.filter((e) => {
      if (typeFilter !== 'all' && e.type !== typeFilter) return false;
      if (!q) return true;
      return (
        normalize(e.title).includes(q) || normalize(e.slug).includes(q)
      );
    });
    list = [...list].sort((a, b) => {
      if (sort === 'abc') return a.title.localeCompare(b.title, 'cs');
      if (sort === 'type') return a.type.localeCompare(b.type, 'cs');
      return a.order - b.order || a.title.localeCompare(b.title, 'cs');
    });
    return list;
  }, [directory, search, typeFilter, sort]);

  function toggleFavorite(entry: PageDirectoryEntry) {
    favorite.mutate({
      slug: entry.slug,
      nextState: !isPageFavorite(favoriteSlugs, entry.slug),
    });
  }

  if (loading) return <Spinner center />;

  return (
    <div className={s.page}>
      <header className={s.header}>
        <div>
          <h1 className={s.heading}>Stránky světa</h1>
          <p className={s.sub}>
            Encyklopedie světa — {directory.length}{' '}
            {directory.length === 1 ? 'stránka' : 'stránek'}
          </p>
        </div>
        {canCreate && (
          <Link
            to={`/svet/${worldSlug}/nova-stranka`}
            className={s.newBtn}
          >
            <FilePlus2 size={15} aria-hidden /> Nová stránka
          </Link>
        )}
      </header>

      <PagesToolbar
        search={search}
        onSearchChange={setSearch}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        sort={sort}
        onSortChange={setSort}
      />

      {isLoading ? (
        <Spinner center />
      ) : directory.length === 0 ? (
        <div className={s.empty}>
          <FileText size={40} aria-hidden />
          <p>Tento svět zatím nemá žádné stránky.</p>
          {canCreate && (
            <Link to={`/svet/${worldSlug}/nova-stranka`} className={s.newBtn}>
              <FilePlus2 size={15} aria-hidden /> Vytvořit první stránku
            </Link>
          )}
        </div>
      ) : (
        <>
          {favoriteEntries.length > 0 && (
            <section className={s.section}>
              <h2 className={s.sectionTitle}>
                <Star size={16} aria-hidden /> Oblíbené
              </h2>
              <div className={s.grid}>
                {favoriteEntries.map((entry) => (
                  <PageCard
                    key={entry.id}
                    entry={entry}
                    worldSlug={worldSlug}
                    isFavorite
                    onToggleFavorite={() => toggleFavorite(entry)}
                  />
                ))}
              </div>
            </section>
          )}

          <section className={s.section}>
            {favoriteEntries.length > 0 && (
              <h2 className={s.sectionTitle}>Všechny stránky</h2>
            )}
            {visibleEntries.length === 0 ? (
              <p className={s.noMatch}>
                Žádná stránka neodpovídá hledání ani filtru.
              </p>
            ) : (
              <div className={s.grid}>
                {visibleEntries.map((entry) => (
                  <PageCard
                    key={entry.id}
                    entry={entry}
                    worldSlug={worldSlug}
                    isFavorite={isPageFavorite(favoriteSlugs, entry.slug)}
                    onToggleFavorite={() => toggleFavorite(entry)}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
