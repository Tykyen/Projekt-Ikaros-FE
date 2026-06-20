# 01 — Auth (register / login / reset / forgot)

> **Entity:** registrace, login, reset hesla, zapomenuté heslo · **write path:**
> `POST /auth/register` · `POST /auth/login` · `POST /auth/reset-password` (token flow) ·
> `POST /auth/forgot-password` · (+ `PATCH /users/me/password` self-reset přes `users` DTO).
> **FE styl:** zod (`loginSchema`, `registerSchema`, `resetPasswordSchema`, `forgotPasswordSchema`)
> + `@hookform/resolvers`; `captchaToken` mimo zod (Turnstile widget → component state).
> **Osy:** `RQ` `LN` `RG` `XF` · perspektiva **P3** (soft-fail vs hard-fail — kde drop, kde 400).
> Nálezy → [`../form-schema-audit.md`](../form-schema-audit.md) (`F-xx`). Stav: ✅ sweep 2026-06-05 — 2 rozpory (AU-D1 🔴, AU-D2 🔴), zbytek ✅/⚖️.

Tři vrstvy: **FE** [loginSchema.ts](../../src/features/auth/lib/loginSchema.ts) ·
[registerSchema.ts](../../src/features/auth/lib/registerSchema.ts) ·
[resetPasswordSchema.ts](../../src/features/auth/lib/resetPasswordSchema.ts) ·
[forgotPasswordSchema.ts](../../src/features/auth/lib/forgotPasswordSchema.ts) ·
**BE DTO** [register.dto.ts](../../../Projekt-ikaros/backend/src/modules/auth/dto/register.dto.ts) ·
[login.dto.ts](../../../Projekt-ikaros/backend/src/modules/auth/dto/login.dto.ts) ·
[reset-password.dto.ts](../../../Projekt-ikaros/backend/src/modules/auth/dto/reset-password.dto.ts) ·
[forgot-password.dto.ts](../../../Projekt-ikaros/backend/src/modules/auth/dto/forgot-password.dto.ts) ·
[users/reset-password.dto.ts](../../../Projekt-ikaros/backend/src/modules/users/dto/reset-password.dto.ts) ·
**DB** [user.schema.ts](../../../Projekt-ikaros/backend/src/modules/users/schemas/user.schema.ts)
(`email`, `username`, `passwordHash`).

---

## Soupis polí (povrch oblasti)

Vstupní pole 4 auth formulářů + cross-field a anti-spam pole. „Kde FE" = zod schéma nebo
component state (captcha). Heslo nikdy neukládáme v plaintextu — DB drží `passwordHash`.

| # | Pole | Typ | Kde FE | Hl. osa |
|---|---|---|---|---|
| AU-01 | `email` (register) | string | `registerSchema` | `RQ` `LN` `RG` |
| AU-02 | `username` (register) | string | `registerSchema` | `LN` `RG` |
| AU-03 | `password` (register) | string | `registerSchema` | `RQ` `LN` |
| AU-04 | `passwordConfirm` (register) | string | `registerSchema` refine | `XF` |
| AU-05 | `acceptedTerms` (register) | bool | `registerSchema` refine | `RQ` `XF` |
| AU-06 | `hp` honeypot (register) | string | `registerSchema` | `LN` `XF` |
| AU-07 | `captchaToken` (register) | string | component state (Turnstile) | `RQ` `LN` |
| AU-08 | `identifier` (login) | string | `loginSchema` | `RQ` `LN` |
| AU-09 | `password` (login) | string | `loginSchema` | `RQ` |
| AU-10 | `token` (reset, z emailu) | string | — (z URL, ne form) | `RQ` `LN` |
| AU-11 | `newPassword` / `password` (reset) | string | `resetPasswordSchema` | `RQ` `LN` |
| AU-12 | `passwordConfirm` (reset) | string | `resetPasswordSchema` refine | `XF` |
| AU-13 | `email` (forgot) | string | `forgotPasswordSchema` | `RQ` `LN` `RG` |

---

## Matice pole × vrstva

> Buňka = pravidlo na dané vrstvě (`—` = vrstva pole neomezuje). **Δ** = verdikt parity:
> `✅ shoda` / `🐛 F-xx` / `⚠️ ⬜ ověřit`. Pravidla doplněná z přípravné inventury;
> **Δ se uzavírá až při sweepu**. DB = `user.schema.ts` (reálné perzistentní pole).

