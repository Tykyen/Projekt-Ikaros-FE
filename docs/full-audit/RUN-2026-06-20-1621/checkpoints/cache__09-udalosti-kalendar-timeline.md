# cache / 09-udalosti-kalendar-timeline — checkpoint RUN-2026-06-20-1621

## Pokrytí

### Přečtené soubory
- `src/features/world/api/useGameEvents.ts` (kompletní)
- `src/features/world/api/useCalendarConfigs.ts` (kompletní)
- `src/features/world/api/useCalendarsAggregate.ts` (kompletní)
- `src/features/world/pages/TimelinePage/api/useTimelineEvents.ts` (kompletní)
- `src/features/world/pages/TimelinePage/api/useTimelineYearCounts.ts`
- `src/features/world/hooks/useWorldSocket.ts`
- `src/features/world/pages/api/useCharacterMutations.ts` (relevantní úseky)
- `src/features/world/pages/CharacterDetailPage/components/CalendarTab.tsx`
- `src/features/world/pages/CharacterDetailPage/components/CalendarTabGrid.tsx`
- `src/features/world/pages/EventsPage/EventsPage.tsx`
- `src/features/world/components/GameEventCard/GameEventCard.tsx`
- `src/features/world/components/GameEventModal/GameEventModal.tsx`
- `src/features/world/pages/WorldDashboardPage/WorldDashboard/columns/EventsColumn.tsx`
- `src/features/profile/components/ProfileEventsSection.tsx`
- `src/features/world/api/useGameEvents.spec.tsx`
- `src/features/world/api/useCalendarConfigs.spec.tsx`
- `src/shared/types/index.ts` (GameEvent interface)
- BE module `backend/src/modules/game-events/` (bez gateway)
- Seznam gatewayů v `backend/src/` (ověření absence game-events / calendar gateway)
- `docs/cache-plan/09-udalosti-kalendar-timeline.md`
- `docs/cache-audit.md`
- Relevantní git log od 2026-06-05

### Osy pokryté
`KM` `FO` `DEL` `CB` `WS` `LC` — P1 P2 P4 P5

## Dosažená L vs cílová L

| Zdroj | Cílová L | Dosažená | Pozn. |
|---|---|---|---|
| game-events (mutace) | L2+ | **L3** | regresní spec (C-09/C-10) zelený; `invalidateGameEvents` kompletní |
| game-events (RSVP) | L2+ | **L3** | C-09 fix + spec |
| calendar-configs (mutace) | L2+ | **L3** | C-11 fix + spec |
| calendars-aggregate | L2 | **L3** | C-11 fix, konzumenti OK |
| timeline (create/update/delete) | L2+ | **L2** | factory `timelineKeys`, `invalidateTimeline` cílí `all+yearCounts`; bez spec |
| WS parita (game-events) | L1 | **L1** | žádná gateway — PROOF-REQUEST |

## Nálezy

### ✅ Opravené (verifikace HEAD)

| ID | Status | Kde | Co |
|---|---|---|---|
| C-09 | ✅ OPRAVENO | `useGameEvents.ts:99-103` | `useToggleRsvp` volá `invalidateGameEvents(qc)` + `invalidateQueries(['game-events','detail',eventId])`. Regresní test (`useGameEvents.spec.tsx:121`) zelený. |
| C-10 | ✅ OPRAVENO | `useGameEvents.ts:168-173`, `:179-185` | `useUpdateGameEvent` invaliduje detail; `useDeleteGameEvent` volá `removeQueries` (ne invalidate) na detail + `invalidateGameEvents`. Regresní test (`useGameEvents.spec.tsx:138`) zelený. |
| C-11 | ✅ OPRAVENO | `useCalendarConfigs.ts:50-54`, `:82-86`, `:97-101`, `:121` | Všechny 4 mutace (create/update/delete/defaults) invalidují `['calendars-aggregate',worldId]`. Regresní test (`useCalendarConfigs.spec.tsx:27`) zelený. |

### Nové nálezy — HEAD audit

