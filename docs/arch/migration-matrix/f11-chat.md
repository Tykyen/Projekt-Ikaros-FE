# F11 — Chat Matrix → Ikaros (HANDOFF podklady)

> **Start pro novou konverzaci k F11.** Kontext: [`HANDOFF.md`](./HANDOFF.md), [`index.md`](./index.md). Paměť: `project_matrix_full_migration`. Vzory: F6 (_id zachování), F8/F9/F12 (GDrive→Cloudinary), F9 (userId→F1 map).
> Stav: **✅ LIVE (2026-06-09)** — naimportováno na newmatrix. **7 skupin / 42 kanálů / 1506 zpráv / 281 readStatus / 1 emote, skip=0 (0 ztrát).** Import: skupiny nalezeno=7, kanály merge=14+update=28, zprávy nových=1503+update=3 (3 z pádu run1), emote=1.
>
> **🔴 Bug chycený naživo (ne v dry-run):** `chatmessages` má sparse-unique index `{channelId,clientNonce}`. Migrované zprávy bez `clientNonce` kolidovaly na `{channelId,null}` při >1 zprávě v kanálu → E11000, run1 spadl po 3 zprávách. **Fix:** `clientNonce='mig-'+_id` (unikátní per zpráva). Mock test rozšířen o vynucení unique indexů. Run2 idempotentně dorovnal.
>
> **Soubory (BE repo `migration/`):** `f11-upload.mjs`, `f11-build.mjs` → `f11-data.json.gz`, `f11-import.js`, `f11-mock-test.js`, `f11-img-map.json.gz` (223 obrázků). Workflow `.github/workflows/import-matrix-chat.yml` (diag/dry-run/import/rollback).
> **Diag potvrdil:** živý svět měl jen 2 skupiny (Globální/Postavy) + 0 character kanálů (BE chat scaffold se po raw membership importu nebootnul) → import frakce+character kanály VYTVOŘIL (find-or-create), BE je při bootu podle linkedWorldGroup/linkedMemberUserId přeskočí (žádné duplicity).

## Co to je
Poslední F bod migrace: chat starého Matrixu → Ikaros chat modul. Cílová feature **existuje** (modul `chat`, spec 6.x, route chat). Čistá datová migrace, ale **nejprovázanější** (5 kolekcí + vazby + GDrive obrázky + userId mapování).

## ⚠️ Názvosloví (invertované FE↔BE) — [[feedback_chat_naming]]
- **ChatGroup** = FE „kanál" (sbalovací kontejner v sidebaru).
- **ChatChannel** = FE „konverzace" (chatovací místnost uvnitř kanálu).
- **ChatMessage** = zpráva.

## Zdroj (dump, ověřeno Node+bson)
| Kolekce | Docs | Klíčové |
|---|---|---|
| `chatGroups` | **7** | `_id`(24-hex✓), `name`, `icon`(drive:GID), `color`(hex), `order`, `access` |
| `ChatChannels` | **43** | `_id`(**STRING** `t_global_team_ic`!), PascalCase: `Name,Type,Team,Icon(drive:),RoleRequired,GroupRequired,Participants,Description,IsActive,groupId(13/43),WorldId(1/43)` |
| `ChatMessages` | **1506** | `channelId,senderId,senderName,content,images[],timestamp,isEdited,editedAt,isDeleted,image,reactions(41),replyToId(86),replyToPreview,rpDate(215),customFont(922),overrideName(71),overrideAvatarUrl(71)` |
| `ChannelReadStatuses` | **299** | PascalCase: `ChannelId,UserId,LastReadUtc` |
| `CustomEmotes` | **1** | `worldId`(=matrix✓),`name`,`shortcode`,`imageId`(drive GID),`createdAt` |

**Ověřené integrity/fakty:**
- ChatMessages.channelId → **0 dangling** (všechny cílí ChatChannels._id).
- ChatMessages.senderId: **19 distinct, VŠECH 19 v F1 mapě** ✓.
- ReadStatus.UserId: 22/25 v F1 (3 mimo = smazaní useři → skip nebo Tyky).
- ChatChannels.Type: `team_ic, team_ooc, pj_dm, pj_group, inter`.
- ChatChannels.groupId (13) odkazuje `chatGroups._id` (24-hex) → sedí.
- ChatMessages.images neprázdné: 17 (GDrive?). customFont: CSS stringy (`'Cormorant Garamond', serif`…).
- chatGroups: Globální, Evropani, Lumíci, MI6, Komunikace Hráči, Komunikace s PJ, GMOI.

