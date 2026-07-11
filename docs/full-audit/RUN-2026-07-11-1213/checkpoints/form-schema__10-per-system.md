# Checkpoint — form-schema / 10-per-system (RUN-2026-07-11-1213)

**Oblast:** `docs/form-schema-plan/10-per-system.md` · styl form-schema · prefix `F-` (registr `docs/form-schema-audit.md`)
**Režim:** READ-ONLY, statika L1–L2 (+ dopočet L3 z existující logiky)
**Sweep base:** area doc uzavřen 2026-06-05 (SY-01…SY-07, SY-D1/D2, žádný 🔴). Tento checkpoint = re-verifikace proti HEAD 2026-07-11.

## Verdikt
**2 nové nálezy** (🟠 + 🟡), obojí z feature **16.2g F2 „Vlastní Systém" — per-svět `entity_schema_versions`**, kterou sweep 2026-06-05 nepokrýval (feature je novější). Původní SY-* závěry drží, ale **SY-01 a SY-05 tabulky jsou STALE** (matice narostla, verze se bumply). L2.

---

## Nové nálezy

### 🟠 F-SY-N1 — Per-svět `token` schéma = asymetrická / mrtvá validační cesta + FE↔BE token schema divergence (custom systémy)
**Osa:** `WL`/`EN`/`RQ` · perspektiva P4 · klasifikace 🔓 (live-path divergence, třída SY-D2, ale teď dosažitelná)

- **DTO povoluje token schéma:** `create-entity-schema-version.dto.ts:10` `ENTITY_SCHEMA_TYPES = ['bestie','token']` + `:14` `@IsIn([...])`; controller `entity-schema-versions.controller.ts` bere `?entityType=bestie|token`. → per-svět **token** schéma lze uložit (`entity_schema_versions`, `entityType:'token'`).
- **FE ho čte:** `useEntitySchemaVersions.ts:114-133` `useResolvedEntitySchema` — pro custom (`vlastni`→`generic`, viz `systemId.ts:34`) `entityType==='token'` → `tokenQ.data ?? bestieQ.data` (world token verze, jinak fallback world **bestie** verze).
- **ALE dvě strany mimo:**
  1. **FE editor jen bestie** — `WorldEntitySchemaEditorPage.tsx:26,48,122` hardcode `entityType='bestie'`. Token verze se přes UI **nikdy nevytvoří** → `tokenQ` fakticky vždy null → FE edituje token proti world **bestie** schématu.
  2. **BE token write path per-svět schéma ignoruje** — `map-operations.service.ts:1355-1413` (`validateTokenStats` / `validateTokenStatsPatch`) volá JEN `statsValidator.validateForCreate/Patch(stats, systemId, 'token')` = statický `registry.get(systemId,'token')` (assets). `EntitySchemaVersionsService` do maps modulu **není injektován** (grep `getActiveSchema|EntitySchemaVersion` v `modules/maps` = 0). Kontrast: `bestiae.service.ts:66-85` `validateStats` per-svět bestie schéma **respektuje** (`entitySchemas.getActiveSchema(worldId,'bestie')` → `validateForCreateWithSchema`).
- **Důsledek (custom svět `world.system='vlastni'`):** FE plní token staty dle world **bestie** schématu, BE je validuje proti statickému `generic:token` (`generic/token.json:19-24` `health.max` `required:true`, min 1). Když PJ ve vlastním bestie schématu `health.max` přejmenuje/vyhodí → drop tokenu na mapu / patch → `validateForCreate/Patch(generic:token)` vyhodí `health.max is required` (create) nebo `Unknown field` (patch strict) → **400**. Když klíče shodou sedí → validace tiše aplikuje **jiné (generic) schéma**, ne záměr světa.
- **Dopad na existující data:** žádný (request kontrakt); jen custom světy s divergentním bestie schématem.
- **Návrh (k diskuzi, neopravovat tiše):** buď (a) token write path v `map-operations` napojit na `EntitySchemaVersionsService.getActiveSchema(worldId,'token')` s fallbackem na bestie (parita s FE resolverem), nebo (b) `entityType:'token'` z `ENTITY_SCHEMA_TYPES` odstranit (token = derivát bestie), aby DTO neslibovalo cestu, kterou write path neplní.

### 🟡 F-SY-N2 — Per-svět schéma `sections` bez shape-validace → malformované schéma shodí bestie writes (500)
**Osa:** `TY`/`WL` robustness · perspektiva P1 · klasifikace 🆕 (třída F-20)