| # | Pole | FE (zod) | BE DTO | DB `@Prop` | Δ |
|---|---|---|---|---|---|
| AU-01 | email (register) | `.email()` `min(1)` `max(255)` | `@IsEmail()` (bez `@MaxLength`) | `required,unique,lowercase` | ⚖️ by-design (FE max255 capuje; register DTO bez server-side limitu, forgot DTO ho má — LN drift, bez rizika dat) |
| AU-02 | username (register) | `min(3)` `max(32)` `/^[^@]+$/` | `@MinLength(3)` `@MaxLength(32)` `@Matches(/^[^@]+$/)` | `required,unique` (— fmt) | ✅ shoda (FE↔DTO identické; regex `/^[^@]+$/` obě strany) |
| AU-03 | password (register) | `min(6)` `max(128)` | `@MinLength(6)` `@MaxLength(128)` | `passwordHash` (N/A) | ✅ shoda |
| AU-04 | passwordConfirm (register) | `min(1)` + `refine` == password | — (jen `password` v DTO) | (N/A) | ✅ shoda (XF jen FE; BE `whitelist:true` bez `forbidNonWhitelisted` → tichý drop, ne 400) |
| AU-05 | acceptedTerms (register) | `bool` + `refine` === true | — (DTO nemá pole) | (N/A) | 🐛 **AU-D1** (GDPR souhlas se nikde nezaznamenává) |
| AU-06 | hp honeypot (register) | `max(0)` opt | — (DTO nemá pole) | (N/A) | ⚖️ by-design (WL drop; bot mimo FE projde bez honeypot kontroly — soft-fail záměr) |
| AU-07 | captchaToken (register) | — (state, ne zod) | `@IsOptional` `@IsString` `@MaxLength(2048)` | (N/A) | ✅ shoda (FE blokuje submit bez tokenu; `auth.service.register` vynutí `captcha.verify`) |
| AU-08 | identifier (login) | `min(1)` `max(255)` | `@IsString` `@MinLength(1)` `@MaxLength(255)` | (lookup email/username) | ✅ shoda |
| AU-09 | password (login) | `min(1)` | `@IsString` `@MinLength(1)` | `passwordHash` (N/A) | ✅ shoda |
| AU-10 | token (reset) | — (z URL query) | `@IsString` `@MinLength(32)` `@MaxLength(128)` | (hashovaný v DB) | ✅ shoda (FE posílá `token` z URL; DTO pole sedí — viz AU-D2 pro vedlejší pole) |
| AU-11 | newPassword / password (reset) | `min(8)` `max(128)` (`newPassword`) | auth `password`: `@MinLength(8)` `@MaxLength(128)`; users `newPassword`: `@MinLength(8)` `@MaxLength(128)` | `passwordHash` (N/A) | 🐛 **AU-D2** (FE→`/auth/reset-password` posílá `newPassword`, DTO čeká `password` → 400) |
| AU-12 | passwordConfirm (reset) | `string` + `refine` == newPassword | — | (N/A) | ✅ shoda (XF jen FE; tichý WL drop) |
| AU-13 | email (forgot) | `.email()` `min(1)` `max(255)` | `@IsEmail()` `@MaxLength(255)` | (lookup) | ✅ shoda |

---

## Kontrolní body (co u každého pole ověřit při sweepu)

- **AU-01 `LN`/`RG`** — FE `max(255)` ↔ register DTO `@IsEmail()` **bez** `@MaxLength`; forgot DTO `@MaxLength(255)` má. Email max v register nikde server-side → DB `lowercase` transform. Sjednotit limit napříč register/forgot? *(hot)*
- **AU-02 `RG`** — username regex `/^[^@]+$/` shodný FE↔DTO (jen zákaz `@`). Pozn. pro paritu: change-username flow (oblast 02, UP-06) má **jiný** přísnější regex `/^[a-z0-9-]+$/` — drift mezi register a change. Migrace: existující usernames s mezerami/velkými písmeny?
- **AU-03 vs AU-11 `LN`** — min délka hesla **nekonzistentní policy**: register 6 vs reset 8. FE↔BE v rámci flow sedí (6/6, 8/8), ale platforma má dvě prahy. Záměr?
- **AU-04/AU-12 `XF`** — `passwordConfirm` + `refine` existuje **jen na FE**; BE DTO posílá jen `password`/`newPassword`. To je OK (confirm je UX), ale ověřit, že FE confirm pole se přes `whitelist:true` tiše dropne, ne 400.
- **AU-05 `RQ`/`XF`** — `acceptedTerms` GDPR souhlas: FE `refine(v === true)`, DTO **pole nemá** → BE souhlas nevynutí ani nezaznamená. P3: tichý drop (whitelist). Ukládá se souhlas někde (consent log)? *(hot — compliance)*
- **AU-06 `LN`/`XF`** — honeypot `hp` `max(0)`: FE odmítne neprázdné; BE DTO pole nezná → bot, který obejde FE, projde k service bez honeypot kontroly. P3 soft-fail.
- **AU-07 `RQ`/`LN`** — captcha: FE blokuje submit při `!captchaToken` (component, ne zod), BE DTO `@IsOptional` + service vynutí verify. Ověřit, že dev test-keys vs prod chování sedí; `@MaxLength(2048)`.
- **AU-10 `LN`** — reset `token` DTO `min(32)/max(128)`; přichází z URL, FE nevaliduje. Ověřit shodu s formátem generovaného tokenu (service) a hashovaným uložením v DB.
- **AU-11 `NM`** — **dva reset DTO**: `auth/reset-password.dto.ts` má `password` (+ `token`), `users/reset-password.dto.ts` má `newPassword` (self-flow, bez tokenu). FE `resetPasswordSchema` pole zve `newPassword`. Ověřit, který endpoint FE volá a zda název pole sedí s cílovým DTO (jinak whitelist drop hesla = tiché selhání resetu). *(hot — NM/WL)*

