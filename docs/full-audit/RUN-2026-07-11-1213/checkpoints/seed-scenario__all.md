# seed-scenario / all — checkpoint RUN-2026-07-11-1213

Datum: 2026-07-11. Metoda: M1 (statické čtení HEAD) + kontext proof logu `e2e-be-after-schemafix.log`.
Reálný e2e běh v tomto agentovi NESPUŠTĚN (READ-ONLY). Pozn. zadání: **izolace spec teď PROCHÁZÍ**
(po schema fixu boot funguje) — IS člen/nečlen OK.

Prefix nálezů `SS-` (registr `docs/seed-scenario-audit.md`). Registr NEEDITOVÁN (jen checkpoint).

---

## Co bylo přečteno (HEAD)

| Soubor | Stav |
|---|---|
| `docs/seed-scenario-plan/README.md` | ✅ |
| `docs/seed-scenario-plan/00-cross-cutting.md` | ✅ |
| `docs/seed-scenario-plan/tools/seed-scenario.md` | ✅ |
| `docs/seed-scenario-audit.md` (registr, SS-01, SS-RUN-01) | ✅ |
| `test/seed-scenario.e2e-spec.ts` (páteř L2 + SE + IN + AC) | ✅ do L2 |
| `test/seed-scenario-isolation.e2e-spec.ts` (IS gauntlet, 5 testů) | ✅ do L2 |
| `test/helpers/seed-scenario.ts` (kanonický builder) | ✅ |
| `src/modules/pages/rulebook/rulebook-matrix-seed.ts` (SS-01 fix) | ✅ |
| `src/database/seed/matrix-world.seed.ts` | ✅ |
| `src/modules/world-page-templates/world-page-templates.matrix-seed.ts` | ✅ |
| `src/modules/pages/pages-world-seed.listener.ts` (`seedRulebook`) | ✅ |
| `src/modules/chat/chat.service.ts` (`seedDefaultGroups`, `ensureCharacterChannel`, assign listener) | ✅ |
| `src/modules/worlds/worlds.service.ts` (emit `world.character.assigned`, grep) | ✅ |
| prior checkpoint `RUN-2026-06-20-1621/seed-scenario__00-cross-cutting.md` | ✅ |

Seed skripty (boot seedery) přezkoumány kompletně: `matrix-world.seed`, `rulebook-matrix-seed`,
`world-page-templates.matrix-seed`, `pages-world-seed.listener`. Gallery/article kategorie seedery
= platform-scoped (bez `worldId`) → mimo orphan povrch, nečteny do detailu.

---

## Pozitivní verifikace (co drží)

- **SS-01 OPRAVENO — potvrzeno na HEAD.** `rulebook-matrix-seed.ts:36-44` gated na
  `worldsRepo.findById(MATRIX_WORLD_ID)`; když svět není → warn + return. **Nikdy stránky bez rodiče.**
  Regresní test `IN › SS-01 regrese` (spec:168) drží baseline orphanů = 0.
- **Sourozenec seederu NEMÁ SS-01 bug.** `world-page-templates.matrix-seed.ts:130-136` je rovněž gated
  (`findBySlug('matrix')` → debug + return). Nový per-svět seeder šablon orphan neprodukuje. ✅
- **`matrix-world.seed.ts:60-63`** guard `if (!superadmin) return` drží; navíc idempotentní backfill
  owner membershipu (R-AUDIT) + vzhledu.
- **IS tenant izolace (K-SS11) reálně zelená** (per zadání). Spec má **kontrolní stranu** (člen VIDÍ,
  nečlen ne) → není falešně zelená; detail světa private = 404 nečlenovi (leak-safe).
- **AC negativní (K-SS9, částečně)** — 3 testy: Hrac nesmí page (403), nesmí delete world (403),
  bez tokenu 401.

---

## Nálezy

### Refutace prior nálezu

**SS-RUN-02 (ordering-bug část) — VYVRÁCENO na HEAD.** Prior run tušil „pořadí-závislostní bug":
assign-character (builder krok 03/05, `seed-scenario.ts:184`) běží PŘED chat group create (krok 06),
takže „Postavy" group prý nemusí existovat. **Není bug:**
- `chat.service.ts:1839-1843` — „Postavy" je **systémová group** seedovaná při inicializaci world chatu
  (`seedDefaultGroups`), ne až uživatelským krokem 06.
- `chat.service.ts:2157-2161` — `ensureCharacterChannel` **self-heal**: když group chybí, zavolá
  `ensureWorldChat(worldId)` a group dohledá. Nemůže tiše selhat na chybějící group.
- Wiring reálný: `worlds.service.ts:1658` emit `world.character.assigned` → `chat.service.ts:2116`
  `@OnEvent handleCharacterAssignedChat` → `safeEnsureCharacterChannel`.

Zbývá jen **chybějící SE tvrzení** (viz SS-RUN-02 níže) — ne bug v produkci.

---

