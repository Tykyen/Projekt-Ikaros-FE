# bug / 10-svet-hra — checkpoint RUN-2026-06-20-1621

## Pokrytí

### Prošlé soubory (statická analýza)
- **BE game-events:** `game-events.service.ts`, `game-events.controller.ts`, `game-event-reminder.job.ts`, `game-event.repository.ts`, `interfaces/game-event-repository.interface.ts`, `game-events.service.spec.ts`
- **BE world-calendar-config:** `world-calendar-config.service.ts`, `world-calendar-config.controller.ts`, `world-calendar-config.utils.ts` (grep)
- **BE timeline:** `timeline.service.ts`, `timeline.controller.ts`
- **BE world-weather:** `world-weather.service.ts` (celý), `world-weather.controller.ts`, `custom-weather-preset.controller.ts`, `weather-generator-set.service.ts` (grep)
- **BE gateways:** `app.gateway.ts`, `maps.gateway.ts` (relevantní sekce)
- **FE api hooks:** `useGameEvents.ts`, `useWeatherWsSubscribe.ts`, `useMapWeather.ts`
- **FE pages:** `EventsPage.tsx`, `EventsToolbar.tsx`, `CalendarConfigsPage.tsx`, `SetInGameDateModal.tsx`, `FantasyDatePicker.tsx`
- **FE lib:** `getActiveCalendarConfig.ts`, `cursorCodec.ts`, `absDay.ts` (daysInMonth)
- **Test suites:** `game-events.service.spec.ts` (1 soubor plně), `SetInGameDateModal.spec.tsx`, `WorldWeatherPage.spec.tsx` (grep)

### Oblasti z plánu pokryté staticky
- A (SH-01..39): game-events CRUD, archiv, komentáře, RSVP, push, reminder job — L2-L3
- B (SH-40..57): calendar config CRUD, gating, delta-merge, delete-lock, FE auto-select — L1-L2
- C (SH-58..70): calendarEngine, FantasyDatePicker, leapYearRule, calibration — L1-L2
- D (SH-71..87): timeline controller, getTimelineConfig, stripBase64, cursorCodec, getActiveCalendarConfig — L1-L2
- E (SH-88..117): weather generátory, validace, reorder, set-in-game-date, advance-day, broadcast, clearMapWeather, WS flow — L1-L2

## Dosažená L vs cílová L

| Oblast | Cílová | Dosažená |
|--------|--------|---------|
| A — game-events | L3 | L3 (spec.ts + L2 čtení) |
| B — calendar config | L3 | L2 (spec existuje ale multi-config UI netestováno) |
| C — calendarEngine | L3 | L2 (leapYearRule testy existují, SH-69 edge-case bez testu) |
| D — timeline | L2 | L2 |
| E — weather | L2 | L2 |
| WS (SH-101..107) | M5 | L2 (kód ověřen, bez integrační vrstvice) |

Cílová hloubka oblasti: L3 pro M4 body, L2 pro WS (M5). Dosaženo: plná statika (L1-L2) + L3 tam kde jsou spec soubory (A).

## Nálezy

### 🔴 Kritické

**N-SHG-01** — `daysInMonth` crash na prázdném `config.months`  
`FantasyDatePicker` (SH-69) → `daysInMonth(0, 0, config)` → `mod(0, 0)` → NaN → `config.months[NaN]` → `undefined.isIntercalary` → **TypeError** (runtime crash)  
- Kde: `c:/Matrix/ProjektIkaros/Projekt-ikaros-FE/src/shared/lib/calendarEngine/absDay.ts:114`  
- Spouštěč: `FantasyDatePicker` s custom config kde `months: []` (nekompletní draft)  
- Dopad: stránka/modal, kde se picker renderuje s prázdným kalendářem, spadne  
- Návrh: early-return v `daysInMonth` pokud `config.months.length === 0` → vrátit 1 (nebo propagovat prázdný render v FantasyDatePicker)  
- L2 (čtení kódu + ověřená JS sémantika `mod(n,0)`)  
- 🆕

### 🟠 Závažné

