# 10 — Svět: herní nástroje

Pokrývá game-events (CRUD, archiv, komentáře, RSVP, reminder job), kalendářovou vrstvu (world-calendar-config, multi-config, presety, leap year engine, calibration), timeline (dedicated config getter, cursor pagination, celestial states), počasí (generátory, sety, broadcast WS, in-game date, historie) a sdílenou FE vrstvu (calendarEngine, FantasyDatePicker).

**BE:** `game-events`, `calendars`, `world-calendar-config`, `timeline`, `world-weather`  
**FE:** `features/world/pages/{EventsPage,CalendarPage,CalendarConfigsPage,TimelinePage,WorldWeatherPage}`, `shared/lib/calendarEngine`, `shared/ui/FantasyDatePicker`  
**Routy:** `/svet/:slug/akce`, `/kalendar`, `/admin/kalendare`, `/timeline`, `/pocasi`

---

## A. Herní události (game-events) & archiv

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| SH-01 | Hráč s `view=archive` v URL dostane silent redirect na `?view=upcoming` (FE useEffect) `[auto]` | M4 | ⬜ |
| SH-02 | `useArchiveGameEvents` je disabled pro `viewerRole < PomocnyPJ` — žádný fetch neprobíhá `[auto]` | M4 | ⬜ |
| SH-03 | BE `findList` bez `fromDate` auto-clampuje Hráče na `fromDate=cutoff` (now − 24h) a cutoff je v okně 23–25h `[auto]` | M4 | ⬜ |
| SH-04 | BE `findList` s `toDate` (archivní dotaz) od Hráče vrátí 403 `ARCHIVE_PJ_ONLY` `[auto]` | M4 | ⬜ |
| SH-05 | BE `findList` s `fromDate` starším než cutoff od Hráče vrátí 403 `[auto]` | M4 | ⬜ |
| SH-06 | PomocnyPJ a PJ smí archiv (toDate v minulosti) bez chyby `[auto]` | M4 | ⬜ |
| SH-07 | Admin smí archiv i bez membership `[auto]` | M4 | ⬜ |
| SH-08 | Non-member dostane prázdný list (ne 403) `[auto]` | M4 | ⬜ |
| SH-09 | Zadatel (pending) dostane prázdný list `[auto]` | M4 | ⬜ |
| SH-10 | Hráč mimo skupinu nevidí `groupOnly` event v `findList` `[auto]` | M4 | ⬜ |
| SH-11 | PJ/Admin vidí `groupOnly` event bez ohledu na skupinu `[auto]` | M4 | ⬜ |
| SH-12 | `findById` pro non-member vrátí 404 (ne 403) — auth-leak policy `[auto]` | M4 | ⬜ |
| SH-13 | `findById` pro Hráče v jiné skupině vrátí 404 na `groupOnly` event `[auto]` | M4 | ⬜ |
| SH-14 | Hráč nemůže vytvořit event (403) `[auto]` | M4 | ⬜ |
| SH-15 | `groupOnly: true` bez `targetGroup` vrátí 400 při create i update `[auto]` | M4 | ⬜ |
| SH-16 | `update` s `confirmedBy: null` v body neuvede patch (tichá ztráta) `[auto]` | M4 | ⬜ |
| SH-17 | RSVP toggle: confirm → unconfirm a zpět je idempotentní `[auto]` | M4 | ⬜ |
| SH-18 | RSVP na `confirmable: false` event vrátí 400 `[auto]` | M4 | ⬜ |
| SH-19 | Hráč mimo skupinu nemůže RSVP na `groupOnly` event (404) `[auto]` | M4 | ⬜ |
| SH-20 | Reply komentáře na non-root komentář vrátí 400 `[auto]` | M4 | ⬜ |
| SH-21 | Reply na neexistující `parentId` vrátí 400 `[auto]` | M4 | ⬜ |
| SH-22 | Editace cizího komentáře vrátí 403 `[auto]` | M4 | ⬜ |
| SH-23 | Editace již smazaného komentáře vrátí 400 `[auto]` | M4 | ⬜ |
| SH-24 | Soft-delete komentáře: `isDeleted=true`, `content=''`, `authorName` zachován `[auto]` | M4 | ⬜ |
| SH-25 | Hráč nemůže smazat cizí komentář (403), ale PJ/Admin ano `[auto]` | M4 | ⬜ |
| SH-26 | Opakované smazání komentáře je idempotentní (nevyhodí chybu) `[auto]` | M4 | ⬜ |
| SH-27 | Toggle reakce na komentář: add / remove / smazání prázdného klíče `[auto]` | M4 | ⬜ |
| SH-28 | Reakce na smazaný komentář: 200 bez efektu (repo.update nevolá) `[auto]` | M4 | ⬜ |
| SH-29 | Push notifikace při create nejde Zadatelům `[auto]` | M4 | ⬜ |
| SH-30 | Push notifikace při create `groupOnly` jde jen PomocnyPJ+ a členům targetGroup `[auto]` | M4 | ⬜ |
| SH-31 | Selhání Push nerozbije odpověď POST /game-events (fire-and-forget) `[auto]` | M4 | ⬜ |
| SH-32 | `GameEventReminderJob` (EVERY_HOUR) filtruje eventy v okně +23h .. +25h od testu a respektuje `groupOnly` `[human]` | M1 | ⬜ |
| SH-33 | `reminderSent` se nastaví na true po odeslání, takže event nedostane push 2× `[human]` | M1 | ⬜ |
| SH-34 | `findUpcomingForUser` omezuje na `safeLimit` (max 20), `fetchCap=safeLimit×5` `[auto]` | M4 | ⬜ |
| SH-35 | FE `findUpcomingMine`: hook disabled bez tokenu `[auto]` | M4 | ⬜ |
| SH-36 | FE archiv: `useArchiveGameEvents` posílá `toDate=cutoff&limit=200` (ne `fromDate`) `[auto]` | M4 | ⬜ |
| SH-37 | FE group-filter je client-side (bez re-fetch) a filtruje dle `targetGroup` `[human]` | M3 | ⬜ |
| SH-38 | FE EventsPage: po reset `group` query param se zobrazí všechny eventy `[human]` | M3 | ⬜ |
| SH-39 | FE CommentThread: root komentáře DESC (nejnovější nahoře), reply ASC pod rootem `[auto]` | M4 | ⬜ |

