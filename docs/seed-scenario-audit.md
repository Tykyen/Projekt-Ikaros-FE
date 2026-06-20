# Seed scenario audit — registr nálezů (projde aplikace celý lifecycle?)

> Centrální registr nálezů z [`seed-scenario-plan/`](seed-scenario-plan/README.md). ID `SS-xx`.
> Devátý sourozenec [`bug-audit.md`](bug-audit.md), [`ws-audit.md`](ws-audit.md), [`role-audit.md`](role-audit.md),
> [`form-schema-audit.md`](form-schema-audit.md), [`cache-audit.md`](cache-audit.md),
> [`state-consistency-audit.md`](state-consistency-audit.md), [`cascade-delete-audit.md`](cascade-delete-audit.md)
> a [`db-integrity-audit.md`](db-integrity-audit.md).
>
> **Jediný spustitelný audit:** jeden lineární průchod aplikací (uživatel → svět → člen → stránka →
> postava → chat → mapa → oprávnění → mazání) s hloubkovou mřížkou 13 os u každého uzlu. Integrační zámek
> — prokazuje, že díly **skládají dohromady**, ne jen čtou izolovaně.
>
> **Stav: 2026-06-13 — páteř POSTAVENA a ZELENÁ (15/15, L2+L3).** Harness upgradnut (replica set), seed-builder
> + spec běží. První běh vynořil **SS-01** (boot rulebook orphan). Zbývá gauntlet (FA/RC/IS), L5, MG/PB.
> README + cross-cutting (00) + seed-scenario tool hotové; 14 seed kandidátů `K-SSx`. ⚠️ Pre-existující rot:
> 7 selektivně-modulových e2e sad padá na chybějícím REDIS provideru ([`dluhy.md`](dluhy.md) D-NEW-e2e-redis). Běh čeká
> na **harness upgrade** (replica set) jako 1. krok.

---

## TL;DR (2026-06-13)

