# form-schema / 03-worlds — checkpoint RUN-2026-06-20-1621

> Datum: 2026-06-20 · Agent: hloubkový auditor 03-worlds · Cíl: L2+ statická verifikace HEAD kódu.
> Předchozí sweep: 2026-06-05 (3 nálezy WO-D1/D2/D3, vše označeny jako opravené F-05/F-06/F-07).

---

## Pokrytí

Projito (HEAD kód, statická analýza M1+M2):

| Soubor | Stav |
|---|---|
| `update-world.dto.ts` | ✅ čten |
| `create-world.dto.ts` | ✅ čten |
| `update-world-settings.dto.ts` | ✅ čten |
| `create-world-calendar-config.dto.ts` | ✅ čten |
| `worlds.service.ts` (update sekce, řádky 430–517) | ✅ čten |
| `worlds.repository.ts` (toEntity, clearThemeBackgroundUrl) | ✅ čten |
| `world-settings.repository.ts` (toEntity) | ✅ čten |
| `world.schema.ts` | ✅ čten |
| `world-settings.schema.ts` | ✅ čten |
| `world.interface.ts` | ✅ čten |
| `world-settings.interface.ts` | ✅ čten |
| `worldSettingsSchema.ts` (basicInfoSchema) | ✅ čten |
| `CreateWorldPage.tsx` (submit handler) | ✅ čten |
| `BasicInfoTab.tsx` (submit handler, imageUrl clear) | ✅ čten |
| `useUpdateWorld.ts` (UpdateWorldInput) | ✅ čten |
| `useCreateWorld.ts` (CreateWorldInput) | ✅ čten |
| `calendar presets/` (gregorian + leapYearRule enum) | ✅ čten |
| `update-world-currencies.dto.ts` (F-04 context) | ✅ čten |
| `world-settings kuriozita: currencies v settings DTO vs currencies endpoint` | ✅ ověřeno by-design |
| `update-world.dto.spec.ts` | ✅ čten |
| `create-world.dto.spec.ts` | ✅ čten |

---

## Dosažená L vs cílová L

| Pole / osa | Dosažená L | Cílová L | Poznámka |
|---|---|---|---|
| WO-01 name `LN` | L2 | L3+ | MinLength chybí na update (viz F-RUN-02) |
| WO-02 slug `RG` | L2 | L3 | F-06 opraveno, `@Matches` přidáno do create DTO |
| WO-03..WO-18 ostatní | L2 | L2+ | viz tabulka níže |
| WO-07 imageUrl clear `NL` | L2 | L3 | residual F-07 (viz F-RUN-03) |
| calendars[] nested (P1) | L2 | L2 | leapYearRule enum shoda ověřena |
| WorldSettings fields (WL) | L2 | L2 | toEntity mapper pokrývá vše z DTO |
| F-04 currency via settings DTO | L2 | L2 | by-design (jiný endpoint) |

**Celkem: L2 statická, L3 chybí pro 2 pole (F-RUN-02, F-RUN-03).**
**Proof-vrstvy (M4/M5): NEVYKONÁNO — živá infra nedostupná → PROOF-REQUEST.**

---

## Verifikace původních nálezů (stav po opravách)

| ID | Původní závěr | HEAD stav | Verdikt |
|---|---|---|---|
| F-05 (WO-D1) | update DTO bez `@MaxLength` na name/desc/playersWanted | `@MaxLength(60/1000/500)` přidány | ✅ MaxLength opraveno; `@MinLength(2)` chybí → viz F-RUN-02 |
| F-06 (WO-D2) | slug bez `@Matches` na create DTO | `@Matches(/^[a-z0-9-]+$/)` přidáno (create-world.dto.ts:22-25) | ✅ opraveno |
| F-07 (WO-D3) | `imageUrl: ""` → `@IsUrl()` → 400 | `@ValidateIf(v!==null && v!=='')` (update-world.dto.ts:33) | ✅ 400 odstraněn; residual NL issue → viz F-RUN-03 |

---

## Nálezy

### F-RUN-02 🟡 `LN` — `UpdateWorldDto.name` chybí `@MinLength(2)` (residual F-05)

- **Pole / entita:** `name` v `PATCH /worlds/:id` (UpdateWorldDto).
- **FE:** `basicInfoSchema.ts:9-13` `z.string().min(2)` + wizard inline `nameOk = length >= 2` — min 2 vynutí klientsky.
- **BE DTO:** `update-world.dto.ts:25` `@IsOptional() @IsString() @MaxLength(60) name?` — **bez `@MinLength(2)`**.
- **create DTO:** `create-world.dto.ts:19` `@IsString() @MinLength(2) @MaxLength(60) name` — min 2 má.
- **DB:** `world.schema.ts:8` `@Prop({ required: true }) name: string` — bez délkového limitu.
- **Rozpor:** přímý `PATCH /worlds/:id` s `{ name: "x" }` (1 znak) projde BE validací a uloží se. FE tab zablokuje, přímý klient ne. `forbidNonWhitelisted:true` → neznámá pole = 400, ale `name` je v DTO → projde.
- **Dopad na existující data:** žádný při opravě (zpřísnění min→ov stávajících 1-znaků světů v DB by nerozpíše stávající data — `@MinLength` na UPDATE DTO se uplatní jen při budoucích write, ne na read existujících).
- **Návrh:** doplnit `@MinLength(2)` do `update-world.dto.ts:25`. Přidat test `odmítne name kratší než 2 znaky` do `update-world.dto.spec.ts`.
- **L1 · 🟡 · ♻️** (residual z F-05 opravy — `MaxLength` byl přidán, `MinLength` ne)

---