---

## B. Kalendář & konfigurace

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| SH-40 | Hráč (člen, Hrac+) smí `GET /worlds/:id/calendar-configs` `[auto]` | M4 | ⬜ |
| SH-41 | Non-member dostane 403 na list `[auto]` | M4 | ⬜ |
| SH-42 | Pending (Zadatel) dostane 403 `[auto]` | M4 | ⬜ |
| SH-43 | Hráč nemůže vytvořit config (403) `[auto]` | M4 | ⬜ |
| SH-44 | PomocnyPJ smí vytvořit config `[auto]` | M4 | ⬜ |
| SH-45 | Duplicitní slug vrátí 409 `SLUG_TAKEN` `[auto]` | M4 | ⬜ |
| SH-46 | PATCH je delta-merge — pouze poslaná pole se přepíší, ostatní zůstanou `[auto]` | M4 | ⬜ |
| SH-47 | DELETE default kalendáře vrátí 403 `DEFAULT_CONFIG_LOCKED` `[auto]` | M4 | ⬜ |
| SH-48 | DELETE non-default kalendáře proběhne úspěšně `[auto]` | M4 | ⬜ |
| SH-49 | `season.startMonthIndex` mimo rozsah 0..monthCount-1 vrátí 400 `SEASON_OUT_OF_RANGE` `[auto]` | M4 | ⬜ |
| SH-50 | `season.startDay` mimo rozsah 1..monthDef.daysCount vrátí 400 `SEASON_DAY_OUT_OF_RANGE` `[auto]` | M4 | ⬜ |
| SH-51 | `seedGregorianDefault` je idempotentní (druhé volání necreatuje, vrátí existing) `[auto]` | M4 | ⬜ |
| SH-52 | `applyPresetTemplate` je idempotentní (race slug → re-fetch, ne chyba) `[auto]` | M4 | ⬜ |
| SH-53 | FE `CalendarConfigsPage`: auto-výběr default configu při načtení `[auto]` | M4 | ⬜ |
| SH-54 | FE: FE-side blok smazání default configu (toast chyba před API voláním) i když BE by vrátil 403 `[human]` | M3 | ⬜ |
| SH-55 | FE: nastavení timeline configu přes `updateSettings.timelineCalendarSlug` persistuje `[human]` | M3 | ⬜ |
| SH-56 | FE CalendarPage: přepínání mezi více calendar configs (multi-config) konvertuje eventy přes absDay engine `[human]` | M3 | ⬜ |
| SH-57 | FE CalendarPage: navigace měsíce vpřed/vzad mění `aria-label` gridu `[auto]` | M4 | ⬜ |

