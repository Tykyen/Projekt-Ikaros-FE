# cache / 10-ikaros-platforma — checkpoint RUN-2026-06-20-1621

## Pokrytí

Zkontrolováno (HEAD 2026-06-20):

- `src/features/ikaros/api/useArticles.ts` — plné čtení
- `src/features/ikaros/api/useBulkArticleActions.ts` — plné čtení
- `src/features/ikaros/api/useGallery.ts` — plné čtení
- `src/features/ikaros/api/useDiscussions.ts` — plné čtení
- `src/features/ikaros/api/useIkarosNews.ts` — plné čtení
- `src/features/ikaros/api/useIkarosEvents.ts` — plné čtení
- `src/features/ikaros/api/useArticleCategories.ts` — plné čtení
- `src/features/ikaros/api/useGalleryCategories.ts` — plné čtení
- `src/features/ikaros/api/useMail.ts` — plné čtení
- `src/features/ikaros/api/useUploadImage.ts` — plné čtení
- `src/features/ikaros/pages/AkcePage/AkcePage.tsx` — C-40 fix ověřen
- `src/features/ikaros/components/IkarosEventCard.tsx` — CB placement
- `src/features/ikaros/components/IkarosEventModal.tsx` — CB placement
- `src/features/ikaros/components/ArticleReviewRenderer.tsx` — CB placement
- `src/app/layout/IkarosLayout/IkarosLayout.tsx` (badge konzument)
- `src/features/users/api/usePendingActions.ts` (badge konzument)
- Regresní specs: `useArticles.spec.tsx`, `useBulkArticleActions.spec.tsx`,
  `useDiscussions.spec.tsx`, `useGallery.spec.tsx`,
  `useIkarosNews.spec.tsx`, `useIkarosEvents.spec.tsx`, `useMail.spec.tsx`
- BE `ikaros-events.service.ts` (verifikace hard-delete + WS emit)
- Git log od 2026-06-05 pro `src/features/ikaros/` — kontrola nových souborů

## Dosažená L vs cílová L

- **Mutace × konzument matice:** L2 (key-match staticky ověřen, M1+M2)
- **Regresní testy C-37..C-42:** L3 (specs existují a jsou zelené dle suite z 2026-06-15)
- **WS push (C-47):** L3 (specs `useIkarosNews.spec` + `useIkarosEvents.spec`
  ověřují reconnect callback i event handler)
- **C-40 fix (AkcePage):** L2 (kód potvrzen: `selectedId` → derivace z live query)
- Cílová L oblasti: L2+ → **dosaženo** pro všechny mutace; L3 pro opravené C-37..C-42
- Destruktivní akce (delete) bez `removeQueries` — by-design (vždy navigace pryč,
  nebo WS invalidate stačí) — zaznamenáno jako D-10-1, neskalováno

## Nálezy

### Nové nálezy (HEAD 2026-06-20)

Žádné nové nálezy nenalezeny.

### Potvrzeny existující opravy (HEAD)

- **C-37** ✅ `useBulkApproveArticles`/`useBulkRejectArticles` — dead key `['articles','pending']`
  odstraněn, `['pending-actions']` přidán (oba hooky, komentáry in-code).
  `useBulkArticleActions.ts:24-28`, `useBulkArticleActions.ts:37-40`.

- **C-38** ✅ `useApproveArticle.onSuccess` invaliduje `['article-reads','unread-count']`.
  `useArticles.ts:116`.

- **C-39** ✅ `useRateArticle.onSuccess` invaliduje `ARTICLES_KEY` (+ detail).
  `useArticles.ts:150-153`. `useRateGalleryImage.onSuccess` invaliduje `GALLERY_KEY` (+ detail).
  `useGallery.ts:157-160`.

- **C-40** ✅ `AkcePage` drží pouze `selectedId: string | null`, `selected` event derivuje
  z `events.find(e => e.id === selectedId)` (live query data). `AkcePage.tsx:43-45`.

- **C-41** ✅ `useReportPost.onSuccess` invaliduje `['pending-actions']`.
  `useDiscussions.ts:148-150`.

- **C-42** ✅ `useDeleteArticle.onSuccess` invaliduje `['article-reads','unread-count']`.
  `useArticles.ts:89-93` (C-42 komentář přiřazen zde, ne jen u C-38; symetrická oprava).

### Nové BE změny bez cache dopadu

- **BE hard-delete ikaros-events** (commit `fb0f8b0`, 2026-06-20) — `ikaros-events.service.ts:129-145`:
  změna ze soft-delete (`isActive=false`) na hard delete. FE `useDeleteIkarosEvent.onSuccess`
  invaliduje `['ikaros-events']` ✅; BE emituje `ikaros-events.changed` ✅.
  **Žádný nový cache problém** — `findActive()` přestaví seznam správně po obou přístupech;
  invalidace pokrývá celý namespace.

### Latentní / zachovány (bez eskalace)

- **D-10-1** 🟡 — žádná delete mutace nedělá `removeQueries(detail)`, jen `invalidate(namespace)`.
  Stav stejný jako v původním sweepu; by-design (delete ze stránky = navigace pryč).
- **D-10-3** 🟡 — `['pending-actions']`, `['article-reads',…]`, `['users','me']` jsou inline
  literály bez centrální factory (drift-trap). Stav beze změny.

### Regresní pojistky L3 (přidány 2026-06-15, commit `a85378b4`)

Specs pokrývají C-37 (bulk approve/reject → pending-actions), C-38 (approve → unread-count),
C-39 (rate → ARTICLES_KEY/GALLERY_KEY namespace), C-41 (reportPost → pending-actions),
C-42 (delete → unread-count), C-47 (WS reconnect → ikaros-news/events invalidace),
S-04 (reconnect callback).

## PROOF-REQUEST

Žádný PROOF-REQUEST. Všechny opravy ověřeny staticky (L2). Regresní testy (L3) přidány
a zelené od 2026-06-15. Runtime ověření (L4) vyžaduje živou infrastrukturu — nepotřebné,
neboť L3 pokrytí je dostatečné pro cílovou hloubku oblasti.