- **DTO neověřuje tvar:** `create-entity-schema-version.dto.ts:22-25` `sections`: `@IsArray @ArrayMaxSize(30) @IsObject({each:true})` — **žádný** `@ValidateNested` do `SchemaSection`/`SchemaField`. Ukládá se jako Mixed (`entity-schema-version.schema.ts:21-25` `MixedArraySubSchema`). Komentář to přiznává („tvar drží FE").
- **Validator iteruje neochráněně:** `system-stats-validator.service.ts:68-69` `for (const section of schema.sections) for (const field of section.fields)` a `:87-89` stejně. Sekce bez pole `fields` (např. uložené `sections:[{}]`) → `TypeError: section.fields is not iterable`.
- **Důsledek:** malformované uložené per-svět bestie schéma → **500 na KAŽDÉM** následném world-scoped bestie create/patch v tom světě (`bestiae.service.ts:78-79` `validateForCreate/PatchWithSchema`), dokud se schéma nepřepíše. Nejen jeden payload — trvalý stav.
- **Gate:** PJ+ (`EntitySchemaVersionsService.create` → `worldsService.assertCanAdminWorld`) → self-inflicted, scoped na vlastní svět. Nízké, ale širší dopad než single-payload F-20.
- **Dopad na existující data:** žádný nový; latentní pro už uložená malformovaná schémata (žádné známé).
- **Návrh:** `@ValidateNested({each:true})` + `class` pro `SchemaSection` (min. `fields: SchemaField[]`), nebo defenzivní guard ve validatoru (`Array.isArray(section.fields)`).

---

## Refresh původních SY-* (doc drift, ne bug)

- **SY-01 STALE** — matice v area docu (17 souborů) neplatí. HEAD = **32 JSON** (FE) = **32** (BE assets). Nové systémy: `drd16, drdh, drdplus, fae, jad, pi, shadowrun` (7×) + `generic` získal `bestie`. drd2 stále 6 (bestie/token/character-pc/npc/diary-pc/npc). Žádný systém nemá bestie bez token. ✅ úplnost drží.
- **SY-02 ✅ RE-VERIFIED** — 32/32 párů obsahově identických (CRLF-normalizovaný sha256, můj běh). 0 desync, 0 orphan (žádný BE bez FE, žádný FE bez BE). export-schemas sync drží.
- **SY-05 STALE + riziko realizováno** — doc tvrdí „všech 17 version=1". HEAD: **version 1 (25×), 2 (6×), 3 (1×)** — bumpy proběhly. Engine `version` dál **nečte/nevynucuje**, migrační hook pro uložené `systemStats` u statických (assets) schémat **nenalezen**. Per-svět feature (`entity_schema_versions`) MÁ archive+verzování (`entity-schema-version.schema.ts:32-36`), ale statická registry ne. → SY-05 riziko (bump bez migrace uložených statů) je teď živé; k proklepnutí, zda některý bump udělal dřív-optional pole `required` / vyhodil pole (mimo L1-L2 rychlý pass).
- **SY-06 ✅ drží** — všechny `combatBehavior` napříč 32 JSON v enumu (`damageable/armor-reducer/initiative/movement/roll-target/static`), všechny field `type` platné (`boolean/computed/enum/list/number/string`). 7 nových systémů nezavedlo neplatný tag. Enum stále 2× ruční kopie FE `types.ts` / BE `system-entity-schema.types.ts` (latentní drift, dnes shodné).
- **SY-D1 / F-26 ✅ by-design drží** — FE `registry.ts:50-57` má generic fallback (`systemId!=='generic'` → zkus `generic:entityType`); BE `schema-registry.service.ts:59-63` přímý `map.get ?? null`, fallback nemá. (Pozn.: `generic` nově má i `bestie`, takže FE fallback pokrývá bestie i token.)
- **SY-D2 ✅ drží** — registry validator write paths pořád jen `token` (`map-operations.service.ts:1366,1371,1400`) a `bestie` (`bestiae.service.ts:83-84`). `character-*`/`diary-*` bez write path. drd2 prázdné `sections:[]` u character/diary → stále nedosažitelné.

---

## Metody / úroveň
- M1 statické čtení (DTO/schema/service/validator/FE resolver) — L2.
- M6 baseline: SY-02 parita 32/32 CRLF-sha256 (můj běh) — strukturální důkaz. `tsc`/testy nespouštěny (READ-ONLY, mimo scope tohoto agenta).
- F-SY-N1/N2 = L2 (rozpor dokázán čtením + trasou volání), povýšení na L4 by chtělo red-team payload (M5: custom svět s divergentním bestie schématem → token drop; malformed `sections:[{}]` → bestie create) — návrh pro proof vrstvu.

## Zápis do registru
Do `docs/form-schema-audit.md` navrhnout `F-29` (=F-SY-N1 🟠) a `F-30` (=F-SY-N2 🟡) — **neproveden** (READ-ONLY). Aktualizovat SY-01/SY-05 tabulky v area docu (STALE).
