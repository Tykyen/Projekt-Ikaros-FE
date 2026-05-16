# Implementační plán 3.2e — Discovery features

**Status:** ✅ Implementováno
**Spec:** [spec-3.2.md §11](./spec-3.2.md)
**Větev:** `feat/krok-3.2e-articles-discovery`
**Odhad:** ~500 ř. FE + ~250 ř. FE testů
**Repo:** `Projekt-ikaros-FE`

⚠️ **Závisí na:** merged 3.2c (komponenty se mountují na `ArticleDetailPage` a `ArticleCard`).

---

## Postup vysoké úrovně

| # | Fáze | Cíl |
|---|---|---|
| A | `RatingDistribution` komponent | 5 horizontálních lišt |
| B | `useArticleReadStatus` + `useMarkRead` + `useUnreadCount` hooks | Read tracking |
| C | `MarkAsReadObserver` integrace | IntersectionObserver na detail |
| D | `MoreFromAuthor` komponent + hook | 3 random ostatní články autora |
| E | `AutoTOC` komponent | Extrakce H2/H3, sidebar/accordion |
| F | `GlyphDivider` rendering | Vložit glyphs mezi paragrafy |
| G | „Nepřečteno" badge integrace v `ArticleCard` | Badge se objevuje pro auth |
| H | Volitelné: unread badge v pravém panelu | „Komunita" sekce |
| I | Testy | +13 cases |
| J | Lint + build + commit + PR + skill `mobil-desktop` |

⚠️ **PJ checkpoint po každé fázi.**

---

## Fáze A — `RatingDistribution`

### A1. Komponent

**Nový soubor:** `src/features/ikaros/components/RatingDistribution.tsx`

```tsx
import type { ArticleRating } from '@/shared/types';
import s from './RatingDistribution.module.css';

interface Props { ratings: ArticleRating[]; }

export function RatingDistribution({ ratings }: Props) {
  if (ratings.length === 0) {
    return <p className={s.empty}>Zatím žádné hodnocení.</p>;
  }
  const counts = [5, 4, 3, 2, 1].map(stars => {
    const count = ratings.filter(r => r.stars === stars).length;
    return { stars, count, pct: (count / ratings.length) * 100 };
  });
  return (
    <div className={s.dist} aria-label="Distribuce hodnocení">
      {counts.map(({ stars, count, pct }) => (
        <div key={stars} className={s.row}>
          <span className={s.star} aria-label={`${stars} hvězd`}>{stars}</span>
          <div className={s.bar} role="progressbar" aria-valuenow={count} aria-valuemax={ratings.length}>
            <div className={s.fill} style={{ width: `${pct}%` }} />
          </div>
          <span className={s.pct}>{pct.toFixed(0)}%</span>
          <span className={s.count}>({count})</span>
        </div>
      ))}
    </div>
  );
}
```

### A2. CSS

```css
.dist {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 16px;
}

.row {
  display: grid;
  grid-template-columns: 20px 1fr 36px 36px;
  align-items: center;
  gap: 8px;
  font-family: var(--prose-font-mono);
  font-size: 12px;
  color: var(--text-muted);
}

.star { font-weight: 600; }

.bar {
  height: 6px;
  background: var(--surface-elevated);
  border: 1px solid var(--frame-border);
  border-radius: 3px;
  overflow: hidden;
}

.fill {
  height: 100%;
  background: var(--accent);
  transition: width 0.3s ease-out;
}

.pct { text-align: right; }
.count { color: var(--text-subtle); }
.empty { color: var(--text-subtle); font-style: italic; }
```

### A3. Integrace do `RatingPanel` (3.2c)

```tsx
// Edit ArticleDetailPage/RatingPanel.tsx — přidat za .avg div:
<RatingDistribution ratings={article.ratings} />
```

### A4. Commit

```
feat(articles): A. RatingDistribution component (5 bar chart)
```

---

## Fáze B — Read status hooks

### B1. `src/features/ikaros/api/useArticleReads.ts`

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';

