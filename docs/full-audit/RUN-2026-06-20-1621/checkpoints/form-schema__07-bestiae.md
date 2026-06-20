# form-schema / 07-bestiae — checkpoint RUN-2026-06-20-1621

## Pokrytí

Přečteno a ověřeno:
- FE: `BestieEditorModal.tsx`, `CloneBestieModal.tsx`, `types.ts`, `bestiarApi.ts`, `useBestieMutations.ts`, `imageStyle.ts`, `ImageZoomSlider.tsx`, `HeroUploadCard.tsx` (imageUrl clear flow)
- BE DTO: `create-bestie.dto.ts`, `update-bestie.dto.ts`, `clone-bestie.dto.ts`
- BE: `bestie.schema.ts`, `bestiae.repository.ts` (toEntity mapper), `bestiae.service.ts`, `bestie.interface.ts`
- Testy: `create-bestie.dto.spec.ts`, `bestiae.service.spec.ts`
- Kontext: `main.ts` (ValidationPipe `forbidNonWhitelisted:true`, `transform:true`)
- Živý check: class-validator 0.14+ chování `@IsOptional()` s `null` ověřeno node runtime (0 errors pro `null`)

Stav z předchozího sweepu (2026-06-05):
- F-09 (imageUrl délkový limit) → ✅ **OPRAVENO**: `@MaxLength(2048)` v create + update DTO; test v `create-bestie.dto.spec.ts`
- F-20 (abilities bez @ValidateNested) → ✅ **OBSOLETE**: top-level pole `abilities` bylo ZRUŠENO (D-NEW-BESTIE-ABILITIES-DUP); DTO, schema ani FE typ ho neobsahují; abilities nyní žijí v `systemStats.abilities` (per-system schéma)

Nová pole přidaná po původním sweepu (nyní v kódu):
`imageFocalX`, `imageFocalY`, `imageZoom`, `imageFit` — parity s GameEvent/WorldNews.

## Dosažená L vs cílová L

| Pole | L dosažená | Cílová |
|---|---|---|
| scope (BE-01) | L2 (DTO+schema+FE enum sedí; clone bez 'system' záměrně) | L2 |
| systemId (BE-02) | L2 (immutable; create-only) | L2 |
| worldId (BE-03) | L2 (cross-field scope; service guard ověřen) | L2 |
| name (BE-04) | L2 (trim+if+maxLength=100 FE; @MinLength(1) @MaxLength(100) DTO; required DB) | L2 |
| imageUrl (BE-05) | L2 (`@MaxLength(2048)` DTO; **ale: `NL` clear gap — nový nález F-RUN-BE-01**) | L2 |
| imageFocalX/Y | L2 (DTO @IsOptional @IsNumber @Min @Max; schema Number default null; mapper ?? null) | L2 |
| imageZoom | L2 (FE slider MIN=100 MAX=400 == DTO @Min(100) @Max(400)) | L2 |
| imageFit | L2 (DTO @IsIn(['cover','contain']); FE type = same; schema String default null) | L2 |
| notes (BE-06) | L2 (FE vždy trim; DTO @MaxLength(2000); schema default ''; mapper ?? '') | L2 |
| abilities | L2 → OBSOLETE (pole zrušeno, registr F-20 stale) | — |
| systemStats (BE-08) | L2 (DTO @IsObject; soft-mode service; oblast 10 neřešena zde) | L2 → P4 |
| newName (clone, BE-09) | L2 (FE maxLength=100; DTO @IsOptional @MaxLength(100)) | L2 |
| clonedFromId/ownerUserId/deletedAt | L2 (service-set; mapper vrací) | L2 |

Celková dosažená hloubka: **L2 pro všechna top-level pole** (statická shoda 3 vrstev: FE + DTO + DB + mapper).
L3 (testy): F-09 má pojistku v `create-bestie.dto.spec.ts` (✅). `imageFocalX/Y/zoom/fit` testový kryt **nemají** (viz PROOF-REQUEST).
L4 (round-trip/red-team): žádný round-trip spuštěn (živý server).

## Nálezy

### 🟠 F-RUN-BE-01 — `NL` imageUrl nelze smazat v bestie UPDATE 🆕