---

## C. Calendar engine (presety, leap year, calibration)

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| SH-58 | `ANCHOR_ABSDAY = toAbsDay(25.5.2026, GREGORIAN_DEFAULT_CONFIG)` `[auto]` | M4 | ⬜ |
| SH-59 | Pro každý preset: `fromAbsDay(ANCHOR_ABSDAY − epochOffset, preset.template)` vrátí `preset.anchor` (±anchorToleranceDays) `[auto]` | M4 | ⬜ |
| SH-60 | Round-trip A→B→A: anchor → toAbsDay + epochOffset = ANCHOR_ABSDAY ± tolerance `[auto]` | M4 | ⬜ |
| SH-61 | LeapYearRule `every-4`: rok dělitelný 4 má `daysInMonth(leapMonthIndex)` o 1 víc `[auto]` | M4 | ⬜ |
| SH-62 | LeapYearRule `gregorian`: rok dělitelný 100 není přestupný, dělitelný 400 ano `[auto]` | M4 | ⬜ |
| SH-63 | LeapYearRule `solar-hijri-33`: přestupné roky dle 33-cyklického pravidla `[auto]` | M4 | ⬜ |
| SH-64 | LeapYearRule `islamic-30`: 30-cyklické pravidlo lunárního roku `[auto]` | M4 | ⬜ |
| SH-65 | Bez `leapYearRule` (undefined) zachován fast-path — žádná regrese v non-leap kalendářích `[auto]` | M4 | ⬜ |
| SH-66 | `FantasyDatePicker`: po změně měsíce na kratší se den clampuje na nový max `[human]` | M3 | ⬜ |
| SH-67 | `FantasyDatePicker`: `required=true` skryje X tlačítko, hodnota nikdy `null` `[human]` | M3 | ⬜ |
| SH-68 | `FantasyDatePicker`: hour picker (allowHour=true) parse HH:mm do `hour`/`minute` `[human]` | M3 | ⬜ |
| SH-69 | `FantasyDatePicker`: `config.months` prázdný → bez pádu (edge case custom config) `[human]` | M3 | ⬜ |
| SH-70 | `calibrateEpochOffset` je deterministický — dvě volání se stejným def vrátí stejné číslo `[auto]` | M4 | ⬜ |

---

## D. Timeline

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| SH-71 | `getTimelineConfig`: priorita 1 = explicit `timelineCalendarSlug`, world.findById se nevolá `[auto]` | M4 | ⬜ |
| SH-72 | `getTimelineConfig`: priorita 2 = world.defaultCalendarConfigSlug (fallback) `[auto]` | M4 | ⬜ |
| SH-73 | `getTimelineConfig`: priorita 3 = configs[0] jako pojistka (žádný crash na broken stav) `[auto]` | M4 | ⬜ |
| SH-74 | `getTimelineConfig`: prázdný `configs[]` → vrátí null (ne throw) `[auto]` | M4 | ⬜ |
| SH-75 | Hráč smí číst timeline světa (member check) `[auto]` | M4 | ⬜ |
| SH-76 | Non-member dostane 403 na list/findById `[auto]` | M4 | ⬜ |
| SH-77 | PomocnyPJ+ smí vytvořit/editovat/smazat event `[auto]` | M4 | ⬜ |
| SH-78 | Hráč nemůže create (403) `[auto]` | M4 | ⬜ |
| SH-79 | Base64-encoded `imageUrl` je vyfiltrováno v list response (stripBase64) `[auto]` | M4 | ⬜ |
| SH-80 | Detail `findById` zachová base64 imageUrl (preserveImageUrl=true) `[auto]` | M4 | ⬜ |
| SH-81 | Cursor pagination: `nextCursor` je opaque base64url, dekóduje zpět do {year,id} `[auto]` | M4 | ⬜ |
| SH-82 | `year-counts` endpoint vrátí agregát {year, count} (musí být PŘED `:id` route — jinak match na `:id`) `[auto]` | M4 | ⬜ |
| SH-83 | Celestial states v `enrich` volají `calculateCelestialStates` s 0-based monthIndex (event.month − 1) `[auto]` | M4 | ⬜ |
| SH-84 | FE `getActiveCalendarConfig`: fallback hierarchie timelineSlug → worldDefault → configs[0] → null `[auto]` | M4 | ⬜ |
| SH-85 | FE TimelinePage: `timelineCalendarSlug` změna v nastavení okamžitě přepne zobrazení (settings refetch) `[human]` | M3 | ⬜ |
| SH-86 | FE TimelinePage: `sort=asc` v URL přepne pořadí na vzestupné `[human]` | M3 | ⬜ |
| SH-87 | FE TimelinePage: infinite scroll / „Načíst více" připojuje správně další stránku dle `nextCursor` `[human]` | M3 | ⬜ |

