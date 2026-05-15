# Implementační plán 3.2c — Stránky articles

**Status:** Návrh — čeká na potvrzení PJ
**Spec:** [spec-3.2.md §9](./spec-3.2.md)
**Větev:** `feat/krok-3.2c-articles-pages`
**Odhad:** ~1500 ř. FE + ~800 ř. FE testů
**Repo:** `Projekt-ikaros-FE`

⚠️ **Závisí na:** merged 3.2a (BE endpointy) + 3.2b (RichTextEditor exportován).

---

## Postup vysoké úrovně

| # | Fáze | Cíl |
|---|---|---|
| A | Types + API hooks | Sdílené typy + 10+ react-query hooks |
| B | Routes + page skeletons | 4 routes, prázdné komponenty |
| C | Helpers — kategorie, glyphs, formatters | `lib/articles.ts` |
| D | `ArticlesListPage` | Taby, search, sort, filter, karty |
| E | `ArticleDetailPage` | Reading experience, drop cap, autor card |
| F | `ArticleEditorPage` | Title + RTE + category picker + sticky bar |
| G | `RejectReasonModal` + admin actions wire-up | Reject flow s povinným reasonem |
| H | Pravý panel link | „Správa článků" |
| I | Mobile + skill `mobil-desktop` | ≤ 768 px audit |
| J | Testy | +34 cases |
| K | Lint + build + commit + PR |

⚠️ **PJ checkpoint po každé fázi A–J.**

---

## Fáze A — Types + API hooks

### A1. Typy v `src/shared/types/index.ts`

Rozšířit existující sekci article-related:

```ts
export type ArticleStatus = 'Draft' | 'Pending' | 'Published' | 'Rejected';

export interface ArticleRating {
  userId: string;
  stars: number;
}

export interface IkarosArticle {
  id: string;
  title: string;
  content: string;        // HTML z TipTap
  category: string;       // slug, ref na article_categories.key
  authorId: string;
  authorName: string;
  status: ArticleStatus;
  rejectReason?: string;
  ratings: ArticleRating[];
  averageRating: number;
  createdAtUtc: string;
  updatedAtUtc: string;
  publishedAtUtc?: string;
}

export interface ArticleCategory {
  key: string;
  label: string;
  color: string;
  order: number;
}

export interface ArticleStats {
  draft: number;
  pending: number;
  published: number;
  rejected: number;
  totalRatings: number;
  averageRating: number;
}

export interface ArticleReviewListItem {
  articleId: string;
  title: string;
  preview: string;
  category: string;
  authorId: string;
  authorName: string;
  submittedAt: string;
}
```

### A2. API hooks — `src/features/ikaros/api/useArticles.ts`

```ts
const PREFIX = '/ikaros-articles';

// READ
export function useArticles() {
  return useQuery({
    queryKey: ['articles', 'all'],
    queryFn: () => api.get<IkarosArticle[]>(PREFIX),
    staleTime: 30_000,
  });
}

export function useMyArticles(enabled = true) {
  return useQuery({
    queryKey: ['articles', 'my'],
    queryFn: () => api.get<IkarosArticle[]>(`${PREFIX}/my`),
    enabled,
  });
}

export function useArticle(id: string | undefined) {
  return useQuery({
    queryKey: ['articles', 'detail', id],
    queryFn: () => api.get<IkarosArticle>(`${PREFIX}/${id}`),
    enabled: !!id,
  });
}

export function useArticleStats(enabled = true) {
  return useQuery({
    queryKey: ['articles', 'stats'],
    queryFn: () => api.get<ArticleStats>(`${PREFIX}/stats`),
    enabled,
  });
}

// CREATE / UPDATE / DELETE
export function useCreateArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: { title: string; content: string; category?: string; submit?: boolean }) =>
      api.post<IkarosArticle>(PREFIX, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['articles'] }),
  });
}

export function useUpdateArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<{ title: string; content: string; category: string }> }) =>
      api.put<IkarosArticle>(`${PREFIX}/${id}`, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['articles'] }),
  });
}

export function useDeleteArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`${PREFIX}/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['articles'] }),
  });
}

// WORKFLOW
export function useSubmitArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<IkarosArticle>(`${PREFIX}/${id}/submit`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['articles'] }),
  });
}

export function useApproveArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<IkarosArticle>(`${PREFIX}/${id}/approve`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['articles'] });
      qc.invalidateQueries({ queryKey: ['pending-actions'] });
    },
  });
}

