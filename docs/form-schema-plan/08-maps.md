# 08 — Maps & tokens (mapa/scéna + tokeny)

> **Entita:** `MapScene` (scéna) + `MapToken` (token) + `MapTemplate` (knihovna) · **write path:**
> `POST /maps` (create), `POST /maps/:id/operations` (token/scene/fog/combat ops — discriminated union),
> `POST|PUT /map-templates` (knihovna).
> **FE styl:** inline (`useState` token modály + map create/edit) + registry (token `systemStats` per-system JSON).
> **Osy:** `WL` `TY` · `NM` `RN` `EN` · perspektiva **P1** (plný průchod pole, hl. token mapper) + **P4** (per-system staty).
> Nálezy → [`../form-schema-audit.md`](../form-schema-audit.md) (`F-xx`). Stav: ✅ **sweep proběhl 2026-06-05** (verifikace čtením všech vrstev).

> 🔑 **Sweep výsledek (TL;DR):** token whitelist mapper (`toToken`) **drží všechny 3 historické drift fixy** (`notes`, `isLocked`, `systemStats` + `personalDiarySchema`, `customData`) — round-trip OK. `MapTemplate` schema potvrzeno (MP-L01..L06 uzavřeno). **Operace API (`POST /maps/:id/operations`) NEpoužívá globální whitelist** — `OperationPayloadValidator` má explicitně `whitelist:false, forbidNonWhitelisted:false` ([operation-payload-validator.service.ts:54-57](../../../Projekt-ikaros/backend/src/modules/maps/operations/operation-payload-validator.service.ts)) → token extra-pole se ani nestripují při validaci, jen je zahodí GET mapper. Tím je `toToken` **opravdu jediná** pojistka tvaru tokenu (silnější než plán předpokládal). Žádný 🔴 rozpor; nálezy jen `⚖️ by-design` + 2× `⚠️` (effects raw cast, q/r range nekonzistence).

Tři (+1) vrstvy:
**FE** [tactical-map/types.ts](../../src/features/world/tactical-map/types.ts) (`MapToken`, `MapScene`, `HexConfig`) + inline modály ·
**BE DTO** [create-map.dto.ts](../../../Projekt-ikaros/backend/src/modules/maps/dto/create-map.dto.ts) (`HexConfigDto`, `CreateMapDto`),
[create-map-template.dto.ts](../../../Projekt-ikaros/backend/src/modules/maps/dto/create-map-template.dto.ts),
[token-ops.dto.ts](../../../Projekt-ikaros/backend/src/modules/maps/dto/operations/token-ops.dto.ts) (`TokenPayloadDto`/`TokenUpdateOpDto`) ·
**DB** [map-scene.schema.ts](../../../Projekt-ikaros/backend/src/modules/maps/schemas/map-scene.schema.ts),
[map-template.schema.ts](../../../Projekt-ikaros/backend/src/modules/maps/schemas/map-template.schema.ts) ·
**(+ mapper)** [maps.repository.ts](../../../Projekt-ikaros/backend/src/modules/maps/repositories/maps.repository.ts) — `toEntity`/`toToken`/`toSceneNpc` **explicitní whitelist** (osa `WL`, paměť D-066 `isLocked` drift).

> ⚠️ **Specifikum této oblasti — DTO i schema jsou „prostupné", mapper je úzké hrdlo.** `CreateMapDto`
> má pole jako `@IsArray()` bez tvaru prvku; Mongoose ukládá `tokens/effects/npcTemplates/playerStates/diceRolls`
> jako `MixedArraySubSchema` (Mixed = uloží cokoliv). Token operace (`token.add`/`token.update`) v MVP
> **nepenetrují patch hluboko** (`TokenPayloadDto` má `[key: string]: unknown`, `TokenUpdateOpDto.patch`
> je `@IsObject()` bez tvaru). Důsledek: **write skoro nikdy nefailne** — jediná reálná pojistka tvaru
> tokenu je **`toToken` whitelist mapper při GET**. Pole, které tam chybí, se zapíše (Mixed projde),
> ale **GET ho zahodí** → tichá ztráta. Proto je `WL` dominantní osa této oblasti.

