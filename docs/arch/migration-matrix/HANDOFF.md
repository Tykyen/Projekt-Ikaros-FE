# HANDOFF — Migrace Matrix → Ikaros (stav 2026-06-08, po F7)

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
| F5 | Odkazy: 1a runtime rewrite + 1b broken-fix (74) + 2 auto-link (707) | `fix-matrix-links.yml` + FE hooky | `_migF5Links` |
| **F12** | **Obrázky GDrive→Cloudinary webp: 2441 stránek + 811 AKJ tabů + 3 frakce + 10 AKJ-true zachráněno** | `fix-matrix-images.yml` | `_migF12` |
| **F7** | **Kalendáře: 1205 událostí na 21 entit (calendar subdoc, ISO→FantasyDate). + oprava 497 lokací: lokační Character + characterRef + prázdný calendar (možnost kalendáře)** | `fix-location-characters.yml` → `import-matrix-calendars.yml` | `_mig:f7` / `_mig:f7loc` |

✅ **Kritické opravy #1 (worldId), #2 (content HTML), #3 (membership) SPUŠTĚNY 2026-06-08** → data živá a správná.

### F12 detail (hotovo 2026-06-08)
- Skripty: `migration/f12-upload.mjs` (fáze A upload, `--use-system-ca` + Cloudinary 10MB fallback na GDrive thumbnail), `migration/f12-images.js` (fáze B), mapa `migration/f12-map.json.gz` (3409 obrázků). Spec [`f12-images.md`](./f12-images.md). Paměť `project_matrix_f12_images`.
- **Zdroj pravdy = produkční DB, ne raw** (raw 3402 ≠ DB 2441). Fáze B cílí tvar `imageUrl`, ne `_mig` marker.
- ⚠️ **Zbývá ruční úklid (33):** `mapa-sveta` + 32 AKJ „true" (lokační „Utajený archiv") — `imageUrl="true"` bez GDrive ID nikde. Seznam `migration/f12-zbyva-rucne.txt`. Vč. `rodokmen-madregal`.
- Workflow má i `dump` režim → CSV soupis všech stránek matrix světa jako artifact (`matrix-stranky-csv`).

## ZBÝVÁ 🔜
**Drobné dorovnání (rychlé):**
- **F4d vizuální ověření** (jen kontrola, naimportováno): AKJ záložky na postavách + 193 leak stránek zacelené (veřejně stub). Ověřit `db.pages_mig_trash_f4d.countDocuments()` == 193.
- **Propadlé subdocy (2):** `poznamky-mingguo`→character_notes(li-mingguo), `vybava-edmund`→Edmund (NPC?). Audit `C:\tmp\f4-subdoc-propadle.js`.
- **F12 ruční úklid (33):** `mapa-sveta` + 32 AKJ „true" (`migration/f12-zbyva-rucne.txt`) — uživatel řeší ručně.

**Hlavní zbývající F body (každý = vlastní spec → souhlas → impl, vzor F12):**
| F | Co | Zdrojové kolekce (dump) | Cílový Ikaros model | Pozn. |
|---|---|---|---|---|
| **F6** | Pavučina (vztahy/subjekty/příběhové linky) | `CampaignRelationships` (52K), `CampaignSubjects` (30K), `CampaignStorylines` (8K), `CampaignQuickNotes` (271B) | ? (ověřit zda Ikaros má ekvivalent — relationship graph / PJ nástroj) | **Nejdřív zjistit cílovou featuru** — možná chybí na FE, pak je to FE feature + migrace |
| ~~F7~~ ✅ | ~~Kalendáře~~ HOTOVO — viz tabulka HOTOVO výše. **Pozor revize:** `Calenders` byly per-entita **události**, ne definice kalendářů → calendar subdoc, ne presety. | — | — | spec [`f7-calendars.md`](./f7-calendars.md) |
| **F8** | Timeline + zvuky | `TimelineEvents` (17K), `sounds` (3K) | Timeline (spec 9.3) + zvuky (?) | Timeline má calendar binding (`timelineCalendarSlug`). ⚠️ Lekce z F7: ověř tvar dat v dumpu DŘÍV než věříš popisu — `TimelineEvents` můžou být taky jiné, než HANDOFF čeká |
| **F9** | Herní akce | `GameEvents` (9.8M!) | `GameEvent` modul (spec 9.1-I archive policy) | Velký objem; archive policy cut-off 24h |
| **F10** | Obchod | z `Pages` (`DO_OBCHODU` sloupec v `f2-klasifikace.csv`) | Obchod/inventář (?) | Žádná samostatná kolekce — položky jsou stránky označené v klasifikaci |
| **F11** | Chat | `ChatMessages` (**25M**), `ChatChannels` (10K), `chatGroups` (1K), `ChannelReadStatuses` (35K), `CustomEmotes` (172B) | Chat (ChatGroup/ChatChannel, spec 6.x) | Největší objem; mapovat staré kanály/skupiny + 1506 zpráv |
| **(?)** | Novinky / Taktické mapy | `News` (5K), `MapScenes` (40K), `MapTemplates` (14K) | News / taktická mapa (10.2) | Ověřit, zda v rozsahu migrace nebo skip |

