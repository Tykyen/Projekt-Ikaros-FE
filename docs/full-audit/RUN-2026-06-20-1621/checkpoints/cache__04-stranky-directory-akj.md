# cache / 04-stranky-directory-akj — checkpoint RUN-2026-06-20-1621

> Auditor: agent hloubkové oblasti. HEAD ke dni 2026-06-20. Read-only.
> Metody: M1 (statické čtení), M2 (key-match grep), M-CEN (census mutací post-sweep).

---

## Pokrytí

Prošel jsem:
- `useCreatePage.ts`, `useUpdatePage.ts`, `useDeletePage.ts` (strana mutací)
- `usePage.ts` (factory + dotaz detail)
- `usePagesDirectory.ts`, `usePersonaDirectory.ts`, `usePageMeta.ts`, `usePageBacklinks.ts`
- `useCharacterDirectory.ts`, `characters.types.ts` (factory `charactersQueryKey`)
- `useCharacterMutations.ts` (C-20 protějšek, nová `useSetCalendarColor`, `useUpdateCharacterCalendar`)
- `useFavoritePages.ts` (post-sweep náhrada za zrušený `useFavoritePage.ts`)
- `useUpdateAkjTypes.ts` (AKJ typy settings)
- `useUpdateMember.ts` (AKJ level change)
- `AkjTabsPanel.tsx`, `WithAkjTabs.tsx`, `AkjLockedPanel.tsx` (UI konzumenti AKJ)
- Spec testy: `useCreatePage.spec.tsx`, `useUpdatePage.spec.tsx`, `useDeletePage.spec.tsx`, `useCharacterMutations.spec.tsx`
- git log od 2026-06-05 pro `src/features/world/pages/` — identifikovány post-sweep commity:
  - `8ad8e1ab` (oblíbené per hráč), `477d02ae` (AKJ zamčené záložky), `7cd92c27` (owner AKJ),
  - `6d07dcc1` (PJ identita + currency), `9f2e0c2f` (barvy kalendáře), `a85378b4` (M-TRACE testy)

---

## Dosažená L vs cílová L

| Konzument / mutace | Dosažená L | Cílová L |
|---|---|---|
| C-15 fix (Page CRUD → char dir) | L3 (spec test ✅) | L2+ |
| C-16 fix (backlinks broad) | L3 (spec test ✅) | L2 |
| C-17 fix (meta remove/inval) | L3 (spec test ✅) | L2 |
| C-18 fix (usePage → factory) | L2 | L2 |
| C-19 fix (personaDirectory → factory) | L2 | L2 |
| useFavoritePages (post-sweep) | L2 | L2 |
| useUpdateMember 'akj' → page cache | L1 (read) | L1 |
| useSetCalendarColor (post-sweep) | L2 | L2 |

Celkově: L2–L3 u opravených nálezů, L1 u nových kandidátů.

---

## Nálezy

### C-RUN-04-1 · `KM`/`SC` (dead komentář + mrtvá invalidace) · `useCreatePage`, `useUpdatePage`, `useDeletePage` invalidují `['worlds','slug',worldSlug]` s komentářem „kvůli favoritePageSlugs" — ale zdroj oblíbených se přesunul na `['users','me']`

**Kde:**
- `useCreatePage.ts:51,69` — komentář „favorite slugs se mění" + `invalidate(['worlds','slug',worldSlug])`
- `useUpdatePage.ts:61` — totéž
- `useDeletePage.ts:36` — totéž
- `useFavoritePages.ts:12–15` — komentář potvrzuje: „Nahrazuje zrušený sdílený `world.favoritePageSlugs`"
- `shared/types/index.ts:98` — `favoritePageSlugs` je na `User`, ne na `World`

**Dopad:** Invalidace je **mrtvá pro oblíbené stránky** — `useWorld(worldSlug)` vrací `World` objekt, který `favoritePageSlugs` neobsahuje. Fakticky jde o over-invalidation celého world detailu při každém page CRUD (viz původní D-04-1). Favoriteswse obnovují přes `['users','me']` (mutace `useFavoritePages.setMut` už tento klíč invaliduje → ✅). Případ kdy page je smazána a slug zůstává v favorites: `useFavoritePages` čte `['users','me']` a `FavoritePagesColumn` lookup z `usePagesDirectory` — smazaná stránka zobrazí raw slug (bez titulku). Toto je pravděpodobně by-design.