- **Pole / entita:** `imageUrl` v `UpdateBestieDto` / `BestieEditorModal` edit mode
- **FE:** `BestieEditorModal.tsx:102` — `imageUrl: imageUrl.trim() || undefined`; HeroUploadCard "Odebrat" btn → `onChange('')`; prázdný string → `undefined` → axios `JSON.stringify` **vypustí klíč** → PATCH body bez `imageUrl`
- **BE DTO:** `update-bestie.dto.ts:26-28` — `@IsOptional() @IsString() @MaxLength(2048) imageUrl?: string` — **bez `| null`**; `null` by DTO technicky prošel (`@IsOptional` skips null), ale FE nikdy null nepošle
- **DB:** `bestie.schema.ts:24` — `@Prop() imageUrl?: string` (bez default null)
- **Mapper:** `bestiae.repository.ts:35` — `imageUrl: o.imageUrl as string | undefined` — vrátí string nebo undefined
- **Service:** `bestiae.service.ts:164` — `updateAtomic(id, dto)` → `$set: patch`; patch bez `imageUrl` → `$set` bez `imageUrl` → DB ho nezmění
- **Rozpor:** Uživatel v editoru klikne „Odebrat obrázek" → `imageFocalX/Y/zoom/fit` se nastaví na `null` (posílají se explicitně) → v DB budou null, ale `imageUrl` zůstane = **obrázkový slot se vizuálně resetuje v UI, ale imageUrl přetrvává v DB → při příštím načtení se stará URL vrátí**. Nevratný bug (dokud se bestie smaže a znovu vytvoří).
- **Vzor v jiných entitách:** `update-world.dto.ts`, `update-world-news.dto.ts`, `update-ikaros-news.dto.ts`, `update-ikaros-event.dto.ts` všechny mají `imageUrl?: string | null` + `@ValidateIf(o => o.imageUrl !== null) @IsUrl()` — clearovací `null` pattern. Bestie ho postrádá.
- **Dopad na existující data:** žádný (zpřísnění není; jen FE pošle navíc `null`, což projde DTO i nullable $set)
- **Návrh:** `update-bestie.dto.ts` změnit `imageUrl?: string` → `imageUrl?: string | null`; service: `if (dto.imageUrl === null) { $set.imageUrl = null }` nebo nechat `$set: dto` (Mongoose zapíše null). FE: `imageUrl: imageUrl.trim() || null` (null místo undefined pro clear signal). Align na pattern ostatních entit.
- **Závažnost:** 🟠 střední — funkční bug: uživatel nemůže vizuálně odstranit obrázek bestie; neviditelný (UI ukazuje "odebráno", BE zachová stará URL)
- **Stav:** 🐛 potvrzeno (L2, kód-read)

---

### 🟡 F-RUN-BE-02 — `WL` F-20 stale — abilities top-level pole zrušeno ♻️

- **Pole / entita:** top-level `abilities[]` v Bestie
- **Původní registr:** F-20 (🟡) — `@IsArray` bez `@ValidateNested`, red-team only
- **HEAD stav:** pole **fyzicky odstraněno** ze všech 4 míst: DTO nemá `abilities`, schema nemá `abilities`, FE `types.ts:24` obsahuje komentář s odkazem na D-NEW-BESTIE-ABILITIES-DUP. Schopnosti žijí v `systemStats.abilities` (per-system schéma).
- **Verdikt:** F-20 je **obsolete** — registr ho stále uvádí jako otevřený 🟡. Je třeba aktualizovat registr na ✅ uzavřeno / obsolete (field removed).
- **Dopad:** kosmetický (matoucí otevřený nález v registru)
- **Stav:** ♻️ — stale registrový záznam, kód čistý

---

### ✅ Potvrzena: imageFocalX/Y/zoom/fit — nová pole, L2 shoda 🆕 ověřeno

- **Pole:** `imageFocalX`, `imageFocalY`, `imageZoom`, `imageFit`
- **Přidáno po původním sweepu** (2026-06-05 sweep tato pole neznal)
- **Shoda:** FE typ → DTO (`@IsOptional` + `@IsNumber`/`@IsIn` + `@Min`/`@Max`) → DB schema (`Number/String, default: null`) → mapper (`?? null`) — konzistentní na všech 4 místech. Slider FE MIN/MAX (100–400 %) = DTO `@Min(100) @Max(400)`. Focal FE clamp (0–100) = DTO `@Min(0) @Max(100)`. imageFit FE `'cover'|'contain'` = DTO `@IsIn(['cover','contain'])` = schema `String`.
- **Verdikt:** ✅ L2 shoda, bez nálezů

---

### ✅ F-09 ověřena oprava — imageUrl `@MaxLength(2048)` 🔓

- **Původní nález:** F-09 (🟠) — imageUrl bez délkového limitu
- **HEAD stav:** `create-bestie.dto.ts:35` `@MaxLength(2048)`, `update-bestie.dto.ts:27` `@MaxLength(2048)`, test `create-bestie.dto.spec.ts:20-33` pokrývá hranici
- **Verdikt:** ✅ opraveno, L3 (test zelený dle kódu)

## PROOF-REQUEST

**PR-BE-01** — imageFocalX/Y/zoom/fit round-trip (L4): Živý server — PATCH bestie s `imageFocalX:25, imageFocalY:75, imageZoom:200, imageFit:'contain'` → GET `/bestiae/:id` → ověř, že se hodnoty vrátí. Pak PATCH `{imageFocalX:null,imageFocalY:null,imageZoom:null,imageFit:null}` → GET → ověř null. **Vyžaduje živý BE** (ne statická analýza) — cílová vrstva L4.

**PR-BE-02** — imageUrl clear red-team (L4): Živý server — (1) CREATE bestie s imageUrl; (2) PATCH s `imageUrl: undefined` (absence klíče) → GET → ověř, že imageUrl zůstalo (potvrdí F-RUN-BE-01). (3) Pokud fix zaveden: PATCH `{imageUrl: null}` → GET → ověř `imageUrl: null/undefined`. **Vyžaduje živý BE.**

**PR-BE-03** — F-20 registrový stav: Projít `form-schema-audit.md` záznam F-20, aktualizovat status na „♻️ obsolete — field removed (D-NEW-BESTIE-ABILITIES-DUP), kód čistý" — nevyžaduje živou infru, jen editaci docs.
