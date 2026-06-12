# Spec 5.2-followup — Osobní oblíbené stránky (per hráč, per svět)

**Status:** NÁVRH — čeká na schválení
**Navazuje na:** [spec-5.2.md](spec-5.2.md) (dashboard světa), krok 7 (stránky/PageViewer), migrace matrix
**Datum:** 2026-06-12

---

## 1. Účel a problém

Krok 5.2 zavedl „oblíbené stránky" jako `world.favoritePageSlugs` — **jeden sdílený seznam per svět, kurátorovaný PJ** (N-36, jen PomocnyPJ+ smí měnit, hvězdička viditelná jen jim). To **neodpovídá záměru**: každý hráč má mít **svůj osobní seznam** oblíbených stránek v rámci světa, který si sám spravuje.

Starý Matrix to tak měl (`User.FavoritePagesSlugs`, per uživatel, toggle/reorder). Migrace Ikara tuto featuru vynechala a Ikaros pro ni nemá datový model.

**Rozhodnutí uživatele (brainstorming 2026-06-12):**
1. Sdílený PJ seznam (`world.favoritePageSlugs`) **se ruší a maže** — fakticky se nepoužívá.
2. Toggle **hvězdičkou na stránce**, dostupný **všem členům** (hráč i PJ), ukládá do osobního seznamu.
3. **Reorder** přetahováním / šipkami.
4. **Domigrovat** stará data (`User.FavoritePagesSlugs`) pro svět matrix.

---

## 2. Vzor a princip

Featura **kopíruje hotový mechanismus oblíbených postav** (`User.favoriteCharacters: Map<worldId, slug[]>`, D-074), s jediným rozdílem: **pořadí pole je významné** (reorder). Žádné vymýšlení od nuly.

| | Oblíbené postavy (vzor) | Oblíbené stránky (nová) |
|---|---|---|
| Úložiště | `User.favoriteCharacters: Map<worldId, slug[]>` | `User.favoritePageSlugs: Map<worldId, slug[]>` |
| API | `PUT /users/me/favorite-characters/:worldId {slugs[]}` | `PUT /users/me/favorite-pages/:worldId {slugs[]}` |
| Sémantika | replace-all, pořadí nevýznamné | replace-all, **pořadí = pořadí zobrazení** |
| Čtení | součást `GET /users/me` | součást `GET /users/me` |
| FE hook | `useFavoriteCharacters` (Set) | `useFavoritePages` (ordered array + Set) |
| Toggle UI | hvězda na `CharacterCard` | hvězda v `PageHeader` |
| Seznam | „Oblíbené" sekce v `CharacterDirectory` | dashboard sloupec + `PagesListPage` sekce |

---

## 3. Datový model

### 3.1 Nové pole (BE)
`user.schema.ts` — nové pole vedle `favoriteCharacters`:
```ts
@Prop({ type: Map, of: [String], default: {} })
favoritePageSlugs: Map<string, string[]>;   // worldId → slug[] (pořadí významné)
```
- `users.repository.ts` toEntity → `Record<string, string[]>` (stejný mapper jako `favoriteCharacters`, viz [be-field-checklist](../../../MEMORY.md)).
- FE `shared/types` User: `favoritePageSlugs?: Record<string, string[]>`.

### 3.2 Rušené (BE) — `world.favoritePageSlugs` a vše kolem
Odstranit (rozhodnutí 1):
- `world.schema.ts:35`, `world.interface.ts:67`, `worlds.repository.ts:242` (toEntity), FE `World.favoritePageSlugs`.
- repo: `addFavoriteSlug` / `removeFavoriteSlug` (worlds-repository).
- service: `PagesService.addFavorite` / `removeFavorite` / `findFavorites` (N-36).
- routy: `POST/DELETE /worlds/:worldId/pages/:slug/favorite`, `GET /worlds/:worldId/favorites`.
- FE: `useFavoritePage.ts`, `isPageFavorite`.

⚠️ Stará `world.favoritePageSlugs` data v DB se ignorují (uživatel potvrdil, že fakticky neexistují). Cleanup pole z dokumentů světa volitelně v migraci.

---

## 4. API (BE)

| Metoda | Cesta | Guard | Tělo / efekt |
|---|---|---|---|
| `PUT` | `/users/me/favorite-pages/:worldId` | JwtAuthGuard | `{ slugs: string[] }` → replace-all pořadí pro `(user, worldId)`. Vrací `{ favoritePageSlugs: Record<worldId, slug[]> }`. |

- Service `setFavoritePages(userId, worldId, slugs)` — vzor `setFavoriteCharacters`: validace worldId (ObjectId), **dedup při zachování pořadí** (`[...new Set(slugs)]`), prázdné pole → smaže klíč, cap **100** slugů/svět.
- **Žádný PJ gate** — osobní akce každého přihlášeného. Žádný membership check (vzor favoriteCharacters; neexistující slugy se odfiltrují až při čtení proti directory → neškodné).
- Toggle i reorder jdou přes **tentýž PUT** (FE pošle celé přeskládané/upravené pole).

