# Checkpoint — bug / oblast 10 Svět: herní nástroje

- **Styl:** bug (statické čtení L1–L3, auth-leak, kontrakt, route-order, WS)
- **Registr:** `docs/bug-audit.md` · prefix `N-` (RUN běh → `N-RUN-x`)
- **Záběr:** BE `game-events`, `calendars`, `world-calendar-config`, `timeline`, `world-weather` · FE `EventsPage/CalendarPage/CalendarConfigsPage/TimelinePage/WorldWeatherPage`, `calendarEngine`, `FantasyDatePicker`
- **Dosažená L:** L2 (čtení + kontrakt/role/WS ověřeny staticky); cílová pro `[auto]` body = L3/L4 (běh testů) → PROOF-REQUEST
- **Datum:** 2026-07-11

---

## Pokrytí (co přečteno do plné hloubky)

**BE (100 % záběru):**
- game-events: `service.ts` (findList/findById/findUpcomingForUser/create/update/delete/confirm/comments/react/notifyOnCreate), `controller.ts`, `game-event-reminder.job.ts` (2 okna 24h+1h), `repository.ts` (findList/findUpcoming/markReminderSent/toEntity), `schema.ts`
- calendars: `calendars.service.ts` (aggregate + updateSettings, assertCanModerate PomocnyPJ+)
- world-calendar-config: `service.ts` (list/getBySlug/create/patch/remove/applyPresetTemplate/seedGregorianDefault/getConfigInternal/getTimelineConfig/validateMonthsAndSeasons/assertMember+assertCanWrite), `controller.ts`, `utils.ts` (toAbsDay/getLunarPhase/calculateCelestialStates)
- timeline: `service.ts` (enrich/findMany/yearCounts/findById/create/update/delete/assertMember+assertCanWrite), `controller.ts` (route order year-counts PŘED :id ✔), `lib/timeline-cursor.ts` (encode/decode/buildCursorWhere), `repository.ts`
- world-weather: `service.ts` (celý — CRUD/reorder/validateConfig/generate/resolveCalendarContext/setCurrentWeather/history/setInGameDate/advanceDay/advanceCustom+Gregorian/broadcast/clearMapWeather/seed), `controller.ts` (route order reorder/set-in-game-date/advance-day PŘED :id ✔, map-weather/active 2-seg ✔), `weather-generator-set.service.ts`+`controller.ts`, `custom-weather-preset.controller.ts`, `weather-generator.repository.ts`, `weather-history.repository.ts`+schema, `dto/set-in-game-date.dto.ts`, `dto/reorder-generators.dto.ts`
- maps.gateway `@OnEvent('weather.updated')` → `world:{worldId}` emit `weather:updated` (SH-101 ✔)

**FE:**
- `useGameEvents.ts` (SH-34/35/36 ✔ — archive enabled jen PomocnyPJ+, upcoming-mine disabled bez tokenu, archiv posílá toDate=cutoff)
- `useWeatherWsSubscribe.ts` (SH-105/106 ✔ — patch per generatorId, ignore mismatch worldId, ignore null generatorId), `useMapWeather.ts` (SH-102/103/104 ✔ — room join delegován na WorldLayout, reconnect refetch, weather:null→null)
- `calendarEngine/absDay.ts` (SH-61–65 ✔ — every-4/solar-hijri-33/islamic-30 leap + gregorian shape + lunisolar metonic; empty months guard N-SHG-01), `getActiveCalendarConfig.ts` (SH-84 ✔)
- `FantasyDatePicker.tsx` (SH-66–69 ✔ — clamp, required X, hour parse, empty months), `SetInGameDateModal.tsx` (SH-110/111/112 ✔ — clamp, custom měsíce, regenerateAll default true, N-41 leap Únor)
- `EventsPage.tsx` (SH-01/37/38 ✔ — silent redirect archive→upcoming, client-side group filter), `CalendarConfigsPage.tsx` (SH-53/54 ✔ — auto-select default, FE-side delete block)

**Ověřené osy bez nálezu:** auth-leak (všechny GET/mutace přes worldAdminBypass+membership; findById non-member→404 SH-12; findList non-member→[] SH-08; archive gate ARCHIVE_PJ_ONLY SH-03/04/05); route-order (weather + timeline literal routes PŘED :id ✔); WS kontrakt (weather.updated→weather:updated ✔); validace (weather temp/wind/pressure/humidity/gust/probability-sum + empty types; season range SH-49/50; reorder dup/count/unknown SH-95/96/97); RSVP/komentáře idempotence + soft-delete zachovává authorName (SH-24); history limit clamp max 200 + sort DESC (SH-113 ✔ v repo); getTimelineConfig priorita 1/2/3/null (SH-71–74 ✔).

---

## Nálezy

### N-RUN-10a — 🆕 🟡 [game-events / findList] group-only filtr běží AŽ PO DB limitu → tichý under-fetch
- **Kde:** `backend/src/modules/game-events/game-events.service.ts:165-179`
  ```ts
  const events = await this.repo.findList({ ...limit: cappedLimit... });
  if (!membership) return events;
  return events.filter((e) => {
    if (!e.groupOnly) return true;
    if (m.role >= WorldRole.PomocnyPJ) return true;
    return e.targetGroup !== null && m.group === e.targetGroup;
  });
  ```