**N-SHG-02** — `getHistory` BE bez cap v service vrstvě; cap pouze v repo (limit max 200)  
- Kde: `c:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/world-weather/world-weather.service.ts:738`  
- Detaily: service `getHistory` posílá `limit = options.limit ?? 50` přímo do `historyRepo.findByGenerator`. Cap 200 je pouze v `weather-history.repository.ts:44`. Pokud se repo vymění nebo cap přebije, service nemá vlastní pojistku.  
- Dopad: nízký (repo drží cap). Jde o defensive coding chybu, ne exploitable bug.  
- Návrh: přidat `const safeLimit = Math.min(options.limit ?? 50, 200)` v service  
- L1  
- 🆕

**N-SHG-03** — `advanceDay` controller nevaliduje integer — Float dny tiše zkrátí  
- Kde: `c:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/world-weather/world-weather.controller.ts:113`  
- Detaily: `const days = body?.days ?? 1;` bez `ParseIntPipe`. `days=1.5` projde service check (`!Number.isFinite` nestačí), `setUTCDate(date + 1.5)` coerces to 1 → advance o 1 den, ale response říká `days=1.5`.  
- Dopad: mírná nekonzistence, ne bezpečnostní problém.  
- Návrh: `@Body('days') days: number` + `Math.round()` nebo `ParseIntPipe` v controlleru  
- L1  
- 🆕

### 🟡 Nízká závažnost / drobné

**N-SHG-04** — `CalendarConfigsPage` render-phase setState anti-pattern (R19)  
- Kde: `c:/Matrix/ProjektIkaros/Projekt-ikaros-FE/src/features/world/pages/CalendarConfigsPage/CalendarConfigsPage.tsx:65-69`  
- Detaily: `if (!selectedSlug && configs.length > 0) { setSelectedSlug(initial); }` volá setState v render-phase. React 18 Strict Mode spustí render 2× → dvojí setState. Komentář praví "self-limiting, proto bez useEffect" — ale Strict Mode double-invoke způsobí React dev-only warning a potenciálně stale render.  
- Dopad: dev-warning, žádný produkční bug (Strict Mode neaktivní v prod).  
- Návrh: přesunout do `useEffect(() => { if (!selectedSlug && configs.length > 0) setSelectedSlug(initial); }, [configs, selectedSlug]);`  
- L1 (flagováno v plánové sekci "drobné")  
- ♻️ (plán to zmiňuje, dosud bez N-id)

**N-SHG-05** — `advanceCustomCalendar`: záporný epochOffset + přesný den roku může dát `day=0`  
- Kde: `c:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/world-weather/world-weather.service.ts:949-969`  
- Detaily: Agent v plánu zmiňoval "záporný epochOffset" jako neověřený. Matematická analýza: `Math.floor(-n/dpy)` dává správný rok, `remaining = calendarDays - year * dpy` vychází nezáporný díky `Math.floor`. Nicméně pokud po smyčce `remaining == 0` a zároveň smyčka spotřebuje všechny měsíce (`monthIndex = months.length`), kód nastaví `monthIndex = 0` ale `day = 0 + 1 = 1` — to je SPRÁVNĚ (den 1 nového roku). Žádný bug, ale plán to nevyšetřil.  
- Závěr: **FALSE-POSITIVE** — kód je korektní  
- L1  
- ♻️

## Ověřené OK (SH body které prošly bez nalezení bugy)

