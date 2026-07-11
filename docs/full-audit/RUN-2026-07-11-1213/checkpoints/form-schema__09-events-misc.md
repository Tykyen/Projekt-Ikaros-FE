# Checkpoint — form-schema / 09 events-misc (RUN-2026-07-11-1213)

> READ-ONLY re-audit oblasti `docs/form-schema-plan/09-events-misc.md`. Styl form-schema, prefix `F-`.
> Vrstvy FE zod/inline ↔ BE DTO ↔ DB `@Prop` (+ service sanitizace). Úroveň dosažena **L2** (strukturální
> kontrakt ověřen napříč 3 vrstvami přímým čtením; round-trip M4 nespuštěn).
> **Rozšířeno o povrchy, které plán 09 NEmapoval, ale task je jmenuje: calendar + weather + event-comments.**

## Verdikt: bez nových 🔴/🟠. 1× 🆕 🟡 (robustness), zbytek ♻️ (vše z registru ověřeno FIXED).

---

## ♻️ Ověřené opravy z registru — všechny drží (L2)

| ID | Podstata | Stav v kódu |
|---|---|---|
| **F-02** 🔴 timeline `text` stored XSS | `timeline.service.ts:97,167,210` `sanitizeRichText()` na **write i read** (idempotentní, kryje i legacy bez migrace). Test `timeline.service.spec.ts:327`. **Drží.** *Pozn.:* FE `TimelineEventCard.tsx:185` pořád `dangerouslySetInnerHTML` **bez** DOMPurify — navržená 2. obrana nepřidána, ale read-time BE sanitizace riziko kryje. |
| **F-04** 🟠 currency code/name/symbol/rate | `WorldCurrencyItemDto:17-20` má `@Matches(/^[A-Z0-9]{1,8}$/) @MaxLength(8)` (code), `@MinLength(1)@MaxLength(40)` (name), `@MaxLength(8)` (symbol), `@Min(0.0001)@Max(1000000)` (rate). Zrcadlí FE `validation.ts`. **Drží.** |
| **F-08** 🟠 game-event `groupOnly` cross-field | `create-game-event.dto.ts:75-81` + `update-game-event.dto.ts:90-96` `@ValidateIf(o=>o.groupOnly===true \|\| o.targetGroup!=null) @IsNotEmpty`. `@IsOptional` odebrán (kolidoval). **Drží.** FE komentář „BE i FE validace" je teď pravdivý. |
| **F-10** 🟡 ikaros-news `content` sanitizace | `ikaros-news.service.ts:119,173` `sanitizeRichText(dto.content)` na create+update. **Drží.** |
| **F-11** 🟡 game-event `confirmable` default | `game-event.schema.ts:48` DB `default:true` (align na FE zod `default(true)`). **Drží.** |
| **F-13** 🟡 game-event `targetGroup` FE délka | `createGameEventSchema.ts:28-32` `max(64)` ↔ BE `@MaxLength(64)`. **Drží.** |

## ♻️ Vědomý dluh (beze změny)

- **F-12** 🟣 sound `youtubeUrl` — `create-sound.dto.ts:26` pořád `@IsString` bez YT `@Matches`. Ponecháno dle registru (riziko false-reject validních YT variant). FE `extractYoutubeId` jediná pojistka. Nezměněno.

## ✅ Uzavřené „hot" body plánu (bez findingu)

