# 11 — Stránky, wiki & informace

Hloubková, kódem ověřená inventura wiki/stránkového subsystému světa. Pokrývá seznam stránek, viewer, editor, sjednocení Page+Character, AKJ chráněné záložky, šablony, administraci, Pravidla/Informace a oblíbené stránky.

**Zdroje (ověřeno v kódu):**
FE `src/features/world/pages/*` (PagesListPage, PageViewer, PageEditor, PagesAdminPage, RulesPage), router `src/app/router.tsx`, nav `src/features/world/lib/worldNavConfig.ts`.
BE `backend/src/modules/pages`, `modules/character-subdocs`, `modules/world-page-templates`.

---

## Datový model stránky (Page)

### Co to je
Jednotná entita `Page` je páteř celého obsahu světa. Spec 9.1 sjednotil Page a Character — **Page je primární**, Character drží jen 5 subdokumentů (deník/kalendář/finance/výbava/poznámky).

### Typy stránek
Definováno v `PAGE_TYPES` (`backend/src/modules/pages/interfaces/page.interface.ts:1`):
- `Lokace` — má `characterRef` → Character `kind:'location'` (jen kalendář subdoc).
- `Noviny` — `customData` (metadata novin).
- `Seznam` — `menu[]` (rozcestník odkazů). Pro matrix systém speciálně slug `pravidla`/`magicka-pravidla` → `RulebookHub` layout.
- `Galerie` — `galleryImages[]`.
- `Zoom` — `ZoomLayout` (velký zoomovatelný hlavní obrázek; dříve se typ jmenoval „Rodokmen", přejmenováno v 7.x). Legacy dokumenty `type='Rodokmen'` **bez** `familyTree` normalizuje `normalizePageType()` na Zoom při čtení.
- `Rodokmen` — 17.7 vizuální **strom rodiny** (`familyTree: {people[], unions[]}`, `FamilyTreeLayout`). Osoby = volná data (jméno/foto/datum) + volitelný odkaz na stránku (`pageSlug`, klik→navigace); svazky = partneři A(+B)+děti. Editor v `PageEditor` (drag + „Srovnat" auto-layout). Vzhled dědí z motivu světa (`--theme-*`). Sdílí jméno s legacy typem — odlišen přítomností `familyTree` (`normalizePageType(type, hasFamilyTree)`).
- `Obrazovka` — `videos[]` (YouTube).
- `Ostatní` — default/fallback layout.
- `Postava hráče` — má `ownerUserId` + `characterRef` → Character `kind:'persona'` (5 subdoců).
- `NPC` — `characterRef`, bez ownera.

### Klíčová pole (`Page` interface, řádek 130-169)
`slug`, `worldId`, `type`, `title`, `content` (HTML), `quickRef`, `imageUrl` + výřez (`imageFocalX/Y`, `imageZoom`, `imageFit`, parita s GameEvent), `bigImage`, `table` (atributová tabulka), `sections[]`, `galleryImages[]`, `videos[]`, `menu[]`, `plainText` (extrahovaný text pro search/read-time), `isWoodWide`, `accessRequirements[]` (page-level gate), `customData`, `order`, `ownerUserId`, `characterRef`, `akjTabs[]`.

### Stav
✅ Plně funkční, bohatý model.

---

## Seznam stránek (PagesListPage)

### Co to je
Member-facing index („Encyklopedie světa") s kartami stránek.

### Kde
- FE route `stranky` → `memberOnly(PagesListPage)` (`router.tsx:238`, minimální world role Čtenář).
- Komponenta `src/features/world/pages/PagesListPage/PagesListPage.tsx`.
- BE data: `GET /worlds/:worldId/pages/directory` → `pages.service.findDirectory` (`pages.service.ts:496`).

### Kdo
- FE: Čtenář+ (memberOnly). Tlačítko „Nová stránka" jen `userRole >= PomocnyPJ` (`PagesListPage.tsx:52`).
- BE: directory čte každý přihlášený (`pages.controller.ts:55`), gating přes `shieldedBy` enrich per entry.

### Co jde dělat (VŠE)
- Fulltextové hledání (název + slug, diakritika-insensitive `normalize`).
- Filtr dle typu (`PagesToolbar`).
- Řazení: `order` (default), abecedně, dle typu.
- Sekce „Oblíbené" nahoře — drag&drop reorder (dnd-kit, touch long-press 250ms), `useFavoritePages`.
- Karta → proklik na viewer; hvězda = toggle oblíbené.
- Empty state s CTA „Vytvořit první stránku" (jen pro tvůrce).

### Hranice — co neumí
- Adresář není stromový/složkový — je to **plochý seznam karet** filtrovaný chipy. Žádná hierarchie kategorií ani složky (přes prompt zmíněné „kategorie/složky" v UI **neexistují** — jen filtr podle `type`).
- Reorder oblíbených je v listu jen pro oblíbené; pořadí všech stránek (`order`) se zde needituje (to je v editoru / adminu).
- Directory NEvrací `accessRequirements` na FE (privacy) — jen agregát `shieldedBy`.

### Zvláštnosti
- `shieldedBy` per-entry: BE počítá nesplněné podmínky JEDNÍM lookupem membershipu (ne N+1), jen když je vůbec nějaká stránka chráněná (`pages.service.ts:501`). `UserId` requirementy se do `shieldedBy` nikdy nedávají (neprozradit, kdo má přístup).

### Stav
✅ Funkční.

### Kód
FE `PagesListPage/PagesListPage.tsx:43`; BE `pages.service.ts:496` (findDirectory), `pages.controller.ts:48`.

---

## Zobrazení wiki stránky (PageViewer)

### Co to je
Typ-agnostický presenter, který podle `page.type` zvolí layout a provede read-time výpočty.

### Kde
- FE route catch-all `:slug` (musí být poslední) → `memberOnly(PageViewerPage)` (`router.tsx:335`).
- Entry `PageViewer/PageViewerPage.tsx`, presenter `PageViewer/PageViewer.tsx`.
- BE `GET /worlds/:worldId/pages/:slug` → `pages.service.findBySlug` (`pages.service.ts:168`).

### Kdo
- FE: Čtenář+ (memberOnly).
- BE: `findBySlug` projde 3 branami: `assertCanViewWorld` (R-09b — privátní svět jen pro členy/Admin+), `assertAccess` (page-level), `filterAkjTabsForViewer` (per-záložka). 403/404 dle auth-leak-policy.

### Co jde dělat (VŠE)
- Render přes 9 layoutů (`LAYOUTS` mapa, `PageViewer.tsx:45`): Lokace, Noviny, Seznam, Galerie, Zoom, Rodokmen, Obrazovka, Ostatní, Postava/NPC.
- AKJ záložková lišta — flat typy přes `WithAkjTabs`, Lokace/Postava/NPC řeší vlastní lištu (`handlesOwnAkjTabs`, řádek 126).
- Read-time minuty (220 slov/min z `plainText`), kromě Galerie.
- Hash deeplink (`#anchor` → scroll), AutoTOC injekce `id` na h2/h3.
- Auto-link zmínek entit (`useAutoLink`), broken-link detekce červeně (`useBrokenLinks`).
- Inline image lightbox, citační popup pro výběr textu (`QuoteSelectionPopup`).
- Klávesové zkratky: `Ctrl+K` paleta, `f` toggle oblíbené, `e` editor (jen canEdit), `Shift+?` nápověda, `g s` zpět na seznam.
- Panel „Odkazuje sem" (backlinks) — JEN PomocnyPJ+ (`canEdit`, řádek 149).
- **Tisk / PDF** (14.7a) — ikona 🖨 v hlavičce (`PageHeader.tsx`) → `window.print()` jen nad obsahem stránky (viz `## Tisk / PDF` níže).
- **Nahlásit** (20.1) — tlačítko „Nahlásit" v hlavičce stránky (`PageHeader.tsx:120`, `ReportButton targetType="page"`, `worldId`) → platformová moderační fronta „Zpracovat" (kap. 08); nahlašování protiprávního obsahu je platformní věc, ne PJ governance (R-20).

### Hranice — co neumí
- **Tabulky v `content` se renderují i ve vieweru** (15.5-followup, D-NEW-INV-WIKI). `RichTextEditor` zapíná Table extension i v `readOnly` (`enableTable || readOnly`, `RichTextEditor.tsx`) + read CSS `.content .rte-table`. Jeden zásah pokryl všech 8 read layoutů; tabulka napsaná v editoru je teď ve čtení vidět. (Atributová `table` mimo `content` se renderuje samostatně přes `PageSidebar`.)
- Backlinks panel je PJ-only — hráč nevidí, kdo na stránku odkazuje.

### Zvláštnosti
- Matrix rulebook hub: `world.system === 'matrix'` + `Seznam` + slug `pravidla`/`magicka-pravidla` → speciální `RulebookHub` layout místo generického.
- Error fallback: 403 → `AccessDenied`, 404 → `PageNotFound`, jiná chyba → též `PageNotFound`.

### Stav
✅ Funkční (vč. tabulek v obsahu — 15.5-followup).

### Kód
FE `PageViewer/PageViewer.tsx:58`, `layouts/OstatniLayout.tsx:67`; BE `pages.service.ts:168`.

---

## Tisk / PDF (pilíř A — 14.7)

### Co to je
Tisk entity v **samostatném tiskovém okně** (`window.open` → prohlížeč nabídne „Tisk" i „Uložit jako PDF") — pilíř A spec-14.7, bez serverového PDF. „Co vidíš, to vytiskneš" (data z viditelných GETů → filtrace zdarma).

### Kde
- Framework FE `features/world/export/print/`: `printMode.ts` (jotai `printModeAtom` + `usePrint().triggerPrint(target)`), `PrintButton.tsx`, **`printDoc.css`** (čisté tiskové CSS, single source — viz mechanismus).
- Spouště: ikona 🖨 v hlavičce stránky (`PageHeader.tsx`), tlačítko „Tisk / PDF" v záložce Deník (`DiaryTab.tsx` view) + „Tisk všech záložek" u postavy (`PostavaLayout.tsx`) — kap. 12.

### Kdo
- Kdokoli, kdo entitu vidí. Tisk NEbere širší data než zobrazení (žádný export-only endpoint) — filtraci řeší stávající brány (`assertAccess`/`filterAkjTabsForViewer`).

### Co jde dělat (body 2–14)
- Wiki stránka (11) — obsah + sekce + odemčené AKJ záložky.
- **Lokace / Ostatní** (`OstatniLayout`) — v tisku pořadí **obrázek → datová tabulka (boxík) → text** (na obrazovce je obrázek/tabulka v bočním sidebaru).
- Deník PC/NPC (2, 5) a **záložky postavy/NPC** (3, 6) — print rozbalí všechny subdoc taby + odemčené AKJ lineárně, **každá záložka na vlastní stránce**; kalendář **opt-in**. Viz kap. 12.
- **13 systémových diary sheetů** (matrix/coc/dnd5e/drd2/drd16/drdh/drdplus/fae/fate/gurps/jad/pi/shadowrun) má **tiskový render** — hodnoty z `<input>` jako text, pips/tracky jako `●●●○○`, NE prázdná políčka.
- **Kalendář** s rozsahem (1–12 měsíců) — v tisku vynucen detail mód (názvy akcí) + mřížka (`print-cal-grid`); respektuje filtr entit (4, kap. 15).
- **Bestiář** + **obchod** (ceník) — tiskne zobrazené (scope/složka/search; 7, 8, 14; kap. 12).
- **Mapy atlas** (9, kap. 14), **Storyboard** vybraný scénář (13), **Pavučina** snapshot 2D grafu (12), **Hvězdná mapa** seznam těles (10).

### Jak funguje (mechanismus — přepsán 2026-06-20)
- Tlačítko najde nejbližší `[data-print-scope]` (`closest`) → `triggerPrint` zapne `printModeAtom`; po 2× `requestAnimationFrame` (re-render rozbaleného stavu) **naklonuje scope do nového okna** (`window.open`).
- **Klíčové:** klon se vkládá do čistého dokumentu JEN s `printDoc.css` — CSS appky se **ZÁMĚRNĚ nepřebírá**. (Dřív se klonovalo na téže stránce + kopírovaly styly appky → SPA layout dělal prázdné listy a hrubé resety rozbíjely obrázky. Série selhání, viz [chybový deník/tisk](../chybovy-denik/tisk.md).)
- `printMode` rozbalí collapsed obsah (`PageSections`, `InventoryTab` — collapsed obsah jinak NENÍ v DOM) a AKJ záložky lineárně; zamčené se NEtisknou. Diary sheety v `printMode` vrací statický tiskový view.
- Klon: odebere `.print-hide`, lazy obrázky → načtou se v okně, `<canvas>` → `<img>` snapshot (`toDataURL`). **Čeká na `load` všech obrázků**, teprve pak `win.print()`.
- **`printDoc.css`** (single source přes `?raw` import; offline náhled `scripts/print-preview` čte týž soubor → náhled = produkce): čistý dokument na element-level + stabilní tiskové třídy `print-cols`/`print-row`/`print-stat`/`print-cal-grid`/`print-event`/`print-hero`/`print-portrait`/`print-page`. **Princip:** layout držený jen CSS modulem (grid/flex) se v klonu ztrácí → stabilní třída ho v tisku obnoví.

### Hranice — co neumí
- **Hvězdná mapa**: WebGL graf nejde snapshotovat (prázdný buffer) → jen **seznam těles**, ne obrázek.
- **Cross-origin obrázky** (Cloudinary bez CORS) v canvasu → snapshot může selhat („tainted canvas") → ten graf se nevytiskne.
- **Storyboard** tiskne jen **vybraný scénář**, ne celý strom.
- **Mapy/bestiář** „určité" = přes filtr/složku/search, ne multi-select.
- Tisk je **černobílý** (úspora toneru, theme-neutrální) — barevné prvky nesou info velikostí/tučností/`●○`, ne barvou. Výjimka: barevný proužek u kalendářní akce (`--chip-color`).
- **Emoji se v tisku netiskne** (prázdný obdélník) → nahrazeno textem (`(magická)`).

### Stav
✅ funguje — **pilíř A tisk přepsán a reálně ověřen** (2026-06-20: postava/stránka/lokace/bestiář/kalendář/Matrix deník). Ostatních 11 diary sheetů + obchod/pavučina/hvězdná jedou ověřeným vzorem + build/133 testů, čekají reálný test. Pilíř B (ZIP) → kap. 10.

### Kód
FE `features/world/export/print/{printMode.ts,PrintButton.tsx,printDoc.css,print.css}`; integrace `PageHeader.tsx`, `PageSections.tsx`, `WithAkjTabs.tsx`, `layouts/{PostavaLayout,OstatniLayout}.tsx`, `CharacterDetailPage/components/{DiaryTab,InventoryTab}.tsx`, `diary-systems/sheets/*/{*Sheet}.tsx` + `_shared/FateLikeSheet.tsx` (tiskové views), `bestiar/components/BestieCard.tsx`, `tactical-map/components/schema-form/EntityStatbar.tsx`, `shop/components/ShopView.tsx`, `maps/WorldMapsPage.tsx`, `campaign/components/{PavucinaGraph,ScenarioEditor}.tsx`, `universe/UniverseMapView.tsx`, `pages/CalendarPage.tsx` + `CalendarPage/components/CalendarCell.tsx`. Offline náhled `scripts/print-preview/`.

---

## Editor stránky (PageEditor)

### Co to je
Plnohodnotný editor pro tvorbu i úpravu stránek, panelová struktura.

### Kde
- FE routes `nova-stranka` + `edit/:slug` → `memberOnly(PageEditorPage)` (`router.tsx:239-240`).
- Entry `PageEditor/PageEditorPage.tsx`, presenter `PageEditor/PageEditor.tsx`.
- BE `POST /worlds/:worldId/pages` (create), `PATCH /worlds/:worldId/pages/:id` (update).

### Kdo
- FE: dvojitý guard — route `memberOnly(Čtenář)` + interní `if (userRole < PomocnyPJ) Navigate` (`PageEditorPage.tsx:27`).
- BE: `assertCanWrite` = platform Admin+ NEBO world role >= PomocnyPJ (`pages.service.ts:924`). Vlastník světa NENÍ automaticky autorizován — rozhoduje membership.

### Co jde dělat (VŠE)
Panely (`PageEditor.tsx:397`):
- **IdentityPanel** — název, typ (switch s warning modalem na ztrátu dat), hero obrázek + výřez (focal/zoom/fit), bigImage, isWoodWide, order.
- **DataTemplatePanel** — stripe karet datových šablon (per-svět `WorldPageTemplate`); „Volný text" + per-svět šablony aplikují headers + defaultTitle; šablona s osnovou (15.5) navíc vloží `contentOutline` do prázdného `content`.
- **TablePanel** — atributová tabulka (headers/values, rich-text buňky s inline odkazy).
- **GalleryPanel** (typ Galerie), **VideosPanel** (Obrazovka), **MenuPanel** (Seznam), **CustomDataPanel** (Noviny), **PostavaPanel** (PC/NPC — výběr ownera).
- **ContentPanel** — TipTap rich-text: B/I/U/S/sup/sub, nadpisy H2/H3, seznamy, citace, **tabulky** (`enableTable`), barvy, bloky. Wikilink `[[` dropdown (`useWikilinkExtension`), broken-link dekorace, image upload (Cloudinary), `StyleRail` (permanentní toolbar) + bubble menu, `LinkPickerPopover` pro vkládání odkazů (`linkDirectory` + `linkMakeSlug`).
- **SectionsPanel** — strukturované sekce (collapsible, items).
- **AkjTabsPanel** — chráněné záložky (viz níže).
- Live preview pane (`LivePreviewPane`), draft auto-save do localStorage (verzovaný klíč `page-draft:v2`), restore modal.

Save flow:
- `Ctrl/Cmd+S` uloží, optimistic concurrency (`expectedUpdatedAt` → 409 `PAGE_CONFLICT` → ConflictModal: Refresh / Overwrite).
- Slug-kolize v new módu → „Uložit do <stránka>" (přepis existující po potvrzení).
- Delete přes `DeletePageModal`.

### Co jde vkládat za odkazy
- Wikilink `[[` → dropdown stránek světa.
- `LinkPickerPopover` (sdílená komponenta `src/shared/ui/LinkPicker`) — generický LinkSuggestion + makeSlug.

### Hranice — co neumí
- Editor needituje subdokumenty postavy (deník/finance/…) — ty mají vlastní rozhraní (CharacterDetailPage). PageEditor pro PC/NPC řeší jen `ownerUserId` a AKJ záložky.
- Šablony (`WorldPageTemplate`) plní `table.headers`/`defaultTitle` + volitelně osnovu do prázdného `content` (15.5) — neplní `values` ani sekce; není to šablona celé stránky.
- Type switch může ztratit data (warning modal `TypeSwitchWarningModal` to hlásí, ale neuchovává).

### Zvláštnosti
- Nové PC dostanou předpřipravenou AKJ záložku „Soukromé" (vidí PJ + vlastník) (`PageEditor.tsx:96`).
- New mód čte query: `?type=`, `?owner=`, `?slug=` (předvyplní title z 404 „Vytvořit").
- BE sanitizuje veškerý HTML (`sanitizeRichText`) na content, sections, table, AKJ override.

### Stav
✅ Bohatě funkční.

### Kód
FE `PageEditor/PageEditor.tsx:70`, `panels/ContentPanel.tsx:30`; BE `pages.service.ts:187` (create), `:298` (update).

---

## Sjednocení Page + Character (spec 9.1 / 9.2)

### Co to je
Page je primární entita; pro typy `Postava hráče`, `NPC`, `Lokace` BE auto-vytvoří Character entity, která drží subdokumenty. Page → Character přes `characterRef.characterId`.

### Kde / Jak (BE)
- `pages.service.create` (`:217-237`): persona (PC/NPC) i Lokace → `charactersService.create` s `kind: 'location'|'persona'`. Klient může předat existující `characterRef` (migrace).
- `pages.service.update` (`:349-382`): transition wiki→persona/Lokace vytvoří Character pokud ještě není; změna typu Lokace ↔ PC/NPC volá `charactersService.syncKind` (jinak by taktická mapa odmítala token).
- Subdoc kaskáda v `character-subdocs.service.onCharacterCreated` (`character-subdocs.service.ts:123`):
  - Každá entita (persona i lokace): **calendar + finance + inventory**.
  - Jen persona (NE lokace): **diary + notes**.
- Finance/Výbava jsou ale **read-gated jen pro PC**: `getFinance`/`getInventory` vrací 404 `*_NOT_APPLICABLE` pro NPC i Lokaci (`character-subdocs.service.ts:407,486`).

### Hranice — co neumí
- Spec text říká „Character drží 5 subdokumentů", reálně Lokace má použitelné jen calendar (+ notes self-healing); finance/inventory se sice vytvoří, ale GET je pro NPC/Lokaci blokuje. Nekonzistence vytvoř-vs-čti (viz dluhy).
- Rollback při selhání: pokud page save selže po vytvoření Character, BE rolluje postavu zpět (DI-04, `:274`) — ale je to manuální kompenzace, ne transakce.

### Zvláštnosti
- Lazy-create + `rollbackIfParentGone` pro legacy postavy bez subdoců (self-healing prvním GET).

### Stav
✅ Funkční, ⚠️ asymetrie create vs. read u finance/inventory.

### Kód
BE `pages.service.ts:217`, `character-subdocs.service.ts:123`.

---

## AKJ chráněné záložky (per stránka)

### Co to je
Záložky vedle základního obsahu stránky, viditelné jen tomu, kdo splní `access[]` (OR logika). Nahradily dřívější `privateContent` i page-level AccessPanel.

### Kde
- BE typ `AkjTab` (`page.interface.ts:112`), filtrování `filterAkjTabsForViewer` (`pages.service.ts:875`).
- FE editor `AkjTabsPanel.tsx`, viewer `WithAkjTabs.tsx` + `AkjLockedPanel`.

### Kdo (BE-enforced gating)
- PJ + platform Admin+ vidí VŠE odemčené (`seesAll`, `:886`).
- **PomocnyPJ NEMÁ auto-bypass** na AKJ záložky (jen co mu PJ grantoval přes `tab.access`) — odlišnost od page-level `assertAccess`, kde PomocnyPJ+ bypass MÁ (`:813`).
- Vlastník postavy (`page.ownerUserId === userId`) vidí AKJ záložky své PC defaultně, dokud mu PJ nezvolí `ownerHidden` (`:908`).

### Chování zamčených záložek (spec-akj-locked-tabs-visible)
- „In-fiction" clearance záložka (má AKJ/AKJType req, žádný Role) → hráč bez přístupu vidí ZAMČENOU: 🔒 jméno + úroveň, BEZ obsahu a bez jmenovitých klíčů (`lockedAkjTab`, `:106`). Po získání přístupu → 🔓 + obsah.
- Role záložky („PJ informace") a prázdné/jen-jmenovité („Soukromé") zůstávají úplně SKRYTÉ.
- `locked` je read-time enrich — na write path se zahazuje (`sanitizeAkjTabs`, `:69`).

### Co jde editovat
- Název, pořadí (move up/down).
- „Kdo vidí": clearance (AKJ úroveň) + konkrétní hráči (UserId chips). Presety „PJ informace" (Role=PomocnyPJ, ownerHidden) a „Soukromé".
- Override obsahu (sparse): obrázek, text (TipTap), atributová tabulka — prázdné dědí ze základní stránky.
- Přepínač „Vlastník postavy vidí" (jen u PC, `ownerControlled`).

### Hranice — co neumí
- Editor (`AkjTabsPanel`) ručně exponuje jen **AKJ clearance + UserId**; `Role` a `AKJType` requirementy přidává jen preset „PJ informace" — UI nemá obecný picker rolí/AKJType pro AKJ záložky (page-level `accessRequirements` je řeší přes `AccessRequirementEditor`, ale to je jiný editor).
- Backend přijímá v `tab.access` i AKJType/Role (passesAccess je vyhodnotí), ale editor je běžně nenabízí.

### Stav
✅ Funkční, BE-enforced.

### Kód
BE `pages.service.ts:875` (filter), `:93` (isBroadcastable), `:106` (lockedAkjTab); FE `PageEditor/panels/AkjTabsPanel.tsx`, `PageViewer/components/WithAkjTabs.tsx:27`.

---

## Page-level přístupová pravidla (accessRequirements)

### Co to je
Gate na celou stránku (vedle AKJ záložek). OR logika 4 typů: `UserId`, `AKJ` (číselná úroveň), `Role` (world role práh), `AKJType` (pojmenovaná clearance z WorldSettings).

### Kdo / gating (BE)
- `assertAccess` (`pages.service.ts:798`): bez requirementů → projde. Platform Admin+ a world role >= PomocnyPJ → bypass. Jinak `passesAccess` (OR).
- Aplikuje se v `findBySlug`, `findByWorld` (listing filtr), `findVisibleSlugs` (search), `findBacklinks`.

### Hranice
- Page-level gate odfiltruje stránku z listingu silent (neukáže existenci). Search/backlinks respektují.

### Stav
✅ Funkční.

### Kód
BE `pages.service.ts:798` (assertAccess), `:769` (passesAccess).

---

## Šablony stránek (WorldPageTemplate)

### Co to je
Per-svět šablony **atributové tabulky** (NE celé stránky, NE deníkové schéma). PJ definuje např. „Postava", „Stát" → editor je nabízí jako stripe karet.

### Kde
- BE modul `modules/world-page-templates`. Controller `POST/PATCH/DELETE /worlds/:worldId/page-templates`.
- FE konzumace `DataTemplatePanel.tsx` (editor), správa v Nastavení světa (`#sablony`).

### Kdo (BE)
- GET: každý přihlášený (`world-page-templates.service.ts:34`).
- Create/Update/Delete: `assertCanManage` = platform Admin+ NEBO world role >= **Korektor** (`:130`). Pozn.: nižší práh než stránky (PomocnyPJ)! Komentář to zdůvodňuje konzistencí s tabem „Vzhled".

### Co obsahuje šablona
`key` (unique/svět), `label`, `headers[]` (hlavičky tabulky), `defaultTitle`, `contentOutline` (15.5 — obsahová osnova, sanitizovaný TipTap HTML), `icon` (whitelist 10 Lucide ikon), `order`. Matrix svět dostává 6 výchozích šablon v seedu (vč. osnov); ostatní startují prázdné.

### Co jde dělat
- Spravovat šablony (CRUD) v Nastavení světa → Šablony — modal `TemplateEditorModal` (label/key/defaultTitle/ikona/headers + **osnova přes `RichTextEditor` bez tabulek**).
- V editoru stránky vybrat šablonu na stripe karet (`DataTemplatePanel`) → aplikuje `headers` + `defaultTitle` do tabulky; karta s osnovou nese popisek „· osnova".
- **15.5 — vložení osnovy do textu:** výběr šablony s `contentOutline` vloží osnovu do `page.content`, **ale jen když je content prázdný** (`isContentEmpty` — pokrývá `<p></p>`); rozepsaný text se nikdy nepřepíše.

### Hranice — co neumí
- Šablona aplikuje `headers` + `defaultTitle` + prázdné `values` + (volitelně) osnovu do prázdného contentu — **neplní hodnoty tabulky ani sekce**.
- Osnovu **nelze** vložit do už rozepsané stránky (žádné „přepsat textem osnovy") — kdo chce osnovu do napsaného textu, musí ho nejdřív smazat.
- Osnova je per-šablona, **nevázaná na typ stránky** (PAGE_TYPES) — varianta A (osnova podle typu) zamítnuta; žádné substituce/AI generování.
- Seed je idempotentní → na **už naseedovaném** Matrixu se osnovy ke stávajícím šablonám nedoplní samy (PJ ručně, nebo migrace mimo scope).
- **POZOR na názvosloví:** prompt zmiňuje „Šablona deníku" v Nastavení světa — to je JINÁ věc (diary schema, `diary-schema-versions` / `personalDiarySchema`), ne tento `WorldPageTemplate`. Tento modul je „datová šablona stránky / atributová tabulka".

### Zvláštnosti
- Osnova se **sanitizuje při uložení šablony** (`sanitizeRichText` v service, create i update; prázdný string = mazání osnovy) — žádné uložené XSS čekající na vložení do contentu.
- Editor osnovy běží **bez** `enableTable` → TipTap tabulku nedovolí vložit (jinak by ji `page.content` viewer tiše zahodil, `project_page_content_no_tables`).

### Stav
✅ Funkční (osnova obsahu = krok 15.5).

### Kód
BE `world-page-templates.service.ts:40` (create+sanitize), interface `:8`, schema `contentOutline`, seed `world-page-templates.matrix-seed.ts`; FE editor `WorldSettingsPage/components/TemplateEditorModal.tsx`, vložení `PageEditor/panels/DataTemplatePanel.tsx:94`.

---

## Administrace stránek (PagesAdminPage)

### Co to je
Tabulkový přehled všech stránek světa pro hromadnou správu.

### Kde
- FE route `admin/stranky` → `WorldMembershipGuard(minWorldRole=PomocnyPJ, fallback Admin+)` (`router.tsx:293`).
- Komponenta `PagesAdminPage/PagesAdminPage.tsx`.

### Kdo
- FE i BE: PomocnyPJ+ (N-07 parita s BE `assertCanWrite`; PJ-only by lhalo). Sa/Admin bypass.

### Co jde dělat
- Tabulka (název/typ/updatedAt/order) s řazením (klik na sloupec, asc/desc toggle).
- Hledání (název+slug) + filtr typu (chipy).
- Smazání jednotlivé (ConfirmDialog) i hromadné (multi-select checkboxy, `Promise.allSettled` — částečná selhání hlásí počet).
- Proklik do editoru, „Nová stránka".

### Hranice — co neumí
- Žádná hromadná editace (jen mazání). Nelze hromadně měnit typ/přístup/order.
- Mazání nemá undo (BE hard delete + `page.deleted` event pro úklid blobů/oblíbených, `pages.service.ts:479`).

### Stav
✅ Funkční.

### Kód
FE `PagesAdminPage/PagesAdminPage.tsx:30`; BE delete `pages.service.ts:460`.

---

## Pravidla & Informace (referenční stránky)

### Co to je
Speciální stránky seedované při tvorbě světa + dedikovaná „Pravidla" route.

### RulesPage (route `pravidla`)
- FE route `pravidla` → `memberOnly(RulesPage)` (`router.tsx:277`).
- Pravidla = wiki stránka s rezervovaným slugem `pravidla` (`RulesPage.tsx:14`). Existuje → render přes `PageViewer`; neexistuje → PomocnyPJ+ vidí CTA „Vytvořit pravidla" (založí prázdnou typ Ostatní), ostatní empty state.

### Seedování (BE `pages-world-seed.listener.ts`)
Při `world.created` se založí (pokud neexistují):
- `pravidla` (Ostatní, order 0) — obsah dle `world.system` (`SYSTEM_RULES_TEMPLATES`).
- `magicky-system` (Ostatní, order 1) — univerzální škála MÚ + zvolené `magicTraditions`.
- `technologie` (Ostatní, order 2) — škála TÚ + rozsah `techLevelMin/Max`.
- `faq` (Ostatní, order 3), `videa` (Obrazovka, order 4).
- Matrix svět: `pravidla`/`magicky-system`/`technologie` nahrazuje Pravidlová kniha (`seedRulebook` — hub + kapitoly 1-9).

### Menu „Informace" (FE `worldNavConfig.ts`)
Skupina „Informace" (`buildWorldNav`) obsahuje: Skupiny (rozbalovací), Pravidla, Magický systém (`id`, skrývatelné), Technologie (`id`, skrývatelné). „Stránky" je v skupině „Svět". **15.5-followup (D-NEW-INV-WIKI):** odkazy Magický systém/Technologie se skryjí, když odpovídající stránka neexistuje — `buildWorldNav` bere `existingPageSlugs` (z `usePagesDirectory` ve `WorldLayout`); `pravidla` má vlastní route (RulesPage) → nefiltruje se.

### Hranice — co neumí / nesrovnalost
- **Dvě vrstvy:** seed zakládá OBSAH stránek (create-only), menu „Informace" je definované v `buildWorldNav`. Odkazy magicky-system/technologie se teď podmiňují existencí stránky (mrtvý odkaz vyřešen), ale **přidání nové referenční stránky** do menu je pořád ruční zásah do `buildWorldNav` (memory `project_world_informace_reference_pages`). Magický systém/Technologie jdou skrýt i ručně přes `hiddenNavItems` (`id`); Pravidla a Stránky jsou esenciály.
- Seedované referenční stránky jsou typ `Ostatní` (mimo matrix); tabulky v jejich obsahu se ve vieweru **renderují** (15.5-followup).

### Stav
✅ Funkční.

### Kód
FE `RulesPage.tsx:21`, `worldNavConfig.ts:168`; BE `pages-world-seed.listener.ts:71`.

---

## Oblíbené stránky (favoritePageSlugs)

### Co to je
Osobní oblíbené stránky per svět (5.2-followup).

### Kde / Jak
- BE: uloženo na User `favoritePageSlugs: Record<worldId, slug[]>` (pořadí významné) (`users/interfaces/user.interface.ts:125`).
- Endpoint `PUT /users/me/favorite-pages/:worldId` (`users.controller.ts:174`).
- FE hook `useFavoritePages`.

### Co jde dělat
- Toggle oblíbené (hvězda na kartě/vieweru, klávesa `f`).
- Reorder (drag&drop v sekci Oblíbené na PagesListPage i na dashboardu).
- Zobrazení na úvodní straně světa (3sloupcový dashboard — sloupec oblíbených).

### Hranice
- Per-uživatel + per-svět; nelze sdílet ani „světové" oblíbené.
- Úklid: `page.deleted` event maže slug z oblíbených (CD-08).

### Stav
✅ Funkční.

### Kód
BE `users/interfaces/user.interface.ts:125`, `users.controller.ts:174`; FE `pages/api/useFavoritePages.ts`.

---

## Další API endpointy stránek

| Endpoint | Účel | Gating |
|---|---|---|
| `GET /pages` | listing s access filtrem | Čtenář (member), per-page filtr |
| `GET /pages/directory` | adresář (shieldedBy enrich) | přihlášený |
| `GET /pages/dataSlugs` | všechny slugy (editor pomůcka) | **PomocnyPJ+** (N-37, jinak leak existence AKJ stránek) |
| `GET /pages/data?number=N` | náhodné stránky (max 50) | přihlášený |
| `GET /pages/meta/:slug` | metadata + shieldedBy | přihlášený |
| `GET /pages/:slug` | plný obsah | 3-branový gating |
| `GET /pages/:slug/backlinks` | „Odkazuje sem" (7.1l) | access na cíl, filtr přístupných |
| `POST/PATCH/DELETE` | CRUD | PomocnyPJ+ |

Kód: `pages.controller.ts:36-176`.

---

## ⚠️ Nesrovnalosti & dluhy (k ověření)

1. **Asymetrie subdoc create vs. read (Lokace/NPC).** `onCharacterCreated` vytvoří finance+inventory i pro lokaci/NPC, ale `getFinance`/`getInventory` je pro ně blokuje (404 `*_NOT_APPLICABLE`). Vznikají subdokumenty, které nikdy nejdou přečíst → mírný dluh/leak dat v DB. Spec „Character drží 5 subdoců" tak pro Lokaci/NPC neplatí v praxi.

2. **Práh „šablon stránky" = Korektor, ale stránky samotné = PomocnyPJ.** `WorldPageTemplate` CRUD povolen Korektor+ (`world-page-templates.service.ts:146`), zatímco vytvoření/úprava stránky vyžaduje PomocnyPJ+. Korektor tedy může vytvořit šablonu tabulky, ale ne stránku, kde by ji použil. Záměr (komentář odkazuje na tab „Vzhled"), ale stojí za revizi konzistence.

3. **Názvoslovný střet „Šablona".** „Datová šablona stránky" (`WorldPageTemplate`, atributová tabulka) vs. „Šablona deníku" (diary schema) v Nastavení světa jsou dvě různé věci se zaměnitelným názvem — riziko záměny v dokumentaci i UX.

5. **Seed obsahu vs. nav menu jsou 2 nepropojené vrstvy.** Referenční stránky (`pravidla`/`magicky-system`/`technologie`) seeduje BE create-only, ale jejich přítomnost v menu „Informace" je hardcoded ve FE `buildWorldNav`. Pokud PJ stránku smaže, odkaz v menu vede na 404; pokud se seed nepovede, menu stále odkazuje. Skrytí jde jen u Magického systému/Technologie (mají `id`).

6. **PomocnyPJ rozdílné chování page-level vs. AKJ záložky.** Na page-level `accessRequirements` má PomocnyPJ+ bypass (vidí vše), ale na AKJ záložkách NEMÁ auto-bypass (jen explicitní grant). Záměr (spec-akj-protected-tabs), ale matoucí pro uživatele — PomocnyPJ může otevřít chráněnou stránku, ale ne nutně její AKJ záložky.

7. **Backlinks („Odkazuje sem") je PomocnyPJ+ only ve vieweru** (`PageViewer.tsx:149`), zatímco BE endpoint by ho dal i hráči s přístupem. FE záměrně skrývá (meta-vazby), ale je to FE-only restrikce, BE backlinks endpoint je dostupný každému členovi s přístupem na cíl.