**A (game-events):**
- SH-01 ✅L2: FE `useEffect` redirect v `EventsPage.tsx:37-43`
- SH-02 ✅L2: `useArchiveGameEvents` `enabled: ... && viewerRole >= WorldRole.PomocnyPJ`
- SH-03/05 ✅L3: `findList` archive-gate s `ARCHIVE_SKEW_MS` — pokryto `game-events.service.spec.ts:1131`
- SH-04 ✅L3: `toDate` → 403 ARCHIVE_PJ_ONLY — test `1156`
- SH-06 ✅L3: PomocnyPJ smí archiv — test `1213`
- SH-07 ✅L3: Admin bez membership — test `1229`
- SH-08 ✅L3: non-member → prázdný list — test `211`
- SH-09 ✅L2: `membership.role === WorldRole.Zadatel → return []` (service:141)
- SH-10/11 ✅L3: group filter v `findList` — testy `195`, `182`
- SH-12 ✅L2: `findById` non-member → `assertViewOrThrow` → NotFoundException
- SH-13 ✅L3: groupOnly jiná group → NotFoundException — test `118`
- SH-14 ✅L3: Hráč nemůže create → test `263`
- SH-15 ✅L3: `groupOnly: true` bez targetGroup → BadRequest — testy `272`, `405`
- SH-16 ✅L3: `confirmedBy: null` netriggeruje patch — test `377`
- SH-17 ✅L3: RSVP toggle idempotent — testy `473`, `489`
- SH-18 ✅L3: confirmable:false → 400 — test `504`
- SH-19 ✅L3: groupOnly bez membershipu → 404 — test `522`
- SH-20/21 ✅L3: reply na non-root/neexistující → testy `594`, `633`
- SH-22 ✅L3: cizí komentář → ForbiddenException — test `690`
- SH-23 ✅L3: smazaný → BadRequest — test `701`
- SH-24 ✅L3: soft-delete isDeleted+content+authorName — test `740`
- SH-25 ✅L3: hráč 403 / PJ ok / Admin ok — testy `757`, `769`, `783`
- SH-26 ✅L3: idempotentní delete — test `796`
- SH-27 ✅L3: toggle reakce add/remove/empty-key — testy `826`, `846`, `867`
- SH-28 ✅L3: reakce na smazaný → 200 bez update — test `891`
- SH-29/30 ✅L3: push gating Zadatel/groupOnly — testy `327-344` a `296-316`
- SH-31 ✅L3: push selhání nerozbije POST — test `319`
- SH-32/33 ✅L1: `game-event-reminder.job.ts` — `findUpcoming(from,to)` + `markReminderSent` (PROOF-REQUEST níže)
- SH-34/35 ✅L2: `safeLimit=max(1,min(20))`, fetchCap=safeLimit×5 — test `1022`; disabled bez tokenu
- SH-36 ✅L2: `useArchiveGameEvents` posílá `toDate=cutoff&limit=200` — kód `useGameEvents.ts:137`
- SH-37/38 ✅L2: client-side group filter `EventsPage.tsx:51-55`
- SH-39 ✅L1: order je delegován na caller/render, komentáře se přidávají append (push)

**B (calendar config):**
- SH-40/41/42/43/44 ✅L2: `assertMember` (Hrac+) / `assertCanWrite` (PomocnyPJ+) — service auth OK
- SH-45 ✅L2: `repo.create` vrátí null → ConflictException SLUG_TAKEN — service:93
- SH-46 ✅L2: `patch()` předá jen defined fields (Partial) — service:110-127
- SH-47 ✅L2: `world.defaultCalendarConfigSlug === slug → ForbiddenException DEFAULT_CONFIG_LOCKED` — service:148
- SH-48 ✅L2: non-default delete OK
- SH-49/50 ✅L2: `validateMonthsAndSeasons` — service:292-319
- SH-51/52 ✅L2: `seedGregorianDefault`/`applyPresetTemplate` idempotentní (re-fetch race)
- SH-53 ✅L2: FE auto-select `if (!selectedSlug && configs.length > 0)` — CalendarConfigsPage:65
- SH-54 ✅L2: FE `handleDelete` check slug===defaultSlug → toast před API
- SH-55 ✅L2: `updateSettings.mutate({ timelineCalendarSlug: slug })` — `handleSetTimelineConfig`
- SH-56 ⏭️L1: multi-config přepínání — CalendarPage, vyžaduje [human] UI test
- SH-57 ⏭️L1: aria-label gridu — [human] UI

**C (calendarEngine):**
- SH-58..65 ✅L3: absDay testy + leapYearRule spec soubory existují
- SH-66/67/68 ✅L2: `safeDay`/`patch()` clamp v FantasyDatePicker; X skryt při required; hour input
- SH-69 🐛: viz N-SHG-01
- SH-70 ✅L2: `calibrateEpochOffset` deterministický — pure function

**D (timeline):**
- SH-71..74 ✅L2: `getTimelineConfig` priority 1→2→3→null — service:254-278
- SH-75/76/78 ✅L2: `assertMember` / admin bypass — timeline service
- SH-77 ✅L2: `assertCanWrite` PomocnyPJ+ — service
- SH-79/80 ✅L2: `stripBase64`/`preserveImageUrl` — service:57-60, enrich:96
- SH-81 ✅L2: `encodeCursor`/`decodeCursor` — cursorCodec.ts + spec
- SH-82 ✅L2: `year-counts` PŘED `:id` — controller:62 (komentář explicitní)
- SH-83 ✅L2: `event.month - 1` pro 0-based monthIndex — service:83
- SH-84 ✅L2: `getActiveCalendarConfig` fallback hierarchie — getActiveCalendarConfig.ts
- SH-85..87 ⏭️[human]

