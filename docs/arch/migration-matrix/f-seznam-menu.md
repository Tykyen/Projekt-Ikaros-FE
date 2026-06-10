# F-Seznam — extrakce odkazů z obsahu do `page.menu` (follow-up F4a)

> Dílčí spec migrace Matrix→Ikaros. Index: [`index.md`](./index.md), stav: [`HANDOFF.md`](./HANDOFF.md).
> Stav: **NÁVRH — čeká na schválení.**

## Problém

Stránka typu **Seznam** ([`SeznamLayout.tsx`](../../../src/features/world/pages/PageViewer/layouts/SeznamLayout.tsx#L30)) má 3-sloupcový layout a čte **dvě oddělená pole**:
- **`page.menu[]`** (`{label, href, order}`) → levý nav box (`FIRMY`/`VIRY`)
- **`page.content`** (richtext) → hlavní text vpravo

Starý Matrix strukturované menu **neměl** — položky seznamu byly jen odkazy v textu obsahu. F4a převzala data 1:1 → odkazy zůstaly v `content`, `menu` zůstal `[]`. Výsledek: levý box hlásí „Seznam je zatím prázdný" a odkazy „visí" jako volný text vpravo, **mimo seznam**.

## Rozsah (změřeno na `f4a-pages.json.gz`)

- **122** stránek `type:"Seznam"` ve světě `matrix`.
- **0** používá `<ul>/<li>` — každá položka = **samostatný paragraf** s jedním (občas dvěma) `<a>`.
- **925** odkazů celkem: 874 root-relativní (`/atlanta`), 3 holý slug (`atlanta`), 48 absolutní — **všech 48 míří na `www.projekt-ikaros.com`** (umírající starý web), žádná jiná externí doména.
- Po extrakci: **74** stránek bude mít prázdný `content`, **48** si nechá úvodní text.
- Ne-odkazové bloky: **11 headingů + 1 horizontalRule** (napříč pár stránkami).

## Cílové chování

Pro každou Seznam stránku projít `content` blok po bloku:

| Blok | Akce |
|---|---|
| Paragraf s **jedním** odkazem a **bez** doprovodného textu | → **menu** položka, `label` = text odkazu |
| Paragraf s **jedním** odkazem a **krátkým** doprovodným textem (≤ `PREFIX_MAX` = 40 zn.) — „prefix: odkaz" (`Kapitán: …`, `Zeus: …`, `DOM - …`) | → **menu** položka, `label` = **celý plaintext řádku** (prefix + jméno), `href` = odkaz |
| Paragraf s **více** odkazy a **bez** textu (`Tchien-tin` + `Další místa`) | → **rozdělit** na N menu položek (label = text každého odkazu) |
| Paragraf s **jedním** odkazem a **dlouhým** textem (>40 zn.) → popisný odstavec | **ponechat v contentu** |
| Paragraf s **více** odkazy **a textem** (`noviny`: titulek+datum+zdroj) | **ponechat v contentu** |
| Paragraf bez odkazu (úvod, nadpis), heading, horizontalRule | **ponechat v contentu** v původním pořadí |

`order` v menu = pořadí výskytu v contentu (0,1,2…). Pořadí ponechaných bloků se zachová.

⚠️ **Past (oprava za běhu):** odkazy nesou marks (`textStyle`/`fontSize`/`underline`) → `tiptapToHtml` je obalí do `<span>/<u>`. Detekce „jen odkaz" proto po odečtení `<a>…</a>` musí smáznout i **zbylé inline tagy** (`<[^>]+>`), jinak ostylovaný čistý odkaz vypadá jako „má text" a zůstane v contentu (první verze takhle minula 359 paragrafů).

### Normalizace `href` (do menu)

SeznamLayout skládá cíl jako [`it.href.startsWith('/') ? it.href : '/svet/<svět>/' + it.href`](../../../src/features/world/pages/PageViewer/layouts/SeznamLayout.tsx#L66-L68). Aby odkaz mířil na world-scoped stránku, ukládáme do menu **holý slug** (bez lomítka):

1. **Strip starého webu:** `https://(www.)?projekt-ikaros.com/<x>` → `<x>` (reuse logiky [`stripLegacyDomain`](../../../src/features/world/pages/PageViewer/hooks/matrixLegacyLinks.ts) z F5).
2. **Strip leading `/`:** `/atlanta` → `atlanta`.
3. **Remap přejmenovaných slugů:** aplikovat F5 mapu (`abigail-wattson`→`abi`…) z `matrixLegacyLinks` / `migration/f5-links.json.gz`, aby menu mířilo na živý slug.
4. **Zachovat `#kotvu`/`?query`**, pokud je.

📚 *Proč ne runtime (jako F5):* F5 nechal odkazy v contentu a opravuje je při renderu kvůli přenositelnosti mezi světy. Tady ale `menu` je **legitimní editovatelné pole stránky** — po migraci ho uživatel spravuje v editoru (přidá/odebere položku). Datová migrace je proto správná: menu jede se stránkou, content se odlehčí, žádná render-time duplicita.

## Rozhodnutí

- **Datová migrace, ne runtime.** Workflow proti živé DB na `newmatrix` (vzor F4a/b/c). Po běhu jsou data čistá, SeznamLayout funguje beze změny.
- **Jen svět `matrix`, jen `type:"Seznam"`.** Gate na obojí.
- **Žádný legitimně externí odkaz neexistuje** (jen starý web) → každý `<a>` v odkazovém paragrafu se normalizuje na interní slug. (Kdyby v budoucnu byl pravý externí odkaz `http(s):` mimo `projekt-ikaros.com`, ponechá se plná URL — SeznamLayout `isExternal` ho vyrenderuje jako `target="_blank"`.)
- **Idempotence + rollback:** před úpravou per-stránka záloha `_migSeznamBefore = {content, menu}` (jen jednou), flag `_migSeznamMenu:true`. Stránka s flagem → skip. Rollback vrací `content`+`menu` ze zálohy.
- **Dvojform content (past z F5):** živý `content` může být **HTML** (po `fix-content-html.yml`) **nebo** TipTap JSON. Skript detekuje (`trim()[0]==='{'` → JSON, jinak HTML) a zvládne obojí. Dry-run nejdřív.
- **Heading/hr zůstávají v contentu** (menu schema je flat, nemá oddělovače). Pokud byl heading mezi odkazy, posune se nad/pod zbylý obsah — akceptováno (11 výskytů).

## Dotčené soubory

- **`.github/workflows/<nový>.yml`** + **`migration/seznam-menu-extract.js`** (BE skript, vzor F5 `migration/f5-fix.js`) — jediná produkční „změna" je datová.
- **Žádná FE změna** (SeznamLayout už menu renderuje správně).
- Reuse: `stripLegacyDomain` + remap mapa z F5 (zkopírovat do skriptu, BE nemá import z FE).

## Mimo rozsah / rizika

- ⚠️ **Propadlé menu odkazy:** SeznamLayout **nemá** broken-link detekci (na rozdíl od [`useBrokenLinks`](../../../src/features/world/pages/PageViewer/hooks/useBrokenLinks.ts) pro content). Propadlý slug v menu → klik vede na prázdnou/neexistující stránku, **bez** červeného varování. Stav ale **není horší než dnes** (odkazy jsou propadlé už teď v contentu). Doplnění broken-detekce do menu = **samostatná FE feature** (mimo rozsah). → viz Otevřené otázky.
- AKJ remap (463 slugů z `matrixAkjOwners.ts`) v menu odkazech — neřešeno, Seznam stránky míří na lokace/firmy, ne AKJ; ověřit dry-runem, případně doplnit.
- Vícenásobné odkazy slepené v jednom paragrafu (`Tchien-tin`+`Další místa`) → rozdělit na 2 menu položky.

## Test plán (mock + dry-run)

- paragraf jen s `<a>` → položka v menu, paragraf pryč z contentu.
- paragraf s úvodním textem → zůstává v contentu, do menu nejde.
- `href="/atlanta"` → menu `href:"atlanta"`; `https://www.projekt-ikaros.com/charlotte` → `charlotte`; přejmenovaný `abigail-wattson` → `abi`.
- dva `<a>` v jednom paragrafu → dvě položky.
- heading/hr → zůstává v contentu.
- prázdný content po extrakci → validní prázdný doc (74 stránek).
- idempotence: druhý běh = 0 změn (flag). rollback: vrátí původní content+menu.
- HTML i TipTap-JSON vstup → stejný výsledek.

## Rozhodnutí uživatele (2026-06-10)

1. **Prefix-seznamy** (`Kapitán: Luci`, `Zeus: Dorian`, `DOM - …`) — uživatel je „pravděpodobně zapomněl" udělat jako čisté seznamy → **brát do menu** s `label` = celý řádek. (~15 stránek, ~172 položek navíc.)
2. **Propadlé menu odkazy** — SeznamLayout nemá broken-detekci → **řešit později**, teď jen čistá data (není horší než dnes).
3. **Headingy / popisné články / `noviny`** — **ponechat v contentu** (zachování dat, ne seznamové položky).

## Výsledek (lokální dry-run na `f4a-pages.json.gz`)

- **95 / 123** Seznam stránek dostane menu, **721 položek** celkem.
- Zbylých 28: 2 popisné články (`magicke-programy`, `australska-magicka-univerzita`), 2 rulebook huby (skip), ~24 bez odkazů.
- Integrita: 0 vadných `href` (žádné `/`, starý web, whitespace), 0 prázdných labelů. Idempotence (2. běh 0 změn) + rollback (content+menu zpět) ověřeno.
- JSON i HTML vstup → identický výsledek.

## Stav
- ✅ Skript [`seznam-menu-extract.js`](../../../../Projekt-ikaros/migration/seznam-menu-extract.js) + workflow `extract-seznam-menu.yml` (BE repo) — napsáno, lokálně otestováno na reálných datech.
- ⏳ Čeká na spuštění na serveru: **dry-run → extract** (`confirm=EXTRACT`). Rollback k dispozici.