---

## Delta parity (plní sweep)

> Sweep 2026-06-05 (akt. 2026-06-20). ValidationPipe = `whitelist:true, **forbidNonWhitelisted:true**, transform:true` (`backend/src/main.ts:53-56`, PC-07) → neznámá/přejmenovaná pole vrátí **400** (NE tichý drop). Required pole chybějící v body spadne na svém validátoru → 400.

**AU-D2** (🔴 K-F7 potvrzeno) `newPassword` vs `password` (reset z emailu) — FE: `POST /auth/reset-password` posílá `{ token, newPassword }` (`src/features/auth/api/useResetPassword.ts:24-25`, pole z `resetPasswordSchema.ts:5`) · BE DTO: `auth/reset-password.dto.ts:15` má pole **`password`** (`@IsString @MinLength(8) @MaxLength(128)`), `newPassword` nezná; controller `auth.controller.ts:156` čte `dto.password` · DB: `passwordHash` (N/A) · **rozpor:** `newPassword` se přes whitelist **tiše zahodí**, `password` v body chybí → `@IsString @MinLength(8)` selže → **400 Bad Request**. Reset hesla z emailu je **úplně rozbitý** (ne tichý drop hesla — tvrdá 400). Pozn.: druhé DTO `users/reset-password.dto.ts:4` MÁ pole `newPassword`, ale to obsluhuje admin-flow `PUT /users/:id/reset-password` (`users.controller.ts:511`), ne self-reset z emailu. · **dopad na data:** žádné nevalidní dokumenty (reset nikdy neproběhne); migrace ne. · **návrh:** sjednotit název — buď FE posílat `password`, nebo přejmenovat pole v `auth/reset-password.dto.ts` na `newPassword` (+ controller). FE→`password` je menší změna a drží konzistenci s `auth` flow.

**AU-D1** (🔴 K-F8 potvrzeno) `acceptedTerms` (GDPR souhlas) — FE: `registerSchema.ts:21-25` `refine(v === true)` + odesílá `acceptedTerms` (`RegisterModal.tsx:130`) · BE DTO: `auth/register.dto.ts` pole **nemá** (jen email/username/password/captchaToken) · DB: `user.schema.ts` žádné consent pole · **rozpor:** `acceptedTerms` se přes whitelist **tiše dropne**; `auth.service.register` (`auth.service.ts:79-120`) pole nikde nečte ani neukládá, žádný consent/audit log neexistuje. Souhlas vynucuje **jen FE** — BE o něm po dropu neví nic. · **dopad na data:** existující účty nemají záznam souhlasu (a po opravě ho mít nebudou bez backfillu); migrace ano, pokud se vyžaduje audit trail souhlasu zpětně. · **návrh:** přidat `acceptedTerms` do DTO + persistovat timestamp/verzi souhlasu na user (např. `termsAcceptedAt`); kompliance rozhodnutí (je to právní požadavek?) eskalovat uživateli před implementací.

## Round-trip / migrační poznámky

> _AU-02 username regex: existující data mohou mít znaky mimo budoucí přísnější pravidlo (viz UP-06). AU-05 acceptedTerms: pokud se přidá perzistence souhlasu, backfill existujících účtů. AU-11 NM: ověřit cílový endpoint resetu před případnou změnou názvu pole._
