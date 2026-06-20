# seed-scenario / 00-cross-cutting — checkpoint RUN-2026-06-20-1621

Datum: 2026-06-20. Metoda: M1 (statické čtení). Reálný e2e běh NESPUŠTĚN.

---

## Pokrytí

### Co bylo přečteno (HEAD)

| Soubor | Stav |
|---|---|
| `test/jest-e2e.json` | ✅ přečteno |
| `test/helpers/db.ts` | ✅ přečteno |
| `test/helpers/app-factory.ts` | ✅ přečteno |
| `test/helpers/auth.ts` | ✅ přečteno |
| `test/helpers/seed-scenario.ts` | ✅ přečteno |
| `test/seed-scenario.e2e-spec.ts` (páteř) | ✅ přečteno |
| `test/seed-scenario-isolation.e2e-spec.ts` (IS gauntlet) | ✅ přečteno |
| `test/mocks/archiver.stub.ts` | ✅ přečteno |
| `test/race/race-barrier.ts` | ✅ přečteno |
| `test/race/deletion.race.e2e-spec.ts` | ✅ přečteno |
| `test/race/roles.race.e2e-spec.ts` | ✅ přečteno |
| `test/race/pages.race.e2e-spec.ts` | ✅ přečteno |
| `test/race/economy.race.e2e-spec.ts` | ✅ přečteno |
| `test/race/economy.model.race.e2e-spec.ts` (fast-check) | ✅ přečteno (partial) |
| `test/race/maps.race.e2e-spec.ts` | ✅ přečteno |
| `test/race/db-lifecycle.race.e2e-spec.ts` | ✅ přečteno |
| `stryker.conf.json` | ✅ přečteno |
| `package.json` (devDeps) | ✅ přečteno |
| `src/modules/worlds/worlds.service.ts` (playerCount/characterPath) | ✅ přečteno (grep) |
| `src/modules/chat/chat.service.ts` (auto konverzace) | ✅ přečteno (grep) |
| `seed-scenario-plan/README.md` + `00-cross-cutting.md` | ✅ přečteno |
| `seed-scenario-audit.md` (registr) | ✅ přečteno |

### Oblasti plánu (13 os, 12 oblastí)

| Oblast | Co existuje | Stav |
|---|---|---|
| 00 Cross-cutting (harness, builder, mřížka) | `db.ts` replSet ✅, `app-factory.ts` flag ✅, `seed-scenario.ts` builder ✅ | ✅ HOTOVÁ infra |
| 01 Uživatel | `registerUser`/`loginUser` helper ✅ | ✅ ve speci |
| 02 Svět | SE side-effecty (currencies/calendar/settings/membership) tvrzeny ✅ | ✅ L3 |
| 03 Člen | approve flow ✅, characterPath SE ✅; playerCount K-SS2 **NECHYBÍ** v assert (RC-R2 race v race/roles, ale v seed-scenario přímé K-SS2 tvrzení chybí) | ⚠️ mezera L3 |
| 04 Stránka | create page + persona page ✅, Character side-effect ✅ | ✅ L3 |
| 05 Postava | PC (persona) + NPC ✅, CARD deník 1× ✅ | ✅ L3 |
| 06 Chat | group+channel+message ✅; K-SS6 auto-konverzace **CHYBÍ** v seed-scenario.e2e-spec.ts | ⚠️ mezera L3 |
| 07 Mapa | scéna ✅ | ✅ L2 (bez IN token assign) |
| 08 Oprávnění+izolace | AC negativní mřížka ✅ (3 testy); IS tenant izolace ✅ (`seed-scenario-isolation`) | ✅ L3 |
| 09 Mazání | **ZCELA CHYBÍ** v seed-scenario (soft-delete/restore/hard-delete + 0 orphanů verif) | 🔴 mezera |
| 10 Migrace-parita | **NEEXISTUJE** žádný spec soubor | 🔴 neimplementováno |
| 11 Parametrický režim | **NEEXISTUJE** žádný spec soubor | 🔴 neimplementováno |

---

## Dosažená L vs. cílová L

