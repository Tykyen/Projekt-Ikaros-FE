# 04 — Ikaros komunita

Pokrývá platformový komunitní obsah: články, galerii, diskuze, novinky, akce, oblíbené/připnuté položky, kategorie, nápovědu a podmínky. Každý modul má vlastní workflow schvalování (Draft → Pending → Published/Rejected) a role-based gating.

**BE:** `ikaros-articles`, `ikaros-gallery`, `ikaros-discussions`, `ikaros-news`, `ikaros-events`, `ikaros-categories`
**FE:** `features/ikaros/pages` — ArticlesPage, ArticleDetailPage, ArticleEditorPage, GalleryPage, GalleryUploadPage, GalleryDetailPage, DiscussionsPage, DiscussionDetailPage, DiscussionsNewPage, NovinkyPage, AkcePage, FavoritesPage, HelpPage, TermsPage + routy `/ikaros/clanky`, `/ikaros/galerie`, `/ikaros/diskuze`, `/ikaros/novinky`, `/ikaros/akce`, `/ikaros/oblibene`, `/ikaros/napoveda`, `/podminky`

---

## A. Články

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| KM-01 | `GET /ikaros-articles` bez tokenu vrátí jen `Published` články — anon vidí ≥ 0 položek, žádná není `Draft`/`Pending`/`Rejected` `[auto]` | M1 | ⬜ |
| KM-02 | `GET /ikaros-articles` se SpravceClanku tokenem vrátí `Published` + `Pending`, žádná `Draft`/`Rejected` `[auto]` | M1 | ⬜ |
| KM-03 | `GET /ikaros-articles` s `?search=` provede server-side fulltext přes `$text` index; prázdný search necrashuje a vrátí vše `[auto]` | M1 | ⬜ |
| KM-04 | `GET /ikaros-articles/:id` pro `Pending` článek bez tokenu vrátí `403 ARTICLE_ACCESS_DENIED` (ne `404`) `[auto]` | M4 | ⬜ |
| KM-05 | `GET /ikaros-articles/:id` pro `Pending` článek s tokenem autora vrátí `200` (vlastník smí číst vlastní Pending) `[auto]` | M4 | ⬜ |
| KM-06 | `POST /ikaros-articles` s neexistujícím `category` slug vrátí `400 ARTICLE_INVALID_CATEGORY` `[auto]` | M1 | ⬜ |
| KM-07 | `POST /ikaros-articles` s `submit: true` změní status na `Pending` a pošle notifikaci adminům (mock msgService.create zavolán) `[auto]` | M1 | ⬜ |
| KM-08 | `PUT /ikaros-articles/:id` od jiného uživatele než autora vrátí `403` `[auto]` | M4 | ⬜ |
| KM-09 | `PUT /ikaros-articles/:id` na `Published` článku vrátí `400` (jen Draft/Rejected editovatelné) `[auto]` | M4 | ⬜ |
| KM-10 | `PUT /ikaros-articles/:id` sanitizuje HTML obsah přes `sanitizeRichText` — XSS `<script>` tag musí být odstraněn `[auto]` | M1 | ⬜ |
| KM-11 | `DELETE /ikaros-articles/:id` od admina (SpravceClanku) na cizí článek vrátí `204` (admin smí mazat) `[auto]` | M4 | ⬜ |
| KM-12 | `DELETE /ikaros-articles/:id` od nezalogovaného vrátí `401` `[auto]` | M4 | ⬜ |
| KM-13 | `POST /ikaros-articles/:id/submit` na `Published` článku vrátí `400` (jen Draft/Rejected) `[auto]` | M1 | ⬜ |
| KM-14 | `POST /ikaros-articles/:id/approve` od role `Hrac` vrátí `403 ARTICLE_FORBIDDEN` `[auto]` | M4 | ⬜ |
| KM-15 | `POST /ikaros-articles/:id/approve` od role `PJ` vrátí `200` — PJ je v `ADMIN_ROLES` článků (pozn.: articles ADMIN_ROLES zahrnuje PJ, galerie/diskuze NE — záměrné?) `[human]` | M4 | ⬜ |
| KM-16 | `POST /ikaros-articles/:id/reject` na non-Pending článku vrátí `400 ARTICLE_NOT_PENDING` `[auto]` | M1 | ⬜ |
| KM-17 | `POST /ikaros-articles/bulk/approve` od SpravceClanku vrátí `{succeeded, failed}` summary; částečné selhání nezastaví zbytek `[auto]` | M1 | ⬜ |
| KM-18 | `POST /ikaros-articles/bulk/reject` s prázdným polem `ids` vrátí `{succeeded:[], failed:[]}` bez chyby `[auto]` | M1 | ⬜ |
| KM-19 | `POST /ikaros-articles/:id/rate` od autora vlastního článku vrátí `403 ARTICLE_SELF_RATING` `[auto]` | M4 | ⬜ |
| KM-20 | `POST /ikaros-articles/:id/rate` na `Draft` článku vrátí `400 ARTICLE_NOT_PUBLISHED` `[auto]` | M1 | ⬜ |
| KM-21 | `POST /ikaros-articles/:id/mark-read` je idempotentní — dvojí volání vrátí `204` bez chyby `[auto]` | M1 | ⬜ |
| KM-22 | `GET /ikaros-articles/unread-count` vrátí správný počet (Published - přečtené) `[auto]` | M1 | ⬜ |
| KM-23 | `POST /ikaros-articles/:id/toggle-pin` bez předchozího toggle-favorite vrátí `409 NOT_FAVORITE` `[auto]` | M1 | ⬜ |
| KM-24 | `POST /ikaros-articles/:id/toggle-pin` při dosažení MAX_PINNED=5 vrátí `409 PIN_LIMIT` `[auto]` | M1 | ⬜ |
| KM-25 | Odebrání z oblíbených (`toggle-favorite` na oblíbeném) automaticky odepne ze sidebaru — `pinnedArticleIds` nesmí obsahovat odebrávaný článek `[auto]` | M1 | ⬜ |
| KM-26 | `GET /ikaros-articles/:id/versions` od ne-autora bez admin role vrátí `403` `[auto]` | M4 | ⬜ |
| KM-27 | FE: `ArticlesPage` — `filterArticles()` skryje `Draft`/`Pending`/`Rejected` v přehledovém tabu — pokrytí existujícím unit testem `[auto]` | M3 | ⬜ |
| KM-28 | FE: `ArticlesPage` — search + category filter kombinace vrátí správné průniky `[auto]` | M3 | ⬜ |
| KM-29 | FE: `ArticleEditorPage` — uživatel, který není autorem, je přesměrován na detail článku (FE `<Navigate>`) `[auto]` | M4 | ⬜ |
| KM-30 | FE: `ArticleDetailPage` — `MarkAsReadObserver` nevolá `markRead` pro `Draft`/`Pending` (jen Published) — ověřit podmínku `article.status !== 'Published'` `[human]` | M1 | ⬜ |
| KM-31 | FE: `ArticleDetailPage` — admin akce (Approve/Reject) viditelné jen pro `REVIEWER_ROLES` (SpravceClanku, Admin, Superadmin) a jen pro `Pending` článek; PJ roli FE do REVIEWER_ROLES nemá (na rozdíl od BE) — zkontrolovat záměrnost `[human]` | M4 | ⬜ |
| KM-32 | FE↔BE: `article.versions` endpoint existuje v BE (`GET /:id/versions`), ale FE nemá hook `useArticleVersions` — funkce zobrazení verzí chybí na FE `[human]` | M2 | ⬜ |
| KM-33 | FE↔BE: `useBulkArticleActions` volá `POST /ikaros-articles/bulk/approve` — kontrakt `{ids: string[]}` odpovídá BE `BulkApproveDto` `[auto]` | M2 | ⬜ |

