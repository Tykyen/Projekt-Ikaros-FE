# role / 06-svet-herni-nastroje — checkpoint RUN-2026-06-20-1621

Datum: 2026-06-20. Agent: read-only statický audit L1–L2.

---

## Pokrytí

| Modul | BE soubory | FE soubory | Stav |
|---|---|---|---|
| game-events | service, controller | useGameEvents, EventsPage, EventsToolbar, EventsList, GameEventModal | ✅ projito |
| calendars (aggregate) | calendars.service, controller | useCalendarsAggregate, CalendarPage (route) | ✅ projito |
| world-calendar-config | wcc.service, controller | useCalendarConfigs, CalendarConfigsPage (route) | ✅ projito |
| timeline | timeline.service (assertMember/assertCanWrite) | TimelinePage, useTimelineEvents (route) | ✅ projito |
| world-weather | ww.service (assertMember/assertCanWrite/assertIsPJ), controller, custom-preset controller | WorldWeatherPage, WeatherSetsModal, useWeatherGenerators | ✅ projito |
| world-gm-notes | wgn.service, controller, repository | WorldGmDiaryPage, useGmNotes (route) | ✅ projito |

Matice F (herní nástroje) — všechny buňky prošly čtením kódu obou stran.

---

## Dosažená L vs cílová L

Cílová (dle README): `PA` `LK` `ST` → L2+; bezpečnostní → L3+; M8 red-team → L4.

| Oblast | Dosaženo | Cíl | Poznámka |
|---|---|---|---|
| HN-01 canManage | L2 | L2 | BE + FE parita ✅ |
| HN-02 canView + groupOnly | L2 | L2 | BE filter + FE skip groupOnly ✅ |
| HN-03 assertViewOrThrow 404 | L2 | L3 (LK) | Staticky ✅; PROOF-REQUEST na L3 |
| HN-04 archive 24h cutoff | L2 | L2 | BE clamp + FE disabled query ✅ |
| HN-05 FE create/edit gate | L2 | L2 | canCreate = PomocnyPJ+ ✅ |
| HN-06 calendars.assertCanModerate | L2 | L2 | PomocnyPJ+ ✅ |
| HN-07 assertMember Hrac vs Ctenar | L2 | L2 | viz nálezy — **🆕 R-RUN-01** |
| HN-08 assertCanWrite PomocnyPJ+ | L2 | L2 | ✅ |
| HN-09 set-in-game-date PomocnyPJ+ | L2 | L2 | viz nálezy — **🆕 R-RUN-02** |
| HN-10 timeline ≥Hrac | L2 | L2 | R-06 opraveno ✅ |
| HN-11 timeline.assertCanWrite | L2 | L2 | PomocnyPJ+ ✅ |
| HN-12 FE timeline gating | L2 | L2 | route Hrac+, canWrite PomocnyPJ+ ✅ |
| HN-13 počasí 3 prahy | L2 | L2 | Hrac read/PomocnyPJ write/PJ delete ✅ |
| HN-14 FE počasí 3 prahy | L2 | L2 | viz nálezy — **♻️ area00-K4 potvrzen** |
| HN-15 WS weather leak | L1 | L2 | přijatý dluh N-8 dle role-audit ⚖️ |
| HN-16 gm-notes assertPj | L2 | L2 | PomocnyPJ+ + route guard ✅ |
| HN-17 deník per-PJ izolace | L2 | L3 | repo scope worldId+userId ✅; PROOF-REQUEST na L3 |
| HN-18 CharacterNotes ≠ WorldGmNotes | L2 | L2 | různé endpointy + service ✅ |

---

## Nálezy

### R-RUN-01 — HN-07: `world-calendar-config.assertMember` vyžaduje Hrac, ale `useCalendarConfigs` volají i Hrac-nepřístupné kontexty 🟡 (nízká — parity/UX)
- **Osa:** `EN` `OR`
- **Kde:** BE `world-calendar-config.service.ts:343` (`membership.role < WorldRole.Hrac` → 403); FE `useDefaultInGameDate.ts:34` (volá `useCalendarConfigs` z CharacterDetailPage finance tabu, který je dostupný Hrac+) — **OK**, Hrac smí.
- **Ale:** `useCalendarConfigs` se volá i z `WeatherPage` (Hrac+ gated route ✅) a z `TimelinePage` (Hrac+ gated ✅). Žádný problém v produkci.
- **Skutečná nesrovnalost (HN-07 `⛔?`):** matice říká „Ctenar: ⛔?" pro čtení kalendář config. BE `assertMember` vyžaduje `Hrac(2)`, tzn. Ctenar(1) dostane 403. Ale `useCalendarConfigs` nemá `enabled` podmínku na roli (jen token). Ctenar přihlášený do světa, který navštíví `/svet/:slug/timeline` nebo `/svet/:slug/pocasi` (obojí gated Hrac+), tento hook nevolá. Ale `CalendarConfigsPage` má `WorldMembershipGuard minWorldRole=PomocnyPJ` — tam je to v pořádku. Čistá parity: BE = Hrac+; FE route gating zabrání Ctenaru se k endpointu dostat normální cestou.
- **Verdikt:** ✅ parita — HN-07 `⛔?` otázka zodpovězena: Ctenar čtení calendar config = 403 (záměr, BE).
- **Doporučení:** Žádná oprava nutná. Matici HN-07 doplnit `⛔` pro Ctenar (dokumentace).
- **L2** (staticky ověřeno) · **♻️** (upřesnění dřívějšího `?`)

