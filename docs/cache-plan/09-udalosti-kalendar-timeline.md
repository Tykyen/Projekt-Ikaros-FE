# 09 — Události & kalendář & timeline

> **Sweep 2026-06-05.** Cache-invalidation inventura (TanStack Query v5). Read-only.
> Osy: `FO` `KM` `CR` `DEL` · perspektivy P1 + P2 (prefix-match). Key-match ověřen element-po-elementu (L2).
> Nálezy → [`../cache-audit.md`](../cache-audit.md) (`C-09…C-11`).
> **Stav: ✅ hotovo — 3 nálezy (C-09 🔴, C-10 🟡, C-11 🟡); timeline / diary-schema / weather čisté.**

## 9.A — Game events ([useGameEvents.ts](../../src/features/world/api/useGameEvents.ts))

### Konzumenti (P1)

| # | Hook | `queryKey` | role | call-site |
|---|---|---|---|---|
| 1 | useUpcomingEventsMine | `['game-events','upcoming-mine',limit]` | dashboard 2.1 + profil | EventCard, ProfileEventsSection |
| 2 | useWorldGameEvents | `['game-events','world',worldId,limit]` | dashboard 5.2 | EventsColumn |
| 3 | useAllWorldGameEvents | `['game-events','world-all',worldId,limit]` | **kalendář 5.5c** | CalendarPage:56 |
| 4 | useUpcomingGameEvents | `['game-events','upcoming-world',worldId]` | stránka akce (Nadcházející) | EventsPage |
| 5 | useArchiveGameEvents | `['game-events','archive-world',worldId]` | stránka akce (Archiv, PomocnyPJ+) | EventsPage |
| 6 | useGameEventDetail | `['game-events','detail',eventId]` | detail + komentáře | GameEventComments |

