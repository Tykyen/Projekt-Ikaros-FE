# 00 — Cross-cutting: TYPE mina, FK graf, index inventura, scan + invariant katalog

Globální vrstva pod všemi entitami. Drží **master matice**, ze kterých ostatní oblasti řežou svou
část. Pět sekcí podle pořadí, v jakém se musí ověřovat: **A. TYPE** (první — jinak vše lže) →
**B. FK graf** → **C. Index inventura** → **D. Write-prevence** → **E. Invariant katalog**.

**BE:** schémata `modules/**/schemas/*.schema.ts`, create/update services, [`upload.service.ts`](../../../Projekt-ikaros/backend/src/modules/upload/upload.service.ts), crony

---

## A. TYPE mina (P3, osa `TYPE`) — běží PRVNÍ

> Pokud část kolekcí drží `worldId`/`userId` jako `ObjectId` a zbytek jako `string`, **každý scan
> porovnávající stringy lže** (false-negative) a runtime `$lookup`/rovnost tiše selže. Tohle se musí
> srovnat, než dává smysl cokoli dalšího měřit.

| Pole | Většina kolekcí | Výjimka (mina) | Soubor:řádek |
|---|---|---|---|
| `worldId` | `string` | **`custom_emotes` = `Types.ObjectId`** | [`custom-emote.schema.ts:4`](../../../Projekt-ikaros/backend/src/modules/emotes/schemas/custom-emote.schema.ts#L4) |
| `createdBy` | `string` | **`custom_emotes` = `Types.ObjectId`** | [`custom-emote.schema.ts:4`](../../../Projekt-ikaros/backend/src/modules/emotes/schemas/custom-emote.schema.ts#L4) |
| `userId`/`ownerId`/`authorId`/`senderId` | `string` | _(ověřit M-TYPE — Explore neviděl další)_ | — |

**M-TYPE dotaz:** pro každé FK pole agreguj `{ $group: { _id: { $type: '$<pole>' }, n: { $sum: 1 } } }`
napříč kolekcemi → jakýkoli mix `objectId`+`string` u téhož pole = mina.

> **Výsledek A:** _(doplnit M-TYPE skenem — potvrdit emotes + projít zbylá FK pole; každý mix → DI-xx `TYPE`)_
> ⚠️ **Než se A vyřeší, čísla z E ber s rezervou** (orphan u emotů může být false-negative).

---

## B. FK dependency graph (P1, M-GRAPH) — kdo referencuje koho

> Sestaveno Explore sweepem 2026-06-13. Pro každý **cíl**: které kolekce/pole na něj míří (= kandidáti
> na `RR`/`OR` při chybějící validaci nebo cascade). Status sloupec se plní scanem (E).

### B.1 — Cíl `worlds._id` (~40 kolekcí drží `worldId`)
`pages` · `characters` (+6 subdoc kolekcí) · `worldmemberships` · `worldsettings` · `worldaccessrequests`
· `worldOperations` · `chatchannels`/`chatgroups`/`chatmessages` · `mapScenes`/`mapOperations` ·
`worldMapEntries`/`worldMapFolders` · `universeMaps` · `game_events` · `worldnews` · `timeline_events` ·
`world_calendar_configs` · `world_currencies` · `world_gm_notes` · `world_page_templates` ·
`diary_schema_versions` · `bestiae` (opt) · `sounds` (opt) · `custom_emotes` (opt, **ObjectId!**) ·
`scheduledMessages` · `dungeonMaps` · `campaign*` (10 kolekcí) · `weather*` (4 kolekce).

### B.2 — Cíl `users._id` (skoro všude)
`worlds.ownerId` · `worldmemberships.userId` · `characters.userId` · `pages.ownerUserId` ·
`chatmessages.senderId`/`mentions[]`/`visibleTo[]` · `chatchannels.allowedMemberIds[]`/`linkedMemberUserId` ·
`friendships.{requester,recipient}Id` · `friend_blocks.{blocker,blocked}Id` ·
`ikaros_messages.{sender,recipient}Id` · `ikaros_discussions.{creator,manager,invited,joinRequest}Ids` ·
`*.authorId`/`createdBy`/`ownerId` (články, galerie, campaign, weather, sounds, gm-notes) ·
`refresh_tokens`/`security_tokens`/`push_subscriptions.userId` · `admin_audit_log.{actor,target}Id` ·
`worldMap*.visibleToPlayerIds[]` · `mapScenes.activeCharacterIds`→characters, atd.

### B.3 — Cíl `characters._id` / `.slug`
- `_id`: 6 subdoc kolekcí (`character_diaries/_calendars/_finances/_inventories/_notes/_accounts`) ·
  `mapScenes.activeCharacterIds[]` · `campaignPurchases.characterId` · `pages.characterRef.characterId`.
- `.slug`: `worldmemberships.characterPath` · `campaignSubjects.linkedCharacterSlug`.

### B.4 — Cíl `pages.slug`
`worldnews.linkPageSlug` · `timeline_events.pageSlug` · `campaignSubjects.linkedPageSlug` ·
`campaignScenarios.linkedPageSlug` · `User.favoritePageSlugs{worldId:[]}` · `page_embeddings.pageId`(=_id).

### B.5 — Ostatní cíle
- `mapScenes._id`: **`worldmemberships.currentSceneId`** (= CD-04 dangling), `mapOperations.sceneId`.
- `world_calendar_configs._id`/`.slug`: `worldsettings.timelineCalendarSlug`, `worldnews.calendarConfigId`, `character.preferredCalendarConfigId`.
- `chatchannels._id`: `chatmessages.channelId`, `channelreadstatus.channelId`, `scheduledMessages.channelId`.
- **Self-ref:** `worldMapFolders.parentId` (strom), `campaignShopGroups.parentId` (2 úrovně), `campaignShopItems.linkedItemIds[]`, `chatmessages.replyToId`, `ikaros_messages.{conversationId,replyToId}`, `game_events.comments[].parentId`.
- **Category key (string FK):** `ikaros_articles.category`→`article_categories.key`, `ikaros_gallery.category`→`gallery_categories.key`.

> **Výsledek B:** _(M-GRAPH potvrdí proti kódu; každá hrana bez constraintu/validace = scan kandidát v E)_

---

## C. Index inventura (osa `IDX`, M-IDX) — vynucená vs jen logická unikátnost

### C.1 — Unique indexy (vynuceno DB) — ✅ chrání duplicity
| Kolekce | Index | Soubor:řádek |
|---|---|---|
| `users` | `email`, `username`, `usernameLower`(sparse) | [`user.schema.ts:13`](../../../Projekt-ikaros/backend/src/modules/users/schemas/user.schema.ts#L13) |
| `worlds` | `slug` | [`world.schema.ts:9`](../../../Projekt-ikaros/backend/src/modules/worlds/schemas/world.schema.ts#L9) |
| `worldmemberships` | `{userId, worldId}` | [`world-membership.schema.ts:79`](../../../Projekt-ikaros/backend/src/modules/worlds/schemas/world-membership.schema.ts#L79) |
| `characters` | `{worldId, slug}` | [`character.schema.ts:46`](../../../Projekt-ikaros/backend/src/modules/characters/schemas/character.schema.ts#L46) |
| `pages` | `{worldId, slug}` | [`page.schema.ts:67`](../../../Projekt-ikaros/backend/src/modules/pages/schemas/page.schema.ts#L67) |
| `world_calendar_configs` | `{worldId, slug}` | [`world-calendar-config.schema.ts:47`](../../../Projekt-ikaros/backend/src/modules/world-calendar-config/schemas/world-calendar-config.schema.ts#L47) |
| `custom_emotes` | `{worldId, shortcode}` | [`custom-emote.schema.ts:37`](../../../Projekt-ikaros/backend/src/modules/emotes/schemas/custom-emote.schema.ts#L37) |
| `worldsettings` / `universeMaps` / `world_currencies` | `worldId` | viz schémata |
| `channelreadstatus` | `{userId, channelId}` · `article_reads` `{userId, articleId}` | viz schémata |
| `friend_blocks` | `{blockerId, blockedId}` · `world_gm_notes` `{worldId, userId}` | viz schémata |
| `chatmessages` | `{channelId, clientNonce}`(sparse) · `mapOperations`/`worldOperations` `{*, seqNumber}` | viz schémata |
| `refresh_tokens` `jti` · `security_tokens` `tokenHash` · `push_subscriptions` `endpoint` | unique | viz schémata |

### C.2 — Očekávaná unikátnost BEZ DB indexu — ⚠️ `DUP` riziko
| Pole | Kolekce | Co garantuje (jen logika) | Riziko |
|---|---|---|---|
| `code` | `world_currencies.items[]` | měna unikátní per svět | embedded, žádný constraint → dvě stejné měny |
| `name` | `world_weather_generators` | generátor unikátní per svět | bez indexu → dup na race/migraci |
| `name` | `world_weather_generator_sets` | set unikátní per svět | bez indexu |
| `shortcode` (legacy?) | ověřit emotes pre-index docy | — | migrace mohla nalít dup před indexem |

### C.3 — TTL indexy (ověřit, že běží)
`chatmessages.expiresAt` (0s) · `mapOperations`/`worldOperations.appliedAt` (30d) ·
`refresh_tokens`/`security_tokens.expiresAt` (0s) · `campaignChangeLogs.changedAt` (90d).

> **Výsledek C:** _(M-IDX: `getIndexes()` na reálné DB vs tahle tabulka → drift schema↔DB; C.2 → DUP scan v E)_
> ⚠️ **Migrace mohla nalít duplicity dřív, než index vznikl** → `createIndex unique` by dnes selhal. Ověřit C.1 i na existující dup.

---

## D. Write-path prevence (P3, osy `WV`/`AT`) — kde se chyby rodí

### D.1 — Validace reference před zápisem
| Service | Validuje? | Soubor:řádek | Osa |
|---|---|---|---|
| worlds.create (slug) | ✅ `existsBySlug`→Conflict | [`worlds.service.ts:301`](../../../Projekt-ikaros/backend/src/modules/worlds/worlds.service.ts#L301) | OK |
| characters.create (slug+world) | ✅ `existsBySlugAndWorld` | [`characters.service.ts:216`](../../../Projekt-ikaros/backend/src/modules/characters/characters.service.ts#L216) | OK |
| pages.create (slug) | ✅ + `assertCanWrite` | [`pages.service.ts:183`](../../../Projekt-ikaros/backend/src/modules/pages/pages.service.ts#L183) | OK |
| friendships.send (recipient) | ✅ ověří existenci | [`friendships.service.ts:61`](../../../Projekt-ikaros/backend/src/modules/friendships/friendships.service.ts#L61) | OK |
| **world-news.create** | ⚠️ `worldId` ✅ pro ne-adminy (`findById` :280), ale **admin fast-path :271 skip** + sekundární `linkPageSlug`/`calendarConfigId` ❌ | [`world-news.service.ts:266`](../../../Projekt-ikaros/backend/src/modules/world-news/world-news.service.ts#L266) | **DI-02** |
| **dungeon-maps.create** | ❌ `worldId` slepě | [`dungeon-maps.service.ts:74`](../../../Projekt-ikaros/backend/src/modules/dungeon-maps/dungeon-maps.service.ts#L74) | **K-DI1** |
| **timeline.create** | ❌ `worldId` slepě | [`timeline.service.ts:154`](../../../Projekt-ikaros/backend/src/modules/timeline/timeline.service.ts#L154) | **K-DI1** |
| **sounds.create** | ❌ `worldId` slepě | [`sounds.service.ts:89`](../../../Projekt-ikaros/backend/src/modules/sounds/sounds.service.ts#L89) | **K-DI1** |
| **weather.savePreset** | ❌ `worldId` slepě | [`world-weather.service.ts:99`](../../../Projekt-ikaros/backend/src/modules/world-weather/world-weather.service.ts#L99) | **K-DI1** |
| **chat.createChannel** | ⚠️ group ✅, ale `allowedMemberIds` ❌ | [`chat.service.ts:460`](../../../Projekt-ikaros/backend/src/modules/chat/chat.service.ts#L460) | **K-DI9** |
| **campaign.createSubject** | ❌ `linkedPageSlug`/`linkedCharacterSlug` slepě | [`campaign.service.ts:183`](../../../Projekt-ikaros/backend/src/modules/campaign/campaign.service.ts#L183) | **K-DI2** |

> ⚠️ **Korekce (ověřeno v kódu, ne z Explore):** permission checky (`assertCanWrite`/`assertManage`) typicky
> `findById(world/membership)` jako vedlejší efekt → **parent `worldId` je u běžných uživatelů incidentálně
> ověřen**. Skutečná díra (DI-02) = (a) admin fast-path early-return ten check přeskočí, (b) **sekundární
> refs** (`linkPageSlug`, `calendarConfigId`, `linked*Slug`, `allowedMemberIds`, `preferredCalendarConfigId`),
> kterých se permission check nedotkne → nikdy nevalidované. Páteř nálezu = sekundární refs, ne parent worldId.

### D.2 — Atomicita multi-collection zápisu
| # | Bod | Osa | Status |
|---|-----|-----|--------|
| XD-01 | `worlds.create` cascade `world→membership→currencies→calendar` **bez transakce** → selže-li krok 3, svět bez kalendáře | `AT` | ⬜ K-DI6 |
| XD-02 | `page→character→subdocs` create **bez transakce** → page save selže = orphan character | `AT` | ⬜ K-DI6 |
| XD-03 | membership approve **JE** v transakci ([`worlds.service.ts:730`](../../../Projekt-ikaros/backend/src/modules/worlds/worlds.service.ts#L730)), ale fallback (non-replica-set) sekvenční → orphan access-request při pádu | `AT`/`IDX` | ⬜ |
| XD-04 | finance transfer **JE** v transakci + revert fallback; selže-li revert, částka zmizí z FROM | `AT` | ⬜ (cross-ref s 11.x) |

> **Výsledek D:** _(potvrdit čtením; chybějící validace → WV nález, chybějící TX → AT nález)_

---

## E. Integrity-scan + invariant katalog (P2, M-SCAN) — tvrdá čísla

> Read-only sken ([`tools/integrity-scan.md`](tools/integrity-scan.md)). Každý řádek = jeden dotaz vracející count.

### E.1 — Orphans (`OR`) — child bez parenta
`pages`/`characters`/40× world-scoped s `worldId` ∉ `worlds` · 6× character subdoc s `characterId` ∉
`characters` · `chatmessages.channelId` ∉ `chatchannels` · `mapOperations.sceneId` ∉ `mapScenes`.

### E.2 — Broken refs (`RR`) — ref na neexistující
`worldmemberships.currentSceneId` ∉ `mapScenes` · `.characterPath` ∉ `characters.slug` ·
`worlds.ownerId` ∉ `users` · `worldnews.linkPageSlug`/`timeline.pageSlug`/`campaign.linkedPageSlug` ∉
`pages.slug` · `worldsettings.timelineCalendarSlug` ∉ `calendar.slug` · `character.preferredCalendarConfigId`
∉ `calendar._id` · `User.favoritePageSlugs` ∉ `pages.slug` · category `key` ∉ kategorie · self-ref `parentId` ∉ self.

### E.3 — Duplicates (`DUP`) — aggregate group-by
`world_currencies.items[].code` per svět · weather generator/set `name` per svět · (po TYPE fixu)
ověř C.1 unique pole na reálné dup · membership `{userId,worldId}` count > 1.

### E.4 — Invarianty (`INV`/`CARD`/`STATE`/`SET`/`TEMP`) — patro 2
| Kontrola | Osa | Dotaz |
|---|---|---|
| `account.balance` ≠ Σ `transactions[].amount` | `INV` | dopočet vs uložené |
| `world.playerCount` ≠ count membershipů světa | `INV` | porovnání |
| `page.worldId` ≠ `character.worldId` (přes `characterRef`) | `INV` | cross-collection shoda |
| postava: count subdoc typu ≠ 1 (0 = chybí, 2 = dvojí) | `CARD` | group `characterId` |
| `isNpc=true` ∧ `userId≠null` / `isNpc=false` ∧ `userId=null` | `STATE` | nemožná kombinace |
| `deletedAt≠null` ∧ `isActive=true` | `STATE` | protichůdný flag |
| `friendship.requesterId == recipientId` / `relationship.subjectAId == subjectBId` | `SET` | self-ref nesmysl |
| dup ID v `allowedMemberIds`/`activeCharacterIds`/`visibleTo` | `SET` | array distinct count |
| cyklus v `worldMapFolders.parentId` / `campaignShopGroups.parentId` | `SET` | graf traverz |
| `createdAt > updatedAt` / kalendářní `day` mimo meze měsíce | `TEMP` | porovnání |

> **Výsledek E:** _(M-SCAN dá reálná čísla; 0 = čisto (ale riziko trvá), N = N nálezů → DI-xx)_

---

## Známá rizika (předběžná)

- **String FK bez constraintu je kořen** — integrita stojí jen na aplikačním kódu, který je u write-validace
  nejednotný (D.1). Jednotná oprava = helper `assertRefExists(coll, id)` volaný v každém create.
- **Migrace obešla services** → write-validace ji nechytily; orphany/shape drift hledat scanem světa `matrix` (oblast 04).
- **TYPE mina otravuje vše** — dokud `worldId` není jednotný `string`, scan u emotů lže (A první!).
- **Dup bez indexu** (C.2) — měna/weather; přidat unique index až **po** dočištění existujících dup (jinak `createIndex` selže).
- **Invarianty (INV/CARD) jsou nejtišší** — data vypadají OK, reference sedí, ale čísla lžou; chytí jen dopočet (E.4).
