# form-schema · 08-maps (mapa/scéna + tokeny)

> READ-ONLY hloubkový sweep oblasti `docs/form-schema-plan/08-maps.md` proti HEAD.
> Styl: form-schema (registr `docs/form-schema-audit.md`, prefix `F-`). Osy `WL` `TY` `RN` `NM`, P1+P4.
> Hloubka dosažena: **L2** (statické čtení všech 4 vrstev + apply path + authorizer; bez běhu testů).
> Poznámka zadání: styl 46 (`ext-46__game-integrity.md`) našel token `currentHp`/`initiative` bez clampu/bounds v DTO — ověřuji form-schema facetu.

## Verdikt

**Žádný nový 🔴 ani 🆕 form-schema rozpor.** Token mapper drží (3 historické drift fixy `notes`/`isLocked`/`systemStats` přítomny — [maps.repository.ts:195,201,206]). Sweep z 2026-06-05 stále platí pro `WL`/`NM`.

Nové oproti plánu: **1× ⭐ (chybná premisa v plánu MP-T08 + rozšíření F-22)** a **2× ♻️ (stale docs — dva nálezy plánu jsou mezitím opravené).**

---

## ⭐ Elevace — token numeric patch bez range/typu; MP-T08 „⚖️ by-design" premisa je nepravdivá

**Osa `RN`/`TY` · Sdílí kořen s F-22 + ext-46 🔴 · klasifikace ♻️ (broadening, ne nezávislý nový kontrakt).**

- **DTO:** `TokenUpdateOpDto.patch` = `@IsObject()` bez tvaru ([token-ops.dto.ts:53](../../../../Projekt-ikaros/backend/src/modules/maps/dto/operations/token-ops.dto.ts)):
  ```ts
  @IsObject() patch!: Record<string, unknown>;
  ```
  `TokenPayloadDto` (token.add) validuje jen `id/characterId/characterSlug/q/r`; zbytek `[key:string]:unknown` ([token-ops.dto.ts:23-27]).
- **Validator:** `whitelist:false, forbidNonWhitelisted:false` ([operation-payload-validator.service.ts:54-57]) → extra pole se ani nestripují.
- **Apply:** `token.update` slepě `$set tokens.$.<key> = op.patch[key]` pro všechny klíče ([map-operations.service.ts:642-649]); jen `patch.systemStats` jde přes `validateTokenStatsPatch` ([:634-641]). Legacy fixní pole `currentHp/maxHp/baseHp/armor/injury/initiative` **žádným validátorem neprojdou**.
- **Mongoose:** token = `[MixedArraySubSchema]` → uloží cokoliv (i string/objekt/NaN).
- **Mapper:** `toToken` je `?? 0` cast bez clampu ([maps.repository.ts:183-190]).

**Proč to vadí (fairness, ne jen robustnost):** authorizer dovolí **hráči** patchovat na vlastním odemčeném tokenu právě `currentHp`, `injury`, `initiative` (whitelist `allowedPlayerFields`, [operations-authorizer.service.ts:151-155]) — ale **hodnotu nikdo neomezuje**. Hráč pošle `{currentHp: 999999}` / záporné / `initiative: 99999` (= vždy první v boji) / string → uloží se. To je přesně ext-46 🔴 (`server nikde neclampuje TM herní stav`).

**Rozpor s plánem:** `08-maps.md` MP-T08 tvrdí *„⚖️ by-design (fixní HP pole legacy/BC; range řeší per-system validator)"*. **Premisa je nepravdivá** — per-system validator (`validateTokenStatsPatch`) se spustí **jen když `patch.systemStats` existuje**; legacy `currentHp`/`initiative` ho obchází úplně. F-22 (registr) tento kořen zachytil, ale **zúžil na `q/r`**; reálně je opaque patch nevalidovaný `$set` sink pro **všechna** token pole vč. staveček.

- **Dopad na existující data:** žádný (jen zpřísnění vstupu; případný sweep nevalidních HP je herní, ne form-schema).
- **Návrh (koordinovat s ext-46, aby se nefixovalo 2×):** povýšit F-22 na „token.update.patch + token.add mimo-klíčová pole bez `RN`/`TY`"; přidat `@Min(0)` + server clamp `max(0, min(maxHp, x))` na `currentHp`, bounds na `initiative`; opravit MP-T08 z `⚖️` na `🟡 RN/TY` s poznámkou o falešné premise. **BE fix vlastní ext-46 (test-first).**

