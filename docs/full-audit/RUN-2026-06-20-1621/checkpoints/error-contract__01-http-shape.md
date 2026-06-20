# error-contract / 01-http-shape — checkpoint RUN-2026-06-20-1621

## Pokrytí

Prošel jsem:
- `http-exception.filter.ts` (celý, vč. spec) — L1 + statická analýza
- `main.ts` — registrace filtru a ValidationPipe
- `validation-exception.factory.ts` — exceptionFactory
- M-GREP scan (860 throwů, `--list` string-only 28 souborů)
- M-CONTRACT scan (drift=0, 30 FE kódů, 313 BE kódů)
- Manuální prohledání: `statusCode` v tělech, `UnsupportedMediaTypeException/BadGatewayException/InternalServerErrorException/GoneException/ServiceUnavailableException` throwů, `upload.service.ts`, `security-tokens.service.ts`, `global-chat.service.ts`, `bestiae.service.ts`, `sounds.service.ts`, `world-access-request.repository.ts`, `friendships.service.ts`, `game-events.service.ts`
- Kontrola `@UseFilters` přetížení (žádné)
- Kontrola `multer-exception.filter.ts` (smazán ✅)
- `HttpStatus[status]` reverse-lookup edge cases (všechny použité statusy mají string)

## Dosažená L vs cílová L

| Osa | Cílová L | Dosažená L | Poznámka |
|---|---|---|---|
| EX (exception shape) | L4 (e2e probe) | **L2** (statické čtení + M-GREP) | L4 (M-SHAPE e2e) = live infra → PROOF-REQUEST |
| CO (code contract) | L5 | **L2** (M-CONTRACT drift=0) | L4/L5 čeká M-SHAPE |

Statická L2 jistota: filtr ověřen čtením + testové spec + scan. Běhový důkaz (M-SHAPE 12/12) byl ověřen dříve (2026-06-14) a opravy F1-F6 hotové — ale re-proof s aktuálním HEAD nepouštěn.

## Nálezy

### EC-RUN-01 `EX`/`LK` — InternalServerErrorException s interním template stringem dosahuje klienta — Kde: `global-chat.service.ts:182` · Dopad: `500 INTERNAL_SERVER_ERROR`, `message:"Global channel 'ikaros' not initialized"` — interní detail o channelové mapě sdělí klientovi; HttpException (ne ne-HTTP), takže prochází HttpException větví filtru a string se propaguje; filtr ho NEzastaví jako INTERNAL (catch-all branch) · Návrh: změnit na `{code:'INTERNAL_SERVICE_ERROR', message:'Vnitřní chyba serveru'}` nebo let re-throw jako obyčejný Error (catch-all ho zachytí a zaloguje bez leaku) · L2 · 🆕 · 🟠

### EC-RUN-02 `EX` — statusCode: 400 přežil F6 codemod v metodě `return new Exception()` — Kde: `security-tokens.service.ts:126` (`invalidTokenException()` private method) · Dopad: `return new BadRequestException({statusCode:400, message:'Token je neplatný', code:'INVALID_TOKEN'})` — scanner hledá `throw new *Exception`, tato forma ho mine → `statusCode` dead field přetrval; runtime: beze dopadu (filtr ignoruje), ale klame čtenáře + je to přesně vzor, který byl odstraňován comodem; scanner hlásí 0 dead fields (nepravda) · Návrh: odebrat `statusCode: 400` ze payloadu · L2 · 🆕 · 🟡

### EC-RUN-03 `EX` — scanner blind-spot: `return new Exception({statusCode})` nedetekuje — Kde: `scripts/error-contract-scan.mjs:45,108` (regex `throw\s+new\s+...`) · Dopad: M-GREP `statusCode in body: 0` je nepravdivé pro třídy s `private/helper` metodami vracejícími exception objekty → CI guard slepý na tento vzor · Návrh: rozšířit regex na `new\s+\w+Exception\s*\(` (bez `throw`) pro `statusCode` detekci; nebo grep přes celý soubor (ne jen throw loci) · L2 · 🆕 · 🟡

### EC-RUN-04 `EX`/`LN` — misleading string-only ConflictException('PENDING_ACCESS_REQUEST') — Kde: `world-access-request.repository.ts:86` · Dopad: string `'PENDING_ACCESS_REQUEST'` jde do `message` pole, `code` = generické `'CONFLICT'`; vypadá jako kód, ale je to message; FE `useRequestAccess` nemá handler → generický toast; pattern lze zaměnit za `code` při čtení kódu · Návrh: změnit na `ConflictException({code:'PENDING_ACCESS_REQUEST', message:'Žádost o vstup již čeká'})` pro konzistenci s ostatními throws · L2 · 🆕 · 🟡

### EC-RUN-05 `LK` — sounds.service.ts conflict message obsahuje interní DB ID — Kde: `sounds.service.ts:106,136` · Dopad: `"Duplicitní zvuk: ${duplicate.name} (${duplicate.id})"` — MongoDB ObjectId (`duplicate.id`) se pošle klientovi jako součást message; cesta je admin-only (createGlobalSound/nominateToGlobal), takže dosah omezený, ale ID je interní identifikátor; zbytečný leak · Návrh: vynechat `id` z message: `\`Duplicitní zvuk: ${duplicate.name}\`` · L2 · 🆕 · 🟡

### Bekverze (potvrzena z předchozího auditu, HEAD nezměněn)

- ✅ EC-01 (UE — catch-all filtr) opraveno: `@Catch()` ✅, MulterError 413/400 ✅, CastError→400 ✅, E11000→409 ✅, INTERNAL bez stack leaku ✅
- ✅ EC-05 (161× statusCode dead) odstraněno comodem (scanner: 0) — 1 survivor EC-RUN-02 (return, ne throw)
- ✅ EC-10 (MulterExceptionFilter pátý tvar) sloučeno, soubor smazán ✅
- ✅ EC-11 (E11000→500) opraveno catch-all větví ✅
- ✅ EC-12 (parseApiError String() guard) opraveno ✅
- ✅ `HttpStatus[status] ?? 'UNKNOWN_ERROR'` fallback přidán (filter:67) ✅
- ✅ M-CONTRACT drift = 0 ✅
- ✅ 860 throwů, 96 % s doménovým kódem (825/860) ✅

## PROOF-REQUEST

**PR-01 (L4 M-SHAPE re-proof):** M-SHAPE e2e suite (`backend/test/error-contract.e2e-spec.ts`) — spustit proti aktuálnímu HEAD (`npx jest --config ./test/jest-e2e.json error-contract --runInBand`) a ověřit 12/12. Blocker: live MongoDB (supertest + testDB nebo in-memory). Vyžaduje BE prostředí. Cíl: potvrdit, že opravy F1-F6 + nové chování filtru fungují end-to-end, ne jen čtením.

**PR-02 (InternalServerErrorException dosažitelnost):** ověřit, za jakých podmínek `GlobalChatService.getChannelId()` vrátí prázdný kanál (restart bez init?). Pokud je to reálně dosažitelné za provozu, EC-RUN-01 eskalovat na 🟠; jinak 🟡.
