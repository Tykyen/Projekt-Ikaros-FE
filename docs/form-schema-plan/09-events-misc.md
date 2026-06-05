# 09 — Events & misc (game-event · timeline · currency · ikaros news · ikaros event · sound)

> **Entity:** `GameEvent` (světová akce), `TimelineEvent` (osa světa), `WorldCurrency` (měna), `IkarosNews`
> (platformová novinka), `IkarosEvent` (platformová akce), `Sound` (zvuk). · **FE styl:** zod (`*Schema.ts`)
> + inline (`SoundFormModal` useState).
> **Osy:** `RQ` `LN` `RG` `RN` · `XF` `SAN` `EN` · perspektivy **P2** (round-trip / typ) + **P5** (sanitizace rich-textu).
> Nálezy → [`../form-schema-audit.md`](../form-schema-audit.md) (`EV-xx`). **Stav: ✅ sweep 2026-06-05 — 7 nálezů (EV-D1…D7), z toho 1× 🔴 aktivní stored XSS (timeline text).**

Vrstvy (FE zod ↔ BE DTO ↔ DB `@Prop`):

| Entita | FE | BE DTO | DB schema |
|---|---|---|---|
| game-event | [createGameEventSchema.ts](../../src/features/world/lib/createGameEventSchema.ts) | [create-game-event.dto.ts](../../../Projekt-ikaros/backend/src/modules/game-events/dto/create-game-event.dto.ts) · [update-game-event.dto.ts](../../../Projekt-ikaros/backend/src/modules/game-events/dto/update-game-event.dto.ts) | [game-event.schema.ts](../../../Projekt-ikaros/backend/src/modules/game-events/schemas/game-event.schema.ts) |
| timeline | [timelineEventSchema.ts](../../src/features/world/pages/TimelinePage/lib/timelineEventSchema.ts) | [create-timeline-event.dto.ts](../../../Projekt-ikaros/backend/src/modules/timeline/dto/create-timeline-event.dto.ts) · [celestial-override.dto.ts](../../../Projekt-ikaros/backend/src/modules/timeline/dto/celestial-override.dto.ts) | [timeline-event.schema.ts](../../../Projekt-ikaros/backend/src/modules/timeline/schemas/timeline-event.schema.ts) |
| currency | [currencies/validation.ts](../../src/features/world/currencies/validation.ts) | [update-world-currencies.dto.ts](../../../Projekt-ikaros/backend/src/modules/world-currencies/dto/update-world-currencies.dto.ts) | [world-currencies.schema.ts](../../../Projekt-ikaros/backend/src/modules/world-currencies/schemas/world-currencies.schema.ts) |
| ikaros news | [createNewsSchema.ts](../../src/features/ikaros/lib/createNewsSchema.ts) | [create-ikaros-news.dto.ts](../../../Projekt-ikaros/backend/src/modules/ikaros-news/dto/create-ikaros-news.dto.ts) | [ikaros-news.schema.ts](../../../Projekt-ikaros/backend/src/modules/ikaros-news/schemas/ikaros-news.schema.ts) |
| ikaros event | [createIkarosEventSchema.ts](../../src/features/ikaros/lib/createIkarosEventSchema.ts) | [create-ikaros-event.dto.ts](../../../Projekt-ikaros/backend/src/modules/ikaros-events/dto/create-ikaros-event.dto.ts) | [ikaros-event.schema.ts](../../../Projekt-ikaros/backend/src/modules/ikaros-events/schemas/ikaros-event.schema.ts) |
| sound | [SoundFormModal.tsx](../../src/features/world/sounds/components/SoundFormModal.tsx) (inline) | [create-sound.dto.ts](../../../Projekt-ikaros/backend/src/modules/sounds/dto/create-sound.dto.ts) | [sound.schema.ts](../../../Projekt-ikaros/backend/src/modules/sounds/schemas/sound.schema.ts) |

---

### game-event

> Světová herní akce. `groupOnly:true` ⇒ `targetGroup` nesmí být null (FE `refine` ↔ BE — viz `XF`).
> `date` má identický ISO-prefix regex FE i BE (`/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/`) — DB ukládá `date` jako **string** (ne Date).