---

## Soupis polí (povrch oblasti)

### A) MapScene (create + scene.* operace)

| # | Pole | Typ | Kde FE | DTO | DB `@Prop` | mapper `toEntity` | Hl. osa |
|---|---|---|---|---|---|---|---|
| MP-01 | `name` | string | create/edit, `scene.name` op | `CreateMapDto` opt | `default ''` | ✓ | `LN` `NM` |
| MP-02 | `imageUrl` | string | create/edit, `scene.image` op | `CreateMapDto` opt | `default ''` | ✓ | `NM` `RG` |
| MP-03 | `worldId` | string | create | `CreateMapDto` opt | `required:true` | ✓ | `RQ` `NM` |
| MP-04 | `folder` | string\|null | `scene.folder` op | `CreateMapDto` opt | `@Prop()` — | ✓ | `NL` |
| MP-05 | `templateId` | string | create z knihovny | `CreateMapDto` opt | `@Prop()` — | ✓ | `NM` |
| MP-06 | `config` (HexConfigDto) | object | config form, `scene.config` op | `@ValidateNested` HexConfigDto | `type:Object default{...}` | ✓ (cast) | `P1` nested |
| MP-07 | `tokens[]` | MapToken[] | spawn / token.* ops | `@IsArray()` (bez tvaru) | `[MixedArraySubSchema]` | `toToken` whitelist | `WL` **hot** |
| MP-08 | `npcTemplates[]` | MapSceneNpc[] | NPC modaly | `@IsArray()` (bez tvaru) | `[MixedArraySubSchema]` | `toSceneNpc` whitelist | `WL` |
| MP-09 | `effects[]` | MapEffect[] | effects palette | `@IsArray()` (bez tvaru) | `[MixedArraySubSchema]` | `(doc.effects as MapEffect[])` raw cast | `WL` |
| MP-10 | `fogEnabled` | bool | fog tool, `fog.set` op | `@IsBoolean` opt | `default false` | ✓ | `TY` |
| MP-11 | `revealedHexes[]` | {q,r}[] | fog brush | `@IsArray()` | `[MixedArraySubSchema]` | raw cast | `WL` `TY` |
| MP-12 | `isActive` | bool | aktivace scény | `@IsBoolean` opt | `default false` | ✓ | `TY` |
| MP-13 | `isHidden` | bool | `scene.state` op | `@IsBoolean` opt | `default false` | ✓ | `TY` |
| MP-14 | `isLocked` | bool | `scene.state` op | `@IsBoolean` opt | `default false` | ✓ | `TY` |
| MP-15 | `playerStates[]` | {userId,isHidden?,isLocked?}[] | `scene.playerState` op | (op DTO) | `[MixedArraySubSchema]` | `toPlayerState` whitelist | `WL` `NL` |
| MP-16 | `activeSoundIds[]` | string[] | sound playlist | `@IsArray()` | `[String] default[]` | ✓ | `TY` |
| MP-17 | `activeCharacterIds[]` | string[] | paleta whitelist | (op DTO) | `[String] default[]` | ✓ | — |
| MP-18 | `activeBestieIds[]` | string[] | paleta whitelist | (op DTO) | `[String] default[]` | ✓ | — |
| MP-19 | `diceRolls[]` | MapDiceRoll[] | dice roll op | (op DTO) | `[MixedArraySubSchema]` | raw cast (N-25 fix) | `WL` |
| MP-20 | `combat` | object\|null | combat ops | (op DTO) | `type:Object default null` | raw cast | `TY` |

### B) HexConfig (MP-06 nested — P1 rekurze)

