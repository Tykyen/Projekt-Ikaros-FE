# Chybový deník tisk

Detaily chyb z práce na tisku (pilíř A 14.7). Přehled v [README](README.md).

---

### CH-001 — Izolace přes `visibility:hidden` + `position:absolute; inset:0` · 2026-06-20
**Kontext:** Tisk stránky/deníku přes `window.print()` + `@media print`, izolace tiskového kořene.
**Co jsem udělal špatně:** `body * {visibility:hidden}` + `[data-print-root] {visibility:visible; position:absolute; inset:0}`.
**Proč to nefungovalo:** `position:absolute; inset:0` dá pevnou výšku 1 stránky → dlouhý obsah se ořízne. Absolute/fixed se přes stránky nelámou.
**Poučení:** Pro vícestránkový tisk NIKDY `position:absolute`/`fixed` na kořen. Obsah musí být v normálním flow.
**Příznak cyklení:** Ladím `inset`/`position`/`height` a obsah se pořád ořezává na 1 stránku.

---

### CH-002 — Klon do `<body>` byl celý neviditelný · 2026-06-20
**Kontext:** Náhrada CH-001 — klon cíle do `<div data-print-root>` v `<body>`, ostatní `display:none`.
**Co jsem udělal špatně:** Spoléhal, že klon v `<body>` se vytiskne. Debug: klon měl obsah (textLen=3640, inBody=true), ale tisk úplně prázdný.
**Proč to nefungovalo:** Klon mimo theme scope dědil skrytí/styly z appky, které nešlo na dálku trefit. Živý DOM appky není stavěný na vytržení a samostatný tisk.
**Poučení:** Neklonovat živý DOM appky do téže stránky. Buď úplně izolovaný kontext (jiné okno/iframe + vlastní CSS), nebo serverový render.
**Příznak cyklení:** „Klon má obsah", ale tisk prázdný, a já ladím selektory izolace.

---

### CH-003 — Barva přes `rgb(var(--black-rgb))` se v klonu nedědila · 2026-06-20
**Kontext:** Pokus opravit neviditelný klon (CH-002) — domněnka, že text je bílý na bílém.
**Co jsem udělal špatně:** Řešil barvu, ač byl skrytý i obrázek a boxy.
**Proč to nefungovalo:** Uživatel namítl: kdyby šlo o barvu, obrázky/boxy by byly vidět. Špatná hypotéza.
**Poučení:** Ověř hypotézu logikou: „kdyby příčina X, projeví se jen Y, ne Z". Skryté úplně všechno ≠ barva.
**Příznak cyklení:** Ladím barvy/CSS proměnné, ale problém je „nevidím vůbec nic".

---

### CH-004 — Cyklení: 3 varianty CSS izolace + ladění naslepo na produkci · 2026-06-20
**Kontext:** CH-001 → CH-002 → CH-003 = tři varianty téhož (izolovat kořen CSS triky).
**Co jsem udělal špatně:** Variace za variací stejného nápadu, ověřované deploy+test na produkci (tisk nejde headless lokálně).
**Proč to nefungovalo:** Tři pokusy o tutéž třídu řešení = cyklení. Po druhém neúspěchu měla přijít JINÁ třída řešení.
**Poučení:** Po 2 neúspěšných variantách téhož přístupu změnit přístup od základu, ne ladit detaily. Nespoléhat na deploy+test jako primární smyčku ladění.
**Příznak cyklení:** Třetí commit „fix tisku" za sebou, jiný CSS detail, výsledek pořád špatně.

---

### CH-005 — Tisk v novém okně dřív než načtení obrázků · 2026-06-20
**Kontext:** Přechod na `window.open` — text se konečně tiskl.
**Co jsem udělal špatně:** `win.print()` hned po `document.write` (jen `onload` + krátký timeout).
**Proč to nefungovalo:** Obrázky (Cloudinary) se nestihly stáhnout → v tisku chyběly.
**Poučení:** Před `win.print()` počkat na `load`/`error` všech `win.document.images`.
**Příznak cyklení:** Text se tiskne, obrázky ne.

---

### CH-006 — Záložky zmizely: `afterprint` špatného okna · 2026-06-20
**Kontext:** „Tisk všech záložek" přepíná `printAllTabs`; reset věšen na `afterprint`.
**Co jsem udělal špatně:** `afterprint` listener na HLAVNÍM okně, ale tisk běží v NOVÉM okně.
**Proč to nefungovalo:** `afterprint` se vystřelí v tiskovém okně → reset hlavního se nezavolal → lišta záložek zmizela natrvalo.
**Poučení:** Při tisku v jiném okně nelze spoléhat na `afterprint`/`beforeprint` hlavního okna. Reset navázat na vlastní časování.
**Příznak cyklení:** UI hlavní stránky zůstane zaseknuté v tiskovém stavu.

