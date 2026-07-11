# error__03-validation (VA · LN) — checkpoint RUN-2026-07-11-1213

Oblast: `docs/error-contract-plan/03-validation.md` · osy `VA` `LN` · registr `docs/error-contract-audit.md` (prefix EC-)
Hloubka dosažena: **L2** (statika `main.ts` + `validation-exception.factory.ts`). READ-ONLY.
Verdikt: **žádný 🔴, žádný ⭐**. EC-02 opraveno a od té doby **dále zjednodušeno** (odstraněn nekonzumovaný field-mapping). Kontrakt validace drží.

## Co ověřeno (pozitiva — L1/L2)
- **`exceptionFactory` aktivní** (`main.ts:66-73`) → `validationExceptionFactory` (`common/pipes/validation-exception.factory.ts`). Výstup: `BadRequestException({code:'VALIDATION', message: string[]})` → filtrem do `{error:{code:'VALIDATION',message,timestamp}}`. EC-02 (EN + generic `BAD_REQUEST`) uzavřeno.
- **CS lokalizace** ~16 nejčastějších constraintů (`isNotEmpty/isEmail/isString/isInt/minLength/maxLength/min/max/isUrl/isMongoId/isArray/whitelistValidation…`) přes `csMessage`. Neznámý constraint → ponechá EN fallback (info se neztratí).
- **Custom hlášky z dekorátorů respektovány** (`DEFAULT_EN_SIGNATURE` guard, FIX-45): pokud `@MinLength(1,{message:'…'})` ≠ default EN signatura, factory ji **nepřepíše** → žádná regrese vlastních CS hlášek.
- **`forbidNonWhitelisted`** (`main.ts:69`, PC-07) → neznámé pole → constraint `whitelistValidation` → CS „Neznámé pole „X"" (ne EN „should not exist").
- **Vnořená DTO** — `collect()` rekurzivně čte `err.children` → i vnořené chyby se zplošťují do `message[]`.

## Nálezy

### 🆕 CHANGE — `fields{}` field-mapping ODSTRANĚN oproti registru (FIX-24) — ⚖️ L1
Registr F2 popisuje `exceptionFactory` jako emitující `fields:{[pole]:string[]}` pro field-level `setError`. HEAD (`validation-exception.factory.ts:12-14`) tento `fields` **záměrně smazal** — komentář FIX-24: „FE ho nikde nekonzumoval (0 výskytů `.error.fields`) — mrtvý kód, odstraněno spolu s propagací v `HttpExceptionFilter`". → validační chyby dnes jdou jen jako `message[]` (toast/první věta). By-design zjednodušení, ne regrese; jen registr je v tomto bodě zastaralý.

### ♻️ VA/FE residual — `message: string[]`, FE ukáže jen `msg[0]` — 🟡 L1 (by-design)
`parseApiError` (`client.ts:134`) bere `Array.isArray(msg) ? msg[0] : msg` → při více vadných polích uživatel vidí jen první CS větu. Beze změny od registru; přijaté (bez field-mappingu je toast s první vadou dostatečný pro krátké formuláře, FE navíc validuje zod-schématy klientsky před odesláním).

## Kontrolní body (03-validation.md)
- [x] Jazyk — CS přes `csMessage` (~16 constraintů) ✅; neznámé → EN fallback
- [x] `string[]` ztráta — jen `msg[0]` ve FE (residual 🟡, by-design)
- [x] Field-mapping — `fields{}` odstraněn (🆕 FIX-24, ⚖️); dnes žádný field-level z validace
- [x] `forbidNonWhitelisted` — CS „Neznámé pole" ✅
- [x] Transform edge / vnořené DTO — `collect()` rekurzivní, `children` pokryty ✅
- [x] `code:'VALIDATION'` doménový — FE pozná validační chybu ✅

Metoda: M1 (Read `main.ts` + `validation-exception.factory.ts`), 2026-07-11. M-SHAPE/M-FUZZ (L4/L8 nevalidní DTO) nespuštěno (READ-ONLY).
