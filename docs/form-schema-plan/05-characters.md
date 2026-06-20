# 05 — Characters (Create/Update/ConvertCharacterDto)

> **Entita:** `Character` (subdoc kontejner postavy / NPC / Lokace) · **write path:** `POST /worlds/:worldId/characters`, `PATCH .../characters/:slug`, `PATCH .../characters/:slug/convert`.
> **FE styl:** **inline** (bez zod). ⚠ Tvorba postavy **neprobíhá přímo** přes `useCreateCharacter` — Character entitu zakládá BE-side `pages.service` při create/update `Page` typu `Postava hráče` / `NPC` / `Lokace` (sjednocení 9.1). FE editor zadává `title`/`ownerUserId` na **Page**, BE z nich odvodí `name`/`slug`/`isNpc`/`kind`/`userId` postavy.
> **Osy:** `RQ` `EN` `WL` · perspektivy **P1** (plný průchod pole) + **P2** (round-trip persistence subdoc dat).
> Nálezy → [`../form-schema-audit.md`](../form-schema-audit.md) (`F-xx`). Stav: ✅ **sweep proběhl 2026-06-05** — 3× 🐛 (CH-D1 name bez max, CH-D2 isLocation dead-code drift, CH-D3 legacy bio pole v DTO), zbytek ✅/⚖️.

Vrstvy: **FE typ** [characters.types.ts](../../src/features/world/pages/api/characters.types.ts) (`CreateCharacterInput`) · **FE mutace** [useCharacterMutations.ts](../../src/features/world/pages/api/useCharacterMutations.ts) (`UpdateCharacterInput`) ·
**FE odvození** [PageEditor.tsx](../../src/features/world/pages/PageEditor/PageEditor.tsx) → BE [pages.service.ts](../../../Projekt-ikaros/backend/src/modules/pages/pages.service.ts) `charactersService.create({slug,name,isNpc,userId,kind})` ·
**BE DTO** [create-character.dto.ts](../../../Projekt-ikaros/backend/src/modules/characters/dto/create-character.dto.ts) · [update-character.dto.ts](../../../Projekt-ikaros/backend/src/modules/characters/dto/update-character.dto.ts) · [convert-character.dto.ts](../../../Projekt-ikaros/backend/src/modules/characters/dto/convert-character.dto.ts) ·
**DB** [character.schema.ts](../../../Projekt-ikaros/backend/src/modules/characters/schemas/character.schema.ts) ·
**mapper** [characters.repository.ts](../../../Projekt-ikaros/backend/src/modules/characters/repositories/characters.repository.ts) `toEntity`.

---

## Soupis polí (povrch oblasti)

„FE form" = kde to uživatel zadává; primárně přes Page editor (BE odvodí), proto `name`/`slug` nejsou přímý character input.
Bio data (`publicBio`, `imageUrl`, `accessRequirements`, …) po 9.1 cleanup **nežijí** na Character — drží je Page přes `characterRef`. `CreateCharacterDto` je sice ještě obsahuje (legacy), ale `pages.service` je při zakládání neposílá.

| # | Pole | Typ | Kde FE | Hl. osa |
|---|---|---|---|---|
| CH-01 | `slug` | string (req) | BE odvodí z `Page.slug` | `RQ` `WL` |
| CH-02 | `name` | string (req) | BE odvodí z `Page.title` | `RQ` `WL` |
| CH-03 | `userId` | string (opt) | BE odvodí z `Page.ownerUserId` (PC) / `convert` | `WL` |
| CH-04 | `isNpc` | bool | BE odvodí `type === 'NPC'` | `RQ` `TY` |
| CH-05 | `kind` | enum `'persona'\|'location'` | BE odvodí (`Lokace→location`) | `EN` |
| CH-06 | `diaryData` | Record | subdoc API (`UpdateCharacterDto`) | `TY` `WL` |
| CH-07 | `extraBlocks[]` | array obj | subdoc API | `TY` `WL` |
| CH-08 | `campaignSubjectId` | string (opt) | (interní) | `WL` |
| CH-09 | `customData` | Record | subdoc API | `TY` `WL` |
| CH-10 | `preferredCalendarConfigId` | string\|null | 9.2c (subdoc/settings) | `NL` |
| CH-11 | `expectedUpdatedAt` | string (opt) | `UpdateCharacterInput` (D-073) | `NL` |

> **CH legacy v CreateCharacterDto (mimo aktivní write path):** `imageUrl`, `publicBio`, `publicInfoBlocks[]`, `privateBio`, `privateInfoBlocks[]`, `accessRequirements[]` — DTO je přijme, ale schema (po 9.1 cleanup) **nemá `@Prop`** → `WL` tichá ztráta (write 201, nic se neuloží/nevrátí). FE `CreateCharacterInput` má navíc `isLocation:boolean` — **ne** v DTO (DTO má `kind`).