---

### CH-007 — Styly appky v tiskovém okně: prázdné listy (SPA layout) · 2026-06-20
**Kontext:** Aby tisk vypadal jako web, zkopíroval jsem stylesheets appky do okna.
**Co jsem udělal špatně:** Plné CSS appky bez ošetření SPA layoutu (`height:100vh`, `overflow:hidden`, sticky).
**Proč to nefungovalo:** Na obrazovce OK, v tisku ty výšky/overflow rozházely stránkování → spousta prázdných listů.
**Poučení:** Přebíráš-li CSS appky do tisku, v `@media print` resetuj SPA layout (height auto, overflow visible).
**Příznak cyklení:** Tisk má hodně stránek, většinou prázdných; obsah „někde je", rozházený.

---

### CH-008 — `position:static !important` na vše rozbil obrázky · 2026-06-20
**Kontext:** Reset SPA layoutu (CH-007) udělán moc hrubě.
**Co jsem udělal špatně:** `body * { position: static !important }` → rozbil crop kontejnery avataru/obrázků (regrese).
**Proč to nefungovalo:** Globální reset position zničí prvky, co position legitimně potřebují (object-position crop, overlay).
**Poučení:** Globální `!important` resety na `*` jsou tupý nástroj — opraví jedno, rozbijí druhé. Cílit úzce.
**Příznak cyklení:** Oprava A vrátí regresi B; každý hrubý global reset něco jiného rozbije.

---

### CH-META — Tisk přes klonování živého DOMu je principiálně křehký · 2026-06-20
**Souhrn:** Celý pilíř A (tisk přes `window.print` + manipulace s živým DOMem/CSS appky) = dlouhá série dílčích selhání (CH-001…008), lokálně neověřitelná (headless) → ladění přes deploy+test na produkci.
**Poučení do budoucna:** Na věrný tisk je robustnější **serverové PDF** (headless Chrome 1:1) nebo **dedikovaná tisková šablona** (vlastní layout per entita), ne klonování živého aplikačního DOMu. Rozhodnout PŘÍSTUP dřív, než se utopím v CSS detailech.

---

### ✅ ŘEŠENÍ — CH-META uzavřena: tisk = čistý dokument, ne klon živé appky · 2026-06-20
**Co nakonec zabralo:** Přestat kopírovat CSS appky do tiskového okna. Tiskne se holý semantický klon JEN na čistém dokumentovém CSS (`src/features/world/export/print/printDoc.css`). Tím v jednom kroku odpadl SPA layout (prázdné listy, CH-007) i potřeba hrubých resetů (rozbité obrázky, CH-008) — kořen většiny série.
**Proč to je správně (a ne 9. variace):** CH-001…008 honily 1:1 vizuál klonem živé appky → přidávaly hacky. Řešení šlo OPAČNÝM směrem: **ubrat**, ne přidat. Tisk má vypadat jako dokument, ne jako webová appka. Tím se kořen rozpustil, místo aby se přebíjel dalším CSS.
**Jak ověřeno (a proč to zlomilo deploy-test smyčku CH-004):** Postaven offline náhled `scripts/print-preview/` (Playwright `emulateMedia('print')` → PDF) sdílející TÝŽ `printDoc.css` přes `?raw`. Ladění tiskového CSS je od teď lokální a deterministické, ne přes produkci.
**Zhodnocení:** Dobře — zabralo napoprvé, bez cyklení. Reálný test na produkci potvrdil: prázdné listy pryč, obrázky se tisknou. Zbylá práce (rozpady gridů, staty deníku) je doladění VZHLEDU, ne boj se základem. Klíč byl: po 8 selháních v jedné třídě řešení změnit třídu, ne detail.

---

### CH-009 — Collapsed sekce (výbava) se v tisku nevytiskla: obsah není v DOM · 2026-06-20
**Kontext:** Tisk postavy „všechny záložky". Výbava vyšla jen jako hlavičky sekcí, obsah (položky) chyběl.
**Co jsem udělal špatně:** Při návrhu tisku jsem ošetřil rozbalení collapsed sekcí jen u `PageSections`. Neověřil jsem VŠECHNY collapsible komponenty — `InventoryTab` (`CollapsibleSection`/`CollapsibleNotes`) má vlastní `useState(true)` a render `{!collapsed && …}`.
**Proč to nefungovalo:** `{!collapsed && body}` znamená, že obsah zavřené sekce NENÍ v DOM (ne jen skrytý CSS). Klon pro tisk tedy nemá co vytisknout. **Tisk ukáže jen to, co v DOM reálně je.**
**Poučení:** Každá komponenta s collapsed/podmíněným renderem, co se má tisknout, musí v `printMode` renderovat rozbaleně (`showBody = printMode || !collapsed`). Při práci na tisku projít VŠECHNY collapsible/conditional rendery, ne jeden vzor. Pozor i na header jako `<button>` (v tisku skrytý `button{display:none}`) → doplnit tiskový nadpis (`{printMode && <h3 className="print-section-title">}`).
**Příznak cyklení:** V tisku chybí obsah, který JE vidět po kliknutí (rozbalení) na obrazovce — a já ladím CSS viditelnosti místo DOM přítomnosti.

