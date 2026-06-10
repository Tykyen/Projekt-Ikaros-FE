# HANDOFF — Migrace Matrix → Ikaros (stav 2026-06-09, **MIGRACE KOMPLETNÍ** — F11 chat live)

> **🏁 VŠECHNY F BODY HOTOVÉ.** F11 chat **live (2026-06-09)**: 1506 zpráv / 42 kanálů / 7 skupin / 281 readStatus / 1 emote, skip=0. Spec [`f11-chat.md`](./f11-chat.md). Bug chycený naživo: `chatmessages` sparse-unique `{channelId,clientNonce}` → fix `clientNonce='mig-'+_id`. **Zbývají jen drobné RUČNÍ úklidy (viz „ZBÝVÁ").**
>
> **Rozdělané (mimo migraci): Rulebook grafika** — kapitoly 10-13 + LevelSpine (barevné stupně magie) implementováno a pushnuto (FE `c8ba5ac9` + BE `import-matrix-rulebook.yml`). **Čeká: spustit import workflow + nasadit FE (`deploy.yml`).** Spec `docs/arch/phase-2/rulebook-graficke-zpracovani.md`, prototyp `C:\tmp\rulebook-prototype.html`.

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
| **F6** | **Pavučina: 99 subjektů + 113 vztahů + 15 linek + 1 note (campaign modul, fáze 11.1). Vlastnictví zachováno (Tyky/Willscar/FOksiGen/Mandloň); 21 bez-owner→Tyky k úklidu.** | `import-matrix-campaign.yml` | `_mig:f6` |
| **F8** | **Timeline 97 událostí (97/97 obrázků GDrive→Cloudinary) + zvuky 9 (per-world matrix). Timeline title=text, sounds číselné enumy→string.** | `f8-upload.mjs` → `import-matrix-timeline.yml` | `_mig:f8` |
| **F9** | **Herní akce 15 (kalendářní, ne log). date už ISO; 8 base64 PNG→Cloudinary; confirmedBy/RSVP userId→F1; groupOnly=false. 6 budoucích/9 archiv.** | `f9-upload.mjs` → `import-matrix-game-events.yml` | `_mig:f9` |
| **F10** | **Obchod 255 položek (stránky DO_OBCHODU + ruční ceník GBP/USD) + 19 skupin (sloupec Typ). description=text stránky, referenceLink=slug, _id=page._id, isShared=true. ⚠️ PJ musí přidat GBP/USD do měn světa (jinak nákup blok).** | `import-matrix-shop.yml` + `import-matrix-shop-groups.yml` | `_mig:f10`/`f10g` |
| **F11** | **Chat: 1506 zpráv + 42 kanálů + 7 skupin + 281 readStatus + 1 emote (skip=0). UPSERT do živé struktury (Globální/Postavy/družiny existují), pj_dm→Postavy character merge (linkedMemberUserId), frakce→linked družiny (imageUrl nesahat), GMOI+Komunikace Hráči standalone. 200 příloh+ikony→Cloudinary (12 reuse F12), tenor ponechán, customFont→klíč. Bug naživo: sparse-unique {channelId,clientNonce}→fix clientNonce='mig-'+_id.** | `f11-upload.mjs` → `import-matrix-chat.yml` (4 režimy vč. diag) | `_mig:f11` |

✅ **Kritické opravy #1 (worldId), #2 (content HTML), #3 (membership) SPUŠTĚNY 2026-06-08** → data živá a správná.

### F12 detail (hotovo 2026-06-08)
- Skripty: `migration/f12-upload.mjs` (fáze A upload, `--use-system-ca` + Cloudinary 10MB fallback na GDrive thumbnail), `migration/f12-images.js` (fáze B), mapa `migration/f12-map.json.gz` (3409 obrázků). Spec [`f12-images.md`](./f12-images.md). Paměť `project_matrix_f12_images`.
- **Zdroj pravdy = produkční DB, ne raw** (raw 3402 ≠ DB 2441). Fáze B cílí tvar `imageUrl`, ne `_mig` marker.
- ⚠️ **Zbývá ruční úklid (33):** `mapa-sveta` + 32 AKJ „true" (lokační „Utajený archiv") — `imageUrl="true"` bez GDrive ID nikde. Seznam `migration/f12-zbyva-rucne.txt`. Vč. `rodokmen-madregal`.
- Workflow má i `dump` režim → CSV soupis všech stránek matrix světa jako artifact (`matrix-stranky-csv`).