| Oblast | Cíl (Maximum) | Dosaženo staticky |
|---|---|---|
| Harness/builder (00) | L4 | ✅ L4 infra (replSet + connection dostupný) |
| Páteř 01-07 | L4 | L3 (SE/AC tvrzeny, IN-delta ✅, ale nepokryty všechny SE — viz nálezy) |
| Gauntlet FA | L4 | **L0** — žádný FA spec v seed-scenario.e2e-spec.ts; FA fragmenty jen v race/economy (RC-E5 =fault injection na purchase) |
| Gauntlet RC | L4 | L3 (race/ sada existuje a je robustní s Gate/Barrier) |
| Gauntlet IS | L4 | L3 (seed-scenario-isolation.e2e-spec.ts hotová, kontrolní strana ✅) |
| Gauntlet RB | L4 | **L0** — žádný RB (soft-delete→restore→assert) spec |
| Gauntlet MG | L4 | **L0** — žádný MG spec |
| Gauntlet PB | L4 | **L0** — žádný PB spec |
| L5-infra (Cloudinary/Meili) | L5-infra | **L0** |
| L5-teeth (Stryker) | L5-teeth | **L0** — `stryker.conf.json` hotový (race sada), ale seed-scenario scénář nezmutován |

**Celkový stav:** Harness a builder jsou produkční kvality (L4 infra). Páteř L2 smoke + L3 SE/AC/IN je zelená (16/16 dle registru). Gauntlet je NEROVNOMĚRNÝ: RC existuje (race/ sada) IS existuje, ale FA/RB/MG/PB a oblast 09 (mazání) chybějí zcela.

---

## Nálezy

### SS-RUN-01 🟠 `SE` / `K-SS2` — K-SS2 (playerCount == realCount) není tvrzeno v seed-scenario.e2e-spec.ts · 🆕

- **Kde:** `test/seed-scenario.e2e-spec.ts` — sekce `side-effecty (SE)` (řádky 131–164). `playerCount` counter se po approve+role Hrac NEVERIFIKUJE vůči `real count` v DB.
- **Co existuje:** `RC-R2` v `test/race/roles.race.e2e-spec.ts:133` ověřuje, že pod souběhem counter nedriftuje (+1 ne +2). Ale páteřní happy-path test NEVERIFIKUJE, že `playerCount == countDocuments({role:'Hrac'})` po approve.
- **Dopad:** K-SS2 hypotéza zůstává neověřena v happy-path kompozici (L3 mezera). Výpadek counter-finanty (DI-05) může zůstat skrytý při lineárním průchodu.
- **Návrh:** Přidat do `describe('side-effecty')`: `expectCounterMatches(conn,'worlds',worldId,'playerCount', ...)` po approve.
- **L2** (statický nález — kód scény přečten, tvrzení chybí).
- **Repro:** Staticky dohledáno — `grep playerCount test/seed-scenario.e2e-spec.ts` → 0 hitů.

---

### SS-RUN-02 🟠 `SE` / `K-SS6` — Auto soukromá konverzace (6.7) není tvrzena po `assign-character` · 🆕

- **Kde:** `test/seed-scenario.e2e-spec.ts` / `test/helpers/seed-scenario.ts:184–189`. Po `PATCH /members/:id/character` scénář NEVERIFIKUJE, že vznikla soukromá konverzace v kanálu „Postavy" (6.7 `ensureCharacterChannel`).
- **Co existuje:** `chat.service.ts:1750 @OnEvent('world.character.assigned')` → `handleCharacterAssignedChat` → `safeEnsureCharacterChannel`. Unit test v `chat.service.spec.ts:740`. Ale v e2e kompozici to chybí.
- **Dopad:** K-SS6 neověřena v reálné kompozici. Pokud listener selže (závislost na `Postavy` group existenci, která ve scénáři vzniká AŽ v kroku 06), assign-character proběhne bez auto-konverzace tiše.
- **Past:** seed-scenario.ts krok 03 (assign-character) volá endpoint PŘED krokem 06 (chat group create). `handleCharacterAssignedChat` hledá group se jménem „Postavy" — pokud neexistuje, `safeEnsureCharacterChannel` pravděpodobně tiše selže (`catch → log warn`). Tohle je **potenciální pořadí-závislostní bug** v seederu.
- **Návrh:** (a) Ověřit pořadí: assign-character by měl být PO vytvoření Postavy group; nebo (b) `safeEnsureCharacterChannel` musí group vytvořit, pokud chybí; (c) přidat SE tvrzení: po assign-character assert `chatchannels.findOne({ linkedMemberUserId: hrac.userId })`.
- **L2** (statický nález).