---

## E. Počasí (weather + broadcast)

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| SH-88 | Hráč (Hrac+) smí číst generátory (`GET /worlds/:id/weather-generators`) `[auto]` | M4 | ⬜ |
| SH-89 | Pending (Zadatel) dostane 403 `[auto]` | M4 | ⬜ |
| SH-90 | Hráč nemůže vytvořit generátor (403) `[auto]` | M4 | ⬜ |
| SH-91 | PomocnyPJ+ smí create/update/generate `[auto]` | M4 | ⬜ |
| SH-92 | Config validace: `tempMin > tempMax` vrátí 400 `WEATHER_INVALID_TEMP_RANGE` `[auto]` | M4 | ⬜ |
| SH-93 | Config validace: součet `weatherTypes[].probability` musí být 100 ±0.01 `[auto]` | M4 | ⬜ |
| SH-94 | Config validace: `windGustMultiplier < 1` vrátí 400 `[auto]` | M4 | ⬜ |
| SH-95 | `reorder` s duplicitními IDs vrátí 400 `WEATHER_REORDER_DUPLICATE_IDS` `[auto]` | M4 | ⬜ |
| SH-96 | `reorder` s nesprávným počtem IDs vrátí 400 `WEATHER_REORDER_COUNT_MISMATCH` `[auto]` | M4 | ⬜ |
| SH-97 | `reorder` s ID patřícím jinému světu vrátí 400 `WEATHER_REORDER_UNKNOWN_ID` `[auto]` | M4 | ⬜ |
| SH-98 | Route order: `set-in-game-date` a `advance-day` musí být PŘED `:id` v controlleru (jinak 404 cast) `[human]` | M1 | ⬜ |
| SH-99 | `setInGameDate` s `regenerateAll=true` přegeneruje počasí všem generátorům světa `[auto]` | M4 | ⬜ |
| SH-100 | `advanceDay` odmítá `days` mimo rozsah 1–365 `[auto]` | M4 | ⬜ |
| SH-101 | Broadcast → `EventEmitter2.emit('weather.updated')` → `maps.gateway @OnEvent` → `server.to('world:{worldId}').emit('weather:updated')` `[auto]` | M5 | ⬜ |
| SH-102 | FE `useMapWeather`: join room `room:join world:{worldId}` a re-join po reconnectu (`socket.on('connect')`) `[auto]` | M5 | ⬜ |
| SH-103 | FE `useMapWeather`: `weather:updated` patchuje `World` query cache (`activeMapWeather`) `[auto]` | M5 | ⬜ |
| SH-104 | FE `useMapWeather`: `weather=null` (PJ vypnul) nastaví `activeMapWeather=null` `[auto]` | M5 | ⬜ |
| SH-105 | FE `useWeatherWsSubscribe` na WorldWeatherPage patchuje jednotlivý generátor v cache bez celkového refetche `[auto]` | M5 | ⬜ |
| SH-106 | FE `useWeatherWsSubscribe`: event ignorován pokud `worldId` neodpovídá `[auto]` | M5 | ⬜ |
| SH-107 | `room:join` handler: Pattern `/^[a-z]+:[a-zA-Z0-9]+$/` — `world:abc123` projde, `world:` selže `[auto]` | M5 | ⬜ |
| SH-108 | `clearMapWeather` (DELETE map-weather/active) musí být 2-segmentová cesta — nekonflikuje s `DELETE :id` `[human]` | M1 | ⬜ |
| SH-109 | FE BroadcastModal: při target=chat a prázdném channelId zobrazí inline chybu (ne toast) `[human]` | M3 | ⬜ |
| SH-110 | FE `SetInGameDateModal`: po změně měsíce se den clampuje na `monthsList[monthIndex].daysCount` `[auto]` | M4 | ⬜ |
| SH-111 | FE `SetInGameDateModal`: custom kalendář (timelineCalendarSlug match) zobrazí custom názvy měsíců `[auto]` | M4 | ⬜ |
| SH-112 | FE `SetInGameDateModal`: `regenerateAll` default=true `[auto]` | M4 | ⬜ |
| SH-113 | Historie počasí: `GET :id/history` limit max 200, sort DESC `[auto]` | M4 | ⬜ |
| SH-114 | Custom preset: smazání vyžaduje PJ (ne jen PomocnyPJ) — assertIsPJ `[auto]` | M4 | ⬜ |
| SH-115 | Custom preset: `updateCustomPreset` neumožní změnit `config` (jen name/description/emoji) `[auto]` | M4 | ⬜ |
| SH-116 | FE WeatherSetsModal: globální sety read-only pro Hráče (bez Apply button) `[human]` | M3 | ⬜ |
| SH-117 | FE WeatherSetsModal: `resolveSetItems` unresolved IDs zobrazí warning, ale Apply pokračuje bez nich `[human]` | M3 | ⬜ |

