import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { Plus, Search, ArrowUpDown } from 'lucide-react';
import { isAuthenticatedAtom, currentUserAtom } from '@/shared/store/authStore';
import { useDebouncedValue } from '@/shared/lib/useDebouncedValue';
import { Spinner } from '@/shared/ui';
import {
  useArticles,
  useMyArticles,
  useArticleStats,
  useArticleReadStatus,
  useToggleFavoriteArticle,
} from '../api/useArticles';
import { useArticleCategories } from '../api/useArticleCategories';
import { FavoriteToggle } from '../components/FavoriteToggle';
import {
  articleNumber,
  categoryByKey,
  categoryStyle,
  filterArticles,
  readingTime,
  statusLabel,
  statusColor,
  stripHtml,
  type SortKey,
} from '../lib/articles';
import type {
  ArticleCategory,
  IkarosArticle,
  ArticleStats,
} from '@/shared/types';
import s from './ArticlesPage.module.css';

type Tab = 'prehled' | 'moje';

export default function ArticlesPage() {
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
      <header className={s.header}>
        <div className={s.headerLeft}>
          <h1 className={s.title}>Články</h1>
          <p className={s.subtitle}>Literární archiv komunity</p>
        </div>
        {isAuth && (
          <Link to="/ikaros/clanky/novy" className={s.newBtn}>
            <Plus size={16} /> Nový článek
          </Link>
        )}
      </header>

      <nav className={s.tabs} role="tablist">
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
            Moje
          </button>
        )}
      </nav>

      {tab === 'prehled' && <PrehledTab />}
      {tab === 'moje' && isAuth && <MojeTab />}
    </div>
  );
}

// ─── Přehled tab ─────────────────────────────────────────────────────────

function PrehledTab() {
  const { data: articles = [], isLoading } = useArticles();
  const { data: categories = [] } = useArticleCategories();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 250);
  const [sort, setSort] = useState<SortKey>('new');
  const [catFilter, setCatFilter] = useState<Set<string>>(new Set());

  const toggleCat = (key: string) => {
    setCatFilter((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const filtered = useMemo(
    () => filterArticles(articles, debouncedQuery, catFilter, sort),
    [articles, debouncedQuery, catFilter, sort],
  );

  if (isLoading) return <Spinner center />;

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
            aria-label="Hledat článek"
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
                <span className={s.waxSeal} />
                {cat.label}
              </button>
            );
          })}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className={s.empty}>
          <p>
            {catFilter.size > 0 || debouncedQuery
              ? 'Žádné články neodpovídají filtru.'
              : 'Žádné publikované články.'}
          </p>
        </div>
      ) : (
        <div className={s.grid}>
          {filtered.map((a) => (
            <ArticleCard key={a.id} article={a} categories={categories} />
          ))}
        </div>
      )}
    </>
  );
}

// ─── Moje tab ────────────────────────────────────────────────────────────

function MojeTab() {
  const { data: articles = [], isLoading } = useMyArticles();
  const { data: stats } = useArticleStats();
  const { data: categories = [] } = useArticleCategories();

  if (isLoading) return <Spinner center />;

  return (
    <>
      {stats && <MyStatsWidget stats={stats} />}
      {articles.length === 0 ? (
        <div className={s.empty}>
          <p>Zatím jsi nenapsal žádný článek.</p>
          <Link to="/ikaros/clanky/novy" className={s.newBtn}>
            <Plus size={16} /> Napsat první článek
          </Link>
        </div>
      ) : (
        <div className={s.grid}>
          {articles.map((a) => (
            <ArticleCard
              key={a.id}
              article={a}
              categories={categories}
              isMine
            />
          ))}
        </div>
      )}
    </>
  );
}

// ─── Mini stats widget (v tabu Moje) ─────────────────────────────────────