export function useRejectArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.post<IkarosArticle>(`${PREFIX}/${id}/reject`, { reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['articles'] });
      qc.invalidateQueries({ queryKey: ['pending-actions'] });
    },
  });
}

export function useRateArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, stars }: { id: string; stars: number }) =>
      api.post<{ averageRating: number; totalRatings: number }>(`${PREFIX}/${id}/rate`, { stars }),
    onSuccess: (_, { id }) => qc.invalidateQueries({ queryKey: ['articles', 'detail', id] }),
  });
}
```

### A3. Kategorie hook — `src/features/ikaros/api/useArticleCategories.ts`

```ts
export function useArticleCategories() {
  return useQuery({
    queryKey: ['article-categories'],
    queryFn: () => api.get<ArticleCategory[]>('/article-categories'),
    staleTime: 5 * 60_000, // 5 min, rare changes
  });
}
```

### A4. Commit

```
feat(articles): A. types + api hooks (useArticles*, useArticleCategories)
```

---

## Fáze B — Routes + page skeletons

### B1. `src/app/router.tsx` — přidat routes

```tsx
{ path: 'ikaros/clanky', element: p(ArticlesListPage) },
{ path: 'ikaros/clanky/novy', loader: requireAuth, element: p(ArticleEditorPage) },
{ path: 'ikaros/clanky/:id', element: p(ArticleDetailPage) },
{ path: 'ikaros/clanky/:id/upravit', loader: requireAuth, element: p(ArticleEditorPage) },
```

### B2. Skeleton komponenty

**Nové soubory:**
- `src/features/ikaros/pages/ArticlesListPage/ArticlesListPage.tsx`
- `src/features/ikaros/pages/ArticleDetailPage/ArticleDetailPage.tsx`
- `src/features/ikaros/pages/ArticleEditorPage/ArticleEditorPage.tsx`

Každý s placeholder `<div>` + module.css. Lazy-load přes `React.lazy()`.

### B3. Commit

```
feat(articles): B. routes + page skeletons
```

---

## Fáze C — Helpers

### C1. `src/features/ikaros/lib/articles.ts`

```ts
import type { ArticleCategory, IkarosArticle } from '@/shared/types';

/** Min čtení — 200 slov / min. HTML stripped. */
export function readingTime(html: string): number {
  const plain = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const words = plain.split(' ').filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

/** Deterministický glyph divider per article. */
const GLYPHS = ['✦', '❦', '❧', '☙'];
export function glyphFor(articleId: string): string {
  const code = articleId.charCodeAt(0) || 0;
  return GLYPHS[code % GLYPHS.length];
}

/** N° formátování — posledních 4 znaků ID, pad nula vlevo. */
export function articleNumber(articleId: string): string {
  const tail = articleId.slice(-4);
  return tail.toUpperCase();
}

/** CSS custom property pro --cat-current barvu */
export function categoryStyle(category: ArticleCategory | undefined): React.CSSProperties {
  if (!category) return {};
  return { ['--cat-current' as string]: category.color };
}

/** Vrátí kategorii podle key, fallback Ostatni. */
export function categoryByKey(categories: ArticleCategory[], key: string): ArticleCategory | undefined {
  return categories.find(c => c.key === key) ?? categories.find(c => c.key === 'ostatni');
}

/** Locale CS date. */
export function formatDateCs(iso: string): string {
  return new Date(iso).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Strip HTML pro plain preview. */
export function stripHtml(html: string, maxLen = 200): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maxLen);
}