const PREFIX = '/ikaros-articles';

export function useArticleReadStatus(articleId: string | undefined, options: { enabled?: boolean } = {}) {
  const enabled = options.enabled !== false && !!articleId;
  return useQuery({
    queryKey: ['article-reads', 'status', articleId],
    queryFn: () => api.get<{ read: boolean }>(`${PREFIX}/${articleId}/read-status`),
    enabled,
    staleTime: 60_000,
  });
}

export function useUnreadCount(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ['article-reads', 'unread-count'],
    queryFn: () => api.get<{ count: number }>(`${PREFIX}/unread-count`),
    enabled: options.enabled !== false,
    staleTime: 30_000,
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`${PREFIX}/${id}/mark-read`),
    onSuccess: (_, id) => {
      qc.setQueryData(['article-reads', 'status', id], { read: true });
      qc.invalidateQueries({ queryKey: ['article-reads', 'unread-count'] });
    },
  });
}
```

### B2. Commit

```
feat(articles): B. read-status hooks (status, unread-count, markRead)
```

---

## Fáze C — Mark-as-read integrace v `ArticleDetailPage`

### C1. Edit `ArticleDetailPage.tsx`

```tsx
const markRead = useMarkRead();
const { data: readStatus } = useArticleReadStatus(article?.id, { enabled: !!user });

useEffect(() => {
  if (!user || !article || article.status !== 'Published' || readStatus?.read) return;

  const startTime = Date.now();
  let triggered = false;

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (triggered) return;
      if (!entry.isIntersecting) return;
      const elapsed = Date.now() - startTime;
      if (elapsed < 30_000) {
        // Lazy re-check za pár sekund
        setTimeout(() => {
          if (!triggered && entry.isIntersecting && Date.now() - startTime >= 30_000) {
            triggered = true;
            markRead.mutate(article.id);
          }
        }, 30_000 - elapsed + 100);
        return;
      }
      triggered = true;
      markRead.mutate(article.id);
    },
    { threshold: 0.5 },
  );

  // Pozorujeme konec obsahu — div s reference v content
  const target = document.querySelector('[data-article-end]');
  if (target) observer.observe(target);
  return () => observer.disconnect();
}, [user, article, readStatus?.read, markRead]);
```

V JSX (uvnitř `.content` div):

```tsx
<RichTextEditor value={article.content} readOnly />
<div data-article-end aria-hidden style={{ height: 1 }} />
```

### C2. Commit

```
feat(articles): C. mark-as-read IntersectionObserver on detail page
```

---

## Fáze D — `MoreFromAuthor`

### D1. Komponent

**Nový soubor:** `src/features/ikaros/components/MoreFromAuthor.tsx`

```tsx
import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { useArticles } from '@/features/ikaros/api/useArticles';
import { articleNumber, glyphFor } from '@/features/ikaros/lib/articles';
import s from './MoreFromAuthor.module.css';

interface Props {
  authorId: string;
  authorName: string;
  excludeArticleId: string;
}