---

## Matice pole × vrstva

> Buňka = pravidlo na dané vrstvě (`—` = vrstva pole neomezuje). **Δ** = verdikt parity, plní sweep.

| # | Pole | FE | BE DTO (create) | BE DTO (update) | DB `@Prop` | mapper `toEntity` | Δ |
|---|---|---|---|---|---|---|---|
| CH-01 | slug | BE z `Page.slug` (slugify) | `@IsString` (req) | `@IsString` opt | `required:true` | ✓ `doc.slug` | ⚖️ by-design (žádný `@Matches`; service `.toLowerCase()`+unique; slug z Page slugify) |
| CH-02 | name | BE z `Page.title` | `@IsString` (req) | `@IsString` opt | `required:true` | ✓ `?? ''` | 🐛 rozpor → **CH-D1** (žádný `@MaxLength`; vázané na PG-D2 title — odvozeno z `Page.title`) |
| CH-03 | userId | BE z `Page.ownerUserId` / convert | `@IsString` opt | `@IsString` opt | `@Prop()` index | ✓ | ✅ shoda (permission pole; convert přepíná PC↔NPC konzistentně) |
| CH-04 | isNpc | BE `type==='NPC'` | `@IsBoolean` (**req, ne opt**) | `@IsBoolean` opt | `default false` | ✓ `?? false` | ⚖️ by-design (create DTO `isNpc` required; jediný caller `pages.service` vždy posílá; přímý POST bez něj → 400, ale FE žádný takový volající — `useCreateCharacter` dead code) |
| CH-05 | kind | BE (`Lokace→location`, else `persona`) | `@IsIn(['persona','location'])` opt | `@IsIn([...])` opt | `enum [...] default 'persona'` | ✓ `?? 'persona'` | 🐛 rozpor → **CH-D2** (FE `CreateCharacterInput.isLocation:bool` ≠ DTO/DB `kind` — dead-code drift) |
| CH-06 | diaryData | subdoc patch | (ne v create DTO — service `={}`) | `@IsObject` opt | `type:Object default {}` | ✓ `?? {}` | ✅ shoda (shallow-merge kořenových klíčů v service `update`) |
| CH-07 | extraBlocks[] | subdoc patch | (service `=[]`) | `@IsArray` opt (bez `@ValidateNested`) | `[MixedArraySubSchema] default []` | ✓ `as SchemaBlock[]` | ⚖️ by-design (žádná element validace; mapper cast bez re-map — volnější než pages.sections, vědomé) |
| CH-08 | campaignSubjectId | (interní) | `@IsString` opt | `@IsString` opt | `@Prop()` — | ✓ | ✅ shoda |
| CH-09 | customData | subdoc patch | — | `@IsObject` opt | `type:Object default {}` | ✓ `?? {}` | ⚖️ by-design (full replace přes `UpdateCharacterDto.customData`; delta `customDataPatch` žije v character-subdocs diary, ne tady — mimo oblast) |
| CH-10 | preferredCalendarConfigId | 9.2c | — | — (mimo DTO) | `type:String default null` | ✓ `?? null` | ⚖️ by-design (v schema+mapper, v žádném char DTO → nastavuje se jiným endpointem; přes char write-path nezapisovatelné, ne tichá ztráta) |
| CH-11 | expectedUpdatedAt | `UpdateCharacterInput` | N/A | `@IsString` opt | N/A (filtrované) | N/A | ✅ shoda (service `const {expectedUpdatedAt:_,...persistDto}` vyřízne; 409 `CHARACTER_CONFLICT`) |

### Convert (`ConvertCharacterDto`)

| Podpole | FE | BE DTO | Efekt | Δ |
|---|---|---|---|---|
| `userId` | `ConvertCharacterInput` opt | `@IsString` opt | vyplněné → PC, prázdné → NPC | ✅ shoda (XF: `toNpc = !dto.userId` → service přepne `isNpc` + `userId` atomicky, `characters.service.ts:348-352`) |

---

## Kontrolní body (co u každého pole ověřit při sweepu)