- **Dopad:** DB vrátí max `cappedLimit` eventů seřazených dle data; groupOnly eventy cizích skupin se odfiltrují AŽ v paměti. Má-li svět v okně limitu hodně groupOnly eventů pro jiné skupiny, `Hrac` dostane MÉNĚ (až 0) viditelných eventů, než reálně existuje za hranicí capu. Stejná třída jako N-12 (paginace total≠items) a N-24. Nízká pravděpodobnost (default limit 100/200, světy mají desítky eventů), proto 🟡. Bezpečnostně neškodné (žádný leak, jen chybějící data).
- **Návrh:** buď filtrovat groupOnly už v DB query (`$or` na `groupOnly:false` / `targetGroup:$in`), nebo přidat headroom fetch-cap jako u `findUpcomingForUser` (`safeLimit*5`) a slicovat po filtru.
- **L:** L1 (čtení). PROOF-REQUEST: unit test — svět s (limit+1) groupOnly eventy cizí skupiny + N viditelných za capem → hráč nedostane viditelné.

### N-RUN-10b — ♻️ 🟠 [world-weather / setInGameDate+advanceDay] custom kalendář: Gregorian storage koroze data
- **Kde:** `backend/src/modules/world-weather/world-weather.service.ts:809-812` (setInGameDate) + `:855-990` (advanceDay/advanceCustomCalendar)
  ```ts
  const date = new Date(0);
  date.setUTCFullYear(dto.year, dto.monthIndex, dto.day);   // storage jako Gregorian
  ```
- **Dopad:** Pro custom kalendář s `monthIndex >= 12` (DTO povoluje až 36) nebo `day` delším než odpovídající Gregorian měsíc přeteče `setUTCFullYear` do sousedního Gregorian měsíce/roku → persistované `currentInGameDate` už nereprezentuje zamýšlené custom datum. Pozdější `generate` bez explicit month čte `persistedDate.getUTCMonth()/getUTCDate()` (`resolveCalendarContext:604-611`) → špatný custom měsíc/den. A `advanceCustomCalendar:957-961` odvozuje rok z `getTime()/86_400_000/daysPerYear` — nesouvisí s PJ-nastaveným custom rokem → po „posunout o den" datum skočí.
- **Stav:** ZNÁMÁ oblast — kód sám přiznává MVP dluh („Custom kalendář by potřeboval epoch conversion — pro MVP držíme JS Date jako storage", ř.806-808); registr `bug-audit.md` drobné: „advanceCustomCalendar možný špatný rok při záporném epochOffset (…:947 — doověřit)". Tímto POTVRZENO jako reálné (nejen záporný epochOffset, ale i monthIndex≥12 / day-overflow). Neklasifikuji jako nové — dokumentovaný dluh.
- **Návrh:** custom kalendář ukládat jako `{year, monthIndex, day}` (ne Gregorian Date) NEBO epoch conversion přes `calendarEngine.toAbsDay`. Sjednotit storage+interpretaci (setInGameDate vs advanceCustomCalendar používají nekompatibilní reprezentace).
- **L:** L2 (čtení + dohledaná interpretace obou stran). PROOF-REQUEST: e2e — svět s 16měsíčním kalendářem, setInGameDate month=14 day=30 → advance-day → ověřit že vrácený {year,monthIndex,day} == zamýšlené +1 den.

---

## Bez nálezu (spot-check osy)

- SH-01–SH-39 (game-events + FE): logika sedí; RSVP toggle idempotentní, komentáře root/reply validace, soft-delete `content=''`+`isDeleted`+authorName, reakce na smazaný = no-op, push filtruje Zadatele + group. Reminder job 24h+1h okna přes `$ne:true` gate (matchne i chybějící pole). Update `confirmedBy:null` → `Array.isArray` drop (SH-16 by-design).
- SH-40–SH-57 (kalendář): member/write role gaty správné, SLUG_TAKEN 409, PATCH delta-merge + FIX-62 season-only validace proti stávajícím měsícům, DEFAULT_CONFIG_LOCKED + dangling timelineCalendarSlug vynulování (CD-RUN-2), seed/applyPreset idempotence + race re-fetch.
- SH-58–SH-70 (engine): leap pravidla kompletní, round-trip fromAbsDay↔toAbsDay, empty-months guard.
- SH-71–SH-87 (timeline): getTimelineConfig priorita ✔, stripBase64 v listu / preserve v detailu, cursor base64url decode validace INVALID_CURSOR, year-counts route order, sanitizeRichText write+read, celestial 0-based monthIndex (`event.month-1`).
- SH-88–SH-117 (počasí): role gaty (member read / PomocnyPJ+ write / PJ+ delete preset+set), validace configu, reorder trojí validace, route order, history clamp≤200 DESC, updateCustomPreset config immutable, WS flow, FE modaly.

---

## PROOF-REQUESTy (pro posun L1/L2 → L3/L4)

1. **N-RUN-10a** — nový unit test findList: hráč + (limit+1) groupOnly cizí skupiny → under-fetch demonstrace.
2. **N-RUN-10b** — e2e custom kalendář (>12 měsíců): setInGameDate → advanceDay round-trip.
3. **Baseline běh** — `jest` (BE) suity `game-events.service.spec` / `world-calendar-config.*.spec` / `timeline.service.spec` / `world-weather.service.spec` + FE `vitest` calendarEngine/FantasyDatePicker/SetInGameDateModal → potvrdit zelené (aktuální dluhy.md hlásí FE vitest gotcha „0 testů" na react() plugin — nutno ověřit, že se spustí).
