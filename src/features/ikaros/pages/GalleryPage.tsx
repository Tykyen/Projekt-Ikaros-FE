import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { Plus, Search, ArrowUpDown } from 'lucide-react';
import { isAuthenticatedAtom } from '@/shared/store/authStore';
import { useDebouncedValue } from '@/shared/lib/useDebouncedValue';
import { Spinner, EmptyState, ErrorState } from '@/shared/ui';
import { Seo } from '@/shared/seo';
import {
  useGalleryImages,
  useMyGalleryImages,
  useGalleryStats,
} from '../api/useGallery';
import { useGalleryCategories } from '../api/useGalleryCategories';
import { GalleryGrid } from '../components/GalleryGrid';
import { Lightbox } from '../components/Lightbox';
import { categoryStyle, filterImages, type SortKey } from '../lib/gallery';
import type { GalleryStats } from '@/shared/types';
import s from './GalleryPage.module.css';

type Tab = 'prehled' | 'moje';

export default function GalleryPage() {
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') ?? 'prehled') as Tab;
  const isAuth = useAtomValue(isAuthenticatedAtom);

  const setTab = (next: Tab) => {
    if (next === 'prehled') params.delete('tab');
    else params.set('tab', next);
    setParams(params, { replace: true });
  };

  return (
    <div className={s.page}>
      <Seo
        title="Galerie"
        description="Obrazový salon komunity Ikaros — ilustrace, mapy a artwork od hráčů. Prohlížej veřejnou galerii nebo nahraj vlastní díla."
      />
      <header className={s.header}>
        <div className={s.headerLeft}>
          <h1 className={s.title}>Galerie</h1>
          <p className={s.subtitle}>Obrazový salon komunity</p>
        </div>
        {isAuth && (
          <Link to="/ikaros/galerie/nahrat" className={s.newBtn}>
            <Plus size={16} /> Nahrát obrázek
          </Link>
        )}
      </header>

      <div className={s.tabs} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'prehled'}
          onClick={() => setTab('prehled')}
          className={tab === 'prehled' ? s.tabActive : s.tab}
        >
          Přehled
        </button>
        {isAuth && (
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'moje'}
            onClick={() => setTab('moje')}
            className={tab === 'moje' ? s.tabActive : s.tab}
          >
            Moje obrázky
          </button>
        )}
      </div>

      {tab === 'prehled' && <PrehledTab />}
      {tab === 'moje' && isAuth && <MojeTab />}
    </div>
  );
}

// ─── Přehled tab ─────────────────────────────────────────────────────────

