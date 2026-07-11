# Checkpoint — cache / 09-udalosti-kalendar-timeline

> RUN-2026-07-11-1213 · styl cache (TanStack invalidace) · registr `docs/cache-audit.md` (prefix C-)
> READ-ONLY re-audit oblasti proti HEAD. Předchozí sweep 2026-06-05 (C-09 🔴, C-10 🟡, C-11 🟡; timeline/weather/diary-schema čisté).
> Osy: `FO` `KM` `CR` `DEL` · perspektivy P1 (konzumentská inventura) + P2 (prefix-match) + P6 (orphan).

## Dosažená vs cílová L

- **Cílová:** běžné mutace L2+; destruktivní (`DEL`) L3+.
- **Dosažená:** **L2** (key-match / prefix-match ověřen element-po-elementu; BE agregát čten pro potvrzení stale plochy; grep-orphan sken).
  Opravené nálezy C-09/C-10/C-11/C-22 mají vitest specy (`useGameEvents.spec.tsx`, `useCalendarConfigs.spec.tsx`, `useCharacterMutations.spec.tsx`) = **L3 test-exists** (nespuštěno v tomto běhu).

## Verdikt regrese známých nálezů (♻️ — NEhlásit jako nové)

Všechny fixy z 2026-06-05 jsou **přítomné v HEAD** (potvrzeno čtením + komentáři + testy):

