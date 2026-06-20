# error-contract / 07-fe-consumption — checkpoint RUN-2026-06-20-1621

## Pokrytí

Prošel jsem:
- `src/shared/api/client.ts` — axios interceptor, `parseApiError`, `parseApiErrorCode`
- `src/shared/api/__tests__/parseApiError.spec.ts` + `parseApiError.fuzz.spec.ts` — M-FE testy
- `src/shared/types/index.ts` (`ApiError` interface) + `src/shared/types/errorCodes.generated.ts`
- `src/shared/api/index.ts` (export)
- `src/shared/ui/GlobalErrorBoundary.tsx` + `src/app/main.tsx`
- `src/pages/errors/ForbiddenPage.tsx` + `NotFoundPage.tsx` + `ErrorPage.tsx`
- `src/features/chat/api/socket.ts` (F5 / globální `socket.on('error')`)
- `src/features/auth/components/RegisterModal.tsx` — field-mapping (EMAIL_TAKEN/USERNAME_TAKEN)
- `src/features/auth/pages/ResetPasswordPage.tsx` — code→message switch
- `src/features/profile/components/ChangeEmailModal.tsx` — field-mapping (EC-08 fix)
- `src/features/world/pages/CharacterDetailPage/components/SubdocErrorState.tsx` — NOT_APPLICABLE branch
- `src/features/friendships/api/useFriendshipMutations.ts` — ALREADY_FRIENDS/REQUEST_EXISTS
- `backend/src/common/filters/http-exception.filter.ts` — @Catch() + F1/F2
- `backend/src/common/pipes/validation-exception.factory.ts` — F2 fields
- M-GREP + M-CONTRACT scan (live run: `node scripts/error-contract-scan.mjs --ci`)
- vitest run `src/shared/api` (13/13)

## Dosažená L vs cílová L

- **FE osa**: L5 (parser testy 13/13 + M-CONTRACT drift 0 + statické čtení) ✅
- **RT osa** (refresh): L2 (statické čtení) ✅
- **BD osa** (boundary): L1 (čtení) ✅
- **Cílová osa FE/RT/BD**: L2–L3 → L3 dosažena (statika + kontext dosažitelnosti)

## Nálezy

### EC-RUN-01 — `FE`/`VA` — `ApiError` typ neobsahuje `fields`; BE F2 field-mapping FE nikdy nepřečte — L2 🆕

**Kde:** `src/shared/types/index.ts:1005-1011`

BE `HttpExceptionFilter` (F2) posílá `{error:{code:'VALIDATION', message:[], fields:{}, timestamp}}` — `fields` je field-level mapování validačních chyb pro `setError()`. Ale:
1. `ApiError` interface na FE (`index.ts:1005`) nemá pole `fields` — TypeScript kód k němu nikdy bezpečně přistoupit.
2. Žádný FE form handler nečte `error.fields` — grep napříč celým `src/` vrátil 0 hitů na `data.error.fields` nebo `error.fields`.
3. `parseApiError`/`parseApiErrorCode` `fields` neexponují.

**Dopad:** Celý F2 (validationExceptionFactory + field-mapping) je na straně FE mrtvý. Validační chyby se zobrazí jen jako `toast.error(parseApiError(err))` s první CS hláškou z `message[0]` — bez `setError('fieldName', ...)`. Uživatel neví, které konkrétní pole je špatné. BE dělá práci navíc (sestavuje `fields{}`), FE ji ignoruje.

**Návrh:** (1) Přidat `fields?: Record<string, string[]>` do `ApiError` interface; (2) přidat `parseApiErrorFields(err)` do `client.ts`; (3) v klíčových formulářích (RegisterModal, ChangeEmailModal, WorldSettingsPage atd.) při `code==='VALIDATION'` volat `for (const [field, msgs] of Object.entries(fields)) setError(field, {message: msgs[0]})`.

**Závažnost:** 🟡 (UX degradace — CS hlášky se zobrazí, ale bez field-mappingu; kontrakt OK, konzumace neúplná)

---

### EC-RUN-02 — `BD` — `GlobalErrorBoundary` bez fallback route-boundary; ErrorPage router boundary existuje ale má minimální UI — L1 🆕

**Kde:** `src/shared/ui/GlobalErrorBoundary.tsx:11-37` + `src/pages/errors/ErrorPage.tsx:1-18`

`GlobalErrorBoundary` zobrazí anonymní "Něco se pokazilo" + "Obnovit stránku" — bez kontextu, bez reportu, bez odkazu na home. `ErrorPage` (router `errorElement`) zobrazí `message` (může být EN `statusText` z react-router) bez stylování a bez dalšího UX vodítka. `ForbiddenPage`/`NotFoundPage` jsou plain `<div>` bez stylu, odkaz jen na `/`.

