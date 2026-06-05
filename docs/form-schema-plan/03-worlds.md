# 03 — Worlds (create / update world + settings)

> **Entita:** `World` (+ `WorldSettings`, `WorldCalendarConfig`) · **write path:**
> `POST /worlds` (create wizard) · `PATCH /worlds/:id` (settings taby) · `PATCH /worlds/:id/settings`.
> **FE styl:** zod (`basicInfoSchema` v `WorldSettingsPage/lib`) **+ inline** ve wizardu
> `CreateWorldPage` (`name.trim().length`, `slug.length`, slug availability check, calendar Set).
> Pozor: create-wizard validace je z velké části **inline**, ne zod.
> **Osy:** `RQ` `LN` `EN` `RN` `NL` · perspektiva **P1** (plný průchod pole + rekurze do `calendars[]`).
> Nálezy → [`../form-schema-audit.md`](../form-schema-audit.md) (`F-xx`). Stav: ✅ sweep 2026-06-05 — 3 rozpory (WO-D1/D2/D3, vše 🟠), K-F13 vyvráceno (service mapuje), K-F11 by-design.

Tři vrstvy: **FE** [worldSettingsSchema.ts](../../src/features/world/pages/WorldSettingsPage/lib/worldSettingsSchema.ts)
(`basicInfoSchema`) · wizard [CreateWorldPage.tsx](../../src/features/ikaros/pages/CreateWorldPage/CreateWorldPage.tsx) ·
[useWorldSlug.ts](../../src/features/ikaros/pages/CreateWorldPage/hooks/useWorldSlug.ts) (slugify, max 40) ·
[useCreateWorld.ts](../../src/features/world/api/useCreateWorld.ts) /
[useUpdateWorld.ts](../../src/features/world/api/useUpdateWorld.ts) (payload tvar) ·
**BE DTO** [create-world.dto.ts](../../../Projekt-ikaros/backend/src/modules/worlds/dto/create-world.dto.ts) ·
[update-world.dto.ts](../../../Projekt-ikaros/backend/src/modules/worlds/dto/update-world.dto.ts) ·
[update-world-settings.dto.ts](../../../Projekt-ikaros/backend/src/modules/worlds/dto/update-world-settings.dto.ts) ·
[create-world-calendar-config.dto.ts](../../../Projekt-ikaros/backend/src/modules/world-calendar-config/dto/create-world-calendar-config.dto.ts)
(nested) ·
**DB** [world.schema.ts](../../../Projekt-ikaros/backend/src/modules/worlds/schemas/world.schema.ts) ·
[world-settings.schema.ts](../../../Projekt-ikaros/backend/src/modules/worlds/schemas/world-settings.schema.ts).

---

## Soupis polí (povrch oblasti)

Pole create wizardu + settings tabů. „Kde FE": `zod` = `basicInfoSchema`, `inline` = ručně
v `CreateWorldPage` / tabu, `payload` = jen v `CreateWorldInput`/`UpdateWorldInput` (bez FE validace).
`calendars[]` je nested array → každý prvek je mini-formulář (viz rekurze níže).

| # | Pole | Typ | Kde FE | Hl. osa |
|---|---|---|---|---|
| WO-01 | `name` | string | zod `min2/max60` + wizard inline | `RQ` `LN` |
| WO-02 | `slug` | string | wizard inline (`slugify` max40, availability) | `RQ` `LN` `RG` |
| WO-03 | `description` | string | zod `max1000` | `LN` |
| WO-04 | `maxPlayers` | number\|null | zod `int min1 max999 nullable` | `RN` `NL` |
| WO-05 | `accessMode` | enum | wizard/tab `PillChips` | `EN` |
| WO-06 | `system` | string | wizard inline (select/custom) | `RQ` `LN` |
| WO-07 | `genre` | string | wizard inline (select/custom) | `RQ` `LN` |
| WO-08 | `tones[]` | string[] | (UI dočasně vyřazeno) | `TY` |
| WO-09 | `dice[]` | string[] | wizard `PillChips` | `TY` |
| WO-10 | `playersWanted` | string | zod `max500` | `LN` |
| WO-11 | `themeId` | string | ThemeSection / ThemeTab | `LN` `EN` |
| WO-12 | `themeBackgroundUrl` | string\|null | MyThemeTab (clear = null) | `NL` |
| WO-13 | `themeOverrides` | object | ThemeCustomEditor | `TY` |
| WO-14 | `calendars[]` | array | wizard `CalendarsSection` (Set presetů) | `RQ` `EN` `RN` (P1) |
| WO-15 | `defaultCalendarSlug` | string | wizard `CalendarsSection` | `RG` |
| WO-16 | `diceVisibility` | object | zod (3 bool) | `TY` |
| WO-17 | `imageUrl` | string | zod `string` / payload | `RG` `NL` |
| WO-18 | `timelineCalendarSlug` | string\|null | settings (Timeline) | `LN` `NL` |