---

## ♻️ Stale docs — dva nálezy plánu už jsou opravené (registr/plán neaktualizovaný)

### F-21 / MP-D1 (`config.size/originX/originY` bez `@IsNumber`) — **RESOLVED**
- Plán MP-06a i registr F-21 tvrdí `@IsOptional` **bez `@IsNumber`**. Realita HEAD:
  ```ts
  // create-map.dto.ts:19-23
  export class HexConfigDto {
    @IsOptional() @IsNumber() size?: number;
    @IsOptional() @IsNumber() originX?: number;
    @IsOptional() @IsNumber() originY?: number;
    @IsOptional() @IsBoolean() showGrid?: boolean;
  }
  ```
  `@IsNumber()` **doplněno** → string `"40"` teď spadne 400. `TY` mezera uzavřena. **Návrh:** F-21/MP-D1 přeznačit ✅ opraveno.

### F-22 / MP-D5 (`q/r` bez range mimo token.add/move) — **ČÁSTEČNĚ RESOLVED**
- `fog.brush` i `fog.set` teď validují hexy přes sdílený `HexCoordDto` ([base.ts:11-14]) — `@IsInt() @Min(-10000) @Max(10000)`, s explicitním komentářem odkazujícím F-22:
  ```ts
  // fog-ops.dto.ts:23-25,34-36
  @ValidateNested({ each: true }) @Type(() => HexCoordDto) revealedHexes!: HexCoordDto[];  // fog.set
  @ValidateNested({ each: true }) @Type(() => HexCoordDto) hexes!: HexCoordDto[];          // fog.brush
  ```
  `+ @ArrayMaxSize(50000)` (fog.set), `@ArrayMinSize(1) @ArrayMaxSize(1000)` (fog.brush) — bonus DoS cap.
- **STÁLE OTEVŘENÉ (F-22 zbytek):**
  - `CreateMapDto.revealedHexes` = holé `@IsArray()` bez nested tvaru ([create-map.dto.ts:40]) — create-path stále bez int/range.
  - `token.update.patch` `q/r` — opaque `@IsObject` (viz ⭐ výše); token lze přesunout mimo -10000/10000 přes patch (obchází `token.move` clamp).
- **Návrh:** F-22 přeznačit „částečně opraveno (fog ops)", zbytek sloučit do ⭐ elevace výše.

---

## Potvrzeno beze změny (sweep 2026-06-05 drží)

- **Token whitelist mapper = jediná pojistka tvaru** — potvrzeno (validator `whitelist:false`, DTO+Mongoose Mixed prostupné). `toToken` drží `notes`/`isLocked`/`systemStats`/`personalDiarySchema`/`customData` + `q/r/hp/...`.
- **MapTemplate** (MP-L01..L06) — DTO↔schema konzistentní (name 1-100, imageUrl req min1, ownerId mimo DTO = whitelist drop / server přepíše). Beze změny.
- **`worldId` create** (MP-D2) — DTO `@IsOptional` vs DB `required:true`; `⚖️ by-design` (500 ne tichá ztráta), FE vždy posílá. Beze změny.
- **`effects[]`** (MP-D4) — raw cast bez per-pole validace ([maps.repository.ts:144]); `⚖️ by-design` (FE-only tvar). Beze změny.
- **`playerStates` null→delete** (MP-15) — apply logika ([map-operations.service.ts:797-822]) drží null=smazat override; mapper `toPlayerState` jen boolean. Beze změny.
- **`config.showHp*`** (MP-D3) — chybí v `HexConfigDto`, ale `config` je Mixed Object a mapper vrací celý raw ([maps.repository.ts:132]) → round-trip drží. `⚠️ robustnost` (doporučeno doplnit do DTO). Beze změny.

---

## Cross-ref
- **ext-46 (game-integrity)** — `ext-46__game-integrity.md:8-9` = stejný token HP/initiative clamp gap jako 🔴; BE fix vlastní styl 46 (test-first). Form-schema jen potvrzuje `RN`/`TY` facetu + opravu premisy MP-T08.
- **F-22** (registr) — rozšířit z `q/r` na všechna token numeric pole.
- Paměť `token_hp` (bestie=systemStats snap; PC/NPC=legacy+customData) — legacy HP pole stále živá u PC/NPC → clamp mezera reálná.
