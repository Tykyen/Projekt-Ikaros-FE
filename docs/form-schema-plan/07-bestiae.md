# 07 — Bestiae (statblok)

> **Entita:** `Bestie` (statblok šablona, **bez deníku**) · **write path:** `POST /api/bestiae`,
> `PATCH /api/bestiae/:id`, `POST /api/bestiae/:id/clone`.
> **FE styl:** **registry + `validateForCreate`** (styl ③ z README — per-system JSON přes
> `systemEntitySchemaRegistry.get(systemId, 'bestie')`) **+ inline** (`trim`, `maxLength` HTML attr) na top-level pole.
> **Osy:** `RQ` `LN` `EN` · perspektiva **P4** (`systemStats` per-system engine — jen odkaz na oblast 10).
> Nálezy → [`../form-schema-audit.md`](../form-schema-audit.md) (`BE-xx` → `F-xx`). Stav: ✅ sweep proběhl 2026-06-05 (lokální ID `BE-Dx`).

Vrstvy: **FE** [BestieEditorModal.tsx](../../src/features/world/bestiar/components/BestieEditorModal.tsx) ·
[CloneBestieModal.tsx](../../src/features/world/bestiar/components/CloneBestieModal.tsx) ·
[types.ts](../../src/features/world/bestiar/types.ts) —
**BE DTO** [create-bestie](../../../Projekt-ikaros/backend/src/modules/bestiae/dto/create-bestie.dto.ts) /
[update-bestie](../../../Projekt-ikaros/backend/src/modules/bestiae/dto/update-bestie.dto.ts) /
[clone-bestie](../../../Projekt-ikaros/backend/src/modules/bestiae/dto/clone-bestie.dto.ts) —
**DB** [bestie.schema.ts](../../../Projekt-ikaros/backend/src/modules/bestiae/schemas/bestie.schema.ts) —
**mapper** [bestiae.repository.ts](../../../Projekt-ikaros/backend/src/modules/bestiae/repositories/bestiae.repository.ts).

> ⚠️ **`systemStats` = per-system engine** (`SystemStatsValidatorService`, 10.2d-prep-A). FE canonical JSON
> → `validateForCreate(systemStats, schema)` → DTO jen `@IsObject` → service soft-mode validace per-system.
> **Per-system pole se zde NErozepisuje** — patří do [oblasti 10](10-per-system.md) (`SY-xx`). Zde jen top-level kontrakt.

---

## Soupis polí (povrch oblasti)

„FE form" = kde to uživatel zadává. FE top-level inline = `trim()` + `if(!name.trim())` + `maxLength` HTML attr.
`scope/systemId/worldId` jsou **create-only** (immutable po vytvoření — viz `UpdateBestieDto` komentář).

| # | Pole | Typ | Kde FE | Hl. osa |
|---|---|---|---|---|
| BE-01 | `scope` | enum | `BestieEditorModal` select (create only) · Clone select | `EN` `RQ` |
| BE-02 | `systemId` | string | `[derived]` z props (`systemId`), create only | `RQ` `NM` |
| BE-03 | `worldId` | string | `[derived]` (`scope==='world' ? worldId : undefined`) | `RQ` `XF` `NL` |
| BE-04 | `name` | string | text `input maxLength=100` + `trim` | `RQ` `LN` |
| BE-05 | `imageUrl` | string | text input (`trim() \|\| undefined`) | `LN` `NL` |
| BE-06 | `notes` | string | textarea `maxLength=2000` (`notes.trim()`) | `LN` |
| BE-07 | `abilities[]` | `{label,value}[]` | `[reserved]` (FE typ; modal needituje) | `TY` `WL` |
| BE-08 | `systemStats` | Record | `EntitySchemaForm` + `validateForCreate` (registry) | **P4 → oblast 10** |
| BE-09 | `newName` (clone) | string | `CloneBestieModal` `input maxLength=100` | `LN` `NL` |
| BE-10 | `clonedFromId` | string | `[svc]` (server-set při clone) | `WL` |
| BE-11 | `ownerUserId` | string | `[svc]` (server z auth, `scope==='user'`) | `WL` `XF` |
| BE-12 | `deletedAt` | Date\|null | `[svc]` soft-delete | `WL` `NL` |

---

## Matice pole × vrstva

> Buňka = pravidlo na dané vrstvě (`—` = vrstva pole neomezuje). **Δ** = verdikt parity: `✅ shoda` /
> `🐛 F-xx` / `⚠️ ⬜ ověřit`. Pravidla doplněná z přípravné inventury; **Δ se uzavírá až při sweepu**.