## B. Galerie

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| KM-34 | `POST /ikaros-gallery` bez souboru (`file` undefined) vrátí `400 GALLERY_FILE_REQUIRED` `[auto]` | M1 | ⬜ |
| KM-35 | `POST /ikaros-gallery` s neplatným MIME typem (např. `text/plain`) vrátí `415` od `uploadService.uploadGalleryImage` (allowedImageTypes whitelist v upload service) `[auto]` | M1 | ⬜ |
| KM-36 | `POST /ikaros-gallery` s `submit: 'true'` (string z multipart) → DTO `@Transform` převede na boolean `true` → status `Pending` `[auto]` | M1 | ⬜ |
| KM-37 | `POST /ikaros-gallery` s neexistujícím `category` slug vrátí `400 GALLERY_CATEGORY_INVALID` `[auto]` | M1 | ⬜ |
| KM-38 | `DELETE /ikaros-gallery/:id` od admina (`SpravceGalerie`) na cizí obrázek vrátí `204` a zavolá `uploadService.deleteImage` (Cloudinary cleanup) `[auto]` | M4 | ⬜ |
| KM-39 | `GET /ikaros-gallery` bez tokenu vrátí jen `Published` obrázky (anon přístup) `[auto]` | M4 | ⬜ |
| KM-40 | `GET /ikaros-gallery` se `SpravceGalerie` tokenem vrátí `Published` + `Pending` `[auto]` | M4 | ⬜ |
| KM-41 | `POST /ikaros-gallery/:id/approve` od role `PJ` vrátí `403` — galerie ADMIN_ROLES nezahrnuje PJ (záměrně, na rozdíl od článků) `[auto]` | M4 | ⬜ |
| KM-42 | `POST /ikaros-gallery/:id/rate` od autora vlastního obrázku vrátí `403 GALLERY_SELF_RATING` `[auto]` | M4 | ⬜ |
| KM-43 | `POST /ikaros-gallery/:id/toggle-pin` bez předchozího favorite vrátí `409 NOT_FAVORITE` `[auto]` | M1 | ⬜ |
| KM-44 | Odebrání z oblíbených galerie automaticky odepne ze sidebaru (cascade `pinnedGalleryIds`) `[auto]` | M1 | ⬜ |
| KM-45 | FE: `GalleryUploadPage` — validace na FE: prázdný `title` → toast chyba; chybějící soubor v create módu → toast chyba `[human]` | M1 | ⬜ |
| KM-46 | FE: `GalleryUploadPage` — soubor > 10 MB zobrazí toast error a soubor nepošle na BE `[human]` | M1 | ⬜ |
| KM-47 | FE: `GalleryUploadPage` — edit mód nesmí zobrazit file picker (jen title/description/category editovatelné — soubor nelze vyměnit) `[human]` | M2 | ⬜ |
| KM-48 | `DELETE /ikaros-gallery-categories/:key` od Admin (ne Superadmin) vrátí `403 GALLERY_CATEGORY_DELETE_FORBIDDEN` `[auto]` | M4 | ⬜ |
| KM-49 | Smazání galerie kategorie, která má přiřazené obrázky, vrátí `409` `[auto]` | M1 | ⬜ |

