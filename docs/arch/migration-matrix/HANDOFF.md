# HANDOFF — Migrace Matrix → Ikaros (stav 2026-06-08)

> **Start here pro novou konverzaci.** Plný plán: [`index.md`](./index.md). Dílčí specy: [`f4b2-pc-pages.md`](./f4b2-pc-pages.md), [`f4d-akj-tabs.md`](./f4d-akj-tabs.md). Paměť: `project_matrix_full_migration.md`.
> Přečti tenhle soubor celý, pak pokračuj podle „🔴 KRITICKÉ" → „ZBÝVÁ".

## Co to je
Jednorázová **transformační** migrace obsahu ze starého .NET Matrixu do Ikaros světa `matrix` na **newmatrix**. NE kopie — staré ploché jednosvětové schéma → Ikaros world-scoped.

## Prostředí (klíčové cesty)
- **Zdrojový dump:** `C:\Matrix\dump\MatrixDatabase` (28 kolekcí, čteno **Node + balík `bson` z `backend/node_modules`**, NE mongorestore).
- **Cíl:** Ikaros `https://newmatrix.patrikzplzne.cz` = server `oak.server.leafhost.cz:11122`, `/opt/projekt-ikaros-be`, mongo container `mongo`, DB `ikaros`, replicaSet `rs0`. URL světa = `/svet/matrix` (slug routing). ⚠️ **Starý Matrix běží pro hráče na `https://www.projekt-ikaros.com` — NESAHAT.**
- **BE repo** (import workflowy + data): `Tykyen/Projekt-ikaros` = `C:\Matrix\ProjektIkaros\Projekt-ikaros`. **FE repo** (spec/docs): `Tykyen/Projekt-Ikaros-FE` = pracovní adresář.
- **Ručně revidovaná klasifikace:** `C:\Users\arafo\Downloads\f2-klasifikace.csv` (3625 ř., `slug;titul;kategorie;podtyp;vlastnik_cil;clearance;…;DO_OBCHODU;…;POZNAMKA`). **Pravda pro kategorie/vazby.** Robustní CSV parser (pole mají `;` a `\n`).
- **Generátory + mapy:** `C:\tmp\f*.js`, `C:\tmp\f1-user-map.json`, `C:\tmp\f3-characters.json`, `C:\tmp\f-groups.json`, `C:\tmp\f-membership.json`. Konvertor TipTap→HTML: `C:\tmp\tiptap2html.js` (+ mongosh verze `Projekt-ikaros/migration/tiptap2html-mongo.js`).

