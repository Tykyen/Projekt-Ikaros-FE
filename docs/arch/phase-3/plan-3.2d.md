# Implementační plán 3.2d — Zpracovat tab renderer

**Status:** ✅ Implementováno
**Spec:** [spec-3.2.md §10](./spec-3.2.md)
**Větev:** `feat/krok-3.2d-zpracovat-article-renderer`
**Odhad:** ~150 ř. FE + ~100 ř. FE testů
**Repo:** `Projekt-ikaros-FE`

⚠️ **Závisí na:** merged 3.2a (BE provider vrací `ArticleReviewListItem`) + 3.2c (sdílí `RejectReasonModal` + `useApproveArticle`/`useRejectArticle`).

---

## Postup vysoké úrovně

| # | Fáze | Cíl |
|---|---|---|
| A | `ArticleReviewRenderer` komponenty | `Left`, `Mid`, `Actions` |
| B | Registry update | Zápis do `PENDING_ACTION_RENDERERS` |
| C | Testy | +6 cases |
| D | Lint + build + commit + PR |

---

## Fáze A — `ArticleReviewRenderer`

### A1. Komponenta

**Nový soubor:** `src/features/ikaros/components/ArticleReviewRenderer.tsx`

```tsx
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useArticleCategories } from '@/features/ikaros/api/useArticleCategories';
import { useApproveArticle } from '@/features/ikaros/api/useArticles';
import { categoryByKey, categoryStyle, articleNumber } from '@/features/ikaros/lib/articles';
import { RejectReasonModal } from '@/features/ikaros/components/RejectReasonModal';
import { timeAgo } from '@/shared/lib/dates';
import type { ArticleReviewListItem } from '@/shared/types';
import s from './ArticleReviewRenderer.module.css';

export function ArticleReviewLeft({ item }: { item: ArticleReviewListItem }) {
  const { data: categories = [] } = useArticleCategories();
  const cat = categoryByKey(categories, item.category);
  return (
    <div className={s.left} style={categoryStyle(cat)}>
      <span className={s.number}>N° {articleNumber(item.articleId)}</span>
      <span className={s.category}>
        <span className={s.waxSeal} />
        {cat?.label ?? item.category}
      </span>
    </div>
  );
}

export function ArticleReviewMid({ item }: { item: ArticleReviewListItem }) {
  return (
    <div className={s.mid}>
      <Link to={`/ikaros/clanky/${item.articleId}`} className={s.title}>
        {item.title}
      </Link>
      <p className={s.preview}>{item.preview}…</p>
      <div className={s.meta}>
        <Link to={`/ikaros/uzivatel/${item.authorId}`} className={s.author}>
          {item.authorName}
        </Link>
        <span className={s.dot}>·</span>
        <span>{timeAgo(item.submittedAt)}</span>
      </div>
    </div>
  );
}

interface ActionsProps {
  item: ArticleReviewListItem;
  onResolve: (promise: Promise<unknown>) => void;
  isLoading: boolean;
}

export function ArticleReviewActions({ item, onResolve, isLoading }: ActionsProps) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const approve = useApproveArticle();

  function handleApprove() {
    onResolve(approve.mutateAsync(item.articleId));
  }

  return (
    <>
      <button
        type="button"
        onClick={handleApprove}
        disabled={isLoading}
        className={s.btnApprove}
      >
        Schválit
      </button>
      <button
        type="button"
        onClick={() => setRejectOpen(true)}
        disabled={isLoading}
        className={s.btnReject}
      >
        Vrátit s poznámkou
      </button>
      <RejectReasonModal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        articleId={item.articleId}
        articleTitle={item.title}
      />
    </>
  );
}
```

### A2. CSS module

**Nový soubor:** `ArticleReviewRenderer.module.css`