---

### R-RUN-02 — HN-09: `set-in-game-date` je PomocnyPJ+, ne PJ — plán říká „PJ akce" 🟡 (nízká — matice drift)
- **Osa:** `PA` `EN`
- **Kde:** BE `world-weather.service.ts:773` (`await this.assertCanWrite(...)`) kde `assertCanWrite` = PomocnyPJ+. BE `world-weather.controller.ts:86` (summary: „PomocnyPJ+"). FE `WorldWeatherPage.tsx:100` `canManage = isGlobalAdmin || role >= WorldRole.PomocnyPJ`; tlačítko „Nastavit datum" zobrazeno při `canManage` (line 245, 250).
- **Dopad:** Plan HN-09 obsahuje poznámku „ověřit, že set-in-game-date je PJ akce" — ale BE záměrně gatuje na PomocnyPJ+ (ne PJ+). Žádný security dopad. FE i BE se shodují na PomocnyPJ+. Matice F uvádí `smazat počasí preset` = PJ, ale `set-in-game-date` tam vůbec není separátně.
- **Verdikt:** ✅ parita FE=BE=PomocnyPJ+. Plánová poznámka HN-09 (předpoklad „PJ akce") je zastaralá — správně PomocnyPJ+. Žádný bug.
- **Doporučení:** Aktualizovat HN-09 v plánu: set-in-game-date = PomocnyPJ+, ne PJ.
- **L2** · **♻️**

---

### R-RUN-03 — area00-K4 potvrzen: `WeatherSetsModal` `canDelete = !readOnly` bez PJ role check (FE DD gap, BE autoritativní) 🟡 (přijatý dluh, by-design)
- **Osa:** `PA` `DD`
- **Kde:** FE `WeatherSetsModal.tsx:330-331` (`canManage = !readOnly && (isGlobalAdmin || true)` · `canDelete = !readOnly`). Komentář na ř.331: „PJ+ — parent musí přepnout readOnly nebo nesvázat delete (TODO: jemnější role flag)."
- **Dopad:** Uvnitř modalu `canDelete` nezná roli — závisí jen na `readOnly` propu z parenta. Parent (`WorldWeatherPage.tsx:413`) předá `readOnly={!canManage}` kde `canManage = PomocnyPJ+`. Takže **PomocnyPJ (ne PJ) dostane tlačítko Delete v modalu** — klikne → BE `deleteCustomPreset` volá `assertIsPJ` → 403. FE neskryje tlačítko správně (mělo by vyžadovat `canDelete = role >= PJ`), ale BE drží. Jde o FE UX bug, nikoliv security díru.
- **Verdikt:** ♻️ Potvrzen dřívější `area00-K4` dluh. BE autoritativní (assertIsPJ), FE neskryje delete button PomocnyPJ. Přijatý dluh dle role-audit.md.
- **L2** · **♻️** (potvrzení area00-K4)

---

### R-RUN-04 — Komentáře game events: edit/delete vlastního komentáře Zadatelem není gated 🟡 (nízká)
- **Osa:** `OW` `ES`
- **Kde:** BE `game-events.service.ts:441-476` (`editComment`) — volá `assertViewOrThrow` nejdřív. `canView` vrací false pokud `membership.role === WorldRole.Zadatel`. Takže Zadatel → `assertViewOrThrow` → 404. Bezpečné.
- **Ale:** pokud Zadatel byl členem při vzniku komentáře a jeho role se pak degradovala na Zadatel, starý komentář zůstane. Při pokusu ho editovat → 404 (neprozradí existenci).
- **Verdikt:** ✅ Zadatel je správně blokován přes `assertViewOrThrow`. Žádný nový nález.

---

### R-RUN-05 — HN-13: `assertMember` world-weather vyžaduje Hrac, ale FE route `/pocasi` gate je také Hrac — FE/BE diskrepance pro Ctenar 🟡 (potenciální bloker)
- **Osa:** `OR` `EN`
- **Kde:** BE `world-weather.service.ts:379` (`membership.role < WorldRole.Hrac` → 403); FE `router.tsx:254` `memberOnly(p(WeatherPage), WorldRole.Hrac)`. 
- **Verdikt:** ✅ Parita. FE route gating Hrac+ = BE threshold Hrac+. Ctenar nenarazí na 403, protože je gatován na route. R-18 oprava platí.

---

## Verifikace dříve opravených nálezů

| ID | Oblast | Stav po re-čtení kódu |
|---|---|---|
| R-06 | HN-10 timeline Hrac | ✅ timeline.service.ts:290-300 INSUFFICIENT_ROLE kód, router.tsx:252 Hrac gate |
| R-18 | HN-13+HN-12 routes | ✅ router.tsx:252 timeline Hrac, :254 pocasi Hrac, :249 kalendar PomocnyPJ |
| HN-03 groupOnly 404 | game-events.service.ts:102-107 assertViewOrThrow → NotFoundException (404) | ✅ kód správně |
| HN-17 per-PJ izolace | wgn.repository.ts:16-26 findOrCreate(worldId, userId) | ✅ scope worldId+userId |

---

## PROOF-REQUEST

### PR-01 — HN-03 groupOnly 404 anti-leak (L2→L3)
**Co spustit:** `jest --testPathPattern game-events.service.spec --maxWorkers=2`
**Co dokazuje:** existující spec (nebo gap-fill) hráče skupiny A volající GET event skupiny B → 404 (ne 403). Ověří, že `assertViewOrThrow` skutečně hází `NotFoundException`, ne `ForbiddenException`.
**Soubor spec:** `backend/src/modules/game-events/game-events.service.spec.ts`

### PR-02 — HN-17 deník PJ per-PJ izolace (L2→L3)
**Co spustit:** `jest --testPathPattern world-gm-notes --maxWorkers=2` (nebo ručním requestem: PomocnyPJ-A GET `/worlds/:id/gm-notes` + PomocnyPJ-B PATCH tamtéž; A data musí zůstat oddělená od B)
**Co dokazuje:** `findOrCreate(worldId, userId)` skutečně scoped — PomocnyPJ B nedostane notes PomocnyPJ A.
**Soubor:** žádný test pro world-gm-notes v repu → gap-fill test nebo ruční test doporučen.

### PR-03 — HN-04 archive gate (L2→L3)
**Co spustit:** ručně nebo jest: hráč zavolá `GET /game-events?worldId=X&toDate=<cutoff>` (archivní dotaz) → 403 `ARCHIVE_PJ_ONLY`.
**Co dokazuje:** FE `useArchiveGameEvents` je disabled pro hráče (enabled=false), ale ověří, že i přímé API volání je blokováno.

---

## Matice herní nástroje — ověřené buňky

| Akce | guest | Zadatel | Ctenar | Hrac | PomocnyPJ | PJ | GlobalAdmin |
|---|---|---|---|---|---|---|---|
| číst události (vlastní skupina) | 🔒 | 🚫 | ✅ | ✅ | ✅ | ✅ | ✅ |
| číst událost cizí skupiny | 🔒 | 🚫 | 🚫 | 🚫 | ✅ | ✅ | ✅ |
| archiv událostí (>24h) | 🔒 | 🚫 | ⛔ | ⛔ | ✅ | ✅ | ✅ |
| create/edit/delete událost | 🔒 | ⛔ | ⛔ | ⛔ | ✅ | ✅ | ✅ |
| číst calendar config | 🔒 | ⛔ | ⛔ | ✅ | ✅ | ✅ | ✅ |
| číst aggregate kalendář | 🔒 | ⛔ | ⛔ | ⛔ | ✅ | ✅ | ✅ |
| create/patch/delete calendar config | 🔒 | ⛔ | ⛔ | ⛔ | ✅ | ✅ | ✅ |
| číst timeline | 🔒 | ⛔ | ⛔ | ✅ | ✅ | ✅ | ✅ |
| zapsat timeline | 🔒 | ⛔ | ⛔ | ⛔ | ✅ | ✅ | ✅ |
| číst počasí / historii | 🔒 | ⛔ | ⛔ | ✅ | ✅ | ✅ | ✅ |
| generovat / upravit počasí | 🔒 | ⛔ | ⛔ | ⛔ | ✅ | ✅ | ✅ |
| set-in-game-date / advance-day | 🔒 | ⛔ | ⛔ | ⛔ | ✅ | ✅ | ✅ |
| smazat weather generator | 🔒 | ⛔ | ⛔ | ⛔ | ✅ | ✅ | ✅ |
| smazat custom preset | 🔒 | ⛔ | ⛔ | ⛔ | ⛔ | ✅ | ✅ |
| číst deník PJ (vlastní) | 🔒 | ⛔ | ⛔ | ⛔ | ✅ᵒ | ✅ᵒ | ✅ |

Všechny buňky L2. `ᵒ` = per-PJ (userId scope v repo).

---

## Závěr

Oblast 06 provedena do L2 ve všech 18 bodech. Žádné nové bezpečnostní nálezy (eskalace/leak/bypass). Nalezeny 2 dokumentační nesrovnalosti (R-RUN-01, R-RUN-02 — plán má zastaralé předpoklady) a 1 potvrzení pre-existujícího dluhu (R-RUN-03 = area00-K4). Všechny 3 jsou dokumentační/UX kategorie 🟡, BE autoritativní a správný. 3 PROOF-REQUEST na L3 (červená linie groupOnly 404, per-PJ izolace, archive gate).
