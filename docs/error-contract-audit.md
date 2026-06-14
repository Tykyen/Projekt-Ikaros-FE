# Error contract audit — registr nálezů (dostane klient vždy stejný čitelný tvar chyby, nebo se kontrakt tiše rozjíždí?)

> **13. styl auditu.** Sweep chybové vrstvy (BE výjimky/filtr/pipe/guardy/WS + FE interceptor/parser/toast/boundary)
> napříč oběma repo. Recon + tooling 2026-06-14. Plán: [`error-contract-plan/`](error-contract-plan/).
> Cílová otázka v [README](error-contract-plan/README.md). ID: `EC-xx`.
>
> **Stav: SWEEP + VŠECHNY OPRAVY HOTOVÉ 2026-06-14 (Maximum++).** Tooling `error-contract-scan.mjs` (M-GREP 818
> throwů + M-CONTRACT FE↔BE parity, **drift 0**) + běhový důkaz: M-SHAPE e2e **12/12**, M-FE parser **8/8**, L8
> fuzz, L9 fault injection (CastError/E11000), M-MUT teeth ✅. **12 nálezů (EC-01..12): 4×🟠 · 7×🟡 · 1×⚖️,
> ŽÁDNÝ 🔴 — VŠE OPRAVENO** (F1–F6, žádný odklad). Verifikace: BE unit **2015/2015** · FE vitest **112** · oba
> buildy/linty ✅. Detail → [Stav oprav](#stav-oprav--vše-opraveno-2026-06-14-žádný-odklad).
>
> ## Testovací výsledky (běhový důkaz)
>
> | Test | Soubor | Výsledek | Dokazuje |
> |---|---|---|---|
> | **M-SHAPE** e2e | [`backend/test/error-contract.e2e-spec.ts`](../Projekt-ikaros/backend/test/error-contract.e2e-spec.ts) | **12/12** ✅ | tvar #1/#2/#3, status, statusCode mrtvé, 429, fuzz, fault |
> | **M-FE** parser | [`src/shared/api/__tests__/parseApiError.spec.ts`](src/shared/api/__tests__/parseApiError.spec.ts) | **8/8** ✅ | parser přežije 4 tvary, fallback na #3 |
> | **L8 FUZZ** | [`parseApiError.fuzz.spec.ts`](src/shared/api/__tests__/parseApiError.fuzz.spec.ts) | **4/4** ✅ | ∀ vstup → parser nethrowne; odhalil EC-12 |
> | **M-GREP/CONTRACT** | [`scripts/error-contract-scan.mjs`](scripts/error-contract-scan.mjs) | `npm run audit:errors` → **drift 0** | 818 throwů, FE↔BE parity, `--emit` ErrorCode typ, CI guard |
> | **M-MUT teeth** | mutace filtru (`code` fallback → undefined) | 3 testy 🔴 → ✅ vráceno | testy mají zuby |
>
> Běh: BE `npx jest --config ./test/jest-e2e.json error-contract` (bez DB, deterministické) · FE `npx vitest run src/shared/api`.

---

## TL;DR

- Plán 17 os (7 jádro + 6 hloubka + 4 nadstavba), 9 oblastí, tooling M-GREP/M-CONTRACT/M-SHAPE/M-FE/M-FUZZ/M-CRAWL/M-FAULT/M-MUT. `npm run audit:errors`.
- **Recon BE agenta byl PŘESTŘELEN — strojový scan ho vyvrátil:**
  - ❌ Recon: „74 % throwů bez `statusCode` = bug." **Realita: 753/818 (92 %) nese doménový `code`**; jen **31 (4 %)** dá generický fallback. Tvar je u zdroje **konzistentní**, ne rozbitý.
  - ❌ Recon: „validační chyby obcházejí filtr, FE potřebuje 2 parsery." **Realita: `ValidationPipe` hodí `BadRequestException` = `HttpException` → filtrem PROJDE** a obalí se do `{error:{…}}`. Jeden parser stačí (jen vrací `msg[0]`, EN).
  - ✅ Recon minul **skutečný** kořen: `@Catch(HttpException)` **nechytá ne-HTTP chyby** → druhý tichý tvar (#3).
- **12 nálezů (EC-01..12), empiricky potvrzené:** ne-HTTP mine filtr → tvar #3 (M-SHAPE+L9 ✅), EN validace bez field-mappingu (M-SHAPE ✅), **3 mrtvé FE větve** (M-CONTRACT), **pátý tvar** z MulterExceptionFilter, duplicate-key→500 místo 409, 2 WS tvary, 161× mrtvé `statusCode` (M-SHAPE potvrdil ignoraci), 31 throwů bez kódu, 2 dup typy, silent refresh-fail, parser typový kontrakt nevynucen. **Žádný 🔴** (NestJS default 500 neleakuje stack — ověřeno).
- **Kořen:** tvar chyby je **konvence přes 3 vrstvy bez sdíleného typu** (BE filtr ruční · `code` volný string · FE cast+switch) → doporučený fix L10 = sdílený `ErrorCode` typ + catch-all filtr + `exceptionFactory`.
- **Pozitiva:** globální filtr sjednocuje #1/#2 ✅ · 92 % throwů má doménový kód ✅ · `parseApiError` centrální + bezpečný (`unknown` guard) ✅ · `retry:1` (ne agresivní 4xx retry) ✅ · world no-leak 404 ✅.

---

## Stav oprav — VŠE OPRAVENO 2026-06-14 (žádný odklad)

**Opraveno + ověřeno** (BE/FE odděleně, [feedback_no_mixed_be_fe_batch]):

| Fix | Co | Nálezy |
|---|---|---|
| **F1** (BE) | catch-all `@Catch()` filtr — ne-HTTP → `{error:{code:'INTERNAL'}}` + server log; CastError→400, E11000→409; **MulterExceptionFilter sloučen + smazán** | EC-01, EC-10, EC-11, LK |
| **F2** (BE) | `validationExceptionFactory` — CS hlášky + `code:'VALIDATION'` + `fields{}` (field-mapping); filtr propouští `fields` | EC-02 |
| **F3** (BE) | friendships `ALREADY_FRIENDS` (accepted) vs `REQUEST_EXISTS` (pending) → oživena mrtvá FE větev; **EC-03** gate — NPC/Lokace Finance/Výbavu **NEMAJÍ** → 404 `*_NOT_APPLICABLE` (produktové rozhodnutí, data v DB ponechána) | EC-04, EC-03 |
| **F4** (BE+FE) | **sdílený `ErrorCode` typ** (283 kódů) generovaný z BE throwů do **obou** repo (`error-codes.generated.ts`); `--emit` + **M-CONTRACT CI guard** `npm run audit:errors --ci` → **drift 0** | EC-03/04/07, kořen |
| **F5** (FE) | globální `socket.on('error')` listener (zruší tichou ztrátu); WS tvar hloubka → cross-ref ws-contract | EC-06 |
| **F6** (FE+BE) | `String()` guard v parseru; refresh-fail toast; **dedup `ApiError`** + oprava **flat-bug**; **statusCode codemod** — 160 mrtvých polí odstraněno z 10 BE souborů (`scripts/strip-throw-statuscode.mjs`) | EC-12, EC-09, EC-08, EC-05 |

**Eskalace při opravě (M-CONTRACT odhalil víc, než audit hlásil):**
- **EC-08** nebyl jen dup typ — lokální `interface ApiError` byl **flat** (`{code}`) místo wrapped (`{error:{code}}`); ChangeEmailModal i ResetPasswordPage četly `data.code` → vždy `undefined` → **field-mapping mrtvý** (změna e-mailu / reset hesla vždy generická hláška). Opraveno centrálním `parseApiErrorCode`.
- **WEAK_PASSWORD** (ResetPasswordPage) — FE čekal kód, který BE nehází → mrtvá větev, smazána (drift guard ji odhalil po vyčištění).

**Verifikace (vše zelené):**
- **BE:** typecheck ✅ · lint ✅ · unit **2015/2015** (`--maxWorkers=2`, po úpravě 2 auth asercí na bezstatusCode payload) · M-SHAPE e2e **12/12** · celá e2e suite ✅
- **FE:** build (tsc -b) ✅ · vitest **112/112** · lint ✅
- **M-CONTRACT:** `npm run audit:errors --ci` → **drift 0**, exit 0 · **teeth** (mutace filtru → testy červené) ✅

> ⚠️ Po BE změnách **nutný restart** ([feedback_be_restart_required] — nový filtr, exceptionFactory, gate). Git commit na uživateli ([feedback_git_manual]). Žádné odložené dluhy z tohoto auditu.

---

## Osy

**Jádro (7):** `EX` exception shape · `CO` code contract · `VA` validation · `AL` auth-leak · `UE` uncaught/500 · `WS` websocket · `FE` FE consumption
**Hloubka (6):** `TH` throttler/429 · `RT` retry/refresh · `BD` boundary/pages · `LK` leak · `IM` success parita · `LN` lokalizace
**Nadstavba (Maximum++):** `M-GREP` throw klasifikace · `M-SHAPE` 👑 e2e shape probe · `M-CONTRACT` FE↔BE parity · `FZ` fuzz+crawl (L8) · `TE` teeth (mutace)

## Závažnost

- 🔴 **klient dostane nečitelnou/cizí chybu nebo leak** v běžné cestě — funkční/bezpečnostní průlom
- 🟠 **nekonzistentní tvar dosažitelný klientem / mrtvá UX větev / EN hláška** — funkční riziko, tichá degradace
- 🟡 **kosmetika / drift bez runtime dopadu / chybějící observabilita** — maintenance, future-proofing
- ⚖️ **by-design** (s odůvodněním) · ✅ **ověřeno OK** (pozitivum)

## Úrovně jistoty
`L1` čteno · `L2` tool klasifikace · `L4` e2e probe (běhový důkaz) · `L5` parity+FE parser · `L8` fuzz+crawl · `L9` fault injection. Detail [README](error-contract-plan/README.md).

---

## M-GREP / M-CONTRACT výstup (2026-06-14, `npm run audit:errors`)

| Metrika | Hodnota |
|---|---|
| throwů celkem / souborů | **818 / 73** |
| objekt s doménovým `code` | **753 (92 %)** ✅ |
| string-only message (→ generic code) | 30 |
| objekt bez `code` (→ generic code) | 1 |
| prázdné `()` | 34 |
| **⇒ bez doménového kódu** | **31 (4 %)** |
| `statusCode` v těle (MRTVÉ pole) | **161** |
| BE doménových code literálů | ~268 (vč. ~9 currency šumu — viz pozn.) |
| WS chyby mimo filtr | `emit('error')` ×8 · `return{error}` ×3 ve 2 souborech |
| ExceptionClass top | NotFound 359 · Forbidden 216 · BadRequest 140 · Conflict 70 · Unauthorized 20 |
| **FE→BE drift (mrtvé větve)** | **3** (ALREADY_FRIENDS, FINANCE/INVENTORY_NOT_APPLICABLE) |

> Pozn.: info seznam „BE kódů, na které FE nemapuje" obsahuje ~9 currency zkratek (`CR/KR/MD/ST/ZL/…`) —
> tool extrahuje `code:` i z currency-converter DTO. Nevadí driftu ani CI (currency nejsou ve FE error handlerech).

---

## Nálezy

### 🟠 EC-01 `UE`/`LK` — ne-HTTP chyby míjejí globální filtr → druhý tichý tvar (#3) — L1 ✅, L4 čeká
[`http-exception.filter.ts:10`](../Projekt-ikaros/backend/src/common/filters/http-exception.filter.ts#L10) je `@Catch(HttpException)`.
Cokoli, co není `HttpException` (Mongoose `CastError` na nevalidním ObjectId, `TypeError`, výpadek závislosti),
filtrem **propadne** na NestJS default handler → tělo `{statusCode:500, message:'Internal server error'}`
**bez `error` wrapperu**. FE [`parseApiError`](src/shared/api/client.ts#L88) čte `data.error.message` → `undefined`
→ fallback `err.message` = `"Request failed with status code 500"` (EN, technické). **Dosažitelnost vysoká:**
`GET` s nevalidním ObjectId v parametru = běžný CastError. **Fix:** catch-all `@Catch()` filtr, co i ne-HTTP
obalí do `{error:{code:'INTERNAL',message,timestamp}}` + loguje original server-side (ne klientovi). M-SHAPE vynutí, M-FAULT (L9) ověří pod outage.

### 🟠 EC-02 `VA`/`LN` — validační chyby anglicky, `string[]` bez field-mappingu — L1 ✅, L4 čeká
[`main.ts:23-29`](../Projekt-ikaros/backend/src/main.ts#L23) `ValidationPipe` **bez `exceptionFactory`** →
class-validator default EN hlášky (`"email must be an email"`). Filtrem projde do `{error:{code:'BAD_REQUEST',
message:string[],timestamp}}`. FE [`parseApiError:93`](src/shared/api/client.ts#L93) vrací jen `msg[0]` →
ostatní vadná pole se ztratí; `code='BAD_REQUEST'` (generický) → FE **nemůže** `setError('email')`. Uživatel
vidí jednu anglickou větu v toastu. **Fix:** `exceptionFactory` → CS + `{code:'VALIDATION', fields:{...}}`
pro field-mapping. Cross-ref [form-schema-audit](form-schema-audit.md).

### 🟠 EC-03 `CO` — `FINANCE/INVENTORY_NOT_APPLICABLE` mrtvá FE větev + lživý komentář — L2 ✅
M-CONTRACT drift. FE [`SubdocErrorState.tsx:27`](src/features/world/pages/CharacterDetailPage/components/SubdocErrorState.tsx#L27)
čeká `404 + code 'FINANCE_NOT_APPLICABLE'/'INVENTORY_NOT_APPLICABLE'` → klidná hláška „Tato postava finance nemá".
BE [`character-subdocs.service.ts:391-459`](../Projekt-ikaros/backend/src/modules/character-subdocs/character-subdocs.service.ts#L391)
ale hází `FINANCE_NOT_FOUND`/`INVENTORY_NOT_FOUND`. → FE větev se **nikdy netriggerne** → NPC/Lokace dostane
generické „Načtení se nepodařilo. Zkusit znovu." (CTA retry na chybu, co retry nevyřeší). Navíc controller
komentář [`character-subdocs.controller.ts:151,225`] **mluví o `NOT_APPLICABLE`, který kód neposílá** (vzor
„komentář lže" jako PC-01). **Fix:** sjednotit kód (BE `*_NOT_APPLICABLE` pro NPC/Lokace vs `*_NOT_FOUND` pro
chybějící subdoc PC) — rozlišit 2 sémanticky odlišné stavy.

### 🟡 EC-04 `CO` — `ALREADY_FRIENDS` mrtvá FE větev (BE nerozlišuje accepted/pending) — L2 ✅
M-CONTRACT drift. FE [`useFriendshipMutations.ts:39`](src/features/friendships/api/useFriendshipMutations.ts#L39)
má větev `code==='ALREADY_FRIENDS'` → „S tímto uživatelem už jste přátelé." BE
[`friendships.service.ts:83-93`](../Projekt-ikaros/backend/src/modules/friendships/friendships.service.ts#L83)
vrací pro existující vztah (pending **i** accepted) jednotně `REQUEST_EXISTS` (`findActiveBetween`). → kdo už
je přítel a omylem pošle žádost znovu, vidí matoucí „Žádost už čeká na rozhodnutí." místo „už jste přátelé".
FE větev mrtvá. **Fix:** BE rozlišit `ALREADY_FRIENDS` (accepted) vs `REQUEST_EXISTS` (pending), nebo smazat mrtvou FE větev.

### 🟡 EC-05 `EX` — 161× mrtvé pole `statusCode` v těle throw — L2 ✅
161 throwů nese `statusCode: 4xx` v objektu, ale filtr [`http-exception.filter.ts:15-17`] bere status výhradně
z `exception.getStatus()` → `statusCode` v těle je **ignorováno**. Bez runtime dopadu (status je vždy správný
z exception třídy), ale: (a) klame čtenáře, (b) drift riziko, kdyby někdo `statusCode≠`třída. **De-eskalace
reconu** („74 % bug" → kosmetika). **Fix:** odstranit `statusCode` z těl (lint pravidlo), nebo akceptovat ⚖️.

### 🟠 EC-06 `WS` — dva nejednotné WS error tvary, FE konzumuje jen jeden — L2 ✅
WS chyby jsou mimo HTTP filtr (jiný context). Dva mechanismy + tvary:
- `app.gateway.ts:28,41,54` — `return { error: 'string' }` (ack návrat). FE chat ([socket.ts]) **nikde neemituje s ack callbackem** → tato chyba se **ztrácí**.
- `maps.gateway.ts:110` — `client.emit('error', {code,message})` (server push). FE [`useMapSocket.ts:98`](src/features/world/tactical-map/hooks/useMapSocket.ts#L98) `socket.on('error')` ho zpracuje ✅ (jediný konzument).
Žádný `timestamp`, žádné `WsException`. **Fix:** WS exception konvence + jednotný tvar `{error:{code,message}}`;
FE buď ack callbacky, nebo globální `socket.on('error')`. Cross-ref [ws-contract], paměť `project_ws_security_patterns`.

### 🟡 EC-07 `CO`/`EX` — 31 throwů (4 %) bez doménového kódu → generic fallback — L2 ✅
30 string-only + 1 objekt-bez-code. Filtr jim dá `code = HttpStatus[status]` (`'NOT_FOUND'`…) → FE nemůže
field-mapovat, jen text. Většina jsou interní/edge chyby (M-GREP `--list` vypíše). **De-eskalace** — 4 %, ne 74 %.
**Fix:** doplnit doménový `code` u uživatelsky dosažitelných; ostatní ⚖️.

### 🟡 EC-08 `FE` — duplikovaný `interface ApiError` místo importu centrálního typu — L2 ✅
Kanonický [`types/index.ts:961`](src/shared/types/index.ts#L961), ale lokální kopie v
[`ResetPasswordPage.tsx:18`](src/features/auth/pages/ResetPasswordPage.tsx#L18) a
[`ChangeEmailModal.tsx:14`](src/features/profile/components/ChangeEmailModal.tsx#L14) → drift riziko. **Fix:** import z `@/shared/types`.

### 🟡 EC-09 `RT` — refresh-fail je tichý, bez „session vypršela" hlášky — L1 ✅
[`client.ts:78`](src/shared/api/client.ts#L78) `catch {}` → `logoutAndRedirectToLogin()` bez toastu. Uživatel
je odhlášen bez vysvětlení. **Fix:** `toast.info('Přihlášení vypršelo, přihlas se znovu')` před redirectem.

### 🟠 EC-10 `EX`/`UE`/`LK` — `MulterExceptionFilter` produkuje pátý divergentní tvar — L1 ✅
[`multer-exception.filter.ts:10-17`](../Projekt-ikaros/backend/src/modules/upload/filters/multer-exception.filter.ts#L10)
je samostatný `@Catch(MulterError)` filtr, který vrací `{statusCode, message}` — **bez `error` wrapperu**
(jako tvar #3). Upload chyby (špatný typ, moc souborů) → FE [`parseApiError`] čte `data.error.message` →
undefined → fallback. Navíc non-LIMIT větev posílá `message: error.message` = **anglický multer text**
(`'Unexpected field'`…). LIMIT_FILE_SIZE má CS hlášku ✅. **Fix:** zarovnat na `{error:{code,message}}` tvar
(reuse HttpExceptionFilter konvence). Cross-ref [upload-media-audit](upload-media-audit.md).

### 🟡 EC-11 `UE`/`EX` — duplicate key (E11000) → 500 místo sémantického 409 — L9 ✅
M-SHAPE/L9 fault injection potvrdil: Mongo unique violation (`E11000`) je obyčejný `Error` (ne HttpException)
→ mine filtr → **tvar #3, status 500**. Sémanticky má být **409 Conflict**. Dosažitelné při race condition na
unique poli (email/slug/username), kde BE nekontroluje předem. Podtřída EC-01, ale konkrétní + opravitelná
mapováním v catch-all filtru (F1): `if (err.code===11000) → 409`. **Fix:** součást F1.

### 🟡 EC-12 `FE` — `parseApiError`/`parseApiErrorCode` nevynucují string návrat (TS typ lže) — L8 ✅
L8 fuzz odhalil: parser bere `data.error.message` / `[0]` / `code` **bez kontroly typu** → když by BE poslal
`message: [42]` nebo `code: 123`, vrátí `number`, ne `string` (deklarovaný návratový typ `string` lže). Toast by
pak dostal ne-string → riziko `[object Object]`. **Dosažitelnost nízká** (BE reálně posílá `string`/`string[]` stringů),
ale kontrakt to nevynucuje. **Fix:** `String(...)` guard v parseru (součást F6 / F4 typový kontrakt).

### Otevřené / částečně ověřené
- `AL` no-leak parita: **world ✅** ([worlds.service.ts:178-207], cross-ref [role-audit R-20]). Plná parita napříč pages/characters/maps/chat = L2 vzorek (sond M-SHAPE per modul) — **otevřeno** jako follow-up; `K-EC6` neeskalován (žádný protidůkaz nalezen).
- `TH` 429 FE: **auth + friendship cesty ✅** (RegisterModal/LoginModal/ForgotPassword/`useSendFriendRequest` → CS „Příliš mnoho pokusů"). Ne-auth mutace bez 429 handleru → EN throttler text v toastu (🟡 okrajové).
- `IM` success `{data}` parita: `response.interceptor` aplikován selektivně — success contract, mimo hlavní error scope (🟡 cross-ref, neeskalováno).
- `BD` GlobalErrorBoundary jen `console.error` (bez reportu) — observabilita/dluh, ne contract (`K-EC10` → [dluhy.md]).

---

## Pozitiva (ověřeno — nestavět znovu)

- ✅ **Globální `HttpExceptionFilter`** sjednocuje #1 (aplikační) i #2 (validační) do `{error:{code,message,timestamp}}` — recon „2 parsery" vyvrácen.
- ✅ **92 % throwů (753/818) nese doménový `code`** — tvar je u zdroje konzistentní.
- ✅ **`parseApiError` centrální + bezpečný** — `unknown` param, `axios.isAxiosError` guard, fallback `'Neznámá chyba'`, žádný throw v parseru.
- ✅ **`retry:1`** na queries — ne agresivní 4xx retry.
- ✅ **World no-leak 404** ([worlds.service.ts:155,178-207]) — private bez přístupu = 404, ne 403.
- ✅ **JWT auth kódy** (`BANNED/DELETED/DELETION_PENDING`) → FE instant logout ([client.ts:46-60]) funguje.

---

## Doporučené fixy (gated souhlasem — neopravovat tiše)

| # | Fix | Kryje | Třída |
|---|---|---|---|
| F1 | **Catch-all `@Catch()` filtr** — ne-HTTP → `{error:{code:'INTERNAL',…}}` + server-side log; mapovat `E11000→409`, Mongoose `CastError→400`; **sloučit MulterExceptionFilter** do téhož tvaru | EC-01, EC-10, EC-11, LK | 🟠 |
| F2 | **`exceptionFactory`** ve `ValidationPipe` — CS + `{code:'VALIDATION',fields}` field-mapping | EC-02 | 🟠 |
| F3 | **Sjednotit drift kódy** — `*_NOT_APPLICABLE` vs `*_NOT_FOUND`, `ALREADY_FRIENDS` vs `REQUEST_EXISTS` | EC-03, EC-04 | 🟠/🟡 |
| F4 | **Sdílený `ErrorCode` typ/union** importovaný BE↔FE (L10) — ruší kořen, drift = chyba překladače | EC-03/04/07, kořen | 🟡 architektura |
| F5 | **WS error konvence** — jednotný tvar + FE konzumace | EC-06 | 🟠 |
| F6 | **FE drobnosti** — import `ApiError` (smazat 2 dup), refresh-fail toast, `String()` guard v parseru (EC-12), smazat 161× `statusCode` | EC-05/08/09/12 | 🟡 |
| — | **CI guard** `npm run audit:errors` (M-GREP+M-CONTRACT) — drift/nekonzistence neprojde tiše | regrese | infra ✅ |

> 💡 **Pořadí dle dopadu/úsilí:** F1 (catch-all, kryje 4 nálezy vč. obou 🟠 uncaught/multer) → F2 (validace UX)
> → F3 (3 mrtvé FE větve, malý zásah) → F5 (WS) → F6 (FE drobnosti) → F4 (architektura, L10, největší).
> **BE a FE opravy nemíchat v jedné dávce** ([feedback_no_mixed_be_fe_batch]).

> ⚠️ Po BE změnách **restart** ([`feedback_be_restart_required`]). Git commit nechán uživateli ([`feedback_git_manual`]).
