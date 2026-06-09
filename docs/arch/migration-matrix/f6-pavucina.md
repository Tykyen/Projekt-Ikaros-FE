# F6 — Pavučina (vztahy/subjekty/příběhové linky) Matrix → Ikaros

> Migrace světa **matrix**. Kontext: [`HANDOFF.md`](./HANDOFF.md), [`index.md`](./index.md). Paměť: `project_matrix_full_migration`.
> Stav: **✅ HOTOVO — živé v newmatrix (2026-06-09).** Naimportováno **99 subjektů + 113 vztahů + 15 linek + 1 quick-note**. Vlastnictví zachováno: Tyky 201 / Willscar 11 / FOksiGen 8 / Mandloň 8 záznamů (ověřeno v dry-run, všichni 4 existují v users). Cílová feature existuje (Ikaros fáze 11.1 „Pavučina").
>
> **Soubory (BE repo):** `migration/f6-build.mjs` (build), `migration/f6-campaign.json(.gz)` (data), `migration/f6-import.js` (mongosh logika), `.github/workflows/import-matrix-campaign.yml` (3 režimy). Marker `_mig:'f6'`, upsert podle `_id` (idempotent), rollback `deleteMany({_mig:'f6'})`.
> **Úklid (PJ):** Tyky vlastní 21 bez-owner záznamů (artefakt postava→NPC) — ručně vyčistit/přerozdělit. zubni-vily = AKJ (broken proklik dokud nevznikne stránka).

## Klíčové zjištění (oprava HANDOFF předpokladu)
HANDOFF u F6 varoval: *„NEJDŘÍV ověřit, zda Ikaros FE má cílovou featuru (relationship graph). Pokud ne, je to FE feature PŘED migrací."*

**Ověřeno — feature UŽ EXISTUJE** (FE i BE, fáze 11.1):
- Route `/svet/:worldSlug/pavucina`, nav `id:'pavucina'` (skrývatelná, group `svet`).
- FE: `src/features/world/campaign/` (PavucinaGraph 2D force-graph, CampaignView 4 taby Dnes/Subjekty/Linky/Síť, typy `CampaignSubject`/`CampaignRelationship`/`CampaignStoryline`).
- BE: modul `backend/src/modules/campaign/` se 4 schématy.

→ **F6 je čistá datová migrace** (vzor F12/F7), NE FE feature. Navíc tvar Matrix kolekcí je **téměř 1:1** s Ikaros schématy → feature byla evidentně portovaná z Matrixu.

## Zdroj
`C:\Matrix\dump\MatrixDatabase\Campaign*.bson` (Node + `bson` z `backend/node_modules`). Velikosti v HANDOFF/index (52K/30K…) jsou **bajty**, ne počty dokumentů. Reálně:

| Kolekce | Docs | Ověřené hodnoty (napříč VŠEMI dokumenty) |
|---|---|---|
| `CampaignSubjects` | **99** | `type`: PC 12 / NPC 80 / FACTION 1 / LOCATION 2 / ORG 4 (vše v Ikaros enumu, žádné STATE/OTHER). `status`: vše `active`. `linkedPageSlug`: 99/99. `linkedDiarySlug`: 68. `avatarUrl`: 0. `ownerId`: 78/99. `_id`: ObjectId (24-hex). |
| `CampaignRelationships` | **113** | `status`: active 96 / dormant 17. `priority`: 1–5. `sideA/sideB`: jen `tone/behavior/gmIntent` (žádné `strength/valence/emotionTag`). `shared`: `whatHappened/behindTheScenes`. `storylineIds`: 0 neprázdných. `ownerId`: 89/113. |
| `CampaignStorylines` | **15** | `level`: micro 4 / mid 5 / macro 6. `status`: active 9 / dormant 6. `relationshipIds`: 0 neprázdných. `ownerId`: 13/15. |
| `CampaignQuickNotes` | **1** | triviální (title/body/status/pinned). |

**Integrita referencí ověřena (0 chyb):** `subjectAId/BId` → existující subjekt (0 dangling), storyline `subjectIds` → subjekt (0 dangling), žádné self-loop hrany. → reference sedí, pokud **zachováme původní `_id`**.

Tvar dokumentu (subjekt):
```
{ _id: ObjectId, type, name, avatarUrl:null, tags:[], status, linkedPageSlug, linkedDiarySlug, notes, createdAtUtc, updatedAtUtc, ownerId? }
```

## Cílový model
Modul `campaign` (BE), 4 collections. Klíčové rozdíly oproti Matrixu = **chybí `worldId`, `isShared`** + přejmenovaná pole.

| Collection | Klíčová pole (Ikaros schema) |
|---|---|
| `campaignSubjects` | `worldId:str, ownerId:str, isShared, type, name, avatarUrl?, tags[], status('active'\|'archived'), linkedPageSlug?, linkedCharacterSlug?, notes?` |
| `campaignRelationships` | `worldId, ownerId, isShared, subjectAId, subjectBId, shared{whatHappened,behindTheScenes}, sideA/sideB{tone,behavior,gmIntent,strength(def 5),valence(-3..3),emotionTag}, status('active'\|'dormant'\|'crisis'\|'closed'), priority(1-5), storylineIds[], lastChangeNote?` |
| `campaignStorylines` | `worldId, ownerId, isShared, level('macro'\|'mid'\|'micro'), title, status(active/dormant/escalating/climax/closed), phase?, summary?, whatHappened?, truth?, playersBelief?, gmIntent?, nextStep?, subjectIds[], relationshipIds[]` |
| `campaignQuickNotes` | `worldId, ownerId, isShared, title, body?, status('open'\|'done'), pinned, subjectIds[], storylineIds[]` |

**Access model (`campaign.service.resolveScope`) — určuje strategii ownerId/isShared:**
- **Hráč (Hrac)**: vidí jen `{worldId, ownerId:self}` — výhradně své. `isShared` mu nepomůže.
- **PomocnyPJ**: své + `isShared:true`.
- **PJ**: `{worldId}` — vše.

→ **Pavučina je inherentně PJ nástroj.** Migrovaná data hráči neuvidí ať nastavíme cokoli.

## Rozhodnutí (k potvrzení)
1. **`worldId` = string `"6d6174726978000000000001"`** — schéma `worldId:String`, FE posílá `world.id` jako query string (NE ObjectId-cast jako pages). Filtr `find({worldId: "<str>"})` → string === string.
2. **Zachovat majitele pavučin** (`ownerId` per záznam přes F1 user-map), **`isShared = false`.** Pavučinu vlastní **4 lidé** = hráči navázaní na své postavy: **Tyky** (PJ), **Willscar** (hráč Pumího stína/Kravena), **FOksiGen** (Kuro), **Mandloň** (Li Mingguo). Rozdělení po mapování: subjekty Tyky 84 / FOksiGen 6 / Willscar 5 / Mandloň 4; vztahy Tyky 107 / Willscar 3 / Mandloň 3; linky Tyky 10 / Willscar 3 / FOksiGen 1 / Mandloň 1.
   - **21 subjektů (+24 vztahů, +2 linky) bez majitele → Tyky.** Důvod absence ownera: artefakt z doby, kdy se postava (John Willscar) překlopila na NPC a ztratila se vazba. Skip zamítnut — bez-owner subjekty jsou **páteř grafu** (Kraven 14 vztahů, Helsing 17+3, Abi…), skip by shodil **37 vztahů**. PJ si nepatřičné ručně vyčistí.
   - **Access:** každý vidí jen své záznamy; **PJ (Tyky) vidí celý svět** bez ohledu na vlastnictví (vlastnictví ≠ viditelnost). `isShared=false` brání úniku cizích pavučin přes PomocnyPJ (JohnAdmin).
   - **Domigrovatelné:** `_id` zachované + dump nese původní `ownerId` → kdykoli lze přemapovat vlastnictví zpět (reassign workflow `_id`↔dump oldId).
3. **Zachovat původní `_id`** (insert s `_id: ObjectId(hex)`) → vnitřní reference (`subjectAId/BId`, `subjectIds`) sedí bez přemapování. FE matchne `String(subjectAId) === String(subject._id)`.
4. **`linkedCharacterSlug` = (přemapovaný) `linkedPageSlug`** pro PC/NPC (92/92 mají page slug; přesně jak FE `applyEntry` doplňuje slug postavy). `linkedDiarySlug` (slug deníku „kraven-denik") **zahodit** — v Ikarosu k ničemu.
5. **`avatarUrl` vynechat** (v dumpu 0/99) — avatar se dotahuje dynamicky přes `useSubjectImages` z prod persona/pages directory podle linkedCharacterSlug/linkedPageSlug. Žádný snapshot (vždy aktuální).
6. **`sideA/sideB` doplnit `strength:5`** (Mongoose default neplatí při raw mongosh insertu). `valence/emotionTag` vynechat (optional) → hrany neutrální barvy, střední tloušťka = věrné originálu (Matrix je neměl).

## Transformace
**Subjekt:**
| Matrix | Ikaros | Pravidlo |
|---|---|---|
| `_id` (ObjectId) | `_id` | zachovat |
| `type` | `type` | 1:1 (enum sedí) |
| `name`,`tags`,`notes`,`status` | stejné | 1:1 |
| `linkedPageSlug` | `linkedPageSlug` | **přemapovat slug-drift** (viz níže) |
| `linkedPageSlug` (PC/NPC) | `linkedCharacterSlug` | = přemapovaný page slug; jinak vynechat |
| `linkedDiarySlug` | — | zahodit |
| `avatarUrl` | — | vynechat (0 dat) |
| `createdAtUtc`/`updatedAtUtc` | `createdAt`/`updatedAt` | Date 1:1 |
| — | `worldId`,`ownerId`,`isShared` | doplnit (rozhodnutí 1,2) |
| — | `_mig` | `'f6'` (rollback marker) |

**Vztah:** `_id`,`subjectAId`,`subjectBId`,`shared`,`status`,`priority`,`storylineIds`,`lastChangeNote` 1:1; `sideA/sideB` → doplnit `strength:5`; doplnit `worldId/ownerId/isShared/_mig`; `*Utc`→`*At`.
**Storyline / QuickNote:** všechna pole 1:1; doplnit `worldId/ownerId/isShared/_mig`; `*Utc`→`*At`.

## Slug-drift (past z F7)
Stará data mají krátký slug, prod Page přejmenovaná (F7 zjistil: `kraven`→`pumi-stin`, `mingguo`→`li-mingguo`, `john`→`john-willscar`). `linkedPageSlug` proto nemusí v prod existovat → broken proklik + chybějící avatar.

→ Workflow **dry-run ověří** všech 99 `linkedPageSlug` proti prod `db.pages.find({worldId, slug})`:
- sedí → ponechat.
- nesedí → zkusit ALIAS mapu (F7) → jinak **vypsat seznam** k ruční doplnění aliasu před ostrým během.
- Subjekt s broken slugem se naimportuje tak jako tak (má správné `name`) — jen bez avataru/prokliku, dořeší alias.

## Mechanika — 2 fáze (vzor F12/F7)
### Fáze A — lokální build `migration/f6-build.mjs`
Načte 4 bson, aplikuje transformace + ALIAS mapu, výstup `migration/f6-campaign.json(.gz)` = `{subjects[], relationships[], storylines[], quickNotes[]}`. Lokálně vypíše souhrn (počty, type distribuce, kolik slugů přemapováno).

### Fáze B — workflow `import-matrix-campaign.yml` (3 režimy)
`dry-run` (default) / `import` (confirm `IMPORT`) / `rollback` (confirm `ROLLBACK`). mongosh přes SSH, world `6d6174726978000000000001`, IIFE (mongosh gotcha), **`ownerId` si nese každý záznam z buildu** (F1 map, bez-owner→Tyky); workflow ověří jen existenci Tyky jako fallback. 

Per kolekce: **upsert podle `_id`** (idempotence — re-run nepřidá duplikáty, `_id` zachované). Pořadí: subjects → relationships → storylines → quickNotes (kvůli referencím; přísně netřeba, reference jsou jen string ID).

**Dry-run nejdřív ověří** (F12 lekce — prod DB ≠ dump):
- tvar `worldId` v `pages` (string vs ObjectId) pro slug-check query.
- kolik z 99 `linkedPageSlug` sedí na prod Page (kdo nesedí → seznam pro alias).
- **všichni 4 vlastníci** (Tyky/FOksiGen/Willscar/Mandloň newId) existují v prod `users` (DRY vypíše `ownerId -> username`).
- že `campaign*` kolekce v matrix světě jsou prázdné (žádná ruční data k přepsání).

**Rollback:** smazat dokumenty kde `_mig==='f6'` ve všech 4 kolekcích.

## Mimo rozsah
- Změna FE/BE campaign feature (existuje, hotová fáze 11.1).
- `valence/emotionTag/avatarUrl` snapshot (data je nemají / dynamický resolve).
- F1 mapování původních vlastníků (rozhodnutí 2).

## Otevřené body
1. ~~Potvrdit rozhodnutí 2~~ → **potvrzeno** (ownerId=Tyky + isShared=true).
2. Alias mapa slug-driftu se finalizuje až po dry-run (jako F7). Build zatím přemapoval `kraven→pumi-stin` (jediný subjekt se slug-driftem mezi 99); dry-run „NESEDI" výpis ukáže případné další.
