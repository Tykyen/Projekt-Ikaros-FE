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
- `Frakce` / `Organizace` / `Stát` (11.5) — wiki-like typy pro kampaňové subjekty Pavučiny. Chovají se **jako `Ostatní`**: čistá `Page`, **generický layout** (`OstatniLayout`), **BEZ** auto-`Character` subdocu (nejsou v auto-Character whitelistu → žádný deník/finance/výbava/kalendář). Existují, aby šly Frakce/Org/Stát z Pavučiny „materializovat" a „vyvolat" (viz kap. 15). Ikony `Flag`/`Building2`/`Landmark`.
- `Postava hráče` — má `ownerUserId` + `characterRef` → Character `kind:'persona'` (5 subdoců).
- `NPC` — `characterRef`, bez ownera.

### Klíčová pole (`Page` interface, `page.interface.ts:216`)
`slug`, `worldId`, `type`, `title`, `content` (HTML), `quickRef`, `imageUrl` + výřez (`imageFocalX/Y`, `imageZoom`, `imageFit`, parita s GameEvent), `bigImage`, `table` (atributová tabulka), `sections[]`, `galleryImages[]`, `videos[]`, `menu[]`, `plainText` (extrahovaný text pro search/read-time), `isWoodWide`, `accessRequirements[]` (page-level gate), `customData`, `order`, `ownerUserId`, `characterRef`, `akjTabs[]`.

### Stav
✅ Plně funkční, bohatý model.

---

## Seznam stránek (PagesListPage)

