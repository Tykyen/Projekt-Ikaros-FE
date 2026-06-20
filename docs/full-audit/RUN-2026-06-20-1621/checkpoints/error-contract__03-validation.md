# error-contract / 03-validation — checkpoint RUN-2026-06-20-1621

## Pokrytí

Prošel jsem:
- `backend/src/main.ts` — ValidationPipe konfigurace (`exceptionFactory`, `forbidNonWhitelisted`, `transform`)
- `backend/src/common/pipes/validation-exception.factory.ts` — `csMessage` mapa, `collect` (nested/array), `validationExceptionFactory`
- `backend/src/common/filters/http-exception.filter.ts` — jak filtr propouští `fields` (F2)
- `backend/src/modules/maps/operations/operation-payload-validator.service.ts` — `validateSync` bypass
- `backend/src/modules/auth/dto/` — registrace, login, reset-password, forgot-password, register.dto.ts
- Celková statistika: `grep @Is* @Min* @Max* @Match* @Array* @Validate*` přes všechna DTO (~150 souborů)
- `src/shared/api/client.ts` — `parseApiError`, `parseApiErrorCode` (žádný `parseApiErrorFields`)
- `src/shared/types/index.ts:1005` — `ApiError` typ (nemá `fields`)
- `src/shared/api/__tests__/parseApiError.spec.ts` — M-FE testy (tvar #2 stale)
- `src/shared/api/__tests__/parseApiError.fuzz.spec.ts` — fuzz invariant
- `src/features/auth/components/RegisterModal.tsx` — field-mapping vzor (přes `parseApiErrorCode`)
- `src/shared/api/index.ts` — exporty (žádný `parseApiErrorFields`)
- `errors.txt` scanner výstup (860 throwů, drift 0)

Osy VA + LN, cílová L: L3 (statika + dosažitelnost). Provedeno: L1–L3.
Vrstvy vyžadující živou infru (L4 e2e probe, M-SHAPE) = PROOF-REQUEST.

## Dosažená L vs cílová L

| Osa | Dosažená | Cílová |
|-----|----------|--------|
| VA — validační tvar (jazyk, field-mapping) | L3 | L4 |
| LN — lokalizace constraint hlášek | L3 | L3 |

## Nálezy

### EC-RUN-01 — [VA] `fields` z `exceptionFactory` FE nikde nečte — dead payload · Kde: `src/shared/api/client.ts` (žádný `parseApiErrorFields`), `src/shared/types/index.ts:1005` (`ApiError.error` bez `fields`), `backend/src/common/filters/http-exception.filter.ts:38` (filtr `fields` propouští) · Dopad: BE (F2) posílá `{error:{code:'VALIDATION',fields:{email:[...]},…}}`, ale FE nemá pomocnou funkci ani typ pro přečtení `fields` → field-level mapping přes `VALIDATION` kód je mrtvý; formy mapují přes doménové kódy (`EMAIL_TAKEN` atd.), ne přes `fields` → F2 plní kontrakt na BE, ale FE nevyužívá · Návrh: přidat `parseApiErrorFields(err): Record<string,string[]>|null` do `client.ts` + exportovat + rozšířit `ApiError.error` o `fields?: Record<string,string[]>` · L2 · 🆕

### EC-RUN-02 — [VA/LN] `csMessage` nepokrývá ~8 běžných constraint klíčů → EN fallback · Kde: `backend/src/common/pipes/validation-exception.factory.ts:21-55` (switch bez case pro `matches`/`isIn`/`isObject`/`arrayMinSize`/`arrayMaxSize`/`arrayNotEmpty`/`nestedValidation`/`isHexColor`/`equals`) · Dopad: validační chyba pro tyto constrainty projde jako EN hláška přímo z class-validator (např. `"color must match … expression"`, `"status must be one of the following values: open, done"`, `"nested object confirmations must be either object or array"`). User-facing cesty: chat (create-group iconKey/color bez message), emotes, chat message `@ArrayMaxSize(10)`, reorder `@ArrayMinSize(1)`, calendar `@ValidateNested` → `nestedValidation` EN · Záběr: ~12 DTOs se zákazníckými endpointy · Návrh: doplnit case větve pro chybějící constraint klíče do `csMessage`; alternativně přidat default-with-localization pomocí constaint name → fallback CS template · L2 · 🆕

### EC-RUN-03 — [VA/LN] `operation-payload-validator.service.ts:67` — `formatErrors` bypasuje `csMessage`, posílá EN concat · Kde: `backend/src/modules/maps/operations/operation-payload-validator.service.ts:67-80` · Dopad: map operace (`POST /api/maps/:id/operations`, `POST /api/maps/worlds/:worldId/operations`) validují přes `validateSync` s vlastním formátovačem `constraints[key]` (raw EN class-validator text, formát `"property: english message"`) — mimo globální `validationExceptionFactory`. FE dostane `code:'MAP_OP_INVALID'` (doménový ✅), ale `message` je EN a nevyhovuje CS UX; navíc tvar je plain string ne `string[]` s `fields` → `parseApiError` vrátí EN string do toastu · Dosažitelnost: REST endpointy (PJ/mapa editace) · Návrh: refaktorovat `formatErrors` aby volal `csMessage`/`validationExceptionFactory`, nebo zajistit vždy CS `message` · L2 · 🆕

### EC-RUN-04 — [VA] M-FE test `parseApiError.spec.ts:25-26` — stale tvar #2 (hardcode `BAD_REQUEST` → BE posílá `VALIDATION`) · Kde: `src/shared/api/__tests__/parseApiError.spec.ts:21-27` · Dopad: test tvrdí `expect(parseApiErrorCode(e)).toBe('BAD_REQUEST')` ale F2 (exceptionFactory) změnilo `code` na `'VALIDATION'`; test se pouští na mock tvaru, ne na reálné BE odpovědi, ale dokumentuje nesprávný kontrakt → matoucí pro další vývojáře + selže pokud někdo aktualizuje mock na reálný tvar · Návrh: aktualizovat tvar #2 testu na `{ code: 'VALIDATION', message: [...], fields: {...} }` a upravit assertion `toBe('VALIDATION')` · L1 · 🆕

## PROOF-REQUEST

**PR-01** — L4 `M-SHAPE` e2e probe validační chyby: reálný POST s nevalidním tělem (chybějící `email`, extra pole) → assert `{error:{code:'VALIDATION', message:string[], fields:{...}, timestamp}}` + status 400. Ověřit i `forbidNonWhitelisted` (extra pole) → `code:'VALIDATION'` + `message:['Neznámé pole „X".']`. Bez live e2e nelze potvrdit, že `exceptionFactory` je skutečně zavolán na každém endpointu (ne jen v unit testu factory).

**PR-02** — L4 `M-SHAPE` pro `POST /api/maps/:id/operations` s nevalidní op: ověřit, co klient skutečně dostane (`MAP_OP_INVALID` + EN message vs CS); bez spuštění serveru nelze vyloučit, že `formatErrors` není obalen na úrovni calling service jiným handlerem.