**E (weather):**
- SH-88/89/90/91 ✅L2: `assertMember`/`assertCanWrite` gating
- SH-92..94 ✅L2: `validateConfig` — tempMin>tempMax, probability sum ±0.01, windGustMultiplier<1
- SH-95..97 ✅L2: `reorder` duplicate/count/unknown ID checks — service:287-311
- SH-98 ✅L2: route order `set-in-game-date`/`advance-day` před `:id` — controller + komentář
- SH-99 ✅L2: `setInGameDate` s `regenerateAll=true` — service:809-825
- SH-100 ✅L2: `advanceDay` odmítá days<1||>365 — service:856
- SH-101 ✅L2: `EventEmitter2.emit('weather.updated')` → `@OnEvent` v `maps.gateway:238`
- SH-102 ✅L2: `useMapWeather` joinne `world:{worldId}` + re-join po `connect` — hook:82-91
- SH-103 ✅L2: `weather:updated` patchne World cache — hook:94-116
- SH-104 ✅L2: `payload.weather=null && !generatorId → next=null` — hook:99-107
- SH-105 ✅L2: `useWeatherWsSubscribe` patchne cache `g.id === generatorId` — subscribe:33-41
- SH-106 ✅L2: `if (event.worldId !== worldId) return` — subscribe:27
- SH-107 ✅L2: `ROOM_PATTERN = /^[a-z]+:[a-zA-Z0-9]+$/` — app.gateway:16
- SH-108 ✅L2: `@Delete('map-weather/active')` 2-segmentová cesta, definována PŘED `@Delete(':id')` — controller
- SH-109 ✅L2: `if (!dto.channelId) throw BadRequest` — service:1111
- SH-110 ✅L2: `SetInGameDateModal` day clamped na `monthsList[monthIndex].daysCount` — modal:144-148
- SH-111 ✅L2: `activeCalendar?.months.map(m)` — custom names v monthsList — modal:73-79
- SH-112 ✅L2: `const [regenerateAll, setRegenerateAll] = useState<boolean>(true)` — modal:118
- SH-113 ✅L2: cap 200 v `weather-history.repository.ts:44` (repo vrstva, ne service — viz N-SHG-02)
- SH-114 ✅L2: `deleteCustomPreset` volá `assertIsPJ` — service:139
- SH-115 ✅L2: `updateCustomPreset` předá jen name/description/emoji — service:125-129
- SH-116/117 ⏭️[human]

## PROOF-REQUEST

### PR-01 — GameEventReminderJob cron (SH-32, SH-33)
**Co spustit:** unit test s mock `@nestjs/schedule` CronExpression
```bash
cd c:/Matrix/ProjektIkaros/Projekt-ikaros
npx jest --testPathPattern="game-event-reminder" --maxWorkers=1 --verbose
```
**Problém:** žádný `game-event-reminder.job.spec.ts` neexistuje → testy chybí úplně  
**Co by test dokázal:** ověření `findUpcoming(+23h, +25h)` + `markReminderSent` + `groupOnly` gating  
**Závěr:** **TEST GAP** — kritická cesta (push notifikace před událostí) bez coverage  

### PR-02 — WS EventEmitter→Gateway→Socket integrace (SH-101..107)
**Co spustit:** e2e test nebo socket mock
```bash
cd c:/Matrix/ProjektIkaros/Projekt-ikaros
npx jest --testPathPattern="maps.gateway" --maxWorkers=1
```
**Co ověřit:** `EventEmitter2.emit('weather.updated')` → `maps.gateway.handleWeatherUpdated` → `server.to().emit('weather:updated')` call chain  
**Závěr:** statická analýza potvrdila wiring, bez integračního spuštění zbývá L2 (ne L3)  

### PR-03 — `daysInMonth` s `config.months = []` (N-SHG-01 potvrzení)
**Co spustit:**
```ts
import { daysInMonth } from '@/shared/lib/calendarEngine';
const result = daysInMonth(0, 0, { months: [], leapYearRule: undefined });
// Očekáváme TypeError nebo safe fallback
```
**Závěr:** statická analýza ukázala `mod(0,0)=NaN` → crash, test by to potvrdil/vyvrátil