/** Status label CZ. */
export function statusLabel(status: IkarosArticle['status']): string {
  return ({
    Draft: 'Koncept',
    Pending: 'Čeká na schválení',
    Published: 'Publikováno',
    Rejected: 'Zamítnuto',
  } as const)[status];
}
```

### C2. Commit

```
feat(articles): C. helpers (reading time, glyph, formatters)
```

---

## Fáze D — `ArticlesListPage`

### D1. Komponentní struktura

```
ArticlesListPage/
├── ArticlesListPage.tsx          # orchestrátor, ?tab routing
├── ArticlesListPage.module.css
├── ListHeader.tsx                 # title + taby
├── ListToolbar.tsx                # search + sort + filter chips
├── ArticleCard.tsx                # karta v grid
├── MyStatsWidget.tsx              # mini stats v tabu Moje
└── index.ts
```

### D2. `ArticlesListPage.tsx`

```tsx
export default function ArticlesListPage() {
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') ?? 'prehled') as 'prehled' | 'moje';
  const user = useCurrentUser();
  const isAuth = !!user;

  return (
    <div className={s.page}>
      <ListHeader tab={tab} setTab={(t) => { params.set('tab', t); setParams(params); }} isAuth={isAuth} />
      {tab === 'prehled' && <PrehledTab />}
      {tab === 'moje' && isAuth && <MojeTab />}
    </div>
  );
}
```

### D3. `PrehledTab`

- Load: `useArticles()` + `useArticleCategories()`
- Search: `useDebouncedValue(query, 250)` filter na `title + stripHtml(content)`
- Sort: `useState<'new'|'top'|'most-rated'>('new')`
- Kategorie filter: `useState<Set<string>>(new Set())` — multi-select OR
- Filter chain: published only → search match → category match → sort

```tsx
function PrehledTab() {
  const { data: articles = [] } = useArticles();
  const { data: categories = [] } = useArticleCategories();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 250);
  const [sort, setSort] = useState<SortKey>('new');
  const [catFilter, setCatFilter] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => filterArticles(articles, debouncedQuery, catFilter, sort), [articles, debouncedQuery, catFilter, sort]);

  return (
    <>
      <ListToolbar
        query={query} onQueryChange={setQuery}
        sort={sort} onSortChange={setSort}
        categories={categories} catFilter={catFilter} onCatToggle={(k) => toggleSet(catFilter, k, setCatFilter)}
      />
      <div className={s.grid}>
        {filtered.length === 0
          ? <EmptyState message={catFilter.size ? 'Žádné články v této kategorii.' : 'Žádné publikované články.'} />
          : filtered.map(a => <ArticleCard key={a.id} article={a} categories={categories} />)}
      </div>
    </>
  );
}
```

### D4. `ArticleCard`

```tsx
function ArticleCard({ article, categories }: Props) {
  const cat = categoryByKey(categories, article.category);
  const { data: readStatus } = useArticleReadStatus(article.id, { enabled: !!useCurrentUser() });
  return (
    <Link to={`/ikaros/clanky/${article.id}`} className={s.card} style={categoryStyle(cat)}>
      <div className={s.cardHeader}>
        <span className={s.number}>N° {articleNumber(article.id)}</span>
        <RatingInline avg={article.averageRating} count={article.ratings.length} />
      </div>
      <h3 className={s.title}>{article.title}</h3>
      <p className={s.preview}>{stripHtml(article.content, 200)}…</p>
      <div className={s.meta}>
        <CategoryChip category={cat} />
        <span className={s.author}>{article.authorName}</span>
        <span className={s.time}>{readingTime(article.content)} min čtení</span>
        {readStatus?.read === false && <span className={s.unread}>● Nepřečteno</span>}
      </div>
    </Link>
  );
}
```

### D5. `MojeTab`

- Load: `useMyArticles()` + `useArticleStats()`
- Stats widget nahoře
- Tabulka/grid karet (přepínač view-mode? KISS: jen grid jako Přehled)
- Klik na Draft/Rejected → `/clanky/:id/upravit`, klik na Published/Pending → `/clanky/:id`

### D6. CSS — `.grid`

```css
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 20px;
  margin-top: 24px;
}

.card {
  display: block;
  padding: 20px 24px;
  background: var(--surface-base);
  border: 1px solid var(--frame-border);
  border-left: 3px solid var(--cat-current, var(--accent));
  text-decoration: none;
  color: inherit;
  transition: transform 0.15s, box-shadow 0.15s;
}

.card:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.15); }

.number {
  font-family: var(--prose-font-mono);
  font-size: 11px;
  letter-spacing: 0.1em;
  color: var(--text-subtle);
  text-transform: uppercase;
}

.title {
  font-family: var(--prose-font-display);
  font-size: 22px;
  font-weight: 600;
  margin: 8px 0 6px;
  color: var(--text-strong);
  line-height: 1.2;
}

.preview {
  font-family: var(--prose-font-body);
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-muted);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin: 0 0 12px;
}

.unread {
  color: var(--accent);
  font-weight: 600;
  font-size: 11px;
}