| # | Pole | FE | BE DTO (create / update / clone) | DB `@Prop` | mapper | Δ |
|---|---|---|---|---|---|---|
| BE-01 | scope | select `'user'\|'world'\|'system'` (`system` jen global admin) · clone `'user'\|'world'` | create `@IsIn(['user','world','system'])` · clone `@IsIn(['user','world'])` · update **immutable** | `required @enum(['system','user','world'])` index | ✓ | ⚖️ by-design (množina create=DB; clone bez `'system'` = záměr „klon do globálu zakázán"; FE `system` gated `isGlobalAdmin` [BestieEditorModal.tsx:181]; jiné pořadí neškodí) |
| BE-02 | systemId | `[derived]` z props | create `@IsString @MinLength(1)` · update immutable | `required` index | ✓ | ✅ shoda (create-only; FE z `systemId` prop; update DTO ho vynechává) |
| BE-03 | worldId | `scope==='world' ? worldId : undefined` | create `@IsOptional @IsString` · clone `@IsOptional @IsString` | `@Prop` opt, sparse index | ✓ | ✅ shoda (XF vynucen v service: `scope==='world'` bez `worldId` → 400 [bestiae.service.ts:75-78]; user/system ho ignorují [:108]) |
| BE-04 | name | `trim`+`if(!name.trim())` + `maxLength=100` (HTML) | create `@IsString @MinLength(1) @MaxLength(100)` · update opt stejné | `required:true` — | ✓ | ⚖️ by-design (FE `maxLength` jen UX; `@MinLength(1)` pustí `' '`, FE `if(!name.trim())` blokne — třída CT-01) |
| BE-05 | imageUrl | `imageUrl.trim() \|\| undefined` (MVP text URL) | create/update `@IsOptional @IsString` **(bez MaxLength!)** | `@Prop` opt — | ✓ | 🐛 **BE-D1** (žádný délkový limit **nikde** — vs chat imageUrl `@MaxLength(512)`; žádný `@IsUrl`) |
| BE-06 | notes | textarea `maxLength=2000`; posílá `notes.trim()` **vždy** | create/update `@IsOptional @IsString @MaxLength(2000)` | `default ''` | ✓ `?? ''` | ✅ shoda (FE `''` i prázdné; DTO opt; `dto.notes ?? ''` [:111]; update `$set` přepíše = záměr „smazání poznámky") |
| BE-07 | abilities | FE typ `{label,value}[]`; **modal needituje** | create/update `@IsOptional @IsArray` (**bez** `@ValidateNested` na prvky) | `[Object] default []` | ✓ `?? []` | 🐛 **BE-D2** (prvky `{label,value}` se **nevalidují**; pole je v DTO dosažitelné i když modal neplní — service `dto.abilities ?? []` [:112]) |
| BE-08 | systemStats | `validateForCreate(systemStats, schema)` (per-system registry) | create `@IsObject` (required) · update `@IsOptional @IsObject` | `Object default {}` | ✓ `?? {}` | ⚖️ by-design → [oblast 10](10-per-system.md): DTO jen `@IsObject`, validace v `SystemStatsValidatorService` (soft-mode: chybí schema → skip [bestiae.service.ts:98]) |
| BE-09 | newName | clone `input maxLength=100` (`trim() \|\| undefined`) | clone `@IsOptional @IsString @MinLength(1) @MaxLength(100)` | (→ `name`) | ✓ | ✅ shoda (mapuje se na `name`; service `dto.newName ?? '… (kopie)'` [:184]) |
| BE-10 | clonedFromId | `[svc]` | **DTO nemá** | `@Prop` opt | ✓ | ⚖️ by-design (service-set jen při clone: `clonedFromId: source.id` [:189]; mapper vrací) |
| BE-11 | ownerUserId | `[svc]` auth | **DTO nemá** | `@Prop` opt, sparse index | ✓ | ⚖️ by-design (service `scope==='user' ? user.id : undefined` [:107]; mapper vrací; XF na scope) |
| BE-12 | deletedAt | `[svc]` soft-delete | **DTO nemá** | `default null` | ✓ | ✅ shoda (soft-delete `$set deletedAt`; `findVisible` filtr `deletedAt: null` [:57]; mapper `as Date\|null`) |

---

## Kontrolní body (co u každého pole ověřit při sweepu)

- **BE-01 `EN`** — `scope` existuje **3×** s **různým tvarem**: create `@IsIn(['user','world','system'])`,
  clone `@IsIn(['user','world'])` (**bez `system`** — klon do globálu zakázán), DB `enum(['system','user','world'])`
  (jiné pořadí). FE create select gatuje `'system'` rolí (`isGlobalAdmin`), clone select má jen `'user'|'world'`.
  Množinová shoda + **záměrnost rozdílu clone vs create** (clone bez system = záměr?). *(hot)*
- **BE-02/BE-03 `RQ`/`XF`** — `scope/systemId/worldId` **immutable po create** (`UpdateBestieDto` je vynechává).
  `worldId` cross-field na scope: FE pošle `worldId` jen u `scope==='world'`. BE vynutí vztah (world bez worldId →
  400? user s worldId → ignoruje)? Red-team: `scope='world'` bez `worldId`.
- **BE-04 `LN`** — FE `maxLength=100` je **jen HTML attr** + `trim()` + `if(!name.trim())`. `@MinLength(1)`
  na serveru pustí `' '` (mezera), FE ne. Round-trip name s diakritikou proti `maxLength` (code units vs grafémy). *(hot)*
- **BE-05 `LN`/`NL`** — `imageUrl` **nemá délkový limit na žádné vrstvě** (DTO `@IsString` bez `@MaxLength`,
  schema bez constraintu) — kontrast s chat `imageUrl @MaxLength(512)`. Žádný `@IsUrl` → libovolný string/path
  (záměr: „URL nebo path", komentář modalu). FE posílá `trim() || undefined`. Možný `RN`/DoS kandidát (dlouhý string).
- **BE-06 `NL`** — FE posílá `notes: notes.trim()` **vždy** (i prázdné `''`, nikdy `undefined`), DTO `@IsOptional`,
  schema `default ''`. Shoda — ale ověř, že prázdné `''` přepíše existující notes při update (full vs delta).
- **BE-07 `WL`/`TY`** — `abilities[]` `{label,value}[]`: DTO jen `@IsArray` (**prvky se nevalidují** — žádné
  `@ValidateNested`/`@IsString` na `label`/`value`), schema `[Object]`. FE modal **needituje** abilities (chybí
  v `payload`). Ověř, kde se abilities plní (bestie token instance? clone snapshot?) a zda mapper neztrácí podpole.
- **BE-08 `P4`** — `systemStats`: DTO jen `@IsObject`, skutečná validace v `SystemStatsValidatorService` (soft-mode:
  chybí schema → `errors._schema`, přeskočí). Per-system pole/enum/min-max → **[oblast 10](10-per-system.md)**.
  Past (`project_schema_be_fe_sync`): změna FE JSON bez `export-schemas` → BE validuje proti staré kopii. **Zde nerozepisovat.**
- **BE-10/BE-11/BE-12 `WL`** — `clonedFromId` (clone), `ownerUserId` (auth, `scope==='user'`), `deletedAt`
  (soft-delete) jsou **service-set** (žádné DTO). Schema + mapper je drží. Ověř, že GET (`toEntity`) je vrací
  a soft-delete filtr (`deletedAt`) sedí FE očekávání (`deletedAt?: string | null`).

---

## Delta parity (plní sweep)

**BE-D1** `imageUrl` (délkový limit / formát) — FE: `imageUrl.trim() || undefined`, text input, placeholder „https://… nebo path", **žádný** délkový limit ([BestieEditorModal.tsx:85,160-166]) · BE DTO: create/update `@IsOptional @IsString` — **bez `@MaxLength`, bez `@IsUrl`** ([create-bestie.dto.ts:31-33], [update-bestie.dto.ts:21-23]) · DB: `@Prop() imageUrl?: string` bez constraintu ([bestie.schema.ts:24]) · mapper: ano (`as string\|undefined` [:35]) · **rozpor:** uložení nevalidní hodnoty — libovolně dlouhý string projde všemi vrstvami (kontrast chat `imageUrl @MaxLength(512)`); clone navíc kopíruje `source.imageUrl` bez kontroly ([bestiae.service.ts:185]). · **dopad na data:** migrace ne (žádná zpřísňující změna nutná pro existující; přidání `@MaxLength` by mohlo zneplatnit extrémně dlouhé legacy URL — nepravděpodobné) · **návrh:** přidat `@MaxLength(512)` (sjednotit s chatem); `@IsUrl` ZÁMĚRNĚ nepřidávat (povolen „URL nebo path" — komentář modalu), případně `@MaxLength` + povolení relativní cesty.

**BE-D2** `abilities[]` (validace prvků) — FE: typ `{label,value}[]`, modal ho **needituje** (není v `payload`) ([BestieEditorModal.tsx:82-88], [types.ts:37]) · BE DTO: create/update `@IsOptional @IsArray` — **bez `@ValidateNested`/`@Type`**, prvky `unknown` ([create-bestie.dto.ts:40-42], [update-bestie.dto.ts:30-32]) · DB: `[Object] default []` ([bestie.schema.ts:27-28]) · mapper: ano (`as Bestie['abilities'] ?? []` [:37]) · **rozpor:** uložení nevalidní hodnoty — pole je v DTO dosažitelné i bez modalu; red-team `abilities:[{cokoliv}]` se uloží bez kontroly `label`/`value`; clone kopíruje `[...source.abilities]` ([bestiae.service.ts:187]) · **dopad na data:** migrace ne (FE pole nikdy neplní → existing docs mají `[]`; riziko jen red-team payloadem) · **návrh:** přidat `@ValidateNested({each})` + `@Type` + samostatné `AbilityDto { @IsString @MaxLength label; @IsString @MaxLength value }` + `@ArrayMaxSize`.

## Round-trip / migrační poznámky

> _BE-01 scope clone-vs-create množina = red-team payload (`clone scope:'system'` → 400?).
> BE-03 `scope='world'` bez `worldId` = red-team. BE-06 `notes:''` update = round-trip (delta vs full replace).
> BE-08 systemStats round-trip A→B→A patří do oblasti 10 (per-system parita + `export-schemas` diff).
> Zpřísnění (`@IsUrl`/`@MaxLength` na imageUrl, `@ValidateNested` na abilities) na živém serveru → ověř existující dokumenty bestií._