---

## Matice pole × vrstva

> Buňka = pravidlo na dané vrstvě (`—` = vrstva pole neomezuje). **Δ** = verdikt parity:
> `✅ shoda` / `🐛 F-xx` / `⚠️ ⬜ ověřit`. **Δ se uzavírá až při sweepu**.
> FE sloupec: `z` = `basicInfoSchema`, `inline` = ruční kontrola ve wizardu, `—` = bez FE validace.

| # | Pole | FE | BE DTO | DB `@Prop` | Δ |
|---|---|---|---|---|---|
| WO-01 | name | `z min(2) max(60) trim` (+ inline `≥2 ≤60`) | create `@MinLength(2)` `@MaxLength(60)`; update `@IsString` (bez limitu) | `required` (— len) | 🐛 **WO-D1** (update DTO bez min/max ↔ create má) |
| WO-02 | slug | `slugify` `/[^a-z0-9]/→-` `slice(0,40)`, inline `≥2`, availability | create `@MinLength(2)` `@MaxLength(40)` (— regex); update **chybí** | `required,unique,lowercase` (— regex/len) | 🐛 **WO-D2** (DTO/DB bez `@Matches`; přímý POST nesedí na FE slugify) |
| WO-03 | description | `z max(1000)` | create `@MaxLength(1000)` opt; update `@IsString` opt (bez limitu) | `—` opt | 🐛 **WO-D1** (update DTO bez `@MaxLength` ↔ create má) |
| WO-04 | maxPlayers | `z int min(1) max(999) nullable` | create `@IsInt @Min(1) @Max(999)` opt; update `@IsInt @Min(1) @Max(999)` (`number\|null`) | `min:1 max:999 default null` | ✅ shoda (FE pošle `null`; create `@IsOptional` přeskočí validaci pro `null` → bez 400; DB `default null`) |
| WO-05 | accessMode | `PillChips` 4 opce (`public/open/private/closed`) | `@IsIn(['public','open','private','closed'])` opt | `default 'private'` (— enum) | ⚖️ by-design (create-wizard záměrně jen 3; `closed` přes settings `AccessModeTab.tsx:35,116`; DB bez `enum` ale `@IsIn` vynutí na zápisu) |
| WO-06 | system | inline (select/custom, `customSystem max60`) | `@IsString` opt | `default 'matrix'` (— enum) | ✅ shoda (volný string záměr — custom systémy; bez enum vynucení by-design) |
| WO-07 | genre | inline (select/custom, `customGenre max40`) | `@IsString` opt | `—` opt | ✅ shoda (volný string záměr — custom žánry) |
| WO-08 | tones[] | `z array(string)` (UI vyřazeno) | create/update `@IsArray @IsString({each})` opt | `default []` | ⚖️ by-design (UI sekce vyřazena → FE neposílá; mrtvé pole, GET vrací `[]`, žádná ztráta) |
| WO-09 | dice[] | `z array(string)` `PillChips` | `@IsArray @IsString({each})` opt | `default []` | ✅ shoda |
| WO-10 | playersWanted | `z max(500)` | create `@MaxLength(500)` opt; update `@IsString` opt (bez limitu) | `—` opt | 🐛 **WO-D1** (update DTO bez `@MaxLength` ↔ create má) |
| WO-11 | themeId | tab string (preset id) | create/update `@IsString @MaxLength(40)` opt | create def `'modre-nebe'` (— enum) | ⚖️ by-design (dual-source THEME_IDS registry, paměť `theme_ids_dual_source`; bez `@IsIn` záměrně) |
| WO-12 | themeBackgroundUrl | `string\|null` (clear → null) | update `@IsOptional @ValidateIf(v!==null) @IsString` | `—` opt (string) | ✅ shoda (`null` i `''` clear ošetřen v service `worlds.service.ts:476-477` → `clearThemeBackgroundUrl` `$unset`) |
| WO-13 | themeOverrides | `Record<string,string>` | update `@IsObject` opt | `type:Object default {}` | ✅ shoda (klíče sanit. v service `sanitizeThemeOverrides` na `--theme-*`) |
| WO-14 | calendars[] | wizard: Set presetů → `p.template` (full preset) | create `@IsArray @ArrayMaxSize(20) @ValidateNested({each}) @Type(CreateWorldCalendarConfigDto)` opt | seedne do `world_calendar_configs` (separátní kolekce) | ✅ shoda (P1 — nested DTO sedí na FE full-template preset; viz rekurze) |
| WO-15 | defaultCalendarSlug | wizard (default `'gregorian'`, posílá jen když v Set) | create `@MaxLength(50)` `@Matches(/^[a-z0-9-]+$/)` opt | `defaultCalendarConfigSlug default 'gregorian'` | ✅ shoda (service `worlds.service.ts:320-337` **explicitně mapuje** `defaultCalendarSlug` → `defaultCalendarConfigSlug`; K-F13 vyvráceno) |
| WO-16 | diceVisibility | `z object{3×bool}` | update `@ValidateNested @Type(DiceVisibilityDto)` (3× `@IsBoolean`) opt | `type:Object default undefined` | ✅ shoda |
| WO-17 | imageUrl | `z string` / payload | create `@IsString` opt; update `@IsUrl` opt | `—` opt | 🐛 **WO-D3** (clear pošle `''`, update `@IsUrl` ho odmítne → 400) |
| WO-18 | timelineCalendarSlug | settings (Timeline tab) | settings `@ValidateIf(v!==null) @IsString @MaxLength(64)` opt | `default null` | ✅ shoda (NL — `null` fallback ošetřen `@ValidateIf`) |