- **♻️ C-09** (🔴 → opraveno) — `useToggleRsvp.onSuccess` volá `invalidateGameEvents(qc)` (5 klíčů vč. `world-all`) + `['game-events','detail',eventId]`. Kde: [useGameEvents.ts:98-104](../../../../src/features/world/api/useGameEvents.ts#L98). Prefix-miss `'world'`≠`'world-all'` odstraněn (oba klíče v helperu ř.150-151). **Opraveno.**
- **♻️ C-10** (🟡 → opraveno) — `useUpdateGameEvent` invaliduje `['game-events','detail',id]` (ř.171); `useDeleteGameEvent` používá `removeQueries(detail)` (ř.182, ne invalidate → žádný 404 refetch) + `invalidateGameEvents`. **Opraveno.**
- **♻️ C-11** (🟡 → opraveno) — všechny 4 calendar-config mutace (create/update/delete/defaults) invalidují `['calendars-aggregate',worldId]`. Kde: [useCalendarConfigs.ts:52,84,99,121](../../../../src/features/world/api/useCalendarConfigs.ts#L52). Ověřeno `useCalendarConfigs.spec.tsx:38`. **Opraveno.**
- **♻️ C-22** (protějšek z oblasti 05) — `useUpdateCharacterCalendar` (ř.209) + `useSetCalendarColor` (ř.228) invalidují agregát. [useCharacterMutations.ts:209,228](../../../../src/features/world/pages/api/useCharacterMutations.ts#L209). **Přítomno.**
- **♻️ Timeline / Weather / Diary-schema** — beze změny, čisté. Timeline factory `timelineKeys` + `invalidateTimeline` (all+yearCounts), weather factory keys + optimistic reorder cyklus (onMutate/onError/onSuccess), diary-schema factory + cross-feature `['characters',worldId]`. Vše L2 OK.

## Nové nálezy (🆕)

### 🆕 C-RUN-09a · `FO`/orphan · 🟡 — character rename/convert/delete neobnoví PJ agregát `calendars-aggregate`
- **Osa:** FO (P1 konzumentská inventura / P6 orphan). Rozšiřuje rodinu C-11/C-22: agregát invalidují jen **config** a **calendar-subdoc** mutace, ne **character-level** mutace, které rovněž mění, co agregát zobrazuje.
- **Konzument:** `useCalendarsAggregate` — [useCalendarsAggregate.ts:43](../../../../src/features/world/api/useCalendarsAggregate.ts#L43) (`['calendars-aggregate',worldId]`, staleTime 30s), mount na PJ [CalendarPage.tsx](../../../../src/features/world/pages/CalendarPage.tsx).
- **BE důkaz stale plochy:** agregát staví `name`/`slug`/`kind`/`isNpc` z **character dokumentu** (`charMap`), ne z calendar subdocu — [calendars.service.ts:52-78](../../../../../Projekt-ikaros/backend/src/modules/calendars/calendars.service.ts#L52) (`name: char?.name`, `isNpc: char?.isNpc`, `kind: char?.kind`).
- **Vynechané mutace (žádná neinvaliduje `calendars-aggregate`):**
  1. `useUpdateCharacter` — [useCharacterMutations.ts:104-118](../../../../src/features/world/pages/api/useCharacterMutations.ts#L104): změna `name` (a imageUrl) → agregát drží staré jméno v sidebaru + na eventech.
  2. `useConvertCharacter` — [:145-172](../../../../src/features/world/pages/api/useCharacterMutations.ts#L145): mění `isNpc` → agregát filtr PostavaHrace↔NPC (sidebar) stale.
  3. `useDeleteCharacter` — [:123-141](../../../../src/features/world/pages/api/useCharacterMutations.ts#L123): BE kaskádně maže calendar subdoc, ale FE agregát drží smazaný řádek (name fallback `''`) do staleTime.
- **Prefix-check (P2):** character-scoped klíče (`charactersQueryKey.*` = `['characters',worldId,...]`) namespace `characters` ≠ `calendars-aggregate` → žádný z existujících invalidací agregát netrefí. Přesně vzor C-22 z druhé strany.
- **Trigger:** PJ přejmenuje / konvertuje / smaže postavu a má otevřený PJ kalendář-agregát. **Viditelnost:** tiše staré jméno / špatná NPC skupina / duch smazané postavy do 30s. **Workaround:** F5 / staleTime 30s.
- **Závažnost:** 🟡 — PJ-only view, staleTime 30s, nízká pravděpodobnost současného mountu (rename běží na detailu postavy, agregát na CalendarPage → typicky sekvenční navigace, refetchOnMount data ≥30s stará srovná). Orphan/fan-out třída jako C-11/C-22, ne data-loss.
- **Návrh:** do `useUpdateCharacter`/`useConvertCharacter`/`useDeleteCharacter` `onSuccess` přidat `qc.invalidateQueries({ queryKey: ['calendars-aggregate', worldId] })` (mutace žijí v oblasti 05, ale stale konzument je 09 agregát — sjednotit s C-22 vzorem).

## Latentní / VERIFY (neeskalováno)

- **Timeline delete = `invalidate` infinite → refetch-all** ([useTimelineEvents.ts:88-96](../../../../src/features/world/pages/TimelinePage/api/useTimelineEvents.ts#L88) → `invalidateTimeline` = `timelineKeys.all`). Známá poznámka z area-docu (CR vzor jako C-08, menší rozsah): delete/create prvku refetchne všechny stránky (reset scrollu) místo cíleného `setQueryData` removal. Preventivní, **ne nový nález** — beze změny od sweepu.
- **Game-events bez WS push (P4 parita) — by-design, neeskalováno.** Žádný game-events modul nemá WS invalidaci → RSVP/create/edit od **jiného** PJ/hráče je stale do staleTime (30-60s). Na rozdíl od world-news (C-04) a ikaros-news (C-47), kterým WS push doplněn. Původní sweep to nehlásil (akce nejsou time-critical). Ponechávám jako VERIFY, ne nález. → PROOF-REQUEST FE-2.

## PROOF-REQUESTy

- **BE-1 (+db):** Vytváří se calendar subdoc při **vytvoření** postavy (eager), nebo lazy až při první editaci kalendáře? Pokud eager → `useCreateCharacter`/spawn NPC/Lokace by měl rovněž invalidovat `['calendars-aggregate',worldId]` (nová postava jinak chybí v PJ agregátu do staleTime) → rozšíří C-RUN-09a i na create. (Agregát filtruje `!isHiddenInAggregate`, ř.48-50 — nová postava s viditelným kalendářem se má objevit.)
- **FE-2 (+ws parita):** Má být game-events cross-user real-time (WS push jako C-04/C-47), nebo je staleTime 30-60s záměr? Pokud real-time žádoucí → chybí BE emit + FE listener (celý modul).

## Pokrytí

- **Query hooky (konzumenti) — přečteny:** useUpcomingEventsMine, useWorldGameEvents, useAllWorldGameEvents (`world-all`, kalendář), useUpcomingGameEvents, useArchiveGameEvents, useGameEventDetail, useCalendarConfigs, useCalendarsAggregate, useInfiniteTimelineEvents (+yearCounts factory), useWeatherGenerators/History, useDiarySchemaVersions/Version/ActiveDiarySchema.
- **Mutace (writers) — přečteny do plné hloubky:** useToggleRsvp, useCreate/Update/DeleteGameEvent, useAdd/Edit/Delete/ReactToComment (invalidateComments), 4× calendar-config (+defaults), 11× weather (create/update/delete/generate/setCurrent/broadcast/clearMap/setInGameDate/advanceDay/reorder), 3× timeline (create/update/delete), 6× diary-schema, + cross-oblast character mutace (update/convert/delete/calendar/setColor) pro agregát-fan-out.
- **Key-match (P2):** game-events helper 5 klíčů + detail = union všech 6 konzumentů ✅; `calendars-aggregate` vs `calendar-configs` vs `characters` namespace diff potvrzen.
- **Orphan sken (P6):** grep `calendars-aggregate` přes celý `src` — invaliduje se z config (4×) + character calendar (2×); **NEinvaliduje se z character rename/convert/delete** = C-RUN-09a.
- **BE cross-check:** `calendars.service.ts` aggregate() čten (potvrzení stale plochy name/isNpc/kind).

## Shrnutí

- **🆕 1** (C-RUN-09a 🟡 — character rename/convert/delete neobnoví PJ `calendars-aggregate`; rodina C-11/C-22).
- **♻️ 4** známých (C-09 🔴 / C-10 / C-11 / C-22) potvrzeno **opravených** v HEAD — NEhlásit jako nové.
- **2 PROOF-REQUESTy** (BE calendar subdoc eager/lazy → create fan-out · game-events WS parita).
- Dosažená hloubka **L2** (opravené nálezy L3 test-exists). Timeline/weather/diary-schema beze změny čisté.