function MyStatsWidget({ stats }: { stats: ArticleStats }) {
  const items: Array<{ label: string; value: number | string; color?: string }> = [
    {
      label: 'Celkem',
      value: stats.draft + stats.pending + stats.published + stats.rejected,
    },
    { label: 'Publikováno', value: stats.published, color: 'var(--status-published)' },
    { label: 'Konceptů', value: stats.draft, color: 'var(--status-draft)' },
    { label: 'Pending', value: stats.pending, color: 'var(--status-pending)' },
    { label: 'Zamítnutých', value: stats.rejected, color: 'var(--status-rejected)' },
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

// ─── Karta článku ────────────────────────────────────────────────────────

interface ArticleCardProps {
  article: IkarosArticle;
  categories: ArticleCategory[];
  isMine?: boolean;
}

function ArticleCard({ article, categories, isMine }: ArticleCardProps) {
  const cat = categoryByKey(categories, article.category);
  const isAuth = useAtomValue(isAuthenticatedAtom);
  const user = useAtomValue(currentUserAtom);
  const toggleFav = useToggleFavoriteArticle();
  const { data: readStatus } = useArticleReadStatus(article.id, {
    enabled: isAuth && !isMine && article.status === 'Published',
  });
  const isUnread = readStatus?.read === false && article.status === 'Published';

  const showFav = !!user && article.status === 'Published';
  const isFavorite =
    !!user && (user.favoriteArticleIds ?? []).includes(article.id);

  const linkTo =
    isMine && (article.status === 'Draft' || article.status === 'Rejected')
      ? `/ikaros/clanky/${article.id}/upravit`
      : `/ikaros/clanky/${article.id}`;

  return (
    <Link to={linkTo} className={s.card} style={categoryStyle(cat)}>
      <div className={s.cardHeader}>
        <span className={s.number}>N° {articleNumber(article.id)}</span>
        <div className={s.cardHeaderRight}>
          {article.status === 'Published' ? (
            <RatingInline
              avg={article.averageRating}
              count={article.ratings.length}
            />
          ) : (
            <span
              className={s.status}
              style={{ color: statusColor(article.status) }}
            >
              {statusLabel(article.status)}
            </span>
          )}
          {showFav && (
            <FavoriteToggle
              variant="icon"
              isFavorite={isFavorite}
              pending={toggleFav.isPending}
              onToggle={() => toggleFav.mutate(article.id)}
            />
          )}
        </div>
      </div>
      <h3 className={s.cardTitle}>{article.title}</h3>
      <p className={s.preview}>{stripHtml(article.content, 200)}…</p>
      <div className={s.meta}>
        <span className={s.catLabel}>
          <span className={s.waxSeal} />
          {cat.label}
        </span>
        <span className={s.metaSep}>·</span>
        <span className={s.authorName}>{article.authorName}</span>
        <span className={s.metaSep}>·</span>
        <span>{readingTime(article.content)} min čtení</span>
        {isUnread && <span className={s.unread}>● Nepřečteno</span>}
      </div>
      {isMine && article.status === 'Rejected' && article.rejectReason && (
        <div className={s.rejectInline}>
          <strong>Důvod vrácení:</strong> {article.rejectReason}
        </div>
      )}
    </Link>
  );
}

function RatingInline({ avg, count }: { avg: number; count: number }) {
  if (count === 0) return <span className={s.ratingEmpty}>Bez hodnocení</span>;
  return (
    <span
      className={s.rating}
      aria-label={`Průměr ${avg} z 5, ${count} hodnocení`}
    >
      <span className={s.stars}>
        {[1, 2, 3, 4, 5].map((n) => (
          <span
            key={n}
            className={n <= Math.round(avg) ? s.starFull : s.starEmpty}
            aria-hidden
          >
            ★
          </span>
        ))}
      </span>
      <span className={s.ratingNum}>{avg.toFixed(1)}</span>
      <span className={s.ratingCount}>({count})</span>
    </span>
  );
}

