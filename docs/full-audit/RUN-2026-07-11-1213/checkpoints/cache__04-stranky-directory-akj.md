# Cache · 04 — Stránky & directory & AKJ (RUN-2026-07-11-1213)

> READ-ONLY re-audit. Styl: cache-invalidace (TanStack Query v5). Registr: `docs/cache-audit.md` (prefix `C-`).
> Oblastní plán: `cache-plan/04-stranky-directory-akj.md` (C-15…C-19, vše ✅ opraveno v HEAD).

## Dosažená vs cílová L

- **Cílová:** běžné mutace L2+; destruktivní (DEL) L3+; kritické L4.
- **Dosažená:** **L1–L2** (statické čtení M1 + key-match M2; BE `onPageDeleted` potvrzen čtením). Bez runtime (M4) / invalidačního testu (M5).

## Stav známých nálezů (♻️ = potvrzeno opravené, NEhlásit jako nové)

| ID | Stav v HEAD | Důkaz |
|---|---|---|
| **C-15** ♻️ | opraveno | `useCreatePage.ts:68`, `useUpdatePage.ts:40`, `useDeletePage.ts:31` invalidují `['characters',worldId,'directory']` |
| **C-16** ♻️ | opraveno | update `useUpdatePage.ts:44` + delete `useDeletePage.ts:29` invalidují broad `['pages',worldId,'backlinks']` |
| **C-17** ♻️ | opraveno | update `useUpdatePage.ts:46` invalidate meta; delete `useDeletePage.ts:25` `removeQueries(meta)` |
| **C-18** ♻️ | opraveno | `usePage.ts:12` volá `pagesQueryKey.detail(worldId,slug)` (factory) |
| **C-19** ♻️ | opraveno | `pagesQueryKey.personaDirectory()` factory (`usePage.ts:34`), `usePersonaDirectory.ts:18` ji volá |

Templates (create/update/delete) invalidují `worldPageTemplatesQueryKey.all` — ✅ čisté. Favorite star toggle = optimistic na `['users','me']` + `onError` rollback + `onSettled` invalidate — ✅ self-path čistý (`useFavoritePages.ts:47-73`).

## Nálezy (🆕 nové vůči sweepu 2026-06-05)

### 🆕 🟠 C-RUN-04-1 · `FO`/`DEL` · Page delete/rename neinvaliduje `['users','me']` (osobní oblíbené) → mrtvá položka v dashboard sloupci „Oblíbené"
- **Osa:** FO (chybějící konzument) + DEL (stale po destruktivní akci).
- **Kde (mutace):** `useDeletePage.ts:14` a `useUpdatePage.ts:35` (rename slug) — invalidují directory/characters/backlinks/meta/`['worlds','slug',worldSlug]`, **ale ne `['users','me']`**.
- **Kde (konzument):** favorites přesunuty (5.2-followup) z `world.favoritePageSlugs` na **`User.favoritePageSlugs`** (`shared/types/index.ts:124`), čteno přes `useFavoritePages` → `['users','me']` (`useFavoritePages.ts:37,54`, `useMyProfile` staleTime 30s `auth/api/useAuth.ts:221`). Render: `FavoritePagesColumn.tsx:87-151` mapuje `order` **NEfiltrovaně** přes directory (`titleBySlug.get(slug) ?? slug`, link `/svet/{worldSlug}/{slug}`).
- **BE kontext:** `onPageDeleted → pullFavoritePageSlug` (`backend/users.service.ts:974-981`, `users.repository.ts:93` `$pull`; CD-08) prořezává slug ze všech uživatelů **jen při DELETE**. Rename (slug change) BE neprořezává.
- **Dopad / trigger:** smažu (nebo přejmenuji) oblíbenou stránku → v dashboard sloupci „Oblíbené" zůstane **mrtvá položka** (titulek = holý slug, klik → 404). **Viditelnost:** tichá, klik = 404. **Workaround:** DELETE se sám zahojí po refetch `['users','me']` (staleTime 30s + mount/focus — BE data už prořezaná); **RENAME přežije trvale** (BE nereconciluje starý slug, FE neinvaliduje). Cross-user (PJ smaže hráčovu oblíbenou) = žádná WS → hráčův `['users','me']` se neobnoví, dokud sám nemutuje / neztratí focus.
- **Návrh:** `useDeletePage`/`useUpdatePage` `onSuccess` doplnit `invalidate(['users','me'])`; `FavoritePagesColumn` filtrovat `order` na sluggy přítomné v `directory` (robustnost proti mrtvým/rename slugům). Rename-reconcile na BE = cross-ref cascade/db-integrity.
- **L:** L2 (key-match + BE `onPageDeleted` potvrzen čtením).