## C. Diskuze

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| KM-50 | `GET /ikaros-discussions` je JwtAuthGuard — bez tokenu vrátí `401` (diskuze nejsou anon-přístupné) `[auto]` | M4 | ⬜ |
| KM-51 | `GET /ikaros-discussions` vrátí jen schválené (`isApproved=true`) otevřené diskuze pro běžného uživatele; uzamčené bez pozvánky jsou filtrovány `[auto]` | M4 | ⬜ |
| KM-52 | `GET /ikaros-discussions?limit=50` použije paginovanou variantu; `total` je v response; bez `limit` vrátí pole (zpětná kompatibilita) `[auto]` | M1 | ⬜ |
| KM-53 | `POST /ikaros-discussions` od běžného uživatele vytvoří diskuzi s `isApproved=false` a pošle notifikaci adminům `[auto]` | M4 | ⬜ |
| KM-54 | `POST /ikaros-discussions` od admina/SpravceDiskuzi vytvoří diskuzi s `isApproved=true` (auto-approve) `[auto]` | M4 | ⬜ |
| KM-55 | `PATCH /ikaros-discussions/:id` od ne-manažera ne-admina vrátí `403` `[auto]` | M4 | ⬜ |
| KM-56 | `POST /ikaros-discussions/:id/reject` smaže diskuzi i všechny příspěvky a pošle notifikaci tvůrci `[auto]` | M1 | ⬜ |
| KM-57 | `POST /ikaros-discussions/:id/posts` na neschválené diskuzi vrátí `400` (nelze psát do neschválené diskuze) `[auto]` | M1 | ⬜ |
| KM-58 | `POST /ikaros-discussions/:id/posts` sanitizuje HTML obsah přes `sanitizeRichText` `[auto]` | M1 | ⬜ |
| KM-59 | `DELETE /ikaros-discussions/:id/posts/:postId` od autora postu vrátí `204`; od jiného běžného uživatele (ne-manažer, ne-admin) vrátí `403` `[auto]` | M4 | ⬜ |
| KM-60 | `POST /ikaros-discussions/:id/invite` od ne-manažera vrátí `403` `[auto]` | M4 | ⬜ |
| KM-61 | `POST /ikaros-discussions/:id/join-request` na otevřené diskuzi vrátí `400` (není třeba žádat) `[auto]` | M1 | ⬜ |
| KM-62 | `POST /ikaros-discussions/:id/join-request/:userId/resolve` od ne-manažera vrátí `403` `[auto]` | M4 | ⬜ |
| KM-63 | `POST /ikaros-discussions/:id/posts/:postId/report` uloží report a notifikuje adminy `[auto]` | M1 | ⬜ |
| KM-64 | `POST /ikaros-discussions/reports/:reportId/resolve` od ne-admina vrátí `403` `[auto]` | M4 | ⬜ |
| KM-65 | `POST /ikaros-discussions/reports/:reportId/resolve` s `deletePost: true` smaže příspěvek a sníží `postCount` `[auto]` | M1 | ⬜ |
| KM-66 | `DELETE /ikaros-discussions/:id/managers/:userId` — tvůrce diskuze nelze odebrat ze správců (`400`) `[auto]` | M1 | ⬜ |
| KM-67 | `POST /ikaros-discussions/:id/toggle-pin` bez předchozího favorite vrátí `409 NOT_FAVORITE` `[auto]` | M1 | ⬜ |
| KM-68 | Odebrání z oblíbených diskuze automaticky odepne ze sidebaru `[auto]` | M1 | ⬜ |
| KM-69 | `GET /ikaros-discussions/:id/posts` vrátí stránkované příspěvky (skip/limit); min 0, max 100 `[auto]` | M1 | ⬜ |
| KM-70 | FE: `DiscussionDetailPage` — locked diskuze (403 z BE) zobrazí `UnavailableNotice` s tlačítkem „Požádat o přidání" `[human]` | M4 | ⬜ |
| KM-71 | FE: `DiscussionDetailPage` — composer viditelný jen pro `isApproved=true`; jinak info `[human]` | M1 | ⬜ |
| KM-72 | FE: `DiscussionDetailPage` — tlačítko Smazat příspěvek viditelné jen autorovi postu nebo manažerovi/adminovi `[auto]` | M4 | ⬜ |
| KM-73 | FE: `DiscussionsPage` — tab „Moje" filtruje klientsky (`creatorId === user.id` nebo `managerIds.includes`) — ověřit, zda nechybí diskuze kde je user pozvaný (invitedUserIds) `[human]` | M2 | ⬜ |

