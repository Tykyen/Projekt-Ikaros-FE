# db-integrity / 00-cross-cutting — checkpoint RUN-2026-06-20-1621

Datum: 2026-06-20  
Metoda: statické čtení (M1 + M-GRAPH), HEAD kód  
Pokrytí: všechny `.schema.ts` soubory (73 schémat přečteno), registr + plán přečten celý

---

## Pokrytí

| Oblast | Co přečteno | L |
|---|---|---|
| Všechna schémata (`*.schema.ts`) | 73 schémat, všechny kolekce | L1-L2 |
| FK dependency graph | B.1–B.5 potvrzeno proti HEAD kódu | L2 |
| Index inventura | C.1–C.3 ověřeno; duplicate-index fix potvrzen v 5 subdoc schématech + UniverseMap | L2 |
| Write-path prevence | D.1–D.2 ověřeno (DI-04 rollback přítomen) | L2 |
| STATE invarianty | Characters.isNpc/userId/kind, World.deletedAt/isActive, game-events.comments parentId | L1 |
| TYPE mina | `Types.ObjectId` jen v `custom_emotes` (DI-01 potvrzeno na HEAD) | L2 |
| Nové nalezy (DI-RUN-06/07/08) | ověřeny na HEAD | L1-L2 |

**Neprovedeno (blokátor = DB connection):** M-SCAN (orphan counts), M-TYPE (bsonType agregace), M-IDX (`getIndexes()`), migrace scan světa `matrix`.

---

## Dosažená L vs cílová L

| Osa | Cílová L | Dosažená L | Blokátor |
|---|---|---|---|
| `TYPE` | L4 | L2 | M-TYPE vyžaduje DB |
| `OR` | L4 | L2 | M-SCAN vyžaduje DB |
| `RR` | L4 | L2 | M-SCAN vyžaduje DB |
| `DUP` | L4 | L2 | M-SCAN vyžaduje DB |
| `WV` | L2 | L2 | ✅ staticky pokryto |
| `AT` | L2 | L2 | ✅ staticky pokryto |
| `IDX` | L3 | L2 | M-IDX vyžaduje DB; staticky L2 |
| `INV` | L4 | L1 | M-SCAN vyžaduje DB |
| `CARD` | L4 | L1 | M-SCAN vyžaduje DB |
| `STATE` | L4 | L1 | M-SCAN vyžaduje DB |
| `SET` | L4 | L1-L2 | viz DI-RUN-08 + K-DI12 refutace |
| `TEMP` | L4 | L1 | M-SCAN vyžaduje DB |
| `SHAPE` | L2 | L1 | migrace scan chybí |
| `MIR` | L2 | L2 | potvrzeno čtením listener |

---

## Nálezy

### Staré nálezy — stav na HEAD (ověřeno čtením)

| ID | Stav HEAD | Poznámka |
|---|---|---|
| DI-01 🟡 `TYPE` | ♻️ BEZE ZMĚNY | `custom_emotes.worldId/createdBy` = `Types.ObjectId`; jediná kolekce, auto-cast funguje, žádný runtime bug |
| DI-02 ⚖️ `RR/WV` | ♻️ BY-DESIGN | Sekundární refs nevalidované; akceptovaný stav |
| DI-03 🟠 `DUP/IDX` | ♻️ CURRENCY ✅, WEATHER ⬜ | Guard v `world-currencies.service.ts:59` přítomen; `weather_generators` stále bez `{worldId,name}` unique indexu |
| DI-04 🟠 `AT` | ♻️ PAGES.CREATE ✅, WORLDS.CREATE ⬜ | Rollback v `pages.service.ts:208-258` přítomen; `worlds.create` (7 kolekcí bez TX) stále bez transakce |
| DI-05 🟡 `INV/MIR` | ♻️ KÓDEM ✅, BACKFILL ⬜ | Auto-counter `+1/-1` v `worlds.service.ts:1257` přítomen; existující doky v DB mají stale `playerCount` |
| DI-RUN-IDX 🟡 `IDX` | ♻️ OPRAVENO ✅ | Duplicitní indexy na 5 subdoc schématech + UniverseMap odstraněny; schémata HEAD čistá |

### Nové nálezy HEAD sweep