---

### SS-RUN-03 🔴 `FA` / `K-SS1`, `K-SS3` — Gauntlet FA (fault injection) zcela chybí v seed-scenario.e2e-spec.ts · 🆕

- **Kde:** `test/seed-scenario.e2e-spec.ts` — žádná sekce `describe('gauntlet FA')`. Plán 00-cross-cutting.md §D popsal FA mechaniku detailně, ale v kódu není.
- **Co existuje:** `economy.race.e2e-spec.ts:285` (`RC-E5`) má `mockRejectedValueOnce` na purchase log — to je FA pro ekonomiku, ale **ne pro seedový světový lifecycle**.
- **Dopad:** K-SS1 (svět: pád na currencies/calendar → partial world bez cleanup) a K-SS3 (persona page: pád po character create → orphan character) jsou hypotézy, které NIKDE v e2e testech nejsou prokazovány nebo vyvracovány. Transakce kaskád (DI-04) na replSet nejsou ověřeny.
- **Návrh:** Implementovat `describe('gauntlet FA')` v seed-scenario.e2e-spec.ts (nebo jako `seed-scenario-fa.e2e-spec.ts`): spy na `WorldSettingsRepository.save` → `mockRejectedValueOnce` → assert svět nevznikl (nebo je čistý); spy na `PagesRepository.save` → character nesmí přežít.
- **L1** (nechybí jen tvrzení — chybí celý spec).

---

### SS-RUN-04 🔴 `CL`/`RB` / `K-SS5`, `K-SS7`, `K-SS8` — Oblast 09 (mazání) zcela chybí v seed-scenario.e2e-spec.ts · 🆕

- **Kde:** `test/seed-scenario.e2e-spec.ts` — žádný krok mazání, žádné tvrzení 0 orphanů po smazání. Plán 00 I) Mapování os řídí `CL` jen na krok 09 Mazání.
- **Co existuje:** `test/race/deletion.race.e2e-spec.ts` (RC-D3: kanál mazání), `test/race/db-lifecycle.race.e2e-spec.ts` (RC-D2: soft-delete světa) — tyto pokrývají RACE úhel mazání, ale **nikoli happy-path cascade cleanup ani RB round-trip (soft→restore→hard)**.
- **K-SS5** (`membership.currentSceneId` cleanup při smazání scény): v `maps.race.e2e-spec.ts` je RC-D6 (race úhel), ale happy-path cleanup (smaž scénu → assert `currentSceneId` null) v seed-scenario chybí.
- **K-SS7** (soft-delete recovery-safe → restore → PLNĚ intaktní): žádný spec.
- **K-SS8** (hard-delete → 0 orphanů napříč ~40 kolekcí): žádný spec.
- **K-SS14** (TM: cron fast-forward 30d → world hard-delete): žádný spec.
- **Dopad:** Celá osa `CL` (cleanup) a `RB` (reverzibilita) jsou statické hypotézy, nikde prokazovány e2e.
- **Návrh:** Přidat do seed-scenario nebo jako `seed-scenario-cleanup.e2e-spec.ts`: DELETE scene → assert `membership.currentSceneId` null; DELETE world soft → assert `isActive:false`; PATCH restore → assert entity intaktní; DELETE world hard → `worldOrphanKeys() === []`.
- **L1**.

---

### SS-RUN-05 🟠 `RT` — Osa RT (realtime/broadcast) netvrzena v žádném e2e seed-scenario spec · 🆕

- **Kde:** plán README.md (osa `RT` tvrzena v uzlech 03, 06, 07, 09). `test/seed-scenario.e2e-spec.ts` — žádný `socket.io-client` listener, žádné broadcast tvrzení.
- **Co existuje:** `devDeps: socket.io-client@4.8.3` nainstalován. Ale žádný spec to nevyužívá.
- **Dopad:** WS broacast strana (WS eventy po approve / chat message / token assign) není nikde prokazována e2e. Tiché selhání broadcastu by prošlo.
- **Návrh:** Aspoň jeden zástupný `RT` test: otevřít socket.io-client, subscribe na `world:{id}`, spustit approve → assert dostal event. Oblast 03 páteře.
- **L0** (devDep je, spec chybí).

