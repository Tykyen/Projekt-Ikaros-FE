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