## Cílový model (BE `chat` modul, ověřeno)
- **ChatGroup** (`chatgroups`): `worldId, name, order, imageUrl?, color?(slot '0'-'11'!), iconKey?, linkedWorldGroup?`.
- **ChatChannel** (`chatchannels`): `groupId|null, worldId|null, name, isGlobal, accessMode('all'|'roles'|'members'), allowedRoles[], allowedMemberIds[], lastMessageAt?, lastMessagePreview?, order, isDeleted, type, imageUrl?, linkedMemberUserId?(6.7a)`.
- **ChatMessage** (`chatmessages`): `channelId, worldId, senderId, senderName, senderAvatarUrl?, overrideName?, overrideAvatarUrl?, content|null, isEdited, isDeleted, isSystem, rpDate?, replyToId?, replyToPreview?, reactions(Record<emoji,userId[]>), attachments[], customFont|null, customFontSize|null, color|null, isDiceRoll, mentions[], dicePayload, diceSkin`.
- **ChannelReadStatus** (`channelreadstatus`): `userId, channelId, lastReadMessageId?, lastReadAt`. Unique `{userId,channelId}`.
- **CustomEmote** (`custom_emotes`): `worldId, name, shortcode, imageId, imageUrl, createdBy, tags[]`. Unique `{worldId,shortcode}`.

## 🔑 Klíčové mapovací výzvy (gotchas)
1. **ChatChannels._id jsou STRINGY** (`t_global_team_ic`), ne ObjectId → **NELZE zachovat** jako F6. Nutno: vytvořit nový ObjectId, **mapa `oldChannelId→newId`**, a `ChatMessages.channelId` + `ReadStatus.ChannelId` přemapovat přes ni.
2. **chatGroups._id = 24-hex** → lze zachovat (jako F6). `ChatChannels.groupId` pak sedí.
3. **senderId/UserId = starý Matrix userId → F1 map** (vzor F9 confirmedBy; 19/19 sender mapuje). `senderName` 1:1.
4. **GDrive obrázky → Cloudinary** (vzor F8/F9/F12): `chatGroups.icon`, `ChatChannels.Icon`, `ChatMessages.images[]`/`image`, `CustomEmotes.imageId` = `drive:GID` → upload webp → URL. **Pozn:** group/channel ikona → `imageUrl`.
5. **color hex → slot** (ChatGroup.color je `'0'-'11'`, ne hex): mapovat hex→nejbližší paleta slot, NEBO vynechat (auto-hash z id) a uložit přesný hex jinam. (Rozhodnout — možná vynechat, barvy si PJ doladí.)
6. **customFont CSS → CHAT_FONT_KEYS**: Matrix má CSS font stringy, Ikaros whitelist klíče. Mapovat (CSS→klíč) nebo zahodit (null). 922 zpráv má font.
7. **PascalCase → camelCase**: ChatChannels, ChannelReadStatuses.
8. **accessMode/type/isGlobal z Matrix Type+access**: `team_ic`/`team_ooc` → frakční (accessMode members/roles dle group access), `pj_dm`/`pj_group` → PJ, `inter` → ?. `Participants` → `allowedMemberIds` (F1 map). `access` skupiny (Evropani/Lumíci/MI6) → frakce. **Ověřit, co Type přesně znamená.**
9. **worldId**: většina ChatChannels/groups bez WorldId → doplnit matrix `"6d61…01"` (per-world). Globální (isGlobal) možná worldId=null — rozhodnout (chce uživatel chat per-matrix, ne globální).
10. **linkedMemberUserId** (6.7a Postavy kanál): Matrix `pj_dm` možná = soukromé konverzace → mapovat na linkedMemberUserId? Ověřit.
11. **reactions**: Matrix tvar (41 zpráv) → Ikaros `Record<emoji,userId[]>` (userId F1 map).
12. **replyToId** (86): odkazuje ChatMessages._id → přemapovat na nový _id (mapa zpráv) NEBO zachovat _id zpráv (jsou 24-hex? ověřit).

---

# ✅ SPEC F11 (rozhodnutá mapování — k odsouhlasení 2026-06-09)