### Co to je
Member-facing index („Encyklopedie světa") s kartami stránek.

### Kde
- FE route `stranky` → **`showcaseOrMember(PagesListPage)`** (`router.tsx:409`) — od 22.4 vitrínová sekce: člen Čtenář+, jinak anonym/nečlen read-only, když má svět zapnuté `publicShowcase`.
- Komponenta `src/features/world/pages/PagesListPage/PagesListPage.tsx`.
- BE data: `GET /worlds/:worldId/pages/directory` → `pages.service.findDirectory` (`pages.service.ts:807`).

### Kdo
- FE: Čtenář+ (member) nebo vitrína (22.4). Tlačítko „Nová stránka" jen `world.elevated === true || userRole >= PomocnyPJ` (`PagesListPage.tsx:59`).
- BE: directory má od 2026-07-13 `OptionalJwtAuthGuard` (`pages.controller.ts:58-63`, D-DATA-SYNC-ZBYTKY a — parita s legacy characters directory): **anonym smí adresář VEŘEJNÉHO světa**, privátní jen členové (brána `assertCanViewWorld` ve `findDirectory`; přihlášený nečlen privátního světa také neprojde, R-AUDIT). Gating obsahu přes `shieldedBy` enrich per entry. ⚠️ CH-120: Optional guard platí jen pro `directory` a `GET :slug` (`:149`) — ostatní sourozenci v controlleru zůstávají na `JwtAuthGuard`. Entry nově nese i `characterId` + `ownerUserId` (adapter `useCharacterDirectory`, kap. 12).

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
- `shieldedBy` per-entry: BE počítá nesplněné podmínky JEDNÍM lookupem membershipu (ne N+1), jen když je vůbec nějaká stránka chráněná (`pages.service.ts:835`). `UserId` requirementy se do `shieldedBy` nikdy nedávají (neprozradit, kdo má přístup).
- `findDirectory` NEvolá `assertAccess` → má **vlastní** filtr pending návrhů (15.11, `pages.service.ts:835`) — druhá read cesta vedle `assertAccess`.

### Stav
✅ Funkční.

### Kód
FE `PagesListPage/PagesListPage.tsx:44`; BE `pages.service.ts:807` (findDirectory), `pages.controller.ts:40`.

---

## Zobrazení wiki stránky (PageViewer)

### Co to je
Typ-agnostický presenter, který podle `page.type` zvolí layout a provede read-time výpočty.

### Kde
- FE route catch-all `:slug` (musí být poslední) → **`showcaseOrMember(PageViewerPage)`** (`router.tsx:510`, 22.4 vitrína).
- Entry `PageViewer/PageViewerPage.tsx`, presenter `PageViewer/PageViewer.tsx`.
- BE `GET /worlds/:worldId/pages/:slug` → `pages.service.findBySlug` (`pages.service.ts:318`).

### Kdo
- FE: Čtenář+ (member) nebo vitrína (22.4).
- BE: `findBySlug` projde 3 branami: `assertCanViewWorld` (R-09b — privátní svět jen pro členy/Admin+), `assertAccess` (`:344`, page-level), `filterAkjTabsForViewer` (`:352`, per-záložka). 403/404 dle auth-leak-policy. Nad tím vším **moderační skrytí** (`isModerationHiddenFor`) — 404 i pro PJ, zásah vidí jen platform reviewer (kap. 08).

### Co jde dělat (VŠE)
- Render přes 9 layoutů (`LAYOUTS` mapa, `PageViewer.tsx:47-63`; 13 klíčů → 9 komponent): Lokace, Noviny, Seznam, Galerie, Zoom, Rodokmen (`FamilyTreeLayout`), Obrazovka, Ostatní, Postava/NPC (`PostavaLayout`). Frakce/Organizace/Stát (11.5) mapují na generický `OstatniLayout`.
- AKJ záložková lišta — flat typy přes `WithAkjTabs`, Lokace/Postava/NPC řeší vlastní lištu (`handlesOwnAkjTabs`, `:135`).
- Read-time minuty (220 slov/min z `plainText`), kromě Galerie.
- Hash deeplink (`#anchor` → scroll), AutoTOC injekce `id` na h2/h3.
- Auto-link zmínek entit (`useAutoLink`), broken-link detekce červeně (`useBrokenLinks`).
- Inline image lightbox, citační popup pro výběr textu (`QuoteSelectionPopup`).
- Klávesové zkratky: `Ctrl+K` paleta, `f` toggle oblíbené, `e` editor (jen canEdit), `Shift+?` nápověda, `g s` zpět na seznam.
- Panel „Odkazuje sem" (backlinks) — JEN PomocnyPJ+ (`canEdit`, `PageViewer.tsx:71` def., `:174` render).
- **Tisk / PDF** (14.7a) — ikona 🖨 v hlavičce (`PageHeader.tsx:45-50`, `usePrint().triggerPrint`) → tisk v samostatném okně jen nad obsahem stránky (viz `## Tisk / PDF` níže).
- **Nahlásit** (20.1) — tlačítko „Nahlásit" v hlavičce stránky (`PageHeader.tsx:128`, `ReportButton targetType="page"`, `worldId`) → platformová moderační fronta „Zpracovat" (kap. 08); nahlašování protiprávního obsahu je platformní věc, ne PJ governance (R-20).

### Hranice — co neumí
- **Tabulky v `content` se renderují i ve vieweru** (15.5-followup, D-NEW-INV-WIKI). `RichTextEditor` zapíná Table extension i v `readOnly` (`enableTable || readOnly`, `RichTextEditor.tsx`) + read CSS `.content .rte-table`. Jeden zásah pokryl všech 8 read layoutů; tabulka napsaná v editoru je teď ve čtení vidět. (Atributová `table` mimo `content` se renderuje samostatně přes `PageSidebar`.)
- Backlinks panel je PJ-only — hráč nevidí, kdo na stránku odkazuje.

### Zvláštnosti
- Matrix rulebook hub: `world.system === 'matrix'` + `Seznam` + slug `pravidla`/`magicka-pravidla` → speciální `RulebookHub` layout místo generického (`PageViewer.tsx:126-132`).
- Error fallback: 403 → `AccessDenied`, 404 → `PageNotFound`, jiná chyba → též `PageNotFound`.

### Stav
✅ Funkční (vč. tabulek v obsahu — 15.5-followup).

### Kód
FE `PageViewer/PageViewer.tsx:65`, `layouts/OstatniLayout.tsx`; BE `pages.service.ts:318`.

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
✅ funguje — **pilíř A tisk přepsán** (2026-06-20: postava/stránka/lokace/bestiář/kalendář/Matrix deník). Ostatních 12 diary sheetů + obchod/pavučina/hvězdná jedou týmž vzorem (sdílený `printDoc.css` + `printMode`). Pilíř B (ZIP) → kap. 10.

### Kód
FE `features/world/export/print/{printMode.ts,PrintButton.tsx,printDoc.css,print.css}`; integrace `PageHeader.tsx`, `PageSections.tsx`, `WithAkjTabs.tsx`, `layouts/{PostavaLayout,OstatniLayout}.tsx`, `CharacterDetailPage/components/{DiaryTab,InventoryTab}.tsx`, `diary-systems/sheets/*/{*Sheet}.tsx` + `_shared/FateLikeSheet.tsx` (tiskové views), `bestiar/components/BestieCard.tsx`, `tactical-map/components/schema-form/EntityStatbar.tsx`, `shop/components/ShopView.tsx`, `maps/WorldMapsPage.tsx`, `campaign/components/{PavucinaGraph,ScenarioEditor}.tsx`, `universe/UniverseMapView.tsx`, `pages/CalendarPage.tsx` + `CalendarPage/components/CalendarCell.tsx`. Offline náhled `scripts/print-preview/`.

---

## Editor stránky (PageEditor)

### Co to je
Plnohodnotný editor pro tvorbu i úpravu stránek, panelová struktura.

### Kde
- FE routes `nova-stranka` + `edit/:slug` → `memberOnly(PageEditorPage)` (`router.tsx:410-411`).
- Entry `PageEditor/PageEditorPage.tsx`, presenter `PageEditor/PageEditor.tsx`.
- BE `POST /worlds/:worldId/pages` (create, `pages.controller.ts:170`), `PATCH /worlds/:worldId/pages/:id` (update, `:184`).

### Kdo
- FE: dvojitý guard — route `memberOnly(Čtenář)` + interní guard v `PageEditorPage.tsx:40`. **15.11:** práh snížen na **Hráč+** (`!isElevatedHere && userRole < Hrac` → redirect); hráč smí navrhovat obsah (viz „Návrhy obsahu hráčů" níže). BE je autoritativní.
- BE: `assertCanWrite` (`pages.service.ts:1487`) = elevovaný platform Admin+ NEBO world role ≥ PomocnyPJ. **15.11 relaxace (`resolveCreateMode`, `:1521`):** hráč (role ≥ Hrac) navrhující **whitelist typ** (NPC/Lokace/Ostatní/Seznam/Galerie/Rodokmen + 11.5 Frakce/Organizace/Stát) → `create` s `pageStatus:'pending'`, `proposedBy=self` (jinak 403); moderátor (≥PomocnyPJ/elevovaný) tvoří rovnou `approved`. Vlastník světa NENÍ automaticky autorizován — rozhoduje membership.
- **Kvóta:** `create` navíc kontroluje kumulativní strop stránek per svět (`assertUnderCreationLimit`, `MAX_PAGES_PER_WORLD`, D-SEC-GAP-2026-07-11, `pages.service.ts:377`).
- **`assertCanEditPage`** (update, `:1555`) povolí tři skupiny a vrací `ownerScoped`: (a) **moderátor** (≥PomocnyPJ/admin, `ownerScoped:false`) — plný update; (b) **autor svého pending návrhu** (whitelist typ, role ≥ Hrac); (c) **vlastník své Postavy hráče** (`ownerUserId===requester.id`, role ≥ Hrac) — edituje Bio i approved postavy (FE mu ukazuje „Upravit Bio"). Skupiny (b)+(c) jsou `ownerScoped:true` → update jim **oseká citlivá pole** (`accessRequirements`, `ownerUserId`, `type`, `slug`) → mění jen obsah, nejde eskalovat přístup, předat vlastnictví ani obejít gating typem. **`akjTabs` se od 2026-07-19 NEosekávají paušálně** — řeší je selektivní merge `resolveAkjTabsPatch` (viz „AKJ chráněné záložky → Editace obsahu vlastníkem"): editor **bez `seesAll`** (vlastník-hráč i **PomocnyPJ**) nesmí full-replace, jen `contentOverride` záložek, které smí. Bez skupiny (c) hráč-vlastník dostával 403 „Uložení selhalo" (viz chybový deník be.md).

### Co jde dělat (VŠE)
Panely (`PageEditor.tsx:397`):
- **IdentityPanel** — název, typ (switch s warning modalem na ztrátu dat), hero obrázek + výřez (focal/zoom/fit), bigImage, isWoodWide, order.
- **DataTemplatePanel** — stripe karet datových šablon (per-svět `WorldPageTemplate`); „Volný text" + per-svět šablony aplikují headers + defaultTitle; šablona s osnovou (15.5) navíc vloží `contentOutline` do prázdného `content`.
- **TablePanel** — atributová tabulka (headers/values, rich-text buňky s inline odkazy).
- **GalleryPanel** (typ Galerie), **VideosPanel** (Obrazovka), **MenuPanel** (Seznam), **CustomDataPanel** (Noviny), **PostavaPanel** (PC/NPC — výběr ownera).
  - ✅ **VideosPanel — náhledy videí (CSP host mismatch, opraveno 24.2).** Panel bere thumbnail z `https://img.youtube.com/vi/{id}/mqdefault.jpg` (`VideosPanel.tsx:104`), ale CSP `img-src` whitelistovala **jiný** host (`i.ytimg.com`, který kód nikdy nevolal) — a enforce CSP běžel. Oba hosty servírují tytéž náhledy, jenže CSP porovnává hostname doslova. `img-src` teď obsahuje `https://img.youtube.com` (`default.conf.template:145`, poznámka `:102`). Poučení pro budoucí panely: **každá nová externí doména v `src/` musí přibýt i do CSP whitelistu**, jinak ji enforce tiše zablokuje.
- **ContentPanel** — TipTap rich-text: B/I/U/S/sup/sub, nadpisy H2/H3, seznamy, citace, **tabulky** (`enableTable`), barvy, bloky. Wikilink `[[` dropdown (`useWikilinkExtension`), broken-link dekorace, image upload (Cloudinary), `StyleRail` (permanentní toolbar) + bubble menu, `LinkPickerPopover` pro vkládání odkazů (`linkDirectory` + `linkMakeSlug`).
- **SectionsPanel** — strukturované sekce (collapsible, items).
- **AkjTabsPanel** — chráněné záložky (viz níže).
- Live preview pane (`LivePreviewPane`), draft auto-save do localStorage (verzovaný klíč `page-draft:v2`), restore modal.

Save flow:
- `Ctrl/Cmd+S` uloží, optimistic concurrency (`expectedUpdatedAt` → 409 `PAGE_CONFLICT` → ConflictModal: Refresh / Overwrite) — `PageEditor.tsx:221`, `:277`.
- Slug-kolize v new módu → FE nabídne „Uložit do &lt;stránka&gt;" (vědomý přepis existující, `PageEditor.tsx:148`, `:319`). BE na kolizi **nepadá** — `ensureAvailableSlug` auto-suffixuje (`mapa` → `mapa-2`, FIX-21, `pages.service.ts:385`); title zůstává, mění se jen skrytý slug. Řeší i rezervované world routy (`RESERVED_PAGE_SLUGS`).
- Delete přes `DeletePageModal`.

### Co jde vkládat za odkazy
- Wikilink `[[` → dropdown stránek světa.
- `LinkPickerPopover` (sdílená komponenta `src/shared/ui/LinkPicker`) — generický LinkSuggestion + makeSlug.

### Hranice — co neumí
- Editor needituje subdokumenty postavy (deník/finance/…) — ty mají vlastní rozhraní (CharacterDetailPage). PageEditor pro PC/NPC řeší jen `ownerUserId` a AKJ záložky.
- Šablony (`WorldPageTemplate`) plní `table.headers`/`defaultTitle` + volitelně osnovu do prázdného `content` (15.5) — neplní `values` ani sekce; není to šablona celé stránky.
- Type switch může ztratit data (warning modal `TypeSwitchWarningModal` to hlásí, ale neuchovává).

### Zvláštnosti
- Nové PC dostanou předpřipravenou AKJ záložku „Soukromé" (vidí PJ + vlastník) (`PageEditor.tsx:96-104`).
- New mód čte query: `?type=`, `?owner=`, `?slug=` (předvyplní title z 404 „Vytvořit").
- Draft klíč je verzovaný a per-uživatel: `page-draft:v2:{userId}:{worldId}:{pageId|new}` (`PageEditor.tsx:123`).
- BE sanitizuje veškerý HTML (`sanitizeRichText`) na content, sections, table, AKJ override (`pages.service.ts:391-397`).

### Stav
✅ Bohatě funkční.

### Kód
FE `PageEditor/PageEditor.tsx`, `panels/*` (12 panelů + `FamilyTreeEditor`); BE `pages.service.ts:361` (create), `:541` (update).

---

## Návrhy obsahu hráčů (15.11)

### Co to je
Hráč (role Hráč+) smí **navrhnout** vlastní obsah — NPC, Lokaci, wiki stránku, Galerii, Rodokmen, Frakci/Organizaci/Stát (11.5) — jako **pending** (vidí jen on + PJ). PJ ho pak schválí (→ živé), vrátí k přepracování, nebo zahodí. Řízená spoluúčast hráčů na světě.

### Kde
- Hráč: tlačítko **„+ Navrhnout"** v hlavičce světa (`WorldLayout`, jen `!isPJ && role≥Hrac`) → wizard v propose-variantě (whitelist typy) → editor → pending návrh.
- PJ: fronta **„ke zpracování"** (typ `page-review` v `getWorldPendingActions`) — na stránce Hráči / v draweru / zvonečku (15.10 multi-typ fronta). `PageReviewRow`: **Schválit** / **Vrátit** (rework) / **Zahodit** (discard, s potvrzením) + odkaz na náhled.

### Kdo
- Navrhovat: **role Hráč (2)+** + whitelist typ (`PLAYER_PROPOSABLE_PAGE_TYPES` = NPC, Lokace, Ostatní, Seznam, Galerie, Rodokmen + **11.5 Frakce, Organizace, Stát**). NE Postava hráče (řeší 15.10 „Chci hrát"), Noviny, Obrazovka, systémové.
- Schvalovat/upravovat: moderátor (≥ PomocnyPJ / owner / elevovaný admin) — `assertCanWrite`.

### Co jde dělat
- Hráč: vytvořit návrh (`create` → pending); editovat SVŮJ pending (`assertCanEditPage`); po schválení edituje naostro.
- PJ: `POST …/pages/:slug/approve` (→ approved + do search indexu) · `.../reject {mode: rework|discard}`.

### Hranice / co neumí
- Návrh úprav CIZÍ existující stránky NE (jen tvorba vlastních nových). Per-svět toggle „hráči smí navrhovat" NE (vždy zapnuto Hráč+). Verzování NE. Postava hráče NE (15.10). Globální „Zpracovat" tab pro page-review NE (jen world-scoped fronta).

### Zvláštnosti / bezpečnost
- **Viditelnost pending:** jen autor (`proposedBy`) + moderátor. Gate v `assertAccess` PŘED early-return na prázdné accessRequirements + vlastní filtr ve `findDirectory` (2 oddělené read cesty). Cizí → 404.
- **Search:** pending se NEindexuje (až approve) — jinak leak přes vyhledávání.
- **NPC spawn:** pending NPC vyloučen z `NpcCharacterPalette` (FE filtr dle directory `pageStatus`) — nejde spawnnout na taktickou mapu. Mention N/A (NPC nejsou `world_membership`).
- **`proposedBy` ≠ `ownerUserId`** (autor návrhu vs vlastník PC) — pending NPC neprosákne do „Tvé postavy".
- **WS:** `world:page-review-changed` (PJ fronta) + `world:page-review-resolved` (autor toast: schváleno/vráceno/zahozeno).
- **Badge:** „⏳ Čeká na schválení PJ" na detailu stránky (`PageHeader`).

### Stav
✅ funguje (BE typecheck+lint+247 jest+smoke boot; FE tsc-b+eslint+14 vitest).

### Kód
FE `PageEditorPage` (guard Hrac), `NewPageWizardModal` (proposeMode), `WorldLayout` („+ Navrhnout"), `RequestsList` (PageReviewRow), `useWorldPageReview`, `NpcCharacterPalette` (filtr), `PageHeader` (badge). BE `pages.service` (`resolveCreateMode`/`assertCanEditPage`/`approveProposal`/`rejectProposal`/`findPendingProposals`), `assertAccess`+`findDirectory` (viditelnost), `pages.controller` (`:slug/approve|reject`), `worlds.service.getWorldPendingActions` (page-review), `worlds.gateway` (WS).

## Sjednocení Page + Character (spec 9.1 / 9.2)

### Co to je
Page je primární entita; pro typy `Postava hráče`, `NPC`, `Lokace` BE auto-vytvoří Character entity, která drží subdokumenty. Page → Character přes `characterRef.characterId`.

### Kde / Jak (BE)
- `pages.service.create` (`:410-420`): persona (PC/NPC) i Lokace → `charactersService.create` s `kind: 'location'|'persona'`. Klient může předat existující `characterRef` (migrace).
- `pages.service.update` (`:625-660`): transition wiki→persona/Lokace vytvoří Character pokud ještě není; změna typu Lokace ↔ PC/NPC volá `charactersService.syncKind` (`:654`, jinak by taktická mapa odmítala token).
- Subdoc kaskáda v `character-subdocs.service.onCharacterCreated` (`character-subdocs.service.ts:141-170`) — **od 2026-07-12 (D-NEW-INV-DATA-SYNC) sladěná se čtením**:
  - Každá entita (persona i lokace): **calendar**.
  - Non-lokace (PC i NPC): **diary + notes**.
  - **Jen PC** (`isPc = !isNpc && !isLocation`): **finance + inventory**.
- Odpovídá read gatingu: `getFinance`/`getInventory` vrací 404 `*_NOT_APPLICABLE` pro NPC i Lokaci (`character-subdocs.service.ts:495`, `:602`) — už se tedy nezakládají subdocy, které nikdo nepřečte.
- **Doplnění při změně typu:** `onCharacterConverted` (NPC→PC create-if-missing) + lazy-create v `getFinance`/`getInventory`.

### Hranice — co neumí
- „Character drží 5 subdokumentů" platí **jen pro Postavu hráče**. NPC = calendar + diary + notes; Lokace = jen calendar. Není to bug, je to záměrné zúžení (viz výše).
- Rollback při selhání: pokud page save selže po vytvoření Character, BE rolluje postavu zpět (DI-04, `pages.service.ts:462-483`) — ale je to manuální kompenzace, ne transakce.

### Zvláštnosti
- Lazy-create + `rollbackIfParentGone` pro legacy postavy bez subdoců (self-healing prvním GET).
- Historické orphany (finance/inventory NPC a Lokací z doby před 2026-07-12) uklízí `scripts/cleanup-npc-lokace-finance-inventory`.

### Stav
✅ Funkční; asymetrie create vs. read **vyřešena** (D-NEW-INV-DATA-SYNC).

### Kód
BE `pages.service.ts:410`, `character-subdocs.service.ts:141`.

---

## AKJ chráněné záložky (per stránka)

### Co to je
Záložky vedle základního obsahu stránky, viditelné jen tomu, kdo splní `access[]` (OR logika). Nahradily dřívější `privateContent` i page-level AccessPanel.

### Kde
- BE typ `AkjTab` (`page.interface.ts:193`), filtrování `filterAkjTabsForViewer` (`pages.service.ts:1435`).
- FE editor `AkjTabsPanel.tsx`, viewer `WithAkjTabs.tsx` + `AkjLockedPanel`.

### Kdo (BE-enforced gating)
- PJ + **elevovaný** platform Admin+ vidí VŠE odemčené (`seesAll`, `pages.service.ts:1448-1452`).
- **PomocnyPJ NEMÁ auto-bypass** na AKJ záložky (jen co mu PJ grantoval přes `tab.access`) — odlišnost od page-level `assertAccess`, kde PomocnyPJ+ bypass MÁ (`:1294`).
- Vlastník postavy (`page.ownerUserId === userId`) vidí AKJ záložky své PC defaultně, dokud mu PJ nezvolí `ownerHidden` (`:1468`).
- **Anonym (22.4 vitrína):** membership lookup se přeskočí (`:1443-1447`) — `findByUserAndWorld(undefined, …)` by kvůli mongoose strip-u undefined matchnul CIZÍ membership (leak role). Totéž v `assertAccess` (`:1291`).

### Chování zamčených záložek (spec-akj-locked-tabs-visible)
- „In-fiction" clearance záložka (má AKJ/AKJType req, žádný Role) → hráč bez přístupu vidí ZAMČENOU: 🔒 jméno + úroveň, BEZ obsahu a bez jmenovitých klíčů (`lockedAkjTab`, `:238`; predikát `isBroadcastableAkjTab`, `:225`). Po získání přístupu → 🔓 + obsah.
- Role záložky („PJ informace") a prázdné/jen-jmenovité („Soukromé") zůstávají úplně SKRYTÉ.
- `locked` je read-time enrich — na write path se zahazuje (`sanitizeAkjTabs`, `:154`).

### Co jde editovat (PJ v `AkjTabsPanel`)
- Název, pořadí (move up/down).
- „Kdo vidí": clearance (AKJ úroveň) + konkrétní hráči (UserId chips). Presety „PJ informace" (Role=PomocnyPJ, ownerHidden) a „Soukromé".
- Override obsahu (sparse): obrázek, text (TipTap), atributová tabulka — prázdné dědí ze základní stránky.
- Přepínač „Vlastník postavy vidí" (jen u PC, `ownerControlled`).
- Přepínač **„Vlastník smí upravovat obsah"** (`ownerEditable`, jen u PC) — disabled/vynulovaný když je záložka pro vlastníka skrytá. Preset „Soukromé" ho má zapnutý.

### Editace obsahu vlastníkem (spec-akj-owner-editable-content, 2026-07-19)
- **Kdo:** vlastník své PC (`isOwner`), na záložce s `ownerEditable===true` a `!locked`. FE gate `PostavaLayout` `showAkjEditBtn`; tlačítko „Upravit záložku" → inline editor `AkjOwnerInlineEditor` (reuse RichText / `HeroUploadCard` / `TablePanel`).
- **Co smí:** jen `contentOverride` té záložky (text/obrázek/boxy). Ukládá PATCH s **jedinou** záložkou; BE ji spáruje podle `id`.
- **BE bezpečnost (`resolveAkjTabsPatch` `:1385` + `mergeAkjTabContentOnly` `:1361`):** editor bez `seesAll` (vlastník i PomocnyPJ) → base = uložené `akjTabs` z DB, z payloadu se přebírá **jen `contentOverride`** záložek, které smí editovat (vlastník: `ownerEditable && !ownerHidden`, `:1406`; PomocnyPJ: `passesAccess` = plně vidí, `:1420`). Flag/`access`/`name`/`order` **vždy z DB, ne z DTO** → žádná eskalace, žádné přidání/smazání/přejmenování, cizí i skryté záložky zůstanou. PJ/elevated (`seesAll`) → full-replace beze změny (`:1400`).
- **✅ D-067 tímto vyřešen** (2026-07-19): PomocnyPJ dřív full-replacem nenávratně mazal PJ-only a strhával locked záložky (četl osekaný seznam) — teď mergne. Doloženo `pages.service.ts:1385-1422`; `docs/dluhy.md` je od 2026-07-19 prázdný (uzavřené dluhy se mažou, historie v git logu).
- `contentOverride.imageUrl` u AKJ prochází URL guardem (`sanitizeAkjImageUrl`, odmítne `data:`/`javascript:`).

### Hranice — co neumí
- Editor (`AkjTabsPanel`) ručně exponuje jen **AKJ clearance + UserId**; `Role` a `AKJType` requirementy přidává jen preset „PJ informace" — UI nemá obecný picker rolí/AKJType pro AKJ záložky (page-level `accessRequirements` je řeší přes `AccessRequirementEditor`, ale to je jiný editor).
- Backend přijímá v `tab.access` i AKJType/Role (passesAccess je vyhodnotí), ale editor je běžně nenabízí.

### Stav
✅ Funkční, BE-enforced. Editace obsahu vlastníkem/PomocnymPJ ✅ (2026-07-19).

### Kód
BE `pages.service.ts:1435` (filterAkjTabsForViewer), `:225` (isBroadcastableAkjTab), `:238` (lockedAkjTab), `:154` (sanitizeAkjTabs), `:1361` (mergeAkjTabContentOnly), `:1385` (resolveAkjTabsPatch); FE `PageEditor/panels/AkjTabsPanel.tsx`, `PageViewer/components/WithAkjTabs.tsx`, `PageViewer/layouts/PostavaLayout.tsx` (gate + inline), `PageViewer/components/AkjOwnerInlineEditor.tsx`.

---

## Page-level přístupová pravidla (accessRequirements)

### Co to je
Gate na celou stránku (vedle AKJ záložek). OR logika 4 typů: `UserId`, `AKJ` (číselná úroveň), `Role` (world role práh), `AKJType` (pojmenovaná clearance z WorldSettings).

### Kdo / gating (BE)
- `assertAccess` (`pages.service.ts:1243`), pořadí bran:
  1. **Moderační skrytí** (`isModerationHiddenFor`) → 404 i pro PJ (`:1252`).
  2. **Pending návrh** (15.11) → jen autor / moderátor, jinak 404 (`:1262`); MUSÍ být před early-returnem.
  3. Bez requirementů → projde (`:1279`).
  4. **Elevovaný** platform Admin+ → bypass (`worldAdminBypass`, `:1284`) — ne Admin natvrdo (R-20).
  5. World role >= PomocnyPJ → bypass (`:1294`).
  6. Jinak `passesAccess` (OR, `:1204`) → 403 `PAGE_ACCESS_DENIED`.
- Aplikuje se v `findBySlug`, `findByWorld` (listing filtr), `findVisibleSlugs` (search, `:914`), `findBacklinks` (`:1138`).

### Hranice
- Page-level gate odfiltruje stránku z listingu silent (neukáže existenci). Search/backlinks respektují.
- `findDirectory` `assertAccess` NEvolá — má vlastní filtr (dvě read cesty, viz „Seznam stránek").

### Stav
✅ Funkční.

### Kód
BE `pages.service.ts:1243` (assertAccess), `:1204` (passesAccess).

---

## Šablony stránek (WorldPageTemplate)

### Co to je
Per-svět šablony **atributové tabulky** (NE celé stránky, NE deníkové schéma). PJ definuje např. „Postava", „Stát" → editor je nabízí jako stripe karet.

### Kde
- BE modul `modules/world-page-templates`. Controller `@Controller('worlds/:worldId/page-templates')` — `GET :38` / `POST :47` / `PATCH :id :61` / `DELETE :id :76`.
- FE konzumace `DataTemplatePanel.tsx` (editor), správa v Nastavení světa (`#sablony`).

### Kdo (BE)
- GET: `findByWorld` → `assertCanViewWorld` (**FIX-58**, `world-page-templates.service.ts:41-46`) — člen privátního světa / kdokoli přihlášený u veřejného. Dřív bez brány → nečlen privátního světa šablony četl.
- Create/Update/Delete: `assertCanManage` = platform Admin+ NEBO world role >= **Korektor** (`:155-176`, práh na `:171`). Pozn.: nižší práh než stránky (PomocnyPJ)! Komentář to zdůvodňuje konzistencí s tabem „Vzhled".

### Co obsahuje šablona
`key` (unique/svět), `label`, `headers[]` (hlavičky tabulky), `defaultTitle`, `contentOutline` (15.5 — obsahová osnova, sanitizovaný TipTap HTML), `icon` (whitelist 10 Lucide ikon: FileText/MapPin/Users/Sword/Coins/BookOpen/Globe/Building2/Crown/Network — `world-page-template.interface.ts:33-44`), `order`. Matrix svět dostává 6 výchozích šablon v seedu (`stat`, `mesto`, `noviny-meta`, `projekt`, `frakce`, `organizace`, vč. osnov); ostatní startují prázdné.

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
BE `world-page-templates.service.ts:49` (create+sanitize), `:83` (update), `:155` (assertCanManage), interface `world-page-template.interface.ts`, seed `world-page-templates.matrix-seed.ts`; FE editor `WorldSettingsPage/components/TemplateEditorModal.tsx`, vložení `PageEditor/panels/DataTemplatePanel.tsx`.

---

## Administrace stránek (PagesAdminPage)

### Co to je
Tabulkový přehled všech stránek světa pro hromadnou správu.

### Kde
- FE route `admin/stranky` → `WorldMembershipGuard(minWorldRole=PomocnyPJ, fallback Sa/Admin)` (`router.tsx:467-478`).
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
- Mazání nemá undo (BE hard delete + `page.deleted` event pro úklid blobů/oblíbených — CD-01/CD-08, `pages.service.ts:772`).

### Stav
✅ Funkční.

### Kód
FE `PagesAdminPage/PagesAdminPage.tsx:30`; BE delete `pages.service.ts:758` (`assertCanWrite` → hard delete + event).

---

## Pravidla & Informace (referenční stránky)

### Co to je
Speciální stránky seedované při tvorbě světa + dedikovaná „Pravidla" route.

### RulesPage (route `pravidla`)
- FE route `pravidla` → **`showcaseOrMember(RulesPage)`** (`router.tsx:452`, 22.4 vitrína).
- Pravidla = wiki stránka s rezervovaným slugem `pravidla` (`RulesPage.tsx:14`). Existuje → render přes `PageViewer`; neexistuje → PomocnyPJ+ **nebo elevovaný admin** (`RulesPage.tsx:28`) vidí CTA „Vytvořit pravidla" (`:69`, založí prázdnou typ Ostatní), ostatní empty state.

### Seedování (BE `pages-world-seed.listener.ts`, `PAGE_TEMPLATES :20-38`)
Při `world.created` se založí (pokud neexistují) — **6 stránek**:
- `pravidla` (Ostatní, order 0) — obsah dle `world.system` (`SYSTEM_RULES_TEMPLATES`).
- `magicky-system` (Ostatní, order 1) — univerzální škála MÚ + zvolené `magicTraditions`.
- `technologie` (Ostatní, order 2) — škála TÚ + rozsah `techLevelMin/Max`.
- **`nabozenstvi` (Ostatní, order 3)** — 2.3g, třetí worldbuildingová osa vedle magie a technologie. Seeduje se **i pro Matrix** (Pravidlová kniha náboženství neřeší → není v `MATRIX_RULEBOOK_REPLACES`).
- `faq` (Ostatní, order 4), `videa` (Obrazovka, order 5).
- Matrix svět: `pravidla`/`magicky-system`/`technologie` nahrazuje Pravidlová kniha (`seedRulebook :121` — hub + kapitoly 1-9).

### Menu „Informace" (FE `worldNavConfig.ts:183-210`)
Skupina „Informace" (`buildWorldNav`) obsahuje: Skupiny (rozbalovací), Pravidla, Magický systém (`id`, skrývatelné), Technologie (`id`, skrývatelné). „Stránky" je v skupině „Svět". **15.5-followup (D-NEW-INV-WIKI):** odkazy Magický systém/Technologie se skryjí, když odpovídající stránka neexistuje — `buildWorldNav` bere `existingPageSlugs` (z `usePagesDirectory` ve `WorldLayout:353-359`); `pravidla` má vlastní route (RulesPage) → nefiltruje se.
- ⚠️ **`nabozenstvi` se seeduje, ale v menu „Informace" NENÍ** — dosažitelné jen přes katalog Stránky nebo přímou URL (`/svet/:slug/nabozenstvi`). Viz nesrovnalost 5 níže (přidání referenční stránky do menu = ruční zásah do `buildWorldNav`).

### Hranice — co neumí / nesrovnalost
- **Dvě vrstvy:** seed zakládá OBSAH stránek (create-only), menu „Informace" je definované v `buildWorldNav`. Odkazy magicky-system/technologie se teď podmiňují existencí stránky (mrtvý odkaz vyřešen), ale **přidání nové referenční stránky** do menu je pořád ruční zásah do `buildWorldNav` (memory `project_world_informace_reference_pages`). Magický systém/Technologie jdou skrýt i ručně přes `hiddenNavItems` (`id`); Pravidla a Stránky jsou esenciály.
- Seedované referenční stránky jsou typ `Ostatní` (mimo matrix); tabulky v jejich obsahu se ve vieweru **renderují** (15.5-followup).

### Stav
✅ Funkční.

### Kód
FE `RulesPage.tsx:26`, `worldNavConfig.ts:183`; BE `pages-world-seed.listener.ts:20` (PAGE_TEMPLATES), `:60-113` (obsah + seed).

---

## Oblíbené stránky (favoritePageSlugs)

### Co to je
Osobní oblíbené stránky per svět (5.2-followup).

### Kde / Jak
- BE: uloženo na User `favoritePageSlugs: Record<worldId, slug[]>` (pořadí významné) (`users/interfaces/user.interface.ts:154`).
- Endpoint `PUT /users/me/favorite-pages/:worldId` (`users.controller.ts:213-226`).
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
BE `users/interfaces/user.interface.ts:154`, `users.controller.ts:213`; FE `pages/api/useFavoritePages.ts`.

---

## Další API endpointy stránek

| Endpoint | Účel | Gating |
|---|---|---|
| `GET /pages` | listing s access filtrem | Čtenář (member), per-page filtr |
| `GET /pages/directory` | adresář (shieldedBy enrich, + `characterId`/`ownerUserId`) | OptionalJwt — veřejný svět i anonym, privátní jen členové (2026-07-13) |
| `GET /pages/dataSlugs` | všechny slugy (editor pomůcka) | **PomocnyPJ+** (N-37, jinak leak existence AKJ stránek) |
| `GET /pages/data?number=N` | náhodné stránky (max 50) | přihlášený |
| `GET /pages/meta/:slug` | metadata + shieldedBy | přihlášený |
| `GET /pages/:slug` | plný obsah | 3-branový gating; od 22.4 `OptionalJwt` — anonym JEN přes zapnutou vitrínu světa (`assertShowcaseViewable`, 403 `SHOWCASE_DISABLED`; AKJ/vyhrazené dál 403), viz kap. 09 |
| `GET /pages/:slug/backlinks` | „Odkazuje sem" (7.1l) | access na cíl, filtr přístupných |
| `POST /pages` | create | PomocnyPJ+, **nebo Hráč+ jako `pending` návrh** (15.11) |
| `PATCH /pages/:id` · `DELETE /pages/:id` | update / hard delete | PomocnyPJ+ (update i autor pending návrhu / vlastník své PC — `ownerScoped`) |
| `POST /pages/:slug/approve` · `/reject` | schválení / vrácení návrhu (15.11) | `assertCanWrite` = PomocnyPJ+ |

Kód: `pages.controller.ts:40-262`.

---

## ⚠️ Nesrovnalosti & dluhy (k ověření)

1. ✅ VYŘEŠENO 2026-07-12 (D-NEW-INV-DATA-SYNC) — **Asymetrie subdoc create vs. read (Lokace/NPC).** `onCharacterCreated` už zakládá finance+inventory **jen pro PC** (`isPc = !isNpc && !isLocation`, `character-subdocs.service.ts:154-160`), takže create odpovídá read gatingu (`getFinance` `:495` / `getInventory` `:602` → 404 `*_NOT_APPLICABLE` pro NPC/Lokaci). Doplnění při konverzi typu řeší `onCharacterConverted` + lazy-create v GET; historické orphany uklízí `scripts/cleanup-npc-lokace-finance-inventory`.

2. **Práh „šablon stránky" = Korektor, ale stránky samotné = PomocnyPJ.** **Stále platí** (ověřeno 2026-07-20): `WorldPageTemplate` CRUD povolen Korektor+ (`world-page-templates.service.ts:171`), zatímco vytvoření/úprava stránky vyžaduje PomocnyPJ+ (`pages.service.ts:1487`) — Hráč+ jen jako `pending` návrh. Korektor tedy může vytvořit šablonu tabulky, ale ne stránku, kde by ji použil (ani jako návrh ne — Korektor je role 3, tedy ≥ Hrac, takže návrh whitelist typu **projde**; stránku „naostro" ne). Záměr (komentář odkazuje na tab „Vzhled"), ale stojí za revizi konzistence.

3. **Názvoslovný střet „Šablona".** Stále platí. „Datová šablona stránky" (`WorldPageTemplate`, atributová tabulka) vs. „Šablona deníku" (diary schema) — a nově i „Šablona bestie" (`entity_schema_versions`, kap. 10) — v Nastavení světa jsou tři různé věci se zaměnitelným názvem; riziko záměny v dokumentaci i UX.

4. ✅ VYŘEŠENO 2026-07-13 (FIX-58) — **Šablony stránek četl i nečlen privátního světa.** `findByWorld` dostal `assertCanViewWorld` (`world-page-templates.service.ts:41-46`), vzor `pages.service.findByWorld`.

5. **Seed obsahu vs. nav menu jsou 2 nepropojené vrstvy.** **Stále platí, a nově se to projevilo:** referenční stránky (`pravidla`/`magicky-system`/`technologie`/**`nabozenstvi`**) seeduje BE create-only (`pages-world-seed.listener.ts:20-38`), ale menu „Informace" je hardcoded ve FE `buildWorldNav` (`worldNavConfig.ts:183-210`) — a **`nabozenstvi` (2.3g) do menu nikdo nepřidal**, takže seedovaná stránka je z navigace nedosažitelná. Opačný směr (smazaná stránka = mrtvý odkaz) je od 15.5-followup ošetřen přes `existingPageSlugs`. Skrytí přes `hiddenNavItems` jde jen u Magického systému/Technologie (mají `id`).

6. **PomocnyPJ rozdílné chování page-level vs. AKJ záložky.** Stále platí a je záměr: na page-level `accessRequirements` má PomocnyPJ+ bypass (`pages.service.ts:1294`), na AKJ záložkách NEMÁ auto-bypass (`seesAll` = jen PJ/elevovaný admin, `:1448`). Matoucí pro uživatele — PomocnyPJ otevře chráněnou stránku, ale ne nutně její AKJ záložky (spec-akj-protected-tabs).

7. **Backlinks („Odkazuje sem") je PomocnyPJ+ only ve vieweru** (`PageViewer.tsx:174`, gate `canEdit` `:71`), zatímco BE endpoint (`pages.service.ts:1138`) ho dá i hráči s přístupem na cíl. FE záměrně skrývá (meta-vazby), ale je to FE-only restrikce. Stále platí.