## D. Novinky & Akce

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| KM-74 | `GET /IkarosNews` bez tokenu (anon) s `?scope=active` vrátí `200` s aktivními novinkami `[auto]` | M4 | ⬜ |
| KM-75 | `GET /IkarosNews?scope=archived` bez tokenu vrátí `401 IKAROS_NEWS_AUTH_REQUIRED` (ne `403`) `[auto]` | M4 | ⬜ |
| KM-76 | `GET /IkarosNews?scope=archived` od role `SpravceClanku` vrátí `403 FORBIDDEN_PLATFORM_ROLE` (jen Admin/Superadmin) `[auto]` | M4 | ⬜ |
| KM-77 | `GET /IkarosNews?scope=invalid` vrátí `400 IKAROS_NEWS_INVALID_SCOPE` `[auto]` | M1 | ⬜ |
| KM-78 | `GET /IkarosNews?limit=200` je oříznut na max 100; `offset=0` funguje korektně `[auto]` | M1 | ⬜ |
| KM-79 | `POST /IkarosNews` od role `SpravceClanku` vrátí `403` (jen Admin/Superadmin smí psát novinky) `[auto]` | M4 | ⬜ |
| KM-80 | `POST /IkarosNews/:id/archive` je idempotentní — archivovat již archivovanou novinku vrátí `200` bez chyby `[auto]` | M1 | ⬜ |
| KM-81 | `DELETE /IkarosNews/:id` od Superadmin smaže novinku; zaloguje audit `auditRepo.record` s `action:'delete'` `[auto]` | M1 | ⬜ |
| KM-82 | FE: `NovinkyPage` — anon nevidí tlačítko „Nová novinka" ani taby Aktivní/Archiv `[auto]` | M3 | ⬜ |
| KM-83 | FE: `NovinkyPage` — admin vidí inline akce (edit, archiv, smazat) na kartě novinky `[auto]` | M3 | ⬜ |
| KM-84 | FE: `NovinkyPage` — paginace funguje (page +1 změní `offset` v query) `[human]` | M1 | ⬜ |
| KM-85 | `GET /ikaros-events` bez tokenu vrátí `401` (events jsou jen přihlášení) `[auto]` | M4 | ⬜ |
| KM-86 | `POST /ikaros-events` od role `PJ` vrátí `403` (jen Admin/Superadmin) `[auto]` | M4 | ⬜ |
| KM-87 | `POST /ikaros-events/:id/confirm` toggle RSVP — přihlásí uživatele; druhé volání odhlásí `[auto]` | M1 | ⬜ |
| KM-88 | `POST /ikaros-events/:id/confirm` na akci s `confirmable: false` vrátí `409` `[auto]` | M1 | ⬜ |
| KM-89 | `GET /ikaros-events/upcoming?limit=25` je oříznut na max 20 `[auto]` | M1 | ⬜ |
| KM-90 | FE: `AkcePage` — anon nevidí tlačítko „Nová akce" (jen Admin/Superadmin) `[auto]` | M3 | ⬜ |
| KM-91 | FE: `AkcePage` — klik na akci v mřížce otevře detail modal `[auto]` | M3 | ⬜ |
| KM-92 | FE: `AkcePage` — měsíční navigace (Předchozí/Další) změní zobrazenou mřížku `[auto]` | M3 | ⬜ |