## 🔑 Zásadní princip: UPSERT do existujícího Ikaros chatu, NE recreace
Živý svět matrix už má auto-chat scaffold (`seedDefaultGroups` + `syncWorldGroupChannels` + `backfillCharacterChannels` běží na bootu BE a po F-membershipu):
- skupiny **„Globální"** (order 0) + **„Postavy"** (order 1),
- za každou družinu (`worldSettings.customGroups`: Evropani/Lumíci/MI6) skupina s `linkedWorldGroup=<jméno>` + members kanál,
- 19 character kanálů v „Postavy" (`type:'character'`, `linkedMemberUserId`).

**Migrace tedy NEvytváří 7 Matrix skupin znovu.** Najde existující Ikaros skupiny (podle `name` / `linkedWorldGroup`) a **doplní do nich Matrix kanály + historii.** Idempotence: skupiny by name, character kanály by `linkedMemberUserId`, kanály/zprávy by `_id`/`_mig`.

⚠️ **Diag-first (lekce F12):** workflow má `diag` režim, co nejdřív vypíše živý stav chatu matrix světa (existující skupiny, kanály, character kanály, počty zpráv) → cílíme podle reálné DB, ne dumpu.

## Mapování skupin (chatGroups → Ikaros ChatGroup)
| Matrix skupina | Ikaros cíl | Akce |
|---|---|---|
| Globální | existující „Globální" | find-or-create, kanály níže |
| Komunikace s PJ (pj_dm) | existující „Postavy" | hráč↔PJ jen → character kanály (`linkedMemberUserId`) |
| Evropani / Lumíci / MI6 | existující `linkedWorldGroup` skupiny | **NESAHAT na imageUrl** (znak z `worldSettings.groupImages`), jen doplnit kanály |
| GMOI | standalone „GMOI" (nebo linkedWorldGroup, pokud je v `customGroups` — diag ověří) | find-or-create |
| Komunikace Hráči (pj_group + inter) | standalone „Komunikace Hráči" | multi-party konverzace, find-or-create |

`color` hex → slot jen u standalone (GMOI, Komunikace Hráči) a Globální/Postavy zůstávají Ikaros default; linked skupiny barvu neřeší (řídí svět). `order` zachovat z Matrixu.

## Mapování kanálů (ChatChannels → ChatChannel) — nový `_id` + mapa `oldStringId→newObjectId`
`_id` jsou STRINGY → nelze zachovat. Build vytvoří mapu, přes ni přemapuje `ChatMessages.channelId` + `ReadStatus.ChannelId`. PascalCase→camel.

| Matrix `Type` | Ikaros cílová skupina | `accessMode` | `allowedMemberIds` | `type` | pozn. |
|---|---|---|---|---|---|
| `team_ic`/`team_ooc` bez Team (Herní, Neherní, Chyby v Matrixu) | Globální | `all` | — | `all` | |
| `team_ic`/`team_ooc` s Team (MI6/Evropani/Lumíci) | příslušná linked skupina | `members` | členové družiny (F1) | `all` | PJ přes bypass |
| `team_ic` GMOI (5 kanálů) | GMOI | `all` | — | `all` | |
| `pj_dm` (Parts=1, 14×) | **Postavy** | `members` | `[hráč]` (F1) | **`character`** | `linkedMemberUserId=hráč`, **upsert** (merge do auto-kanálu) |
| `pj_group` (Parts 2–3) | Komunikace Hráči | `members` | Participants (F1) | `all` | |
| `inter` (Parts var.) | Komunikace Hráči | `members` | Participants (F1) | `all` | |

- **Skip:** `inter` „Globální" `w_…_global` (cizí WorldId, 0 zpráv).
- **Icon** (`drive:`, 23×) → Cloudinary → `imageUrl` (kromě linked frakčních — ty řeší znak světa).
- Prázdné kanály (0 zpráv) **zachovat** (LO3, Neville, Bizoní srst… = validní místnosti); auto „globální"/default kanály necháme být (PJ si ručně uklidí).
- `worldId` = matrix ObjectId `"6d6174726978000000000001"`, `isGlobal=false` (chat per-matrix).

## Mapování zpráv (ChatMessages → ChatMessage) — **zachovat `_id`** (reply funguje)
- `channelId` přes id-mapu, `worldId`=matrix, `senderId`→F1(newId), `senderName` 1:1.
- `content` (null OK, 94 image-only), `timestamp`→`createdAt`, `editedAt`→`updatedAt`, `isEdited`/`isDeleted` zachovat.
- `image` + `images[]` → **`attachments[]`** `{url, publicId, type:'image', mimeType, filename, size}`:
  - base64 (133+55) → Cloudinary webp; `drive:` (2) → Cloudinary; **tenor url (10) → ponechat as-is** (veřejné CDN GIFy).