#### DI-RUN-06 🟡 `RR/WV` — `campaignQuickNotes.subjectIds[]` / `storylineIds[]` / `campaignScenarios.subjectIds[]` / `storylineIds[]` / `campaignStorylines.subjectIds[]` / `relationshipIds[]` nevalidované
- **Kde:** `campaign-quick-note.schema.ts:16-17`, `campaign-scenario.schema.ts:16-17`, `campaign-storyline.schema.ts:22-23` — array FK na `campaignSubjects._id`, `campaignStorylines._id`, `campaignRelationships._id` bez referenční validace.
- **Dopad:** dangling po smazání subject/storyline/relationship → array obsahuje mrtvé ID navždy. FE nikdy nedetekuje (žádný error, jen prázdný lookup).
- **Závažnost:** 🟡 — by-design pattern (akceptováno jako DI-02 rozšíření). Dopad měkký: PJ-only nástroje, FE graceful.
- **Návrh:** při delete entity sweep-odebrat ID ze všech odkazujících polí (DB-level cleanup job). Není nutné blokovat.
- **L1 · ♻️** (rozšíření DI-02)

#### DI-RUN-07 🟡 `RR/OR` — `ikaros_discussion_posts.discussionId` a `ikaros_discussion_reports.{discussionId,postId}` bez constraintu
- **Kde:** `ikaros-discussion-post.schema.ts:9` — `discussionId: string` (required, bez ref); `ikaros-discussion-report.schema.ts:15,17` — `discussionId`, `postId` (string FK bez ref).
- **Dopad:** orphan post/report po smazání diskuze; dangling report po smazání postu (post ale nesmazáš — resolved=true). `postId` v reportu = string, post může být smazán úpravou/admin delete.
- **Závažnost:** 🟡 — platformová komunita (ne herní data); orphan reporty jsou admin-only viditelné.
- **Návrh:** cascade delete posts při delete discussion (přesah cascade-delete); reports mají `postContentSnapshot` (denormalizace záměrná dle komentáře), takže dangling `postId` je by-design.
- **L1 · 🆕** pro posts orphan; ⚖️ reports by-design.
- **PROOF-REQUEST PR-07:** `db.ikaros_discussion_posts.aggregate([{$lookup:{from:'ikaros_discussions',localField:'discussionId',foreignField:'_id',as:'d'}},{$match:{'d':{$size:0}}},{$count:'orphans'}])` — orphan posts bez diskuze.

#### DI-RUN-08 🟡 `SET` — `game_events.comments[].parentId` — self-ref bez cyklus-guardu, ale s dangling-parentId validací
- **Kde:** `game-event.schema.ts:18` — `parentId: string | null` embedded; `game-events.service.ts:393-402` — validace: `find comment by parentId` + `parent.parentId !== null` guard (jen 1 úroveň, ne cyklus per se).
- **Stav na HEAD:** guard v service ověřuje (a) `parentId` existuje v `event.comments[]`, (b) parent je root (hloubka max 2). Cyklus prakticky nemožný (embedded array, ne self-collection).
- **Dopad:** minimální — embedded comments nemůžou osiřet do jiné kolekce; validace přítomna.
- **Závažnost:** 🟡 snížena → ⚪ kosmetika. Žádný reálný problém na HEAD.
- **Přehodnocení:** DI-RUN-08 z předchozí registrace = **refutováno**. Guard přítomen, embedded = žádný cross-collection orphan.
- **L2 · 🔓** (uzavřeno jako OK)

#### DI-RUN-09 🟡 `RR/WV` — `campaignShopGroups.parentId` bez existence-validace při create
- **Kde:** `campaign.service.ts:1034-1049` — `createShopGroup` přijímá `dto.parentId` a slepě ukládá bez ověření, že parent group existuje v téže `worldId`.
- **Dopad:** dangling `parentId` → FE stromová struktura zobrazí skupinu bez rodiče (prázdná podúroveň, zmizí). Záměrné 2-úrovňové omezení dle komentáře ve schema.
- **Závažnost:** 🟡 — PJ-only, FE tolerantní (skupina se zobrazí jako root při chybějícím parentu).
- **Návrh:** ověřit existenci parent group před uložením (jednoduchý `findById`).
- **L1 · 🆕**
- **PROOF-REQUEST PR-09:** `db.campaignShopGroups.aggregate([{$match:{parentId:{$exists:true,$ne:null}}},{$addFields:{parentObjId:'$parentId'}},{$lookup:{from:'campaignShopGroups',localField:'parentObjId',foreignField:'_id',as:'p'}},{$match:{'p':{$size:0}}},{$count:'dangling'}])` — dangling parentId groups.