@media (max-width: 768px) {
  .grid { grid-template-columns: 1fr; }
  .card { padding: 16px; }
}
```

### D7. Commit

```
feat(articles): D. ArticlesListPage (tabs, search, sort, filter, cards)
```

---

## Fáze E — `ArticleDetailPage`

### E1. Komponentní struktura

```
ArticleDetailPage/
├── ArticleDetailPage.tsx
├── ArticleDetailPage.module.css
├── ReadingProgressBar.tsx
├── ArticleHeader.tsx
├── AuthorSidebar.tsx
├── RatingPanel.tsx
├── AdminActions.tsx
├── AuthorActions.tsx
└── index.ts
```

`RatingDistribution`, `MoreFromAuthor`, `AutoTOC` jsou v 3.2e — pro 3.2c teď placeholder `null`.

### E2. `ArticleDetailPage.tsx`

```tsx
export default function ArticleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: article, isLoading, error } = useArticle(id);
  const { data: categories = [] } = useArticleCategories();
  const user = useCurrentUser();

  if (isLoading) return <Loading />;
  if (error || !article) return <NotFoundPage />;

  const cat = categoryByKey(categories, article.category);
  const isAuthor = user?.id === article.authorId;
  const isAdmin = user && [UserRole.Superadmin, UserRole.Admin, UserRole.SpravceClanku].includes(user.role);

  return (
    <article className={s.page} style={categoryStyle(cat)}>
      <ReadingProgressBar />
      <ArticleHeader article={article} category={cat} />
      <div className={s.body}>
        <AuthorSidebar article={article} />
        <div className={s.content}>
          <RichTextEditor value={article.content} readOnly className={s.proseWrapper} />
          {/* 3.2e přidá <AutoTOC>, <GlyphDivider> mezi paragrafy přes content transform */}
        </div>
      </div>
      {article.status === 'Published' && (
        <RatingPanel article={article} user={user} />
      )}
      {isAdmin && article.status === 'Pending' && (
        <AdminActions article={article} />
      )}
      {isAuthor && (article.status === 'Draft' || article.status === 'Rejected') && (
        <AuthorActions article={article} />
      )}
      {/* 3.2e přidá <MoreFromAuthor> */}
    </article>
  );
}
```

### E3. `ReadingProgressBar.tsx`

```tsx
export function ReadingProgressBar() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const handler = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0;
      setProgress(Math.min(100, Math.max(0, pct)));
    };
    window.addEventListener('scroll', handler, { passive: true });
    handler();
    return () => window.removeEventListener('scroll', handler);
  }, []);
  return (
    <div className={s.progressTrack} aria-hidden>
      <div className={s.progressFill} style={{ transform: `scaleX(${progress / 100})` }} />
    </div>
  );
}
```

CSS:
```css
.progressTrack {
  position: fixed;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: transparent;
  z-index: 100;
  pointer-events: none;
}
.progressFill {
  height: 100%;
  background: var(--accent);
  transform-origin: left center;
  transition: transform 0.05s linear;
}
```

### E4. `ArticleHeader.tsx`

```tsx
function ArticleHeader({ article, category }: Props) {
  return (
    <header className={s.header}>
      <div className={s.meta}>
        <span className={s.number}>N° {articleNumber(article.id)}</span>
        <span className={s.categoryLabel}>
          <CategoryChip category={category} small />
          <span className={s.dot}>·</span>
          <span>{formatDateCs(article.publishedAtUtc ?? article.createdAtUtc)}</span>
        </span>
      </div>
      <h1 className={s.title}>{article.title}</h1>
      <div className={s.sub}>
        <Link to={`/ikaros/uzivatel/${article.authorId}`} className={s.authorLink}>
          {article.authorName}
        </Link>
        <span> · </span>
        <span>{readingTime(article.content)} min čtení</span>
      </div>
    </header>
  );
}
```

### E5. `AuthorSidebar.tsx` — sticky, italic margin-note vibe

```tsx
function AuthorSidebar({ article }: Props) {
  return (
    <aside className={s.authorSidebar}>
      <div className={s.authorAvatar}>{/* TODO: avatar */}</div>
      <div className={s.authorName}>{article.authorName}</div>
      <div className={s.authorMeta}>
        <span>★ {article.averageRating || '—'}</span>
      </div>
      <Link to={`/ikaros/uzivatel/${article.authorId}`} className={s.authorMore}>
        Více →
      </Link>
    </aside>
  );
}
```

CSS:
```css
.body {
  display: grid;
  grid-template-columns: 180px 1fr;
  gap: 48px;
  align-items: start;
}

.authorSidebar {
  position: sticky;
  top: 80px;
  font-family: var(--prose-font-body);
  font-style: italic;
  font-size: 14px;
  color: var(--text-muted);
  text-align: right;
  padding-right: 16px;
  border-right: 1px solid var(--frame-border);
}