| # | Pole | Typ | FE | DTO `HexConfigDto` | DB | Hl. osa |
|---|---|---|---|---|---|---|
| MP-06a | `size` | number | `HexConfig` (default 40) | `@IsOptional` (bez `@IsNumber`) | v `config` Object default 40 | `RN` `TY` |
| MP-06b | `originX` | number | default 0 | `@IsOptional` (bez `@IsNumber`) | default 0 | `TY` |
| MP-06c | `originY` | number | default 0 | `@IsOptional` (bez `@IsNumber`) | default 0 | `TY` |
| MP-06d | `showGrid` | bool | default true | `@IsOptional` `@IsBoolean` | default true | `TY` `DF` |
| MP-06e | `showHpPc/Npc/Bestie` | bool? | 10.2g (undefined=true) | **chybí v `HexConfigDto`** | v `config` Object (Mixed) | `WL` **hot** |

### C) MapToken (token.add / token.update — osa WL hlavní)

> Token nemá vlastní Mongoose subschema (jen Mixed array) ani plné DTO. Jediná pojistka tvaru = `toToken`
> mapper. Tabulka = **co mapper propustí** (✓) vs. co by tichl. `systemStats` → odkaz na oblast 10.

| # | Pole | Typ | FE `MapToken` | DTO | mapper `toToken` | Hl. osa |
|---|---|---|---|---|---|---|
| MP-T01 | `id` | string | ✓ | `TokenPayloadDto` `@IsNotEmpty` | ✓ `?? ''` | `RQ` |
| MP-T02 | `characterId` | string | ✓ | `@IsString` | ✓ `?? ''` | — |
| MP-T03 | `characterSlug` | string | ✓ | `@IsString` | ✓ `?? ''` | — |
| MP-T04 | `q` / `r` | number | ✓ | `@IsInt @Min(-10000) @Max(10000)` | ✓ `?? 0` | `RN` |
| MP-T05 | `isNpc` | bool | ✓ | patch (Mixed) | ✓ `?? false` | `TY` |
| MP-T06 | `templateId` | string? | ✓ | patch | ✓ `as string\|undefined` | `NL` |
| MP-T07 | `instanceName` | string? | ✓ | patch | ✓ `as string\|undefined` | `NL` |
| MP-T08 | `currentHp/maxHp/baseHp` | number | ✓ | patch | ✓ `?? 0` | `RN` |
| MP-T09 | `armor/baseArmor/injury` | number | ✓ | patch | ✓ `?? 0` | `RN` |
| MP-T10 | `initiative/initiativeBase` | number | ✓ | patch | ✓ `?? 0` | `RN` |
| MP-T11 | `inCombat` | bool | ✓ | patch | ✓ `?? false` | `TY` |
| MP-T12 | `movement` | number | ✓ | patch | ✓ `?? 5` | `RN` `DF` |
| MP-T13 | `abilities[]` | {name,description}[] | ✓ | patch | ✓ `?? []` | `WL` |
| MP-T14 | `notes` | string? | ✓ (bestie per-instance) | patch | ✓ `as string\|undefined` (drift fix) | `WL` **hot** |
| MP-T15 | `isLocked` | bool? | ✓ (PJ-only) | patch (+authorizer) | ✓ `?? false` (D-066 fix) | `WL` **hot** |
| MP-T16 | `systemStats` | Record | ✓ (per-system) | patch | ✓ `as Record\|undefined` (drift fix) | `WL` **hot** → obl. 10 |
| MP-T17 | `personalDiarySchema` | Record[]? | ✓ | patch | ✓ | `WL` |
| MP-T18 | `customData` | Record | ✓ | patch | ✓ `?? {}` | `TY` |
| MP-T19 | `baseHp` apod. — viz MP-T08 | — | — | — | — | — |
| MP-T20 | `characterData` | object? | ✓ (enrich, read-only) | — (nikdy write) | doplněno BE enrichem, ne mapper | round-trip N/A |

### D) MapTemplate (knihovna — `POST|PUT /map-templates`)