### Rekurze — `calendars[]` prvek (`CreateWorldCalendarConfigDto`, P1 mini-formulář)

> Limit pole: `@ArrayMaxSize(20)`. Každý prvek se validuje jako vlastní 3-vrstvý kontrakt.
> FE posílá **full template** z `CALENDAR_PRESETS` (`presets/`), uživatel needituje pole ručně.

| Pod-pole | DTO pravidlo | Pozn. |
|---|---|---|
| `slug` | `@MinLength(1) @MaxLength(50) @Matches(/^[a-z0-9-]+$/)` | unique per svět |
| `name` | `@MinLength(1) @MaxLength(100)` | |
| `hoursPerDay` | `@IsInt @Min(1) @Max(48)` opt | |
| `daysOfWeek[]` | `@ArrayMinSize(1) @ArrayMaxSize(20) @IsString({each})` opt | |
| `months[]` | `@ArrayMinSize(1) @ArrayMaxSize(36) @ValidateNested` → `MonthDefDto` | `name 1–50`, `daysCount 0–100`, `isIntercalary?` |
| `celestialBodies[]` | `@ArrayMaxSize(20) @ValidateNested` → `CelestialBodyDto` | `id/name`, `orbitalPeriodDays @Min(0.0001)`, `color @IsHexColor`, `icon max10` |
| `seasons[]` | `@ArrayMaxSize(20) @ValidateNested` → `SeasonDto` | `startMonthIndex @Min(0)`, `startDay @Min(1)`, `color @IsHexColor` |
| `leapYearRule` | `@ValidateNested` → `LeapYearRuleDto` opt | `type @IsIn([...])`, `leapMonthIndex 0–35` |
| `lunisolar` | `@ValidateNested` → `LunisolarRuleDto` opt | `type 'metonic-19'`, `leapYearsInCycle[] max19 1–19` |
| `epochOffset` | `@IsNumber` opt | |

---

## Kontrolní body (co u každého pole ověřit při sweepu)