.content {
  max-width: var(--prose-max-width);
}

.proseWrapper {
  /* Drop cap přes class na readOnly */
}

@media (max-width: 1024px) {
  .body { grid-template-columns: 1fr; gap: 24px; }
  .authorSidebar {
    position: static;
    text-align: left;
    padding: 16px;
    border: 1px solid var(--frame-border);
    border-left: 3px solid var(--accent);
    background: var(--surface-elevated);
  }
}
```

### E6. Drop cap aplikace

Wrapper class `.withDropCap` se aktivuje pro detail page:

```tsx
<RichTextEditor value={article.content} readOnly className={`${s.proseWrapper} withDropCap`} />
```

⚠️ Export `withDropCap` className z RichTextEditor je global modifier (komponent ho vidí v vlastním stylesheetu přes `.readOnly.withDropCap`).

### E7. `RatingPanel.tsx` — bez distribuce (ta v 3.2e)

```tsx
function RatingPanel({ article, user }: Props) {
  const isAuthor = user?.id === article.authorId;
  const myRating = article.ratings.find(r => r.userId === user?.id)?.stars ?? 0;
  const [hover, setHover] = useState(0);
  const mutation = useRateArticle();

  return (
    <section className={s.ratingPanel}>
      <div className={s.avg}>
        <Stars value={Math.round(article.averageRating)} />
        <span className={s.avgNum}>{article.averageRating || '—'} z 5</span>
        <span className={s.count}>· {article.ratings.length} hodnocení</span>
      </div>
      {/* 3.2e: <RatingDistribution ratings={article.ratings} /> */}
      {user && !isAuthor && (
        <div className={s.rate}>
          <span>{myRating ? 'Tvé hodnocení:' : 'Ohodnoť:'}</span>
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              onClick={() => mutation.mutate({ id: article.id, stars: n })}
              className={s.starBtn}
              aria-label={`${n} hvězd`}
            >
              {n <= (hover || myRating) ? '★' : '☆'}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
```

### E8. `AdminActions.tsx`

```tsx
function AdminActions({ article }: Props) {
  const approve = useApproveArticle();
  const [rejectOpen, setRejectOpen] = useState(false);
  return (
    <div className={s.adminActions}>
      <button onClick={() => approve.mutate(article.id)} className={s.btnApprove}>Schválit</button>
      <button onClick={() => setRejectOpen(true)} className={s.btnReject}>Vrátit s poznámkou</button>
      <RejectReasonModal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        articleId={article.id}
        articleTitle={article.title}
      />
    </div>
  );
}
```

### E9. `AuthorActions.tsx`

```tsx
function AuthorActions({ article }: Props) {
  const submit = useSubmitArticle();
  const del = useDeleteArticle();
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div className={s.authorActions}>
      <button onClick={() => navigate(`/ikaros/clanky/${article.id}/upravit`)}>Upravit</button>
      <button onClick={() => submit.mutate(article.id, { onSuccess: () => toast.success('Odesláno ke schválení') })}>
        Odeslat ke schválení
      </button>
      <button onClick={() => setConfirmOpen(true)} className={s.danger}>Smazat</button>
      {article.status === 'Rejected' && article.rejectReason && (
        <div className={s.rejectReason}>
          <strong>Důvod zamítnutí:</strong> {article.rejectReason}
        </div>
      )}
      <ConfirmDialog
        open={confirmOpen}
        title="Smazat článek?"
        message="Tato akce je nevratná."
        onConfirm={async () => { await del.mutateAsync(article.id); navigate('/ikaros/clanky'); }}
        onClose={() => setConfirmOpen(false)}
        confirmLabel="Smazat"
        confirmVariant="danger"
      />
    </div>
  );
}
```

### E10. Mark-as-read trigger

V `ArticleDetailPage.tsx`:

```tsx
useEffect(() => {
  if (!user || !article || article.status !== 'Published') return;
  const startTime = Date.now();
  let triggered = false;
  const observer = new IntersectionObserver(([entry]) => {
    if (!triggered && entry.isIntersecting && Date.now() - startTime > 30_000) {
      triggered = true;
      markRead.mutate(article.id);
    }
  }, { threshold: 0.5 });
  const target = document.querySelector(`.${s.content}`);
  if (target) observer.observe(target);
  return () => observer.disconnect();
}, [user, article]);
```

⚠️ **Wait:** `> 30_000` je „aspoň 30s na stránce". To se může stát kdykoli během mountu — observer možná triggernes hned. Refactor: check `Date.now() - startTime > 30_000` až **uvnitř** observer callbacku (lazy check).

### E11. Commit

```
feat(articles): E. ArticleDetailPage (reading flow, autor sidebar, rating, actions)
```

---

## Fáze F — `ArticleEditorPage`

### F1. Komponentní struktura

```
ArticleEditorPage/
├── ArticleEditorPage.tsx
├── ArticleEditorPage.module.css
├── TitleInput.tsx
├── CategoryPicker.tsx
├── AutoSaveIndicator.tsx
├── RestoreDraftModal.tsx
├── StickyActionBar.tsx
└── index.ts
```

### F2. `ArticleEditorPage.tsx`

```tsx
export default function ArticleEditorPage() {
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const user = useCurrentUser();
  const { data: article, isLoading } = useArticle(id);
  const { data: categories = [] } = useArticleCategories();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('ostatni');
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [pendingRestore, setPendingRestore] = useState<string | null>(null);
  const lastSavedRef = useRef<number | null>(null);

  // Hydrate from BE
  useEffect(() => {
    if (article) {
      setTitle(article.title);
      setContent(article.content);
      setCategory(article.category);
    }
  }, [article]);

  // Auto-save key
  const autoSaveKey = `article-draft:${user?.id ?? 'anon'}:${id ?? 'new'}`;

  const create = useCreateArticle();
  const update = useUpdateArticle();
  const submit = useSubmitArticle();

  // Permission check
  if (isEdit && article && article.authorId !== user?.id) {
    return <ForbiddenPage />;
  }
  if (isEdit && article && !['Draft', 'Rejected'].includes(article.status)) {
    toast.error('Tento článek nelze editovat');
    return <Navigate to={`/ikaros/clanky/${id}`} replace />;
  }

  async function handleSaveDraft() {
    if (!title.trim()) { toast.error('Zadej název'); return; }
    if (isEdit) {
      await update.mutateAsync({ id: id!, dto: { title, content, category } });
      lastSavedRef.current = Date.now();
      toast.success('Koncept uložen');
    } else {
      const created = await create.mutateAsync({ title, content, category, submit: false });
      lastSavedRef.current = Date.now();
      navigate(`/ikaros/clanky/${created.id}/upravit`, { replace: true });
    }
  }

  async function handleSubmit() {
    if (!title.trim() || !content.trim()) { toast.error('Vyplň název i obsah'); return; }
    if (isEdit) {
      await update.mutateAsync({ id: id!, dto: { title, content, category } });
      await submit.mutateAsync(id!);
    } else {
      await create.mutateAsync({ title, content, category, submit: true });
    }
    toast.success('Článek odeslán ke schválení');
    navigate('/ikaros/clanky?tab=moje');
  }

  if (isEdit && isLoading) return <Loading />;

  return (
    <div className={s.page}>
      <header className={s.editorHeader}>
        <Link to="/ikaros/clanky" className={s.back}>← Zpět</Link>
        <AutoSaveIndicator lastSavedAt={lastSavedRef.current} />
      </header>
      <main className={s.editorMain}>
        <TitleInput value={title} onChange={setTitle} />
        <RichTextEditor
          value={content}
          onChange={setContent}
          autoSaveKey={autoSaveKey}
          placeholder="Začněte psát…"
          maxLength={50000}
        />
      </main>
      <StickyActionBar
        category={category}
        categories={categories}
        onCategoryChange={setCategory}
        onSaveDraft={handleSaveDraft}
        onSubmit={handleSubmit}
        isSubmitting={submit.isPending || create.isPending || update.isPending}
      />
      <RestoreDraftModal
        open={restoreOpen}
        candidate={pendingRestore}
        onAccept={(html) => { setContent(html); setRestoreOpen(false); }}
        onDiscard={() => { setRestoreOpen(false); /* clearLocalDraft called via RichTextEditor */ }}
      />
    </div>
  );
}
```

### F3. `TitleInput`

```tsx
function TitleInput({ value, onChange }: Props) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder="Název článku"
      className={s.titleInput}
      maxLength={300}
    />
  );
}
```

CSS:
```css
.titleInput {
  width: 100%;
  font-family: var(--prose-font-display);
  font-size: 48px;
  font-weight: 700;
  letter-spacing: -0.02em;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-strong);
  padding: 0 0 16px;
  margin-bottom: 24px;
  border-bottom: 1px solid var(--frame-border);
}

