# 04 — Komunitní obsah (platforma)

Kapitola pokrývá platformový (mimo-světový) komunitní obsah Ikarosu: **Články**, **Galerii**, **Diskuze** a **Novinky platformy**. Vše ověřeno přímo v kódu FE i BE.

Společné principy ověřené v kódu:
- **Globální role**, ne světové. Správa obsahu je vázaná jen na `UserRole` (`Superadmin`, `Admin`, `SpravceClanku`, `SpravceGalerie`, `SpravceDiskuzi`). PJ je world-scoped a do platformy **nepatří** (komentáře N-14 / D-069 v kódu). Enum: FE `src/shared/types/index.ts:6`, BE `backend/src/modules/users/interfaces/user.interface.ts:1`.
- **Speciální bypass:** uživatelské jméno `Tyky` je v `isAdmin` článků/galerie/diskuzí natvrdo považováno za admina (`ikaros-articles.service.ts:60`, `ikaros-gallery.service.ts:96`, `ikaros-discussions.service.ts:91`).
- **Schvalovací workflow** (články + galerie): stavy `Draft → Pending → Published`, případně `Rejected`. Anon/běžný uživatel vidí jen `Published`, recenzent navíc `Pending`.
- **Pending fronta** se vedle vlastní stránky modulu objevuje i v centru notifikací v tabu „Ke zpracování" (PendingActions providery) a jako badge u nav položek (`IkarosLayout`).

---