## E. Oblíbené / Nápověda / Podmínky / Kategorie

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| KM-93 | `GET /ikaros-articles/my-favorites` vrátí jen články v `favoriteArticleIds` uživatele (i případné non-Published) `[auto]` | M1 | ⬜ |
| KM-94 | `GET /ikaros-gallery/my-favorites` totéž pro obrázky `[auto]` | M1 | ⬜ |
| KM-95 | `GET /ikaros-discussions/my-favorites` totéž pro diskuze `[auto]` | M1 | ⬜ |
| KM-96 | FE: `FavoritesPage` — default tab `?typ=` chybí → aktivní tab Diskuze `[auto]` | M3 | ⬜ |
| KM-97 | FE: `FavoritesPage` — neznámý `?typ=xyz` → fallback na Diskuze bez chyby `[auto]` | M3 | ⬜ |
| KM-98 | FE: `FavoritesPage` — klik na „Připnout" na 6. položce zobrazí BE chybu `409 PIN_LIMIT` jako toast (ne crash) `[human]` | M1 | ⬜ |
| KM-99 | FE: `FavoritesPage` — `pinDisabled` logika: tlačítko Připnout je disabled pokud `pinned.length >= MAX_PINNED && !isPinned` — ověřit konzistenci s BE limitem `[human]` | M2 | ⬜ |
| KM-100 | `GET /article-categories` je bez autentizace (public) — vrátí seznam `[auto]` | M4 | ⬜ |
| KM-101 | `POST /article-categories` od role `SpravceClanku` vrátí `403` (jen Admin/Superadmin) `[auto]` | M4 | ⬜ |
| KM-102 | `DELETE /article-categories/:key` od Admin vrátí `403 CATEGORY_DELETE_FORBIDDEN` (jen Superadmin maže) `[auto]` | M4 | ⬜ |
| KM-103 | `POST /article-categories` s duplicitním `key` vrátí `409 CATEGORY_KEY_TAKEN` `[auto]` | M1 | ⬜ |
| KM-104 | `GET /gallery-categories` je bez autentizace (public) `[auto]` | M4 | ⬜ |
| KM-105 | `DELETE /gallery-categories/:key` od Admin (ne Superadmin) vrátí `403 GALLERY_CATEGORY_DELETE_FORBIDDEN` `[auto]` | M4 | ⬜ |
| KM-106 | FE: `HelpPage` — sekce Rolí zobrazuje SpravceClanku, SpravceGalerie, SpravceDiskuzi s popisem `[human]` | M1 | ⬜ |
| KM-107 | FE: `TermsPage` — stránka se vykreslí bez chyby i pro anon uživatele (žádná auth guard) `[human]` | M4 | ⬜ |