.titleInput::placeholder { color: var(--text-subtle); font-style: italic; }

@media (max-width: 768px) {
  .titleInput { font-size: 32px; }
}
```

### F4. `CategoryPicker` — uvnitř StickyActionBar

Vertikální pill chips s wax-seal dot:

```tsx
function CategoryPicker({ value, onChange, categories }: Props) {
  return (
    <div className={s.catPicker} role="radiogroup">
      {categories.map(cat => (
        <button
          key={cat.key}
          type="button"
          role="radio"
          aria-checked={value === cat.key}
          onClick={() => onChange(cat.key)}
          className={value === cat.key ? s.chipActive : s.chip}
          style={{ ['--cat-current' as string]: cat.color }}
        >
          <span className={s.waxSeal} /> {cat.label}
        </button>
      ))}
    </div>
  );
}
```

### F5. `AutoSaveIndicator`

```tsx
function AutoSaveIndicator({ lastSavedAt }: Props) {
  const [text, setText] = useState('');
  useEffect(() => {
    if (!lastSavedAt) { setText(''); return; }
    const date = new Date(lastSavedAt);
    setText(`✦ uloženo · ${date.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}`);
  }, [lastSavedAt]);
  return <span className={s.autoSave}>{text}</span>;
}
```

### F6. `RestoreDraftModal`

```tsx
function RestoreDraftModal({ open, candidate, onAccept, onDiscard }: Props) {
  if (!open || !candidate) return null;
  return (
    <Modal>
      <h3>Máš rozpracovaný draft</h3>
      <p>V prohlížeči byl nalezen lokální rozpracovaný draft tohoto článku.</p>
      <button onClick={() => onAccept(candidate)}>Pokračovat s draftem</button>
      <button onClick={onDiscard}>Zahodit a načíst původní</button>
    </Modal>
  );
}
```

⚠️ **Integrace s RichTextEditor:** parent musí detekovat `restoreCandidate` z hooku. Buď export `useDraftAutoSave` přímo v parent (preferred), nebo `RichTextEditor` přes ref/callback. Pro 3.2c **použijeme přímý hook v parent** — `RichTextEditor` neví o restore flow.

```tsx
// Uvnitř ArticleEditorPage:
const { hasUnsavedLocal, restoreCandidate, clearLocalDraft } = useDraftAutoSave(autoSaveKey, content);