#### Soupis

| # | Pole | Typ | FE zod | hl. osa |
|---|---|---|---|---|
| EV-01 | `title` | string | `min(1) max(200)` | `LN` `RQ` |
| EV-02 | `date` | string | `min(1)` + ISO regex | `RG` `RQ` |
| EV-03 | `description` | string | `max(5000)` opt `or('')` | `LN` |
| EV-04 | `imageUrl` | string\|null | (modal) ⬜ | `RG` `NL` |
| EV-05 | `imageFocalX/Y` | number | (modal) 0–100 ⬜ | `RN` |
| EV-06 | `imageZoom` | number | (modal) 25–400 ⬜ | `RN` |
| EV-07 | `imageFit` | enum | `'cover'\|'contain'` ⬜ | `EN` |
| EV-08 | `targetGroup` | string\|null | `nullable optional` | `XF` |
| EV-09 | `groupOnly` | bool | `default false` + refine | `XF` `TY` |
| EV-10 | `confirmable` | bool | `default true` | `TY` `DF` |

#### Matice

| # | Pole | FE (zod) | BE DTO | DB `@Prop` | Δ |
|---|---|---|---|---|---|
| EV-01 | title | `min(1) max(200)` | `@MinLength(1) @MaxLength(200)` | `required` | ⬜ |
| EV-02 | date | `min(1)` + `/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/` | `@Matches(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/)` | `required` **string** | ⬜ **hot** (DB string ne Date — ISO prefix jediná pojistka; sekundy/TZ nevynuceny) |
| EV-03 | description | `max(5000)` opt | `@MaxLength(5000)` opt | `default ''` | ⬜ |
| EV-04 | imageUrl | ⬜ ověřit FE | `@MaxLength(2048)` `@Matches(/^(https?:\/\/|\/)/)` | `default null` | ⬜ `NL` (FE smaže `''` vs DB null) |
| EV-05 | imageFocalX/Y | ⬜ | `@Min(0) @Max(100)` (+update `@ValidateIf !==null`) | `default null` | ⬜ `RN` |
| EV-06 | imageZoom | ⬜ | `@Min(25) @Max(400)` | `default null` | ⬜ `RN` |
| EV-07 | imageFit | ⬜ | `@IsIn(['cover','contain'])` | `enum ['cover','contain',null]` | ⬜ `EN` |
| EV-08 | targetGroup | `nullable opt` | `@MaxLength(64)` opt nullable | `default null` | ⬜ (FE bez délky 64) |
| EV-09 | groupOnly | refine(`groupOnly→targetGroup≠null/''`) | `@IsBoolean` opt (**bez `@ValidateIf`**) | `default false` | ⬜ **hot** `XF` (FE refine vynutí vztah, BE **ne** → `groupOnly:true` bez targetGroup projde BE → akce špatně cílí) |
| EV-10 | confirmable | `default true` | `@IsBoolean` opt | `default false` | ⬜ `DF` (FE default true ↔ DB default false) |

---

### timeline-event

> Osa světa. `year` int bez min/max (záporné/BC povolené), `month/day` min 1 (horní mez dynamicky proti
> calendar configu = FE `.refine` v modalu, ne v schématu). `text` až 50 000 znaků (rich).

#### Soupis

| # | Pole | Typ | FE zod | hl. osa |
|---|---|---|---|---|
| EV-11 | `title` | string | `min(1) max(200)` | `LN` `RQ` |
| EV-12 | `year` | number | `int()` (bez min/max) | `RN` `TY` |
| EV-13 | `month` | number | `int min(1)` | `RN` |
| EV-14 | `day` | number | `int min(1)` | `RN` |
| EV-15 | `hour` | number | `int 0–23` nullable opt | `RN` `NL` |
| EV-16 | `text` | string | `min(1) max(50000)` | `LN` `SAN` |
| EV-17 | `imageUrl` | string\|null | nullable opt | `RG` `NL` |
| EV-18 | `imageFocalX/Y` | number | `0–100` nullable opt | `RN` |
| EV-19 | `link` | string | `url()` nullable opt `or('')` | `RG` `NL` |
| EV-20 | `pageSlug` | string | `/^[a-z0-9-]+$/ max(200)` nullable opt | `RG` `NL` |
| EV-21 | `celestialOverrides[]` | {bodyId,phase}[] | array, `phase` enum 8 fází | `EN` `WL` |

