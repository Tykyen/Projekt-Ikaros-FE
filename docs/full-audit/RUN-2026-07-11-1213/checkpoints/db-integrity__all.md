# checkpoint db-integrity__all

STATUS: DONE (RUN 2026-07-11-1213) · READ-ONLY · úroveň L1–L3 (statika); L4 čísla = viz `proof__db.md`
STYL: db-integrity (registr `docs/db-integrity-audit.md`, prefix `DI-`)
ROZSAH: všech ~90 `@Schema` v `backend/src/modules/**/schemas/*.schema.ts` + repo/service hot-query vzory.
Prošel jsem: README + 00-cross-cutting + tools/integrity-scan + registr `db-integrity-audit.md` + předchozí checkpoint (DI-RUN-09..13) + `proof__db.md` (+db našel 1 orphan, scanner ověřen sensitivity testem).

---

## Shrnutí

- **#🆕 = 4** (DI-RUN-14..17) · **#♻️ = 2** (DI-RUN-18/19, rozšíření DI-02/DI-05) · **#🔓 = 0**
- **🔴 = 0.** Nejzávažnější = 🟡 (chybějící indexy na moderačních DSA-audit query + slepé místo scanneru na nových kolekcích).
- **DI-01 (custom_emotes ObjectId mina) beze změny** — potvrzeno grepem `Types.ObjectId` napříč všemi schématy: `custom_emotes.worldId/createdBy` (`custom-emote.schema.ts:9-10,25-26`) je **JEDINÁ** kolekce s ObjectId FK, `ref:` = 0 nikde. **TYPE konzistence drží i přes ~15 nových kolekcí** (všechna nová FK pole = `string`).
- **Union `@Prop({ type: String })` (25 schémat) = ✅ NENÍ riziko** — viz sekce D.

Klasifikace: 🆕 = nový nález (kolekce/vzor, co plán z 2026-06-13 nepokryl) · ♻️ = rozšíření existujícího DI-nálezu · 🔓 = regrese už opraveného.

---

## A. Nové nálezy (🆕)

