import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FilePlus2, Star } from 'lucide-react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { Spinner, EmptyState } from '@/shared/ui';
import { WorldRole } from '@/shared/types';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { usePagesDirectory } from '../api/usePagesDirectory';
import { useFavoritePages } from '../api/useFavoritePages';
import type { PageDirectoryEntry } from '../api/pages.types';
import { PagesToolbar, type SortValue, type TypeFilter } from './components/PagesToolbar';
import { PageCard } from './components/PageCard';
import { SortablePageCard } from './components/SortablePageCard';
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
  const { worldId, worldSlug, userRole, loading } = useWorldContext();
  const { data: directory = [], isLoading } = usePagesDirectory(worldId);
  const favorites = useFavoritePages(worldId);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [sort, setSort] = useState<SortValue>('order');

  const canCreate = (userRole ?? -1) >= WorldRole.PomocnyPJ;

  // Osobní oblíbené v uživatelově pořadí (read-only; reorder je na dashboardu).
  const favoriteEntries = useMemo(() => {
    const bySlug = new Map(directory.map((e) => [e.slug, e]));
    return favorites.order
      .map((slug) => bySlug.get(slug))
      .filter((e): e is PageDirectoryEntry => !!e);
  }, [directory, favorites.order]);

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

  // Touch má long-press (chrání scroll), myš jen distance (vzor ChannelSidebar).
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function toggleFavorite(entry: PageDirectoryEntry) {
    favorites.toggle(entry.slug);
  }

  function handleFavReorder(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = favorites.order.indexOf(String(active.id));
    const newIndex = favorites.order.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    favorites.reorder(arrayMove(favorites.order, oldIndex, newIndex));
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
        <EmptyState
          size="hero"
          illustration="pages"
          title="Tenhle svět je zatím nepopsaný list"
          description="Vytvoř první stránku — lokaci, postavu, frakci nebo cokoli, z čeho se tvůj svět skládá."
          action={
            canCreate
              ? { label: 'Vytvořit stránku', to: `/svet/${worldSlug}/nova-stranka` }
              : undefined
          }
        />
      ) : (
        <>
          {favoriteEntries.length > 0 && (
            <section className={s.section}>
              <h2 className={s.sectionTitle}>
                <Star size={16} aria-hidden /> Oblíbené
              </h2>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleFavReorder}
              >
                <SortableContext
                  items={favoriteEntries.map((e) => e.slug)}
                  strategy={rectSortingStrategy}
                >
                  <div className={s.grid}>
                    {favoriteEntries.map((entry) => (
                      <SortablePageCard
                        key={entry.id}
                        entry={entry}
                        worldSlug={worldSlug}
                        onToggleFavorite={() => toggleFavorite(entry)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
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
                    isFavorite={favorites.isFavorite(entry.slug)}
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