---

## 5. Frontend

### 5.1 Hook `useFavoritePages(worldId)`
Vzor `useFavoriteCharacters`, ale vrací **uspořádané pole** (kvůli reorder):
```ts
{
  order: string[];                 // oblíbené slugy v pořadí
  isFavorite: (slug) => boolean;   // Set lookup
  toggle: (slug) => void;          // přidá na konec / odebere → PUT
  reorder: (next: string[]) => void; // přeskládá → PUT
}
```
- Optimistic update na `['users','me']` (vzor favoriteCharacters), rollback, invalidace `onSettled`.
- localStorage migrace **netřeba** (vzniká rovnou na BE).

### 5.2 Hvězdička v `PageHeader`
- **Odstranit `canEdit` (PomocnyPJ+) gate** — hvězda viditelná **všem členům**.
- Číst stav z `useFavoritePages(worldId).isFavorite(slug)`, klik → `toggle(slug)`.
- Nahradit dosavadní `useFavoritePage` / `world.favoritePageSlugs`.

### 5.3 Dashboard `FavoritePagesColumn`
- Číst z `useFavoritePages` (osobní), ne `world.favoritePageSlugs`.
- Title resolvovat z `usePagesDirectory`; neexistující slug přeskočit.
- **Reorder = drag&drop přes `@dnd-kit/sortable`** (vzor [SortableChannels.tsx](../../../src/features/world/chat/components/SortableChannels.tsx) + `DragHandle`; `DndContext` v rodiči, `useSortable` v položce). dnd-kit `KeyboardSensor` pokrývá klávesovou a11y → zvlášť šipky netřeba. `onDragEnd` → `arrayMove` → `reorder(next)`.
- Empty stav: „Zatím žádné oblíbené. Označ stránky hvězdičkou."

### 5.4 `PagesListPage` „Oblíbené" sekce
- Filtrovat podle osobního `order` (ne world pole), zobrazit v pořadí dle `order`.
- Reorder zde **až jako poslední sub-krok** (rozhodnutí B) — zprvotně read-only render v pořadí.

---

## 6. Migrace (svět matrix)

Nová fáze (detail v `docs/arch/migration-matrix/f-favorites.md` při impl):
- Zdroj: starý `User.FavoritePagesSlugs: string[]` (per uživatel; fakticky pro jediný svět).
- Mapování: starý uživatel → Ikaros `userId` (přes F1 účet mapping), `worldId` = svět matrix.
- Slugy: **zachovat pořadí**, odfiltrovat na stránky existující po F4 migraci (zbytek zahodit — propadlé).
- Zápis do `User.favoritePageSlugs[matrixWorldId]`. Idempotentní (re-run přepíše).

---

## 7. Role / oprávnění (auth-leak-policy)

| Akce | Kdo |
|---|---|
| Toggle hvězdičky / PUT favorit | každý přihlášený (osobní data, izolovaná per user) |
| Vidět svůj seznam | jen vlastník (čte se z `/users/me`) |
| Vidět cizí seznam | **nelze** (není endpoint) |

Hvězda se nezobrazí non-memberům/anonymům (PageViewer je už member-gated). Žádný PJ ani cross-user přístup.

---

## 8. Edge cases
- **Smazaná oblíbená stránka** → při čtení se neresolvuje z directory → tiše přeskočit (jako dnes dashboard).
- **Cap 100/svět** → PUT nad limit odmítnout (400) nebo oříznout; vzor characters má 200, stránek bude méně.
- **Dedup** zachovává první výskyt (pořadí).

## 9. Mimo rozsah
- Sdílení oblíbených mezi hráči / PJ kurátorský seznam (zrušen, ne nahrazen jinou formou).
- Oblíbené napříč světy v jednom přehledu (per-svět zůstává).

## 10. Akceptační kritéria
1. Hráč klikne hvězdu na stránce → stránka v **jeho** seznamu; jiný hráč/PJ má **svůj** nezávislý.
2. Dashboard pravý sloupec ukazuje **můj osobní** seznam, ne PJ.
3. Reorder (šipky i drag) persistuje napříč reloadem a zařízeními.
4. Stará matrix data domigrována na správné účty, ve správném pořadí, bez propadlých slugů.
5. `world.favoritePageSlugs` a všechny jeho routy/hooky odstraněny; build + testy zelené.

---

## 11. Rozhodnutí (schváleno 2026-06-12)
- **A) Reorder = drag&drop** přes `@dnd-kit/sortable` (vzor SortableChannels). Klávesová a11y zdarma z dnd-kit `KeyboardSensor`; samostatné šipky se nedělají.
- **B) Reorder primárně v dashboard sloupci.** `PagesListPage` „Oblíbené" sekce dostane reorder **až jako poslední sub-krok** (do té doby read-only render v pořadí).
- **C) Migrace = samostatný one-off skript** jako ostatní F fáze (`docs/arch/migration-matrix/f-favorites.md`).
