# F11 — Chat Matrix → Ikaros (HANDOFF podklady)

> **Start pro novou konverzaci k F11.** Kontext: [`HANDOFF.md`](./HANDOFF.md), [`index.md`](./index.md). Paměť: `project_matrix_full_migration`. Vzory: F6 (_id zachování), F8/F9/F12 (GDrive→Cloudinary), F9 (userId→F1 map).
> Stav: **📝 PODKLADY — čeká spec → souhlas → impl** (vzor F6-F10: build + workflow + dry-run).

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

## Postup (vzor F6-F10)
1. **Spec** (`f11-chat.md` rozšířit) → souhlas.
2. **Fáze A — GDrive upload** (`f11-upload.mjs`, vzor F8): ikony groups/channels + emote + message images → Cloudinary `matrix/chat` → mapa.
3. **Fáze B — build** (`f11-build.mjs`): 
   - chatGroups → ChatGroup (zachovat _id, icon→imageUrl, color rozhodnout).
   - ChatChannels → ChatChannel (nový _id + mapa, PascalCase→camel, Type→accessMode, Participants→allowedMemberIds F1, Icon→imageUrl).
   - ChatMessages → ChatMessage (channelId přes mapu, senderId F1, images→Cloudinary, customFont map, reactions F1, timestamp→createdAt).
   - ReadStatuses → ChannelReadStatus (channelId mapa, UserId F1).
   - CustomEmotes → CustomEmote (imageId→Cloudinary, createdBy=Tyky).
4. **Fáze C — workflow** `import-matrix-chat.yml` (3 režimy, upsert, `_mig:'f11'`). Dry-run ověří mapy + F1 pokrytí + prázdné kolekce.
5. Ověřit naživo `/svet/matrix` chat.

## Otevřené body (rozhodnout se uživatelem)
1. **color hex → slot** vs vynechat (PJ doladí).
2. **customFont** CSS→klíč mapa vs zahodit.
3. **Type → accessMode** přesná sémantika (team_ic/ooc/pj_dm/pj_group/inter) — co je co.
4. **Globální vs per-matrix** kanály (worldId/isGlobal).
5. **linkedMemberUserId** — mapovat pj_dm na soukromé konverzace postav?
6. ReadStatus 3 useři mimo F1 — skip.