- **CH-01 `RQ`/`WL`** — slug: required 3-vrstvě (DTO `@IsString` create, DB `required`, mapper čte). Žádný `@Matches` — formát garantuje jen FE slugify (Page). Přímý `POST /characters` (mimo Page flow) by pustil libovolný slug. Unikátnost: `CharacterSchema.index({worldId,slug},{unique})` + service `existsBySlugAndWorld` (`CHARACTER_SLUG_TAKEN`). *(hot)*
- **CH-02 `RQ`** — name: required create DTO + DB. Vázané na PG-03 (`Page.title`, FE `maxLength={200}`) — žádný server `@MaxLength` na character name. Ověř, že rename Page synchronizuje `Character.name` (jinak drift mezi Page.title a Character.name).
- **CH-03 `WL`** — userId: optional, permission pole pro `assertSubdocAccess` (owner/PJ rozlišení). Convert ho přepisuje. Ověř, že odebrání ownera (NPC→PC→NPC) pošle prázdno/undefined a mapper to vrátí konzistentně.
- **CH-04 `RQ`/`TY`** — **`isNpc` v create DTO je `@IsBoolean` BEZ `@IsOptional`** (na rozdíl od update). `pages.service` ho vždy dodá (`type === 'NPC'`), takže Page-flow OK. Ale přímý API `POST /characters` bez `isNpc` → 400. Ověřit, zda existuje jiný volající create DTO (FE `useCreateCharacter` je definovaný, ale **nikde nevolaný** — grep: jen v api souborech). *(hot)*
- **CH-05 `EN`** — kind: **3 reprezentace**: (a) FE `CreateCharacterInput.isLocation:boolean` (legacy, nepoužitý write path), (b) DTO `@IsIn(['persona','location'])`, (c) DB `enum [...] default 'persona'`. `pages.service` posílá `kind` (ne `isLocation`) → DTO/DB konzistentní. FE typ `isLocation` je **drift** — buď dead code, nebo nebezpečný (pokud by někdo `useCreateCharacter` zapojil, BE by `isLocation` whitelistem dropnul). Ověř, zda `useCreateCharacter`/`CreateCharacterInput` smazat. Mapper default `'persona'` pro pre-9.2 dokumenty. *(EN + WL)*
- **CH-06 `TY`/round-trip P2** — diaryData: `@IsObject`, DB `type:Object`. Service dělá **shallow-merge** kořenových klíčů (ne full replace) — ověř A→B→A, že merge nezahodí klíče z jiných system presetů (paměť `feedback_persist_across_variants`, `customDataPatch` delta merge vs `customData` full replace deprecated).
- **CH-07 `WL`/P1** — extraBlocks: DTO `@IsArray` **bez `@ValidateNested({each})`** → elementy nevalidované; DB `MixedArraySubSchema`; mapper jen `as SchemaBlock[]` cast (žádný explicit re-map jako u pages.sections). Tzn. tvar elementu se nikde nevynutí — co FE pošle, to se uloží i vrátí (volnější než pages). Ověř shodu `SchemaBlock` (key/label/type/config/order) FE↔reálná DB data.
- **CH-09 round-trip P2** — customData: dvě cesty — `UpdateDiaryInput.customData` (**deprecated**, full replace → data loss při switch presetu) vs `customDataPatch` (delta `$set`/`$unset` per key). Ověř, že nový kód jede patch (paměť).
- **CH-10 `WL`** — preferredCalendarConfigId: existuje v **schema + mapper**, ale v **žádném z přečtených DTO** (create/update/convert). Pokud se nastavuje jiným endpointem (calendar settings) → mimo tuto oblast; pokud se má posílat přes `UpdateCharacterDto` → chybí `@Prop`/dekorátor → `WL` tichá ztráta. *(ověřit write path)*
- **CH-11 `NL`** — expectedUpdatedAt: service ho při update porovná a vyřízne před persist (vzor 7.2k pages). Vynechání = legacy update bez 409.
- **Convert `XF`** — `userId` ovládá `isNpc` + viditelnost finance/inventory subdoc (`SUBDOC_KINDS` invalidace na FE). Cross-field: BE musí konzistentně přepnout `isNpc` podle přítomnosti `userId`. Round-trip PC→NPC→PC zachová subdoc data?
- **CH legacy bio pole** — `CreateCharacterDto` stále deklaruje `imageUrl/publicBio/publicInfoBlocks/privateBio/privateInfoBlocks/accessRequirements`, ale schema je po 9.1 cleanup **nemá**. Při `POST` s nimi → DTO projde, Mongoose je **zahodí** (nejsou `@Prop`), GET je nevrátí. `WL` tichá ztráta — kandidát na odstranění z DTO (mrtvá pole matou kontrakt).

---

## Delta parity (plní sweep)