- `overrideName`/`overrideAvatarUrl` (71×, RP persony) zachovat; avatar (holé `drive` GID) → Cloudinary.
- `reactions` (41×): tvar `Record<emoji,userId[]>` už sedí → jen userId→F1; shortcode `:cassidyhowdy:` ponechat (emote se migruje).
- `replyToId` (86×, string cílící `_id`) + `replyToPreview` zachovat.
- `rpDate` (215×) zachovat. `customFont` (922×) CSS→klíč (mapa níže); `customFontSize`=null, `color`=null.
- `isSystem`=false, `isDiceRoll`=false, `dicePayload`/`diceSkin`=null.

## ReadStatus (ChannelReadStatuses → ChannelReadStatus)
`ChannelId` přes id-mapu, `UserId`→F1, `LastReadUtc`→`lastReadAt`, `lastReadMessageId`=null. **Skip** UserId mimo F1 (3) i ReadStatus na skipnutý kanál. Unique `{userId,channelId}` → upsert.

## CustomEmote (CustomEmotes → CustomEmote)
`worldId`=matrix (ObjectId), `name`/`shortcode` 1:1, `imageId` (holé GID) → Cloudinary `public_id`, `imageUrl`=Cloudinary URL, `createdBy`=Tyky(newId), `tags`=[]. Unique `{worldId,shortcode}` → upsert.

## `customFont` CSS → Ikaros klíč (7 hodnot)
| Matrix CSS | klíč | × |
|---|---|---|
| `inherit` | `null` | 391 |
| `'Crimson Text', serif` | `crimson` | 328 |
| `'Lora', serif` | `lora` | 183 |
| `'Courier New', Courier, monospace` | `mono` | 11 |
| `'Cormorant Garamond', serif` | `cormorant` | 4 |
| `'VT323', monospace` | `sharetech` | 4 |
| `'Great Vibes', cursive` | `greatvibes` | 1 |

## `color` hex → slot (paleta `--chat-group-1..12`)
Globální `#00ff41`→slot4(`'3'`), Evropani/Lumíci/MI6 = linked (neřeší se), GMOI `#00ccff`→slot8(`'7'`), Komunikace Hráči `#c0c0c0`→undefined (auto-hash), Postavy = default.

## Fáze (vzor F6–F10)
1. **A — upload** `migration/f11-upload.mjs`: base64/drive/avatar/emote → Cloudinary `matrix/chat` (`--use-system-ca`, 10MB fallback). Tenor přeskočit. Mapa `f11-img-map.json.gz`.
2. **B — build** `migration/f11-build.mjs`: z dumpu + map (f1, img) → gzip JSON kolekce (`groups/channels/messages/readstatus/emote`) + `channel-id-map`. Lokální mock test (vzor f9-mock-test).
3. **C — workflow** `.github/workflows/import-matrix-chat.yml`: režimy `diag` / `dry-run` / `import`(IMPORT) / `rollback`(ROLLBACK). `_mig:'f11'`. Upsert (skupiny by name, character kanály by linkedMemberUserId, zprávy/kanály by _id).
4. Dry-run ověří: F1 pokrytí (✓19/19,15/15,11/11), img mapa, id-mapa, kolize skupin. → ostře → ověřit `/svet/matrix` chat.

## Rozhodnuto (2026-06-09, odsouhlaseno) ✅
1. **pj_group + inter → standalone „Komunikace Hráči"** (název zachován — hráči zvyklí).
2. **GMOI → standalone chat skupina**, NE družina; přístupy/lidé jak jsou (kanály `access:Všichni` → `accessMode:'all'`).
3. **Prázdné Matrix kanály ZACHOVAT** (hráči je můžou využít).
4. Barvy/fonty/Type→accessMode/per-matrix/ReadStatus-skip-3 — dle dat výše.

---

# 🛠 Implementační plán (k odsouhlasení)

## ⚙️ Architektonické jádro: rozlišení skupin/kanálů AŽ v mongosh runtime
Živé Ikaros skupiny (Globální/Postavy/Evropani/Lumíci/MI6) mají Mongoose-generovaná `_id`, která **lokálně neznám** → build je NESMÍ hardcodovat. Build proto popisuje cíl **logickým klíčem** (`groupKey`), runtime ho přeloží na reálné `_id` (find-or-create). Stejně tak `channelId` zpráv: build nechá `channelOldId` (Matrix string) a **přemapování na živé `_id` dělá mongosh** až po vyřešení všech kanálů (vč. merge character kanálů). Tím se vyhneme rozjetí map proti realitě DB.