```css
.left {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 100px;
}

.number {
  font-family: var(--prose-font-mono);
  font-size: 11px;
  letter-spacing: 0.1em;
  color: var(--text-subtle);
}

.category {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}

.waxSeal {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--cat-current, var(--accent));
}

.mid {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.title {
  font-family: var(--prose-font-display);
  font-size: 17px;
  font-weight: 600;
  color: var(--text-strong);
  text-decoration: none;
}

.title:hover { color: var(--accent); }

.preview {
  font-family: var(--prose-font-body);
  font-size: 13px;
  line-height: 1.4;
  color: var(--text-muted);
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-subtle);
}

.author { color: var(--accent); text-decoration: none; }

.btnApprove, .btnReject {
  padding: 6px 14px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid;
}

.btnApprove {
  background: rgba(76, 175, 80, 0.1);
  border-color: var(--status-published);
  color: var(--status-published);
}

.btnReject {
  background: transparent;
  border-color: var(--frame-border);
  color: var(--text-muted);
}

.btnApprove:hover { background: rgba(76, 175, 80, 0.2); }
.btnReject:hover { color: var(--text-strong); border-color: var(--text-muted); }
```

### A3. Commit

```
feat(zpracovat): A. ArticleReviewRenderer (Left/Mid/Actions)
```

---

## Fáze B — Registry update

### B1. Edit `src/features/users/components/tabs/ZpracovatTab/rendererRegistry.tsx`

```tsx
import {
  ArticleReviewLeft,
  ArticleReviewMid,
  ArticleReviewActions,
} from '@/features/ikaros/components/ArticleReviewRenderer';
import type { ArticleReviewListItem } from '@/shared/types';

const articleReviewRenderer: PendingActionRenderer<ArticleReviewListItem> = {
  type: PendingActionType.ArticlePendingReview,
  renderLeft: (item) => <ArticleReviewLeft item={item} />,
  renderMid: (item) => <ArticleReviewMid item={item} />,
  renderActions: (item, helpers) => (
    <ArticleReviewActions
      item={item}
      onResolve={helpers.onResolve}
      isLoading={helpers.isLoading}
    />
  ),
};

export const PENDING_ACTION_RENDERERS: Partial<
  Record<PendingActionType, PendingActionRenderer<unknown>>
> = {
  // ... existing entries
  [PendingActionType.ArticlePendingReview]:
    articleReviewRenderer as PendingActionRenderer<unknown>,
};
```

### B2. Verify Zpracovat tab badge update

`PendingActionsService.countForUser` (BE) by měl po 3.2a registrace automaticky zahrnout pending články pro správné role. FE už toto dělá v 1.4.

⚠️ **Manuální test:** Admin se přihlásí, otevře `/ikaros/uzivatele?tab=zpracovat`, vidí pending články spolu s username requests / friend requests / world access requests.

### B3. Commit

```
feat(zpracovat): B. register ArticleReviewRenderer in PENDING_ACTION_RENDERERS
```

---

## Fáze C — Testy

### C1. `ArticleReviewRenderer.spec.tsx` (+5 cases)

- Render Left s number + category chip
- Render Mid s title link + preview + autor link
- Render Actions s 2 tlačítky
- Klik „Schválit" → mutation volaná
- Klik „Vrátit s poznámkou" → modal otevřen

### C2. Registry test (+1 case)

```ts
test('ArticleReviewRenderer registered in PENDING_ACTION_RENDERERS', () => {
  expect(PENDING_ACTION_RENDERERS[PendingActionType.ArticlePendingReview]).toBeDefined();
});
```

### C3. Commit

```
test(zpracovat): C. +6 cases for ArticleReviewRenderer
```

---

## Fáze D — Lint + build + commit + PR

### D1. `npm run lint`
### D2. `npx tsc --noEmit`
### D3. `npm run test:run`
### D4. `npm run build`
### D5. Manuální E2E test:
   - Tyky se přihlásí jako Admin
   - Vytvoří `Hrac` testovacího usera (přes seed nebo manuálně)
   - Tester user napíše článek → odešle ke schválení
   - Tyky otevře `/ikaros/uzivatele?tab=zpracovat` → vidí kartu, klikne Schválit → karta zmizí
   - Re-test: tester pošle další, Tyky klikne Vrátit s poznámkou → modal → reason 15 znaků → submit → toast

### D6. PR

Title: `feat(zpracovat): 3.2d — article_pending_review renderer`

Body:
- Spec link
- Manual E2E confirmation
- Závisí na 3.2a + 3.2c PR (mergne se po nich)

---

## Příprava na 3.2e

3.2d je samostatná malá fáze. 3.2e přidá discovery features na detail page (distribuce hodnocení, „více od autora", auto TOC, mark-as-read FE badge).