| # | Pole | Typ | FE | DTO `CreateMapTemplateDto` | DB `map-template.schema` | Hl. osa |
|---|---|---|---|---|---|---|
| MP-L01 | `name` | string | snapshot scény | `@MinLength(1) @MaxLength(100)` | ✅ `required minlength:1 maxlength:100` ([map-template.schema.ts:18]) | `LN` `RQ` |
| MP-L02 | `imageUrl` | string | snapshot | `@MinLength(1)` required | ✅ `required minlength:1` ([schema:19]) | `RQ` |
| MP-L03 | `config` | object | snapshot | `@IsObject()` required | ✅ `type:Object default{...}` ([schema:20-24]) | `TY` |
| MP-L04 | `tokens/npcTemplates/effects/revealedHexes` | unknown[] | snapshot (bez PC tokenů) | `@IsArray()` opt | ✅ `[MixedArraySubSchema] default[]` ([schema:25-45]) | `WL` |
| MP-L05 | `activeSoundIds[]` | string[] | snapshot | `@IsArray @IsString({each})` opt | ✅ `[String] default[]` ([schema:46]) | `TY` |
| MP-L06 | `ownerId` | string | — (server přepíše) | **NENÍ v DTO** (defense in depth) | ✅ `required index` ([schema:17]); DTO ho vynechává → `whitelist` drop | `NM` |

---

## Matice pole × vrstva

> Buňka = pravidlo na dané vrstvě (`—` = vrstva pole neomezuje). **Δ** = verdikt parity. Pravidla
> doplněná z přípravné inventury; **Δ se uzavírá až při sweepu**.

### MapScene