> Sweep 2026-06-05. Ověřena reálná write-path: tvorbu postavy řídí `pages.service.create/update`, který volá `charactersService.create({ slug, name, isNpc, userId, kind })` ([pages.service.ts:176-187, 273-287]) — **NE** přímý `POST /characters` z FE. `useCreateCharacter`/`CreateCharacterInput` ([useCharacterMutations.ts:120], [characters.types.ts:63]) jsou definované, ale **nikde nevolané** (grep: jen vlastní api soubory) → dead code.
> Globální `ValidationPipe({ whitelist:true, forbidNonWhitelisted:true })` ([main.ts:53-56], PC-07 — neznámé pole na pipe vrátí **400**, akt. 2026-06-20). Pozn.: i kdyby pipe pole pustila, `charRepo.save({ ...(dto as Partial<Character>), ... })` ([characters.service.ts:221-227]) spreaduje celý create DTO → Mongoose default `strict:true` zahodí pole bez `@Prop` (druhá, DB-vrstvá obrana; žádný `strict:false` override).

**CH-D2** `kind` / `isLocation` — FE: `CreateCharacterInput.isLocation: boolean` ([characters.types.ts:63-71]) — dead-code typ, žádný volající · BE DTO: `@IsIn(['persona','location']) kind` ([create-character.dto.ts:23]) · DB: `@Prop({ enum:['persona','location'], default:'persona' })` ([character.schema.ts:29-30]) · mapper `?? 'persona'` ([characters.repository.ts:134]) · **rozpor:** drift tvaru (`isLocation:bool` ≠ `kind:enum`). Pokud by někdo `useCreateCharacter` zapojil, `whitelist:true` by `isLocation` tiše dropl a `kind` chyběl → postava by spadla na default `persona` (Lokace by se chovala jako persona). Reálná write-path (`pages.service`) posílá `kind` korektně → **dnes neaktivní**. · **dopad na data:** žádný (dead code, neaktivní cesta) — odstranění nevyžaduje migraci. · **návrh:** smazat `useCreateCharacter` + `CreateCharacterInput` (vč. `isLocation`/`imageUrl`/`publicBio`) z FE; mrtvý kód mate kontrakt. Závažnost 🟡 (drift / dead code).

**CH-D3** legacy bio pole v `CreateCharacterDto` — FE: nezasílá (reálná path posílá jen 5 polí) · BE DTO: deklaruje `imageUrl`, `publicBio`, `publicInfoBlocks[]`, `privateBio`, `privateInfoBlocks[]`, `accessRequirements[]` ([create-character.dto.ts:24-42]) · DB schema: po 9.1 cleanup **nemá** žádné z nich ([character.schema.ts:16-41]) · **rozpor:** `POST /characters` s těmito poli → DTO projde validací, service je spreadne do `save`, Mongoose `strict:true` je **tiše zahodí** (201, GET je nevrátí). Tichá ztráta + matoucí kontrakt (DTO slibuje pole, která se neuloží). Dnes neaktivní (žádný request je neposílá), ale latentní. · **dopad na data:** žádný (pole se už dnes neukládají; odstranění z DTO nic neztratí) — migrace ne. · **návrh:** smazat legacy bio pole z `CreateCharacterDto` (bio kanonicky v Page přes `characterRef`). Závažnost 🟡 (matoucí kontrakt; tichá ztráta jen na teoretické přímé cestě).

**CH-D1** `name` — FE: odvozeno z `Page.title` (`maxLength={200}` HTML attr) · BE DTO: `@IsString` create req **bez `@MaxLength`** ([create-character.dto.ts:18]) · DB: `@Prop({ required:true })` bez limitu ([character.schema.ts:18]) · **rozpor:** stejně jako PG-D2 — žádný server-side délkový limit; `name` se navíc odvozuje z `Page.title`, takže zdědí jeho neomezenou délku. · **dopad na data:** přidání `@MaxLength(200)` → podmíněná migrace (jen pokud nějaké existující jméno >200). · **návrh:** sjednotit s PG-D2 (`@MaxLength(200)` na `CreatePageDto.title` i `CreateCharacterDto.name`). Závažnost 🟡 (drift). _Pozn.: rename Page→Character.name sync ověřen — `pages.service.update` předává `persistDto.title ?? page.title` jen při auto-create; existující Character.name se update Page.title automaticky NEsynchronizuje (potenciální drift Page.title ↔ Character.name — mimo tuto osu, jde o logiku, viz bug-audit)._

## Round-trip / migrační poznámky

> _CH-05 `kind` — přidání DB `enum` už hotové (default 'persona'); pre-9.2 dokumenty bez pole čte mapper jako 'persona' (✓ migrace-safe). CH-06/CH-09 — round-trip (P2) shallow-merge / delta-merge customData (A→B→A) na živých datech. CH legacy bio pole — pokud se DTO čistí, ověřit, že žádný produkční request je neposílá (jinak tichá ztráta už dnes probíhá). CH-02 name ↔ PG-03 Page.title sync — rename round-trip._