Žádný nový kritický ani střední nález. Podrobný rozbor kandidátů:

**Kandidát A — `invalidateComments` nepokrývá `world` / `world-all`** (osa `FO`)
- `invalidateComments` (`:205`) invaliduje `detail`, `upcoming-world`, `archive-world` — ale ne `['game-events','world']` (dashboard) ani `['game-events','world-all']` (kalendář).
- **Verdikt: ⚖️ by-design.** Komentáře se nevracejí v list endpointu (`GameEvent.comments?: EventComment[]`, komentář v typech: „List endpoint pole nevrací → undefined"). Dashboard `EventsColumn` + `CalendarPage` zobrazují akce z list queries — `comments` pole je `undefined`. `GameEventCommentsFooter` při `commentCount === undefined` zobrazuje „Komentáře" bez čísla (záměr, viz komentář v komponentě). Invalidace `world` / `world-all` po komentáři by refetchovala stovky events zbytečně. **Není bug.**

**Kandidát B — WS parita game-events** (osa `WS`)
- Žádná `game-events.gateway.ts` v BE. RSVP / create / update / delete od cizího PJ neaktualizuje UI jiného klienta do staleTime (60s `world-all`/`world`, 30s `upcoming-world`/`archive-world`).
- **Verdikt: ♻️ existující okraj.** WS gap pro game-events je mimo záběr cache auditu (není invalidační chyba na REST side). REST mutace invalidují správně. StaleTime 30–60s je akceptovatelný tradeoff bez push. Samostatná kategorie WS parity.

**Kandidát C — `useDeleteTimelineEvent` invalidate (ne removeQueries) na infinite query** (osa `DEL`)
- `useDeleteTimelineEvent` volá `invalidateTimeline(qc,worldId)` → invaliduje `['timeline',worldId]` prefix → refetch VŠECH stránek infinite query. Žádný `removeQueries` na konkrétní event.
- **Verdikt: ⚖️ by-design.** Timeline nemá dedikovaný `detail` key — události jsou jen v infinite listu. Po refetch-all se stránky resetují (scroll jump), ale data jsou čerstvá. Stejný vzor jako C-08 (mail), ale menší rozsah. Neexistuje „detail" k removeQueries. Akceptovatelné.

**Kandidát D — `CalendarTab.handleSave` CB placement** (osa `CB`)
- `mutation.mutate({ events, color, displaySettings }, { onSuccess: () => { setDirty(false); toast... } })` — call-site callback pro UI state.
- **Verdikt: ✅ OK.** Cache invalidace je v hook `onSuccess` (`useCharacterMutations.ts:203-212`, invaliduje `subdoc calendar` + `['calendars-aggregate',worldId]`). Call-site callback dělá jen UI state (dirty flag + toast). I při unmountu call-site callback se zahodí — ale cache invalidace v hook přežije. Správný vzor.

**Kandidát E — `useToggleRsvp` call-site CB** (osa `CB`)
- `toggle.mutate(event.id, { onError: () => toast.error(...) })` — call-site pouze `onError`.
- **Verdikt: ✅ OK.** `onSuccess` s invalidací je v hook (`useGameEvents.ts:99-103`), ne v call-site. Unmount card = call-site onError se zahodí, cache invalidace nikoliv.

## PROOF-REQUEST

| # | Co | Proč není L3/L4 |
|---|---|---|
| PR-1 | **Runtime: WS parita game-events** — ověřit v appce, zda event vytvořený PJ-A se zobrazí u PJ-B bez F5 (staleTime 60s = měří se časem). | Žádná gateway v BE — buď by-design nebo chybějící push; nelze ověřit staticky. Není blokující (REST mutations správné, WS gap je jiná vrstva). |
| PR-2 | **vitest timeline invalidace** — spustit `useTimelineEvents` spec nebo napsat M5 test (spy na `invalidateQueries`). | Spec pro timeline zatím neexistuje; kód L2 OK (factory `timelineKeys`, `invalidateTimeline` oba klíče), ale bez L3 pojistky. |
