# Implementační plán 5.2-followup — Osobní oblíbené stránky

**Spec:** [spec-5.2-followup-osobni-oblibene.md](spec-5.2-followup-osobni-oblibene.md)
**Status:** NÁVRH — čeká na potvrzení

Pořadí = závislosti. BE napřed (model + API), pak FE konzumenti, migrace, reorder nakonec. BE a FE se **nemíchají v jedné dávce** ([feedback_no_mixed_be_fe_batch]).

---

## Fáze 1 — BE: nové pole + API (vzor `favoriteCharacters`)
1. `user.schema.ts` — přidat `@Prop({type:Map, of:[String], default:{}}) favoritePageSlugs: Map<string,string[]>`.
2. `users.repository.ts` toEntity — mapovat Map → `Record` (**začít od mapperu**, [project_be_field_checklist]). Reuse helper `toFavoriteCharactersRecord` jako vzor.
3. `user.interface.ts` — `favoritePageSlugs: Record<string,string[]>`.
4. DTO `update-favorite-pages.dto.ts` — `{ slugs: string[] }` (kopie `update-favorite-characters.dto`, cap 100).
5. `users.service.ts` — `setFavoritePages(userId, worldId, slugs)`: ObjectId check, **dedup se zachováním pořadí** (`[...new Set(slugs)]`), prázdné → delete klíč, cap 100. Vrací celou mapu.
6. `users.controller.ts` — `PUT /users/me/favorite-pages/:worldId` (JwtAuthGuard) → `setFavoritePages`. `GET /users/me` už pole vrátí.
7. Jest unit test `setFavoritePages` (pořadí, dedup, cap, delete-on-empty). Ručně `jest` ([feedback_be_precommit_prettier]).
8. **Restart BE** ([feedback_be_restart_required]).

## Fáze 2 — BE: odstranit sdílený `world.favoritePageSlugs`
9. Smazat: `world.schema.ts:35`, `world.interface.ts:67`, `worlds.repository.ts:242` (toEntity), `addFavoriteSlug`/`removeFavoriteSlug` (interface + repo).
10. `pages.service.ts` — smazat `addFavorite`/`removeFavorite`/`findFavorites` (608–686) + jejich testy v `pages.service.spec.ts`.
11. `pages.controller.ts` — smazat routy `POST/DELETE /…/pages/:slug/favorite`; `worlds.controller.ts:492` — smazat `GET /worlds/:worldId/favorites` (+ `worlds.controller.spec.ts`).
12. Typecheck + lint + jest zelené.

## Fáze 3 — FE: typy + hook
13. `shared/types` — User: `favoritePageSlugs?: Record<string,string[]>`; World: **smazat** `favoritePageSlugs`. (`type-sync` skill.)
14. Nový `useFavoritePages(worldId)` (vzor `useFavoriteCharacters`): vrací `{ order: string[], isFavorite, toggle, reorder }`, optimistic na `['users','me']`, PUT `/users/me/favorite-pages/:worldId`.
15. Smazat `useFavoritePage.ts` + `isPageFavorite`.

## Fáze 4 — FE: hvězdička v `PageHeader`
16. `PageHeader.tsx` — **odstranit `canEdit` gate** u hvězdy (viditelná všem členům); stav z `useFavoritePages.isFavorite`, klik → `toggle`. Odstranit závislost na `world.favoritePageSlugs`.
17. Zkontrolovat `PageViewer.tsx:58` (sekundární čtení) — přepojit/odstranit.

## Fáze 5 — FE: dashboard `FavoritePagesColumn`
18. Data z `useFavoritePages` (osobní), title z `usePagesDirectory`, neexistující slug skip.
19. **Drag&drop reorder** přes `@dnd-kit/sortable` (vzor [SortableChannels](../../../src/features/world/chat/components/SortableChannels.tsx)): `DndContext`+`SortableContext` ve sloupci, `useSortable` v položce, `onDragEnd`→`arrayMove`→`reorder`. `DragHandle` reuse.
20. `mobil-desktop` skill (drag touch sensor + layout).

## Fáze 6 — FE: `PagesListPage` „Oblíbené" sekce
21. Filtr + pořadí z osobního `order` (read-only render). Toggle hvězdy = odebrání.

## Fáze 7 — Migrace (one-off skript)
22. `docs/arch/migration-matrix/f-favorites.md` + skript: staré `User.FavoritePagesSlugs` → `User.favoritePageSlugs[matrixWorldId]`, user mapping přes F1, **pořadí zachovat**, odfiltrovat propadlé slugy (proti F4 stránkám), idempotentní.

## Fáze 8 — (nakonec) reorder i v `PagesListPage`
23. Drag&drop do „Oblíbené" sekce (rozhodnutí B — poslední sub-krok).

## Fáze 9 — Uzávěrka
24. `npm run build` zelené ([project_fe_build_preexisting_errors]), FE vitest, BE jest.
25. `napoveda` skill — nová funkčnost pro hráče (osobní oblíbené, hvězda všem).
26. Spec fáze 3: zaškrtnout `roadmap-fe.md`, uzavřít případné dluhy.

---

## Rizika / pozor
- **Breaking odstranění `world.favoritePageSlugs`** — projít všechny FE konzumenty (PageHeader, FavoritePagesColumn, PagesListPage, PageViewer, shared/types). Rešerše je má zmapované.
- **Reorder ≠ Set:** hook musí držet **pole** (pořadí), `isFavorite` jako odvozený Set. Vzor characters drží jen Set → tady odlišnost.
- **Migrace** závisí na F1 mapping účtů a F4 stránkách (musí být hotové — jsou, dle paměti live).
- **Cap 100** — PUT nad limit: oříznout, ne 400 (UX).
