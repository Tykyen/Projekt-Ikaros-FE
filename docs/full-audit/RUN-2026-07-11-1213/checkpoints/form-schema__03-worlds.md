# form-schema / 03-worlds — checkpoint RUN-2026-07-11-1213

> Datum: 2026-07-11 · Agent: hloubkový auditor 03-worlds (READ-ONLY) · Cíl: L1–L3 statická verifikace HEAD.
> Předchozí: sweep 2026-06-05 (WO-D1/D2/D3 → F-05/F-06/F-07 opraveno) · RUN-2026-06-20-1621 (F-RUN-02, F-RUN-03 residuály).
> Metoda: M1 (statické čtení) + M2 (typ/kontrakt) na BE `worlds` modulu + FE create wizard/settings.
> **Závěr: BEZ NOVÝCH závažných nálezů; 2 residuály z 06-20 stále otevřené; 1 drobný nový 🟡 (array `each`).**

---

## Pokrytí (HEAD, M1+M2)

| Soubor | Stav |
|---|---|
| `backend/.../worlds/dto/create-world.dto.ts` | ✅ čten |
| `backend/.../worlds/dto/update-world.dto.ts` | ✅ čten |
| `backend/.../worlds/dto/update-world-settings.dto.ts` | ✅ čten |
| `backend/.../world-calendar-config/dto/create-world-calendar-config.dto.ts` | ⏭️ (nezměněno od 06-20, P1 shoda drží) |
| `backend/.../worlds/schemas/world.schema.ts` | ✅ čten |
| `backend/.../worlds/schemas/world-settings.schema.ts` | ✅ čten |
| `backend/.../worlds/worlds.service.ts` (update sekce 655–718) | ✅ čten |
| `backend/.../worlds/repositories/worlds.repository.ts` (toEntity, clear*) | ✅ čten (grep) |
| `backend/.../worlds/repositories/world-settings.repository.ts` (toEntity) | ✅ čten |
| `backend/.../worlds/dto/update-world.dto.spec.ts` | ✅ čten |
| FE `worldSettingsSchema.ts` (basicInfoSchema) | ✅ čten |
| FE `useUpdateWorld.ts` (UpdateWorldInput) | ✅ čten |
| FE `BasicInfoTab.tsx` (imageUrl clear + submit diff) | ✅ čten (grep) |

---

## Verifikace předchozích nálezů (stav na HEAD)

| ID | Původní | HEAD stav | Verdikt |
|---|---|---|---|
| F-05 (WO-D1) | update DTO bez `@MaxLength` | `@MaxLength(60/1000/500)` přítomny (`update-world.dto.ts:25,26,38`) | ✅ drží |
| F-06 (WO-D2) | slug bez `@Matches` | `@Matches(/^[a-z0-9-]+$/)` (`create-world.dto.ts:23-25`) | ✅ drží |
| F-07 (WO-D3) | `imageUrl:""` → `@IsUrl` → 400 | `@ValidateIf((_,v)=>v!==null&&v!=='')` (`update-world.dto.ts:33`) | ✅ 400 pryč (residual NL → F-RUN-03) |
| F-RUN-02 | update `name` bez `@MinLength(2)` | **stále chybí** | ♻️ **OTEVŘENO** |
| F-RUN-03 | `imageUrl:""` uloží `""` ne `$unset` | **stále bez clear-větve** | ♻️ **OTEVŘENO** |

---

## Nálezy

### F-RUN-02 🟡 `LN` ♻️ — `UpdateWorldDto.name` stále bez `@MinLength(2)` (residual F-05)

- **BE DTO:** `backend/src/modules/worlds/dto/update-world.dto.ts:25`
  `  @IsOptional() @IsString() @MaxLength(60) name?: string;` — **žádný `@MinLength`**.
- **create DTO:** `create-world.dto.ts:19` `@IsString() @MinLength(2) @MaxLength(60) name` — min 2 má.
- **FE:** `worldSettingsSchema.ts:9-13` `z.string().trim().min(2).max(60)` — klientsky vynutí.
- **DB:** `world.schema.ts:8` `@Prop({ required: true }) name` — bez délky.
- **Test:** `update-world.dto.spec.ts:23-24` testuje jen „name > 60"; **žádný test na `< 2`**.
- **Rozpor:** přímý `PATCH /worlds/:id { name: "x" }` (1 znak) projde BE (name je v DTO → `forbidNonWhitelisted` neblokuje) a uloží se. FE tab blokuje, jiný klient ne.
- **Dopad na data:** žádný (zpřísnění na UPDATE DTO se aplikuje jen na budoucí zápis).
- **Návrh:** doplnit `@MinLength(2)` do `update-world.dto.ts:25` + test do spec.
- **L1 · 🟡 · ♻️**

### F-RUN-03 🟡 `NL` ♻️ — `imageUrl:""` (clear) se uloží jako `""` do DB, ne `$unset` (residual F-07)