---

### SS-RUN-06 🟠 `OB` — Osa OB (observabilita / tichý ValidationPipe drop) chybí v spec · 🆕

- **Kde:** `test/seed-scenario.e2e-spec.ts` — žádný logger hook, žádné pošli `__bogus` → assert v DB.
- **Co existuje:** plán 00-cross-cutting.md §A3 popsal mechaniku. `app-factory.ts:117` má `ValidationPipe({ whitelist: true })` — drop tiše probíhá.
- **Dopad:** K-SS13 (tichý drop) neověřen.
- **Návrh:** 1 test v seed-scenario: `POST /api/worlds/:w/pages` s extra `__bogusField: 'x'` → assert `pages.findOne(...)` nemá `__bogusField` v DB (drop proběhl) + assert `Logger.error` NEBYL volán (žádný neočekávaný error).
- **L1**.

---

### SS-RUN-07 🔴 `MG` / `K-SS12` — Oblast 10 (migrace-parita) neexistuje jako spec · 🆕

- **Kde:** žádný soubor `seed-scenario-migration*.e2e-spec.ts` nebo `migration-parity*.e2e-spec.ts` v `test/`.
- **Dopad:** K-SS12 (svět přes importery F1–F12 projde stejnou mřížkou + diff vs service-build) neprokazována. Migrační cesta = #1 zdroj orphanů (DI-04/K-DI4).
- **Návrh:** Oblast 10 dle plánu 00-cross-cutting.md §P5; v kontextu projektu `matrix` svět přes `migration/` skripty + `integrity-scan` podmnožina.
- **L0**.

---

### SS-RUN-08 🔴 `PB` / oblast 11 — Parametrický režim neexistuje jako spec · 🆕

- **Kde:** žádný soubor `seed-scenario-parametric*.e2e-spec.ts` v `test/`.
- **Dopad:** Matice `{systém: matrix/dnd} × {access: public/private/closed} × {persona: on/off}` netestována.
- **Návrh:** Oblast 11 dle plánu.
- **L0**.

---

### SS-RUN-09 🟡 `ID` / pořadí v seed-scenario-isolation — Chybí kontrolní teardown v IS spec · ♻️

- **Kde:** `test/seed-scenario-isolation.e2e-spec.ts` — `afterAll` pouze `testApp.close()`, ale **neověřuje, že žádný stav světa A neprosákl do světa B v DB** (DB-introspekce 0 cross-worldId dokumentů).
- **Co existuje:** HTTP-level leak testy jsou dobré. Ale `IN`/`ID` osa (žádný dokument z B nemá `worldId=A.worldId` v DB) chybí.
- **Dopad:** Falešně zelený IS pokud leak existuje na DB úrovni ale je filtrován API vrstvou.
- **Návrh:** Přidat `IN` DB-introspekci: `pages.countDocuments({ worldId: B.worldId, slug: A.pageSlug }) === 0` — tzn. dokument světa A s ID světa B neexistuje (test spíše API-level leaku, ten tu je; DB cross-insert je edge case).
- **L2** (nízká priorita — API-level IS tvrzení jsou dostatečná pro většinu scénářů).

---

### SS-RUN-10 🟡 `archiver stub` — archiver.stub.ts exportuje neúplné typy (NE runtime chyba) · ♻️

- **Kde:** `test/mocks/archiver.stub.ts` — exportuje `ZipArchive`, `TarArchive`, `JsonArchive`, `Archiver` jako prázdné třídy, `default: {}`. Prod archiver API může mít jiné exporty.
- **Dopad:** Pokud e2e scénář přes AppModule nabootuje world-export modul a zavolá archiver API (ve scénáři NENÍ cesta k exportu), žádný problém. Pokud by se přidal e2e test exportu, stub by se musel rozšířit.
- **Návrh:** Dokumentovat `// stačí pro boot, neimplementovat` — viz stávající komentář. Stav OK pro aktuální scope.
- **L2** (kosmetika/dokumentace).

---

## Mapování nálezů na K-SSx

