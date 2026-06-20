# form-schema / 08-maps — checkpoint RUN-2026-06-20-1621

## Pokrytí

Přečteno a porovnáno proti HEAD kódu:
- BE DTO: `create-map.dto.ts`, `create-map-template.dto.ts`, `dto/operations/` (všechny: `token-ops.dto.ts`, `scene-ops.dto.ts`, `fog-ops.dto.ts`, `combat-ops.dto.ts`, `effect-ops.dto.ts`, `dice-ops.dto.ts`, `npc-template-ops.dto.ts`, `sound-ops.dto.ts`, `base.ts`)
- BE schema: `map-scene.schema.ts`
- BE interface: `map-scene.interface.ts`, `map-template.interface.ts`
- BE repository: `maps.repository.ts` (`toEntity`/`toToken`/`toSceneNpc`/`toPlayerState` whitelist mapper)
- BE service: `map-operations.service.ts` (applyAtomic), `operation-payload-validator.service.ts`
- BE controller: `maps.controller.ts`, `map-templates.controller.ts`
- BE main: `main.ts` (ValidationPipe options)
- FE types: `tactical-map/types.ts` (MapToken, MapScene, HexConfig, MapDiceRoll, MapOperation discriminated union)
- FE forms/mutations: `MapEmptyState.tsx`, `MapLibraryModal.tsx`, `LoadPreparationDialog.tsx`, `EditSceneModal.tsx`
- FE API: `mapApi.ts`

## Dosažená L vs cílová L

- Token mapper (WL/P1): **L2** — statická shoda ověřena čtením; 3 historické drift fixy (`notes`, `isLocked`, `systemStats`) přítomny a drží.
- HexConfigDto (TY/DF): **L2** — `@IsNumber()` nyní přítomno na `size/originX/originY` (oprava F-21 ověřena).
- Fog ops (RN): **L2** — `HexCoordDto` s `@IsInt @Min/@Max` sdílí `FogSetOpDto` i `FogBrushOpDto` (oprava F-22 ověřena, viz `base.ts` komentář).
- DiceRollPayloadDto vs MapDiceRoll: **L2** — pole i enumy shodné (FE `DiceRollerKind`/`DiceRollCategory` = BE `@IsIn`).
- `showHpPc/Npc/Bestie` round-trip (MP-D3): **NEW FINDING** — stav se změnil aktivací `forbidNonWhitelisted:true` (F-RUN-01). Viz F-RUN-MP-01 níže.
- MapTemplate flow (WL/RN): **L2** — save template OK; load template → POST /maps 400 (viz F-RUN-MP-01).
- Cílová L oblasti: L2+. Dosaženo pro 99 % povrchu. F-RUN-MP-01 je reálný 400 v production flow.

## Nálezy

### F-RUN-MP-01 — `WL`/`TY` `HexConfigDto` chybí `showHpPc/Npc/Bestie` → 400 při load šablony s HP-toggled configem 🆕

- **Pole / entita:** `showHpPc`, `showHpNpc`, `showHpBestie` v `CreateMapDto.config` → nested `HexConfigDto`
- **FE:** `MapLibraryModal.tsx:96` pošle `config: template.config` kde `template.config: HexConfig` může obsahovat `showHpPc/Npc/Bestie` (FE `HexConfig` ty má od 10.2g, `EditSceneModal.tsx:49-51`); stejná situace u `map-templates.controller.ts PUT` při re-save.
- **BE DTO:** `create-map.dto.ts:32-35` — `@ValidateNested() @Type(() => HexConfigDto)` + `HexConfigDto:19-24` má jen `size/originX/originY/showGrid` — `showHpPc/Npc/Bestie` **nejsou dekorována**.
- **Global pipe:** `main.ts:54-55` `whitelist:true, forbidNonWhitelisted:true` → extra pole na nested DTO = **400** (potvrzeno F-RUN-01 z 2026-06-20).
- **Ops path OK:** `scene.config` op prochází `SceneConfigOpDto` (`@IsObject()`) + op-validator `whitelist:false` → HP fieldy projdou → mapper vrací raw `doc.config as HexConfig` → round-trip drží. Pouze `POST /maps` je broken.
- **Dopad:** PJ nastaví HP-toggle v `EditSceneModal` → uloží jako šablonu (save OK: `POST /map-templates` má `@IsObject() config` bez nested whitelist) → pokusí se načíst šablonu do nové scény (`MapLibraryModal` load) → **400 VALIDATION_ERROR**. Reálný production bug (skrytý, objeví se jen pokud PJ někdy přepne HP toggle + uloží + načte).
- **Dopad na existující data:** žádný (chyba requestu, nic se neuloží).
- **Návrh:** Přidat `@IsOptional() @IsBoolean() showHpPc?: boolean; @IsOptional() @IsBoolean() showHpNpc?: boolean; @IsOptional() @IsBoolean() showHpBestie?: boolean;` do `HexConfigDto` (`create-map.dto.ts`). 1 řádek na pole, nulový dopad na existující data.
- **Soubory:** `backend/src/modules/maps/dto/create-map.dto.ts:18-24` (HexConfigDto) · `src/features/world/tactical-map/components/pj-panel/MapLibraryModal.tsx:92-106` (POST /maps s template.config)
- **Závažnost:** 🟠 (400 na reálném PJ workflow; ale latentní — jen pokud HP toggle byl změněn a šablona uložena)
- **L2** 🆕

---

### Ověření starých nálezů (z sweep 2026-06-05)

| Nález | Status dle HEAD |
|---|---|
| **F-21** `config.size/originX/originY` bez `@IsNumber` | ✅ **OPRAVENO** — `create-map.dto.ts:20-22` má `@IsNumber()` |
| **F-22** `q/r` nekonzistence range | ✅ **OPRAVENO** — `base.ts:11-14` sdílí `HexCoordDto @IsInt @Min/@Max`, komentář odkazuje F-22 |
| **MP-D3** `showHp*` chybí v HexConfigDto | ♻️ **ZHORŠENO** → F-RUN-MP-01 (bylo ⚠️ by-design, teď 🟠 s `forbidNonWhitelisted:true`) |
| Token mapper drift fixy (`notes`/`isLocked`/`systemStats`) | ✅ **DRŽÍ** — `maps.repository.ts:188,194,199` |
| `EffectPayloadDto` whitelist fixy (`hexes/color/rings...`) | ✅ **PŘÍTOMNO** — `effect-ops.dto.ts:29-36` explicitní `@IsOptional` dekorátory |
| DiceRollPayloadDto vs MapDiceRoll | ✅ **SHODNÉ** |
| `sound.playlist` FE `soundIds` → BE `soundIds` → DB `activeSoundIds` | ✅ **OK** (service.ts:927 mapuje explicitně) |
| `MapTemplate` + PC token filter (defense in depth) | ✅ **OK** (`map-templates.controller.ts:41-48, 116`) |
| `CreateMapDto.worldId @IsOptional` vs DB `required:true` | ⚖️ **by-design**, FE vždy posílá, 500 ne tichá ztráta |
| `toSceneNpc` whitelist vs `MapSceneNpc` interface | ✅ **SHODNÉ** — všechna pole pokryta |

## PROOF-REQUEST

Jeden potenciální live-test bod (neproveden — není live infra):

**PR-MP-01:** Red-team `POST /maps` s `{ worldId, name:"test", config: { size:40, originX:0, originY:0, showGrid:true, showHpBestie:false } }` → očekávaný výsledek: **400 VALIDATION_ERROR** (potvrdí F-RUN-MP-01). Postman/cURL na živém serveru.