#### Matice

| # | Pole | FE (zod) | BE DTO | DB `@Prop` | Δ |
|---|---|---|---|---|---|
| EV-11 | title | `min(1) max(200)` | `@IsNotEmpty @MaxLength(200)` | `required maxlength:200` | ⬜ |
| EV-12 | year | `int()` | `@IsInt` | `required` (Number, bez min) | ⬜ `TY` (žádný min/max nikde — záměr BC) |
| EV-13 | month | `int min(1)` | `@IsInt @Min(1)` | `required min:1` | ⬜ (horní mez jen FE refine dle calendar) |
| EV-14 | day | `int min(1)` | `@IsInt @Min(1)` | `required min:1` | ⬜ |
| EV-15 | hour | `int 0–23` null opt | `@IsInt @Min(0) @Max(23)` opt | `default null` | ⬜ `NL` |
| EV-16 | text | `min(1) max(50000)` | `@IsNotEmpty @MaxLength(50000)` | `required maxlength:50000` | ⬜ **hot** `SAN` (rich-text — ověřit sanitizaci; DTO jen string, skutečné pravidlo v service?) |
| EV-17 | imageUrl | nullable opt | `@Matches(/^(https?:\/\/|data:)/)` opt | `default null` | ⬜ `RG` (FE bez URL regexu ↔ BE povolí i `data:`) |
| EV-19 | link | `url()` null opt `or('')` | `@Matches(/^https?:\/\//)` opt | `default null` | ⬜ `RG` (zod url() ↔ BE jen http(s) prefix; `''` handling) |
| EV-20 | pageSlug | `/^[a-z0-9-]+$/ max(200)` | `@Matches(/^[a-z0-9-]+$/) @MaxLength(200)` opt nullable | `default null` | ⬜ (regex shoda — ověřit) |
| EV-21 | celestialOverrides[] | `array({bodyId, phase enum 8})` | `@ValidateNested` `CelestialOverrideDto` (`bodyId @IsNotEmpty`, `phase @IsIn(8 fází)`) | `[MixedArraySubSchema]` | ⬜ `EN` `WL` (8 fází FE literal ↔ BE `@IsIn` — dvě kopie; DB Mixed nevynutí) |

---

### currency

> Měna světa, ukládá se jako pole `items[]` ve `WorldCurrencies` (Mixed array). **Pozor:** existují **dvě**
> BE definice — kanonická [`world-currencies/`](../../../Projekt-ikaros/backend/src/modules/world-currencies/)
> (`@Min(0.0001)`) a vedlejší ve [`update-world-settings.dto.ts`](../../../Projekt-ikaros/backend/src/modules/worlds/dto/update-world-settings.dto.ts)
> (`@Min(0)`). Ověřit, která se reálně používá.

#### Soupis

| # | Pole | Typ | FE zod | hl. osa |
|---|---|---|---|---|
| EV-22 | `code` | string | `toUpperCase` + `/^[A-Z0-9]{1,8}$/` + unique superRefine | `RG` `LN` |
| EV-23 | `name` | string | `min(1) max(40)` | `LN` `RQ` |
| EV-24 | `symbol` | string | `max(8)` (required string, default `''` přes RHF) | `LN` |
| EV-25 | `rate` | number | `min(0.0001) max(1_000_000)` | `RN` |
| EV-26 | `id` | string | (interní, RHF) | `NM` |

#### Matice