### 🆕 SS-R11-01 🟠 `IN` — orphan check v páteři pokrývá jen 4 kolekce (mřížka mělčí než plán) · 🆕

- **Kde:** `test/seed-scenario.e2e-spec.ts:28-45` — `worldOrphanKeys()` iteruje **pouze**
  `['pages','characters','worldmemberships','mapScenes']` a kontroluje `worldId ∉ worlds`.
- **Co plán chce:** `00-cross-cutting.md §C` `expectNoOrphans` má **přebrat FK seznam z integrity-scan**
  (WORLD_SCOPED + character subdocs + RR refs), explicitně „jeden zdroj pravdy". Chybí zejména:
  - `character_diaries/finance/inventory/notes/accounts.characterId → characters` (subdoc orphan),
  - `worldmemberships.currentSceneId → mapScenes` (RR / CD-04, přímo K-SS5),
  - `world_currencies` / `world_calendar_configs` / `worldsettings` / `chatgroups` / `chatchannels` /
    `chatmessages` `.worldId → worlds`.
- **Dopad:** tvrzení „scénář nepřidal žádný orphan" (spec:173) i „0 orphanů" je **jen dílčí** — orphan
  v subdocu postavy nebo dangling `currentSceneId` páteř NEZACHYTÍ. IN osa je fakticky L3-, ne L4.
- **Návrh:** vytáhnout FK seznam z integrity-scan do sdíleného modulu a použít i tady (viz plán §C pozn.).
- **L2** (statika — kód přečten, seznam kolekcí zúžený).

### 🆕 SS-R11-02 🟠 `SE`/`CARD` (K-SS4) — kardinalita subdoců tvrzena jen pro deník, ne všech 5 typů · 🆕

- **Kde:** `test/seed-scenario.e2e-spec.ts:158-163` — `05 postava: PC má přesně 1 deník` ověří jen
  `character_diaries` count == 1. Prior run značil K-SS4 „✅ tvrzeno" — ve skutečnosti **jen 1 z 5**.
- **Co K-SS4 chce:** diary **+ finance + inventory + notes + accounts**, každý **přesně 1× od typu**
  (dvojitý subdoc = K-DI11 dluh). Ostatní 4 typy netvrzeny → dvojitý/chybějící finance/inventory subdoc
  by prošel.
- **Dopad:** CARD osa dílčí; K-SS4 hypotéza z 80 % neověřena v kompozici.
- **Návrh:** `expectCount(conn, 'character_finance'|'character_inventory'|…, {characterId}, 1)` pro
  všech 5 (u persona-vytvořené PC ověřit, které typy vůbec vznikají).
- **L2**.

---

### ♻️ Přetrvávající mezery z RUN-2026-06-20 (stále platné na HEAD)

Kód specifikací se od prior běhu **nezměnil** (páteř + IS + builder identické); tyto nálezy trvají:

| ID (prior) | Záv. | Osa / K-SSx | Podstata — stále chybí na HEAD | Ověřeno |
|---|---|---|---|---|
| **SS-RUN-04** | 🔴 | `CL`/`RB`/`TM` · K-SS5/7/8/14 | **Oblast 09 (mazání) ZCELA CHYBÍ.** Žádný `seed-scenario-cleanup*.e2e-spec.ts`: DELETE scene → `currentSceneId` null (K-SS5); soft-delete→restore→intaktní (K-SS7); hard-delete → 0 orphanů napříč ~40 kol. (K-SS8); cron 30d (K-SS14). **Celá pointa auditu „nakonec vše smaž + 0 orphanů" je e2e neprokázaná.** | glob `test/**seed-scenario*` = jen `.e2e-spec` + `-isolation` |
| **SS-RUN-03** | 🔴 | `FA` · K-SS1/K-SS3 | **FA gauntlet CHYBÍ.** Žádný spy `mockRejectedValueOnce` v kaskádě world-create (K-SS1) ani persona-page rollback (K-SS3). Transakční atomicita (DI-04) na replSet neprokázána. | grep — 0 FA v seed-scenario |
| **SS-RUN-07** | 🔴 | `MG` · K-SS12 | **Migrace-parita (oblast 10) NEEXISTUJE.** Žádný spec staví matrix svět přes importery + diff vs service-build. Migrace = #1 zdroj orphanů (K-DI4). | glob |
| **SS-RUN-08** | 🔴 | `PB` · oblast 11 | **Parametrický režim NEEXISTUJE.** Matice {systém}×{access}×{persona} netestována. | glob |
| **SS-RUN-01** | 🟠 | `SE`/`INV` · K-SS2 | **`playerCount == count(Hrac)` NETVRZENO** v páteři. Emit/údržba existuje (`worlds.service` approve/role), ale spec nemá `expectCounterMatches`. DI-05 counter-drift by prošel. | grep `playerCount` v spec = 0 |
| **SS-RUN-02** | 🟠 | `SE` · K-SS6 | **Auto soukromá konverzace (6.7) NETVRZENA** po assign-character. Flow robustní (viz refutace výše), ale spec neověří, že `chatchannels.linkedMemberUserId=hrac` vznikl. Pozn.: listener je `@OnEvent` async → případné tvrzení musí pollovat/awaitovat. | grep |
| **SS-RUN-05** | 🟠 | `RT` | **RT (broadcast) NETVRZENA** v žádném seed-scenario spec (žádný `socket.io-client` listener). Tiché selhání broadcastu po approve/message/token by prošlo. | grep |
| **SS-RUN-06** | 🟠 | `OB` · K-SS13 | **OB (tichý ValidationPipe drop + error-log hook) CHYBÍ.** Žádné „pošli `__bogus` → assert v DB není", žádný logger spy. | grep |
| **SS-RUN-09** | 🟡 | `IN`/`IS` | IS spec ověřuje leak jen na **API vrstvě**; chybí **DB-introspekce** (0 dokumentů světa A s `worldId` světa B). API-level je pro většinu dostačující. | čtení `-isolation` spec |