- **WO-01 `LN`** — create DTO `@MaxLength(60)`, ale **update DTO `name` bez limitu** + DB `@Prop` bez `maxlength`. Přejmenování světa na 200 znaků projde update. Která hodnota kanonická? *(hot)*
- **WO-02 `RG`/`LN`** — slug: FE `slugify` garantuje `[a-z0-9-]` max40, create DTO `min2/max40` **bez `@Matches`**, DB bez regexu, **update DTO slug vůbec nemá** (rename jde přes service `previousSlugs`). Red-team: přímý POST se slugem `Foo Bar`/`abc_def`? *(hot)*
- **WO-04 `RN`/`NL`** — `maxPlayers`: create DTO není `null` (jen `number` opt), update DTO je `number|null`, FE pošle `null`. Ověřit, že create `null` neshodí 400 (FE `CreateWorldInput` má `number|null`). DB `default null`.
- **WO-05 `EN`** — accessMode enum 4 hodnoty (`public/open/private/closed`) na **3 zdrojích**: FE `PillChips` OPTIONS/`WorldAccessMode` (create lib jen 3: `public/open/private`!), DTO `@IsIn(4)`, DB `@Prop` **bez** `enum`. Ověřit, že `WorldAccessMode` typ (create) vs `World['accessMode']` (4) nesedí → wizard neposílá `closed`. *(hot — množina FE create 3 ≠ 4)*
- **WO-08 `WL`/`NM`** — `tones[]` je v DTO i DB, ale UI sekce **vyřazená** → FE nikdy neposílá. Mrtvé pole, ne ztráta; ověřit, že GET vrací `[]` a nic se nerozbije.
- **WO-11 `EN`** — `themeId`: DTO `@MaxLength(40)` bez `@IsIn`, DB `@Prop` bez `enum` → libovolný string projde. Dual-source THEME_IDS (FE registry ↔ BE konstanta, paměť). Shoda množin + zdroj.
- **WO-12 `NL`** — `themeBackgroundUrl`: FE clear pošle `null`, DTO `@ValidateIf(v!==null)` pustí null, service dělá `$unset`. Round-trip: po clearu GET vrací pole chybějící nebo `null`? Historicky FE posílal `''` (D-NEW). Ověřit i `''` cestu.
- **WO-14 `RQ`/`EN`/`RN` (P1)** — `calendars[]`: full preset template z FE. Projdi **každý prvek** jako mini-formulář (tabulka výše) — `@ArrayMaxSize(20)`, nested `@ValidateNested({each})`. Round-trip: seedne se do `world_calendar_configs`, GET kalendáře vrací vše beze ztráty (months/celestialBodies/seasons)? Mapper kolekce?
- **WO-15 `NM`/`RG`** — payload `defaultCalendarSlug` (`@Matches(/^[a-z0-9-]+$/)`, max50) → DB pole se jmenuje **`defaultCalendarConfigSlug`**. Ověřit service mapping (jinak whitelist/ztráta). FE posílá jen když slug ∈ vybraný Set.
- **WO-17 `RG`/`NL`** — `imageUrl`: create `@IsString`, update `@IsUrl`, FE bez validace, DB bez limitu. `@IsUrl` v update odmítne `''` → jak se obrázek maže? (srovnej s WO-12 pattern). *(hot — nekonzistence create/update)*
- **WO-18 `NL`** — `timelineCalendarSlug`: settings DTO `@ValidateIf(v!==null) @IsString @MaxLength(64)`, DB `default null`. `null` = fallback na první config. Round-trip null.

---

## Delta parity (plní sweep)

> Sweep 2026-06-05. ValidationPipe = `whitelist: true, transform: true` **bez `forbidNonWhitelisted`** (`backend/src/main.ts:15`).

