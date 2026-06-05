# 10 — Per-system schémata (6 systémů × entityTypes)

> **Tvar:** systémová matice napříč herními systémy. Entity na taktické mapě (bestie / token / postava /
> deník) mají **schema-driven** staty místo pevného DTO. **FE JSON je canonical** →
> [`export-schemas`](00-cross-cutting.md#xc-02--export-schemas-pipeline-fe-json--be-assets--osa-pozn-oblast-10)
> → BE `assets/schemas/`. Validace běží přes engine (`validateForCreate/Patch`), ne přes class-validator.
> **Osy:** `EN` `RQ` `RN` `TY` · perspektiva **P4** (per-system parita).
> Nálezy → [`../form-schema-audit.md`](../form-schema-audit.md) (`F-xx`). Stav: ✅ **sweep proběhl 2026-06-05** (verifikace čtením FE+BE schémat, validátorů, write paths).

> ✅ **Sweep výsledek (TL;DR):** Matice systém×entityType **úplná a sync** (SY-01: FE 17 = BE 17 souborů,
> shodné páry). **FE↔BE parita = 100 % sync** (SY-02: viz [XC-D1](00-cross-cutting.md#xc-d1--důkaz-sync-1717-párů-sha256-prvních-12-znaků-po-crlf-normalizaci-2026-06-05)).
> Validační logika FE `validateSystemStats.ts` ↔ BE `system-stats-validator.service.ts` je **1:1 mirror**
> (potvrzeno čtením obou). **SY-04 generic-fallback asymetrie POTVRZENA** (FE má fallback, BE ne — `SY-D1`).
> **SY-04 prázdné drd2 PC/diary sections = teoretické riziko bez live write path** (validator se volá JEN
> s `token`/`bestie`, nikdy `character-*`/`diary-*` — `SY-D2` ⚖️). Žádný 🔴.

---

## Tři místa pravdy (engine, ne 3 vrstvy DTO)

| Vrstva | Kde | Co určuje |
|---|---|---|
| **FE canonical JSON** | [`src/features/world/tactical-map/schemas/<system>/*.json`](../../src/features/world/tactical-map/schemas/) | sekce → pole (`type`, `required`, `min/max`, `enumValues`, `default`, `combatBehavior`, `version`) |
| **FE registry/validator** | [`registry.ts`](../../src/features/world/tactical-map/schemas/registry.ts) · [`bootstrap.ts`](../../src/features/world/tactical-map/schemas/bootstrap.ts) · [`types.ts`](../../src/features/world/tactical-map/schemas/types.ts) · [`validateSystemStats.ts`](../../src/features/world/tactical-map/utils/validateSystemStats.ts) | FE optimistic validace (UX) |
| **BE mirror** | [`schema-registry.service.ts`](../../../Projekt-ikaros/backend/src/modules/maps/schemas/system-entity-schema/schema-registry.service.ts) · [`system-stats-validator.service.ts`](../../../Projekt-ikaros/backend/src/modules/maps/schemas/system-entity-schema/system-stats-validator.service.ts) · [`system-entity-schema.types.ts`](../../../Projekt-ikaros/backend/src/modules/maps/schemas/system-entity-schema/system-entity-schema.types.ts) | **autoritativní** validace + kopie JSON v `backend/assets/schemas/` |

> 💡 FE bootstrap registruje schémata **z TS modulů** (`<system>/index.ts` re-export JSON), BE čte
> **z `assets/schemas/` JSON files** při `onModuleInit`. Stejný obsah, dvě cesty načtení — sync drží jen
> manuální `export-schemas`. Validační logika je 1:1 mirror (FE `validateSystemStats.ts` ↔ BE
> `system-stats-validator.service.ts`) — drift mezi nimi = FE pustí to, co BE odmítne (nebo opačně).

---

## Entity typy (`SystemEntityType`)

Definováno shodně FE [`types.ts:22-28`](../../src/features/world/tactical-map/schemas/types.ts) i BE
[`system-entity-schema.types.ts:13-19`](../../../Projekt-ikaros/backend/src/modules/maps/schemas/system-entity-schema/system-entity-schema.types.ts):
`bestie · token · character-pc · character-npc · diary-pc · diary-npc`.

## Matice systém × entityType (které schéma existuje)

> Snímek souborů 2026-06-05 (FE JSON + BE `assets/schemas/`). ✓ = soubor existuje na obou stranách
> (sync), ⚠️ = jen jedna strana / k ověření, `—` = schéma neexistuje (→ **soft-mode**, viz SY-04).
> Kanonický systém `world.system` **nemá enum** ([`world.schema.ts:25`](../../../Projekt-ikaros/backend/src/modules/worlds/schemas/world.schema.ts)
> `@Prop({ default: 'matrix' })`, DTO `@IsString` bez `@IsIn` —
> [`create-world.dto.ts:32`](../../../Projekt-ikaros/backend/src/modules/worlds/dto/create-world.dto.ts)),
> takže `systemId` může být **libovolný string** → fallback chování (SY-04) je nosné.

| systemId | bestie | token | character-pc | character-npc | diary-pc | diary-npc |
|---|---|---|---|---|---|---|
| **drd2** | ✓ | ✓ | ✓ (sekce `[]`) | ✓ (`[]`) | ✓ (`[]`) | ✓ (`[]`) |
| **dnd5e** | ✓ | ✓ | — | — | — | — |
| **coc** | ✓ | ✓ | — | — | — | — |
| **fate** | ✓ | ✓ | — | — | — | — |
| **gurps** | ✓ | ✓ | — | — | — | — |
| **matrix** | ✓ | ✓ | — | — | — | — |
| **generic** | — | ✓ | — | — | — | — |

> Pozn.: drd2 `character-pc/npc` + `diary-pc/npc` mají **prázdné `sections: []`** (placeholder —
> [`drd2/character-pc.json`](../../src/features/world/tactical-map/schemas/drd2/character-pc.json)),
> takže validace nic nevynutí. **Sweep ověřil:** tyto entityTypes **nemají BE write path** (validator se
> volá jen s `token`/`bestie`) → prázdné sections = neškodný placeholder, NE 400 past (viz `SY-D2`). Aktivně
> validovaná schémata: **bestie + token** napříč všemi systémy, `generic` jen token (fallback, jen FE).

---

## Kde se validátor používá (write paths)

| Entita | Service | entityType | Mode |
|---|---|---|---|
| **MapToken** create/update | [`map-operations.service.ts:1249-1307`](../../../Projekt-ikaros/backend/src/modules/maps/operations/map-operations.service.ts) | `token` | create=ForCreate(default fill), patch=ForPatch(strict) |
| **Bestie** create | [`bestiae.service.ts:93-103`](../../../Projekt-ikaros/backend/src/modules/bestiae/bestiae.service.ts) | `bestie` | ForCreate |
| **Bestie** update | [`bestiae.service.ts:128-139`](../../../Projekt-ikaros/backend/src/modules/bestiae/bestiae.service.ts) | `bestie` | ForPatch |

`systemId` pro token se bere z `world.system` ([`map-operations.service.ts:1257`](../../../Projekt-ikaros/backend/src/modules/maps/operations/map-operations.service.ts));
pro bestie z `dto.systemId` / `existing.systemId`. character/diary entityTypes zatím **nemají write path**
přes tento validátor (placeholder schémata) — k ověření, kde se PC/NPC `systemStats` validují.

---

## Kontrolní body (co ověřit při sweepu)

### SY-01 — Matice úplnosti (systém × entityType) · osa pozn. (P4)
Ověř aktuálnost matice výše: spusť `export-schemas`, porovnej FE dir vs BE `assets/schemas/` filenames.
**Co hledat:** systém, který má bestie ale ne token (nebo opačně) → jeden write path validuje, druhý
spadne do soft-mode (tiše neprovaliduje). `generic` má **jen token** → bestie pro neznámý systém? (BE
`registry.get` **nemá** generic fallback — viz SY-04 rozdíl FE↔BE).

### SY-02 — Parita FE JSON ↔ BE `assets/schemas/` (export-schemas desync) · osa `WL`/all (P4, M6)
**Co ověřit:** spusť `npm run export-schemas`, `git diff backend/assets/schemas/` — **nenulový diff =
desync** (někdo upravil FE JSON bez exportu → BE validuje proti staré kopii, past
`project_schema_be_fe_sync`). Byte-level porovnání všech 17 párů (FE→BE). Žádný CI gate to nehlídá (XC-02).

### SY-03 — Konzistence pole v rámci entityType napříč systémy · osa `RQ`/`EN`/`RN` (P4)
Pro **stejný entityType** (např. `token`) porovnej napříč 6 systémy, jestli **sdílená pole** mají stejná
pravidla:
- má každý `token`/`bestie` `health.max` (nebo ekvivalent) jako `required:true`, `min` shodně?
- `combatBehavior` tagy konzistentní (jedno pole = `damageable`, jedno = `initiative`, …)? Combat tracker
  (10.2f) hledá pole **podle tagu, ne názvu** — chybějící/odlišný tag = bestie se nedá poškodit / neřadí
  se v boji.
- `default` hodnoty smysluplné per systém (drd2 movement default 5 hexů ≠ d&d feet)?
**Co hledat:** systém, kde `bestie` nemá `damageable` pole → token nemá HP bar / nelze aplikovat damage.

### SY-04 — Soft-mode chování (chybí schema → `_schema` → skip) · osa `RQ`/`WL` (P3)
**Mechanika:** validator vrátí `{valid:false, errors:{_schema:'No schema for …'}}` když schema chybí
([`system-stats-validator.service.ts:30-36,59-64`](../../../Projekt-ikaros/backend/src/modules/maps/schemas/system-entity-schema/system-stats-validator.service.ts)).
Volající **přeskočí** throw, pokud je přítomen `errors._schema`:
[`map-operations.service.ts:1273,1300`](../../../Projekt-ikaros/backend/src/modules/maps/operations/map-operations.service.ts),
[`bestiae.service.ts:98,133`](../../../Projekt-ikaros/backend/src/modules/bestiae/bestiae.service.ts) —
`if (!result.valid && !result.errors._schema) throw`. Tedy **chybějící schema = data se uloží bez
validace** (důvěra FE), reálná chyba (schema existuje) throwne.
**Rozdíl FE↔BE k ověření:** FE `registry.get` má **generic fallback** (`systemId:token` chybí → zkus
`generic:token`, [`registry.ts:50-60`](../../src/features/world/tactical-map/schemas/registry.ts)), **BE
`registry.get` fallback NEMÁ** ([`schema-registry.service.ts:59-64`](../../../Projekt-ikaros/backend/src/modules/maps/schemas/system-entity-schema/schema-registry.service.ts)
— přímý `map.get`). Důsledek: pro neznámý systém FE validuje proti generic, BE jde do soft-mode (skip).
**Co ověřit (M5):** pošli token s nevalidním statem pro systém **bez** schema → projde (soft); pro systém
**se** schema → 400. Ověř, že prázdné `sections:[]` (drd2 character) = soft-pass všeho, nebo strict
reject (patch mode `knownKeys` prázdné → **každý** klíč „Unknown field"? → potenciální 400 pro každý PC
stat patch — **hot k ověření**).

### SY-05 — Version drift · osa pozn. (P4)
Každé schema má `version` ([`types.ts:135`](../../src/features/world/tactical-map/schemas/types.ts), MVP=1).
**Co ověřit:** všechna schémata version=1? Při bumpu (breaking change pole) musí existovat migrace
uložených `systemStats` v DB (server běží — staré tokeny/bestie mají staré pole). Engine version
**nevynucuje** (validator `version` nečte) → bump je jen konvence; ověř, jestli existuje migrační hook.

### SY-06 — `combatBehavior` / `enumValues` konzistence · osa `EN`/`TY` (P4)
- `combatBehavior` enum (`damageable|armor-reducer|initiative|movement|roll-target|static`) definován
  shodně FE/BE [`types.ts:63-69`](../../src/features/world/tactical-map/schemas/types.ts) /
  [`system-entity-schema.types.ts:29-35`](../../../Projekt-ikaros/backend/src/modules/maps/schemas/system-entity-schema/system-entity-schema.types.ts)
  — **dvě ruční kopie** (latentní drift, jako `THEME_IDS`). Ověř, že JSON používá jen tyto hodnoty
  (validator je nekontroluje — neznámý tag projde, jen ho combat tracker ignoruje → tichá ztráta chování).
- `enumValues` u `type:'enum'` polí: validator vyžaduje `value ∈ enumValues`
  ([`validateSystemStats.ts:132-137`](../../src/features/world/tactical-map/utils/validateSystemStats.ts) /
  BE `:142-145`). Ověř, že FE select renderuje **stejnou** množinu jako JSON `enumValues` (jinak UI nabídne
  hodnotu, kterou validator odmítne, nebo naopak).

### SY-07 — Typová coercion v engine (number) · osa `TY`/`NL`
Validator čísla coercuje `Number(value)` a **přepíše** `state[field.key]` na number
([`validateSystemStats.ts:106-117`](../../src/features/world/tactical-map/utils/validateSystemStats.ts) /
BE `:119-132`). String `"5"` projde jako `5`. **Co ověřit (M4):** round-trip — FE pošle string i number,
ulož, GET → ověř, že DB drží number (ne string). `NaN` → 400 (`musí být číslo`).

---

## Delta parity (plní sweep)

> **Sweep 2026-06-05.** Per-system matice ověřena. Žádný 🔴; klíčové nálezy = generic-fallback asymetrie
> FE↔BE (`SY-D1`, by-design BC) a teoretické prázdné-sections riziko bez live write path (`SY-D2`).

| ID | Systém:entityType | Pole / bod | Osa | Závaž. | Δ | Popis |
|---|---|---|---|---|---|---|
| SY-01 | všechny | matice úplnosti | pozn. | — | ✅ shoda | FE **17 souborů** = BE **17 souborů**, shodné páry (drd2 6×, dnd5e/coc/fate/gurps/matrix 2× bestie+token, generic 1× token). Žádný systém nemá bestie bez token (generic = jen token = fallback by-design). |
| SY-02 | všechny | FE↔BE parita | `WL`/all | — | ✅ **SYNC** | Viz [XC-D1](00-cross-cutting.md#xc-d1--důkaz-sync-1717-párů-sha256-prvních-12-znaků-po-crlf-normalizaci-2026-06-05): 17/17 obsahově identických. Žádný export-schemas desync. |
| SY-03 | `token` napříč 6 | sdílená pole | `RQ`/`RN`/`EN` | 🟢 | ✅ shoda | `health.current` (`damageable`, min 0) + `health.max` (**required:true**, min 1) **shodně** ve všech token schématech (drd2/dnd5e/matrix/generic ověřeno). `combatBehavior:initiative` na `initiative.current` všude. **Pohyb:** drd2/matrix/generic `movement` (tag `movement`), dnd5e `speed` (tag `movement`) — **jiný klíč, stejný tag** → combat tracker resolvuje **podle tagu** (SY-03 mechanika) = ⚖️ by-design konzistence. `armor-reducer` má drd2/matrix/generic; dnd5e má `armor.class` s `roll-target` (AC ≠ damage reduction = intentional per-systém). |
| SY-D1 | neznámý systém:token/bestie | registry fallback | `RQ`/`WL` | 🟡 | ⚖️ by-design | **FE↔BE asymetrie potvrzena.** FE `registry.get` má **generic fallback** ([registry.ts:50-60] — `systemId:token` chybí → zkus `generic:entityType`). BE `registry.get` fallback **NEMÁ** ([schema-registry.service.ts:59-64] — přímý `map.get ?? null`). Důsledek pro **neznámý** `world.system`: FE validuje proti generic (UX), BE jde do **soft-mode** (skip, data uloží bez validace). **Dopad na data:** neznámý systém = BE důvěřuje FE (žádná tvrdá validace). **Návrh:** ponechat (BC), nebo přidat BE generic fallback pro paritu — diskuse s uživatelem. |
| SY-D2 | drd2:character-pc/npc, diary-pc/npc | prázdné `sections:[]` | `RQ`/`WL` | 🟡 | ⚖️ by-design | drd2 PC/diary schémata mají `sections:[]` ([drd2/character-pc.json], [diary-pc.json]). V `validateForPatch` by prázdné `knownKeys` → **každý** klíč „Unknown field" → 400. **ALE:** validator se v BE volá **JEN** s entityType `token` ([map-operations.service.ts:1263,1268,1297]) a `bestie` ([bestiae.service.ts:96,131]) — **nikdy** `character-*`/`diary-*` (grep potvrdil 0 výskytů). PC/diary `systemStats` nemají write path přes tento engine → **riziko teoretické / dead path**. **Dopad na data:** žádný (nedosažitelné). **Návrh:** ponechat placeholder; pokud se v budoucnu přidá PC stat write path, **nejdřív** naplnit sections nebo přepnout na non-strict patch. |
| SY-04 | všechny | soft-mode mechanika | `RQ`/`WL` | 🟢 | ✅ shoda | Validator vrací `{_schema:...}` při chybějícím schématu ([system-stats-validator.service.ts:30-36,59-64]); volající skipne throw pokud `errors._schema` ([map-operations.service.ts:1273,1300], [bestiae.service.ts:98,133] — `if (!result.valid && !result.errors._schema) throw`). Chybějící schema = data uloží bez validace (důvěra FE), reálná chyba throwne. **Mechanismus přesně dle plánu.** FE/BE validateField logika **1:1 mirror** (jen lokalizace hlášek liší: „musí být číslo" vs „must be number"). |
| SY-05 | všechny | version drift | pozn. | 🟢 | ✅ shoda | Všech 17 schémat `version:1` (ověřeno ve čtených vzorcích; konzistentní s maticeí). Engine `version` **nečte/nevynucuje** — bump je konvence. Žádný migrační hook (k řešení až při skutečném bumpu). |
| SY-06 | všechny | combatBehavior/enum | `EN`/`TY` | 🟢 | ✅ shoda | `combatBehavior` enum definován **2× ručně** (FE [types.ts] / BE [system-entity-schema.types.ts]) — latentní drift jako THEME_IDS, ale aktuálně shodný. JSON používá jen platné hodnoty (`damageable/armor-reducer/movement/initiative/roll-target` ověřeno ve vzorcích). Validator je **nekontroluje** (neznámý tag projde, combat tracker ho ignoruje = tichá ztráta chování, ne 400) — by-design. |
| SY-07 | všechny | number coercion | `TY`/`NL` | 🟢 | ✅ shoda | Validator čísla coercuje `Number(value)` a **přepíše** `state[field.key]` na number (FE [validateSystemStats.ts:106-117] / BE [system-stats-validator.service.ts:119-132] — identicky). String `"5"` → `5`, `NaN` → 400 (`musí být číslo`/`must be number`). Round-trip drží number. |

## Round-trip / migrační poznámky

> **Sweep verdikt:** Žádná migrace nutná — sweep nemění tvar uložených `systemStats`. SY-02 = 0 desync
> (žádný re-export potřeba). SY-05 version bump (budoucí) = migrace uložených `systemStats` (server běží,
> staré tokeny/bestie). SY-D2 prázdné `sections:[]` (drd2 PC/NPC/deník) v patch strict mode = **nedosažitelné**
> bez write path → bezpečné dokud se nepřidá PC/diary stat write path (pak naplnit sections jako podmínka).