| # | Pole | FE (zod) | BE DTO `WorldCurrencyItemDto` | DB `world_currencies.items` | Δ |
|---|---|---|---|---|---|
| EV-22 | code | `/^[A-Z0-9]{1,8}$/` + unique (FE superRefine) | `@IsString` **(žádný regex, žádná délka)** | Mixed (Mixed array) | ⬜ **hot** `RG`/`LN` (BE **nevaliduje** code formát ani 1–8; FE jediná pojistka → red-team `code:'!!!!'` projde BE+DB) |
| EV-23 | name | `min(1) max(40)` | `@IsString` (bez délky) | Mixed | ⬜ `LN` (BE bez max 40) |
| EV-24 | symbol | `max(8)` | `@IsString` (bez délky) | Mixed | ⬜ `LN` (BE bez max 8) |
| EV-25 | rate | `min(0.0001) max(1_000_000)` | `@IsNumber @Min(0.0001)` (canonical) / `@Min(0)` (world-settings dto) | Mixed | ⬜ **hot** `RN` (FE má i max 1M — BE bez horní meze; + dvě BE min: 0.0001 vs 0) |
| EV-26 | id | RHF interní | `@IsString` opt | Mixed | ⬜ `NM` (FE generuje? server? unique check jen FE in-memory) |

> **`code` unique** je hlídaný jen FE superRefine (in-memory nad `existingItems`). BE/DB **negarantuje**
> unique v rámci `items[]` (jen `worldId` má `unique:true` na dokumentu, ne items). Race / přímý request → duplicitní code.

---

### ikaros news

> Platformová novinka (jen globální Admin/Superadmin). `content` je rich/HTML (FE editor) → **service ukládá
> raw, žádný `sanitize-html`** (ověřeno v `ikaros-news.service.ts`).

#### Soupis & matice

| # | Pole | Typ | FE (zod) | BE DTO | DB `@Prop` | Δ |
|---|---|---|---|---|---|---|
| EV-27 | `title` | string | `min(1) max(300)` | `@IsNotEmpty @MaxLength(300)` | `required` | ⬜ |
| EV-28 | `content` | string (HTML) | `min(1) max(10000)` | `@IsNotEmpty @MaxLength(10000)` | `required` | ⬜ **hot** `SAN` (service ukládá content **bez sanitizace** → `<script>` přežije do DB → uložené XSS; ověřit FE editor sadu vs render) |
| EV-29 | `type` | enum | `enum(['info','warning','system'])` opt | `@IsIn(['info','warning','system'])` opt | `enum [...] default 'info'` | ⬜ `EN` (3 kopie: FE literal + BE `@IsIn` + DB enum) |
| EV-30 | `imageUrl` | string | `max(2048)` opt | `@MaxLength(2048)` opt | `@Prop()` — | ⬜ (FE/BE bez URL regexu) |

---

### ikaros event

> Platformová akce (analog news, oddělená kolekce `ikaros_events`). **Pozor `TY`:** FE/DTO `date` = ISO
> **string**, ale DB `@Prop({ type: Date })` → transform string→Date při zápisu.

#### Soupis & matice

| # | Pole | Typ | FE (zod) | BE DTO | DB `@Prop` | Δ |
|---|---|---|---|---|---|---|
| EV-31 | `title` | string | `min(1) max(200)` | `@IsNotEmpty @MaxLength(200)` | `required maxlength:200` | ⬜ |
| EV-32 | `date` | string | `min(1)` + ISO regex | `@IsString @Matches(ISO prefix)` | **`type:Date required`** | ⬜ **hot** `TY` (FE/DTO string ↔ DB Date → round-trip: uloží jako Date, GET vrátí Date/ISO? FE čeká string) |
| EV-33 | `description` | string | `max(5000)` opt `or('')` | `@MaxLength(5000)` opt | `maxlength:5000` opt | ⬜ |
| EV-34 | `confirmable` | bool | `boolean` (required, bez default) | `@IsBoolean` opt | `default true` | ⬜ `DF`/`RQ` (FE required ↔ BE opt + DB default true) |
| EV-35 | `imageUrl/Focal/Zoom/Fit` | — | (modal, ne v schématu) ⬜ | `@MaxLength(2048)` / `0–100` / `25–400` / `@IsIn` | `@Prop()` (focal/zoom bez range na DB) | ⬜ `RN`/`EN` (DTO validuje, DB ne) |

---

### sound

> Zvuk světa/platformy. FE = **inline `useState`** (žádný zod): povinné `name` (trim>0) + `youtubeUrl`
> (validní přes `extractYoutubeId`). Metadata = selecty (enumy). BE má 10 enumů (`@IsEnum`).

