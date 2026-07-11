# Checkpoint — role / 06-svet-herni-nastroje

RUN: 2026-07-11-1213 · styl: **role** (FE gating ↔ BE guard) · registr: `docs/role-audit.md` (prefix `R-`)
Režim: READ-ONLY hloubkový audit. Oblast: herní nástroje světa (události/kalendář/timeline/počasí/deník PJ).

## Rozsah (co projito do plné statické hloubky L1–L3)

**BE (service + controller + auth helpery, každý symbol):**
- `game-events` — controller + `game-events.service.ts` (canManage :62, canView :73, assertViewOrThrow :94, findList archive gate :119, findUpcomingForUser, create/update/delete, comment CRUD + react, notifyOnCreate).
- `calendars` — controller + `calendars.service.ts` (aggregate :36, updateSettings :83, assertCanModerate :112).
- `world-calendar-config` — controller + service (list/getBySlug/create/patch/remove, getConfigInternal/getTimelineConfig, assertMember :338, assertCanWrite :366).
- `timeline` — controller + service (findMany/yearCounts/findById/create/update/delete, assertMember :274, assertCanWrite :311).
- `world-weather` — 3 controllery (world-weather, custom-weather-preset, weather-generator-set) + `world-weather.service.ts` (getAll/getOne/create/update/remove/reorder/generate/setCurrentWeather/getHistory/setInGameDate/advanceDay/broadcast/clearMapWeather, custom-preset CRUD, assertMember :371, assertCanWrite :402, assertIsPJ :171) + `weather-generator-set.service.ts` (list/getOne/create/update/remove/apply, assertMember :220, assertCanWrite :248, assertIsPJ :271).
- `world-gm-notes` — controller + service (assertPj :40) + repo (per-PJ keying `{worldId,userId}`).

**FE (features/world):** router.tsx (route prahy), EventsPage + EventsToolbar, WorldWeatherPage + WeatherGeneratorCard + WeatherSetsModal, CalendarPage/CalendarConfigsPage routes, TimelinePage route, WorldGmDiaryPage route.

**Cross-ref:** `chat.service.createSystemMessage` (broadcast target validace), `common/utils/world-elevation.worldAdminBypass`.

Dosažená úroveň: **L2** napříč (statické čtení obou stran + prahy/enum/status). Cíl L3+/L4 (testy/red-team) = PROOF-REQUESTy níže.

---

## Nálezy

