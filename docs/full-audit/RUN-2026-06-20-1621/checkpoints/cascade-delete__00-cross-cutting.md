# cascade-delete / 00-cross-cutting — checkpoint RUN-2026-06-20-1621

## Pokrytí

Přečteno: `cascade-delete-plan/00-cross-cutting.md`, `cascade-delete-plan/README.md`, `cascade-delete-audit.md`
(stav CD-01..09 + CD-RUN-1..4b).

Prohledaný kód (HEAD):
- `world-hard-delete.service.ts` — WORLD_SCOPED_COLLECTIONS + CHARACTER_KEYED_COLLECTIONS
- `world-cleanup.cron.ts`
- `upload.service.ts` — @OnEvent handlery
- `emotes/emotes.service.ts` — per-emote delete + blob
- `world-maps/world-maps.service.ts` — world-map entry/folder delete + blob
- `maps/maps.service.ts` — deleteScene + blob cleanup
- `maps/operations/map-operations.service.ts` — scene.image op
- `chat/chat.service.ts` — deleteGroup blob
- `bestiae/bestiae.service.ts` — softDelete bez blob
- `pages/pages.service.ts` — delete path (post CD-01 fix)
- Všechny `**/*.schema.ts` — audit worldId pokrytí vs WORLD_SCOPED_COLLECTIONS

M-GRAPH: schémata zkontrolována ručně. M-SCAN/M-BLOB: NEPROVEDENO (vyžaduje +db).

---

## Dosažená L vs cílová L

| Oblast | Dosažená L | Cílová L | Pozn. |
|---|---|---|---|
| OR (orphan child kolekcí) | **L2** | L2+ | 4 kolekce chybí v cascade listu |
| DR (dangling refs) | **L2** | L3+ | channelreadstatus dangling na channelId |
| EX (blob leak) | **L2** | L3+ | emotes+membership+map-scene+chatgroup+bestie blobs při world hard-delete |
| CC (cascade úplnost) | **L2** | L2+ | delete skupina nečistí blob |
| TX (atomicita) | **L2** | L2 | beze změny — CD-06 self-heal platí |
| SH (soft/hard) | **L2** | L2 | beze změny |
| GD (GDPR) | **L2** | L2 | K-CD10 ověřen — beze změny |
| OC (over-cascade) | **L2** | L2 | CD-05 mitigováno — beze změny |

L4 (orphan-scan real DB) neprovedeno napříč — čeká `+db`.

---

## Nálezy

### CD-RUN-5 🟠 `OR` — `worldMapEntries` + `worldMapFolders` chybí v WORLD_SCOPED_COLLECTIONS 🆕

- **Kde:** `world-hard-delete.service.ts:12–62` — WORLD_SCOPED_COLLECTIONS obsahuje `'worldMaps'` (legacy embedded schema, migrovaná pryč v 13.4b), ale **nikoli** `'worldMapEntries'` ani `'worldMapFolders'` (aktuální kolekce od 13.4b).
- **Schemas:** `world-map-entry.schema.ts:13` `@Schema({ collection: 'worldMapEntries' })`, `world-map-folder.schema.ts:12` `@Schema({ collection: 'worldMapFolders' })`.
- **Co zůstane:** po hard-delete světa zůstanou v DB všechny záznamy map atlasu (`worldMapEntries`) a jejich složkové stromy (`worldMapFolders`) → orphan data, plus jejich `imageUrl` bloby leakují (double `EX`+`OR`).
- **Dopad:** úložiště DB roste; bloby na Cloudinary zůstanou navždy. Svět s 100 mapami = 100 orphan docs + 100 bloby.
- **Vratné?** Orphan docs ano (skript smaže dle `worldId`). Bloby ne (URL pryč s docs).
- **Návrh:** přidat `'worldMapEntries'` a `'worldMapFolders'` do WORLD_SCOPED_COLLECTIONS. Pro blob cleanup: před `deleteMany` iterovat a sbírat `imageUrl` → batch `media.orphaned`.

---

### CD-RUN-6 🟡 `OR` — `diary_schema_versions` chybí v WORLD_SCOPED_COLLECTIONS 🆕