---

### ✅ ŘEŠENÍ — doladění vzhledu tisku postavy (vlna 2) · 2026-06-20
**Co se ladilo (po uzavření CH-META, dle reálných screenshotů od uživatele):**
- Obrázky obří → strop `img { max-height: 9cm }` + portrét postavy cílená třída `.print-portrait` (6 cm); mapy/ilustrace zůstávají větší.
- Záložky postavy se v „tisku všech" slévaly → každá obalena `.print-page` (`break-before: page`; první `:first-child` sdílí list s hero/profilem).
- Profil (definiční seznam) se rozpadal „label nad hodnotou" → element-level `dl/dt/dd` (label: hodnota na řádku).
- Aside výbavy (portrét+jméno) tiskl skoro prázdnou stránku navíc (duplikát hero) → `.print-hide`.
- Položky výbavy „název×N" nalepené → `.print-row` (název ⟷ ×N).
**Jak ověřeno:** offline náhled `scripts/print-preview` (fixtura postava) + reálný tisk na produkci (uživatel) + build + 16/16 testů.
**Zhodnocení:** Výsledek dobrý, ale PROCES špatně — tyhle úpravy jsem zapsal až zpětně na výtku uživatele (viz CH-010). Jednotlivě „drobné", dohromady = postup, který do deníku patří.

---