useEffect(() => {
  if (restoreCandidate) setRestoreOpen(true);
}, [restoreCandidate]);
```

### F7. `StickyActionBar`

```tsx
function StickyActionBar({ category, categories, onCategoryChange, onSaveDraft, onSubmit, isSubmitting }: Props) {
  return (
    <footer className={s.stickyBar}>
      <CategoryPicker value={category} onChange={onCategoryChange} categories={categories} />
      <div className={s.btns}>
        <button onClick={onSaveDraft} className={s.btnSecondary} disabled={isSubmitting}>Uložit koncept</button>
        <button onClick={onSubmit} className={s.btnPrimary} disabled={isSubmitting}>Odeslat ke schválení</button>
      </div>
    </footer>
  );
}
```

CSS sticky bottom:
```css
.stickyBar {
  position: sticky;
  bottom: 0;
  background: var(--surface-elevated);
  border-top: 1px solid var(--frame-border);
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  backdrop-filter: blur(8px);
  z-index: 10;
}

@media (max-width: 768px) {
  .stickyBar { padding: 12px 16px; flex-direction: column; align-items: stretch; }
}
```

### F8. Commit

```
feat(articles): F. ArticleEditorPage (title, RTE, category picker, auto-save)
```

---

## Fáze G — `RejectReasonModal`

### G1. Komponent

```tsx
interface Props {
  open: boolean;
  onClose: () => void;
  articleId: string;
  articleTitle: string;
}

const MIN_REASON = 10;