export function MoreFromAuthor({ authorId, authorName, excludeArticleId }: Props) {
  const { data: articles = [] } = useArticles();

  const fromAuthor = useMemo(() => {
    const others = articles.filter(
      a => a.authorId === authorId && a.id !== excludeArticleId && a.status === 'Published',
    );
    // Shuffle deterministically per excludeArticleId for stable display per page reload
    const seed = excludeArticleId.charCodeAt(0) || 0;
    const shuffled = [...others].sort((a, b) => {
      const ah = (a.id.charCodeAt(0) + seed) % 100;
      const bh = (b.id.charCodeAt(0) + seed) % 100;
      return ah - bh;
    });
    return shuffled.slice(0, 3);
  }, [articles, authorId, excludeArticleId]);

  if (fromAuthor.length === 0) return null;

  return (
    <section className={s.section}>
      <h3 className={s.heading}>❧ Více od {authorName}</h3>
      <ul className={s.list}>
        {fromAuthor.map(a => (
          <li key={a.id} className={s.item}>
            <span className={s.glyph}>{glyphFor(a.id)}</span>
            <Link to={`/ikaros/clanky/${a.id}`} className={s.link}>
              <span className={s.title}>{a.title}</span>
              <span className={s.meta}>
                {a.averageRating ? `★ ${a.averageRating}` : '—'} ({a.ratings.length})
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

### D2. CSS

```css
.section {
  margin-top: 64px;
  padding-top: 32px;
  border-top: 1px solid var(--frame-border);
}

.heading {
  font-family: var(--prose-font-display);
  font-size: 18px;
  font-style: italic;
  color: var(--text-muted);
  margin: 0 0 16px;
}

.list { list-style: none; padding: 0; margin: 0; }

.item {
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--frame-border);
}

.glyph { color: var(--accent); font-size: 14px; }

.link {
  display: flex;
  justify-content: space-between;
  flex: 1;
  text-decoration: none;
  color: inherit;
}

.title {
  font-family: var(--prose-font-display);
  font-size: 16px;
  color: var(--text-strong);
}

.meta {
  font-family: var(--prose-font-mono);
  font-size: 12px;
  color: var(--text-subtle);
}

.link:hover .title { color: var(--accent); }
```

### D3. Integrace na detail page

```tsx
{/* na konci ArticleDetailPage JSX */}
<MoreFromAuthor
  authorId={article.authorId}
  authorName={article.authorName}
  excludeArticleId={article.id}
/>
```

### D4. Commit

```
feat(articles): D. MoreFromAuthor section (3 random from author)
```

---

## Fáze E — `AutoTOC`

### E1. Komponent

**Nový soubor:** `src/features/ikaros/components/AutoTOC.tsx`

```tsx
import { useMemo, useEffect, useState } from 'react';
import s from './AutoTOC.module.css';

interface Props { html: string; }

interface TOCEntry { id: string; text: string; level: 2 | 3; }

export function AutoTOC({ html }: Props) {
  const headings = useMemo(() => extractHeadings(html), [html]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Inject id on h2/h3 in rendered DOM
    const article = document.querySelector('[data-article-content]');
    if (!article) return;
    const elements = article.querySelectorAll('h2, h3');
    elements.forEach((el, idx) => {
      el.id = headings[idx]?.id ?? '';
    });
  }, [headings]);

  useEffect(() => {
    // IntersectionObserver — highlight active heading
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: '-80px 0px -60% 0px' },
    );
    headings.forEach(h => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length < 2) return null;

  return (
    <>
      <nav className={s.desktop} aria-label="Obsah článku">
        <h4 className={s.tocHeading}>Obsah</h4>
        <ul className={s.list}>
          {headings.map(h => (
            <li key={h.id} className={`${s[`level${h.level}`]} ${activeId === h.id ? s.active : ''}`}>
              <a href={`#${h.id}`} onClick={(e) => smoothScroll(e, h.id)}>{h.text}</a>
            </li>
          ))}
        </ul>
      </nav>
      <details className={s.mobile} open={open} onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}>
        <summary>Obsah ({headings.length})</summary>
        <ul className={s.list}>
          {headings.map(h => (
            <li key={h.id} className={s[`level${h.level}`]}>
              <a href={`#${h.id}`} onClick={(e) => smoothScroll(e, h.id)}>{h.text}</a>
            </li>
          ))}
        </ul>
      </details>
    </>
  );
}

function extractHeadings(html: string): TOCEntry[] {
  if (typeof window === 'undefined') return [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const elements = doc.querySelectorAll('h2, h3');
  return Array.from(elements).map((el, idx) => ({
    id: `heading-${idx}`,
    text: el.textContent ?? '',
    level: el.tagName === 'H2' ? 2 : 3,
  }));
}

function smoothScroll(e: React.MouseEvent, id: string) {
  e.preventDefault();
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  history.pushState(null, '', `#${id}`);
}
```

### E2. CSS

```css
.desktop {
  position: sticky;
  top: 80px;
  font-family: var(--prose-font-body);
  font-size: 13px;
  color: var(--text-muted);
}

.tocHeading {
  font-family: var(--prose-font-mono);
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-subtle);
  margin: 0 0 12px;
}