---

## Dosažená L vs. cílová (Maximum)

| Oblast | Cíl | HEAD |
|---|---|---|
| Harness/builder (00) | L4 | ✅ L4 infra (replSet, `connection`, deterministický suffix) |
| Páteř 01-07 (smoke L2) | L4 | ✅ **L2 zelená** (dle proof/schemafix boot funguje) |
| Mřížka SE/AC (L3) | L4 | L3 částečná — SE úzká (K-SS2/K-SS4/K-SS6 chybí/dílčí), AC 3 testy ✅ |
| Mřížka IN (L4) | L4 | **L3-** — orphan check jen 4 kolekce (SS-R11-01) |
| Gauntlet IS | L4 | ✅ L3 (spec zelená + kontrolní strana); DB-introspekce chybí (SS-RUN-09) |
| Gauntlet RC | L4 | L3 mimo tento sweep (`test/race/` sada) |
| Gauntlet FA | L4 | **L0** (SS-RUN-03) |
| Oblast 09 CL/RB/TM | L4 | **L0** (SS-RUN-04) |
| MG / PB | L4 | **L0** (SS-RUN-07/08) |
| RT / OB | L4/průřez | **L0** (SS-RUN-05/06) |
| L5-infra / L5-teeth | L5 | **L0** |

---

## Mapování K-SSx (stav na HEAD)

| K-SSx | Záv. | Stav |
|---|---|---|
| K-SS1 | 🔴 | ⬜ FA chybí (SS-RUN-03) |
| K-SS2 | 🟠 | ⬜ playerCount netvrzen (SS-RUN-01) |
| K-SS3 | 🔴 | ⬜ FA chybí (SS-RUN-03) |
| K-SS4 | 🟠 | ⚠️ **jen deník**, 4/5 subdoců netvrzeno (SS-R11-02) |
| K-SS5 | 🔴 | ⬜ oblast 09 chybí (SS-RUN-04) |
| K-SS6 | 🟠 | ⬜ SE netvrzeno; ordering-bug **vyvrácen** |
| K-SS7 | 🟠 | ⬜ oblast 09 chybí (SS-RUN-04) |
| K-SS8 | 🔴 | ⬜ oblast 09 chybí; navíc orphan check úzký (SS-R11-01) |
| K-SS9 | 🔴 | ✅ částečně (3 AC testy + IS spec) |
| K-SS10 | 🟠 | ✅ `test/race/` (mimo sweep) |
| K-SS11 | 🔴 | ✅ **izolace spec zelená** |
| K-SS12 | 🔴 | ⬜ MG chybí (SS-RUN-07) |
| K-SS13 | 🟠 | ⬜ OB chybí (SS-RUN-06) |
| K-SS14 | 🟡 | ⬜ TM chybí (SS-RUN-04) |

---

## PROOF-REQUEST (pro proof-vrstvu)

- **PR-01** (nutné minimum, mělo by projít): `npm run test:e2e -- --testPathPattern "seed-scenario.e2e-spec" --forceExit`
  a `… "seed-scenario-isolation.e2e-spec" --forceExit`. Prokáže L2 páteř + IS zelené (replSet, SS-01 baseline 0).
- **PR-03/04/05/06** (nelze spustit — spec neexistuje): FA / oblast 09 mazání / MG / PB vyžadují impl.

## Závěr

Boot-seed vrstva je **zdravá** (SS-01 fix + sourozenec gated, žádný nový orphan-seeder, žádná AC/izolace
regrese → **0× 🔓**). Páteř + IS jsou reálně zelené. Skutečná díra je **hloubka**: „create → … → **smaž** →
0 orphanů" (osa CL/RB, oblast 09) je stále **e2e neprokázaná**, IN orphan mřížka je úzká (4 kolekce), a
SE tvrzení (playerCount/CARD-5/auto-konverzace) jsou dílčí. FA/MG/PB/RT/OB = L0.