**Mimo migraci (neřešit):** `PageEmbeddings` (150M — search se reindexuje), `NpcTemplates` (zrušeno→Bestie), `PushSubscriptions`, `SearchStats`, `IkarosMessages`.

## Závazná pravidla / gotchas
- **`Page.slug === Character.slug`**. Subdoc kolekce keyed `characterId`.
- Klasifikace = CSV `kategorie`/`podtyp`; vazby = `vlastnik_cil`. Rename: jméno změň, slug/klíč nech (Zara Hawke→`zara`).
- **24 char = 20 hráčů** (4 přezdívky-dup smazány v cleanupu). Párování PC: jen na 20 kanonických, klíče vlastnik_cil→titul→slug + reverse-rename + diakritika-fold.
- **Skupiny/frakce** = seznamové stránky (Evropani/Lumíci/MI6), členové v `plainText`/odkazech, znak v `imageUrl`. 5 hráčů bez frakce (sion/pythia/jorgen/da-shi/archie).
- **Práva:** staré `{type:1}`=AKJ clearance, `{type:0}`=UserId(→F1 mapa), `{type:2}`=Role. Role mapování: Player+User→Hráč(2), PJ→PJ(5), Korektor→Korektor(3), JohnAdmin→PomocnyPJ(4). WorldRole enum: Zadatel0/Ctenar1/Hrac2/Korektor3/PomocnyPJ4/PJ5.
- **AKJ access** = OR (`shieldedFromRequirements`): clearance NEBO grant NEBO vlastník(ownerHidden:false) NEBO PJ.
- **Archie** = volná postava (starý deník na účtu „Test"), bez hráče.

## První akce v nové konverzaci
**Hotovo:** F1, F3, F4a-d, F5 (odkazy), F12 (obrázky), **F7 (kalendáře, 2026-06-08)** — vše živé v newmatrix. 3 kritické opravy spuštěny 2026-06-08.

**Doporučené pořadí dalších F bodů** (od nejjednoduššího/nejmenšího po největší):
1. **F8 timeline+zvuky** (`TimelineEvents` 17K, `sounds` 3K) — navázat na Timeline (spec 9.3, `timelineCalendarSlug`). ⚠️ Vzor F7: nejdřív ověř TVAR dat v dumpu (Node+bson), ne popis.
2. **F6 Pavučina** — ⚠️ NEJDŘÍV ověřit, zda Ikaros FE má cílovou featuru (relationship graph). Pokud ne, je to FE feature (frontend-design + spec) PŘED migrací dat.
3. **F9 akce** (GameEvents 9.8M) → **F11 chat** (25M, největší) — objemné, nechat nakonec.
4. **F10 obchod** — závislé na tom, zda Ikaros má obchod modul.

**Postup pro každý F bod (vzor F12, OSVĚDČENO):**
1. Prozkoumat zdrojovou kolekci (Node + `bson` z `backend/node_modules`, dump `C:\Matrix\dump\MatrixDatabase`).
2. Zjistit cílový Ikaros model (existuje feature? schéma?) — pokud chybí FE feature, řeš ji první.
3. Spec → souhlas → impl plán → souhlas → workflow (`migration/fXX-*.js` + `.github/workflows/*.yml`, 3-4 režimy).
4. Lokální mock test logiky → commit+push (já) → dry-run → ostře (uživatel) → ověření naživo.

⚠️ **Klíčová lekce z F12:** **produkční DB ≠ zdrojový dump/raw** (část se nenaimportovala, část má jiná data). Vždy přidat `dump`/diag režim do workflow a cílit podle reálného stavu DB, ne podle lokálních dat. AKJ a subdokumenty mají vlastní pole (snadno opomenout).