.list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px; }

.level2 a, .level3 a {
  color: var(--text-muted);
  text-decoration: none;
  transition: color 0.15s;
}

.level3 { padding-left: 16px; }
.level2 a:hover, .level3 a:hover { color: var(--text-strong); }

.active a { color: var(--accent); font-weight: 600; }

.mobile {
  display: none;
}

@media (max-width: 1024px) {
  .desktop { display: none; }
  .mobile {
    display: block;
    margin: 24px 0;
    padding: 12px 16px;
    background: var(--surface-elevated);
    border: 1px solid var(--frame-border);
  }
  .mobile summary {
    cursor: pointer;
    font-family: var(--prose-font-mono);
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }
}
```

### E3. Integrace v detail page

Layout @ desktop:

```tsx
<div className={s.body}>
  <AuthorSidebar article={article} />
  <div className={s.content} data-article-content>
    <RichTextEditor value={article.content} readOnly />
    <div data-article-end />
  </div>
  <AutoTOC html={article.content} /> {/* sticky right */}
</div>
```

⚠️ **3-column layout na desktopu:** `grid-template-columns: 180px 1fr 200px`. Mobile = single column, TOC accordion.

### E4. Commit

```
feat(articles): E. AutoTOC component (sticky desktop, accordion mobile)
```

---

## Fáze F — `GlyphDivider` rendering

### F1. Strategie

Glyph dividers (`✦ ❦ ❧ ☙`) by se v ideálním světě objevily mezi sekce článku. **Problém:** TipTap renderuje plain HTML — nemáme attached „mezi sekce" semantics. Možnosti:

1. **MVP:** glyph CSS `::before` před H2 elementem (markup zůstává, decorative).
2. **Ambitious:** TipTap custom node `<sectionBreak>` — autor explicitně vkládá v editoru.

⚠️ **Volíme MVP** — CSS `::before` na H2 (decorative). Custom node = nový dluh (`D-NEW-section-break-node`).

### F2. CSS update v `RichTextEditor.module.css`

```css
/* Editorial Atelier — glyph divider před H2 v readOnly (detail) */
.readOnly :global(.ProseMirror) {
  --article-glyph: '✦'; /* JS overrides per article ID */
}

.readOnly :global(.ProseMirror h2:not(:first-child))::before {
  content: var(--article-glyph);
  display: block;
  text-align: center;
  font-family: var(--prose-font-display);
  font-size: 20px;
  color: var(--accent);
  margin: 2em 0 1.5em;
  opacity: 0.6;
}
```

### F3. JS aplikace `--article-glyph`

V `ArticleDetailPage.tsx`:

```tsx
const glyph = glyphFor(article.id);

return (
  <article style={{ ['--article-glyph' as string]: `'${glyph}'` }}>
    {/* ... */}
  </article>
);
```

### F4. Commit

```
feat(articles): F. glyph divider before h2 in read mode (deterministic per article)
```

---

## Fáze G — „Nepřečteno" badge v `ArticleCard`

### G1. Integrace v `ArticleCard.tsx`

Už součást 3.2c plánu (`useArticleReadStatus`), ale po landingu 3.2c se zaktivuje až tady (kdy je BE endpoint `/read-status` k dispozici z 3.2a).

⚠️ **Pokud 3.2c implementuje read-status query před tím než 3.2a je merged** — `useArticleReadStatus` vrátí 404 z BE, `data?.read === undefined`, badge se nezobrazí. Fail-safe.

Po 3.2a + 3.2c → automaticky funguje.

### G2. CSS update

```css
.unread {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--accent);
  font-family: var(--prose-font-mono);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.unread::before {
  content: '●';
  font-size: 8px;
}
```

### G3. Commit

```
feat(articles): G. unread badge in ArticleCard (active after 3.2a merged)
```

---

## Fáze H — Volitelné: unread badge v pravém panelu

### H1. `IkarosLayout.tsx` — sekce „Komunita" → „Články"

```tsx
const { data: unread } = useUnreadCount({ enabled: !!user });
const unreadCount = unread?.count ?? 0;