> Plán [`seed-scenario-plan/`](seed-scenario-plan/README.md) — **13 os** (7 jádrových `EX SE AC IN RT ID
> CL` + 6 hloubkových `FA RC IS RB OB TM`), 6 perspektiv, 12 oblastí (10 lifecycle + migrace-parita +
> parametrika). Páteř = jedna zápletka, mřížka = tvrzení u každého uzlu. **Jako jediný z 9 auditů
> spustitelný → vyrábí zelený/červený signál.**
>
> ⚠️ **Bloker před během:** harness používá standalone `MongoMemoryServer` → transakce neběží → `FA`/`RC`
> nejdou na L4, dokud se [`db.ts`](../Projekt-ikaros/backend/test/helpers/db.ts#L11) nepřepne na
> `MongoMemoryReplSet`. To je krok #1.
>
> 🧪 **Prior art (nestavět od nuly):** [`backend-smoke-test.ts`](../Projekt-ikaros/scripts/backend-smoke-test.ts)
> (HTTP black-box) + [`worlds-join.e2e-spec.ts`](../Projekt-ikaros/backend/test/worlds-join.e2e-spec.ts)
> (in-process) — tenhle audit **dotáhne lifecycle** (chat/mapa/mazání), **přidá mřížku** (DB-introspekce
> po každém kroku) a **gauntlet** (fault/race/izolace).

### Seed kandidáti (hypotézy z předchozích auditů na kritické cestě)

| ID | Záv. | Osa | Uzel | Podstata | Dědí | Stav |
|---|---|---|---|---|---|---|
| **K-SS1** | 🔴 | `FA`/`SE` | 02 svět | kaskáda `world→…→calendar` bez tx → vynuť pád, assert úplný-nebo-čistý | DI-04 | ⬜ |
| **K-SS3** | 🔴 | `FA` | 04 stránka | persona page tvoří Character před page save → pád → 0 orphanů | DI-04 | ⬜ |
| **K-SS5** | 🔴 | `CL`/`RR` | 07/09 mapa | smaž scénu → `membership.currentSceneId` musí být vyčištěno | CD-04 | ⬜ |
| **K-SS8** | 🔴 | `CL` | 09 mazání | hard-delete světa → 0 orphanů/dangling napříč ~40 kolekcí | cascade | ⬜ |
| **K-SS9** | 🔴 | `AC` | 08 opráv. | Hrac 403 na obsah/approve/delete; R-20 admin cizího světa | role/R-20 | ⬜ |
| **K-SS11** | 🔴 | `IS` | 08 izolace | 2 světy → 0 cross-leak obsahu/chatu/mapy/členů | leak-safe | ⬜ |
| **K-SS12** | 🔴 | `MG` | 10 migrace | svět přes importery projde stejnou mřížku + diff vs service-build | DI-04/K-DI4 | ⬜ |
| **K-SS2** | 🟠 | `SE`/`INV` | 03 člen | approve→Hrac zvedne `playerCount +1` (== real count) | DI-05 | ⬜ |
| **K-SS4** | 🟠 | `SE`/`CARD` | 05 postava | subdocy diary/finance/inventory/notes/accounts přesně 1× | K-DI11 | ⬜ |
| **K-SS6** | 🟠 | `SE` | 03/06 | přiřazení postavy → auto soukromá konverzace v kanálu Postavy | chat 6.7 | ⬜ |
| **K-SS7** | 🟠 | `RB` | 09 mazání | soft-delete recovery-safe → restore → PLNĚ intaktní | world soft-delete | ⬜ |
| **K-SS10** | 🟠 | `RC`/`ID` | 03/05 | double-join/approve/create slug → unique index drží, žádný dup | K-DI11-IDX | ⬜ |
| **K-SS13** | 🟠 | `OB` | průřez | tichý ValidationPipe drop detekce + žádný error-log v happy kroku | whitelist | ⬜ |
| **K-SS14** | 🟡 | `TM` | 09 mazání | fast-forward 30d → world hard-delete cron fires + idempotentní | SH cascade | ⬜ |

> 💡 **Pointa:** každý K-SSx je nález **jiného auditu, který tenhle prokáže (nebo vyvrátí) ZA BĚHU v
> kompozici** — DI-04/05, CD-04, K-DI11 ap. zatím existují jen jako statické čtení (L2). Seed scénář je
> povýší na L4 (reálně vznikl správný stav / reálně 0 orphanů), nebo odhalí, že fix v kompozici neplatí.

---

## Nálezy (`SS-xx`)

> Sweep zahájen 2026-06-13. Harness upgradnut (replica set), seed-builder + páteř postaveny, **scénář
> běží 15/15 zeleně** (L2 smoke + L3 side-effecty/CARD/IN-delta + AC negativní). První běh rovnou vynořil
> SS-01 (boot orphan). Formát: **uzel / osa / reprodukce / vratné?**; sdílené cross-ref (M2).

### SS-01 🟡 `OR` (boot seed) — rulebook stránky osiří, když matrix svět nevznikne — ✅ OPRAVENO

- **Vynořeno:** prvním během seed scénáře — na čerstvé DB **12 orphan `pages`** s `worldId =
  MATRIX_WORLD_ID` (`6d6174726978000000000001` = ASCII „matrix"), ale **žádný matrix svět** v `worlds`.
- **Kořen (2 boot seedery, nekonzistentní guard):**
  - [`matrix-world.seed.ts:50-56`](../Projekt-ikaros/backend/src/database/seed/matrix-world.seed.ts#L50) — `MatrixWorldSeed.onApplicationBootstrap` **přeskočí** vytvoření světa, když není Superadmin (`if (!superadmin) return`).
  - [`rulebook-matrix-seed.ts:19-22`](../Projekt-ikaros/backend/src/modules/pages/rulebook/rulebook-matrix-seed.ts#L19) — `RulebookMatrixSeed.onApplicationBootstrap` zavolá `seedRulebook(MATRIX_WORLD_ID)` **bezpodmínečně**.
  - [`pages-world-seed.listener.ts:105-118`](../Projekt-ikaros/backend/src/modules/pages/pages-world-seed.listener.ts#L105) — `seedRulebook` kontroluje jen idempotenci (`existsBySlugAndWorld`), **ne existenci světa** → stránky vzniknou i bez něj.
- **Dopad:** `OR` orphan — rulebook stránky (`RULEBOOK_SEED_PAGES`, 12 ks) bez rodičovského světa. **Kde se projeví:** broken resolve matrix rulebooku, dokud svět nevznikne.
- **Vratné? / prod riziko:** 🟡 **transientní + self-heal.** V prod existuje Superadmin ([project_tyky_superadmin]) → matrix svět vznikne → orphan nenastane. Reálné okno jen když app **bootuje dřív než seed Superadmina** (čerstvý deploy); po doplnění Superadmina + restart se svět vytvoří a `seedRulebook` idempotentně stránky „adoptuje". Přesah s [db-integrity](db-integrity-audit.md) `OR` (integrity-scan to chytí staticky).
- **Návrh (gated, čeká souhlas):** `RulebookMatrixSeed` ověřit existenci matrix světa před seedem (early-return jako world seed), nebo svázat oba seedery (rulebook až po úspěšném world seedu). Eliminuje orphan okno deterministicky.
- **Test:** zachyceno jako **boot baseline** v [`seed-scenario.e2e-spec.ts`](../Projekt-ikaros/backend/test/seed-scenario.e2e-spec.ts).
- **✅ OPRAVENO 2026-06-13:** [`rulebook-matrix-seed.ts:30-45`](../Projekt-ikaros/backend/src/modules/pages/rulebook/rulebook-matrix-seed.ts#L30) — inject `IWorldsRepository`, před `seedRulebook` ověří `findById(MATRIX_WORLD_ID)`; když svět není, seed přeskočí (log warn) → **nikdy stránky bez rodičovského světa**. Regresní test v spec (`SS-01 regrese: boot nezanechal žádný orphan`) → baseline orphanů = 0. Ověřeno: seed-scenario **16/16**, typecheck 0, lint čistý.

---

## Zbývá

- **Harness upgrade (krok #1)** — [`db.ts`](../Projekt-ikaros/backend/test/helpers/db.ts) → `MongoMemoryReplSet` (odblokuje `FA`/`RC`); devDeps `socket.io-client` + Stryker.
- **Seed-builder** — kanonický deterministický svět (oblast 00, sekce B).
- **Páteř L2** — happy-path 01→09 zeleně (smoke).
- **Mřížka L3→L4** — per-uzel `SE`/`AC`/`IN` + DB-introspekce; cleanup verify (0 orphanů).
- **Gauntlet** — `FA`/`RC`/`IS` (oblast 00 D/E/F).
- **L5** — `M-INFRA` (reálný Cloudinary/Meili blob) + `M-MUT` (Stryker).
- **`MG`/`PB`** — migrace-parita (svět matrix) + parametrická matice.
- **Oblasti 01–11** — psát při sweepu (NEzastavovat, [project_15_test_styles]).

---

## Legenda

- 🔴 kritická · 🟠 střední · 🟡 nízká · ⚪ kosmetika · ⚖️ by-design / přijatý dluh
- 🐛 potvrzeno · ✅ opraveno/vyvráceno · ⬜ k ověření · `K-SSx` seed kandidát (hypotéza)
- **Úrovně:** L2 smoke (průchod) · L3 side-effect+negativ · L4 DB-introspekce+cleanup · L5-infra (blob) · L5-teeth (mutation)

---

## Plný audit RUN 2026-06-20 (FE 2a6c8e1c / BE 9cf98be)

- **SS-RUN-01 ♻️ regrese 🟠 ✅ OPRAVENO** — 14.7 world-export (`import { ZipArchive } from 'archiver'`, archiver v8 `type:module`) rozbil **celou BE e2e sadu** (21/21 fail): `app.module` načítá world-export.module → ts-jest (`allowJs:false`, `module:nodenext`) ESM netranspiluje → `Cannot use import statement outside a module`. **Prod NEohrožen** (reálný Node `require('archiver')` funguje, ověřeno). Fix (test-only): `test/mocks/archiver.stub.ts` + `moduleNameMapper ^archiver$` v `jest-e2e.json`. Pojistka G≥2: e2e sada sama (21/21 zelená po fixu). Páteř + SE/IN/AC opět ověřeno.