- `groupKey`: `'Globální'` | `'Postavy'` | `linked:Evropani|Lumíci|MI6` | `standalone:GMOI` | `standalone:Komunikace Hráči`.
- **character kanály (`pj_dm`)**: runtime hledá v Postavy podle `linkedMemberUserId` → existuje (auto-backfill) → **reuse jeho `_id` + merge zpráv**; jinak vytvoř s novým `_id`. → žádné duplicity.

## Soubory (vzor F9, vše do `migration/`)
1. **`f11-upload.mjs`** (fáze A) — GDrive (vzor f8/f12, `--use-system-ca`, 10MB fallback) + base64 (vzor f9) → Cloudinary `matrix/chat`. Resume přes `f11-image-progress.ndjson`. Úkoly: channel icons (23 `drive:`), standalone group icons (GMOI + Komunikace Hráči), msg images (188 base64 + 2 drive), override avatars (71 `drive` GID), emote (1). **Tenor (10) skip.** Výstup `f11-image-map.json(.gz)` keyed `chan:<oldId>` / `grp:<key>` / `msg:<msgId>:<i>` / `ava:<msgId>` / `emote`.
2. **`f11-build.mjs`** (fáze B) — dump + F1(oldId→newId) + image-map → `f11-data.json(.gz)` = `{groups[], channels[], messages[], readStatuses[], emote}`. Channels: `{oldId, newId, groupKey, name, type, accessMode, allowedRoles, allowedMemberIds, linkedMemberUserId?, imageUrl?, order}`. Messages: zachované `_id`, `channelOldId`, attachments[], reactions(F1), customFont(klíč), override, rpDate, reply… Validační log (F1 pokrytí, font mapa, kolik merge-character vs nových).
3. **`f11-mock-test.js`** — in-memory mongosh logika (vzor f9-mock-test): ověří group resolve, channel-id map, character merge, message remap, 0 dangling.
4. **`f11-import.js`** — mongosh tělo (IIFE, gotcha #3). Pořadí: groups(resolve/create→`gkId`) → channels(resolve groupId; character merge by linkedMemberUserId; jinak upsert by `_id`; → `chanIdMap[oldId]`) → messages(channelId=`chanIdMap`, upsert by `_id`, `_mig:'f11'`) → readStatus(channelId map, upsert `{userId,channelId}`) → emote(upsert `{worldId,shortcode}`). `diag`/`DRY` větve.
5. **`.github/workflows/import-matrix-chat.yml`** — režimy `diag` / `dry-run` / `import`(IMPORT) / `rollback`(ROLLBACK). `diag` = vypíše živý stav (skupiny+kanály+character kanály+počty). Rollback: smaž `_mig:'f11'` zprávy/readstatus/emote + migrací **vytvořené** kanály (NE auto/merge character); skupiny ponech.

## `allowedMemberIds` — runtime, ne lokálně
Frakční kanály (team_ic/ooc s Team) + linked skupiny: `allowedMemberIds` spočítá **mongosh z živých `worldmemberships`** (vzor `createWorldGroupChannel`: `m.group===<frakce> || role>=PomocnyPJ`). pj_*/inter: base = Participants (F1) ∪ PomocnyPJ+ (runtime). → žádná stará lokální data, PJ vidí kanál v sidebaru.

## Známé drobné limity (zapsáno, neblokuje)
- Reakce se shortcode `:cassidyhowdy:` se vykreslí jako text (čip nezobrazí emote obrázek; 1 emote). Pre-existující limit MessageItem.
- Tenor přílohy: syntetické `publicId` + placeholder `size` (FE je nepoužívá pro render, jen klíč).

## Idempotence & bezpečnost
- Skupiny by `name`/`linkedWorldGroup`, character kanály by `linkedMemberUserId`, kanály/zprávy by `_id`, readStatus by `{userId,channelId}`, emote by `{worldId,shortcode}` → opakovaný běh nezdvojí.
- `worldId="6d61…01"` (ObjectId, gotcha #1). Tenor URL ponechány. PJ vidí vše přes `hasChannelAccess` bypass (allowedMemberIds = jen hráči).
- **Postup:** build+mock lokálně → commit+push (já) → `diag` (uživatel) → `dry-run` → `import` → ověřit `/svet/matrix` chat.