<Link to="/ikaros/clanky" className={s.navItem}>
  <span className={s.navItemIcon}><FileText size={18} /></span>
  <span className={s.navItemLabel}>Články</span>
  {unreadCount > 0 && <span className={s.badge}>{unreadCount}</span>}
</Link>
```

### H2. Rozhodnutí

⚠️ **Volitelná fáze** — pokud team chce, jinak skip. Nemění acceptance criteria.

### H3. Commit (pokud děláme)

```
feat(layout): H. unread articles badge in right panel
```

---

## Fáze I — Testy

### I1. `RatingDistribution.spec.tsx` (+3 cases)

- Prázdné ratings → empty state
- 10 ratings různé hodnoty → percenta správně
- 100 % jedna kategorie → ostatní 0 %

### I2. `useArticleReadStatus.spec.ts` (+3 cases)

- Query volá GET endpoint
- `useMarkRead` mutation → optimistic update read=true
- Mutation invalidates unread-count

### I3. `MoreFromAuthor.spec.tsx` (+3 cases)

- Author bez dalších článků → null
- Author s 1 dalším → 1 link
- Author s 5 → max 3

### I4. `AutoTOC.spec.tsx` (+4 cases)

- HTML bez H2/H3 → null
- HTML s 1 heading → null (min 2)
- HTML s 3 heading → 3 links
- Klik na link → `scrollIntoView` volán

### I5. Commit

```
test(articles): I. +13 cases for 3.2e discovery components
```

---

## Fáze J — Lint + build + commit + PR + mobil-desktop

### J1. `npm run lint`
### J2. `npx tsc --noEmit`
### J3. `npm run test:run`
### J4. `npm run build`
### J5. Skill `mobil-desktop`

```
/mobil-desktop
```

Kontrolujeme:
- AutoTOC na 1024px (collapse na accordion)
- MoreFromAuthor na mobile (vertical list)
- RatingDistribution na mobile (full width bars)
- Pravý panel badge ne přeteče

### J6. PR

Title: `feat(articles): 3.2e — discovery (rating dist, more-from-author, TOC, mark-as-read)`

Body:
- Spec link
- Závisí na 3.2a + 3.2c merged
- Manual E2E:
  - Auth user otevře článek, scroll na konec, počká 30s → badge na kartě v Přehledu zmizí
  - 5 různých ratings → distribuce bar chart správně
  - Klik TOC link → smooth scroll na heading

---

## Závěr fáze 3.2

Po landingu 3.2e všech PR:

1. **Aktualizovat `docs/roadmap-fe.md`:**
   - 3.2 ✅ + datum + odkaz na specy/plány
   - 3.3 položka přidat: „Cloudinary upload v TipTap (`<RichTextEditor>`)"
   - 3.4 položka přidat: „Sekce 'Diskuze o článku' na detailu + reverse link"
2. **Aktualizovat `docs/dluhy.md`:**
   - Zavřít **D-066** (TipTap)
   - Otevřít **D-NEW-search-be**, **D-NEW-bulk-pending-articles**, **D-NEW-article-versions**, **D-NEW-section-break-node**, **D-NEW-rte-imperative**
3. **Spustit skill `napoveda`** → aktualizace `/ikaros/napoveda` o:
   - Nová stránka `/ikaros/clanky` v sekci Stránky
   - Workflow Draft → Pending → Published popsaný
   - Role SpravceClanku — co může (schvalovat ve Zpracovat)
4. **Memory:** uložit klíčové architektonické decisions (Editorial Atelier vibe, prose tokens, glyph rotation) pokud jsou non-obvious.