### R-RUN — [EN/OR/PA] Weather generator DELETE: FE práh PJ, BE práh PomocnyPJ (drift + nekonzistence se sourozenci)
- **Kde:** BE `world-weather.service.ts:253` `remove()` → `assertCanWrite` (= PomocnyPJ+, `:402`). FE `WorldWeatherPage.tsx:100` `const canDelete = isElevatedHere || role >= WorldRole.PJ;` → `WeatherGeneratorCard.tsx:197-210` kebab „Smazat generátor" jen když `canDelete`.
- **Úryvek (BE):** `async remove(...) { await this.assertCanWrite(worldId, requester); … }` — `assertCanWrite` pouští `role >= WorldRole.PomocnyPJ`.
- **Úryvek (FE):** `canDelete = isElevatedHere || role >= WorldRole.PJ` + komentáře „PJ+ → mazat" (WorldWeatherPage.tsx:10, WeatherGeneratorCard.tsx:61).
- **Dopad:** Dva směry. (a) OR: PomocnyPJ nevidí „Smazat generátor" (FE PJ-only), ale BE mu delete **dovolí** → ruční API request PomocnyPJ smaže generátor navzdory FE záměru „PJ-only". (b) Nekonzistence: sourozenecké **destruktivní** delety jsou PJ-only — `deleteCustomPreset` (`assertIsPJ` :141) i `WeatherGeneratorSetService.remove` (`assertIsPJ` :150). Generator delete je jediný outlier na PomocnyPJ. Insider, low blast (staff, generátor lze znovu vytvořit).
- **Návrh:** Sjednotit destruktivní delete: BE `world-weather.service.remove` → `assertIsPJ` (align na FE + sourozenecké preset/set delete + design „PJ+ mazat"). Alternativně FE `canDelete` → PomocnyPJ (opačný směr, méně vhodné vzhledem k destruktivnímu charakteru). Red-team M8: PomocnyPJ `DELETE /worlds/:id/weather-generators/:genId` → dnes projde.
- **Klasifikace:** 🆕 · Závažnost 🟡 nízká · **L2**

### R-RUN — [EN/OR] Zavádějící kód `PENDING_MEMBERSHIP` pro Ctenar ve 3 modulech (R-06 fix nepropagován)
- **Kde:** `world-calendar-config.service.ts:358-362` (`assertMember`, kód `PENDING_WORLD_MEMBERSHIP` „Pending členství"), `world-weather.service.ts:391-395` (`assertMember`, kód `PENDING_MEMBERSHIP` „Pending členství nemá přístup"), `weather-generator-set.service.ts:240-244` (totéž). Práh všude `role < WorldRole.Hrac`.
- **Úryvek:** `if (membership.role < WorldRole.Hrac) throw new ForbiddenException({ code: 'PENDING_MEMBERSHIP', message: 'Pending členství…' })` — jenže Ctenar(1) **není** pending (pending = Zadatel(0)).
- **Kontrast:** `timeline.service.ts:294-304` už **rozlišuje** Zadatel→`PENDING_MEMBERSHIP` vs Ctenar→`INSUFFICIENT_ROLE` (přesně oprava R-06). Fix se nepropagoval na 3 sourozence se stejným prahem Hrac.
- **Dopad:** Jen matoucí kód/hláška pro Ctenar na přímém API (FE routy `/kalendar`=PomocnyPJ, `/pocasi`=Hrac gate-ují Ctenar dřív → z UI se sem Ctenar prakticky nedostane). Bez security/leak dopadu. Konzistence/UX.
- **Návrh:** Zkopírovat R-06 vzor (rozliš `role === Zadatel` → PENDING vs jinak INSUFFICIENT_ROLE) do těch 3 assertMember.
- **Klasifikace:** 🆕 · Závažnost 🟡 nízká (UX/konzistence) · **L2**

### area00-K4 — [PA/DD] WeatherSetsModal: „Smazat set" vidí i PomocnyPJ (BE = PJ) — přijatý dluh, přetrvává v refaktoru
- **Kde:** FE `WeatherSetsModal.tsx:326-327` `canDelete = !readOnly`; rodič `WorldWeatherPage.tsx:409` otevírá s `readOnly={!canManage}` (canManage = PomocnyPJ+). → PomocnyPJ vidí „Smazat set", ale BE `WeatherGeneratorSetService.remove` = `assertIsPJ` (PJ, :150) → 403. TODO komentář `:327` „jemnější role flag" to přiznává.
- **Dopad:** FE over-exposure PomocnyPJ na delete setu → 403 (BE autoritativní, žádný leak/eskalace). Známé jako `area00-K4` (přijatý dluh v `role-audit.md`); kód se od „`isGlobalAdmin || true`" refaktoroval na `!readOnly`, ale podstata (PomocnyPJ nerozlišen od PJ) zůstává.
- **Klasifikace:** ♻️ známé (area00-K4) · Závažnost 🟡 nízká · **L2**

---

## Ověřeno bez díry (L2)

- **HN-01 canManage** (`:62`) = GlobalAdmin(worldAdminBypass) || role>=PomocnyPJ → create/update/delete/deleteComment moderace. Hráč→403. ✅
- **HN-02 canView** (`:73`) = bypass || (member && role>Zadatel); groupOnly → PomocnyPJ+ || `member.group===targetGroup`. ✅
- **HN-03 groupOnly 404 anti-leak** — `assertViewOrThrow` (`:94`) → **404 `EVENT_NOT_FOUND`** (ne 403) když canView false. Skupinová izolace v findById/confirm/comment/react. FE `EventsPage` client-filter `targetGroup` + BE `findList` re-filter. ✅ (shodné s registrem)
- **HN-04 archiv 24h** — `findList` (`:150`) `requestsArchive && role<PomocnyPJ` → 403 `ARCHIVE_PJ_ONLY`; auto-clamp fromDate=cutoff pro hráče (`:157`); ARCHIVE_SKEW_MS tolerance. FE `EventsPage.tsx:44` redirect archive→upcoming pro <PomocnyPJ + `useArchiveGameEvents(role)`. ✅
- **HN-05 FE Events buttons** — `canCreate = viewerRole>=PomocnyPJ` (EventsPage:79, EventsToolbar:37), archive chip PomocnyPJ+. Parita s BE canManage/canView. ✅
- **HN-06 calendars.assertCanModerate** (`:112`) = PomocnyPJ+ pro `aggregate` (read) **i** `updateSettings` (write). FE `/kalendar` route = PomocnyPJ (router:320) → parita. Pozn.: aggregate je PJ-nástroj (přehled event postav napříč světem, privacy).
- **HN-07 world-calendar-config.assertMember** (`:338`) = member && role>=**Hrac(2)**. Ctenar → 403 (matice `⛔?` → potvrzeno: Ctenar **nečte** config). `assertCanWrite` (`:366`) = PomocnyPJ+. (Read práh Hrac je z FE nevyužitý — obě calendar routy jsou PomocnyPJ; latentní over-restrikce, by-design bez player-facing config view.)
- **HN-08 create/patch/remove config** = `assertCanWrite` PomocnyPJ+; remove má DEFAULT_CONFIG_LOCKED guard + CD-RUN-2 dangling timeline slug cleanup. ✅
- **HN-10 timeline read = Hrac** (`assertMember:274`, R-06 kód rozlišen) ↔ FE `/timeline` route Hrac (router:323). ✅ (R-06 opraveno)
- **HN-11 timeline write** = `assertCanWrite` PomocnyPJ+ (`:311`), neexistující svět→404, worldId immutable guard (`:194`). ✅
- **HN-13 počasí 3 prahy** — read `assertMember` Hrac (`:371`), write `assertCanWrite` PomocnyPJ (`:402`), delete custom preset `assertIsPJ` PJ (`:171`). Weather-set: read Hrac / write PomocnyPJ / delete PJ. ✅ (kromě generator-delete driftu — viz nález R-RUN výše)
- **HN-14 FE Weather** — `canManage = role>=PomocnyPJ`, `canDelete = role>=PJ` (WorldWeatherPage:99-100), custom-preset delete PJ. Generovat/broadcast/manual/drag = canManage. (Parita drží pro preset/set delete; generator delete drift viz nález.)
- **HN-16 gm-notes.assertPj** (`:40`) = PomocnyPJ+ → 403 `INSUFFICIENT_WORLD_ROLE`. FE `denik-pj` route = PomocnyPJ + Sa/Admin fallback (router:356). ✅
- **HN-17 deník PJ per-PJ izolace** — repo `findOrCreate/updateContent/findByWorldAndUser` klíčované `{worldId,userId}` (world-gm-notes.repository.ts:15,27,56). Jeden PJ nevidí poznámky druhého. ✅ (shodné s registrem)
- **HN-18** — deník PJ = WorldGmNotes (gm-notes endpoint), hráč = CharacterNotes (jiný endpoint, TacticalMapView:668 `isPJ ? gmNotes : charNotes`). Nepletou se. ✅
- **broadcast cross-world** — `chat.service.createSystemMessage` (`:2301-2307`) validuje `channel.worldId !== worldId` → 404. PomocnyPJ světa A nemůže broadcastnout do kanálu světa B. ✅ (bez OW leaku)
- **GlobalAdmin/elevation bypass** — všude přes `worldAdminBypass(user, worldId)` jako první větev (jednotné, elevation model R-20). ✅

## Pozorování (ne nálezy)

- **game-events RSVP/komentář píše i Ctenar** — `confirm`/`addComment`/`editComment`/`reactToComment` gate = `assertViewOrThrow` (canView = Ctenar+). Ctenar (read-only role) může RSVPovat a komentovat akce. Možná over-permission, ale pravděpodobně by-design (sociální vrstva). K produktovému rozhodnutí, ne role-bug.
- **Line-drift v plánu 06** (doc, ne kód): HN-01 `:55`→`:62`, HN-02 `:66`→`:73`, HN-03 `:88`→`:94`, HN-06 `:142`→`:112`, HN-07 `:313`→`:338`, HN-10 `:247`→`:274`, HN-13 `:359`→`:371`/`:390`→`:402`/`:169`→`:171`. Aktualizovat odkazy v plánu.

---

## Pokrytí

| Bod | Stav | Úroveň |
|---|---|---|
| HN-01..05 (události) | ✅ ověřeno | L2 |
| HN-06..09 (kalendář/config) | ✅ ověřeno | L2 |
| HN-10..12 (timeline) | ✅ ověřeno (R-06) | L2 |
| HN-13..15 (počasí) | ✅ + 🆕 R-RUN (generator delete drift) | L2 |
| HN-16..18 (deník PJ) | ✅ ověřeno | L2 |
| weather-sets (mimo plán) | ✅ + ♻️ area00-K4 | L2 |

Matice role×akce oblasti 06: buňky pokryté, žádná nová `⬜` díra proti autoritativnímu BE.

## PROOF-REQUESTy (pro dosažení L3/L4)

1. **M8 red-team — generator delete:** PomocnyPJ `DELETE /worlds/:id/weather-generators/:genId` → dnes **200** (BE assertCanWrite). Ověřit + rozhodnout práh (PJ vs PomocnyPJ) → L4.
2. **M7 gap-fill — Ctenar error kód:** kontraktní test `assertMember` Ctenar v weather/calendar-config/weather-set → očekávaný `INSUFFICIENT_ROLE` (dnes `PENDING_MEMBERSHIP`).
3. **M8 — groupOnly 404 red-team:** hráč skupiny A `GET /game-events/:idB` (skupina B) → 404 (ne 403). Trvalá regresní pojistka pro HN-03.
4. **M7 — deník PJ per-PJ:** PomocnyPJ A `GET /worlds/:id/gm-notes` nevrací obsah PomocnyPJ B (ownership uvnitř staff). L4.
5. **M8 — archiv gate:** hráč `GET /game-events?worldId&toDate=…` (nebo fromDate<cutoff) → 403 `ARCHIVE_PJ_ONLY`.
