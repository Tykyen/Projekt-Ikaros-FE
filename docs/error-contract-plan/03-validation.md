# 03 — Validation errors (`VA` `LN`)

> **Otázka:** jak vypadají class-validator chyby na výstupu — **jazyk** (CS nebo EN?), `string[]` vs string,
> a mapují se na **konkrétní pole** formuláře, nebo se jen vyhodí toast s první anglickou větou?

## Povrch
- `ValidationPipe` ([main.ts:23-29]) — `whitelist + forbidNonWhitelisted + transform`, **bez `exceptionFactory`**.
- DTO třídy s `class-validator` dekorátory (`@IsEmail`, `@IsNotEmpty`, …) — default EN hlášky.
- FE `parseApiError` ([client.ts:91-94]) — `Array.isArray(msg) ? msg[0]`.
- FE field-mapping: `setError` z `parseApiErrorCode` — ale validační tvar má `code='BAD_REQUEST'` (generický), **žádný field info**.

## Kontrolní body
- [ ] **Jazyk** — class-validator default = EN (`"email must be an email"`). Mají DTO `{ message: '...' }` v dekorátorech (CS)? Namátkou napříč moduly → kolik DTO lokalizováno. `LN`. **K-EC2.**
- [ ] **`string[]` ztráta** — FE bere jen `msg[0]` → při více vadných polích uživatel vidí jen jednu. `VA`/`FE`.
- [ ] **Field-mapping** — validační chyba nenese název pole v `code` → FE nemůže `setError('email')`. Lze z `message` parsovat pole? (křehké). Doporučený fix: `exceptionFactory` → `{code:'VALIDATION', fields:{email:[...]}}`.
- [ ] **`forbidNonWhitelisted`** ([PC-07]) — neznámé pole → 400 `"property X should not exist"` (EN). FE to ukáže? Drift FE↔BE se projeví jako matoucí EN hláška uživateli.
- [ ] **Transform edge** — `transform:true` + špatný typ (string→number) → jaká hláška/tvar?
- [ ] **Vnořené DTO / pole** — `@ValidateNested`/`@IsArray` → tvar `message` (cesta `items.0.name`)?

## Metoda
M-SHAPE (pošli nevalidní DTO → assert tvar `string[]` + status 400 + jazyk) → L4. M-FUZZ (malformed → vždy 400 tvar).

## Seed
`K-EC2` (EN hlášky + `string[]` + bez field-mappingu 🟠).