### Společná tvorba — rozcestník komunitního obsahu
- **Co to je:** Platformový hub sjednocující veškerou komunitní tvorbu do jedné mřížky dlaždic (tlačítek). Vstupní bod pro Diskuze/Články/Galerii a komunitní knihovny: **Bestiář** (16.2b-2), **Herbář** (21.5a), **Kouzla** (21.5c), **Lektvary** (21.5b), **Předměty** (21.5e), **Hádanky** (21.5d), **Ceníky** (21.5f), **Generátory** (21.2a) — **všech 11 dlaždic aktivních, žádný stub**.
- **Kde:** route `/ikaros/tvorba` (`TvorbaHubPage`). Hlavní navigace: jedno tlačítko „Společná tvorba" (ikona `Palette`), které **nahradilo** samostatné položky Diskuze/Články/Galerie. „RPG systémy" zůstává v nav samostatně (veřejný SEO landing, ne komunitní tvorba). Stuby už nejsou (`ComingSoonPage` bez route — nevyužitá komponenta).
- **Kdo:** hub i stuby **veřejné** (anon, bez `requireAuth`) — router `src/app/router.tsx`. Jednotlivé cíle si řeší vlastní gating (Diskuze má `requireAuth` → anon klik = login). Data dlaždic `src/features/ikaros/pages/SpolecnaTvorba/tiles.ts`.
- **Co jde dělat:** proklik na kteroukoli sekci — aktivní dlaždice vede na svou stránku, stub na `ComingSoonPage` („Připravujeme", `noindex`) s odkazem zpět na hub. Aktivní dlaždice nese moderační badge (počet pending pro recenzenta) z `usePendingActionsCount`.
- **Hranice / co neumí:** Hub je čistě navigační vrstva, sám žádný obsah nedrží. Všechny knihovny žijí (viz sekce níže; komunitní Bestiář čeká na plnou inventuru — viz Nesrovnalosti).
- **Zvláštnosti:** navigační badge „Společná tvorba" v `IkarosLayout` agreguje **součet** pending typů Diskuze+Články+Galerie (`NavItem` prop `pendingTypes`), aby moderátor o signál sloučením nepřišel; tooltip vyjmenuje neprázdné. Hub v prerenderu klasifikován jako statická cesta (delší TTL); stuby `noindex`.
- **Stav:** ✅ (hub + nav 2026-07-03; 10. dlaždice Ceníky 21.5f + 11. dlaždice Generátory 21.2a přidány 2026-07-13)
- **Kód:** FE `src/features/ikaros/pages/SpolecnaTvorba/` (`TvorbaHubPage.tsx`, `ComingSoonPage.tsx`, `tiles.ts`), nav `src/app/layout/IkarosLayout/IkarosLayout.tsx` (`PRIMARY_NAV`, `NavItem`), routy `src/app/router.tsx`. BE: žádné (čistě FE navigace).

---

### Články — přehled a čtení
- **Co to je:** Komunitní wiki/blog články platformy s kategoriemi, hodnocením, oblíbenými a stavem přečtení.
- **Kde:** route `/ikaros/clanky` (`ArticlesPage`). Dlaždice „Články" v rozcestníku **Společná tvorba** (badge počtu pending pro recenzenty). Detail `/ikaros/clanky/:id` (`ArticleDetailPage`).
- **Kdo:**
  - **FE:** seznam i detail jsou **veřejné** (anon, bez `requireAuth`). Router `src/app/router.tsx:149` a `:153`.
  - **BE:** `GET /ikaros-articles` a `GET /ikaros-articles/:id` přes `OptionalJwtAuthGuard` — anon vidí jen `Published`; recenzent (`SpravceClanku`/`Admin`/`Superadmin`) vidí `Published + Pending`; přihlášený autor navíc své vlastní (`ikaros-articles.controller.ts:39`, service `:111`/`:211`).
- **Co jde dělat:**
  - Číst publikované články, fulltext `?search=` (BE `searchPublished`).
  - Taby (FE): seznam publikovaných, „Moje" (`/my`), „Zpracovat" (pending fronta — jen recenzent), statistiky (`/stats`).
  - **Hodnocení** 1–5 hvězdiček + volitelný text (`POST /:id/rate`, jen na `Published`, jen přihlášený) — `ikaros-articles.controller.ts:209`.
  - **Oblíbené** (toggle) + **připnutí do sidebaru** max 5 (`/toggle-favorite`, `/toggle-pin`) — `:236`/`:244`.
  - **Nahlásit** (20.1) — tlačítko „Nahlásit" u cizího článku → generický report do moderační fronty (kap. 08).
  - **Stav přečtení:** `mark-read` (idempotentní), `read-status`, `unread-count` — badge nepřečtených (3.2a) `:75`/`:102`/`:227`.
  - **Historie revizí:** `GET /:id/versions` (autor nebo admin) — `:111`.
- **Hranice / co neumí:** žádné komentáře pod článkem (jen hvězdičkové hodnocení s textem). Anon nehodnotí, neoznačuje oblíbené ani nečte pending. Verzování je read-only (žádný rollback endpoint). Mazání kategorie smí **jen Superadmin** a jen pokud ji žádný článek nepoužívá (jinak 409).
- **Zvláštnosti:** „přečteno" se na FE triggeruje IntersectionObserverem po 50 % + 30 s na stránce (komentář v service). Smazaný autor je v odpovědích nahrazen tombstone (`authorIsDeleted`, D-040).
- **Stav:** ✅
- **Kód:** FE `src/features/ikaros/pages/ArticlesPage.tsx`, `ArticleDetailPage.tsx`, API `src/features/ikaros/api/useArticles.ts`. BE `backend/src/modules/ikaros-articles/ikaros-articles.controller.ts`, `ikaros-articles.service.ts`.

### Články — psaní, editace a schvalování
- **Co to je:** Tvorba/úprava článku v rich-text editoru a recenzní řízení.
- **Kde:** route `/ikaros/clanky/novy` a `/ikaros/clanky/:id/upravit` (`ArticleEditorPage`). Recenzní fronta „Zpracovat" v `ArticlesPage` + tab „Ke zpracování" v centru notifikací.
- **Kdo:**
  - **Psát smí kdokoli přihlášený** (`POST /ikaros-articles` jen za `JwtAuthGuard`, bez role-gate) — router `:151`/`:152` má `loader: requireAuth`.
  - **Editovat** smí jen autor a jen ve stavu `Draft`/`Rejected` (`PUT /:id`, service `:285` — kontrola `authorId` + stav).
  - **Schvalovat/zamítat** smí jen recenzent: `Superadmin`, `Admin`, `SpravceClanku` (`REVIEWER_ROLES` v `article-review.provider.ts:8`, `ADMIN_ROLES` v `ikaros-articles.service.ts:28`).
  - **Kategorie** vytváří/upravuje `Admin`/`Superadmin`, maže jen `Superadmin` (`ikaros-categories.controller.ts:43`/`:74`).
- **Co jde dělat:**
  - Vyplnit titulek, vybrat **kategorii** (z `useArticleCategories`, default `ostatni`), napsat obsah v `RichTextEditor` (TipTap, s autosave konceptu do localStorage — `useDraftAutoSave`).
  - „Uložit koncept" (`Draft`) nebo „Odeslat ke schválení" (`Pending`, `submit: true`) — `ArticleEditorPage.tsx:82`/`:114`.
  - Recenzent: **Schválit** (`/approve` → `Published`), **Vrátit s poznámkou** (`/reject` → `Rejected` + důvod), **hromadně** `bulk/approve` a `bulk/reject` (vrací `{succeeded, failed}`) — `:162`/`:169`/`:184`/`:194`.
- **Hranice / co neumí:** běžný uživatel sám nepublikuje (vždy přes recenzi). Po odeslání nelze článek editovat, dokud není vrácen. Obrázek/cover článku není samostatné pole — vkládá se jen do těla přes editor.
- **Zvláštnosti:** při odeslání ke schválení dostanou recenzenti (+`Tyky`) systémovou **poštu** (`notifyAdmins`); autor dostane poštu při schválení/vrácení. Vrácený článek nese `rejectReason`, který se autorovi zobrazí inline. **15.9 — web push autorovi** (kategorie `ownContent`) při schválení, zamítnutí i **novém hodnocení** (`pushAuthor` v `ikaros-articles.service.ts`, s `url` na článek).
- **Stav:** ✅
- **Kód:** FE `src/features/ikaros/pages/ArticleEditorPage.tsx`, `api/useBulkArticleActions.ts`. BE `ikaros-articles.controller.ts`, `article-review.provider.ts`, `ikaros-categories.controller.ts`.

---

### Galerie — prohlížení a nahrávání
- **Co to je:** Komunitní obrázková galerie s kategoriemi, hvězdičkovým hodnocením, oblíbenými a schvalovacím řízením (stejný vzor jako Články).
- **Kde:** route `/ikaros/galerie` (`GalleryPage`), nahrání/úprava `/ikaros/galerie/nahrat` a `/ikaros/galerie/:id/upravit` (`GalleryUploadPage`), detail `/ikaros/galerie/:id` (`GalleryDetailPage`). Dlaždice „Galerie" v rozcestníku **Společná tvorba**.
- **Kdo:**
  - **FE:** seznam i detail veřejné (anon); upload/editace `requireAuth` — router `:154`–`:158`.
  - **BE:** `GET` přes `OptionalJwtAuthGuard` (anon `Published`, recenzent + `Pending`). Nahrávat smí kdokoli přihlášený. Schvaluje recenzent `Superadmin`/`Admin`/`SpravceGalerie` (`ADMIN_ROLES` v `ikaros-gallery.service.ts:22`).
  - **Kategorie** galerie: create/update `Admin`/`Superadmin`, delete jen `Superadmin` (`gallery-categories.controller.ts:43`/`:74`).
- **Co jde dělat:**
  - **Nahrát obrázek** (multipart, max **10 MB**, `accept="image/*"`) s titulkem, popisem, kategorií; **povinné prohlášení práv** „Mám práva k obsahu / neobsahuje cizí chráněný materiál bez licence" (bez zaškrtnutí nelze nahrát — 20.3/§D1) + volitelné **„Tento obrázek je vytvořený AI"**; „Uložit koncept" nebo „Odeslat ke schválení" — `GalleryUploadPage.tsx:77`/`:238`/`:249`, controller `:108`.
  - **Editovat** title/description/category (ne samotný soubor) ve stavu `Draft`/`Rejected`.
  - **Hodnotit** 1–5 (+ text) na `Published`, **oblíbené**, **připnout** (max 5) — `:196`/`:216`/`:225`.
  - **Nahlásit** (20.1) — tlačítko „Nahlásit" u cizího obrázku (kategorie mj. „Autorská práva" = takedown) → moderační fronta (kap. 08).
  - Recenzent: **Schválit**/**Zamítnout s důvodem** (`/approve`, `/reject`) — `:172`/`:182`.
- **Hranice / co neumí:**
  - **„Alba" jako vlastní entita neexistují** — organizace je jen přes **kategorie** (chips/select). Žádné soukromé/sdílené album, žádné více obrázků v jednom uploadu (1 soubor = 1 položka).
  - **SVG je záměrně zakázané** (XSS vektor, UM-01) — povolené jen JPEG/PNG/GIF/WebP. Typ se ověřuje i **magic-byte** signaturou (UM-07), ne jen MIME (`upload.service.ts:54`).
  - Editace nemění samotný soubor (jen metadata).
  - Bulk approve/reject (jako u článků) tu **chybí** — schvaluje se po jednom.
- **Zvláštnosti:** EXIF/GPS metadata se při uploadu odstraňují (`strip_profile`, UM-09). Při odeslání ke schválení jde recenzentům systémová pošta s odkazem na obrázek. Smazaný autor → tombstone. **15.9 — web push autorovi** (kategorie `ownContent`) při schválení, zamítnutí i **novém hodnocení** (`pushAuthor` v `ikaros-gallery.service.ts`).
  - **Obsah/AI (20.3):** obrázek nese pole `aiOrigin` (`none`/`ai_image`, default `none`). Když autor zaškrtl „vytvořeno AI", zobrazí se u obrázku štítek **„AI"** (`AiBadge`) — na detailu i na kartě/thumbnailu. Prohlášení práv se při uploadu zapíše do samostatného **consent audit logu** (BE modul `upload_consents`, doklad „uživatel prohlásil práva"; bez UI). Strojové značení AI (vodoznak/metadata) zatím ne — čeká na Fázi 18.
  - **License card model (podklad):** BE kolekce `content_licenses` (17 polí dle právního rámce) existuje jako datový podklad pro budoucí komunitní knihovnu (21.5) — **nenapojený** na galerii, žádné UI „klonovat/licence".
- **Stav:** ✅
- **Kód:** FE `src/features/ikaros/pages/GalleryUploadPage.tsx`, `GalleryPage.tsx`, `GalleryDetailPage.tsx`, `components/GalleryCard.tsx`, `shared/media/AiBadge.tsx`, `api/useGallery.ts`. BE `ikaros-gallery.controller.ts`, `ikaros-gallery.service.ts` (`aiOrigin` schema `:36`, consent record `:274`), `gallery-categories.controller.ts`, `upload.service.ts`, `modules/upload-consents/*`, `modules/content-licenses/*` (podklad).

---

### Diskuze — vlákna a příspěvky
- **Co to je:** Fórum platformy. Diskuze (vlákno) se schvalováním, příspěvky, lajky, správci vlákna, pozvánkami a moderací nahlášených příspěvků.
- **Kde:** route `/ikaros/diskuze` (`DiscussionsPage`), nová `/ikaros/diskuze/nova` (`DiscussionsNewPage`), detail `/ikaros/diskuze/:id` (`DiscussionDetailPage`). Dlaždice „Diskuze" v rozcestníku **Společná tvorba**.
- **Kdo:**
  - **FE i BE: jen pro přihlášené.** Celý controller je za `JwtAuthGuard` (`ikaros-discussions.controller.ts:41`), všechny FE routy mají `requireAuth` (router `:176`–`:178`). Anon **vůbec nevidí** žádnou diskuzi.
  - **Vytvořit diskuzi** smí kdokoli přihlášený; pokud není admin, diskuze jde do `Pending` (`isApproved=false`) a čeká na schválení (`ikaros-discussions.service.ts:275`). Admin/recenzent (`SpravceDiskuzi`/`Admin`/`Superadmin`) má diskuzi rovnou schválenou.
  - **Editace/pozvánky/správci** = tvůrce + manažeři vlákna + admin (`isManagerOrAdmin`).
  - **Schválit/zamítnout** diskuzi a **vyřešit nahlášení** = recenzent (`assertAdmin`, `ADMIN_ROLES` v `:27`).
- **Co jde dělat:**
  - Založit diskuzi (titulek, popis), psát **příspěvky** (rich-text), stránkované načítání (`/posts?skip&limit`).
  - **Lajkovat** diskuzi, dávat do **oblíbených**, **připnout** (max 5).
  - **Správci vlákna:** přidat/odebrat manažera, **pozvat** uživatele, řešit **žádosti o přidání** do uzamčené (`isOpen=false`) diskuze (`/join-request`, `/.../resolve`).
  - **Moderace:** **nahlásit** cizí příspěvek — nově přes generický subsystém (`ReportButton targetType="discussion_post"` → `POST /moderation/reports`, kap. 08). Starý discussion report (`/posts/:postId/report` + `/reports/:reportId/resolve`) byl **odstraněn** a data zmigrována do `content_reports`. Smazat vlastní příspěvek (autor) nebo cizí (manažer/admin); moderační zásah M2/M3 příspěvek skryje přes flag `moderationHidden`, M4 smaže.
- **Hranice / co neumí:**
  - Žádné kategorie/štítky diskuzí (jen otevřená/uzamčená a oblíbené/připnuté).
  - Žádné vnořené odpovědi/threading uvnitř diskuze (ploché příspěvky); reply na konkrétní příspěvek jako u chatu tu není.
  - Nahlášení příspěvku se od 20.1 řeší v generické frontě „Zpracovat" (typ `content_report`, kap. 08), ne samostatnou stránkou.
- **Zvláštnosti:** **`GET /ikaros-discussions/my`** (D-DROBNE, 2026-07-13) — vlastní diskuze přihlášeného vč. pending/uzamčených, řazené `createdAtUtc` desc; konzumuje profil „Moje diskuze" (kap. 02, `useMyDiscussions`); statická routa záměrně PŘED `@Get(':id')` (pořadí rout, `ikaros-discussions.controller.ts:70`). Při založení nepschválené diskuze a při schválení/zamítnutí chodí systémová **pošta**. **15.9 — web push autorovi diskuse** (kategorie `ownDiscussion`) při **novém příspěvku** od někoho jiného (`ikaros-discussions.service.ts` `addPost`, s `url` na diskusi). Smazaný autor příspěvku → tombstone avatar + kurzíva (D-040). Uzamčená diskuze (`isOpen=false`) má badge zámku.
- **Stav:** ✅
- **Kód:** FE `src/features/ikaros/pages/DiscussionDetailPage.tsx`, `DiscussionsNewPage.tsx`, `api/useDiscussions.ts`. BE `ikaros-discussions.controller.ts`, `ikaros-discussions.service.ts`.

---

### Novinky platformy
- **Co to je:** Oficiální platformová oznámení Ikarosu (typ `info`/`warning`/`system`). Zobrazují se na úvodníku (první 3) a na vlastní stránce jako karty (obrázek 16:9 / fallback ikona + štítek důležitosti + datum + úryvek); klik na kartu otevře vystředěné **detail-okno** s plným obsahem, autorem a datem.
- **Kde:** route `/ikaros/novinky` (`NovinkyPage`). Menu „Novinky". Sekce na dashboardu (`PlatformNewsSection`).
- **Kdo:**
  - **Čtení (scope `active`) je veřejné** — `GET /IkarosNews` přes `OptionalJwtAuthGuard`, anon povolen (router `:190` bez loaderu).
  - **`scope=archived` / `scope=all`** vyžaduje `Admin`/`Superadmin` (anon → 401, slabá role → 403) — `ikaros-news.controller.ts:73`.
  - **Vytváření/úprava/archivace/mazání** jen `Admin`/`Superadmin` (`assertCanWrite` v `ikaros-news.service.ts:80`). `SpravceClanku/Galerie/Diskuzi` sem **nemají** přístup.
- **Co jde dělat:**
  - Číst aktivní novinky (paging `?limit&offset`, `GET /IkarosNews/count`); klik na kartu → detail-okno s plným textem (× / Escape / klik do pozadí zavře).
  - Admin: vytvořit (titulek, rich-text obsah, typ, volitelný `imageUrl`), upravit, **archivovat/odarchivovat** (idempotentní), **smazat** (hard delete).
- **Hranice / co neumí:** žádné kategorie ani hodnocení; archivace = jen skrytí z aktivního scope (data zůstávají). Anonym vidí pouze aktivní novinky.
- **Zvláštnosti:**
  - **Vytvoření novinky pošle web push** (`pushService.notifyAll(payload, 'ikarosNews')`, fire-and-forget) — `ikaros-news.service.ts`. **15.9:** filtruje se dle `notificationPreferences` (kategorie `ikarosNews`, default ZAP → kdo si ji nevypnul). Push payload **neobsahuje `url`**, takže kliknutí na bublinu otevře jen kořen `/` (deep-link se nevyužije).
  - Po každé mutaci se emituje WS signál `ikaros:news:changed` (leak-safe, bez dat) → klienti si refetchnou (`ikaros-news.gateway.ts:15`).
  - Obsah se před uložením sanitizuje (`sanitizeRichText`, F-10).
  - **Sjednoceno se světovými novinkami (2026-06-22):** karta i detail-okno = sdílené `NewsPreviewCard` + `NewsDetailModal` (`src/shared/ui/news/`); globální i světová novinka se na ně mapují přes per-doménový view-model (`NewsCardVM`). Dřívější inline rozbalení karty nahrazeno modálem (zrušeno mrtvé `defaultExpanded`).
- **Stav:** ✅
- **Kód:** FE `src/features/ikaros/pages/NovinkyPage`, `api/useIkarosNews.ts`, karta-adaptér `components/NewsCard/NewsCard.tsx`, dashboard `…/sections/PlatformNewsSection.tsx`, sdílené `src/shared/ui/news/` (`NewsPreviewCard`, `NewsDetailModal`, `NewsTypeChip`). BE `ikaros-news.controller.ts`, `ikaros-news.service.ts`, `ikaros-news.gateway.ts`.

---

### Herbář — komunitní katalog rostlin (21.5a)
- **Co to je:** Sdílená knihovna rostlin („karta bylinkáře"): dvě knihovny dle `status` (Návrhy / Schválené), detail s iluminací + tabulkou (Roste · Použití · Vzácnost · cena · štítky), editor a vklad rostliny do obchodu světa (single i bulk).
- **Kde:** `/ikaros/herbar` (knihovna) + `/ikaros/herbar/:id` (detail, `KomunitniPlantDetailPage`). BE modul `plants` (`/api/plants/community…`).
- **Kdo:** čtení veřejné (skryté rostliny vidí jen Admin+); založit návrh smí přihlášený; upravit autor nebo kurátor; schválit/smazat cokoli kurátor (= správci diskusí/článků + Admin/Superadmin, reuse `isBestieCurator`); autor smí smazat jen svůj návrh.
- **Co jde dělat:** založit návrh → kurátor schválí (pending fronta „rostliny ke schválení"); upravit všechna pole (od 2026-07-12 jde vzácnost i **vymazat** zpět na „neurčeno" — `rarity: null` → BE `$unset`); vložit do obchodu světa; **nahlásit** (`ReportButton targetType="plant"`, 2026-07-12) — moderace 20B umí rostlinu skrýt (M2/M3, `moderationHidden` + revert) i smazat (M4 = hard delete, **nevratné**), enforcement listener dle vzoru bestiae.
- **Zvláštnosti:** smazání rostliny i výměna obrázku emitují `media.orphaned` (úklid Cloudinary blobů, 2026-07-12 — dřív orphan). Seed katalogu přes FE workflow (viz memory herbar_21_5a).
- **Stav:** ✅ (Etapa A+B + report/moderace/orphan cleanup 2026-07-12)
- **Kód:** FE `src/features/ikaros/herbar/`; BE `backend/src/modules/plants/` (`plants.service.ts`, `moderation-enforcement.listener.ts`).

---

### Kouzla — komunitní katalog kouzel (21.5c)
- **Co to je:** Sdílená knihovna **vlastních** kouzel hráčů: jedno kouzlo = systémově neutrální jádro („oznámení" = lore/popis + obrázek + alternativní jména + štítky) + mapa **statblocků per herní systém** (vzor komunitní bestie). Statblok každého systému má pole dle šablony vč. **povinné školy magie** (spec-21.5c R2). Dvě knihovny dle `status` (Návrhy / Schválená) a navíc per-statblok stav draft/approved (= kurátorem přijaté jako **balancnuté**). Žádný seed z příruček (copyright, spec R4).
- **Kde:** `/ikaros/kouzla` (knihovna, `KomunitniKouzlaPage`) + `/ikaros/kouzla/:id` (detail, `KomunitniKouzloDetailPage`); dlaždice v hubu Společná tvorba (`tiles.ts` `kouzla` → active). BE modul `spells` (`/api/spells/community…`, `spells.controller.ts`).
- **Kdo:** celý controller pod `JwtAuthGuard` (login-required, parita bestiář/herbář — `spells.controller.ts:36`); skrytá kouzla vidí jen Admin+ (list `includeHidden`, detail 404 — `spells.service.ts:47`); založit návrh/navrhnout statblok/komentovat smí přihlášený; upravit jádro autor nebo kurátor; **existující statblok upraví jen kurátor** (`SPELL_STATBLOCK_EXISTS`, `spells.service.ts:131`); schválit kouzlo i statblok kurátor (= správci diskusí/článků + Admin/Superadmin, reuse `isBestieCurator`); smazat autor svůj návrh, kurátor cokoli.
- **Co jde dělat:** založit kouzlo (jádro + první statblok dle šablony systému) → draft; navrhnout statblok pro další systém (`POST …/:id/statblock`); kurátor schválí kouzlo (`…/approve`) i jednotlivý statblok (`…/statblock/:systemId/approve` = balanc); upravit jádro (`PATCH …/:id/lore` — staty tudy nejdou); smazat (`DELETE`); **dvouúrovňová diskuse** (o kouzle / ke statbloku systému, kolekce `spell_comments`); filtry knihovny: systém (dle existence statbloku) + škola magie + dvě knihovny; **nahlásit** (`ReportButton targetType="spell"`) — moderace 20B skrytí M2/M3 + revert, M4 = hard delete (nevratné), enforcement `spells/moderation-enforcement.listener.ts`; pending fronta „kouzla ke schválení" (`community_spell_pending_review`, BE provider, kurátoři).
- **Šablony statbloků (jádro featury):** `src/features/ikaros/kouzla/systems/spellTemplates.ts` — jediný zdroj pravdy polí per systém; BE ukládá `systemStats` schema-less (`Record<string, unknown>`), šablonu vynucuje FE editor (spec R6, přidání systému = bez BE migrace). Pevné šablony: drd16 (6 druhů + vlastní, zaklínadlo/magenergie/past/…/zdroj) · drdplus (6 oborů, náročnost s prahy, forma 4 osy) · dnd5e/jad (8 škol, úroveň/stupeň, složky V/P/S, povolání, soustředění/rituál) · drdh (6 oborů, mana/duš. síla, obtížnost, ověření) · coc (náklady magie+příčetnost, kategorie vlastní) · gurps (24 kolejí, cena seslání/udržování, třída) · shadowrun (5 kategorií, typ M/F, odliv) · matrix (21 škol z deníku). Volná šablona (škola + páry popisek:hodnota): drd2 (okruhy), pi/fate/fae, generic. Hodnoty polí = text (vzorce), enum jen uzavřené množiny; invarianty kryje `spellTemplates.spec.ts` (9 testů).
- **Hranice / co neumí:** bez vkladu do obchodu (svitky — otevřená otázka spec §7); bez importu kouzla do deníku postavy (šablony jsou superset deníkových polí — připraveno jako budoucí krok); bez skinů (jen stabilní data-atributy `data-spell-*`); bez klonu do světa; FE pending karta ve „Zpracovat" chybí (jen BE počty — parita s bestiářem/herbářem).
- **Zvláštnosti:** smazání kouzla i výměna obrázku emitují `media.orphaned` (úklid Cloudinary, parita plants); kurátorská úprava statbloku zachová stav i autora (upsert); filtr systému v BE = `statblocks.<id> $exists` (kouzlo „patří" všem systémům, pro které má statblok, ne jen primárnímu).
- **Stav:** ✅ (2026-07-13; ověřeno BE typecheck+lint, FE build + vitest 3602+9)
- **Kód:** FE `src/features/ikaros/kouzla/` (`spellTemplates.ts`, `KomunitniKouzlaPage.tsx`, `KomunitniKouzloDetailPage.tsx`, `components/`); BE `backend/src/modules/spells/` (`spells.service.ts`, `spell-comments.service.ts`, `community-spell-review.provider.ts`, `moderation-enforcement.listener.ts`); enumy `moderation.enums.ts` (`Spell='spell'`), `pending-action-type.enum.ts` (`CommunitySpellPendingReview`).

---

### Lektvary — komunitní katalog lektvarů (21.5b)
- **Co to je:** Sdílená knihovna **vlastních lektvarů** hráčů — hybrid kouzel a herbáře: jádro = **druh lektvaru** (léčivý/jed/… — systémově neutrální filtr) + **strukturované suroviny s množstvím** (min. 1, zadání uživatele: „vždy i suroviny přímo, případně kolik") + „oznámení" (popis účinku) + obrázek + `suggestedPrice`; k tomu mapa **statblocků per systém** (výroba + mechanika) se schvalováním „balancnuté" jako kouzla. Žádný přepis příruček (spec R4).
- **Kde:** `/ikaros/lektvary` (knihovna, `KomunitniLektvaryPage`) + `/ikaros/lektvary/:id` (detail); dlaždice hubu Společná tvorba active. BE modul `potions` (`/api/potions/community…`).
- **Kdo:** parity s kouzly — celý controller `JwtAuthGuard`; skryté jen Admin+; návrh/statblok/komentář přihlášený; jádro upraví autor/kurátor; existující statblok jen kurátor (`POTION_STATBLOCK_EXISTS`); schvaluje kurátor (`isBestieCurator`); mazání autor-draft/kurátor. **Vklad do obchodu**: tlačítko vidí přihlášený, výběr světa + BE gate omezují na PomocnyPJ+ (reuse herbář Etapa B).
- **Co jde dělat:** založit lektvar (jádro vč. surovin + první statblok) → draft; navrhnout statblok pro další systém; kurátor schválí lektvar i jednotlivé statblocky; upravit jádro (`PATCH …/lore` vč. surovin a ceny); smazat; dvouúrovňová diskuse (`potion_comments`, 'potion'/'statblock'); filtry systém/druh/štítek; **vklad do obchodu single (z detailu) i bulk (z listu, dávky ≤200, `POST /campaign/shopitems/bulk`)** — popis položky = druh + suroviny + účinek, cena předvyplněná `suggestedPrice`; **nahlásit** (`ReportButton targetType="potion"`), moderace M2/M3 hide + M4 hard delete; pending fronta `community_potion_pending_review`.
- **Šablony statbloků:** `src/features/ikaros/lektvary/systems/potionTemplates.ts` — **reuse infrastruktury kouzel** (typy polí, `SpellStatsFields`, `SpellStatblockView` zobecněný na `template` prop; žádná kopie). Pevné: drd16 (oficiální formát alchymisty: magenergie/suroviny/základ/výroba/trvání/past) · drdh (superset deníkových receptů: mana/suroviny/základ/obtížnost) · dnd5e/jad (vzácnost 5 stupňů + účinek + výroba) · gurps (forma lektvar/mast/prášek/pastilka + cena/doba/trvání) · shadowrun (spouštěč kontaktní/povelový/časový + síla) · matrix (cena/účinek/trvání). Volné (freeform, druh je v jádru): drdplus (alchymistu nemá), drd2 (mastičkář), coc, pi/fate/fae, generic. Invarianty: `potionTemplates.spec.ts` (7 testů).
- **Hranice / co neumí:** suroviny zatím NEodkazují na rostliny herbáře (jen text; strukturovaný model to připravuje); bez skinů (data-atributy `data-potion-*`); bez importu do deníku; seed z uživatelova dokumentu lektvarů = otevřené (dodá později).
- **Zvláštnosti:** `InsertToShopModal` herbáře **zobecněn** (`ShopInsertItem` + `nounMany`, mapery `plantToShopInsert`/`potionToShopInsert` v `shopInsert.ts` per feature) — jeden modal pro oba katalogy; mazání/výměna obrázku emituje `media.orphaned`; filtr systému = `statblocks.<id> $exists`.
- **Stav:** ✅ (2026-07-13; ověřeno BE typecheck+lint, FE build + cílené vitest 45)
- **Kód:** FE `src/features/ikaros/lektvary/` (`potionTemplates.ts`, `shopInsert.ts`, stránky, `components/`); BE `backend/src/modules/potions/`; enumy `moderation.enums.ts` (`Potion='potion'`), `pending-action-type.enum.ts` (`CommunityPotionPendingReview`); herbář `shopInsert.ts` + generický `InsertToShopModal`.

---

### Předměty — komunitní katalog předmětů (21.5e = realizace „items" z 21.1)
- **Co to je:** Sdílená knihovna **vlastních předmětů** (zbraně, zbroje, vybavení, kouzelné předměty). Klíčový mechanismus: **druh předmětu v jádru řídí variantu polí statbloku** — `zbraň`/`střelná/vrhací zbraň` → zbraňová pole, `zbroj`/`štít` → zbrojová, ostatní (i vlastní druh) → obecná (`itemKindGroup`). Jinak plná parita s lektvary: statblocky per systém + „balancnuté" schvalování, `suggestedPrice` + vklad do obchodu, žádný přepis příruček.
- **Kde:** `/ikaros/predmety` (knihovna) + `/ikaros/predmety/:id` (detail); **nová 9. dlaždice** hubu Společná tvorba (`Swords`). BE modul `items` (`/api/items/community…`, kolekce `community_items`).
- **Kdo:** parity s kouzly/lektvary — controller `JwtAuthGuard`; skryté jen Admin+; návrh/statblok/komentář přihlášený; jádro autor/kurátor; existující statblok jen kurátor (`ITEM_STATBLOCK_EXISTS`); schvaluje kurátor; mazání autor-draft/kurátor; obchod PomocnyPJ+ (BE gate reuse).
- **Co jde dělat:** založit předmět (jádro: druh ⭐ combo + oznámení + cena; první statblok dle druh×systém) → draft; navrhnout statblok pro další systém (varianta dle druhu jádra); kurátor schvaluje předmět i statblocky; upravit jádro (`PATCH …/lore`); smazat; dvouúrovňová diskuse (`item_comments`); filtry systém/druh/štítek; **vklad do obchodu single/bulk** (popis = druh + lore); **nahlásit** (`targetType="item"`), moderace M2/M3+M4; pending `community_item_pending_review`.
- **Šablony statbloků:** `src/features/ikaros/predmety/systems/itemTemplates.ts` — varianty weapon/armor/general per systém, **volné páry zapnuté všude** (spec R3): drd16 (tabulky zbraní: útočnost/OZ/délka/váha/cena · kvalita zbroje) · drdh (superset deníku: typ/útočnost/zranění/obrana · kvalita+ZO) · dnd5e/jad (zranění+vlastnosti multicheck · OČ+kategorie+nenápadnost+síla; všechny varianty volitelně vzácnost+naladění+magické vlastnosti = kouzelný předmět bez 4. varianty, spec R4) · gurps (sw/thr+reach/parry/acc/shots/ST · DR+lokace) · coc (dovednost/zranění/útoky/dostřel/náboje/porucha · zbroj body) · shadowrun (DV/AR/režimy/zásobník/dostupnost · hodnocení zbroje · gear s esencí) · drdplus+matrix (⚠️ doladit na živých datech) · drd2/pi/fate/fae/generic freeform. Šablony = superset deníkových zbraní/zbrojí (Drd16Weapon/Armor, DrdhWeapon/Armor, GurpsMelee/Ranged, CocWeapon, DndWeapon) → připraveno na import do výbavy. Invarianty: `itemTemplates.spec.ts` (8 testů).
- **Hranice / co neumí:** bez importu do výbavy postavy; bez skinů (data-atributy `data-item-*`); drdplus/matrix pole orientační; seed žádný (jen vlastní tvorba).
- **Zvláštnosti:** BE modul vznikl kopií potions (bez ingrediencí) — kolekce pojmenována `community_items` (ne `items`, aby generický název nekolidoval); reuse `SpellStatsFields`/`SpellStatblockView`/`InsertToShopModal` (`catalogItemToShopInsert`).
- **Stav:** ✅ (2026-07-13; ověřeno BE typecheck+lint, FE build + cílené vitest 27)
- **Kód:** FE `src/features/ikaros/predmety/`; BE `backend/src/modules/items/`; enumy `moderation.enums.ts` (`Item='item'`), `pending-action-type.enum.ts` (`CommunityItemPendingReview`).

---

### Hádanky — komunitní katalog hádanek (21.5d)
- **Co to je:** Zásobárna hádanek pro PJ — **nejjednodušší knihovna** (bez statblocků, bez obchodu; hádanka je systémově neutrální). Jádro: **zadání** (= identita, žádné `name` — nespoilerovat/nevymýšlet názvy, spec R4) + **odpověď a postupné nápovědy skryté za spoiler klik** (spec R3, řeší otázku roadmapy „reveal komu" — bez role-gate) + **úroveň** (enum `lehka/stredni/tezka/ultratezka`, hlavní filtr, spec R2) + původ + poznámka pro PJ + štítky + volitelný obrázek. **Seed 48 volných hádanek** (lidová slovesnost + antika/bible + logický folklór, vlastní formulace — copyright rešerše [hadanky-seed-21.5d.md](../arch/phase-21/hadanky-seed-21.5d.md)).
- **Kde:** `/ikaros/hadanky` (knihovna) + `/ikaros/hadanky/:id` (detail) — **nahradil POSLEDNÍ stub Společné tvorby** (`ComingSoonPage` už žádná route nepoužívá; komponenta v repu zůstává nevyužitá). BE modul `riddles` (`/api/riddles/community…`, kolekce `riddles` + `riddle_comments`).
- **Kdo:** parity s ostatními — controller `JwtAuthGuard`; skryté jen Admin+; návrh/komentář přihlášený; **úprava = plná editace jádra jedním PATCH** (autor/kurátor, spec R5 — žádný lore/statblock split); schvaluje kurátor (`isBestieCurator`); mazání autor-draft/kurátor.
- **Co jde dělat:** založit hádanku (zadání+odpověď+úroveň ⭐, nápovědy 0–5, původ, poznámka) → draft; kurátor schválí; upravit; smazat; **jednoúrovňová diskuse** (`riddle_comments`); filtr úroveň (chips) + dvě knihovny; v detailu **„Odhalit odpověď"** a **nápovědy po jedné** (`RiddleReveal`); **nahlásit** (`targetType="riddle"`), moderace M2/M3+M4; pending `community_riddle_pending_review`.
- **Seed:** `backend/scripts/seed-riddles/index.ts` (vzor seed-plants, bez obrázků, data ve skriptu; idempotence dle `question`; `status:'approved'`, autor Superadmin; 12+14+14+7 — U6 „mini-einstein" se doimportuje po doladění indicií). Spustit po deployi: `npx ts-node scripts/seed-riddles/index.ts` (PROD přes `MONGODB_URI`).
- **Hranice / co neumí:** bez „zahraj si" kvíz módu; bez obchodu (záměr); bez skinů (data-atributy `data-riddle-*`); reveal bez role-gate (spoiler = ochrana před omylem).
- **Zvláštnosti:** dokončením 21.5d jsou **všech 9 dlaždic hubu aktivních** — opravena i letitá nesrovnalost dlaždice Bestiář (`active:false` „Připravujeme", ač bestiář fungoval); hub test přepsán (žádný stub).
- **Stav:** ✅ (2026-07-13; ověřeno BE typecheck+lint, FE build + cílené vitest; seed čeká na spuštění po deployi)
- **Kód:** FE `src/features/ikaros/hadanky/` (`RiddleReveal.tsx`, stránky, editor, diskuse); BE `backend/src/modules/riddles/`; seed `backend/scripts/seed-riddles/`; enumy `moderation.enums.ts` (`Riddle='riddle'`), `pending-action-type.enum.ts` (`CommunityRiddlePendingReview`).

---

### Ceníky — komunitní knihovna ceníků (21.5f)
- **Co to je:** Sdílené **ceníky zboží a služeb** — ceník = JEDEN dokument s vnořenými položkami (max 200), každá položka má název + popis + obrázek s atribucí + **strukturovanou cenu zlaté/stříbrné/měďáky** (pevný poměr 1 zl = 10 st = 100 md) + volitelnou sekci („V hospodě", regiony…) a volitelný **link na předmět katalogu Předmětů** (staty per systém se tady NEduplikují — spec R4). Vklad do obchodu světa s **per-položkovými cenami** (jediná knihovna, která to umí).
- **Kde:** `/ikaros/ceniky` (knihovna, `KomunitniCenikyPage`) + `/ikaros/ceniky/:id` (detail s tabulkou položek po sekcích); **nová 10. dlaždice** hubu (`ReceiptText`). BE modul `price-lists` (`/api/price-lists/community…`, kolekce `price_lists` + `price_list_comments`).
- **Kdo:** parity s rodinou — celý controller `JwtAuthGuard` (`price-lists.controller.ts:35`); skryté jen Admin+ (list `includeHidden`, detail 404 — `price-lists.service.ts:57`); návrh/komentář přihlášený; úprava = plná editace jedním PATCH (autor/kurátor, `PRICELIST_NOT_AUTHOR`); schvaluje kurátor (`isBestieCurator`); mazání autor-draft/kurátor; vklad do obchodu PomocnyPJ+ (reuse herbář gate).
- **Co jde dělat:** založit ceník (jádro + inline editor položek: přidat/upravit/smazat/přesunout ↑↓, sekce, obrázek + povinná atribuce u převzatých, cena 3 pole, link na předmět URL/id) → draft; kurátor schválí; **vklad do obchodu** single (řádek položky) i bulk „Vlož do obchodu (N)" respektující aktivní **filtr sekce** — každá položka si nese vlastní cenu (`priceGsc`, přepočet `zl + st/10 + md/100` ve zvolené „měně pro zlaté", svět bez měn = číslo bez měny); jednoúrovňová diskuse (`price_list_comments`); **nahlásit** (`targetType="price_list"`, 17. plocha 20B), moderace M2/M3 hide + M4 hard delete; pending `community_price_list_pending_review`; detail zobrazuje atribuci obrázku (tooltip na miniatuře) a překlik „⚔ Staty" na linknutý předmět.
- **Rozšíření `InsertToShopModal` (průřezové):** `ShopInsertItem.priceGsc?` — mají-li ho VŠECHNY položky, modal skryje „Výchozí cena (pro všechny)" a nabídne jen select „Měna pro zlaté"; cena se počítá per položka. Zpětně kompatibilní s herbářem/lektvary/předměty (bez `priceGsc` beze změny). `InsertToShopModal.tsx` (`allGsc`, `gscToDecimal`). 21.5g: prop `priceCurrency?` jen přepíná popisky selectu („Měna pro dolary/kredity"), výpočet je stejný.
- **Měny ceníků (21.5g):** `PriceList.currency: 'gsc' | 'usd' | 'credits'` (default `gsc`, bez migrace — starší dokumenty pole nemají, `toEntity` fallback na gsc). Uložení ceny je VŽDY `{gold,silver,copper}` (1:10:100); měna řídí jen zobrazení a editaci: `usd` = `$12.34` (gold=dolary, silver=desetníky, copper=centy; `formatPrice` v `types.ts`), editor jedno desetinné pole `$` (`decimalToGsc`, přepnutí měny bezeztrátové), badge „$ USD" na kartě knihovny + „ceny v dolarech ($)" v metaLine detailu. `credits` = rezervováno pro éru Budoucnost. Éry obsahu: středověk/fantasy (seed Morvol, gsc) → Přítomnost (seed 21.5g, usd, tag `přítomnost`) → Budoucnost (později); follow-up nápad: 1./2. světová válka (dobové USD).
- **Hranice / co neumí:** bez statblocků přímo v položkách (řeší link na Předměty); editor linku = URL/id input, ne picker; bez skinů (data-atributy `data-cenik-*`); kurz 1:10:100 pevný (needitovatelný); sekce se do obchodu nepřenáší jako skupina (jen text v popisu položky).
- **Seed (připraven, čeká na dry-run schválení + deploy):** 20 ceníků / ~1011 položek z uživatelova `Ceník.xlsx` (Morvol) + **103 zbraní/zbrojí do Předmětů** (systemId `matrix`, statblok approved s kostkami/kvalitou, provázané `linkedItemId`). Obrázky: Wikimedia Commons (jen PD/CC0/CC BY/CC BY-SA, atribuce v `imageCredit`), upload na Cloudinary `community-ceniky` dělá import uvnitř BE kontejneru. Workflow `.github/workflows/seed-ceniky.yml` + `scripts/seed-migrace/ceniky-import.js` + `ceniky-seed.json` (idempotentní dle `seedTag: ceniky:morvol:v1`).
- **Seed éry Galaktické dobrodružství (21.5k, čeká na dry-run schválení):** 13 ceníků / 380 položek v kreditech (space opera, setting-neutrální; kalibrace z fan ekonomik dle pokynu uživatele — Traveller/SW/Elite/Starfinder, jen hodnoty a poměry) + 38 předmětů (energetické zbraně `střelná`, zbroje a osobní štíty `zbroj`; bez statbloků). Hvězdné lodě (ojetý frachtýř 250 000 kr), kybernetika, droidi, FTL doprava (hibernační pasáž 250 kr), xeno-kuchyně. Tag `galaktické dobrodružství`, workflow `seed-ceniky-galaxy.yml` (seedTag `ceniky:galaxy:v1`), obrázky Wikimedia 380/380 (reálné analogy).
- **Seed éry Blízká budoucnost (21.5j, čeká na dry-run schválení):** 13 ceníků / 380 položek v **kreditech** (`currency:'credits'`, 1 kr ≈ kupní síla 1 USD 2025; první éra s fikčními cenami = extrapolace reálné vesmírné ekonomiky dle tabulky kotev ve spec — Starship $/kg, MOXIE, ISS recyklace, asteroid-mining deflace) + 27 předmětů (skafandry `zbroj`, flechette/coilgun `střelná`, nesmrtící `zbraň`; bez statbloků). Tag `blízká budoucnost`, workflow `seed-ceniky-nearfuture.yml` (seedTag `ceniky:nearfuture:v1`), obrázky Wikimedia 379/380 (reálné NASA analogy). **Knihovna seskupená podle ér (21.5j R7):** `PRICE_LIST_ERAS` registr v `types.ts` (tag→label chronologicky) + `eraOf()` fallback „Ostatní a komunitní"; `KomunitniCenikyPage` renderuje érové sekce s počty; bez BE změny. **+ klikací chips filtr ér** nad štítkovým filtrem (jen existující éry s počty, „Vše" reset, `aria-pressed`, kombinuje se se štítkovým filtrem).
- **Seed éry Divoký západ (21.5i, čeká na dry-run schválení):** 13 ceníků / 391 položek (dobové USD ~1865–1890; kovboj $25–40/měs, Colt SAA $17, Winchester 1873 $27, Stetson $5, Levi's $1.25, longhorn Texas $4 vs. Kansas $30 — cattle drive marže, Homestead $18) + 31 předmětů (zbraně/nože bez statbloků). Tag `divoký západ`, workflow `seed-ceniky-western.yml` (seedTag `ceniky:western:v1`). Obrázky Wikimedia 100 %.
- **Seedy ér 1. a 2. světové války (21.5h, čekají na dry-run schválení per éra):** WW1 = 15 ceníků / 454 položek (dobové USD ~1917–18; žold Pay Act 1917, BLS 1918, Sears 1918, kontraktní ceny zbraní — Colt M1911 $14.50, Fordson $750) + 38 předmětů; WW2 = 14 ceníků / 434 položek (~1942–44; Pay Readjustment Act 1942, OPA stropy + přídělové známky v popisech, M1 Garand $85, Thompson $209→$45, penicilin $20→$1) + 28 předmětů. Předměty bez statbloků (mirror 21.5g). Názvy ceníků nesou éru („Potraviny — 1. světová"), tagy `1. světová`/`2. světová`, currency `usd`. Workflows `seed-ceniky-ww1.yml`/`seed-ceniky-ww2.yml` (seedTag `ceniky:ww1:v1`/`ceniky:ww2:v1`). Obrázky Wikimedia 100 % (454/454, 434/434; velká výhoda dobové PD fotografie).
- **Seed éry Přítomnost (21.5g, čeká na dry-run schválení + deploy):** 22 ceníků / ~995 položek v USD z rešerše veřejných US dat (BLS OES mzdy, BLS average prices potraviny, MSRP/KBB/Zillow/UNODC…) — práce a výdělky, potraviny, restaurace, nápoje, drogerie, domácnost, oblečení, elektronika, předplatné, nemovitosti, auta, doprava, služby, zdraví, zbraně, ochrana, outdoor, sport, zvířata, knihy, drogy. **~73 zbraní/ochrany do Předmětů BEZ statbloků** (Matrix věci nemají kostky ani bonusy — jen jádro; statblok doplní komunita). `ceniky-import.js` parametrizován env `SEED_TAG`/`ITEM_TAGS` (defaulty = Morvol, zpětně kompatibilní); workflow `seed-ceniky-pritomnost.yml`, `seedTag: ceniky:pritomnost:v1`, tag položek `přítomnost`.
- **Zvláštnosti:** položky = vnořené subdokumenty (pořadí = pořadí v poli, `id` uuid doplní service); úklid blobů diffuje **množiny** URL (cover + všechny položky) — `media.orphaned` při update i delete (`price-lists.service.ts` `collectImageUrls`); editor drží celé objekty položek → needitovaná pole (focal/zoom/fit, `imageBytes`) přežijí plnou náhradu `items`.
- **Stav:** ✅ FE+BE (2026-07-13; BE typecheck+lint ✓, FE build + vitest 107 ✓) · ✅ 21.5g měny FE+BE (2026-07-13; vitest `types.spec.ts` 7 ✓) · 🚧 oba seedy čekají na dry-run schválení uživatelem + deploy BE
- **Kód:** FE `src/features/ikaros/ceniky/` (`types.ts` s `formatGsc`/`formatPrice`/`decimalToGsc` + `types.spec.ts`, stránky, `components/CenikEditorModal.tsx`, `CenikDiscussion.tsx`, `shopInsert.ts`), modal `src/features/ikaros/herbar/components/InsertToShopModal.tsx`; BE `backend/src/modules/price-lists/`; enumy `moderation.enums.ts` (`PriceList='price_list'`), `pending-action-type.enum.ts` (`CommunityPriceListPendingReview`); seed `scripts/seed-migrace/ceniky-*.js` + workflow `seed-ceniky.yml`/`seed-ceniky-pritomnost.yml`.

---

### Generátory — jména + potomci (21.2a = první realizace 21.2)
- **Co to je:** Procedurální generátory bez AI nákladů: **Jména** (náhodná jména ze **jmenných sad** — národ/stát = mužská + ženská jména + příjmení + volitelná přízviska) a **Potomci** (demografický generátor rodin: porodní řada dle předindustriální demografie — počet dětí je výsledek, ne hod kostkou; úmrtí matky při porodu 1 %/porod, dvojčata 1,5 %, pohlaví 51,2 % ♂, presety úmrtnosti Středověk/Tvrdý svět/Prosperita, dožití z úmrtnostní tabulky, příčiny smrti dle věku/pohlaví). **Generování běží čistě na klientu** (`engine/` — mulberry32 seed, Zipf, Markov není na FE). Sady plní komunita.
- **Kde:** `/ikaros/generatory` (**11. dlaždice** hubu, `Dices`; taby Jména · Potomci · Sady) + `/ikaros/generatory/sady/:id` (detail sady). BE modul `name-sets` (`/api/name-sets/community…`, kolekce `name_sets`).
- **Kdo:** controller `JwtAuthGuard` (login-required, parita rodiny — `name-sets.controller.ts:33`); skryté sady jen Admin+ (`name-sets.service.ts:57`); sadu založí přihlášený (draft), upraví autor/kurátor, schválí kurátor (`isBestieCurator`), smaže autor-draft/kurátor; moderace 20B (`targetType="name_set"`, M2/M3 hide + M4 hard delete); pending `community_name_set_pending_review`.
- **Co jde dělat:** **Jména** — **filtr typu sad V10** (chips Vše/Fantasy (rasy)/Státy světa/Vlastní — zúží select; label `morvol` = „Fantasy (rasy)"), výběr sady, počet 1–50, pohlaví, formát, „běžná jména častěji" (Zipf, jen `frequencySorted` sady), **přízviska V10** (rodová shoda datovou konvencí: jednoslovné adjektivum „-ý" se strojově přechýlí `feminizeEpithetCs`, předložkové fráze neutrální; obsah = 44 doložených panovnických přídomků + fráze pro státy, per-rasa pooly pro 22 fantasy ras), **zámky per řádek** (přežijí přegenerování), kopírování, **deterministický seed** (zobrazí se, stejný seed = stejný výsledek). **Potomci** — jmenná sada (jména + volitelný **demografický profil sady**: násobek dožití + okno plodnosti → elfí demografie), preset úmrtnosti, **generace 1–3** (mini-rodokmen, strop ~200 osob, synové dědí příjmení), **rok světa** (výstup v letopočtech), toggle zemřelých dětí, „rovnou pojmenovat", kopie jako text. **Sady** — 2 knihovny, filtr kategorie, hledání, editor (textarey jedno jméno/řádek, BE dedupuje; přechylování `-ová` per sada, demografický profil), detail s ukázkami a kurátorskými akcemi.
- **Hranice / co neumí:** list sad vrací jen souhrny s počty (plné seznamy až detail — sada má tisíce jmen); bez napojení na tvorbu NPC/rodokmen 17.7 (výstup se kopíruje); sekce Království z autorova Excelu vynechána (rozhodnutí 2026-07-13); bez skinů (data-atributy `data-generator-*`).
- **Seed (připraven, čeká na dry-run + deploy):** ~76 sad — 22 Morvol národů (z `Generátor jmen Morvol.xlsx`, normalizace + doplnění na ≥500/500/800: reálně-jazykové národy z Wikidata CC0, fantasy národy Markovovou syntézou ve stylu autorových jmen) + 54 států světa (Wikidata, řazeno četností). Workflow `seed-name-sets.yml` + `scripts/seed-migrace/name-sets-import.js` (seedTag `name-sets:v1`).
- **Zvláštnosti:** enginy mají vlastní vitest suitu (14 testů — determinismus, Zipf, přechylování, invarianty porodní řady, strop rekurze, patrilineární jména); demografický model doložen zdroji (CAMPOP, OWID) ve spec 21.2a.
- **Stav:** ✅ FE+BE (2026-07-13; BE typecheck+lint ✓, FE build + vitest 18 ✓) · ✅ NASAZENO vč. seedu · ✅ V10 filtr+přízviska (2026-07-14; vitest 16 ✓) — 🚧 re-seed s přízvisky čeká na schválení náhledu (`c:\tmp\prizviska-nahled.html`) + re-run workflow
- **Kód:** FE `src/features/ikaros/generatory/` (`engine/` random+names+demography+familyNames, `GeneratoryPage.tsx`, `NameSetDetailPage.tsx`, `components/`); BE `backend/src/modules/name-sets/`; enumy `moderation.enums.ts` (`NameSet='name_set'`), `pending-action-type.enum.ts` (`CommunityNameSetPendingReview`); seed `scripts/seed-migrace/name-sets-*`.

---

## ⚠️ Nesrovnalosti & dluhy (k ověření)

1. **Web push novinek bez deep-linku.** `IkarosNewsService.create` volá `notifyAll` bez pole `url`, takže service worker (`public/sw.js:30`) otevře default `/` místo `/ikaros/novinky`. Deep-link infrastruktura existuje, ale není naplněna. (Stejný problém má i push globálního chatu — viz kap. 05.)
2. ✅ VYŘEŠENO 15.9 — **opt-out novinek existuje.** `notifyAll` nyní filtruje dle `notificationPreferences` (kategorie `ikarosNews`); kdo nestojí o novinky, vypne si je v profilu (sekce „Nastavení notifikací", kap. 05). (Default zůstává ZAP — novinky jsou opt-out, ne opt-in.)
3. ✅ OPRAVENO 2026-06-18 — **Zastaralý komentář u role.** `article-review.provider.ts:11` tvrdí „BE enum má dvojité „uu" (FE má SpravceClanku)". Ověřeno: oba enumy mají `SpravceClanku` (BE `user.interface.ts:11`, FE `index.ts:10`) — komentář i odkaz na dluh `D-NEW-role-name-mismatch` jsou neaktuální.
4. **`Tyky` hardcoded admin.** Bypass přes username `=== 'Tyky'` je rozeset ve 3 service (články/galerie/diskuze). Křehké (závisí na jménu, ne roli) a duplikované.
5. **Galerie nemá „alba".** Zadání zmiňuje „alba/kategorie" — reálně existují **jen kategorie**, žádná entita album. Pro průvodce formulovat jako kategorie.
6. **Galerie postrádá bulk approve/reject**, který články mají — nekonzistence schvalovacího UX mezi dvěma jinak identickými moduly.
7. ✅ VYŘEŠENO 20.1 — **Moderace diskuzí sjednocena do generické fronty.** Nahlášení příspěvku jede přes `POST /moderation/reports` (`ReportButton targetType="discussion_post"`) a recenzent ho vyřizuje ve frontě „Zpracovat" (`content_report`, `ContentReportRenderer`, kap. 08). Starý discussion report (`POST :id/posts/:postId/report` + `.../reports/:reportId/resolve`) i schema `ikaros_discussion_reports` **odstraněny**, data zmigrována do `content_reports`.
8. **Mazání kategorií jen Superadmin** (články i galerie) — `Admin` je vytvoří/upraví, ale nesmaže. Záměr, ale pro uživatele matoucí; zmínit v průvodci.
9. **Komunitní Bestiář (16.2b-2) nemá v této kapitole plnou inventuru** — knihovna, detail (statblocks, diskuse, návrhy statů), kurátorské schvalování běží, ale kódem ověřený zápis chybí. Novinka 2026-07-12: detail má `ReportButton targetType="bestie"` (BE enforcement B5 byl ready, tlačítko chybělo — D-066a). **✅ OPRAVENO 2026-07-19 — mazání návrhů (parita se 7 katalogy):** bestiář jako jediný z rodiny neuměl mazat community bytosti — FE nemělo tlačítko a BE `assertCanWrite` neměl `community` větev, takže generický `DELETE /bestiae/:id` **pouštěl kohokoli smazat i schválené bytosti (IDOR)**. Nově: `assertCanWrite` community = `autor smí svůj draft, kurátor cokoli` (jinak 403, kód `BESTIE_NOT_AUTHOR`) — zavřená díra; FE `deleteCommunityBestie` + tlačítko „🗑 Smazat" v `KomunitniBestieDetailPage` (`canDelete = kurátor || (autor && draft)`). Reuse generického `DELETE /bestiae/:id` = **soft delete** (restorovatelný; ostatní katalogy hard-delete) — community query filtruje `deletedAt:null`, návrh po smazání zmizí.
10. **Report bez jména autora (bestie/rostlina/kouzlo/lektvar/předmět/hádanka):** entity nesou jen `authorId`, ne username → `targetAuthorName` v reportu je neutrální „Autor …". Moderátor vidí ID (ban funguje), jméno si musí dohledat.
