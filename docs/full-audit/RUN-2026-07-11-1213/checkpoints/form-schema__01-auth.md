# Checkpoint — form-schema / oblast 01-auth

> RUN-2026-07-11-1213 · styl **form-schema** (registr `docs/form-schema-audit.md`, prefix `F-`)
> Oblast: `docs/form-schema-plan/01-auth.md` — register / login / reset / forgot.
> READ-ONLY. Hloubka L1-L3 (statické čtení 3 vrstev FE zod ↔ BE DTO ↔ DB `@Prop` + service + e2e).
> Priorita zadání: e2e ukázal **register 400 místo 409** pro duplicitní email/username + **honeypot `hp`
> odmítnut** `forbidNonWhitelisted`. Ověřeno prioritně ↓.

---

## VERDIKT k prioritnímu nálezu (register 400/409 + hp honeypot)

**Produkční kód je SPRÁVNÝ. E2e „selhání" je artefakt zastaralého testu, ne bug v RegisterDto/service.**

### 1. register 400 vs 409 — SOURCE OK, test drift
- `auth.service.register` vrací **409** pro duplicity:
  - `backend/src/modules/auth/auth.service.ts:126-131` → `ConflictException { code:'EMAIL_TAKEN' }`
  - `auth.service.ts:133-139` → `ConflictException { code:'USERNAME_TAKEN' }`
- **Proč e2e vidí 400:** e2e test posílá inline `.send()` payloady **bez povinného pole `isMinor`**.
  RegisterDto má `isMinor` jako **required** `@IsBoolean()` (bez `@IsOptional`):
  - `backend/src/modules/auth/dto/register.dto.ts:43-44` → `@IsBoolean() isMinor: boolean;`
  - `ValidationPipe` (`main.ts:66-73`, `whitelist+forbidNonWhitelisted+transform`) proto vrátí
    **400 „isMinor must be a boolean"** JEŠTĚ PŘED tím, než request dorazí do service na conflict check.
- Zdroj v testu (payload bez `isMinor`):
  - `backend/test/auth-register-check.e2e-spec.ts:41-47` (dup email, druhá registrace) → 400 místo 409
  - `auth-register-check.e2e-spec.ts:65-73` (dup username) → 400 místo 409
- **Klíč:** helper `registerUser` (`test/helpers/auth.ts:30-33`) BYL aktualizován — defaultně dosazuje
  `acceptedTerms:true, isMinor:false, captchaToken:'dev-bypass'`. Ale 4 inline `.send()` v
  `auth-register-check.e2e-spec.ts` aktualizované **nebyly** → drift test ↔ DTO.

### 2. honeypot `hp` — SOURCE OK (DTO pole MÁ), test drift stejná příčina
- RegisterDto **obsahuje** `hp`: `register.dto.ts:65-68` → `@IsOptional @IsString @MaxLength(0)`.
  Prázdné `hp:''` (reálný uživatel) tedy projde, vyplněné (bot) → 400. `forbidNonWhitelisted` `hp`
  **neodmítá** (pole je whitelistováno). **Žádný drift, žádné chybějící pole.**
- FE symetrie: `registerSchema.ts:34` `hp: z.string().max(0).optional()`; skryté pole
  `RegisterModal.tsx:256-270`; submit posílá `hp: values.hp` (`RegisterModal.tsx:145`).
- **Proč e2e „hp odmítnut":** honeypot testy `auth-register-check.e2e-spec.ts:89-96` (očekává 201) a
  `:104-111` (očekává 400) opět **neposílají `isMinor`** → 400 z ValidationPipe (missing isMinor),
  ne z honeypotu. Test `:98` (201) proto padá s 400; test `:113` (400) projde ze **špatného důvodu**
  (400 kvůli isMinor, ne kvůli hp) → falešně zelený.

**Dopad:** produkce registrace funguje (FE posílá `isMinor` odvozený z `ageBracket`, viz níže).
Reálné riziko = **anti-regression síť pro auth-register je fakticky mimo provoz** (409-conflict test
padá, hp-honeypot test buď padá, nebo je zeleně-falešný). Chyba by v těchto testech neprobublala.

---

## Nálezy

### 🆕 F-AUTH-A1 · 🟡⭐ `WL`/`RQ` — e2e register testy zastaralé vůči povinnému `isMinor` (falešná anti-regression síť)
- **Vrstvy:** DTO `register.dto.ts:43-44` `isMinor` required `@IsBoolean` (přidáno v 20C §C2, po sweepu
  2026-06-05). Helper `test/helpers/auth.ts:8-14,30-33` aktualizován (default `isMinor:false`).
  Inline `.send()` v `test/auth-register-check.e2e-spec.ts:41-47, 65-73, 89-96, 104-111` **ne**.
- **Rozpor / co se stane:** payload bez `isMinor` → ValidationPipe **400** před conflict/honeypot logikou.
  → 409-conflict testy (`:49`, `:75`) padají s 400; honeypot-201 test (`:98`) padá s 400; honeypot-bot
  test (`:113`) je zeleně-falešný (400 z jiné příčiny). Reportované „400 místo 409" a „hp odmítnut"
  pramení odsud, ne z produkčního kódu.
- **Dopad na existující data:** žádný (jen test).
- **Návrh:** doplnit `isMinor:false` (a `acceptedTerms:true`) do všech 4 inline `.send()` payloadů, nebo
  je přepsat na helper `registerUser`. Pro robustnost zvážit kontraktový test „RegisterDto required klíče
  ↔ FE submit klíče" (stejný princip jako pojistky F-01/F-27), aby přidání povinného pole automaticky
  chytlo zastaralé testy. **Priorita 2** (produkce OK, ale guard je slepý).

