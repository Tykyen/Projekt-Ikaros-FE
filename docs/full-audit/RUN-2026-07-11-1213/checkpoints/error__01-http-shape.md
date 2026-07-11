# error__01-http-shape (EX) — checkpoint RUN-2026-07-11-1213

Oblast: `docs/error-contract-plan/01-http-shape.md` · osa `EX` · registr `docs/error-contract-audit.md` (prefix EC-)
Hloubka dosažena: **L2** (statika L1 + strojová klasifikace M-GREP `error-contract-scan.mjs`). Žádná e2e/L4 vrstva nespuštěna (READ-ONLY).
Verdikt: **žádný 🔴, žádný ⭐**. Kontrakt tvaru drží líp než v době registru (jediný catch-all filtr). Nové jen kosmetika/semantika (🟡).

## Co ověřeno (pozitiva — L1/L2)
- **Jediný sjednocující filtr.** `src/common/filters/http-exception.filter.ts:26` je `@Catch()` (catch-all, F1). Grep `@Catch(` v celém BE → **jediný výskyt**. Bývalý `MulterExceptionFilter` sloučen a smazán (registr F1). Registrace jen 1× (`main.ts:77-78`). → tvar #3/#5 z registru (ne-HTTP mine filtr, Multer divergentní tvar) **uzavřeny**, žádný druhý shape se nevrátil.
- **Filtr pokrývá všechny cesty do `{error:{code,message,timestamp}}`:** HttpException (ř.78), Multer (ř.102), Mongoose CastError→400 `INVALID_ID` (ř.118), duplicate key E11000→409 `DUPLICATE_KEY` (ř.127), oversized body→413 (ř.138), malformed JSON→400 `INVALID_JSON` (ř.149), fallback→500 `INTERNAL` s server-side logem bez leaku stacku (ř.159-169). Pokrytí **širší** než registr (přibyly 413 + INVALID_JSON větve, FIX-52/53).
- **`code` fallback zpevněn:** `HttpStatus[status] ?? 'UNKNOWN_ERROR'` (ř.92-95) — edge `HttpStatus[418]`=undefined nyní nepadá na undefined (registr měl holý `HttpStatus[status]`). Kontrolní bod „code fallback" ✅.
- **M-CONTRACT FE↔BE drift = 0** (`node scripts/error-contract-scan.mjs`): FE 29 handlerů/41 kódů, žádná mrtvá větev. EC-03/EC-04 (dřívější drift) nezregresovaly.

## Nálezy

### ♻️ EC-05 residual — 1× mrtvé pole `statusCode` v těle (scan blindspot) — 🟡 L2
Scan hlásí `statusCode v těle: 0`, ALE grep našel živý zbytek:
`src/modules/security-tokens/security-tokens.service.ts:124-129`
```ts
private invalidTokenException(): BadRequestException {
  return new BadRequestException({
    statusCode: 400,   // MRTVÉ — filtr bere getStatus(), tělo statusCode ignoruje
    message: 'Token je neplatný',
    code: 'INVALID_TOKEN',
  });
}
```
Codemod F6 (`strip-throw-statuscode.mjs`) i scan `error-contract-scan.mjs` matchují jen `throw new *Exception({...statusCode...})`; tady je pole ve **factory metodě** (`return new ...`, throwne se jinde přes `throw this.invalidTokenException()`), takže obě nástroje ho **minou**. Bez runtime dopadu (status správný z třídy), jen klame čtenáře + slepé místo scanu. Třída EC-05.

### ♻️ EC-07 — 40/1004 throwů (4 %) bez doménového kódu → generic fallback — 🟡 L2
M-GREP: 39 string-literál + 1 objekt-bez-code (registr: 31/818; poměr stejný ~4 %, roste s codebase 818→1004 throwů/73→87 souborů). Filtr jim dá `code=HttpStatus[status]`. Nové string-only přírůstky:
- `src/modules/upload/upload.service.ts:232,286,406,462,656` — `throw new BadGatewayException('Chyba při nahrávání souboru na Cloudinary')` (5×, CS text, bez kódu → `code='BAD_GATEWAY'`).
- `src/modules/global-chat/global-chat.service.ts:314` `InternalServerErrorException('Global channel ... not initialized')` (EN interní), `:725` `'Uložení hry selhalo'` (CS) → `code='INTERNAL_SERVER_ERROR'`.
- `src/modules/game-events/game-events.service.ts:403` `BadRequestException('parentId musí ukazovat na root komentář')`.
Většina interní/gateway/edge cesty, kde stačí text (FE jen zobrazí). Neeskaluji — ⚖️ jako v registru. De-facto pokračování EC-07.

### 🆕 EX status-semantika — cluster „400 místo 409" u stavových konfliktů — 🟡 L1
Anti-pattern „všechno je 400" z checklistu: stavové konflikty („už …") hozeny jako `BadRequestException` (400), sémanticky 409 Conflict. Všechny **mají doménový kód**, takže FE mapuje přesně dle kódu, ne dle statusu → funkčně neškodné, jen HTTP sémantika nepřesná:
- `src/modules/auth/auth.service.ts:626-628` `ALREADY_VERIFIED` (Email je již ověřený)
- `src/modules/worlds/worlds.service.ts:1413` `ALREADY_HAS_CHARACTER_ROLE`; `:1844-1846` `WORLD_ALREADY_DELETED` (Svět už je smazán)
- `src/modules/security-tokens/security-tokens.service.ts:68-70,103-105` `ALREADY_USED` (Token byl už použit)
- `src/modules/ikaros-discussions/ikaros-discussions.service.ts:383-384` `DISCUSSION_ALREADY_APPROVED`
Registr tuto skupinu neenumeruje (EX závěr byl „status = z třídy → vždy správný", což řeší mechaniku, ne volbu třídy). Nízká priorita — doporučená konzistence 409 pro „already", ne fix. Weather/currency duplicitní-`ids` (`world-weather:291`, `world-currencies:69`) jsou vstupní validace pole → 400 obhájitelné.

### 🆕 EX — not-found reference jako 400 + generic code — 🟡 L1
`src/modules/game-events/game-events.service.ts:398-401` — chybějící `parentId` komentář → `BadRequestException` s `code:'BAD_REQUEST'` (generický HTTP name jako doménový kód, message „parentId neexistuje v tomto eventu"). Kombinuje 400-místo-404 + generic code (FE nemůže field-mapovat, jen text). parentId je body-reference, 400 obhájitelné; kód `BAD_REQUEST` je ale de-facto ne-doménový (nerozliší se od fallbacku). Drobnost, spadá i pod EC-07.

## Kontrolní body (01-http-shape.md)
- [x] Tvar — vše přes 1 catch-all filtr do `{error:{code,message,timestamp}}` ✅ (líp než registr, Multer sloučen)
- [x] Status sémantika — cluster 400-místo-409 u „already" konfliktů (🆕 🟡, viz výše); jinak status z třídy korektní
- [x] String vs objekt message — 39 string-only (EC-07 ♻️, poměr 4 % beze změny)
- [x] Mrtvé `statusCode` — scan 0, ale 1 residual ve factory (blindspot, EC-05 ♻️)
- [x] `code` fallback — `HttpStatus[status] ?? 'UNKNOWN_ERROR'` (418 edge OK) ✅
- [x] `message:'Error'` fallback — jen když HttpException má objekt bez `message` klíče; doménový code zůstává, žádný leak (neškodné)

Metoda: M1 (Read filtru + zdrojů) + M-GREP (`node scripts/error-contract-scan.mjs`, 2026-07-11). M-SHAPE/L4 nespuštěno (READ-ONLY audit).