## ⚠️ KRITICKÉ TECHNICKÉ POZNATKY (jinak rozbiješ data)
1. **`worldId` = ObjectId `6d6174726978000000000001`** (= „matrix" v hexu, ze seedu `matrix-world.seed.ts`), **NE slug „matrix"**! Ikaros dělá `new Types.ObjectId(worldId)` (emotes/počasí) → slug „matrix" crashne. Migrace omylem sypala slug → **fix-matrix-world to přemapovává**. Všechny BUDOUCÍ workflow musí používat ObjectId.
2. **`Page.content` = HTML**, NE TipTap JSON! `RichTextEditor`/`AutoTOC` čekají HTML; JSON string se vykreslí doslova. Stará `paragraphs` (TipTap JSON) → konvertuj `tiptapToHtml()`. Konvertor pokrývá node/mark typy v datech (doc/paragraph/heading/lists/hr/blockquote + bold/italic/underline/link/textStyle/fontSize).
3. **mongosh vyhodnocuje skript PO PŘÍKAZECH** → top-level `if(){}else{}` přes víc echo řádků se rozbije (`else{` osiří). **Obal logiku do IIFE** `(function(){ … })();`.
4. **Kolekce:** `worldmemberships`, `worldsettings` (jedno slovo!), `pages`, `characters`. NE `world_memberships`.
5. **mongosh `updateMany` není atomický** — unique-index kolize (E11000) ho zastaví uprostřed → částečný stav. Před přemapováním řešit kolize (dedup).
6. **`characterPath`** (membership) = slug postavy = napojení hráč→postava. `membership.group` = frakce.

## Mechanika importu (vzor)
GitHub Actions workflow v BE repu `.github/workflows/*.yml`:
- 3 režimy: `dry-run` (default), `import`/`fix` (confirm `IMPORT`/`FIX`), `rollback` (confirm `ROLLBACK`).
- Data **gzip** v `migration/*.json.gz`, `gunzip -c` → mongosh přes `ssh … docker compose exec -T mongo mongosh '…ikaros?replicaSet=rs0' --quiet`.
- **Idempotentní**, tag `_mig:'fXX'` → rollback. **Workflow commituju+pushuju já, spouští uživatel ručně** (dry-run → ověřit číslo → ostře).
- **Vždy lokálně ověřit** mock běh (in-memory `db`). ⚠️ Bash classifier občas vypadne → retry / `dangerouslyDisableSandbox:true`.

## 🔴 KRITICKÉ OPRAVY — workflow HOTOVÉ, ČEKAJÍ SPUŠTĚNÍ uživatelem
Odhaleno při kontrole světa (svět se nezobrazoval, text byl syrový JSON, žádní hráči). **Spustit v pořadí:**
| # | Workflow | režim | Co opraví |
|---|---|---|---|
| 1 | `fix-matrix-world.yml` | `fix`/FIX | worldId slug→ObjectId (2781 pages + 1115 chars) + Tyky PJ membership + dedup kolize `pravidla`. ⚠️ Předchozí běh proběhl ČÁSTEČNĚ (1605/2781 pages, membership ✓) — opravený workflow (IIFE+dedup) dorovná zbytek. |
| 2 | `fix-content-html.yml` | `fix`/FIX | content TipTap JSON→HTML, 2324 stránek (dry-run potvrzen, vzorek summit-v-nice OK). Záloha `_migContentJson`. |
| 3 | `import-matrix-membership.yml` | `import`/IMPORT | 22 členů (Tyky PJ, JohnAdmin PomocnyPJ, 20 hráčů Korektor) + characterPath (19) + 3 frakce (Evropani/Lumíci/MI6, 15 hráčů, znaky GDrive→F12) do worldsettings. |

## HOTOVO ✅ (živé v newmatrix)
| Fáze | Co | Workflow | tag |
|---|---|---|---|
| F1 | Účty 24 | export-ikaros-users | — |
| F3 | Postavy 943 (24 PC/919 NPC) | `import-matrix-characters.yml` | `_mig:f3` |
| F4a | Lore stránky 1643 | `import-matrix-pages.yml` | `_mig:f4a` |
| F4b | NPC stránky 1075 | `import-matrix-npc.yml` | `_mig:f4b` |
| F4c | PC subdocs 49 | `import-matrix-subdocs.yml` | `_mig:f4c` |
| F4-cleanup | smazáno 7 (dup karty + Lotri/Myra mis-import) | `cleanup-matrix-dupes.yml` | trash |
| F4b-2 | PC veřejné stránky 20 | `import-matrix-pc-pages.yml` | `_mig:f4b2` |
| F4d | AKJ záložky 925 (45 stub, 193 leak-convert, bez cíle 0) | `import-matrix-akj.yml` | `_mig:f4d` |

✅ **Kritické opravy #1 (worldId), #2 (content HTML), #3 (membership) SPUŠTĚNY 2026-06-08** → data živá a správná.

## ZBÝVÁ 🔜
0. **F4d ✅ NAIMPORTOVÁNO 2026-06-08** (`IMPORT HOTOVO: zalozek 925, stub-novy 45, leak-convert 193, zaloh 0, bez cile 0`). worldId oprava potvrzena (bez cíle 0). ⚠️ **„zaloh 0" = import běžel vícekrát** (1. běh zálohoval 193 do `pages_mig_trash_f4d`, další běhy 0 = idempotence). Pokud by to byl jediný běh, originály leak stránek by NEbyly zazálohované — ověřit `db.pages_mig_trash_f4d.countDocuments()` == 193 (fallback záloha existuje i v `_migContentJson` z opravy #2). **OVĚŘIT vizuálně:** AKJ záložky na postavách + 193 leak stránek zacelené (veřejně jen stub). Generátor+workflow viz commit BE `095afc2`.
2. **Propadlé subdocy (2):** `poznamky-mingguo`→character_notes(li-mingguo), `vybava-edmund`→Edmund (NPC?). Audit `C:\tmp\f4-subdoc-propadle.js`.
3. **F5 — Odkazy** (spec [`f5-links.md`](./f5-links.md)). Stav:
   - ✅ **1a runtime rewrite** (FE hook `useBrokenLinks`): interní odkazy (holý slug / `/slug`) → world-scoped `/svet/matrix/<slug>` + SPA navigace; externí nedotčené; neexistující červené. Build OK, 8/8 testů. (FE commit)
   - ✅ **1b broken-fix** (`fix-matrix-links.yml`): SPUŠTĚNO 2026-06-08 → `FIX HOTOVO: stranek 46, odkazu prepsano 74` (14 mapování `abigail-wattson`→`abi`…, ze 76 reálně 74 — 2 v cleanup-smazaných stránkách). Záloha `_migF5Before`, rollback dostupný. Audit: 531 broken (3,7 %), z toho ~261 pravidla→Pravidlová kniha, ~157 long-tail ponecháno červené.
   - 🔜 **2 auto-link** vlastních jmen (jen existující cíle). ⚠️ audit: naivní přesný match nebezpečný (`Nebo`=spojka 1468×) → nutný filtr na vlastní jména.
4. **F12 — Obrázky:** `imageUrl`/`bigImage`/znaky frakcí = **GDrive ID** → rehost Cloudinary (webp). Vzhled/Mapa karty zůstávají; mapy→Atlas.
5. **F6** Pavučina, **F7** kalendáře, **F8** timeline(97)+zvuky(9), **F9** akce(GameEvents 15), **F10** obchod, **F11** chat (ChatMessages 1506/Channels 43/chatGroups 7).

## Závazná pravidla / gotchas
- **`Page.slug === Character.slug`**. Subdoc kolekce keyed `characterId`.
- Klasifikace = CSV `kategorie`/`podtyp`; vazby = `vlastnik_cil`. Rename: jméno změň, slug/klíč nech (Zara Hawke→`zara`).
- **24 char = 20 hráčů** (4 přezdívky-dup smazány v cleanupu). Párování PC: jen na 20 kanonických, klíče vlastnik_cil→titul→slug + reverse-rename + diakritika-fold.
- **Skupiny/frakce** = seznamové stránky (Evropani/Lumíci/MI6), členové v `plainText`/odkazech, znak v `imageUrl`. 5 hráčů bez frakce (sion/pythia/jorgen/da-shi/archie).
- **Práva:** staré `{type:1}`=AKJ clearance, `{type:0}`=UserId(→F1 mapa), `{type:2}`=Role. Role mapování: Player+User→Hráč(2), PJ→PJ(5), Korektor→Korektor(3), JohnAdmin→PomocnyPJ(4). WorldRole enum: Zadatel0/Ctenar1/Hrac2/Korektor3/PomocnyPJ4/PJ5.
- **AKJ access** = OR (`shieldedFromRequirements`): clearance NEBO grant NEBO vlastník(ownerHidden:false) NEBO PJ.
- **Archie** = volná postava (starý deník na účtu „Test"), bez hráče.

## První akce v nové konverzaci
1. ✅ **3 kritické opravy spuštěny uživatelem** (#1 fix-world, #2 content-html, #3 membership) — potvrzeno 2026-06-08.
2. ✅ **F4d naimportováno** (viz ZBÝVÁ #0). **DALŠÍ AKCE: vizuální ověření světa** (AKJ záložky + leak stránky) + potvrdit zálohu `pages_mig_trash_f4d`.
3. Pak propadlé subdocy (2) → F5 → F12 → F6-F11.