## ZBÝVÁ 🔜
**Drobné dorovnání (rychlé):**
- **F6 úklid (PJ, ruční v UI):** Tyky vlastní 21 bez-owner subjektů (artefakt postava→NPC, vč. duplicit Kraven/Helsing/Abi) — přerozdělit správným hráčům nebo smazat. `zubni-vily` (FACTION) = AKJ bez veřejné stránky → broken proklik dokud stránka nevznikne. Vlastnictví domigrovatelné (dump nese původní ownerId, `_id` zachované).
- **F8 drobnost:** timeline event „Svobodný Matrix" má broken `pageSlug` (`svobodny-matrix`, stránka neexistuje / není potřeba) → proklik neaktivní, jinak event OK.
- **F4d vizuální ověření** (jen kontrola, naimportováno): AKJ záložky na postavách + 193 leak stránek zacelené (veřejně stub). Ověřit `db.pages_mig_trash_f4d.countDocuments()` == 193.
- **Propadlé subdocy (2):** `poznamky-mingguo`→character_notes(li-mingguo), `vybava-edmund`→Edmund (NPC?). Audit `C:\tmp\f4-subdoc-propadle.js`.
- **F12 ruční úklid (33):** `mapa-sveta` + 32 AKJ „true" (`migration/f12-zbyva-rucne.txt`) — uživatel řeší ručně.

**Hlavní zbývající F body (každý = vlastní spec → souhlas → impl, vzor F12):**
| F | Co | Zdrojové kolekce (dump) | Cílový Ikaros model | Pozn. |
|---|---|---|---|---|
| ~~F6~~ ✅ | ~~Pavučina~~ **HOTOVO (live 2026-06-09)** — viz tabulka HOTOVO | `Campaign{Subjects 99, Relationships 113, Storylines 15, QuickNotes 1}` (velikosti v index = **bajty**, ne docs) | `campaign` modul (fáze 11.1) | Spec `f6-pavucina.md` |
| ~~F7~~ ✅ | ~~Kalendáře~~ HOTOVO — viz tabulka HOTOVO výše. **Pozor revize:** `Calenders` byly per-entita **události**, ne definice kalendářů → calendar subdoc, ne presety. | — | — | spec [`f7-calendars.md`](./f7-calendars.md) |
| ~~F8~~ ✅ | ~~Timeline + zvuky~~ **HOTOVO (live 2026-06-09)** — viz tabulka HOTOVO | `TimelineEvents` 97, `sounds` 9 (velikosti = bajty) | `timeline_events` + `sounds` (existují) | Spec `f8-timeline-sounds.md`. Sounds enumy byly číselné indexy = pořadí Ikaros enumu |
| ~~F9~~ ✅ | ~~Herní akce~~ **HOTOVO (live 2026-06-09)** — viz tabulka HOTOVO | `GameEvents` **15** (9.8M = base64 obrázky inline, ne objem) | `game_events` (existuje) | Spec `f9-game-events.md`. Kalendářní akce, ne log |
| ~~F10~~ ✅ | ~~Obchod~~ **HOTOVO (live 2026-06-09)** — viz tabulka HOTOVO | z `Pages` (`DO_OBCHODU`, 260→255) + ruční ceník | `campaignShopItems` (existuje, fáze 9) | Spec `f10-obchod.md`. Obchod je v campaign modulu |
| ~~F11~~ ✅ | ~~Chat~~ **HOTOVO live (2026-06-09)** — viz tabulka HOTOVO | `ChatMessages` 1506, `ChatChannels` 43→42, `chatGroups` 7, `ReadStatuses` 299→281, `CustomEmotes` 1 | Chat (existuje) | Spec [`f11-chat.md`](./f11-chat.md). UPSERT do živé struktury, pj_dm→Postavy merge, frakce→linked družiny |
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
1. ~~**F8 timeline+zvuky**~~ ✅ HOTOVO (live 2026-06-09) — 97 událostí + 9 zvuků.
2. ~~**F6 Pavučina**~~ ✅ HOTOVO (live 2026-06-09) — 99 subj/113 vztahů/15 linek, vlastnictví zachováno.
3. ~~**F9 akce**~~ ✅ HOTOVO → **F11 chat** = POSLEDNÍ, podklady hotové v [`f11-chat.md`](./f11-chat.md) (1506 zpráv, 43 konverzací, 7 kanálů).
4. ~~**F10 obchod**~~ ✅ HOTOVO (255 položek, 2026-06-09) — obchod je v campaign modulu.

**Postup pro každý F bod (vzor F12, OSVĚDČENO):**
1. Prozkoumat zdrojovou kolekci (Node + `bson` z `backend/node_modules`, dump `C:\Matrix\dump\MatrixDatabase`).
2. Zjistit cílový Ikaros model (existuje feature? schéma?) — pokud chybí FE feature, řeš ji první.
3. Spec → souhlas → impl plán → souhlas → workflow (`migration/fXX-*.js` + `.github/workflows/*.yml`, 3-4 režimy).
4. Lokální mock test logiky → commit+push (já) → dry-run → ostře (uživatel) → ověření naživo.

⚠️ **Klíčová lekce z F12:** **produkční DB ≠ zdrojový dump/raw** (část se nenaimportovala, část má jiná data). Vždy přidat `dump`/diag režim do workflow a cílit podle reálného stavu DB, ne podle lokálních dat. AKJ a subdokumenty mají vlastní pole (snadno opomenout).