function PrehledTab() {
  const { data: images = [], isLoading, isError, refetch } = useGalleryImages();
  const { data: categories = [] } = useGalleryCategories();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 250);
  const [sort, setSort] = useState<SortKey>('new');
  const [catFilter, setCatFilter] = useState<Set<string>>(new Set());
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const toggleCat = (key: string) => {
    setCatFilter((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const filtered = useMemo(
    () => filterImages(images, debouncedQuery, catFilter, sort),
    [images, debouncedQuery, catFilter, sort],
  );

  if (isLoading) return <Spinner center />;
  // FE-failure (styl 37) — chyba PŘED prázdným stavem: `images = []` platí i při
  // 500 → bez téhle větve vypadá výpadek jako prázdná galerie.
  if (isError)
    return (
      <ErrorState
        size="hero"
        title="Galerii se nepodařilo načíst"
        description="Obrázky tu jsou, jen je teď nedokážeme zobrazit. Zkus to prosím znovu."
        onRetry={() => void refetch()}
      />
    );

  return (
    <>
      <div className={s.toolbar}>
        <label className={s.searchWrap}>
          <Search size={14} className={s.searchIcon} aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Hledat…"
            className={s.searchInput}
            aria-label="Hledat obrázek"
          />
        </label>
        <label className={s.sortWrap}>
          <ArrowUpDown size={14} aria-hidden />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className={s.sortSelect}
            aria-label="Řazení"
          >
            <option value="new">Nejnovější</option>
            <option value="top">Nejlépe hodnocené</option>
            <option value="most-rated">Nejvíc hodnocených</option>
          </select>
        </label>
      </div>

      {categories.length > 0 && (
        <div className={s.catChips} role="group" aria-label="Filtr kategorií">
          {categories.map((cat) => {
            const active = catFilter.has(cat.key);
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => toggleCat(cat.key)}
                className={active ? s.chipActive : s.chip}
                style={categoryStyle(cat)}
                aria-pressed={active}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      )}

      {filtered.length === 0 ? (
        catFilter.size > 0 || debouncedQuery ? (
          <EmptyState
            size="panel"
            title="Nic neodpovídá filtru"
            description="Zkus jiné kategorie nebo hledaný výraz."
          />
        ) : (
          <EmptyState
            size="hero"
            illustration="gallery"
            title="Galerie zatím zeje prázdnotou"
            description="Až někdo nahraje první obrázek, objeví se přesně tady."
          />
        )
      ) : (
        <GalleryGrid
          images={filtered}
          categories={categories}
          onOpen={(img) =>
            setLightboxIndex(filtered.findIndex((i) => i.id === img.id))
          }
        />
      )}

      {lightboxIndex !== null && (
        <Lightbox
          images={filtered}
          index={lightboxIndex}
          categories={categories}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
        />
      )}
    </>
  );
}

// ─── Moje obrázky tab ────────────────────────────────────────────────────

function MojeTab() {
  const {
    data: images = [],
    isLoading,
    isError,
    refetch,
  } = useMyGalleryImages();
  const { data: stats } = useGalleryStats();
  const { data: categories = [] } = useGalleryCategories();

  if (isLoading) return <Spinner center />;
  // FE-failure (styl 37) — bez téhle větve tvrdil výpadek autorovi „Ještě jsi
  // nic nenahrál" a nabídl nahrát první obrázek. U vlastní tvorby to vypadá,
  // že se práce ztratila.
  if (isError)
    return (
      <ErrorState
        size="hero"
        title="Tvoje obrázky se nepodařilo načíst"
        description="Nic se neztratilo — jen je teď nedokážeme zobrazit. Zkus to prosím znovu."
        onRetry={() => void refetch()}
      />
    );

  return (
    <>
      {stats && <MyStatsWidget stats={stats} />}
      {images.length === 0 ? (
        <EmptyState
          size="hero"
          illustration="gallery"
          title="Ještě jsi nic nenahrál"
          description="Poděl se o svou tvorbu — nahraj první obrázek do galerie."
          action={{ label: 'Nahrát obrázek', to: '/ikaros/galerie/nahrat' }}
        />
      ) : (
        <GalleryGrid images={images} categories={categories} isMine />
      )}
    </>
  );
}

// ─── Mini stats widget ───────────────────────────────────────────────────

function MyStatsWidget({ stats }: { stats: GalleryStats }) {
  const items: Array<{
    label: string;
    value: number | string;
    color?: string;
  }> = [
    {
      label: 'Celkem',
      value: stats.draft + stats.pending + stats.published + stats.rejected,
    },
    {
      label: 'Publikováno',
      value: stats.published,
      color: 'var(--status-published)',
    },
    { label: 'Konceptů', value: stats.draft, color: 'var(--status-draft)' },
    { label: 'Pending', value: stats.pending, color: 'var(--status-pending)' },
    {
      label: 'Zamítnutých',
      value: stats.rejected,
      color: 'var(--status-rejected)',
    },
    { label: 'Průměr ★', value: stats.averageRating || '—' },
  ];
  return (
    <div className={s.stats}>
      {items.map((item) => (
        <div key={item.label} className={s.statItem}>
          <span
            className={s.statValue}
            style={item.color ? { color: item.color } : undefined}
          >
            {item.value}
          </span>
          <span className={s.statLabel}>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