**Dopad:** Při route-level chybě uživatel vidí nestyled chybovou stránku EN/CS mix v závislosti na chybě. Žádná navigace zpět do světa / kontextu. (K-EC10 z plánu — nový nález doplňuje detaily aktuálního stavu.)

**Návrh:** Přidat minimalní CSS k error stránkám (theme-consistent), vodit uživatele zpět do kontextu (svět, home). Samostatný `ErrorBoundary` pro world-layout catch 403/404 bez pádu celé appky. ⚠️ Observabilita-dluh (no reporting) = K-EC10 existuje v dluhech.

**Závažnost:** 🟡 (UX maintenance; neleakuje, neopravňuje)

---

### EC-RUN-03 — `RT`/`FE` — `socket.on('error')` zachytí chybu ale jen loguje; uživatel bez zpětné vazby — L2 ♻️

**Kde:** `src/features/chat/api/socket.ts:40-42`

F5 (EC-06 fix) přidal globální záchyt server-push `error` eventů — `socket.on('error', (payload) => console.error(...))`. Chyba se neztrácí, ale uživatel o ní neví. Složky s vlastním UX (taktická mapa) si přidávají vlastní listener pro toast — ale chat (app.gateway `return {error:string}` jako ack) žádný vlastní UX nemá a FE chat nikde neemituje s ack callbackem.

**Dopad:** Server-push WS error → jen console.log, žádný toast/inline info. Uživatel operaci opakuje bez vysvětlení. (Stav po F5 = zlepšení oproti tiché ztrátě, ale stále nulová UX zpětná vazba pro globální WS chyby.)

**Návrh:** Přidat `toast.error(...)` nebo `toast.info(...)` do globálního fallback listeneru — aspoň generická CS hláška "Síťová chyba, zkus akci znovu." Nebo zajistit, že každý emit s ack callbackem výsledek zkontroluje.

**Závažnost:** 🟡 (uživatel bez zpětné vazby na WS chyby; cross-ref EC-06 — dřív otevřeno jako follow-up)

---

## Ověřené seed kandidáty (z plánu oblasti 07)

| Seed | Stav | Detail |
|---|---|---|
| **K-EC7** dup `ApiError` | ✅ OPRAVENO (F6) | `ResetPasswordPage` + `ChangeEmailModal` importují `parseApiErrorCode` z `@/shared/api`, ne lokální interface. Jediný kanonický `ApiError` v `shared/types/index.ts:1005`. |
| **K-EC8** silent refresh-fail | ✅ OPRAVENO (F6) | `client.ts:81` — `toast.info('Přihlášení vypršelo...')` před logout. |
| **K-EC10** boundary bez reportu | 🟡 POTVRZENO | `GlobalErrorBoundary` jen `console.error`, žádný report — dluh. Stav plánu = otevřeno jako observabilita/dluh (K-EC10). |

## Pozitiva

- `parseApiError` centrální + bezpečný (`unknown` param, `isAxiosError` guard, `String()` cast na primitiva, fallback `'Neznámá chyba'`). ✅
- Žádný lokální dup `interface ApiError` — 0 hitů mimo `shared/types/index.ts`. ✅
- `socket.on('error')` globální záchyt přidán (F5). ✅
- M-CONTRACT live: **drift 0** (FE kódy 30 × BE 860 — žádná mrtvá FE větev po fixech). ✅
- M-FE parser testy: **13/13** (spec 8 + fuzz 5). ✅
- `retry:1` query default — ne agresivní 4xx retry. ✅
- `errorCodes.generated.ts` — sdílený typ s BE, 297 kódů, CI guard. ✅
- BE: `@Catch()` catch-all filtr, CastError→400, E11000→409, Multer CS, 0 mrtvých `statusCode`. ✅

## Srovnání s baseline 2026-06-14

Scanner scan 2026-06-20: 860 throwů (↑ z 818) · 313 BE code literálů (↑ z 268) · 0 mrtvých statusCode (↓ z 161) · drift 0 → BE narostl, fixy drží.

## PROOF-REQUEST

Žádná vrstva nevyžaduje live-infra proof (tvar #3 = L9 fault injection ověřen v předchozím běhu).

- **Doporučeno (ne blocker):** Smoke test validačního formuláře s badRequest — ověřit empiricky, že FE skutečně nezobrazí field-level chybu u pole (potvrdí EC-RUN-01 runtime).