| K-SSx | Záv. | Stav po statickém auditu |
|---|---|---|
| K-SS1 | 🔴 | ⬜ — FA spec neexistuje (SS-RUN-03) |
| K-SS2 | 🟠 | ⬜ — SE tvrzení chybí v seed-scenario (SS-RUN-01) |
| K-SS3 | 🔴 | ⬜ — FA spec neexistuje (SS-RUN-03) |
| K-SS4 | 🟠 | ✅ — CARD deník 1× tvrzeno (`seed-scenario.e2e-spec.ts:158`) |
| K-SS5 | 🔴 | ⬜ — oblast 09 chybí (SS-RUN-04) |
| K-SS6 | 🟠 | ⬜ — SE auto-konverzace chybí + potenciální pořadí-bug (SS-RUN-02) |
| K-SS7 | 🟠 | ⬜ — oblast 09 chybí (SS-RUN-04) |
| K-SS8 | 🔴 | ⬜ — oblast 09 chybí (SS-RUN-04) |
| K-SS9 | 🔴 | ✅ (částečně) — 3 AC testy v seed-scenario, IS spec hotová |
| K-SS10 | 🟠 | ✅ — RC-R4 (double-approve), RC-P3 (slug dup) v race/ |
| K-SS11 | 🔴 | ✅ — seed-scenario-isolation.e2e-spec.ts hotová (5 testů + kontrolní strana) |
| K-SS12 | 🔴 | ⬜ — MG spec neexistuje (SS-RUN-07) |
| K-SS13 | 🟠 | ⬜ — OB chybí (SS-RUN-06) |
| K-SS14 | 🟡 | ⬜ — TM chybí (SS-RUN-04) |

---

## PROOF-REQUEST

> Reálný e2e běh NESPUŠTĚN (READ-ONLY audit). Vydáno jako PROOF-REQUEST pro Fázi C.

### PR-01 — Páteř + IS (nutné minimum, mělo by projít)
```
npm run test:e2e -- --testPathPattern "seed-scenario.e2e-spec" --forceExit
npm run test:e2e -- --testPathPattern "seed-scenario-isolation.e2e-spec" --forceExit
```
**Co prokáže:** L2 smoke 16/16 + L3 SE/AC/IN zelená (replSet). SS-01 regrese = 0 orphanů.
**Riziko:** SS-RUN-02 (assign-character PŘED Postavy group) by mohl způsobit throw v buildCanonicalWorld (krok 05 vs. 06 pořadí).

### PR-02 — Race sada (RC gauntlet)
```
npm run test:e2e -- --testPathPattern "race/" --forceExit
```
Spouštět SÓLO (SIGABRT při kombinaci). Prokáže: RC-R1/R2/R3/R4, RC-P1–P4, RC-E1–E5, RC-D1/D3/D4/D6, RC-D2. **Varování:** 🐛 testy (RC-R2, RC-R3, RC-P1–P4, RC-E1–E5, RC-D1/D2/D6) mají být ČERVENÉ před fixem — ověřit, zda jsou nyní červené (nefix) nebo zelené (fix).

### PR-03 — FA gauntlet (neexistuje — vyžaduje implementaci)
FA spec pro K-SS1/K-SS3 musí být napsán před spuštěním. Není co spustit.

### PR-04 — Oblast 09 mazání (neexistuje — vyžaduje implementaci)
CL/RB/TM spec pro K-SS5/7/8/14 musí být napsán.

### PR-05 — Oblast 10 MG parita (neexistuje)
Vyžaduje implementaci migračního seed-builderu.

### PR-06 — Oblast 11 PB parametrická (neexistuje)
Vyžaduje implementaci `{systém}×{access}×{persona}` matice.

---

## Závěr dosažené hloubky

- **L2** smoke (páteř): staticky ověřeno, že kód scénáře projde řetězem — PROOF-REQUEST PR-01.
- **L3** SE/AC/IN: staticky ověřeno, tvrzení přečtena — chybí K-SS2 a K-SS6 (SS-RUN-01/02).
- **L4** FA/RC/RB/CL: RC sada existuje a je robustní; FA/RB/CL/TM/OB chybí zcela.
- **L5**: 0 (Stryker konfigurován pro race, ne seed-scenario; socket.io-client devDep ale nevyužit).