### ✅ ŘEŠENÍ (DIAGNÓZA + zvolený směr) — tisk diary sheetů NEJDE přes CSS · 2026-06-20
**Co se zjistilo:** Tisk Matrix deníku (a obecně 12 systémových diary sheetů) vyšel prázdný/rozpadlý. Příčina: sheet renderuje VŠECHNY hodnoty přes `<input>`/`<textarea>` (i ve view módu = `disabled` inputy), pips/tracky přes obarvené `<button>`/`<div>`.
**Proč to NEjde přes CSS:** `<input value>` je replaced element — `value` není textový uzel, nejde vytisknout stylem (`display:none` skryje hodnotu, `display:inline` ukáže prázdné políčko). Stav nesený BARVOU tisk srovnává na černou → pips/tracky zmizí.
**Zvolený směr:** Tiskový render MUSÍ řešit komponenta (sheet), ne CSS — v `printMode` statická čitelná verze (hodnota jako text, pips `●●●○○`, track „Únava 0/25"). Začít `MatrixSheet` jako vzor, pak replikovat. **NEpokoušet se to spravit přes `printDoc.css` — slepá ulička.**
**Příznak cyklení:** Ladím `printDoc.css` na deník a hodnoty/pips se pořád netisknou.

---

### ✅ ŘEŠENÍ — tiskový render Matrix deníku (vzor pro ostatní sheety) · 2026-06-20
**Co nakonec zabralo:** `MatrixSheet` v `printMode` vrací **oddělený statický view** `MatrixPrintView` (čte stejná `matrix_*` data), místo aby se hackovaly inputy. Hodnoty jako text (`dl/dt/dd`), staty `print-cols` mřížka, přetlaky pips `●●●○○` (`pressurePips`), jazyky/schopnosti/aspekty `print-row` řádky, výbava text (`white-space:pre-wrap`).
**Proč to je správně:** Navazuje na diagnózu výše — tisk diary sheetu NEJDE přes CSS, řeší to komponenta. Oddělený view je čistší než `usePrintMode` podmínky u každého inputu/pip.
**Jak ověřeno:** offline náhled `scripts/print-preview` (fixtura `matrix-denik`) → čitelný dokument 1:1 se strukturou appky; build + 16/16 testů MatrixSheet.
**Zhodnocení:** Dobře. Past: **emoji v tisku** (`📘`) se vykreslí jako prázdný obdělník → nahrazeno textem `(magická)`. Vzor je přenositelný na ostatních 11 diary sheetů (každý dostane svůj `*PrintView`). ZBÝVÁ: 11 sheetů + ověřit Matrix naživo + zakotvit hlídání (hook na `diary-systems/**` změny — viz `feedback_chybovy_denik_deník_práce`).

---

### ✅ ŘEŠENÍ — tiskový režim zbývajících 11 diary sheetů (replikace vzoru) · 2026-06-20
**Co zabralo:** Vzor `MatrixPrintView` replikován na všech 11 zbývajících systémů přes **4 paralelní agenty** (coc, dnd5e, drd2/16/h/plus, gurps, jad, shadowrun + sdílený `FateLikeSheet` pokryl fate+pi). Každý sheet: `usePrintMode()` → `if (printMode) return <XPrintView cda={cda} />`. PrintView čte stejná `*_` data, renderuje statický dokument na existujících tiskových třídách (`dl`/`print-cols`/`matrix-print__plain`/`print-row`/`table`).
**Proč to je správně:** Stejná diagnóza (inputy/barvy netisknutelné) → stejné řešení. Paralelizace: nezávislé soubory, žádný konflikt; sdílený `printDoc.css` agenti NEsměli editovat (centralizace tříd → bez konfliktu).
**Jak ověřeno:** centrálně build zelený (tsc -b — všech 10 souborů typuje), 133/133 diary testů, `printDoc.css` needitován, emoji jen v interaktivních větvích (v tisku skryté). **Vizuál Matrixu ověřen náhledem; jednotlivých 11 NE** (neúměrné = 11 fixtur) → reálný test.
**Zhodnocení:** Kód-úroveň dobrá (build/test/vzor). Riziko = vizuální detaily per sheet (data klíče, struktura) neověřené náhledem — doladí se iterativně po reálném testu, jako u Matrixu. Past delegování: agenti tvrdí „hotovo", ale verifikace je MOJE (build+test centrálně, ne jejich slovo).

---

### ✅ ŘEŠENÍ — tisk Lokace/Ostatní stránky: pořadí obrázek → boxík → text · 2026-06-20
**Co zabralo:** `OstatniLayout` v `printMode` vrací lineární strom: hero obrázek (`.print-hero`, menší/vystředěný) → datová tabulka (boxík) → text → sekce. Na obrazovce jsou obrázek+tabulka v bočním `aside` sidebaru (pravý sloupec) → v tisku (klon zachová DOM pořadí) spadaly ZA text. Tisková větev je dává explicitně vepředu; AutoTOC/QuickRef (navigace) se netiskne.
**Proč to je správně:** `PageDataTable` jsem z `PageSidebar` vyEXPORTOVAL a reusoval (ne kopie). Reorder řešen renderem v komponentě (deterministické), ne CSS `order` hacky na flex sloupce (křehké, dříve zdroj chyb).
**Jak ověřeno:** náhled `scripts/print-preview` fixtura `lokace` → obrázek nahoře (7×12 cm) → boxík → text na 1 straně; build zelený.
**Zhodnocení:** Dobře. Platí pro VŠECHNY `OstatniLayout` tisky (typ Lokace, Ostatní, i AKJ taby) — konzistentní. Obecné `img` strop snížen z 12 na 9 cm; portrét 6 cm; hero stránky 7 cm.

---

### ✅ ŘEŠENÍ — tisk bestiáře (mezery) + kalendáře (akce + mřížka) · 2026-06-20
**Bestiář:** staty/schopnosti měly label+hodnotu nalepené (`MAX HP5`, `Zbroj0`, `síla2`) — flex z CSS modulu v tisku zmizel. Fix: `.print-stat` (flex + gap, kompaktní — NE space-between, staty jsou krátké) na `EntityStatbar` `statRow`/`statBarHeader` + `BestieCard` `ability`.
**Kalendář:** akce se netiskly (jen barevné proužky bez názvů). TŘI kořeny: (1) tisk dědil **compact density** (proužky bez textu) → `printMode` vynutí `density='detail'` + limit 999 (všechny akce); (2) eventChip je `<button>` → `button{display:none}` ho potlačil → `.print-event` přebíjí + barevný proužek (`--chip-color`); (3) **mřížka rozpadlá** — `display:grid` je v CSS modulu (v tisku pryč), `gridTemplateColumns` přežil (inline) → `.print-cal-grid` obnoví `display:grid` + rámečky buněk.
**Jak ověřeno:** náhledy `bestiar` + `kalendar` fixtury, build zelený.
**Zhodnocení:** Dobře. **Opakující se vzor:** CSS-module layout (grid/flex) se v tiskovém klonu ztrácí → stabilní tisková třída ho obnoví (`print-cols`/`print-row`/`print-stat`/`print-cal-grid`). To je systémový princip tisku přes klon — kdykoli layout drží jen CSS modul, v tisku potřebuje stabilní třídu.

---