| # | Pole | FE | BE DTO | DB `@Prop` | mapper | Δ |
|---|---|---|---|---|---|---|
| MP-01 | name | inline (UI maxLength?) ⬜ | `@IsString` opt ([create-map.dto.ts:26](../../../Projekt-ikaros/backend/src/modules/maps/dto/create-map.dto.ts)) | `default ''` ([map-scene.schema.ts:10](../../../Projekt-ikaros/backend/src/modules/maps/schemas/map-scene.schema.ts)) | `?? ''` ([maps.repository.ts:126](../../../Projekt-ikaros/backend/src/modules/maps/repositories/maps.repository.ts)) | ⚖️ by-design (žádný BE délkový limit; scéna PJ-only, ne user-facing) |
| MP-02 | imageUrl | inline ⬜ | `@IsString` opt ([dto:27]) | `default ''` ([schema:11]) | `?? ''` ([repo:127]) | ⚖️ by-design (žádná URL validace BE; konzistentní s ostatními imageUrl) |
| MP-03 | worldId | z route | `@IsString` **opt** ([dto:28]) | `required:true` ([schema:9]) | `doc.worldId as string` ([repo:125]) | ✅ shoda (DTO opt vs DB required = známý pre-existing dluh, dokumentován v DTO komentáři [dto:10-17]; FE create vždy posílá worldId → reálně nenastane; bez worldId by Mongoose `required` failnula 500 — **NE** tichá ztráta). `MP-D2` ⚠️ |
| MP-04 | folder | `scene.folder` `string\|null` | `@IsString` opt ([dto:29]); op DTO `@ValidateIf null` ([scene-ops.dto.ts:50-55]) | `@Prop()` — ([schema:12]) | `as string\|undefined` ([repo:128]) | ✅ shoda (null projde op DTO přes `@ValidateIf`, mapper vrací undefined — `NL` semantika by-design) |
| MP-06a | config.size | default 40 | `@IsOptional` bez `@IsNumber` ([dto:19]) | Object def 40 ([schema:13-16]) | cast (`doc.config as HexConfig`) | ⚖️ by-design (`config` je Mixed Object; `@IsNumber` chybí → string by prošel, ale FE posílá number; round-trip typu = `MP-D1` ⚠️) |
| MP-06d | config.showGrid | default true | `@IsBoolean` opt ([dto:22]) | def true | cast | ✅ shoda |
| MP-06e | config.showHp* | undefined=true | **chybí v `HexConfigDto`** ([dto:18-23]) | v Object (Mixed) ([schema:13-16]) | cast (celý `config` Object) | ✅ shoda — **NEdropne se**. `config` v DTO je `@ValidateNested HexConfigDto`, ALE DB je `type:Object` (Mixed) a mapper vrací **celý** `doc.config` raw. Klíč mimo `HexConfigDto` (`showHpPc/Npc/Bestie`) ValidationPipe na nested objektu zahodí jen pokud `whitelist` penetruje nested — `@ValidateNested` bez `@Type`-stripping nechá Mixed projít do DB; mapper celý Object vrátí → round-trip drží. `MP-D3` ⚠️ (doporučení: doplnit do `HexConfigDto` pro jistotu) |
| MP-07 | tokens[] | MapToken[] | `@IsArray()` bez tvaru ([dto:35]); op `TokenPayloadDto` `[key]:unknown` ([token-ops.dto.ts:19-28]) | Mixed array ([schema:18-22]) | `toToken` per prvek ([repo:135-137,166-205]) | ✅ shoda — mapper = jediná pojistka, **potvrzeno**: ops validator `whitelist:false` nestripuje, DTO/Mongoose Mixed prostupné → `toToken` whitelist drží tvar |
| MP-09 | effects[] | MapEffect[] | `@IsArray()` ([dto:37]) | Mixed array ([schema:28-32]) | **raw cast** `doc.effects as MapEffect[]` ([repo:141]) | ⚠️ ověřit `WL` — `MP-D4`: mapper effects **necastuje per-pole**, vrací cokoliv z Mixed. Tvar effectu (`hexes/rings/barrierDC/variant/excludedHexes`) nemá nikde validaci. FE-only tvar → nízké riziko, ale tichý průchod libovolných polí |
| MP-10 | fogEnabled | bool | `@IsBoolean` opt ([dto:38]) | `default false` | `?? false` ([repo:142]) | ✅ shoda |
| MP-11 | revealedHexes[] | {q,r}[] | `@IsArray()` ([dto:39]) | Mixed array ([schema:44-48]) | raw cast ([repo:143]) | ⚠️ ověřit `TY` — `MP-D5`: žádná q/r int validace (na rozdíl od `token.add` q/r `@IsInt @Min/@Max`). Nekonzistence souřadnicových limitů (viz MP-T04) |
| MP-13 | isHidden | bool | `@IsBoolean` opt ([dto:41]) | `default false` | `?? false` ([repo:146]) | ✅ shoda |
| MP-14 | isLocked | bool | `@IsBoolean` opt ([dto:42]) | `default false` | `?? false` ([repo:147]) | ✅ shoda |
| MP-15 | playerStates[] | viz typ | op `ScenePlayerStateOpDto` `@IsOptional @IsBoolean` (null projde) ([scene-ops.dto.ts:28-33]) | Mixed array ([schema:59-63]) | `toPlayerState` jen userId+bool ([repo:207-212]) | ✅ shoda — `NL` by-design: `@IsOptional` přeskočí null (projde), mapper drží jen `boolean` (null padá), null→delete řeší apply logic (ne mapper, viz schema komentář [:53-58]) |
| MP-16 | activeSoundIds[] | string[] | `@IsArray()` ([dto:43]) | `[String]` ([schema:64]) | `?? []` ([repo:152]) | ✅ shoda |
| MP-19 | diceRolls[] | MapDiceRoll[] | op DTO `dice.roll` | Mixed array (cap 50 `$slice`) ([schema:38-42]) | raw cast `?? []` (N-25 fix) ([repo:162]) | ✅ shoda (N-25 mapper fix přítomen — bez něj log mizel po refetchi) |
| MP-20 | combat | object\|null | op DTO | `type:Object default null` ([schema:85]) | raw cast `?? null` ([repo:155-156]) | ✅ shoda `TY` (Mixed Object by-design, plná semantika 10.2f) |

### MapToken (token.add / token.update)