---

## Test coverage gaps

- **Verze článků (BE):** `ArticleVersionsRepository`, `getVersions`, `deleteByArticleId` nemají dedikovaný spec — `versionsRepo` je `@Optional()` a ve stávajících testech není nijak testován.
- **FE verze článků:** Chybí FE hook `useArticleVersions` a UI pro prohlížení verzí — funkce BE existuje, ale FE ji nevyužívá.
- **Diskuze paginace — post-fetch filter:** `findAllPaginated` filtruje `canAccessDiscussion` post-fetch → `total` počet neodpovídá skutečně vrácenému počtu pro uzamčené diskuze (potenciální chyba paginačního UI).
- **Gallery upload MIME validation:** FE validuje jen velikost souboru (10 MB), ne MIME typ — nevalidní typ projde FE, BE ho odmítne až na `uploadService`; UX chyba bez specifické FE hlášky.
- **Push notifikace pro novinky:** `IkarosNewsService` používá `PushService`, ale testy pro push notifikaci při vytvoření novinky chybí v `ikaros-news.service.spec.ts`.
- **Audit log pro novinky:** `auditRepo.record` je best-effort (chyba se jen loguje) — žádný test neověřuje, že audit volání skuttečně proběhne za normálních okolností.
- **FE `ArticleDetailPage` — PJ vs REVIEWER_ROLES:** BE zahrnuje PJ do `ADMIN_ROLES` pro články; FE `REVIEWER_ROLES` konstanta PJ neobsahuje → PJ nebude moci schválit z detail stránky, ale BE ho vpustí.

## Známá rizika

- **PJ v ADMIN_ROLES článků (BE):** `ikaros-articles.service.ts` řádek 29 — PJ je explicitně v `ADMIN_ROLES`, zatímco galerie a diskuze PJ nezahrnují. Memory pravidlo říká, že platformový obsah (galerie, diskuze) nesmí mít PJ jako správce, ale u článků to neplatí konzistentně. FE `REVIEWER_ROLES` PJ neobsahuje — BE a FE se v tomto rozcházejí; schválení přes detail stránku PJ neuvidí tlačítko, ale API přístup mu povolí.
- **Paginace diskuzí s access filtrem:** `findAllPaginated` vrátí `total` z DB před `canAccessDiscussion` filtrem. Pro uživatele bez přístupu k uzamčeným diskuzím bude `total` vyšší než skutečně zobrazených `items.length` → FE paginační UI zobrazí nesprávný počet stránek.
- **Cascade při smazání uživatele a oblíbených:** Pokud je uživatel smazán, jeho `favoriteArticleIds`/`pinnedArticleIds` zůstanou v DB. Při `toggleFavorite`/`togglePin` volání s jiným userId je to OK, ale při obnovení smazaného ID by mohlo dojít ke kolizi. Nízká pravděpodobnost, ale chybí cleanup job nebo migration script.
