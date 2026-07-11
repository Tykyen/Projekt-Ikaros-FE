# role — 04 Svět: stránky / wiki / AKJ · dosažená L2 (kontrakt obě strany) / cílová L2+ (LK/PC → L3)

Styl: role (plán `docs/role-plan/04-svet-stranky-akj.md`, registr `docs/role-audit.md`, prefix R-). READ-ONLY.
Rozsah: BE `pages` (controller/service/repo), `world-page-templates`, `search` (controller/coordinator/meili/embedding), users favorite-pages · FE `features/world/pages` (PageViewer, WithAkjTabs, PageHeader, PageEditorPage, CharacterDirectory, WorldSettings/PageTemplatesTab), `features/world/search`.

Pozn.: řádky v plánu 04 jsou zastaralé (pages.service.ts nabobtnal). Aktuální kotvy: `assertAccess` :1087, `passesAccess` :1048, `filterAkjTabsForViewer` :1185, `assertCanWrite` :1236, `assertCanViewWorld` :1144, `findAllSlugs` :731, `findVisibleSlugs` :758, `shieldedFromRequirements` :900, `findDirectory` :666.

## Nové nálezy

### R-RUN-04A — [SP-01/02 · PC LK] Search index není scopovaný na worldId; cross-world leak title přes slug kolizi
- **Kde:** BE `modules/search/meili-search.service.ts:36-59` (index `filterableAttributes: ['slug','worldId']` **deklarováno**, ale `toDocument` :126-139 worldId **NEzapisuje**) + `search` :76-89 (žádný `filter: worldId=X`) · `modules/search/embedding-search.service.ts:117-152` search + `:200` save (embedding taky bez worldId) · `search.coordinator.ts:13-25` (bez worldId) · jediné zúžení = `search.controller.ts:81-85` post-filter `results.filter(r => visibleSlugs.has(r.slug))`.
- **Důkaz:** `findVisibleSlugs(worldId, requester)` (pages.service.ts:758) vrací slugy ve `worldId`, na které má requester page-level přístup. `SearchResult` (meili/embedding) **nenese worldId** → controller nemůže filtrovat na svět, filtruje jen na shodu **slugu**. Slug je unikátní jen v rámci světa (`{worldId,slug}` unique); napříč světy kolize je běžná — seedy tvoří identické slugy (`pravidla`, `magicka-pravidla`, rulebook, „intro" apod.). Scénář: requester je člen světa A (worldId=A projde `worldsService.findByIdForRequester`), svět B (privátní, není členem) má stránku slug `s1` title „Tajný plán zrádce"; svět A má přístupnou `s1`. Dotaz „zrádce" → globální MeiliSearch vrátí hit světa B (title B) → `visibleSlugs(A)` obsahuje `s1` → hit projde → requester vidí **cizí (privátní) title + signál shody dotazu**.
- **Dopad:** Cross-world únik title stránek + signálu „cizí svět má stránku matchující dotaz", podmíněný slug-kolizí (kvůli seedům běžná). Title-only, ne obsah (SearchResult nese jen id/title/slug/score). Member-scoped. AKJ v RÁMCI světa je ošetřeno (page-level přes `findVisibleSlugs`, akjTabs se do indexu záměrně neindexují — embedding-search.service.ts:336-338). Registr SP-01/02 uzavřel „✅ filtr kryje oba" — slug-kolizní cross-world dimenzi neřešil → 🆕.
- **Návrh:** Scope na index-úrovni: zapsat `worldId` do meili dokumentu (`toDocument`) a přidat `filter: 'worldId = ' + worldId` v `search()`; embedding index filtrovat na worldId (uložit worldId do PageEmbedding + filtr před VP-tree/po). Případně přidat `worldId` do `SearchResult` a filtrovat i na něj v controlleru (post-filtr slug pak jako 2. pojistka). FE `useWorldSearch` už worldId posílá — díra je čistě BE.
- **Klasifikace:** 🆕 🟠 · **L2** (obě strany přečteny; runtime leak = PROOF-REQUEST M8).

### R-RUN-04B — [SP-10 · LK] Adresář: stránka omezená JEN `UserId` requirementem se jeví jako normální (odemčená) karta → title/hero leak + klik→403
- **Kde:** BE `pages.service.ts:900-961` `shieldedFromRequirements` (UserId req se do `out` **NEpřidává**, :912-915 privacy) → `findDirectory` :712-728 mapuje entry na `{...rest(title,slug,type,imageUrl), shieldedBy}`; entry se **nikdy nedropuje** kvůli přístupu.
- **Důkaz:** Stránka s jediným `UserId` requirementem, kterou viewer nesplňuje → `granted=false`, `out=[]` (UserId přeskočen) → `return out.length>0 ? out : undefined` = **undefined** → `shieldedBy=undefined` → FE (CharacterDirectory / adresář stránek) renderuje **plnou normální kartu** (title+imageUrl), bez zámku. Klik → `findBySlug` → `assertAccess` :1087 → **403**. Kontrast: Role/AKJ/AKJType neuspokojené → `out` neprázdný → **locked** karta (záměr, D-062c stub + spec-akj-locked-tabs-visible). UserId je jediný typ, co spadne na „normální kartu".
- **Dopad:** Title + hero image stránek vyhrazených konkrétnímu uživateli (accessRequirements `UserId`) viditelné všem členům světa v adresáři bez indikace omezení; klik dá matoucí 403. Nízké (title/image, member-scoped, ne obsah). Možná záměr (privacy: neprozradit „komu je vyhrazená") — ale vedlejší efekt „normální otevíratelně vypadající karta" je horší než hide i než locked.
- **Návrh:** Sjednotit s hide-vs-lock logikou AKJ tabů: kartu s neuspokojeným UserId reqem buď úplně skrýt (jako Role/private taby), nebo vrátit generický locked indikátor bez UserId hodnoty.
- **Klasifikace:** 🆕 🟡 · **L2**.

## Ověřeno OK (bez nálezu, L2)
- **SP-03 dataSlugs** — `findAllSlugs` (:731-750) gate `worldAdminBypass || membership.role >= PomocnyPJ`; jinak 403. Controller `getDataSlugs` předává usera. ✅ (N-37 drží).
- **SP-04 favorite** — přesunuto do users modulu (`favoritePageSlugs`, users.service.ts:936-970). `setFavoritePages` ověří jen existenci světa (FIX-66), **ne membership** — ale je to personal soft-link na vlastním User dokumentu (žádný obsah cílového světa se nevrací), render favoritu jde stejně přes `findBySlug`/`assertAccess`. N-36 leak už neexistuje (jiný model). ✅ by-design; membership-check absence = neškodné (zapíše se mrtvý slug max).
- **SP-05 passesAccess 4 typy** — `passesAccess` (:1048-1075) pokrývá UserId / AKJ (akj≥lvl) / Role (role≥lvl) / AKJType (akj≥group.level), OR logika. ✅
- **SP-06 page-level bypass** — `assertAccess` :1116 `membership.role >= WorldRole.PomocnyPJ(4)` return; admin bypass jen při elevaci (:1107-1111 `worldAdminBypass`). Práh PomocnyPJ(4), ne PJ(5). ✅
- **SP-07 403 vs 404** — `assertAccess` hodí 403 `PAGE_ACCESS_DENIED` (:1127); plán chce 404. Registr už klasifikoval jako doc-fix (member zná existenci stránky) — NEhlásím jako nové.
- **SP-08 FE nerekomputuje AKJ** — `WithAkjTabs.tsx:28-83` renderuje jen BE-filtrované `page.akjTabs`; locked → `AkjLockedPanel` (bez obsahu), odemčené → `resolveAkjTabPage`. FE nerozhoduje AKJ. ✅ (BE autoritativní)
- **SP-09 filterAkjTabsForViewer PomocnyPJ bez tab-bypassu** — :1197-1200 `seesAll = worldAdminBypass || role>=PJ(5)`; PomocnyPJ jde per-tab přes `passesAccess`. Owner PC výjimka (:1220 `ownerUserId===userId && !ownerHidden`). ✅ (K-R2 drží)
- **SP-10 hide vs lock** — nedostupné taby: clearance-only (`isBroadcastableAkjTab`) → `lockedAkjTab` (jméno+AKJ/AKJType reqs, bez contentu, bez UserId/Role klíčů, :170-178); Role/private → skryté. ✅ (viz R-RUN-04B pro adresářovou UserId hranu)
- **SP-13 assertCanWrite** — :1236-1261 `worldAdminBypass || role>=PomocnyPJ(4)`; neexistující/soft-smazaný svět → 404 (:1245 anti-leak + RC-D2). ✅
- **SP-14 FE canEdit parita** — PageViewer.tsx:66 / PageHeader.tsx:40 `world.elevated || userRole>=PomocnyPJ`. Parita s BE assertCanWrite. ✅
- **SP-15 Korektor šablony vs PomocnyPJ stránky** — BE templates `assertCanManage` = `worldAdminBypass || role>=Korektor(3)` (world-page-templates.service.ts:155-177); FE `PageTemplatesTab` `minRole: WorldRole.Korektor` (WorldSettingsPage.tsx:129). Stránky BE+FE PomocnyPJ+. Dva prahy sedí, FE nerozhazuje. ✅
- **SP-16 editor gate** — route `nova-stranka`/`edit/:slug` = `memberOnly(Ctenar)` (router.tsx:310-311), ale `PageEditorPage.tsx:35-38` sám gatuje `!elevated && role<PomocnyPJ → Navigate` → Ctenar/Hrac/Korektor redirect PŘED editorem, ne až BE 403. ✅
- **R-09** (findByWorld page-level filtr) — **opraveno v kódu**: `findByWorld` :218-247 nyní `assertCanViewWorld` (R-09b world-level) + per-page `assertAccess` + `filterAkjTabsForViewer`. Rovněž `findRandom`/`findMeta`/`findBacklinks` mají world-view bránu (R-AUDIT). Konzistentní.
- Favorite hvězda — PageHeader.tsx:91-107 osobní favorit **všem členům** (5.2-followup nahradil R-16 kurátorský gate) → konzistentní s maticí E (Ctenar+ ✅).

## Pokrytí os plánu 04
`PC` (6 dveří: detail/list/directory/search/embedding/slugs/favorite) — hlavní osa; 2 nálezy (search index + directory UserId karta). `DD` (SP-08 BE autoritativní) ✅. `LK` (SP-07 doc-fix, R-RUN-04A/B leaky). `BY` (SP-06/09 PomocnyPJ page-ano/tab-ne) ✅. `PA`/`EN` (SP-13/14/15/16 prahy) ✅. Matice E/P1 sub-matice: konzistentní s kódem kromě UserId adresářové hrany.

## PROOF-REQUESTy (proof-vrstva, read-only nespuštěno)
- **M8 (04A):** e2e — 2 světy se stejným slugem `s1` (A přístupný requesterovi, B privátní cizí), zaindexovat, `GET /search?q=<term z B>&worldId=A` → dnes vrátí B-title, po fixu prázdno. Vysoká priorita (boční kanál, registr ho měl za čistý).
- **M7 gap-fill (04A):** jednotkový test meili `toDocument` obsahuje worldId + `search` posílá `filter: worldId`.
- **M7 (04B):** test `findDirectory` — stránka s jediným UserId reqem pro cizího usera → NEsmí být v response jako plná karta (buď skrytá, nebo locked stub).
- **M3:** spustit `pages.service.spec.ts` + `search.controller.spec.ts` — ověřit, že žádný existující test neasertuje globální (bez-worldId) search jako korektní.