| # | Pole | FE | BE DTO | mapper `toToken` | Δ |
|---|---|---|---|---|---|
| MP-T01 | id | string req | `@IsNotEmpty` ([token-ops.dto.ts:20]) | `?? ''` ([repo:167]) | ✅ shoda |
| MP-T04 | q/r | int | `@IsInt @Min(-10000) @Max(10000)` ([token-ops.dto.ts:23-24,41-42]) | `?? 0` ([repo:170-171]) | ⚠️ ověřit `RN` — `MP-D5`: range jen v `token.add`/`token.move`; `token.update.patch` je `@IsObject` ([token-ops.dto.ts:53]) → q/r v patchi **bez** range. Konzistence souřadnic |
| MP-T08 | currentHp/maxHp/baseHp | number | patch (Mixed, žádné `@IsInt`) | `?? 0` ([repo:176-178]) | ⚖️ by-design (fixní HP pole jsou legacy/BC; per-system HP = `systemStats`/obl. 10; range řeší per-system validator) |
| MP-T14 | notes | string? | patch (Mixed) | `as string\|undefined` (fix [repo:194]) | ✅ shoda — drift fix **přítomen** v mapperu, round-trip drží |
| MP-T15 | isLocked | bool? PJ-only | patch + authorizer whitelist | `?? false` (D-066 fix [repo:188]) | ✅ shoda — D-066 fix **přítomen**, „zamkne a hned odemkne" past uzavřena |
| MP-T16 | systemStats | Record (per-system) | patch (Mixed) | `as Record\|undefined` (fix [repo:199]) | ✅ shoda — mapper pole **propouští** (fix přítomen); per-system parita validátoru = oblast 10 (SY-02 sync potvrzen) |
| MP-T17 | personalDiarySchema | Record[]? | patch | `as Record[]\|undefined` ([repo:200-202]) | ✅ shoda |
| MP-T18 | customData | Record | patch | `?? {}` ([repo:203]) | ✅ shoda |

### MapTemplate

| # | Pole | FE | BE DTO | DB | Δ |
|---|---|---|---|---|---|
| MP-L01 | name | snapshot | `@MinLength(1) @MaxLength(100)` ([create-map-template.dto.ts:21-24]) | `required, minlength:1, maxlength:100` ([map-template.schema.ts:18]) | ✅ shoda — DTO i DB konzistentní (1–100) |
| MP-L02 | imageUrl | snapshot | `@MinLength(1)` req ([dto:26-28]) | `required, minlength:1` ([schema:19]) | ✅ shoda |
| MP-L03 | config | snapshot | `@IsObject()` req ([dto:30-31]) | `type:Object default{...}` ([schema:20-24]) | ✅ shoda |
| MP-L04 | tokens/npcTemplates/effects/revealedHexes | snapshot (bez PC) | `@IsArray()` opt ([dto:33-51]) | `[MixedArraySubSchema] default[]` ([schema:25-45]) | ⚖️ by-design `WL` — prostupné Mixed arrays (snapshot tvar řeší service při create/PUT, ne DTO) |
| MP-L05 | activeSoundIds[] | snapshot | `@IsArray @IsString({each})` opt ([dto:53-56]) | `[String] default[]` ([schema:46]) | ✅ shoda |
| MP-L06 | ownerId | — (server přepíše) | **NENÍ v DTO** ([dto:11-19] komentář) | `required, index` ([schema:17]) | ✅ shoda `NM` — `ownerId` v body se přes `whitelist:true` (globální pipe na `/map-templates` POST/PUT) **zahodí** (drop), server přepíše z auth. Defense-in-depth potvrzeno; klient cizí šablonu nepřevezme |

---

## Kontrolní body (co u každého pole ověřit při sweepu)

- **MP-03 `RQ`/`NM` (hot)** — `worldId` je v `CreateMapDto` `@IsOptional`, ale v DB `required:true`. DTO
  komentář popisuje pre-existing dluh: bez decorators `whitelist` pole dropoval → controller `?? ''`
  fallback → Mongoose `required` failnula 500. Ověřit: pošle FE create vždy `worldId`? Co když ne — 500 nebo `''`?