**WO-D1** (🟠 K-F12 potvrzeno) create↔update DTO délkový drift (`name`/`description`/`playersWanted`) — FE: settings tab validuje přes `basicInfoSchema` (`worldSettingsSchema.ts:9-21` `name min2/max60`, `description max1000`, `playersWanted max500`) · BE DTO: `create-world.dto.ts:20-26` má `@MaxLength` (name 60, description 1000, playersWanted 500), ale `update-world.dto.ts:26,27,31` má **jen `@IsString` bez `@MaxLength`** · DB: `world.schema.ts:8,16,20` bez `maxlength` · **rozpor:** přímý `PATCH /worlds/:id` (nebo klient mimo FE) s `name`/`description`/`playersWanted` přes limit **projde a uloží se** — server délku na update nevynucuje (FE tab ano, ale jen FE). Žádná 400, žádný drop — uloží se nadlimitní hodnota. · **dopad na data:** v produkční DB mohou existovat nadlimitní hodnoty, pokud někdo poslal PATCH mimo FE; po přidání limitu na update DTO je nutné ověřit existující dokumenty (název >60 atd.); migrace ano (kontrola/ořez). · **návrh:** doplnit `@MaxLength` na `update-world.dto.ts` shodně s create (name 2-60, description 1000, playersWanted 500); ideálně i `min` na name.

**WO-D2** (🟠 K-F12 potvrzeno) slug formát/délka nevynucen server-side — FE: `useWorldSlug.ts:26-35` `slugify` garantuje `[a-z0-9-]` max40 + inline `≥2` + availability check (`CreateWorldPage.tsx:82-83`) · BE DTO: `create-world.dto.ts:21` `@MinLength(2) @MaxLength(40)` **bez `@Matches`**; `update-world.dto.ts` slug pole **vůbec nemá** (rename jde přes service `renameSlug` `worlds.service.ts:512`) · DB: `world.schema.ts:9` `required,unique,lowercase` **bez regexu** · **rozpor:** přímý `POST /worlds` se slugem `Foo Bar` nebo `abc_def` projde DTO (chybí `@Matches`) → uloží se nevalidní slug (lowercase transform z DB udělá `foo bar`, mezera zůstane). FE je jediná pojistka formátu. · **dopad na data:** možné nevalidní slugy v DB (mezery/podtržítka) od přímých POST; po přidání `@Matches` ověřit existující `slug` + `previousSlugs`; migrace ano. · **návrh:** přidat `@Matches(/^[a-z0-9-]+$/)` na create DTO slug (shoda s `defaultCalendarSlug` patternem); `renameSlug` už server-side regex má (`worlds.service.ts:507`).

**WO-D3** (🟠 nový) `imageUrl` clear přes `@IsUrl` shodí 400 — FE: settings `BasicInfoTab.tsx:408` clear nastaví `setValue("imageUrl", "")`, submit pošle `patch.imageUrl = ""` (`BasicInfoTab.tsx:126-127`); zod `worldSettingsSchema.ts:22` `imageUrl: z.string()` (bez `.url()`, `''` projde) · BE DTO: `update-world.dto.ts:28` `@IsOptional @IsUrl()` — `@IsUrl` **odmítá prázdný string** → 400; create DTO naopak `@IsString` (`create-world.dto.ts:23`) · DB: `world.schema.ts:17` `imageUrl?` bez limitu · **rozpor:** smazání titulního obrázku světa v nastavení vrátí **400 Bad Request** (na rozdíl od `themeBackgroundUrl`, který má v service clear-workaround pro `''`/`null` — `worlds.service.ts:476-477` — `imageUrl` žádný nemá). · **dopad na data:** žádné nevalidní dokumenty; jen UX blok (obrázek nelze smazat). Migrace ne. · **návrh:** buď FE posílat `null` + DTO `@ValidateIf(v!==null) @IsString` (vzor `themeBackgroundUrl`), nebo na update DTO změnit `@IsUrl` → `@IsString` (volnější, konzistentní s create). Doporučuji vzor `themeBackgroundUrl` (`null` = `$unset`).

## Round-trip / migrační poznámky

> _WO-02 slug: případné přidání `@Matches` na DB/DTO = kontrola existujících slugů (server běží). WO-05 accessMode: pokud se přidá DB `enum`, ověřit, že žádný dokument nemá legacy hodnotu. WO-14 calendars: A→B→A round-trip seedovaných konfigů (months/seasons/celestialBodies beze ztráty). WO-15 NM: defaultCalendarSlug↔defaultCalendarConfigSlug mapping potvrdit M4 round-tripem._