---

## Test coverage gaps

- `GameEventReminderJob` nemá unit test (SH-32, SH-33) — chybí mock `@nestjs/schedule` + Cron timing.
- FE `EventsPage.tsx` samotná stránka nemá spec (`EventsPage.spec.tsx` neexistuje) — role-gating, redirect, group-filter neautomatizovány.
- FE `CalendarPage` spec netestuje multi-config přepínání ani absDay konverzi různých kalendářů.
- FE `TimelinePage` nemá UI spec (pouze lib helper specs) — infinite scroll, toolbar, YearScrubber neumanualizovány.
- FE `WeatherGeneratorModal` `WeatherSetsModal` `BroadcastModal` nemají spec pokrývající role gating (`worldRole`-podmíněné UI prvky).
- WS broadcast flow (SH-101 až SH-107) je testován pouze unit mock-em gateway; žádný integrační / e2e test pro EventEmitter→Gateway→Socket řetězec.
- `world-weather.service.spec.ts` pokrývá generátory a reorder, ale chybí test `clearMapWeather` → `EventEmitter.emit` s `generatorId=null`.
- `SetInGameDateModal` spec chybí test pro BCE rok (záporný rok) a pro custom kalendář s jiným počtem měsíců než 12.

## Známá rizika

- **Route order pitfall** (SH-98): `set-in-game-date` jako literal route musí být definována PŘED `/:id`. Pokud přibyde nová literal route, snadno uklouzne pod `:id` — tichá 404 nebo `ObjectId cast error` v MongoDB.
- **Weather WS bez autorizace room:join** (SH-107): `AppGateway.handleJoinRoom` ověřuje pouze formát room-name (regex), ne že volající je skutečný člen světa. Kdokoli může joinovat `world:{libovolnéId}` a dostávat `weather:updated` eventy — potenciální informační leak pro cizí světy.
- **Archiv cut-off drift** (SH-03/SH-05): `ACTIVE_WINDOW_MS` je hardcoded 24h konstanta; v unit testu se toleruje okno 23–25h. Pokud se hodiny serveru a klienta rozcházejí (timezone/NTP), může Hráč dostat 403 na event, který vypadá jako "upcoming" v jeho UI — nejde o security problém, ale o UX zádrh.