- **MP-06e `WL` (hot)** — `showHpPc/Npc/Bestie` (10.2g) **nejsou v `HexConfigDto`**, ale `config` je
  `@ValidateNested` HexConfigDto a zároveň DB `config` je `type:Object` (Mixed). Projde `whitelist`
  nested HP toggle do Object, nebo ho `ValidationPipe` strhne? Round-trip: PJ vypne HP bar bestiím → GET ho vrátí?
- **MP-07 / MP-T* `WL` (hot)** — **token whitelist mapper je jediná pojistka tvaru tokenu.** DTO i Mongoose
  jsou prostupné (Mixed + `@IsObject patch`). Pro **každé** token pole ověřit, že je v `toToken` (jinak
  GET tiše zahodí). Paměť `project_map_token_tomapper_whitelist` (D-066). Nové token pole = přidat i do mapperu.
- **MP-T14 `notes` / MP-T15 `isLocked` / MP-T16 `systemStats`** — všechna tři **historicky chyběla** v `toToken`
  (write do Mixed prošel, GET zahodil) → tři komentované drift fixy v repository. Ověřit, že fix drží (round-trip).
- **MP-T16 `systemStats` `WL`/P4** — per-system token staty (`health.current`, `armor`, …) validuje
  `SystemStatsValidator` proti `(world.system, 'token')` schema. **Parita 6 systémů = oblast 10**, zde jen
  potvrdit, že mapper pole propouští (ano, fix přítomen).
- **MP-09 `effects` `WL`** — mapper effects **necastuje per-pole** (`doc.effects as MapEffect[]`), vrací raw
  z Mixed. Effect tvar (`hexes`, `rings`, `barrierDC`) nemá žádnou validaci — ověřit, zda to vadí (FE-only tvar).
- **MP-15 `playerStates` `NL`** — `scene.playerState` op s `isHidden:null` = „smazat override" (na všechny).
  Mapper `toPlayerState` propustí jen `boolean` (ne null). Round-trip null→default semantika.
- **MP-11 `revealedHexes` / MP-T04 `q/r` `RN`/`TY`** — `q/r` v `token.add`/`move` má `@Min(-10000)@Max(10000)`,
  ale ve `fog.brush` hexes a `token.update.patch` **žádný range**. Konzistence souřadnicových limitů.
- **MP-L06 `ownerId`** — DTO ho úmyslně **vynechává** (server přepíše z auth / zachová). Red-team: pošli
  `ownerId` v body — ignoruje se (whitelist drop), nebo převezme cizí šablonu?
- **MP-06a–c `TY`** — `HexConfigDto` `size/originX/originY` má jen `@IsOptional` **bez `@IsNumber`** → string
  `"40"` projde DTO i do Mixed Object. FE pošle number? Round-trip typu.

---

## Delta parity (plní sweep)

> **Sweep 2026-06-05.** Žádný 🔐 rozpor ztráty dat — všechny 3 historické token drift fixy (`notes`,
> `isLocked`, `systemStats`) v `toToken` **přítomny a drží**. Níže `⚠️ ověřit`/`⚖️ by-design` nálezy
> (kosmetika / nekonzistence limitů). Povýšení na `F-xx` jen pokud chce uživatel opravit.