#### Soupis & matice

| # | Pole | Typ | FE (inline) | BE DTO | DB `@Prop` | Δ |
|---|---|---|---|---|---|---|
| EV-36 | `name` | string | `trim().length>0` (žádný max) | `@IsString` (bez délky) | `required` | ⬜ `RQ` (FE i BE bez max — ověřit) |
| EV-37 | `youtubeUrl` | string | `extractYoutubeId()≠null` | `@IsString` **(žádná YT validace BE)** | `required` | ⬜ **hot** `RG` (FE validuje YT formát, BE jen `@IsString` → přímý request s libovolnou URL projde) |
| EV-38 | `mediaType` | enum | select `MEDIA_TYPE_LABELS` | `@IsEnum(SoundMediaType)` opt | `enum default music` | ⬜ `EN` (FE labels ↔ BE enum — 5 hodnot, ověřit množinu) |
| EV-39 | `primaryFunction` | enum | select (12) | `@IsEnum` opt | `enum default safe` | ⬜ `EN` |
| EV-40 | `environment` | enum | select (12) | `@IsEnum` opt | `enum default neutral` | ⬜ `EN` |
| EV-41 | `emotionalTone` | enum | select (12) | `@IsEnum` opt | `enum default calm` | ⬜ `EN` |
| EV-42 | `intensity` | number | select 1–5 | `@IsNumber @Min(1) @Max(5)` opt | `default 1 min:1 max:5` | ⬜ `RN` |
| EV-43 | `loop` | bool | checkbox (default true) | `@IsBoolean` opt | `default true` | ⬜ |
| EV-44 | `factionStyle/techLevel/magicLevel/combatEnergy` | enum | selecty | `@IsEnum` opt | enum + defaults | ⬜ `EN` (4 další enumy — množinová shoda FE labels ↔ BE) |
| EV-45 | `onsetProfile/outroProfile` | enum | **není ve FE formuláři** | `@IsEnum` opt | enum + defaults | ⬜ (FE nenastavuje → DB default; ověřit, že nevadí) |
| EV-46 | `tags[]` | string[] | (default []) | `@IsArray @IsString({each})` opt | `[String] default []` | ⬜ |
| EV-47 | `notes` | string | textarea (trim) | `@IsString` opt | `default ''` | ⬜ |
| EV-48 | `duration` | number | **není ve FE** | `@IsNumber @Min(0)` opt | `default 0` | ⬜ |

---

## Kontrolní body (co u každého pole ověřit při sweepu)

- **EV-09 `groupOnly` `XF` (hot)** — FE `refine` vynutí `groupOnly:true ⇒ targetGroup≠null/''`, ale BE DTO
  `groupOnly` je jen `@IsBoolean` **bez `@ValidateIf`** vztahu k targetGroup. Red-team: `{groupOnly:true,
  targetGroup:null}` → BE 201 → akce cílí na nikoho/všechny. (Paměť: cross-field rozpor v README.)
- **EV-02 / EV-32 `date` `RG`/`TY` (hot)** — ISO regex `/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/` identický FE↔BE,
  ale: game-event DB ukládá `date` **string** (regex jediná pojistka, sekundy/offset libovolné), ikaros-event DB
  `type:Date` (string→Date transform). Round-trip M4: co vrátí GET (string vs ISO Date)?
- **EV-22 `currency code` `RG`/`LN` (hot)** — FE `/^[A-Z0-9]{1,8}$/` + `toUpperCase` + unique; BE
  `WorldCurrencyItemDto.code` je **jen `@IsString`** (žádný formát, žádná délka, žádná unique). Red-team:
  `code:'btc-x!!'` / 20 znaků / duplikát → BE+DB akceptují. **FE je jediná pojistka.** Dopad na data: zpřísnit
  BE = zkontrolovat existující měny v DB (legacy lowercase/dlouhé kódy?).
- **EV-25 `rate` `RN`** — FE `0.0001–1_000_000`; BE canonical `@Min(0.0001)` (bez max), world-settings dto
  `@Min(0)`. Ověřit, který endpoint FE volá; horní mez 1M jen FE.