#### DI-RUN-10 🟡 `RR` — `chatmessages.replyToId` bez reference-validace
- **Kde:** `chat-message.schema.ts:23` — `replyToId?: string` (optional string FK na jinou chatmessage `_id`); service vytváří reply bez ověření, že `replyToId` existuje.
- **Dopad:** dangling reply → FE `replyToPreview` zobrazuje snapshot (denormalizovaný `replyToPreview/replyToSenderName`), takže uživatel vidí preview i po smazání originálu. Praktický dopad = žádný (denormalizace záměrná).
- **Závažnost:** 🟡 → ⚖️ by-design (denormalizace záměrná jako DI-02 rozšíření, preview zůstane).
- **L1 · ⚖️**

#### DI-RUN-11 🟡 `STATE` — `world.deletedAt ≠ null` přitom `world.isActive = true` — protichůdný flag možný
- **Kde:** `world.schema.ts:28-31` — oba flagy nezávislé, žádný compound constraint. `deletedAt` nastavuje `softDelete`, `isActive` mění `worlds.service` ručně.
- **Dopad:** svět se zobrazí v listingu `isActive=true` i přes probíhající soft-delete → data leak / zmatenost v discovery (svět by neměl být viditelný po soft-delete).
- **Závažnost:** 🟠 — potenciálně viditelný bug ve world listu po mazání.
- **Návrh:** při soft-delete (`deletedAt` set) vždy atomicky nastavit `isActive=false`; nebo filtrovat list výsledků přes `deletedAt: null` (ne `isActive`).
- **L1 · 🆕**
- **PROOF-REQUEST PR-11:** `db.worlds.countDocuments({deletedAt:{$ne:null},isActive:true})` — počet světů v protichůdném stavu.

#### DI-RUN-12 🟡 `INV` — `character_accounts.balance` ≠ Σ `transactions[].amount` — neověřená invarianta
- **Kde:** `character-account.schema.ts:22,36-37` — `balance: number` + `transactions: Mixed[]` (MixedArray, částky uvnitř Mixed objektu). Balance se aktualizuje aplikačním kódem, ne dopočtem.
- **Dopad:** drift po partial write nebo přímé DB editaci → lživý zůstatek. Závisí na write-atomicitě update servisu.
- **Závažnost:** 🟡 — finanční data, ale drift vznikne jen přes ne-API přístup nebo bug v service.
- **L1 · 🆕**
- **PROOF-REQUEST PR-12:** invariant dotaz — pro každý `character_account`: spočítat `transactions[*].amount` suma vs `balance`; mismatch > 0 = drift. Vyžaduje custom aggregation (Mixed pole).

#### DI-RUN-13 🟡 `CARD` — `bestiae.clonedFromId` string FK bez constraintu na existenci source bestie
- **Kde:** `bestie.schema.ts:38` — `clonedFromId?: string` — odkaz na zdrojovou bestii při klonování; žádná validace existence při clone, žádná cascade při delete zdroje.
- **Dopad:** dangling `clonedFromId` po delete source bestie → audit pole lže, ale funkčnost neovlivní.
- **Závažnost:** 🟡 audit-only, žádný runtime dopad.
- **L1 · 🆕**
- **PROOF-REQUEST PR-13:** `db.bestiae.aggregate([{$match:{clonedFromId:{$exists:true}}},{$lookup:{from:'bestiae',localField:'clonedFromId',foreignField:'_id',as:'src'}},{$match:{'src':{$size:0}}},{$count:'dangling'}])`.

#### DI-RUN-14 🟡 `IDX` — `world_weather_generators` stále bez `{worldId,name}` unique indexu (DI-03 zbytek)
- **Kde:** `weather-generator.schema.ts:46-61` — compound indexy `{worldId}` + `{worldId,displayOrder,createdAt}`, ale žádný `{worldId,name}` unique.
- **Stav:** DI-03 weather zbytek — neměněno od 2026-06-13. Duplikát generátoru se stejným jménem per svět stále možný (při race nebo migraci).
- **Závažnost:** 🟠 → 🟡 (display pole, ne logika). Oprava: unique index po dečištění existujících dup.
- **L2 · ♻️** (potvrzeno na HEAD, stav nezměněn)
- **PROOF-REQUEST PR-14:** `db.world_weather_generators.aggregate([{$group:{_id:{worldId:'$worldId',name:'$name'},n:{$sum:1}}},{$match:{n:{$gt:1}}}])` — dup generátory.

