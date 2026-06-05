# 10 — Ikaros platforma

> **Sweep 2026-06-05.** Cache-invalidation inventura (TanStack Query v5). Read-only.
> Osy: `FO` `CR` `KM` `CB` · perspektivy P1 (konzumentská inventura) + P5 (delete/orphan) + P7 (dual-cache atom).
> Soubory: `src/features/ikaros/api/` (articles, discussions, gallery, categories, news, events) + konzumenti `…/pages/` + review renderery.
> Nálezy → [`../cache-audit.md`](../cache-audit.md) (`C-37…C-44`).
> **Stav: ✅ hotovo — 6 nálezů (C-38…C-41 🟠, C-37/C-42 🟡) + 2 latentní/VERIFY (D-10-x) + census flag.**

---

## 1. Konzumentská inventura (P1)

### Články (`['articles']` namespace + `['article-reads']` + `['pending-actions']` + jotai atom)

| Zdroj / entita | `queryKey` | role | staleTime / enabled | soubor:řádek |
|---|---|---|---|---|
| Published list (+pending admin) | `['articles','all']` | seznam Přehled + AuthorSidebar + MoreFromAuthor | 30s | [useArticles.ts:18](../../src/features/ikaros/api/useArticles.ts#L18) |
| Moje | `['articles','my']` | tab Moje | dflt; enabled | [useArticles.ts:27](../../src/features/ikaros/api/useArticles.ts#L27) |
| Detail | `['articles','detail',id]` | detail stránka + editor hydratace | dflt; `!!id` | [useArticles.ts:36](../../src/features/ikaros/api/useArticles.ts#L36) |
| Stats | `['articles','stats']` | MyStatsWidget (6 metrik) | dflt | [useArticles.ts:45](../../src/features/ikaros/api/useArticles.ts#L45) |
| Read-status (per id) | `['article-reads','status',id]` | „Nepřečteno" badge na kartě + MarkAsReadObserver | 60s | [useArticles.ts:157](../../src/features/ikaros/api/useArticles.ts#L157) |
| Unread-count badge | `['article-reads','unread-count']` | badge nepřečtených (pravý panel — povrch) | 30s | [useArticles.ts:169](../../src/features/ikaros/api/useArticles.ts#L169) |
| Oblíbené | `['articles','favorites']` | FavoritesPage tab + sidebar `FavoriteSection` | 20s | [useArticles.ts:192](../../src/features/ikaros/api/useArticles.ts#L192) |
| Kategorie | `['article-categories']` | filtr chips + CategoryPicker + review Left | 5 min | [useArticleCategories.ts:8](../../src/features/ikaros/api/useArticleCategories.ts#L8) |
| **Review fronta** | `['pending-actions',type,page,limit]` + `['pending-actions','count']` | Zpracovat tab + nav badge (clanky/galerie/diskuze) | 30s | [usePendingActions.ts:16,34](../../src/features/users/api/usePendingActions.ts#L16) |
| **jotai** `currentUserAtom` | (mirror `['users','me']`) | `favoriteArticleIds`/`pinnedArticleIds` → ArticleDetail/Card/sidebar pin stav | hydratace přes useEffect | [authStore.ts:7](../../src/shared/store/authStore.ts#L7) |

### Galerie / Diskuze / Novinky / Akce (analogicky)

| Zdroj | `queryKey` | role | soubor:řádek |
|---|---|---|---|
| Galerie all/my/detail/stats/favorites | `['gallery',…]` | seznam/detail/MyStats/Favorites/sidebar | [useGallery.ts:18…167](../../src/features/ikaros/api/useGallery.ts#L18) |
| Gallery kategorie | `['gallery-categories']` | filtr + review Left | [useGalleryCategories.ts:8](../../src/features/ikaros/api/useGalleryCategories.ts#L8) |
| Diskuze all/paginated/detail/posts/members/favorites | `['discussions',…]` | seznam/detail/vlákno/manage panel/Favorites | [useDiscussions.ts:28…167](../../src/features/ikaros/api/useDiscussions.ts#L28) |
| Novinky public / list / count | `['ikaros-news']` · `['ikaros-news','list',params]` · `['ikaros-news','count',scope]` | dashboard widget · NovinkyPage list · tab badges | [useIkarosNews.ts:22,41,61](../../src/features/ikaros/api/useIkarosNews.ts#L22) |
| Akce list / upcoming | `['ikaros-events']` · `['ikaros-events','upcoming',limit]` | AkcePage kalendář/seznam · dashboard widget | [useIkarosEvents.ts:12,23](../../src/features/ikaros/api/useIkarosEvents.ts#L12) |

> **P7 most:** favorites/pin mutace invalidují `['users','me']` (pinned/favorite ids žijí na User).
> `useCurrentUserHydration` ([useAuth.ts:139](../../src/features/auth/api/useAuth.ts#L139)) je mounted globálně v layoutu,
> drží `['users','me']` query → po invalidaci refetch → `useEffect` přepíše `currentUserAtom`. Most **funguje**
> (na rozdíl od typického dual-cache rizika), atom se obnoví. Sidebar pin/fav stav i detail-page toggle se synchronizují.

---

## 2. Mutace × konzument matice

Namespace invalidace prefix-matchuje **všechny** sub-klíče téhož namespace (P2 ověřeno: `['articles']` trefí
`all`/`my`/`detail`/`stats`/`favorites`). Sloupce = **mimo-namespace** konzumenti, kde fan-out selhává.

| Mutace (soubor:řádek) | own-NS (list/detail/stats/fav) | pending-actions | unread-count | atom (users/me) | placement |
|---|---|---|---|---|---|
| useCreate/Update/DeleteArticle | ✅ `['articles']` | — | **❌** | — | config |
| useSubmitArticle | ✅ | — | — | — | config |
| useApprove/RejectArticle | ✅ | ✅ | **❌**ᵃ | — | config |
| **useBulkApprove/RejectArticles** | ✅ | **❌**ᵇ | **❌** | — | config → **C-37** |
| useRateArticle | ⚠️ jen `detail`ᶜ | — | — | — | `onSuccess(_, {id})` |
| useMarkRead | ✅ `setQueryData(status)` + unread-count | — | ✅ | — | config |
| useToggle/TogglePinFavoriteArticle | ✅ `['articles','favorites']` | — | — | ✅ `['users','me']` | config |
| useCreate/Patch/…Discussion (`invalidate()`) | ✅ `['discussions']` | ✅ | — | — | config |
| useReportPost | **❌ žádný efekt** | **❌** | — | — | config → **C-41**/census |
| useApprove/RejectGalleryImage | ✅ `['gallery']` | ✅ | — | — | config |
| useBulk* galerie/diskuze | — | — | — | — | **neexistuje** (jen články) |
| useCreate/Update/Archive/DeleteNews | ✅ `['ikaros-news']` (list+count+widget) | — | — | — | config |
| useCreate/Update/Delete/RsvpEvent | ✅ `['ikaros-events']` (list+upcoming) | — | — | — | config |

ᵃ approve = článek přejde z Pending na Published → vzniká **nová** položka v nepřečtených, badge ji nezapočítá.
ᵇ `['articles','pending']` je **dead invalidace** — žádný dotaz tento klíč nemá (review fronta běží pod `['pending-actions']`).
ᶜ list/cards čtou `averageRating`+`ratings.length` z `['articles','all']`/`my`, ty rate neinvaliduje.

**Census (M-CEN):** `useReportPost` ([useDiscussions.ts:135](../../src/features/ikaros/api/useDiscussions.ts#L135)) je
**jediná mutace bez cache efektu** v oblasti (→ C-41). Vše ostatní má ≥1 invalidaci.

---

## 3. Nálezy

### 🟡 C-37 · `KM`/`FO` · bulk approve/reject článků invaliduje DEAD klíč, NE `['pending-actions']` (hook zatím bez UI)
- **Mutace:** [useBulkArticleActions.ts:23-26,35-38](../../src/features/ikaros/api/useBulkArticleActions.ts#L23) — `onSuccess` invaliduje `['articles']` + `['articles','pending']`.
- **Rozpor 1 (KM dead):** `['articles','pending']` **netrefí žádný dotaz** — review fronta běží pod `['pending-actions',type,…]` ([usePendingActions.ts:34](../../src/features/users/api/usePendingActions.ts#L34)), ne pod `['articles','pending']`. Invaliduje do prázdna.
- **Rozpor 2 (FO):** chybí `invalidate(['pending-actions'])` — na rozdíl od single `useApproveArticle`/`useRejectArticle` ([useArticles.ts:108-111](../../src/features/ikaros/api/useArticles.ts#L108)), které ho mají. Po bulk akci **Zpracovat fronta** (ZpracovatTab `PendingGroup`), **nav badge** „Články N" ([IkarosLayout.tsx:98,138](../../src/app/layout/IkarosLayout/IkarosLayout.tsx#L98)) i **pravý panel badge** drží staré počty.
- **Trigger:** SpravceClanku v tabu Pending hromadně schválí/zamítne X článků (multi-select action bar).
- **Viditelnost:** kdyby se hook volal: Zpracovat fronta + badge by držely staré počty (`['articles']` obnoví Přehled/Moje ✅, ne frontu). **ALE bulk UI je „zatím nehotová"** ([useBulkArticleActions.ts:16](../../src/features/ikaros/api/useBulkArticleActions.ts#L16) komentář — multi-select komponenta neexistuje) → **hook se nikde nevolá → žádný live trigger.**
- **Workaround:** N/A (zatím nevolané). **Závažnost:** 🟡 — latentní: dead klíč + chybějící `['pending-actions']` se aktivují, jakmile se bulk UI zapojí. Opravit teď, ať feature startuje korektně.
- **Návrh:** v obou bulk `onSuccess` nahradit `['articles','pending']` za `['pending-actions']` (parita se single-akcí) — než se UI dodělá.

### 🟠 C-38 · `FO` · approve/publish článku NEobnoví unread-count badge
- **Mutace:** [useArticles.ts:103-113](../../src/features/ikaros/api/useArticles.ts#L103) `useApproveArticle` → `['articles']` + `['pending-actions']`.
- **Konzument:** `['article-reads','unread-count']` ([useArticles.ts:169](../../src/features/ikaros/api/useArticles.ts#L169)) — badge počtu nepřečtených Published článků.
- **Rozpor:** approve mění Pending→Published → **vzniká nový nepřečtený** Published článek, ale `['article-reads',…]` je jiný namespace, který `['articles']` neprefixuje → badge se nezvýší. Totéž `useCreateArticle` se `submit:false→…` nepublikuje (Draft), takže reálně jen approve. (Smazání Published článku symetricky badge nesníží.)
- **Trigger:** reviewer schválí článek → ostatní uživatelé. **Viditelnost:** tiše nízké číslo v badge nepřečtených. **Workaround:** 30s staleTime / F5. **Závažnost:** 🟠 (krátký staleTime tlumí; badge, ne obsah).
- **Návrh:** do `useApproveArticle.onSuccess` (+ `useDeleteArticle` pro symetrii) přidat `invalidate(['article-reads','unread-count'])`.

### 🟠 C-39 · `FO` · `useRateArticle`/`useRateGalleryImage` obnoví jen detail, ne list cards
- **Mutace:** [useArticles.ts:143](../../src/features/ikaros/api/useArticles.ts#L143) / [useGallery.ts:156](../../src/features/ikaros/api/useGallery.ts#L156) → `invalidate(['articles'/'gallery','detail',id])` (jen detail).
- **Konzument:** karty v `['articles','all']`/`'my'` zobrazují `RatingInline` (averageRating + ratings.length) [ArticlesPage.tsx:285](../../src/features/ikaros/pages/ArticlesPage.tsx#L285); AuthorSidebar agreguje `a.ratings.length`/`averageRating` ze `useArticles()` [ArticleDetailPage.tsx:211-220](../../src/features/ikaros/pages/ArticleDetailPage.tsx#L211).
- **Rozpor:** ohodnotím článek → detail panel se obnoví, ale **hvězdičky na kartě v Přehledu** i agregát v sidebaru drží starý průměr.
- **Trigger:** uživatel ohodnotí. **Viditelnost:** tiše starý průměr/počet na kartě. **Workaround:** 30s staleTime / F5. **Závažnost:** 🟠 (úzká invalidace; staleTime tlumí).
- **Návrh:** rozšířit na `invalidate(['articles'])`/`['gallery']` (trefí list i detail), nebo doplnit list klíče.

### 🟠 C-40 · `LC`/`FO` · otevřený detail akce/modal drží lokální snapshot — RSVP/edit jiného konzumenta neobnoví modal
- **Místo:** [AkcePage.tsx:41,193-201](../../src/features/ikaros/pages/AkcePage/AkcePage.tsx#L41) — `selected` event je `useState` snapshot předaný do `<IkarosEventCard event={selected}>`; modal **není** subscriber `['ikaros-events']`.
- **Rozpor:** RSVP/edit obnoví grid (`useIkarosEvents` ✅), ale otevřený modal renderuje **starý objekt** z lokálního stavu — počet účastníků / `myRsvp` / upravené pole se v modalu neaktualizují, dokud ho nezavřu a neotevřu znovu. (RSVP přitom proběhne **uvnitř** karty v modalu → uživatel klikne „Zúčastním se", grid pod ním se obnoví, ale modal ne.)
- **Trigger:** otevřu detail akce v kalendáři → RSVP / (admin) edit. **Viditelnost:** modal drží předchozí stav účasti/dat. **Workaround:** zavřít+otevřít modal. **Závažnost:** 🟠 (UX nekonzistence, ne ztráta dat). Stejný vzor: `IkarosEventModal` edit drží `event` prop snapshot (init form) — to je u edit-formu OK (záměr), ale `selected` re-render karty ne.
- **Návrh:** v AkcePage po výběru držet jen `selectedId` a v modalu číst `events.find(e => e.id === selectedId)` z živé query (re-renderne po invalidaci).

### 🟠 C-41 · `FO`/census · `useReportPost` nemá žádný cache efekt — nahlášení se neprojeví v moderační frontě
- **Mutace:** [useDiscussions.ts:135-147](../../src/features/ikaros/api/useDiscussions.ts#L135) — jediná mutace bez `invalidate`/`setQueryData`/`remove`.
- **Rozpor:** report vytváří `DiscussionReport` (pending-action typ `DiscussionReport`, viz [ZpracovatTab.tsx:20](../../src/features/users/components/tabs/ZpracovatTab/ZpracovatTab.tsx#L20)) → měl by invalidovat `['pending-actions']`, aby se objevil ve frontě + badge SpravceDiskuzi. Neobnovuje nic.
- **Trigger:** uživatel nahlásí příspěvek (reportér je často zároveň jiná role; pokud je current user i moderátor v jiné kartě/panelu, frontu neuvidí). **Viditelnost:** report tiše chybí v Zpracovat + nav/panel badge `Hlášené příspěvky` do 30s staleTime. Pro samotného reportéra žádný lokální konzument (toast stačí) → dopad hlavně na moderátora-self. **Workaround:** F5. **Závažnost:** 🟠.
- **Návrh:** přidat `onSuccess: () => qc.invalidateQueries({ queryKey: ['pending-actions'] })` (jako `useResolveReport`/approve mutace).

### 🟡 C-42 · `LC` (orphan-ish) · gallery/discussion nemá unread-count obdobu — OK, ale article unread-count je orphan vůči approve
- Konsolidace C-38 z pohledu P6: `['article-reads','unread-count']` invaliduje **jen** `useMarkRead` ([useArticles.ts:182](../../src/features/ikaros/api/useArticles.ts#L182)). Žádná publish/delete mutace ho netrefí → badge se pohne jen když něco **přečtu**, ne když přibude/ubude nepřečtený. Polo-orphan: má 1 zapisovatele, ale ne ten správný směr. 🟡 (kořen je C-38; tady zaznamenán jako systematický P6 nález).

---

## 4. Ověřené ✅ (parita / korektní fan-out)

- **Single moderace** (article/gallery approve+reject) ✅ `['…']` + `['pending-actions']` — fronta i list se obnoví. [useArticles.ts:108](../../src/features/ikaros/api/useArticles.ts#L108), [useGallery.ts:121](../../src/features/ikaros/api/useGallery.ts#L121).
- **Diskuze `invalidate()`** ✅ — společný helper [useDiscussions.ts:18](../../src/features/ikaros/api/useDiscussions.ts#L18) řeší `['discussions']` + `['pending-actions']` v jednom místě → všechny CRUD/workflow/manage mutace mají úplný fan-out (create, patch, addPost, deletePost, like, invite, manager, join, approve, reject, resolveJoin, resolveReport).
- **Novinky** ✅ — `['ikaros-news']` prefixuje `list,params` + `count,scope` + base widget. Create/update/archive/unarchive/delete obnoví NovinkyPage list, tab badges i dashboard widget. [useIkarosNews.ts:73-122](../../src/features/ikaros/api/useIkarosNews.ts#L73).
- **Akce** ✅ — `['ikaros-events']` prefixuje `upcoming,limit`. Create/update/delete/RSVP obnoví AkcePage grid+seznam i dashboard upcoming widget. (Mimo C-40 otevřený modal.) [useIkarosEvents.ts](../../src/features/ikaros/api/useIkarosEvents.ts).
- **markRead OPT** ✅ — `setQueryData(['article-reads','status',id], {read:true})` tvar == `queryFn` tvar `{read}` ([useArticles.ts:181](../../src/features/ikaros/api/useArticles.ts#L181)); per-id status na kartách (`isUnread`) se okamžitě přepne, plus unread-count invalidace. Žádný optimistic write bez resyncu → bez OPT rizika.
- **Favorites/Pin P7 most** ✅ — viz §1; `['users','me']` invalidace → hydratace → `currentUserAtom` → sidebar pin/fav stav + detail toggle (`favoriteArticleIds`) se synchronizují.
- **CB review renderery** ✅ — `approve.mutate(id,{onSuccess: helpers.onResolve})` v [ArticleReviewRenderer.tsx:79](../../src/features/ikaros/components/ArticleReviewRenderer.tsx#L79) / Gallery / Discussion: vlastní cache invalidace žije v `useMutation onSuccess` (přežije unmount karty), `onResolve` jen redundantně re-invaliduje `['pending-actions']`. Bezpečné.
- **CB detail/editor pages** — všech ~8× `mutate(v,{onSuccess})` v ArticleDetailPage / DiscussionDetailPage / ArticleEditorPage **nese v call-site onSuccess jen toast/navigaci**, cache invalidace je vždy v hook-level `useMutation onSuccess` → **přežije unmount/navigaci** i u destruktivních akcí (delete článku → navigate, reject diskuze → navigate). Editor používá `mutateAsync` + try/catch (sekvenční update→submit) — invalidace hook-level, OK.

---

## 5. Latentní / VERIFY (neeskalováno na C-xx)

- **D-10-1 `DEL` 🟡** — žádná delete mutace (`useDeleteArticle`/`Gallery`/`Discussion`/`News`/`Event`) nedělá `removeQueries(detail)`, jen `invalidate(namespace)`. Po smazání ze stránky se **naviguje pryč** (ArticleDetail `onDelete→navigate`, Gallery `navigate`, Discussion reject `navigate`), takže mrtvý detail se zpravidelně nerefetchne na 404. **Ale** delete z **review/list kontextu** bez navigace (kde detail query zůstává mounted v `gcTime` 5 min) by mohl refetchnout → 404. Nízké riziko (delete je gated na vlastníka Draft/Rejected na detail stránce). VERIFY (M4) jen u list-context delete.
- **D-10-2 `CR` 🟡** — `useCreateArticle`/`Gallery` se `submit:false` vytvoří Draft; `['…','all']` (Published+pending) ho nezobrazí, `['…','my']` ano (invalidováno ✅). Filtr/řazení v Přehledu (`filterArticles`) je čistě klientský nad `all` → invalidace `all` stačí, nový Published se zařadí korektně. Bez nálezu, jen potvrzení CR osy.
- **D-10-3 `KM` 🟡 (drift-trap)** — `ARTICLES_KEY`/`GALLERY_KEY`/`DISCUSSIONS_KEY`/`NEWS_KEY` jsou exportované `as const` konstanty (jediný zdroj), ale `['pending-actions']`, `['article-reads',…]`, `['users','me']` jsou **inline literály** roztroušené přes hooky/komponenty → latentní drift při přejmenování. Preventivní.
- **D-10-4 `FO` 🟡** — smazání kategorie (`useDeleteArticleCategory`/`Gallery`) invaliduje jen `['…-categories']`; články s mrtvým `category` klíčem nadále existují (`categoryByKey` fallback). Není cache nález (data konzistence), zaznamenáno pro úplnost.

---

## Shrnutí pro registr

- **C-37 🟡** bulk approve/reject článků: dead klíč `['articles','pending']` + chybí `['pending-actions']` → latentní (hook zatím bez UI, žádný live trigger; opravit před zapojením).
- **C-38 🟠** approve/publish článku neobnoví `['article-reads','unread-count']` badge.
- **C-39 🟠** `useRateArticle`/`useRateGalleryImage` invaliduje jen detail, ne hvězdičky na list cards + author sidebar.
- **C-40 🟠** AkcePage detail modal drží lokální `selected` snapshot → RSVP/edit neobnoví otevřený modal.
- **C-41 🟠** `useReportPost` bez cache efektu (census) → nahlášení se neobjeví v `['pending-actions']` frontě/badge.
- **C-42 🟡** `['article-reads','unread-count']` polo-orphan (jen markRead ho posune, ne publish/delete) — P6 systematizace C-38.