- **EV-28 `news content` `SAN` (hot)** — `ikaros-news.service` ukládá `content` **raw, bez `sanitize-html`**
  (potvrzeno). FE editor (jaká sada tagů?) → DB → render. `<script>` přežije = uložené XSS. Ověřit render
  (dangerouslySetInnerHTML?) a doporučit sanitizaci. **P5 round-trip.**
- **EV-16 `timeline text` `SAN`** — rich, `@MaxLength(50000)` jen délka. Ověřit, zda timeline service
  sanitizuje (analogicky news — pravděpodobně ne). Stejná XSS třída jako EV-28.
- **EV-37 `youtubeUrl` `RG`** — FE `extractYoutubeId` validuje, BE jen `@IsString`. Přímý request s ne-YT
  URL projde. Přehrávač pak selže až na renderu. Doporučit BE `@Matches` na YT host.
- **EV-29/38–45 `EN`** — enumy v **2–3 kopiích** (FE literal/labels mapy v `soundEnums.ts` + BE `enum`/`@IsEnum`
  + DB `enum`). Shoda *dnes* ≠ shoda po změně (paměť: latentní drift). Množinová kontrola každého enumu.
- **EV-45/48 sound `onsetProfile`/`outroProfile`/`duration`** — BE DTO je validuje, ale **FE formulář je
  vůbec nenastavuje** → vždy DB default. Ověřit, že to není zapomenuté pole (UX), ne datový bug.
- **EV-10 / EV-34 `confirmable` `DF`** — game-event: FE default `true`, DB default `false` (rozpor!);
  ikaros-event: FE required bez default, BE opt + DB default true. Ověřit, co se uloží při neodeslání.
- **EV-21 `celestialOverrides` `EN`/`WL`** — `phase` 8 fází FE enum ↔ BE `@IsIn` (dvě kopie konstanty
  `LUNAR_PHASES`); DB `[MixedArraySubSchema]` nevynutí. `@ValidateNested` per prvek — ověřit, že mapper neztrácí.

---

## Delta parity (sweep 2026-06-05 — ověřeno přímým čtením)

> Lokální ID `EV-Dx`; globální `F-xx` přiděluje [registr](../form-schema-audit.md).