### ♻️ F-AUTH-A2 · 🟡 doc — `01-auth.md` matice zastaralá vůči opravám F-01/F-03 + novým polím 20C
- `docs/form-schema-plan/01-auth.md` stále vede **AU-D1 (🔴)** a **AU-D2 (🔴)** jako otevřené rozpory
  (hlavička ř.9, matice ř.60/66, delta ř.90-92), ale registr `form-schema-audit.md:46,48` je má
  **✅ opraveno** (F-01, F-03) a kód to potvrzuje:
  - **F-01/AU-D2 opraveno:** FE `useResetPassword.ts:27-31` mapuje `newPassword`→`password`; controller
    `auth.controller.ts:254` čte `dto.password`; DTO `reset-password.dto.ts:15` `password`. ✅ shoda.
  - **F-03/AU-D1 opraveno:** DTO `register.dto.ts:30-31` `acceptedTerms @IsBoolean`; service vynutí
    `=== true` (`auth.service.ts:118-123`) + persistuje `acceptedTermsAt`/`termsVersion`
    (`auth.service.ts:153-154`, DB `user.schema.ts:85-86`). ✅
- Navíc `01-auth.md` popisuje RegisterDto jako „jen email/username/password/captchaToken" (ř.61,92) a
  password `min(6)` (AU-03 ř.58) — realita: DTO má `acceptedTerms`, `isMinor`, `hp` a password
  **`min(8)`** (`register.dto.ts:23`, sjednoceno D-NEW-INV-SEC). Nová pole `isMinor`/`ageBracket`
  (20C) v soupisu oblasti chybí úplně.
- **Dopad:** dokumentace-only. **Návrh:** refresh matice 01-auth.md (uzavřít AU-D1/AU-D2 jako ✅, přidat
  řádky `isMinor`/`ageBracket`, opravit password na 8). Ne blocker.

---

## Ověřeno ✅ (shoda FE zod ↔ BE DTO ↔ DB, L2)

| Pole | FE zod | BE DTO | DB / service | Δ |
|---|---|---|---|---|
| register email | `registerSchema.ts:5-9` email/min1/max255 | `@IsEmail()` (bez max) | `user.schema` unique/lowercase; service `.toLowerCase()` `auth.service.ts:144` | ✅ (register bez server-max = ⚖️ by-design, DB lowercase) |
| register username | `:10-14` min3/max32/`/^[^@]+$/` | `:14-18` MinLength3/MaxLength32/Matches `/^[^@]+$/` | unique | ✅ identické |
| register password | `:15-19` min8/max128 | `:23` MinLength8/MaxLength128 | bcrypt hash | ✅ (sjednoceno na 8) |
| register passwordConfirm | `:20` + refine | — (strip před submitem) | — | ✅ FE-only; submit ho NEposílá (`RegisterModal.tsx:138-147`) |
| register acceptedTerms | `:22-26` refine===true | `:30-31` `@IsBoolean` + service===true | `acceptedTermsAt`/`termsVersion` | ✅ (F-03 fixed) |
| register ageBracket→isMinor | `:30-32` enum → submit `isMinor = ageBracket==='under15'` (`RegisterModal.tsx:144`) | `:43-44` `isMinor @IsBoolean` required | `isMinor`/`minorSelfDeclaredAt`/`parentalConsentStatus` `user.schema.ts:93-96`, service `auth.service.ts:156-165` | ✅ mapping OK; jen name-shift ageBracket(FE)→isMinor(BE) je záměrný |
| register hp | `:34` max(0) opt | `:65-68` `@IsOptional @MaxLength(0)` | — | ✅ honeypot symetrický |
| register captchaToken | component state (Turnstile) | `:52-55` opt/String/max2048 | service `captcha.verify` fail-closed `auth.service.ts:109-115` | ✅ |
| login identifier | `loginSchema.ts:4-7` min1/max255 | `login.dto.ts:9-12` String/min1/max255 | lookup email|username | ✅ |
| login password | `:8` min1 | `:15-17` String/min1 | bcrypt compare | ✅ |
| forgot email | `forgotPasswordSchema.ts:4-8` email/min1/max255 | `forgot-password.dto.ts:9-11` `@IsEmail @MaxLength(255)` | lookup | ✅ |
| reset token | z URL (nevaliduje FE) | `reset-password.dto.ts:6-9` String/min32/max128 | hash v DB | ✅ |
| reset newPassword→password | `resetPasswordSchema.ts:5-8` min8/max128 | `:11-15` `password` min8/max128 | bcrypt | ✅ (F-01 fixed mapem) |

**Login/forgot/reset flow:** čistý, žádný NM/WL/LN drift.

---

## Metodika / jistota
- L1-L2 statické čtení všech 3 vrstev + service + controller + e2e (M1). Priorita ověřena čtením
  service (409), DTO (hp/isMinor), ValidationPipe konfigu, e2e payloadů a FE submitu.
- L3 nedosaženo runtime (READ-ONLY, testy nespuštěny) — ale příčina 400/409 je deterministicky
  odvozena z chybějícího required `isMinor` v e2e payloadu vs. `@IsBoolean` bez `@IsOptional`.
- **Závěr:** oblast 01-auth kontrakt FE↔DTO↔DB **konzistentní**; jediné akční nálezy jsou
  test-drift (F-AUTH-A1, 🟡⭐) a doc-drift (F-AUTH-A2, 🟡). Žádný 🔴, žádná ztráta dat, žádná migrace.