- **Kde:** `world-hard-delete.service.ts:12–62` — kolekce `diary_schema_versions` (schema `diary-schema-versions.schema.ts:8` `@Prop({ required: true }) worldId`) není v WORLD_SCOPED_COLLECTIONS.
- **Co zůstane:** per-svět verze deníkových schémat zůstanou po hard-delete světa jako orphan dokumenty.
- **Dopad:** nízký datový leak (schema metadata, ne uživatelský obsah). Bez přímého funkčního dopadu, ale DB entropie.
- **Vratné?** Ano (skript).
- **Návrh:** přidat `'diary_schema_versions'` do WORLD_SCOPED_COLLECTIONS.

---

### CD-RUN-7 🟠 `EX` — custom_emote image blobs leakují při world hard-delete 🆕

- **Kde:** `world-hard-delete.service.ts:117` — `safeDelete('custom_emotes', { worldId })` smaže DB docs, ale **nečte** `imageUrl` před smazáním → žádné `media.orphaned` / `world.image.removed` event pro emoty. Per-emote cesty (`emotes.service.ts:162–189`) mají blob cleanup, ale ta z `WorldHardDeleteService` ne.
- **Co zůstane:** Cloudinary bloby všech custom emotes světa — navždy.
- **Dopad:** Placeném úložiště (cena/emote nízká, ale svět s 50+ emoty = netriviální akumulace v čase).
- **Vratné?** Ne.
- **Návrh:** v `hardDelete()` před `safeDelete('custom_emotes', ...)` načíst `imageUrl` celé kolekce pro daný svět → batch `media.orphaned`. Nebo přidat `@OnEvent('world.hardDeleted')` listener v EmotesService s bulk cleanup.

---

### CD-RUN-8 🟠 `EX` — worldmembership avatar blobs leakují při world hard-delete 🆕

- **Kde:** `world-hard-delete.service.ts:117` — `safeDelete('worldmemberships', { worldId })` smaže docs, ale nepodchycuje `avatarUrl` ani `pjPersonaAvatarUrl` (schema `world-membership.schema.ts:15,23`). CD-02 fix pokryl pouze individuální delete postavy přes `character.deleted` event, ne hard-delete celého světa.
- **Co zůstane:** avatar blob každého člena světa + PJ persona avatar zůstanou na Cloudinary.
- **Dopad:** větší světy s desítkami členů = desítky orphan avatarů.
- **Vratné?** Ne.
- **Návrh:** v `hardDelete()` před `safeDelete('worldmemberships', ...)` načíst `avatarUrl` + `pjPersonaAvatarUrl` a emitovat batch `media.orphaned`.

---

### CD-RUN-9 🟠 `EX` — mapScene.imageUrl blobs leakují při world hard-delete 🆕

- **Kde:** `world-hard-delete.service.ts:39` — `safeDelete('mapScenes', { worldId })` smaže docs bez blob cleanup. Individuální `maps.service.ts:339` emituje `media.orphaned` pro `scene.imageUrl`, ale to world cascade obchází.
- **Co zůstane:** Cloudinary blob pozadí každé scény světa.
- **Dopad:** mapy s detailním pozadím (velké soubory) → storage leak.
- **Vratné?** Ne.
- **Návrh:** stejný vzor — před `safeDelete('mapScenes', ...)` batch collect `imageUrl` → `media.orphaned`.

---

### CD-RUN-10 🟡 `EX` — chatgroup.imageUrl blob leak při world hard-delete a při deleteGroup 🆕

- **Kde (world hard-delete):** `world-hard-delete.service.ts:34` — `safeDelete('chatgroups', { worldId })` nečistí blob.
- **Kde (deleteGroup):** `chat.service.ts:419–451` — `deleteGroup` smaže docs + eventy, ale **žádné `media.orphaned`** pro `group.imageUrl`. Pouze update cesta (`chat.service.ts:410`) čistí při výměně.
- **Co zůstane:** Cloudinary blob emblému kanálu.
- **Dopad:** nízký (ne každý kanál má emblem), ale systematický gap.
- **Vratné?** Ne.
- **Návrh:** `deleteGroup` → emit `media.orphaned` pokud `group.imageUrl`; world cascade → batch collect.

---

### CD-RUN-11 🟡 `OR` — `channelreadstatus` orphan po world hard-delete 🆕