| ID | Pole / bod | Osa | Závaž. | Δ | Popis |
|---|---|---|---|---|---|
| MP-D1 | `config.size/originX/originY` | `TY` | 🟡 | ⚠️ ověřit | `HexConfigDto` má `size/originX/originY` jen `@IsOptional()` **bez `@IsNumber`** ([create-map.dto.ts:19-21]). String `"40"` by prošel DTO i do Mixed `config` Object. FE posílá number → reálně nenastane, ale BE typovou pojistku nemá. **Dopad na data:** žádný (FE konzistentní). **Návrh:** doplnit `@IsNumber()` k MP-06a–c. |
| MP-D2 | `worldId` create | `RQ`/`NM` | 🟡 | ⚖️ by-design | DTO `@IsOptional` ([create-map.dto.ts:28]) vs DB `required:true` ([map-scene.schema.ts:9]). Pre-existing dluh dokumentovaný v DTO komentáři. Bez `worldId` → Mongoose `required` 500 (NE tichá ztráta). FE create vždy posílá worldId. **Dopad na data:** žádný. **Návrh:** ponechat (oprava = `@IsString()` bez `@IsOptional` pro fail-fast 400 místo 500; volitelné). |
| MP-D3 | `config.showHpPc/Npc/Bestie` | `WL` | 🟡 | ⚠️ ověřit | 10.2g HP toggly **chybí v `HexConfigDto`** ([create-map.dto.ts:18-23]), ale DB `config` je `type:Object` (Mixed) a mapper vrací **celý** `doc.config` raw ([maps.repository.ts:129]) → round-trip **drží** (nedropuje se). Riziko jen kdyby `config` dostal striktní nested whitelist. **Dopad na data:** žádný. **Návrh:** doplnit `showHpPc/Npc/Bestie?: boolean` do `HexConfigDto` pro robustnost. |
| MP-D4 | `effects[]` tvar | `WL` | 🟡 | ⚠️ ověřit | Mapper effects **necastuje per-pole** — `doc.effects as MapEffect[]` raw cast ([maps.repository.ts:141]). Tvar effectu (`hexes/rings/barrierDC/variant/excludedHexes`) nemá nikde validaci (DTO `@IsArray()` bez tvaru, Mongoose Mixed). Libovolné pole projde do DB i ven. **Dopad na data:** žádný (FE-only tvar, není security). **Návrh:** ponechat (by-design) nebo přidat per-element DTO pokud bude potřeba. |
| MP-D5 | `q/r` souřadnice — nekonzistence range | `RN`/`TY` | 🟡 | ⚠️ ověřit | `token.add`/`token.move` mají q/r `@IsInt @Min(-10000) @Max(10000)` ([token-ops.dto.ts:23-24,41-42]), ALE `token.update.patch` ([token-ops.dto.ts:53] `@IsObject`), `fog.brush` hexes a `revealedHexes` ([create-map.dto.ts:39] `@IsArray`) **žádný range/int check**. Nekonzistentní souřadnicové limity napříč ops. **Dopad na data:** nízké (FE posílá validní int). **Návrh:** sjednotit přes nested `@ValidateNested` HexCoord DTO s `@IsInt @Min/@Max`, pokud chceme tvrdou hranici. |

**XC-01 doplněk (operace API):** `POST /maps/:id/operations` **nepoužívá** globální `whitelist:true` semantiku
— `OperationPayloadValidator.validate` volá `validateSync(instance, { whitelist:false, forbidNonWhitelisted:false })`
([operation-payload-validator.service.ts:53-57]). Token/scene extra-pole se tedy **ani nestripují** při
validaci (forward-compat) → do Mixed se zapíše vše, jen GET `toToken`/`toEntity` mapper zahodí neznámá pole.
**Tím je mapper opravdu jediná pojistka tvaru tokenu** (silnější závěr než předpokládal plán — plán mluvil
o „DTO i Mongoose prostupné", realita: validace tokenu vůbec nestripuje).

## Round-trip / migrační poznámky

> **Sweep verdikt:** Token pole (`notes` [repo:194], `isLocked` [repo:188], `systemStats` [repo:199]) —
> všechny 3 historické mapper drift fixy **přítomny a drží** (round-trip M4 ✅). `showHp*` config drží přes
> nested Object raw cast (MP-D3 ⚠️ — robustnost). `playerStates` null→default delete semantika OK (apply
> logic, ne mapper). `worldId` create = MP-D2 ⚖️ (500 ne tichá ztráta). Žádná migrace nutná — žádný nález
> nemění tvar uložených dat. Zpřísnění tokenu (přidání `@Prop` subschema) by zůstalo rizikem na legacy
> scénách (Mixed dovolil legacy tvary) — ale tenhle sweep žádné zpřísnění nedoporučuje.