`invalidateGameEvents()` ([:148](../../src/features/world/api/useGameEvents.ts#L148)) cílí 5 klíčů: `upcoming-world`, `archive-world`, `upcoming-mine`, `world`, `world-all`. **Chybí `detail`.**

### Matice

| Mutace | 1 mine | 2 world | 3 world-all | 4 upc-world | 5 archive | 6 detail |
|---|---|---|---|---|---|---|
| useToggleRsvp `:93` | ✅ | ✅ | **❌** | ✅ | ✅ | **❌** |
| useCreate/Update GameEvent | ✅ | ✅ | ✅ | ✅ | ✅ | **❌** (C-10) |
| useDeleteGameEvent `:174` | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ (DEL: `invalidate`, ne `removeQueries`) |
| useAdd/Edit/Delete/ReactComment | — | — | — | ✅ | ✅ | ✅ |

### 🔴 C-09 · `FO`/`KM` · `useToggleRsvp` neúplný fan-out (K-C2 POTVRZENO)
- **Místo:** [useGameEvents.ts:93](../../src/features/world/api/useGameEvents.ts#L93). Invaliduje ručně 4 klíče místo `invalidateGameEvents()`.
- **Chybí 2 konzumenti:**
  1. `['game-events','world-all']` (kalendář 5.5c). 📚 **P2 ověřeno:** `invalidate(['game-events','world'])` (ř.103) porovná segment `[1]` deep-equality `'world'` vs `'world-all'` → **netrefí** (přesně past z README). Kalendář drží starou RSVP značku.
  2. `['game-events','detail',eventId]` — RSVP mění `myRsvp`/attendees na entitě eventu, kterou drží otevřený detail.
- **Trigger:** hráč klikne „Půjdu" na kartě / v detailu. **Viditelnost:** kalendář (60s) + otevřený detail (10s) drží starý stav, tiše. **Workaround:** F5 / staleTime.
- **Závažnost:** 🔴 (trvale stale do staleTime; kalendář + karta současně mountnutelné). **Návrh:** volat `invalidateGameEvents(qc)` + `invalidate(['game-events','detail'])`.

### 🟡 C-10 · `FO`/`DEL` · game-event mutace nikdy neinvalidují otevřený `detail`
- **Místo:** `invalidateGameEvents` ([:148](../../src/features/world/api/useGameEvents.ts#L148)) nikdy nezahrnuje `['game-events','detail']`.
- **Update:** edit titulu/data/popisu → otevřený detail (`GameEventComments`) drží starý obsah (staleTime 10s ho srovná rychle, ale edit-then-view bez F5 ukáže staré).
- **Delete:** detail se neinvaliduje vůbec; navíc `invalidate` ne `removeQueries` → pokud byl mountnutý, zůstane v cache (gcTime 5 min) se smazaným eventem. Méně akutní (po delete typicky navigace pryč). **Návrh:** přidat `invalidate(['game-events','detail'])` do `invalidateGameEvents` (sjednotí i C-09 fix).

## 9.B — Kalendář configy & agregát

| Hook | `queryKey` | role |
|---|---|---|
| useCalendarConfigs | `['calendar-configs',worldId]` (factory) | seznam configů (12+ call-sites) |
| useCalendarsAggregate | `['calendars-aggregate',worldId]` (inline) | PJ agregát kalendář (CalendarPage) |

Calendar-config mutace (create/update/delete/defaults, [useCalendarConfigs.ts:43-116](../../src/features/world/api/useCalendarConfigs.ts#L43)) invalidují `['calendar-configs',worldId]` (+ defaults navíc `['worlds']`). **Žádná neinvaliduje `calendars-aggregate`.**

### 🟡 C-11 · `FO`/orphan · `calendars-aggregate` orphan (K-C7 POTVRZENO)
- **Místo:** [useCalendarsAggregate.ts:43](../../src/features/world/api/useCalendarsAggregate.ts#L43) — `['calendars-aggregate',worldId]` má v celém `src/` **jediný výskyt** (konzument); žádná mutace ho neinvaliduje. Namespace `'calendars-aggregate'` ≠ `'calendar-configs'` → config invalidace ho neprefixuje.
- **Trigger:** PJ změní/smaže calendar config (názvy měsíců, leap rule) při otevřeném agregátu. **Viditelnost:** agregát drží staré config-resolvované renderování. **Workaround:** F5 / 30s staleTime.
- **Závažnost:** 🟡 (zpožděný stale, krátký staleTime, nepřímá data). **VERIFY (oblast 05):** character calendar-event mutace pravděpodobně agregát rovněž neinvalidují (stejná díra z druhé strany). **Návrh:** přidat `invalidate(['calendars-aggregate',worldId])` do calendar-config + character-calendar mutací.

## 9.C–E — Timeline / Weather / Diary schema — ✅ čisté

- **Timeline** ([useTimelineEvents.ts](../../src/features/world/pages/TimelinePage/api/useTimelineEvents.ts)) — factory `timelineKeys`, `invalidateTimeline()` cílí `all(worldId)` + `yearCounts`; `['timeline',worldId]` prefixuje `['timeline',worldId,filters]` (L2 OK). ⚠️ Delete je `invalidate` infinite → refetch-all (stejný CR vzor jako C-08, ale menší rozsah; poznámka).
- **Weather presety/sety/generátory** — factory keys; `useApplyGeneratorSet`/`useSetInGameDate`/`useAdvanceDay` mají korektní multi-key fan-out; `useReorderGenerators` úplný optimistic cyklus. `useBroadcastWeather`/`useClearMapWeather` bez RQ efektu = **by-design WS push** (VERIFY parita v oblasti 08).
- **Diary schema** ([useDiarySchema.ts](../../src/features/world/pages/WorldDiarySchemaEditorPage/api/useDiarySchema.ts)) — factory `diarySchemaQueryKey` + cross-feature `charactersQueryKey.subdoc`/`['characters',worldId]`; L2 OK.

## Shrnutí

| ID | Osa | Záv. | Místo |
|---|---|---|---|
| C-09 | FO/KM | 🔴 | useGameEvents.ts:93 (RSVP bez world-all+detail) |
| C-10 | FO/DEL | 🟡 | useGameEvents.ts:148 (mutace bez detail) |
| C-11 | FO/orphan | 🟡 | useCalendarsAggregate.ts:43 (orphan) |
