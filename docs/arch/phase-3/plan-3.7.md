# Plán 3.7 — Oblíbené: globální obsah (články / diskuze / obrázky)

**Spec:** [spec-3.7.md](spec-3.7.md) — schválena 2026-05-16
**Pořadí:** BE (schéma → repo → 3 moduly → testy) → FE (typy → hooky → komponenty →
nasazení → sidebar → stránka+router → testy).

---

## Frontend-design audit (verdikt)

Tři nové prvky v appce s 21 motivy → priorita **restraint + konzistence**, ne
distinktivní vizuál. Závěr:

- **Žádné nové theme tokeny, žádné nové fonty.** Vše přes stávající `var(--*)`,
  jinak by prvky vypadaly v některém z 21 motivů cize.
- **`FavoriteToggle` / `PinToggle`** — reuse vzoru tlačítka `s.toggleBtn`
  z `DiscussionDetailPage` ([ř. 142-150](../../../src/features/ikaros/pages/DiscussionDetailPage.tsx#L142)).
  Stav (oblíbené / připnuto) = `fill` na lucide ikoně + `var(--accent)`.
- **Jediný povolený micro-moment:** při zapnutí jemný „pop" ikony — `transform:
  scale(1.15)` přes `transition` 120 ms, CSS-only, žádná animační knihovna.
  High-impact, levné, nerozbíjí motivy.
- **`FavoritesPage`** — taby reuse vzoru z `HelpPage` (`role="tablist"`,
  `s.tab` / `s.tabActive`), mřížka reuse existujících karet. Vlastní `.module.css`
  jen pro layout (grid, tab kontejner), žádné barvy.
- Vlastní `.module.css` u všech tří = ano (layout), ale postavené 100 % na tokenech.

---

## BE — `Projekt-ikaros`

### B1. User schéma + interface — 5 polí

`backend/src/modules/users/schemas/user.schema.ts` — za ř. 39
(`favoriteDiscussionIds`):
```ts
@Prop({ type: [String], default: [] }) favoriteArticleIds: string[];
@Prop({ type: [String], default: [] }) favoriteGalleryIds: string[];
@Prop({ type: [String], default: [] }) pinnedDiscussionIds: string[];
@Prop({ type: [String], default: [] }) pinnedArticleIds: string[];
@Prop({ type: [String], default: [] }) pinnedGalleryIds: string[];
```

`backend/src/modules/users/interfaces/user.interface.ts` — za ř. 49 stejných 5
polí jako `string[]`.

### B2. `users.repository.ts` — `toEntity` mapování

⚠️ Kritické — bez toho favorites/pin tiše nefungují (dluh z 3.5). Za ř. 222
(`favoriteDiscussionIds: (doc.favoriteDiscussionIds as string[]) ?? []`):
```ts
favoriteArticleIds: (doc.favoriteArticleIds as string[]) ?? [],
favoriteGalleryIds: (doc.favoriteGalleryIds as string[]) ?? [],
pinnedDiscussionIds: (doc.pinnedDiscussionIds as string[]) ?? [],
pinnedArticleIds: (doc.pinnedArticleIds as string[]) ?? [],
pinnedGalleryIds: (doc.pinnedGalleryIds as string[]) ?? [],
```
`update()` je generická → `usersRepo.update(userId, { pinnedArticleIds: [...] })`
projde do `$set` bez dalších změn.

### B3. `ikaros-articles` — controller + service

**Service** (`ikaros-articles.service.ts`) — 3 metody, vzor `discussions.service.ts:325`:

```ts
async toggleFavorite(articleId, userId): Promise<{ isFavorite: boolean }>
```
- `usersRepo.findById` → 404 `USER_NOT_FOUND` když chybí.
- Ověřit existenci článku (`repo.findById(articleId)`) → 404 jinak.
- Toggle `favoriteArticleIds`. **Cascade:** když se odebírá z favorites, odeber
  `articleId` i z `pinnedArticleIds` (jeden `update` se dvěma poli).
- Vrátí `{ isFavorite: !wasFavorite }`.

```ts
async togglePin(articleId, userId): Promise<{ isPinned: boolean }>
```
- Najít usera (404), ověřit existenci článku (404).
- **Guard 1:** `articleId ∈ favoriteArticleIds` → jinak `ConflictException`
  `{ code: 'NOT_FAVORITE', message: 'Připnout lze jen oblíbenou položku' }`.
- **Guard 2:** pokud se připíná (není v `pinnedArticleIds`) a
  `pinnedArticleIds.length >= 5` → `ConflictException`
  `{ code: 'PIN_LIMIT', message: 'Připnout lze max 5 článků' }`.
- Toggle `pinnedArticleIds`, vrátí `{ isPinned: !wasPinned }`.

```ts
async findMyFavorites(userId): Promise<IkarosArticle[]>
```
- Vzor `discussions.service.ts:157` — `repo.findByIds(user.favoriteArticleIds)`.
  `findByIds` vrací jen existující → osiřelé id se vynechá.

**Controller** (`ikaros-articles.controller.ts`) — 3 endpointy, vzor `rate` (ř. 157):
```ts
@Get('my-favorites') @UseGuards(JwtAuthGuard) @ApiBearerAuth()
findMyFavorites(@CurrentUser() user: RequestUser)
  → service.findMyFavorites(user.id)

@Post(':id/toggle-favorite') @UseGuards(JwtAuthGuard) @ApiBearerAuth()
toggleFavorite(@Param('id') id, @CurrentUser() user)
  → service.toggleFavorite(id, user.id)

@Post(':id/toggle-pin') @UseGuards(JwtAuthGuard) @ApiBearerAuth()
togglePin(@Param('id') id, @CurrentUser() user)
  → service.togglePin(id, user.id)
```
⚠️ `my-favorites` route deklarovat **před** `:id` routami, ať `my-favorites`
nespadne do `:id` parametru (NestJS řadí podle pořadí deklarace).

### B4. `ikaros-gallery` — controller + service

Identické s B3 nad poli `favoriteGalleryIds` / `pinnedGalleryIds`, návratový
typ `IkarosGalleryItem[]`. Hlášky: „obrázek" / „max 5 obrázků".

### B5. `ikaros-discussions` — doplnění pin

`toggle-favorite` + `my-favorites` už existují. Přidat:
- **Service** `togglePin(discussionId, userId)` — stejné dva guardy, pole
  `pinnedDiscussionIds`. Hláška „max 5 diskuzí".
- **Service** `toggleFavorite` (ř. 325) — doplnit **cascade**: při odebrání
  z `favoriteDiscussionIds` odebrat id i z `pinnedDiscussionIds`.
- **Controller** `@Post(':id/toggle-pin')` — vzor stávajícího `toggle-favorite`.

### B6. BE testy

Per modul `*.service.spec.ts` (vzor `discussions.service.spec.ts`):
- `toggleFavorite` přidá/odebere id; odebrání → cascade odepnutí z `pinned*`.
- `togglePin` — happy path; ne-favorite → `ConflictException` `NOT_FAVORITE`;
  6. pin → `ConflictException` `PIN_LIMIT`.
- `findMyFavorites` — vrací jen existující obsah; prázdné pole → `[]`.
- 404 na neexistující id.
Diskuze: nový `togglePin` blok + 1 test cascade v `toggleFavorite`.

### B7. Ověření BE

`npm test` v `backend/`.

---

## FE — `Projekt-ikaros-FE`

### F1. `shared/types/index.ts`

Rozšířit `User` o (vše `?: string[]`):
`favoriteArticleIds`, `favoriteGalleryIds`, `pinnedDiscussionIds`,
`pinnedArticleIds`, `pinnedGalleryIds`.
Přidat:
```ts
export interface ToggleFavoriteResponse { isFavorite: boolean; }
export interface TogglePinResponse { isPinned: boolean; }
```

### F2. Hooky

**`useArticles.ts`** — přidat (vzor `useToggleFavoriteDiscussion`,
[useDiscussions.ts:139](../../../src/features/ikaros/api/useDiscussions.ts#L139)):
```ts
useMyFavoriteArticles(enabled)  // GET /ikaros-articles/my-favorites
                                // queryKey [...ARTICLES_KEY,'favorites']
useToggleFavoriteArticle()      // POST :id/toggle-favorite
useTogglePinArticle()           // POST :id/toggle-pin
```
`onSuccess` obou mutací: invalidovat `[...ARTICLES_KEY,'favorites']` **a**
auth/me query (pinned ids jsou na `User`) — viz F2a.

**`useGallery.ts`** — `useMyFavoriteGallery`, `useToggleFavoriteGallery`,
`useTogglePinGallery` (analogicky, `GALLERY_KEY`).

**`useDiscussions.ts`** — `useMyFavoriteDiscussions`, `useTogglePinDiscussion`
(`useToggleFavoriteDiscussion` už je — doplnit do něj invalidaci favorites klíče
+ auth/me).

#### F2a. Refresh `currentUser` po toggle-pin/favorite

⚠️ K ověření při implementaci: jak se plní `currentUserAtom` (jotai). Pinned/
favorite ids jsou na `User` → po toggle musí FE `currentUser` obnovit, jinak
sidebar ukazuje starý stav. Postup: najít auth query klíč (pravděp.
`['auth','me']`) a v `onSuccess` mutací ho invalidovat; pokud `currentUser`
nejede přes React Query, doplnit explicitní refetch usera. **Bez tohoto kroku
připnutí vizuálně nefunguje.**

### F3. Komponenta `<FavoriteToggle>`

`src/features/ikaros/components/FavoriteToggle.tsx` + `.module.css`:
```tsx
interface Props {
  isFavorite: boolean;
  onToggle: () => void;
  pending?: boolean;
  variant?: 'button' | 'icon';   // default 'button'
}
```
- Ikona `Bookmark` z `lucide-react`; `fill="currentColor"` když `isFavorite`.
- `variant='button'` → `<button>` ikona + „Oblíbené", reuse stylu `s.toggleBtn`.
- `variant='icon'` → jen ikona, kompaktní, `aria-label="Oblíbené"`.
- `aria-pressed={isFavorite}`, `disabled={pending}`.
- CSS „pop": `.icon { transition: transform 120ms } .iconActive { transform: scale(1.15) }`.

### F4. Komponenta `<PinToggle>`

`src/features/ikaros/components/PinToggle.tsx` + `.module.css`:
```tsx
interface Props {
  isPinned: boolean;
  onToggle: () => void;
  pending?: boolean;
  disabled?: boolean;   // limit 5 dosažen a tato položka není připnutá
}
```
- Ikona `Pin` z `lucide-react`; `fill` + jemná rotace (`rotate(-20deg)`) když připnuto.
- `disabled` → `title="Připnout lze max 5 — nejdřív něco odepni"`, `cursor: not-allowed`.
- `aria-pressed={isPinned}`.

### F5. Nasazení `<FavoriteToggle>`

| Soubor | Změna |
|---|---|
| `DiscussionDetailPage.tsx` | **Refactor** — favorite `<button>` (ř. 151-167) → `<FavoriteToggle variant="button">`. `toggleFav` hook beze změny. `Star` import pryč. |
| `ArticleDetailPage.tsx` | Přidat `<FavoriteToggle variant="button">` do akční zóny detailu (vedle Owner/Admin akcí, ~ř. 124). Hook `useToggleFavoriteArticle`. |
| `GalleryDetailPage.tsx` | `<FavoriteToggle variant="button">` k akcím detailu (~ř. 88). Hook `useToggleFavoriteGallery`. |
| `ArticlesPage.tsx` (`ArticleCard`) | `<FavoriteToggle variant="icon">` do `cardHeader` (ř. 264). ⚠️ Karta je `<Link>` → `onClick` toggle musí `e.preventDefault(); e.stopPropagation()`, jinak klik otevře detail. |
| `GalleryCard.tsx` | `<FavoriteToggle variant="icon">` jako overlay roh `figure`. Karta je `<Link>` nebo `<button onOpen>` → stejný `preventDefault/stopPropagation`. |

`isFavorite` stav: odvodit z `currentUser.favorite*Ids?.includes(item.id)`.

### F6. Sidebar `IkarosLayout.tsx`

`RightPanel` (ř. 221+):
1. Hooky: `useMyFavoriteArticles`, `useMyFavoriteGallery`, `useMyFavoriteDiscussions`
   — všechny `enabled: !!currentUser`.
2. Helper `pinnedFirst(items, pinnedIds)` — vrátí připnuté (pořadí dle `pinnedIds`),
   a když je `pinnedIds` prázdné → prvních 5 `items` (fallback §4.7 spec).
   Výsledek `.slice(0, 5)`.
3. Tři sekce — vzor „Moje světy" (ř. 259-280):
   - **„Oblíbené diskuze"** (`data-section-key="oblibene-diskuze"`) — NOVÁ, vložit
     za „Moje diskuze" (ř. 288). Položky → `Link` na `/ikaros/diskuze/:id`.
   - **„Oblíbené články"** (ř. 290) — nahradit placeholder; `Link` na
     `/ikaros/clanky/:id`.
   - **„Oblíbené obrázky"** (ř. 297) — nahradit; malý náhled (`cloudinaryThumb`) + název.
4. Každá sekce: prázdno → `s.emptyHint` „Žádné oblíbené"; když je oblíbených > 0
   → `s.showAllLink` „Zobrazit vše →" na `/ikaros/oblibene?typ=<diskuze|clanky|obrazky>`.

### F7. Stránka `FavoritesPage` + route

`src/features/ikaros/pages/FavoritesPage.tsx` + `.module.css`:
- `useSearchParams` `?typ=` — vzor `HelpPage` (`?sekce=`). Hodnoty
  `diskuze` (default) / `clanky` / `obrazky`; neznámá → default. `replace: true`.
- Taby `role="tablist"` — 3 tlačítka, `s.tab` / `s.tabActive`.
- Obsah tabu: `useMyFavorite*` → mřížka karet (`ArticleCard` / `GalleryCard` /
  karta diskuze). Každá karta + `<PinToggle>`.
- `disabled` na `PinToggle`: `pinnedCount >= 5 && !isPinned` (pro aktivní typ).
- Prázdný tab → „V oblíbených zatím nic nemáš".

`src/app/router.tsx` — přidat (vzor diskuze, ř. 154):
```ts
const FavoritesPage = lazy(() => import('@/features/ikaros/pages/FavoritesPage'));
{ path: 'ikaros/oblibene', element: p(FavoritesPage), loader: requireAuth },
```

### F8. FE testy

- `FavoriteToggle.spec.tsx` — render obou variant; `isFavorite` ↔ `fill`;
  `pending` → disabled; klik volá `onToggle`.
- `PinToggle.spec.tsx` — `isPinned` stav; `disabled` blokuje klik + má `title`.
- `FavoritesPage.spec.tsx` — taby render; `?typ=` sync; neznámý typ → default;
  prázdný stav.
- Hook testy — toggle mutace invaliduje správné klíče.
- `IkarosLayout.spec.tsx` — sekce render připnutých / fallback / prázdno; anonym.
- `lint`, `lint:colors`, `test:run`, `tsc`, `build`.

---

## Po implementaci

1. **`mobil-desktop`** skill — sidebar drawer, `variant="icon"` na kartách,
   stránka Oblíbené (taby + mřížka) na ≤ 768 px.
2. **`napoveda`** skill — nová stránka `/ikaros/oblibene` → doplnit do sekce
   „Stránky" v `/ikaros/napoveda`.
3. **Roadmap** — zaškrtnout 3.7 v `docs/roadmap-fe.md`, doplnit shrnutí.
4. Spec `spec-3.7.md` — Status → ✅ Hotovo.
5. Commit do `main` v obou repech (konvence 3.x).

---

## Odhad

| Část | Soubory | Řádky |
|---|---|---|
| BE | 9 + 3 testy | ~220 |
| FE | 14 + 5 testů | ~420 |

---

## Otevřené body k ověření během implementace

- **F2a** — mechanismus refresh `currentUserAtom` po toggle-pin/favorite.
  Pokud `currentUser` nejede přes React Query, řešit explicitním refetchem.
- Existují `ikaros-articles.service.spec.ts` / `ikaros-gallery.service.spec.ts`?
  Pokud ne, založit (vzor `discussions.service.spec.ts`).
- Karta diskuze pro `FavoritesPage` — existuje samostatná komponenta, nebo se
  diskuze v seznamu renderují inline? Podle toho buď reuse, nebo lehká karta.