**Návrh:** Aktualizovat komentáře v page CRUD mutacích (odstranit zmínku o favoritePageSlugs). Zvážit odebrání `invalidate(['worlds','slug',worldSlug])` z page CRUD (favorites tam nejsou; world detail se nemění při editaci stránky) — snížení zbytečných refetchů.

**L1 · 🟡 · 🆕** (překlep resp. outdated komentář + zbytečná invalidace; zdroj dat v pořádku)

---

### C-RUN-04-2 · `FO` (orphan od AKJ member update) · `useUpdateMember` ('akj' field) neinvaliduje `usePage` ani `usePageMeta`

**Kde:**
- `useUpdateMember.ts:29–38` — pole `'akj'` patch, `onSuccess` invaliduje jen `['worlds',worldId,'members']` + `['worlds','my']`
- `usePage.ts:12` — staleTime 30s; `usePageMeta.ts:39` — staleTime 60s

**Dopad:** PJ zvýší hráčovu AKJ úroveň → hráč otevře stránku s accessRequirements → BE vrátí 403 nebo obsah dle nové úrovně, ale **FE cache `usePage` a `usePageMeta` si drží 30s/60s starou odpověď** (403 nebo starý AKJ shield). Hráč musí čekat staleTime nebo F5.

**Trigger:** PJ v MembersTab → AKJ spinner → hráč ve vedlejším tabu stále na AccessDenied s původní hláškou.
**Viditelnost:** Tiše (žádná chyba, jen stale). Workaround: F5 nebo 30–60 s čekání.

**Návrh:** `useUpdateMember` (`field:'akj'`) přidat `invalidate(['pages', worldId])` (prefix celého namespace). Pozn.: toto zasáhne všechny page queries pro daný svět — alternativně invalidovat jen directory a meta prefix `['pages', worldId, 'meta']`.

**L1 · 🟡 · 🆕** (stale za meze staleTime, workaround F5; změna AKJ u membera je vzácná operace)

---

## ✅ Ověřené OK (opravy ze sweepu 2026-06-05 drží v HEAD)

- **C-15** `useCreatePage/UpdatePage/DeletePage` invalidují `['characters',worldId,'directory']` ✅ v kódu i spec testu
- **C-16** `useUpdatePage/DeletePage` invalidují `['pages',worldId,'backlinks']` broad ✅
- **C-17** `useUpdatePage` invaliduje `pagesQueryKey.meta(...)`, `useDeletePage` `removeQueries(meta)` ✅
- **C-18** `usePage` volá `pagesQueryKey.detail(worldId, slug)` factory ✅
- **C-19** `usePersonaDirectory` volá `pagesQueryKey.personaDirectory(worldId)` factory ✅
- **C-20** `useUpdateCharacter/DeleteCharacter/ConvertCharacter` invalidují `['pages',worldId,'directory']` ✅
- **C-22** `useUpdateCharacterCalendar` invaliduje `['calendars-aggregate',worldId]` ✅
- **useSetCalendarColor** (nová post-sweep) invaliduje `['calendars-aggregate',worldId]` + subdoc ✅
- Factory `pagesQueryKey` (usePage.ts:25–36) pokrývá detail/directory/meta/backlinks/personaDirectory ✅
- Factory `charactersQueryKey` (characters.types.ts:245–258) pokrývá directory/detail/subdoc/accounts ✅
- Spec testy: useCreatePage, useUpdatePage, useDeletePage, useCharacterMutations — zelené (dle spec)

---

## PROOF-REQUEST

Živá infrastruktura nepotřebná pro L1–L2 statické nálezy. Níže L3+/M4 nálezy k ověření při nasazení:

| PR# | Co ověřit | Metoda |
|---|---|---|
| PR-04-A | Po zvýšení AKJ úrovně člena (`useUpdateMember 'akj'`) se obnoví `usePage` + `usePageMeta` bez F5 | M4 runtime |
| PR-04-B | Po smazání stránky se slug správně vypadne z FavoritePagesColumn nebo zůstane jako raw slug (by-design ověřit) | M4 runtime |

---

## Souhrn

| Kategorie | Počet |
|---|---|
| Nové nálezy 🆕 | 2× 🟡 |
| Opravy ze sweepu ověřeny ✅ | 10 (C-15..C-22 + nové) |
| Spec testy procházejí | 4 spec soubory |
| Proof-requesty | 2 (L3+/runtime) |