- **EV-D1** `timeline text` `SAN` 🔴 — **BE neukládá sanitizovaně** (grep `saniti` v `backend/.../timeline` = 0 výskytů; `@MaxLength(50000)` jediná kontrola) · FE render [TimelineEventCard.tsx:184](../../src/features/world/pages/TimelinePage/components/TimelineEventCard.tsx#L184) `dangerouslySetInnerHTML={{ __html: event.text }}` **bez DOMPurify** · **rozpor:** writer (PomocnyPJ+) vloží `<img src=x onerror=…>`/`<script>` → uloží se raw → **spustí se každému čtenáři světa = aktivní stored XSS** · **dopad na data:** existující timeline texty mohou nést legit HTML i payload → sanitizace na write + client DOMPurify na render; backfill/sanitizace existujících záznamů · **návrh:** `sanitizeRichText(text)` v timeline service (jako pages/articles) + DOMPurify ve `TimelineEventCard`.
- **EV-D2** `ikaros news content` `SAN` 🟡 — BE [ikaros-news](../../../Projekt-ikaros/backend/src/modules/ikaros-news) neukládá sanitizovaně (grep = 0), ale `content` se **nikde nerenderuje** přes `dangerouslySetInnerHTML` (grep FE = 0 v ikaros) · **rozpor:** žádný aktivní XSS dnes, ale latentní — jakmile někdo přidá HTML render, stane se z toho EV-D1 · **dopad na data:** žádný teď · **návrh:** preventivně sanitizovat na write (konzistence s articles/discussions, defense-in-depth).
- **EV-D3** `currency code/name/symbol/rate` `RG`/`LN`/`RN` 🟠 — FE [validation.ts:18,33,36,40](../../src/features/world/currencies/validation.ts) `code /^[A-Z0-9]{1,8}$/`+unique, `name max40`, `symbol max8`, `rate ≤1M` · BE [WorldCurrencyItemDto:13-16](../../../Projekt-ikaros/backend/src/modules/world-currencies/dto/update-world-currencies.dto.ts#L13) `code/name/symbol` jen `@IsString` (**žádný formát/délka**), `rate @Min(0.0001)` (**bez max**) · **rozpor:** přímý request `code:'!!!!'`/20 znaků/duplikát/`rate:1e9` projde BE+DB; **FE jediná pojistka**; unique jen FE in-memory · **dopad na data:** zpřísnění BE → zkontrolovat existující měny (legacy formáty/dlouhé kódy) · **návrh:** zrcadlit FE pravidla do `WorldCurrencyItemDto` (`@Matches`+`@MaxLength`+`@Max`), unique řešit v service.
- **EV-D4** `game-event groupOnly` `XF` 🟠 — FE [createGameEventSchema.ts:32-42](../../src/features/world/lib/createGameEventSchema.ts#L32) `.refine(groupOnly ⇒ targetGroup≠null/'')` · BE [create-game-event.dto.ts:73-75](../../../Projekt-ikaros/backend/src/modules/game-events/dto/create-game-event.dto.ts#L73) `groupOnly @IsOptional @IsBoolean` **bez `@ValidateIf`** vztahu · **rozpor:** `{groupOnly:true, targetGroup:null}` projde BE → akce cílí na nikoho/všechny; FE komentář „BE i FE validace" je **nepravdivý** · **dopad na data:** žádný (existující eventy max runtime mis-cíl) · **návrh:** `@ValidateIf(o=>o.groupOnly)@IsNotEmpty() targetGroup` na BE + oprava komentáře.
- **EV-D5** `game-event confirmable` `DF` 🟡 — FE [createGameEventSchema.ts:30](../../src/features/world/lib/createGameEventSchema.ts#L30) `default(true)` · BE [DTO:77-79](../../../Projekt-ikaros/backend/src/modules/game-events/dto/create-game-event.dto.ts#L77) `@IsOptional` bez default · DB `default false` (dle plánu) · **rozpor:** FE vždy pošle `true` (zod default), ale přímý request bez pole → DB `false`, zatímco UI předpokládá `true` · **dopad na data:** žádný · **návrh:** sjednotit default (DB→true nebo FE explicitně posílat).
- **EV-D6** `sound youtubeUrl` `RG` 🟡 — FE inline `extractYoutubeId()≠null` · BE [create-sound.dto.ts:26](../../../Projekt-ikaros/backend/src/modules/sounds/dto/create-sound.dto.ts#L26) `youtubeUrl @IsString` (**žádná YT validace**) · **rozpor:** přímý request s libovolnou URL projde, přehrávač selže až na renderu · **dopad na data:** případné legacy ne-YT URL · **návrh:** BE `@Matches` na YT host (volitelné, nízká priorita).
- **EV-D7** `game-event targetGroup` `LN` 🟡 — FE nullable bez délky · BE `@MaxLength(64)` · **rozpor:** FE pustí >64 znaků → BE 400 · **dopad na data:** žádný · **návrh:** FE doplnit `max(64)` (kosmetika).

**✅ Shoda (ověřeno):** game-event `title`/`date`/`description` (FE↔BE limity i ISO regex sedí); ikaros news `title`(300)/`content`-délka(10000)/`type` enum/`imageUrl`(2048); sound enumy (BE `@IsEnum` importuje z `sound.schema` = **single source**, ne dual-kopie); sound `name` (FE i BE bez max — konzistentní).

## Round-trip / migrační poznámky

> _`date` (EV-02 game-event string vs EV-32 ikaros Date) = round-trip M4 (co vrátí GET). `currency code`
> zpřísnění BE/DB = migrace existujících měn (legacy formáty/duplikáty) — povinná kolonka „Dopad na data".
> `news content` / `timeline text` sanitizace = pokud se přidá sanitize-html, existující uložené HTML může
> ztratit formátování (round-trip P5). `confirmable` default rozpor (EV-10) — ověřit reálně uloženou hodnotu._