- **EV-32 `TY`** ikaros-event `date` string↔Date round-trip — `ikaros-event.schema.ts:13` `type:Date`; FE/DTO posílá ISO string → Mongoose auto-cast na write, JSON serializace Date→ISO na GET → FE dostane string zpět. **Funguje, by-design.**
- **Event comments** (`game-events/dto/create-comment.dto.ts`, `update-comment.dto.ts`) — `content` `@MinLength(1)@MaxLength(2000)` plain string, `parentId @MaxLength(64)`, `react-comment` `emoji @MaxLength(16)`. FE renderuje komentáře jako plain text (grep `dangerouslySetInnerHTML` v `*omment*.tsx` = 0) → žádný XSS. **Čisté.**
- **Calendar** (`world-calendar-config/dto/create-world-calendar-config.dto.ts`, `calendars/dto/update-calendar-settings.dto.ts`) — velmi dobře validováno: slug `@Matches(/^[a-z0-9-]+$/)`, `@ArrayMaxSize` na months(36)/celestialBodies(20)/seasons(20)/daysOfWeek(20), `@IsHexColor`, per-prvek nested ranges, leap/lunisolar pravidla `@IsIn`. **Čisté.**
- **Weather generátor** (`create-weather-generator.dto.ts`) — `WeatherGeneratorConfigDto` plně range-checked (temp/wind/pressure/humidity `@Min/@Max`), `weatherTypes @ArrayMinSize(1)` (FIX-70 proti prázdnému poli → 500), Köppen zóny `@IsIn`, `climateZone/monthlyTemps/monthlyStdDev` doplněny (jinak `forbidNonWhitelisted` 400). `set-in-game-date.dto.ts` `@Min/@Max` na year/month/day/hour/minute. `weather-generator-set.dto` má maxlength + ArrayMinSize. **Čisté.**

---

## 🆕 Nový nález

### 🆕 W-1 🟡 `RN`/`LN` — `SetCurrentWeatherDto` má neomezené stringy (manual weather set)

- **Pole / entita:** `SetCurrentWeatherDto` (`backend/src/modules/world-weather/dto/set-current-weather.dto.ts`) — manuální nastavení počasí PJ.
- **BE DTO:** nested třídy bez jakéhokoli `@MaxLength`:
  - `CloudinessDto.value/description` (`:15-16`), `PrecipitationDto.value/description` (`:20-21`), `WindDto.unit` (`:27`), `PressureDto.trend` (`:32`) — jen `@IsString`.
  - `weatherType`, `weatherIcon` (`:44-45`) — `@IsString @IsNotEmpty`, bez max.
  - `WeatherExtraDto.label/value/description` (`:36-38`) — `@IsString`, bez max.
  - `narrativeText` (`:57`) — `@IsString @IsOptional`, bez max.
- **DB:** snapshot padá do `weather-history.schema.ts:21` `@Prop({ type: Object })` (Mixed) → **žádná délková mez ani na DB vrstvě**.
- **FE:** `ManualWeatherModal.tsx` (textarea `narrativeText`, jinak selecty z katalogu) — bez maxLength; render `MapWeatherPanel.tsx:130` / `WeatherGeneratorCard.tsx:337` = `<p>{w.narrativeText}</p>` **plain text (React escape) → žádný XSS**.
- **Rozpor:** kontrast s okolními DTO (weather generator + calendar jsou důsledně bounded). Přímý request/velká textarea → neomezeně velký string do Mixed dokumentu (bloat/DoS-lite). **Není** ztráta dat ani XSS.
- **Klasifikace:** 🆕 (povrch weather NEbyl v plánu 09) · 🟡 robustness · **PJ-only** write (nízká expozice).
- **Dopad na existující data:** žádný; případné zpřísnění (`@MaxLength`) staré snapshoty neruší (Mixed).
- **Návrh:** doplnit `@MaxLength` na `narrativeText` (~2000) a nested weather stringy (~200) v `SetCurrentWeatherDto`, symetricky s generátor DTO. Nízká priorita.

---

## 🔓 Regrese: žádné

Žádná dřívější oprava (F-02/04/08/10/11/13) se nevrátila; všechny 3 vrstvy konzistentní.

## Metoda / úroveň

- M1 (statické čtení 3 vrstev) na všech entitách oblasti + game-event comments + weather + calendar-config.
- Ověřeno přímým čtením: game-event (create/update DTO + schema), timeline (DTO+schema+service sanitizace), currency DTO, sound DTO, ikaros-news (DTO+service), ikaros-event (DTO+schema), weather (5 DTO + history schema), calendar-config + calendar-settings DTO, FE `createGameEventSchema.ts` + `currencies/validation.ts`.
- **L2** dosaženo. Round-trip M4 / red-team M5 nespuštěny (READ-ONLY, mimo rozsah tohoto checkpointu).
