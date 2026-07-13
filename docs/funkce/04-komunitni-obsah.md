# 04 — Komunitní obsah (platforma)

Kapitola pokrývá platformový (mimo-světový) komunitní obsah Ikarosu: **Články**, **Galerii**, **Diskuze** a **Novinky platformy**. Vše ověřeno přímo v kódu FE i BE.

Společné principy ověřené v kódu:
- **Globální role**, ne světové. Správa obsahu je vázaná jen na `UserRole` (`Superadmin`, `Admin`, `SpravceClanku`, `SpravceGalerie`, `SpravceDiskuzi`). PJ je world-scoped a do platformy **nepatří** (komentáře N-14 / D-069 v kódu). Enum: FE `src/shared/types/index.ts:6`, BE `backend/src/modules/users/interfaces/user.interface.ts:1`.
- **Speciální bypass:** uživatelské jméno `Tyky` je v `isAdmin` článků/galerie/diskuzí natvrdo považováno za admina (`ikaros-articles.service.ts:60`, `ikaros-gallery.service.ts:96`, `ikaros-discussions.service.ts:91`).
- **Schvalovací workflow** (články + galerie): stavy `Draft → Pending → Published`, případně `Rejected`. Anon/běžný uživatel vidí jen `Published`, recenzent navíc `Pending`.
- **Pending fronta** se vedle vlastní stránky modulu objevuje i v centru notifikací v tabu „Ke zpracování" (PendingActions providery) a jako badge u nav položek (`IkarosLayout`).

---

### Společná tvorba — rozcestník komunitního obsahu
- **Co to je:** Platformový hub sjednocující veškerou komunitní tvorbu do jedné mřížky dlaždic (tlačítek). Vstupní bod pro Diskuze/Články/Galerii, komunitní **Bestiář** (16.2b-2) a **Herbář** (21.5a); Lektvary/Kouzla/Hádanky zatím stuby.
- **Kde:** route `/ikaros/tvorba` (`TvorbaHubPage`). Hlavní navigace: jedno tlačítko „Společná tvorba" (ikona `Palette`), které **nahradilo** samostatné položky Diskuze/Články/Galerie. „RPG systémy" zůstává v nav samostatně (veřejný SEO landing, ne komunitní tvorba). Stuby: `/ikaros/{lektvary,kouzla,hadanky}` → sdílená `ComingSoonPage`.
- **Kdo:** hub i stuby **veřejné** (anon, bez `requireAuth`) — router `src/app/router.tsx`. Jednotlivé cíle si řeší vlastní gating (Diskuze má `requireAuth` → anon klik = login). Data dlaždic `src/features/ikaros/pages/SpolecnaTvorba/tiles.ts`.
- **Co jde dělat:** proklik na kteroukoli sekci — aktivní dlaždice vede na svou stránku, stub na `ComingSoonPage` („Připravujeme", `noindex`) s odkazem zpět na hub. Aktivní dlaždice nese moderační badge (počet pending pro recenzenta) z `usePendingActionsCount`.
- **Hranice / co neumí:** Lektvary/Kouzla/Hádanky jsou **jen kostry** — žádný obsah, datový model ani editor (roadmap2 21.5b–d). Hub je čistě navigační vrstva, sám žádný obsah nedrží. Bestiář a Herbář už žijí (viz sekce Herbář níže; komunitní Bestiář čeká na plnou inventuru — viz Nesrovnalosti).
- **Zvláštnosti:** navigační badge „Společná tvorba" v `IkarosLayout` agreguje **součet** pending typů Diskuze+Články+Galerie (`NavItem` prop `pendingTypes`), aby moderátor o signál sloučením nepřišel; tooltip vyjmenuje neprázdné. Hub v prerenderu klasifikován jako statická cesta (delší TTL); stuby `noindex`.
- **Stav:** 🚧 (hub + nav ✅ 2026-07-03; Bestiář ✅ 16.2b-2, Herbář ✅ 21.5a; Lektvary/Kouzla/Hádanky = stuby)
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

## ⚠️ Nesrovnalosti & dluhy (k ověření)

1. **Web push novinek bez deep-linku.** `IkarosNewsService.create` volá `notifyAll` bez pole `url`, takže service worker (`public/sw.js:30`) otevře default `/` místo `/ikaros/novinky`. Deep-link infrastruktura existuje, ale není naplněna. (Stejný problém má i push globálního chatu — viz kap. 05.)
2. ✅ VYŘEŠENO 15.9 — **opt-out novinek existuje.** `notifyAll` nyní filtruje dle `notificationPreferences` (kategorie `ikarosNews`); kdo nestojí o novinky, vypne si je v profilu (sekce „Nastavení notifikací", kap. 05). (Default zůstává ZAP — novinky jsou opt-out, ne opt-in.)
3. ✅ OPRAVENO 2026-06-18 — **Zastaralý komentář u role.** `article-review.provider.ts:11` tvrdí „BE enum má dvojité „uu" (FE má SpravceClanku)". Ověřeno: oba enumy mají `SpravceClanku` (BE `user.interface.ts:11`, FE `index.ts:10`) — komentář i odkaz na dluh `D-NEW-role-name-mismatch` jsou neaktuální.
4. **`Tyky` hardcoded admin.** Bypass přes username `=== 'Tyky'` je rozeset ve 3 service (články/galerie/diskuze). Křehké (závisí na jménu, ne roli) a duplikované.
5. **Galerie nemá „alba".** Zadání zmiňuje „alba/kategorie" — reálně existují **jen kategorie**, žádná entita album. Pro průvodce formulovat jako kategorie.
6. **Galerie postrádá bulk approve/reject**, který články mají — nekonzistence schvalovacího UX mezi dvěma jinak identickými moduly.
7. ✅ VYŘEŠENO 20.1 — **Moderace diskuzí sjednocena do generické fronty.** Nahlášení příspěvku jede přes `POST /moderation/reports` (`ReportButton targetType="discussion_post"`) a recenzent ho vyřizuje ve frontě „Zpracovat" (`content_report`, `ContentReportRenderer`, kap. 08). Starý discussion report (`POST :id/posts/:postId/report` + `.../reports/:reportId/resolve`) i schema `ikaros_discussion_reports` **odstraněny**, data zmigrována do `content_reports`.
8. **Mazání kategorií jen Superadmin** (články i galerie) — `Admin` je vytvoří/upraví, ale nesmaže. Záměr, ale pro uživatele matoucí; zmínit v průvodci.
9. **Komunitní Bestiář (16.2b-2) nemá v této kapitole plnou inventuru** — knihovna, detail (statblocks, diskuse, návrhy statů), kurátorské schvalování běží, ale kódem ověřený zápis chybí. Novinka 2026-07-12: detail má `ReportButton targetType="bestie"` (BE enforcement B5 byl ready, tlačítko chybělo — D-066a).
10. **Report bez jména autora (bestie/rostlina):** entity nesou jen `authorId`, ne username → `targetAuthorName` v reportu je neutrální „Autor bestie/rostliny". Moderátor vidí ID (ban funguje), jméno si musí dohledat.