### DI-RUN-14 🟡 `IDX` 🆕 — `content_reports` chybí indexy na dvou reálných query cestách
- **Kde:** [`content-report.schema.ts:55`](../../../../Projekt-ikaros/backend/src/modules/moderation/schemas/content-report.schema.ts#L55) — jediný index `{status:1, category:1, createdAtUtc:-1}`.
- **Query bez indexu** (repo [`content-reports.repository.ts`](../../../../Projekt-ikaros/backend/src/modules/moderation/repositories/content-reports.repository.ts)):
  - `:96` `.find({ reporterId })` — „moje reporty" (GDPR náhled) → **collscan**.
  - `:110` `.find({ targetType, targetId })` — „reporty na tento obsah" → **collscan**.
- **Asymetrie:** sourozenec `moderation_decisions` index `{targetType,targetId}` **má** ([`moderation-decision.schema.ts:53`](../../../../Projekt-ikaros/backend/src/modules/moderation/schemas/moderation-decision.schema.ts#L53)), `content_reports` **ne** — nekonzistence mezi dvěma kolekcemi téhož modulu.
- **Dopad:** dnes malý objem (0 dopad), ale reporty se **NEMAŽOU** (DSA audit stopa) → kolekce roste monotónně → collscan degraduje. **Vratné?** Ano (`createIndex`). **Návrh:** `{reporterId:1, createdAtUtc:-1}` + `{targetType:1, targetId:1}`.

### DI-RUN-15 🟡 `IDX` 🆕 — `moderation_appeals` bez JEDINÉHO indexu, ale query po `decisionId`/`status`
- **Kde:** [`moderation-appeal.schema.ts:29-31`](../../../../Projekt-ikaros/backend/src/modules/moderation/schemas/moderation-appeal.schema.ts#L29) — `SchemaFactory.createForClass` bez `.index()`, žádný index kromě `_id`.
- **Query bez indexu** ([`moderation-appeals.repository.ts:47-49,64`](../../../../Projekt-ikaros/backend/src/modules/moderation/repositories/moderation-appeals.repository.ts#L47)): `findByDecision` `.find({ decisionId })` + `.find({ status })` → **collscan**.
- **Dopad:** odvolání se také nemažou (DSA čl. 20 audit) → roste; příznak jako DI-RUN-14. **Návrh:** `{decisionId:1}` + `{status:1, createdAtUtc:-1}`.
- **Pozn. (mimo IDX):** schema komentář sám přiznává nevynucený invariant `reviewerId != decision.moderatorId` (self-review) — vynucuje se až v service ([`moderation.service.ts:434,464`](../../../../Projekt-ikaros/backend/src/modules/moderation/moderation.service.ts#L434), `APPEAL_SELF_REVIEW_FORBIDDEN`) → runtime OK, DB constraint žádný (přijatelné, low).

### DI-RUN-16 ⚪ `IDX` 🆕 — redundantní single-field indexy zastíněné compound prefixem (index bloat)
> Třída jako `DI-RUN-IDX` z RUN 2026-06-20 (duplicitní index warning), ale tady „prefix shadow" — single index je prefixem compoundu → nikdy se nepoužije, jen write-amplifikace + storage.
- [`world-elevation.schema.ts:16,26`](../../../../Projekt-ikaros/backend/src/modules/world-elevations/schemas/world-elevation.schema.ts#L16) — `userId` `index:true` je **prefix** compound unique `{userId,worldId}` → redundantní. (`worldId` single `:17` legitimní — druhá pozice.)
- [`plant.schema.ts:57,78`](../../../../Projekt-ikaros/backend/src/modules/plants/schemas/plant.schema.ts#L57) — `status` `index:true` je prefix `{status,rarity}` (`:78`) → redundantní.
- [`bestie-comment.schema.ts:16,38`](../../../../Projekt-ikaros/backend/src/modules/bestiae/schemas/bestie-comment.schema.ts#L16) — `bestieId` `index:true` je prefix `{bestieId,targetType,systemId,createdAt}` (`:38`) → redundantní; navíc `targetType` single (`:18`) má 2 hodnoty = nízká selektivita, skoro k ničemu.
- **Dopad:** kosmetika/výkon (write-amp na malých kolekcích zanedbatelný). **Návrh:** zrušit prefixové single indexy, ponechat compound.

### DI-RUN-17 🟡 `OR`/scan-coverage 🆕 — scanner slepý na ~15 nových kolekcí (false-negative orphan/dangling)
> `proof__db.md` potvrdil, že scanner **funguje** (sensitivity 0→1 + trefený planted `_id`). Problém = **pokrytí**: `WORLD_SCOPED` + FK cíle v [`tools/integrity-scan.md:79-83`](../../../db-integrity-plan/tools/integrity-scan.md) jsou z 2026-06-13 a nová schémata tam nejsou → scan je na nich systematicky 0 (ne protože je čisto, ale protože se nedívá).
- **World-scoped chybí ze scanu:** `entity_schema_versions` (worldId), `nabory` (worldId opt), `world_elevations` (worldId), `dungeonMaps`, `world_weather_generator_sets`, `custom_weather_presets`, `weather_history`.
- **User-scoped orphan po hard-delete usera (mimo scan):** `campsavedgames.userId`, `upload_consents.userId`, `content_reports.reporterId`, `moderation_appeals.appellantId`, `content_licenses.ownerUserId`, `username_change_requests.userId`, `ikaros_events.authorId/attendeeUserIds[]`, `anon_bans.bannedBy`.
- **Community-scoped (bez worldId, ale FK autor/parent):** `plants.authorId/approvedBy`, `bestie_comments.bestieId/authorId` (orphan po hard-delete bestie).
- **Dopad:** L4 čísla z `proof__db.md` jsou pravdivá jen pro pokryté kolekce; nové mají **neměřené** orphan riziko. **Vratné?** Ano (doplnit kolekce do scan listu, rerun). **Návrh:** rozšířit `WORLD_SCOPED` + přidat `characterId`-styl subdoc scan i pro user-scoped kolekce. ♻️ Přesah `CD-RUN-14/15` (cascade strana téhož gapu).

---

## B. Rozšíření existujících nálezů (♻️)

### DI-RUN-18 ♻️ `RR`/`WV` — nové moduly rozšiřují DI-02 třídu (string FK bez ref + bez write-validace)
> DI-02 = **⚖️ by-design/akceptováno** (rozhodnutí uživatele 2026-06-13). Nové výskyty stejné třídy, převážně **záměrný decoupling**:
- **moderation** ([`content-report.schema.ts:21,26,34`](../../../../Projekt-ikaros/backend/src/modules/moderation/schemas/content-report.schema.ts#L21)) — `targetId`/`targetAuthorId`/`reporterId`/`worldId` string FK bez validace. **Explicitně by-design** (schema komentář: „modul se nesmí vázat na 11 cílových modulů, server je jen uloží" + FE posílá snapshot). `moderation_decisions.reportId/appealId`, `moderation_appeals.decisionId` — interní FK bez ref, ale resolvují se `findById` v service (dangling → prázdno, ne crash).
- **nabory** ([`nabor.schema.ts:11,23,26`](../../../../Projekt-ikaros/backend/src/modules/nabory/schemas/nabor.schema.ts#L11)) — `worldId`/`authorId`/`reportedBy[]` bez ref/validace.
- **content_licenses** ([`content-license.schema.ts:32`](../../../../Projekt-ikaros/backend/src/modules/content-licenses/schemas/content-license.schema.ts#L32)) — `parentContentId?` self-ref (clone lineage) bez guardu; append-only → cyklus nevzniká zápisem, dangling neškodí.
- **Verdikt:** stejná úvaha jako DI-02 (FE graceful, ref se nezmatchuje / má fallback). Ponechat akceptované; nenavyšovat severitu. Pozn.: `content_reports`/`moderation_*` navíc **NEMAŽOU** → dangling je zde méně pravděpodobný (cíl se maže, report zůstává jako záměrný audit).

### DI-RUN-19 ⚪ `MIR` — `nabory` denormalizovaný snapshot světa bez re-sync
- **Kde:** [`nabor.schema.ts:12-13`](../../../../Projekt-ikaros/backend/src/modules/nabory/schemas/nabor.schema.ts#L12) — `worldSlug`/`worldName` uloženy při create ([`nabory.service.ts:116`](../../../../Projekt-ikaros/backend/src/modules/nabory/nabory.service.ts#L116)), žádný `world.updated` listener → po přejmenování světa **stale label** na nástěnce náborů.
- **Dopad:** kosmetika (zastaralé jméno světa v lístku LFG). Třída jako DI-05/MIR (na rozdíl od `membership.avatarUrl`, který sync **má**). **Návrh:** buď resolve worldName za běhu, nebo `world.updated` listener. Low.

---

## C. Ověřeno OK (✅ — ne-nálezy, ať se to znovu netestuje)

- **TYPE konzistence napříč novými kolekcemi** — všechna FK pole (`userId`/`worldId`/`authorId`/`targetId`/`bestieId`/`decisionId`…) v ~15 nových schématech = `string`. Žádná nová ObjectId mina. `custom_emotes` zůstává jediná odchylka (DI-01, 🟡, nízká priorita).
- **Unique constraints nových kolekcí sedí:** `campsavedgames.userId` unique (1 slot/hráč), `camproomconfigs.room` unique, `anon_bans.anonId` unique, `world_elevations {userId,worldId}` unique, `entity_schema_versions {worldId,entityType,version}` unique, `content_licenses {contentId,versionId}` unique, `username_change_requests` partial `{userId,status:pending}`. Žádná chybějící zamýšlená unikátnost mezi novými (na rozdíl od DI-03 weather/currency).
- **analytics_events** — GDPR-čisté (žádné PII/userId), TTL 90d index, agregační indexy sedí. Bez FK. Čisté.
- **user supporter (19.4)** — index `{isSupporter, supporterSince}` ([`user.schema.ts:197`](../../../../Projekt-ikaros/backend/src/modules/users/schemas/user.schema.ts#L197)) pokrývá zeď podporovatelů. OK.
- **game_events.comments[].parentId** self-ref (DI-RUN-08) a **ikaros_discussion_posts** (DI-RUN-07) beze změny — zůstávají ⬜ (čekají +db counts), neduplikuji.

---

## D. Verdikt na union `@Prop({ type: String })` (25 schémat, zadání)

**✅ NENÍ integritní riziko — naopak správně.** Vzor `@Prop({ type: String }) x?: 'a' | 'b'` (příklady: `plant.imageFit?: 'cover'|'contain'` [`:32`](../../../../Projekt-ikaros/backend/src/modules/plants/schemas/plant.schema.ts#L32), `ikaros-event.imageFit` [`:22`](../../../../Projekt-ikaros/backend/src/modules/ikaros-events/schemas/ikaros-event.schema.ts#L22), `chat-message.replyToId/overridePageSlug`, `moderation` enum discriminátory) říká Mongoose, aby union-typované pole **kastoval na String** místo defaultu `Mixed`. Bez `type: String` by union skončil jako **Mixed** (bez castu/validace) — to by integritu **zhoršilo**. Přidání je tedy zpevnění, ne díra.

- **Reprezentace:** union `type: String` neovlivňuje FK typovou konzistenci — hodnota je stále `string`, kompatibilní se scan `String()`-normalizací.
- **Reziduum (nízké, sémantické):** část union polí nemá `enum:` constraint (volný string, např. `chat-message.overrideName`, `nabor.status/mode`, `content_license.licenseMode`) → lze uložit hodnotu mimo zamýšlenou množinu (validaci drží jen service/DTO). To je vlastnost `WV`/`STATE`, ne regrese z `type: String`; spadá pod již akceptovanou DI-02 filozofii (schema volné, doména validuje).
- **FK mezi union poli:** žádné — union `type: String` pole jsou enumy/diskriminátory/volný text, ne cross-collection reference. Žádné nové orphan/dangling riziko.

---

## Zbývá / předáno

- **+db (M-SCAN/M-IDX):** rozšířit scan list o kolekce z DI-RUN-17, pak rerun pro reálné orphan counts nových kolekcí. `getIndexes()` vs schema pro potvrzení DI-RUN-14/15/16 driftu na živé DB.
- **Nezměněné dluhy z registru:** DI-03 weather `{worldId,name}` dedup+index, `worlds.create` cleanup, playerCount backfill, DI-RUN-06/07/08 — vše čeká +db, nezdvojuji.