- **Kde:** `world-hard-delete.service.ts:12–62` — `channelreadstatus` kolekce (schema `channel-read-status.schema.ts:7`) je keyed na `channelId` (ne `worldId`). Cascade smaže `chatchannels` (`worldId`), ale `channelreadstatus` docs keyed na jejich ID zůstanou.
- **Co zůstane:** read-status záznamy ukazující na neexistující kanály.
- **Dopad:** low (metadata, funkčně neviditelné), ale DB entropie.
- **Vratné?** Ano (skript smaže dle neexistujících channelId).
- **Návrh:** přidat cleanup dle channel IDs světa v cascade, nebo přidat cron orphan cleanup.

---

### CD-RUN-12 🟡 `EX` — bestie.imageUrl blob leak při soft-delete (no cleanup) 🆕

- **Kde:** `bestiae/bestiae.service.ts:170–176` — `softDelete` nečistí `imageUrl` blob (v souladu s recovery semantikou — blob potřeba pro restore). **Ale:** žádný hard-delete cron ani cleanup po recovery okně. Bestie `scope=world` jsou mazány `WorldHardDeleteService` bez blob cleanup.
- **Co zůstane:** Cloudinary blob bestie po smazání světa (scope=world).
- **Dopad:** katalogy bestií mohou mít desítky obrázků.
- **Vratné?** Ne (po world hard-delete).
- **Návrh:** world cascade → collect `bestiae.imageUrl` kde `worldId=X` → `media.orphaned`. User-scope bestie: zvažit hard-delete cron po recovery.

---

### CD-RUN-13 🟡 `EX` — scene.image operation neprovede cleanup starého blobu (replace bez orphan) ♻️

- **Kde:** `maps/operations/map-operations.service.ts:761–766` — `case 'scene.image'` provede `$set { imageUrl: op.imageUrl }` bez sbírání starého `imageUrl` → orphan na Cloudinary.
- **Pozn.:** Toto je replace-path, ne delete-path, ale z cascade hlediska: scope = `EX` media lifecycle.
- **Dopad:** každá výměna pozadí scény leakuje starý blob.
- **Vratné?** Ne.
- **Návrh:** atomic op `scene.image` nejprve načíst starý `imageUrl`, pak update, pak `media.orphaned`.

---

## Potvrzené (beze změny — K-CDx z original auditu)

- CD-01 ✅ page blob — opraveno, `page.deleted` + upload listener
- CD-02 ✅ character avatar — opraveno, `character.avatars.removed`
- CD-03 ✅ world.imageUrl — opraveno, `world.image.removed` před cascade
- CD-04 ✅ currentSceneId dangling — opraveno, `clearSceneForAll`
- CD-05 ⚖️ ref-counting — mitigováno
- CD-06 ⚖️ TX self-heal — platí
- CD-07 ⚖️ dead links FE — FE ošetřeno
- CD-08 ✅ favoritePageSlugs — opraveno
- CD-09 ✅ character cascade 3 listenery — opraveno
- CD-RUN-1 ✅ timeline blob — opraveno
- CD-RUN-2 ✅ timelineCalendarSlug dangling — opraveno
- CD-RUN-3 ✅ trusted devices po user hardDelete — opraveno
- CD-RUN-4 ✅ ikaros-news blob — opraveno
- CD-RUN-4b ⬜ ikaros-events soft-delete bez purge — OTEVŘENÉ (rozhodnutí)

---

## PROOF-REQUEST

1. **PR-CD-1 `M-SCAN` OR** — spustit orphan-scan na kolekci `worldMapEntries`/`worldMapFolders`/`diary_schema_versions`: `db.worldMapEntries.find({ worldId: { $nin: db.worlds.distinct('_id') } })` → počet orphan docs (CD-RUN-5/6).
2. **PR-CD-2 `M-BLOB` EX** — Cloudinary folder scan `ikaros/emotes/**` + `ikaros/avatars/**` vs DB refs → orphaned blob count (CD-RUN-7/8).
3. **PR-CD-3 `M-SCAN` OR** — `channelreadstatus` orphan: `db.channelreadstatus.find({ channelId: { $nin: db.chatchannels.distinct('_id') } })` count (CD-RUN-11).
4. **PR-CD-4 `M-SCAN` EX** — mapScenes world 13.4b: kolik scén s `imageUrl` po worldMapEntries? (CD-RUN-9)