### 🆕 🟡 C-RUN-04-2 · `KM`/`SC` · Page CRUD invaliduje mrtvý favorites zdroj (`['worlds','slug']`) a míjí živý (`['users','me']`)
- **Osa:** SC (over-invalidace) + KM (drift komentáře).
- **Kde:** `useCreatePage.ts:71`, `useUpdatePage.ts:60`, `useDeletePage.ts:35` invalidují `['worlds','slug',worldSlug]` s komentářem „Favorite slug…" / „favoritePageSlugs se mění…". Po 5.2-followup ale `favoritePageSlugs` **už na World není** (přesun na User, `shared/types/index.ts:124`).
- **Dopad:** invalidace celého world-detail-by-slug při **každé** editaci obsahu stránky je teď **bezúčelná** over-invalidace (D-04-1 latentní 🟡 se zhoršil — mizí i deklarovaný důvod) a **zavádějící komentář**. Bezpečné (jen zbytečný refetch), ale zápis míří na špatný klíč a ten správný (`['users','me']`, viz C-RUN-04-1) chybí.
- **Návrh:** nahradit favorite-motivovanou `['worlds','slug']` invalidaci za `invalidate(['users','me'])`, nebo ji zrušit, pokud world-detail favorites už nedrží. Ověřit, zda `['worlds','slug']` refresh neslouží ještě jinému účelu (počet stránek?).
- **L:** L2.

### 🆕 🟡 C-RUN-04-3 · `FO` (cross-area 03) · `useUpdateAkjTypes` neinvaliduje page meta (AKJ shield label)
- **Kde:** `features/world/api/useUpdateAkjTypes.ts:17` invaliduje jen `['worlds',worldId,'settings']`.
- **Konzument:** `usePageMeta` → `shieldedBy[].akjLabel`/`level` (AKJType resolved z WorldSettings) na AccessDenied (`usePageMeta.ts:39`, `pages.types.ts:252`).
- **Dopad:** PJ přejmenuje/přečísluje AKJType → na AccessDenied screenu drží starý label/úroveň do meta staleTime 60s. Sibling C-17. **Viditelnost:** jen ne-oprávněný, mění se zřídka. **Workaround:** 60s / F5.
- **Návrh:** `useUpdateAkjTypes` doplnit `invalidate(['pages',worldId,'meta'])` (broad). Nízká priorita, patří spíš do oblasti 03.
- **L:** L1.

## Pokrytí

- **Mutace v záběru (8+):** create/update/delete page ✅ · favorite toggle/reorder ✅ · 3× template ✅ — všechny čteny. Navíc `useUpdateAkjTypes` (cross-area, meta konzument).
- **Konzumenti:** directory, persona directory (prefix-match ✅), detail, meta, backlinks, char directory (legacy sidebar), **favorites (NOVĚ `['users','me']`)**, templates.
- **Nová mutace stránek (reorder/move):** grep bez samostatného page-order endpointu (order jde přes PATCH page) — nic nového.
- **WS:** pages bez real-time push (grep `page-created/updated/deleted` = 0) — konzistentní s C-04, není broken invalidace.
- **M-CEN:** všech 8 page/template mutací má ≥1 cache efekt — čistý.

## PROOF-REQUESTy

- **PR-1 (M5, C-RUN-04-1):** vitest — spy na `invalidateQueries` v `useDeletePage`/`useUpdatePage`; assert pokrytí `['users','me']` (dnes chybí).
- **PR-2 (M4, C-RUN-04-1):** runtime — smaž oblíbenou stránku, ověř mizení z dashboard sloupce „Oblíbené" bez F5; rename → ověř, zda dead entry přežije.
- **PR-3 (cross-ref):** BE rename-reconcile favoritePageSlugs (starý→nový slug) — patří do cascade-delete / db-integrity auditu (`onPageUpdated` handler neexistuje).