export function RejectReasonModal({ open, onClose, articleId, articleTitle }: Props) {
  const [reason, setReason] = useState('');
  const reject = useRejectArticle();

  function handleConfirm() {
    if (reason.trim().length < MIN_REASON) return;
    reject.mutate(
      { id: articleId, reason: reason.trim() },
      {
        onSuccess: () => {
          toast.success('Článek vrácen autorovi');
          setReason('');
          onClose();
        },
      },
    );
  }

  return (
    <Modal open={open} onClose={onClose} title={`Vrátit článek „${articleTitle}"`}>
      <p className={s.help}>
        Napiš autorovi, co potřebuje upravit. Minimum {MIN_REASON} znaků.
      </p>
      <textarea
        value={reason}
        onChange={e => setReason(e.target.value)}
        placeholder="Důvod / co opravit…"
        rows={6}
        maxLength={2000}
        className={s.textarea}
        autoFocus
      />
      <div className={s.counter}>
        {reason.length} / 2000 · min {MIN_REASON}
      </div>
      <div className={s.actions}>
        <button onClick={onClose}>Zrušit</button>
        <button
          onClick={handleConfirm}
          disabled={reason.trim().length < MIN_REASON || reject.isPending}
          className={s.btnPrimary}
        >
          Vrátit autorovi
        </button>
      </div>
    </Modal>
  );
}
```

### G2. Commit

```
feat(articles): G. RejectReasonModal with min 10 chars validation
```

---

## Fáze H — Pravý panel link

### H1. Edit `IkarosLayout.tsx`

V sekci Administrace pravého panelu:

```tsx
{(isAdmin || role === UserRole.SpravceClanku) && (
  <Link to="/ikaros/clanky?tab=prehled" className={s.navItem} onClick={onNav}>
    <span className={s.navItemIcon}><FileText size={18} /></span>
    <span className={s.navItemLabel}>Správa článků</span>
  </Link>
)}
```

Vstupné body **„Komunita"** sekce (vlevo navigace) — link na `/ikaros/clanky` (default Přehled) pro všechny role.

### H2. Commit

```
feat(layout): H. IkarosLayout — link na /ikaros/clanky (Komunita + Administrace)
```

---

## Fáze I — Mobile + skill `mobil-desktop`

### I1. Manuální procházka

Otevřít všechny 3 stránky v Chrome DevTools mobile view 375px, 768px, 1024px:

- ArticlesListPage — grid 1col, toolbar wrap, kategorie chips scroll horizontal
- ArticleDetailPage — autor sidebar nad obsahem, no sticky-left
- ArticleEditorPage — title input menší, sticky bar stacked

### I2. Spustit skill `mobil-desktop`

```
/mobil-desktop
```

Skill projde komponenty, hodí seznam issues, fixneme.

### I3. Commit

```
feat(articles): I. mobile responsive audit + fixes
```

---

## Fáze J — Testy

### J1. `ArticlesListPage.spec.tsx` (+12 cases)

- Anon vidí jen Přehled tab
- Auth vidí oba taby
- `?tab=moje` přepne na MojeTab
- Search filtruje
- Sort změní řazení
- Kategorie multi-select filter
- Empty state
- Klik na kartu naviguje
- Badge „Nepřečteno"

### J2. `ArticleDetailPage.spec.tsx` (+10 cases)

- Anon Published renderuje
- Anon Draft → 403
- Reading progress bar reacts to scroll
- Mark-as-read triggers po 50% + 30s
- Admin Pending vidí action tlačítka
- Autor Draft/Rejected vidí action tlačítka
- Reject reason u Rejected článku zobrazen
- Klik „Schválit" → mutation
- Klik „Vrátit" → modal otevřen

### J3. `ArticleEditorPage.spec.tsx` (+8 cases)

- Create mode prázdný editor
- Edit mode hydrate z BE
- Submit blokován bez title/content
- Auto-save indicator
- RestoreDraftModal při local draft
- ForbiddenPage pokud ne-autor
- Submit success → navigate `/clanky?tab=moje`

### J4. `RejectReasonModal.spec.tsx` (+4 cases)

- Submit disabled < 10 znaků
- Submit enabled ≥ 10 znaků
- Confirm → mutation + close
- Counter ukazuje zbývající znaky

### J5. Commit

```
test(articles): J. +34 FE cases for 3.2c pages
```

---

## Fáze K — Lint + build + commit + PR

### K1. `npm run lint`
### K2. `npx tsc --noEmit`
### K3. `npm run test:run`
### K4. `npm run build`
### K5. PR

Title: `feat(articles): 3.2c — pages (list, detail, editor, reject modal)`

---

## Příprava na 3.2d

`ArticleReviewListItem` payload z BE. Renderer v Zpracovat tabu. Plán 3.2d nezávisí na 3.2c, ale lépe ho dělat až po 3.2c (sdílí komponenty `RejectReasonModal`, hooks).