### F-RUN-03 🟡 `NL` — `imageUrl: ""` (clear) se uloží jako prázdný string do DB (residual F-07)

- **Pole / entita:** `imageUrl` v `PATCH /worlds/:id`.
- **FE clear:** `BasicInfoTab.tsx:436` `setValue("imageUrl", "", ...)` → `BasicInfoTab.tsx:129-130` `patch.imageUrl = values.imageUrl = ""`.
- **BE DTO:** `update-world.dto.ts:32-35` `@ValidateIf(v!==null && v!=='') @IsUrl()` — `""` projde (záměr F-07 fix). ✅ 400 je odstraněn.
- **BE service:** `worlds.service.ts:466-483` — zpracovává jen `themeBackgroundUrl` přes `clearThemeBackgroundUrl($unset)`; `imageUrl` nemá speciální větev. `worldsRepo.update(id, { imageUrl: "" })` → `$set: { imageUrl: "" }` do MongoDB.
- **DB výsledek:** `imageUrl: ""` se uloží (ne `$unset`, ne `null`). `worlds.repository.ts:213` toEntity: `imageUrl: doc.imageUrl as string | undefined` → vrátí `""`.
- **FE read-side:** defaultValues `world?.imageUrl ?? ""` = `""` → `{imageUrl ? <img> : "Bez obrázku"}` (řádek 400) — `""` je falsy → zobrazí se "Bez obrázku" ✅. Vizuálně OK, ale `world.imageUrl === ""` (ne undefined). FE typový kontrakt má `imageUrl?: string` (undefined), ne `""`.
- **Dopad na existující data:** žádné new — liší se jen od předpokládaného `undefined`; funkčně OK ale sémanticky nesprávné (`""` jako URL). Stávající dokumenty s `imageUrl: ""` po clearu existují.
- **Návrh (vzor themeBackgroundUrl):** service.update přidat větev: `if (dto.imageUrl === '' || dto.imageUrl === null) { await worldsRepo.clearImageUrl(id); }` + přidat `clearImageUrl` do repository ($unset), analogicky k `clearThemeBackgroundUrl`. Nebo: FE poslat `null` místo `""` + DTO `@ValidateIf(v!==null) @IsString()` (bez @IsUrl na update).
- **L2 · 🟡 · ♻️** (residual z F-07 opravy — 400 odstraněn, ale clear semantic je stale `""` → DB, ne $unset)

---

### Potvrzené shody (L2, 🆕 od sweepdate)

Následující pole/oblasti prošly statickou verifikací HEAD kódu a jsou v souladu:

| Pole | Osa | Výsledek |
|---|---|---|
| WO-01 name MaxLength 60 | LN | ✅ create+update DTO shodně `@MaxLength(60)` |
| WO-02 slug `@Matches` | RG | ✅ create-world.dto.ts:22-25 má regex |
| WO-04 maxPlayers int/range/null | RN/NL | ✅ create+update shodné `@IsInt @Min(1) @Max(999)` opt |
| WO-05 accessMode enum 4 hodnot | EN | ✅ by-design; DTO `@IsIn(4)`, FE create posílá 3 (closed jen settings) |
| WO-09 dice[] | TY | ✅ |
| WO-11 themeId | EN | ✅ by-design (dual-source THEME_IDS, bez `@IsIn` záměrně) |
| WO-12 themeBackgroundUrl clear | NL | ✅ `@ValidateIf(v!==null)` + service `$unset` |
| WO-13 themeOverrides | TY | ✅ `@IsObject` + service sanitize |
| WO-14 calendars[] nested | P1 | ✅ `@ValidateNested @ArrayMaxSize(20)`; leapYearRule enum FE↔DTO shoda |
| WO-15 defaultCalendarSlug↔defaultCalendarConfigSlug | NM | ✅ service explicitně mapuje (worlds.service.ts:319-333) |
| WO-16 diceVisibility 3 bool | TY | ✅ `@ValidateNested @IsBoolean` shodně FE+DTO |
| WO-18 timelineCalendarSlug null | NL | ✅ `@ValidateIf(v!==null) @IsString @MaxLength(64)` |
| techLevelMin/Max create-only | RQ | ✅ by-design (seeduje stránky, needituje v Nastavení) |
| magicTraditions create-only | TY | ✅ by-design; toEntity mapper přítomen |
| WorldSettings fields WL | WL | ✅ všechna DTO pole v toEntity mapperu |
| currency endpoint (F-04) | LN/RG | ✅ `update-world-currencies.dto.ts` má `@Matches @MaxLength @Min/@Max`; settings DTO currencies = read embed, ne write path |

---

## PROOF-REQUEST

Následující oblasti nelze ověřit statickou analýzou (chybí živá infra nebo e2e testy):

| # | Co ověřit | Metoda | Priorita |
|---|---|---|---|
| PR-01 | **M5 red-team:** `PATCH /worlds/:id { name: "x" }` — vrátí 400 (MinLength) nebo 200? | přímý HTTP request | 🟡 nízká |
| PR-02 | **M5 red-team:** `PATCH /worlds/:id { imageUrl: "" }` — zkontrolovat MongoDB po requestu: je `imageUrl` `""` nebo chybí? | MongoDB inspect + HTTP | 🟡 nízká |
| PR-03 | **M4 round-trip:** `POST /worlds` s kalendářem → `GET /worlds/:id/calendars` → ověřit months/seasons/celestialBodies beze ztráty | jest e2e / ruční | 🟡 nízká |
| PR-04 | **M5 red-team:** `POST /worlds { slug: "Foo Bar" }` — nový `@Matches` v create DTO odmítne? (slouží jako verifikace F-06 opravy) | přímý HTTP request | 🟡 nízká |