- **FE clear:** `BasicInfoTab.tsx:464` `setValue("imageUrl", "", …)` → submit diff `:156-157` `patch.imageUrl = values.imageUrl` = `""`. FE typ `UpdateWorldInput.imageUrl?: string` (ne `| null`) — posílá `''`, ne `null`.
- **BE DTO:** `update-world.dto.ts:32-35` `@ValidateIf((_,v)=>v!==null&&v!=='') @IsUrl()` — `''` přeskočí validaci (✅ bez 400).
- **BE service:** `worlds.service.ts:672-689` — `clearBackground` větev řeší **jen `themeBackgroundUrl`** (null/`''` → `clearThemeBackgroundUrl` `$unset`). **Pro `imageUrl` žádná analogická větev** → `worldsRepo.update(id, { imageUrl: "" })` → `$set: { imageUrl: "" }`.
- **DB/read:** `worlds.repository.ts:231` `imageUrl: doc.imageUrl as string | undefined` → vrátí `""` (ne `undefined`).
- **Rozpor:** po clearu je v DB `imageUrl: ""` místo chybějícího pole. Funkčně OK (FE render `imageUrl ? <img> : …`, `""` je falsy → „Bez obrázku"), ale sémanticky nesprávné (`""` jako URL) — nekonzistentní se vzorem `themeBackgroundUrl`.
- **Dopad na data:** žádné rozbití; jen `""` místo `undefined` v dokumentech po clearu.
- **Návrh (vzor themeBackgroundUrl):** service větev `if (dto.imageUrl==='' || dto.imageUrl===null) clearImageUrl(id)` (+ `$unset` v repo), **nebo** FE poslat `null` + DTO `@ValidateIf(v!==null) @IsString`.
- **L2 · 🟡 · ♻️**

### F-RUN-04 🟡 `TY` 🆕 — create↔update DTO array-element drift: `tones`/`dice` na update bez `@IsString({each})`

- **create DTO:** `create-world.dto.ts:30,32` `@IsArray() @IsString({ each: true }) tones/dice` — validuje prvky.
- **update DTO:** `update-world.dto.ts:37,41` `@IsOptional() @IsArray() tones?` a `dice?` — **jen `@IsArray()`, bez `@IsString({each})`**.
- **DB:** `world.schema.ts:19,24` `type:[String]` — Mongoose přetypuje/odmítne dle castu.
- **Rozpor:** přímý `PATCH /worlds/:id { dice: [123] }` projde DTO (jen array check); Mongoose `[String]` cast čísla na string. Žádná ztráta ani XSS, jen slabší server-side typová brána než create.
- **Dopad na data:** žádný (FE PillChips vždy posílá `string[]`; `tones` UI vyřazeno = mrtvé pole).
- **Návrh (drobnost):** doplnit `@IsString({ each: true })` na update DTO pro paritu s create. Nízká priorita.
- **L2 · 🟡 · 🆕** (robustnost, ne data-loss)

---

## Potvrzené shody (L2, HEAD)

| Pole / oblast | Osa | Výsledek |
|---|---|---|
| WO-01 name MaxLength | LN | ✅ create+update `@MaxLength(60)` |
| WO-02 slug `@Matches`+min/max | RG/LN | ✅ create DTO `min2/max40/Matches` |
| WO-03 description | LN | ✅ create+update `@MaxLength(1000)` |
| WO-04 maxPlayers | RN/NL | ✅ create+update `@IsInt @Min(1) @Max(999)`; `@IsOptional` pustí `null`; DB `min1 max999 default null` |
| WO-05 accessMode | EN | ✅ by-design; DTO `@IsIn(4)`, wizard 3, `closed` přes settings |
| WO-10 playersWanted | LN | ✅ create+update `@MaxLength(500)` |
| WO-11 themeId | EN | ✅ by-design dual-source THEME_IDS, `@MaxLength(40)` bez `@IsIn` |
| WO-12 themeBackgroundUrl | NL | ✅ `@ValidateIf(v!==null)` + service clear `''`/`null` → `$unset` (`worlds.service.ts:672-689`) |
| WO-13 themeOverrides | TY | ✅ `@IsObject` + sanitize |
| WO-14 calendars[] nested | P1 | ✅ nezměněno od 06-20 (nested DTO drží) |
| WO-15 defaultCalendarSlug↔ConfigSlug | NM | ✅ service mapuje; toEntity `worlds.repository.ts:246` |
| WO-16 diceVisibility | TY | ✅ `@ValidateNested` 3× `@IsBoolean` shodně FE+DTO |
| WO-18 timelineCalendarSlug | NL | ✅ `@ValidateIf(v!==null) @IsString @MaxLength(64)` |
| WorldSettings `mapDefaults`/`chatCombatDefaults` (15.4/16.1e) | WL/NL | ✅ 🆕-od-06-05; DTO `@ValidateIf(v!==null) @IsObject`, schema + toEntity (`world-settings.repository.ts:81-84`) přítomny |
| WorldSettings `pjChatPersona.mode` | WL/EN | ✅ DTO `@IsIn(['unified','individual'])`; toEntity migrace `mode ?? …` (`:59-78`) |
| WorldSettings `characterTabVisibility` | WL/EN | ✅ DTO `@IsIn(CHARACTER_TAB_WHITELIST,{each}) @ArrayMaxSize(6)`; toEntity `:54-56` |
| WorldSettings WL (celkově) | WL | ✅ všechna DTO pole v `toEntity` mapperu |

---

## PROOF-REQUEST (nevykonáno — bez živé infra, shodné s 06-20)

| # | Co ověřit | Metoda | Priorita |
|---|---|---|---|
| PR-01 | `PATCH /worlds/:id { name: "x" }` → 400 nebo 200? (F-RUN-02) | HTTP | 🟡 |
| PR-02 | `PATCH /worlds/:id { imageUrl: "" }` → v Mongo `""` nebo chybí? (F-RUN-03) | Mongo + HTTP | 🟡 |
| PR-03 | `POST /worlds` s kalendářem → `GET …/calendars` beze ztráty (months/seasons/celestialBodies) | jest e2e | 🟡 |

---

## Dosažená L vs cílová L

- **L2 statická** dosažena na celém povrchu WO-01…WO-18 + WorldSettings (WL).
- **L3 chybí** pro F-RUN-02 (spec bez `<2` testu) a proof pole (PR-01..03).
- Proof-vrstvy M4/M5: **nevykonáno** (živá infra nedostupná).