#### DI-RUN-15 🟡 `SHAPE` — `ikaros_messages.conversationId` — empty-string FK místo `null`
- **Kde:** `ikaros-message.schema.ts:21` — `conversationId: string` default `''`. Root zprávy vlákna mají `conversationId = ''` (ne `null`/vlastní `_id`). FK na `ikarosmessages._id` nemůže matchovat empty string → dangling de-facto.
- **Dopad:** threading funguje aplikačně (kořen se hledá jako `conversationId == ''`), ale empty-string jako FK je anti-pattern; $lookup by nikdy nenašel kořen.
- **Závažnost:** 🟡 — by-design pattern (prázdný string = root sentinel), ale křehký.
- **L1 · 🆕**

---

## PROOF-REQUEST

> Všechny tyto scany jsou **read-only**; provádět na dev/staging nebo svět `matrix`, ne na prod bez zálohy.

| ID | Kolekce | Dotaz | Co dokáže |
|---|---|---|---|
| **PR-TYPE** | všechny | `{$group:{_id:{$type:'$worldId'},n:{$sum:1}}}` per kolekce | Potvrdí DI-01: ObjectId jen v custom_emotes, string jinde |
| **PR-OR-WORLD** | `pages`, `characters`, `worldmemberships`, `worldnews`, `timeline_events`, `game_events`, `mapScenes`, `worldMapEntries`, `worldMapFolders`, `dungeonMaps`, `sounds`, `campaignSubjects`, `campaignStorylines`, `campaignScenarios`, atd. | `{$lookup:{from:'worlds',localField:'worldId',foreignField:'_id',as:'w'},$match:{'w':{$size:0}},$count:'orphans'}` (stringová shoda — nutná normalizace `String()`) | Orphan count per world-scoped kolekce |
| **PR-OR-CHAR** | `character_diaries`, `character_calendars`, `character_finances`, `character_inventories`, `character_notes`, `character_accounts` (přes `ownerCharacterIds`) | lookup na `characters._id` | K-DI8: orphan subdoky po hard-delete postavy |
| **PR-IDX** | všechny unikátní indexy | `db.<coll>.getIndexes()` | Ověří C.1: existují indexy reálně v DB? |
| **PR-DUP-MEMBERSHIP** | `worldmemberships` | `{$group:{_id:{u:'$userId',w:'$worldId'},n:{$sum:1}},$match:{n:{$gt:1}}}` | Dvojí membership (race-condition) |
| **PR-PLAYERCOUNT** | `worlds` + `worldmemberships` | pro každý world: `worlds.playerCount` vs `count(memberships role:Hrac)` | DI-05 backfill: kolik světů má špatný count |
| **PR-07** | `ikaros_discussion_posts` | `{$lookup:{from:'ikaros_discussions',...},$match:{'d':{$size:0}},$count:'orphans'}` | Orphan posts bez diskuze |
| **PR-09** | `campaignShopGroups` | lookup `parentId` → self | Dangling parent group |
| **PR-11** | `worlds` | `{deletedAt:{$ne:null},isActive:true}` count | Protichůdný stav soft-delete |
| **PR-12** | `character_accounts` | Σ transactions vs balance | Finance drift invariant |
| **PR-13** | `bestiae` | `clonedFromId` → self lookup | Dangling clone reference |
| **PR-14** | `world_weather_generators` | group `{worldId,name}` count > 1 | Dup generátor |
| **PR-STATE-NPC** | `characters` | `{isNpc:false,userId:{$exists:false}}` count | Persona bez userId (možný osiřelý hráčský char) |
| **PR-STATE-KIND** | `characters` (kind=location) | check subdoc existence mimo `character_calendars` | K-DI14: location má jen calendar subdoc |
| **PR-SLUG-CALENDAR** | `worldsettings` | `timelineCalendarSlug` ∉ `world_calendar_configs.slug` (per worldId) | K-DI7: dangling calendar slug |

---

## Legenda

- 🆕 nový nález · ♻️ potvrzeno na HEAD (beze změny) · 🔓 uzavřeno (refutováno nebo opraveno)
- 🔴 kritické · 🟠 střední · 🟡 nízké · ⚪ kosmetika · ⚖️ by-design
- L1 přečteno · L2 FK graf ověřen · L3 test/index pokrytí · L4 scan s reálnými čísly
