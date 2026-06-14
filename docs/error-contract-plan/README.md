# Error contract — když cokoli selže, dostane klient vždy stejný čitelný tvar chyby, nebo se kontrakt tiše rozjíždí?

> **Účel:** vzít **celou chybovou vrstvu** obou repo (BE NestJS výjimky/filtr/pipe/guardy/WS gateway +
> FE axios interceptor/`parseApiError`/toast/error boundary) a tvrdě ověřit, že **každá chyba, ať vznikne
> kdekoli**, dorazí ke klientovi v **jednom předvídatelném, typovaném tvaru** se **správným HTTP statusem**,
> **doménovým kódem** a **českou hláškou** — a že ji FE **bez výjimky přečte a ukáže uživateli**. Cílová otázka:
> „když to spadne — vidí uživatel užitečnou českou hlášku se správným statusem, **nebo** `Neznámá chyba` /
> anglickou validační větu / `[object Object]` / syrový 500 stack, protože tvar chyby je jen domluva, ne kontrakt?"
>
> **Třináctý sourozenec** [`bug-plan/`](../bug-plan/README.md), [`ws-contract-plan/`](../ws-contract-plan/README.md),
> [`role-plan/`](../role-plan/README.md), [`form-schema-plan/`](../form-schema-plan/README.md),
> [`cache-plan/`](../cache-plan/README.md), [`state-consistency-plan/`](../state-consistency-plan/README.md),
> [`cascade-delete-plan/`](../cascade-delete-plan/README.md), [`db-integrity-plan/`](../db-integrity-plan/README.md),
> [`seed-scenario-plan/`](../seed-scenario-plan/README.md), [`nav-plan/`](../nav-plan/README.md),
> [`upload-media-plan/`](../upload-media-plan/README.md) a [`prod-config-plan/`](../prod-config-plan/README.md).
> Statický breadth-first sweep jedné starosti (tvar a čitelnost chyb) napříč oběma repo — ale s **těžkou
> spustitelnou vrstvou**: tool klasifikuje všech **818 `throw`** (M-GREP), e2e probe **empiricky vystřelí**
> každou status třídu a ověří tvar (M-SHAPE), parity guard hlídá FE↔BE shodu kódů (M-CONTRACT), a property-based
> fuzz + exhaustive crawl prověří **celý povrch API × kombinatoriku vstupů** (L8). Nálezy jsou **strojově
> prokázané**, ne vyčtené.
>
> **Stav:** SWEEP + VŠECHNY OPRAVY HOTOVÉ (Maximum++) 2026-06-14. Tooling + M-SHAPE 12/12 + M-FE 8/8 + L8 fuzz +
> L9 fault + teeth ✅. **12 nálezů (EC-01..12), žádný 🔴 — všech 6 fixů (F1–F6) opraveno + ověřeno** (BE unit
> 2015/2015, FE 112, drift 0). Nálezy → [`../error-contract-audit.md`](../error-contract-audit.md) (ID `EC-xx`).

---

## Proč samostatný plán (co ostatní audity míjí)

Předchozích dvanáct auditů řeže systém po **datech, oprávněních, stavu, navigaci, uploadu a konfiguraci**.
Žádný neřeší **chybovou cestu jako vlastní kontrakt** — co se reálně pošle po drátě, **když requesty selžou**,
a jestli to druhá strana umí přečíst. A přesně tam žije tichá třída chyb: aplikace funguje, dokud uživatel
nenarazí na chybu — a pak místo užitečné hlášky vidí prázdno, angličtinu nebo `[object Object]`.

| Slepá skvrna | Příklad reálného rizika v Ikarovi | Dopad |
|---|---|---|
| **Ne-HTTP chyba mine filtr** | `@Catch(HttpException)` nechytá obyčejný `Error`/Mongo → 500 přijde jako `{statusCode,message}` **bez `error` wrapperu** → FE `parseApiError` čte `data.error.message` = undefined → fallback | 🔴 uživatel vidí generickou axios hlášku místo chyby; možný stack leak |
| **Validační hláška anglicky** | `ValidationPipe` bez `exceptionFactory` → class-validator pošle `"email must be an email"` → FE to ukáže uživateli | 🟠 mix CS appka / EN validace; UX |
| **`message` je pole** | validace vrací `string[]` → FE bere jen `msg[0]` → ostatní chyby formuláře zmizí, žádný field-mapping | 🟠 uživatel nevidí všechny vady |
| **Doménový `code` je volný string** | ~818 `throw` napříč 73 soubory, FE switchuje na hardcoded stringy; přejmenuješ kód na BE → FE tichý generic fallback | 🟠 drift FE↔BE, žádný kompilátor to nechytí |
| **WS chyba jiný tvar** | gateway `return {error:'string'}` vs `emit('error',{code,message})`, bez timestamp; FE socket vrstva `error` event neřeší | 🟠 tichá ztráta WS chyby |
| **403 vs 404 leak** | guard vrátí 404 kde má 403 (nebo naopak) → leak existence zdroje / matoucí UX | 🟠 bezpečnost/UX (cross-ref auth-leak-policy) |
| **Mrtvé pole `statusCode`** | 159 throwů nese `statusCode` v těle, filtr ho **ignoruje** (bere `getStatus()`) → kosmetický drift, klame čtenáře | 🟡 maintenance, ne runtime |

> 💡 **Kořen (jako každý audit má jeden):** **tvar chyby není kontrakt, je to konvence roztroušená přes 3
> nezávislé vrstvy.** (1) BE filtr [`http-exception.filter.ts`] sestavuje `{error:{code,message,timestamp}}`
> **ručně**; (2) doménový `code` je **volný string** v 818 `throw`; (3) FE čeká tvar přes `as ApiError` **cast**
> a `switch` na hardcoded stringy. Nic ty tři vrstvy nespojuje **typem** → drift je neviditelný, dokud ho
> uživatel neuvidí jako špatnou hlášku. Navíc filtr je `@Catch(HttpException)`, takže **ne-HTTP chyby tvoří
> druhý, tichý tvar**. Audit to zviditelní strojově (klasifikace throwů + e2e probe tvaru + FE↔BE parity)
> a rozhodne, kde nahradit konvenci **sdíleným typovým kontraktem** (L10 fix).

📚 **Co je „error contract":** nepsaná dohoda klient↔server o tom, jak vypadá chybová odpověď (která pole,
jaký status, jaký kód, jaký jazyk). Drží-li ji obě strany jen „domluvou" a ne sdíleným typem, tiše se rozjede.
📚 **Co je `@Catch(HttpException)`:** NestJS exception filtr chytá **jen** výjimky toho typu (a potomky).
Cokoli, co není `HttpException` (obyčejný `Error`, chyba z Mongoose, `TypeError`), filtrem **propadne** na
default handler → jiný tvar odpovědi.

---

## Prior art (co už existuje a co míjí)

> ⚠️ Část pojistek už **existuje** — stavíme na nich, neduplikujeme.

| Artefakt | Co dělá | Co míjí |
|---|---|---|
| `HttpExceptionFilter` ([common/filters]) | sjednocuje **HttpException** do `{error:{code,message,timestamp}}` | ne-HTTP chyby (500), WS chyby; `code` nevaliduje |
| `http-exception.filter.spec.ts` | unit test tvaru pro string/objekt/fallback | jen filtr v izolaci, ne reálný request→response; ne ne-HTTP cestu |
| `jwt-auth.guard.spec.ts` | test kódů `BANNED/DELETED/DELETION_PENDING` | jen guard; ne paritu 403/404 napříč moduly |
| FE `parseApiError`/`parseApiErrorCode` ([client.ts:88-108]) | centrální parser wrapped tvaru + kódu | nepokrývá tvar #3 (neobalený 500) → fallback; 0 testů |
| skill `auth-policy` + `auth-leak-policy.md` (BE rules) | pravidlo 401/403/404 per-komponenta | per-component checklist, ne systematické ověření napříč ~206 endpointy |
| [ws-contract audit] (paměť `project_ws_security_patterns`) | WS identita/room security | **tvar** WS chyb a jejich FE konzumaci |
| [role audit R-20](../role-audit.md) | role/permission matice | **status** chyby (403 vs 404) jako contract, ne jako oprávnění |

> 💡 **Pozice tohoto auditu:** je to **chybová cesta jako kontrakt** — vrstva, kterou ostatní audity berou jako
> dané („vrátí 403"), ale neptají se „**v jakém tvaru** a **přečte to FE?**". `WS`/`AL` osy existující audity
> **cross-refují** (M2), neřeší znovu.

---

## Kontrolní osy (7 jádro + 6 hloubka + 4 nadstavba)

### Jádro (tvrzeno na celé chybové ploše)
| Osa | Zkr | Otázka | Cross-ref |
|---|---|---|---|
| **Exception shape** | `EX` | každá HTTP chyba = jednotný `{error:{code,message,timestamp}}` + **sémanticky správný status** (400 vs 404 vs 409) | nový |
| **Code contract** | `CO` | doménové `code` jsou konzistentní a **FE↔BE se shodují** (žádný kód, co FE nezná / čeká navíc) | bug · form-schema |
| **Validation** | `VA` | class-validator chyby: **jazyk** (CS?), `string[]` vs string, **field-mapping** na konkrétní pole | form-schema |
| **Auth-leak** | `AL` | 401/403/404 **sémanticky správně** + neleakuje existenci zdroje, napříč VŠEMI moduly | role R-20 · auth-policy |
| **Uncaught/500** | `UE` | ne-HttpException chyby → tvar, **FE fallback**, žádný leak stack trace v prod | prod-config HD |
| **WebSocket** | `WS` | WS chyby **jednotný tvar** + FE je reálně zpracuje | ws-contract |
| **FE consumption** | `FE` | `parseApiError` přežije **každý** reálný tvar; zobrazení (toast/inline/field) bez `undefined`/`[object Object]` | cache |

### Hloubka (skok ze čtení na prokázání)
| Osa | Zkr | Konkrétní tah | Co reálně chytí |
|---|---|---|---|
| **Throttler/429** | `TH` | `ThrottlerException` projde filtrem? jaký `code`/tvar? FE zobrazí „příliš mnoho pokusů"? | rate-limit chyba bez UX |
| **Retry/refresh** | `RT` | 401 refresh loop (`_retry`), 4xx-retry anti-pattern v React Query, refresh-fail UX | smyčka / tichý logout |
| **Error boundary** | `BD` | `GlobalErrorBoundary`, 403/404/500 stránky, router error fallback | bílá obrazovka místo chyby |
| **Leak** | `LK` | interní detaily/stack/Mongo zpráva v error message **v prod**; `/health` info | info leak |
| **Success parita** | `IM` | `response.interceptor` `{data}` jen na části controllerů → success tvar nejednotný | FE neumí číst část odpovědí |
| **Lokalizace** | `LN` | CS app hlášky vs EN validace; konzistence jazyka uživatelských chyb | UX nejednota |

### Nadstavba (Maximum++ — strop hloubky)
| Osa | Zkr | Konkrétní tah | Co reálně chytí |
|---|---|---|---|
| **Throw klasifikace** | `M-GREP` | scan 818 `throw new *Exception` → string / objekt s `code` / objekt bez `code` + drift tabulka; CI guard | nekonzistentní tvar u zdroje |
| **Shape probe** | `M-SHAPE` | 👑 e2e supertest: reálné requesty vyvolají 400/401/403/404/409/429/500 → **assert tvar + status** | empirický důkaz tvaru (ne čtení) |
| **FE↔BE parity** | `M-CONTRACT` | inventář `code` produkovaných BE × konzumovaných FE switchi → drift; CI guard | tichý rozjezd kódů |
| **L8 fuzz + crawl** | `FZ` | property-based malformed payloady (`fast-check`) + exhaustive crawl ~206 endpointů → invariant tvaru drží ∀ vstup | tvary, co ručně nevymyslíš; úplnost povrchu |
| **Teeth (mutace)** | `TE` | zmutuj filtr (smaž `code` fallback / wrapper) → contract testy **musí** zčervenat | audit-divadlo |

`EX`/`CO`/`VA` jsou osy **tvaru u zdroje** (vzniká chyba správně?). `UE`/`WS`/`TH` osy **úplnosti pokrytí**
(pokrývá kontrakt VŠECHNY cesty, ne jen HttpException?). `AL`/`LK` osy **sémantiky a bezpečnosti** (správný
status, žádný leak). `FE`/`RT`/`BD`/`IM`/`LN` osy **konzumace a UX** (přečte a ukáže to klient?). `M-*`/`FZ`/`TE`
**nadstavba** — `M-SHAPE`+`FZ` posouvají audit z čtení na empirický důkaz na celém povrchu, `TE` dokazuje zuby.

---

## Metody ověření + úrovně jistoty

| Kód | Metoda | Nástroj |
|---|---|---|
| **M1** | Statické čtení — filtr, pipe, guardy, gateway, `client.ts`, FE error handlery | Read/Grep |
| **M-GREP** | **Throw klasifikace** — [`tools/error-contract-scan`](tools/error-contract-scan.md): grep 818 `throw` → tvar (string/objekt+code/objekt-code) + WS chyby + drift | node skript |
| **M-SHAPE** | **E2e shape probe** — supertest + `createTestApp`: reálné requesty na každou status třídu → assert `{error:{code,message,timestamp}}` + status; vč. vynuceného 500 a 429 | jest e2e (`--runInBand`) |
| **M-CONTRACT** | **FE↔BE code parity** — BE produkované `code` × FE konzumované `code` (switche/mapy) → drift seznam | node skript |
| **M-FE** | **FE parser test** — vitest: `parseApiError`/`parseApiErrorCode` proti všem 4 tvarům (wrapped, validation array, neobalený 500, WS) | vitest |
| **M-FUZZ** | **Property-based** — `fast-check` malformed payloady na endpointy → invariant: success NEBO přesný error tvar, nikdy leak | fast-check + supertest |
| **M-CRAWL** | **Exhaustive crawl** — projet ~206 REST endpointů × chybové cesty (no-auth/bad-id/garbage) → tvar u každého | node + supertest |
| **M-FAULT** | **Fault injection** — shoď Mongo/Cloudinary/Meili za běhu → ověř, že degradace dá error tvar, ne syrový 500 leak (cílené na `UE`) | jest + mock outage |
| **M-MUT** | **Mutation testing** — zmutuj filtr/parser → contract testy musí zčervenat | Stryker |
| **M2** | Cross-ref — sdílené nálezy s [ws-contract] (WS) / [role R-20](../role-audit.md) (AL) / [form-schema](../form-schema-audit.md) (VA) | čtení |

| Úroveň | Co znamená | Důkaz |
|---|---|---|
| **L1** | staticky přečteno — tvar vypadá jednotně | nejslabší |
| **L2** | **tool klasifikace** — 818 throwů roztříděno (`M-GREP`), drift vyčíslen | strojový smoke |
| **L3** | + **kontext dosažitelnosti**: je nejednotný tvar reálně dosažitelný klientem, nebo gated? | mechanika |
| **L4** | + **e2e shape probe** (`M-SHAPE`): reálný request→response, tvar + status empiricky potvrzen pro každou status třídu | běhový důkaz |
| **L5** | + **FE↔BE parity** (`M-CONTRACT`) + **FE parser testy** (`M-FE`): kruh kód→tvar→parser ověřen end-to-end | cross-stack důkaz |
| **L8** | + **fuzz + exhaustive crawl** (`FZ`): invariant tvaru drží ∀ malformed vstup × **celý povrch ~206 endpointů** | úplnost vstupů+povrchu |
| **L9** | + **fault injection** (`UE`): tvar drží i pod reálným výpadkem závislosti (Mongo/Cloudinary down) | běhový důkaz degradace |
| **L10** | + **typový kontrakt** (sdílený TS typ BE↔FE) → drift = chyba překladače | **fix, ne měření** |

**Cíl (varianta Maximum++):** jádro (`EX`/`CO`/`VA`/`AL`/`UE`/`WS`/`FE`) na **L4–L5** (e2e probe + parity +
FE parser testy); `M-GREP`+`M-CONTRACT` jako **CI guard** (`npm run audit:errors`); `FZ` (fuzz + exhaustive
crawl) na **L8**; `UE` navíc na **L9** (fault injection cílený na tvar #3); celý audit projde **`TE` mutací**
(má zuby). `L10` typový kontrakt = **doporučený fix**, ne audit vrstva. `TH`/`RT`/`BD`/`LK`/`IM`/`LN` na L2–L3.

---

## Baseline + pasti prostředí

| Check | Stav | Pozn. |
|---|---|---|
| Globální `HttpExceptionFilter` | ✅ existuje | `@Catch(HttpException)` — **nepokrývá ne-HTTP** (kořen `UE`) |
| `ValidationPipe` `exceptionFactory` | ⬜ **NEEXISTUJE** | EN hlášky + `string[]` bez field-mappingu (`VA`) |
| Sdílený typový kontrakt chyby BE↔FE | ⬜ **NEEXISTUJE** | kořen — FE `ApiError` typ je ruční zrcadlo, ne import |
| `error-contract-scan.mjs` (M-GREP + M-CONTRACT) | ⬜ postavit (oblast 00) | vzor `prod-config-scan.mjs` |
| BE e2e harness (supertest + `createTestApp`) | ⬜ ověřit/postavit | reuse vzor; **`--runInBand`** kvůli flaky Mongo |
| `fast-check` ^4.8 / `@playwright/test` / Stryker | ✅ v devDeps | z minulých auditů (Maximum+) |

⚠️ **Pasti (z paměti + recon):**
- 🔴 **`@Catch(HttpException)` nechytá ne-HTTP chyby** ([http-exception.filter.ts:10]) — ověřeno čtením. 500 z `Error`/Mongo → NestJS default tvar `{statusCode,message}` bez `error` wrapperu → FE `parseApiError` ([client.ts:91]) fallback. **Jádro `UE`/`LK`.**
- ⚠️ **Recon BE agenta PŘESTŘELIL** ([paměť `db_integrity_audit`] — „Explore shrnutí přestřelují"): tvrdil, že validační chyby **obcházejí filtr** — **NEPRAVDA**. `BadRequestException` z `ValidationPipe` je `HttpException`, filtrem **projde** a obalí se. Také „74% throwů bez `statusCode` = bug" je **přestřel** — filtr `statusCode` z těla **ignoruje** (bere `getStatus()`), je to **mrtvé pole** (`EX`, de-eskalace na 🟡). Do registru jen **ověřené čtením**.
- **`message: string[]`** (validace) → FE `parseApiError` ([client.ts:93]) vrací jen `msg[0]` → ostatní vady formuláře se ztratí (`VA`/`FE`).
- **`code` fallback `HttpStatus[status]`** ([filter:36-39]) — chybí-li doménový code, FE dostane `'NOT_FOUND'`/`'BAD_REQUEST'`; FE field-mapping (RegisterModal) spoléhá na **doménové** kódy → drift = tichý generic toast (`CO`).
- **WS chyby mimo filtr** — `app.gateway` `return {error:string}`, `maps.gateway` `emit('error',{code,message})` — 2 tvary, filtr je nevidí (WS ≠ HTTP context) (`WS`).
- **BE precommit = typecheck+lint, NE testy** ([paměť `be_precommit_prettier`]) → e2e/jest spouštět ručně; **plný paralelní jest flaky na Mongo startu** ([paměť `be_test_mongo_flaky`]) → `--maxWorkers=2` / `--runInBand`. Po BE změně **restart** ([feedback_be_restart_required]).
- **FE bez prettieru** ([feedback_fe_no_prettier]) → `eslint --fix`; **FE vitest bez globals** (explicit importy), `fireEvent` ne `user-event` ([paměť `fe_test_precommit`]); FE deploy = `npm run build` (`tsc -b`) ([paměť `fe_build_preexisting_errors`]).
- **Žádné tajné hodnoty / reálná data v plánu** — pracujeme s **tvary** a **kódy chyb**, ne s produkčním obsahem.

---

## Seed kandidáti (hypotézy — verdikt až při běhu)

> Běh každý povýší na `🐛 EC-xx`, `✅ shoda` nebo `⚖️ by-design`. Detail → [`../error-contract-audit.md`](../error-contract-audit.md).

- **K-EC1** `UE`/`LK` 🟠 — `@Catch(HttpException)` ([http-exception.filter.ts:10]) nechytá ne-HTTP → 500 bez `{error:{}}` wrapperu → FE `parseApiError` fallback; ověřit i stack/Mongo leak v prod. **Ověřeno čtením.** Oblast 05.
- **K-EC2** `VA`/`LN` 🟠 — `ValidationPipe` bez `exceptionFactory` ([main.ts:24]) → EN class-validator hlášky uživateli; `string[]` → FE jen `[0]`, žádný field-mapping. **Ověřeno čtením.** Oblast 03.
- **K-EC3** `CO` 🟠 — doménový `code` volný string v 818 throwech, FE switche hardcoded; žádný sdílený enum → drift = FE tichý generic fallback. M-CONTRACT vyčíslí. Oblast 02.
- **K-EC4** `EX` 🟡 — `statusCode` v těle throw (159×) je **mrtvé pole** (filtr bere `getStatus()`); recon „74% bug" přestřelil → kosmetika/drift, ne runtime bug. Ověřit, že nikde nezpůsobí špatný status. Oblast 01.
- **K-EC5** `WS` 🟠 — WS chyby 2 tvary (`return {error:string}` vs `emit('error',{code,message})`), bez timestamp; FE `socket.ts` `error` event nezpracuje → tichá ztráta. Oblast 06.
- **K-EC6** `AL` ⚖️ — world no-leak 404 ✅ ([worlds.service.ts:178-207]); ověřit **paritu** napříč pages/characters/maps/chat (leakuje 403 místo 404, nebo naopak?). Cross-ref role R-20. Oblast 04.
- **K-EC7** `FE` 🟡 — duplikovaný lokální `interface ApiError` (ChangeEmailModal aj.) místo importu centrálního typu → drift. Oblast 07.
- **K-EC8** `RT` 🟡 — refresh-fail `catch {}` ([client.ts:78]) bez „session expirovala" hlášky; tichý redirect na login. Oblast 07.
- **K-EC9** `IM` 🟡 — `response.interceptor` `{data}` jen na části controllerů → success tvar nejednotný (okrajově, success ≠ error). Oblast 08.
- **K-EC10** `BD` 🟡 — `GlobalErrorBoundary` jen `console.error` (žádný report); 403/404 stránky hardcoded bez BE kontextu. Oblast 07.
- **K-EC11** `TH` 🟡 — `ThrottlerException` (429) projde filtrem (extends HttpException) → `{error:{code:'TOO_MANY_REQUESTS'}}`; ověřit + FE zobrazení. Oblast 08.
- **K-EC12** `EX`/`CO` 🟠 — `throw` se **string** message (ne objekt) → `code` = `HttpStatus[status]` (generický), žádný doménový kód → FE nemůže field-mapovat. M-GREP spočítá kolik. Oblast 01/02.

---

## Index oblastí (9 + tools)

| # | Oblast | Jádro povrchu | Osy |
|---|---|---|---|
| 00 | [Cross-cutting](00-cross-cutting.md) | architektura (filtr/pipe/FE client/WS), **4 tvary chyb**, kořen, tooling spec, master matice | všechny |
| 01 | [HTTP shape & status](01-http-shape.md) | všechny `*Exception` třídy, status sémantika (400/404/409/410), mrtvé `statusCode` pole, string vs objekt message | `EX` |
| 02 | [Domain code contract](02-code-contract.md) | inventář BE kódů × FE switche, `HttpStatus[status]` fallback, drift, sdílený enum (chybí) | `CO` |
| 03 | [Validation](03-validation.md) | `ValidationPipe`, EN hlášky, `message[]`, field-mapping, `exceptionFactory` (chybí) | `VA` `LN` |
| 04 | [Auth-leak](04-auth-leak.md) | guardy (Jwt/Admin/Roles/world access), 401/403/404, no-leak existence napříč moduly | `AL` |
| 05 | [Uncaught & 500](05-uncaught.md) | ne-HttpException, stack/Mongo leak prod vs dev, FE fallback, catch-all filtr (chybí) | `UE` `LK` |
| 06 | [WebSocket errors](06-websocket.md) | gateway tvary (app/maps/chat/presence), FE socket zpracování, ack vs emit | `WS` |
| 07 | [FE consumption & display](07-fe-consumption.md) | `parseApiError`, toast/inline/field, boundary, error pages, refresh-fail, duplikované typy | `FE` `BD` `RT` |
| 08 | [Throttler/transport/misc](08-throttler-misc.md) | 429, success `{data}` parita, headers, transport | `TH` `IM` |
| — | [tools/error-contract-probe](tools/error-contract-probe.md) | M-GREP · M-SHAPE · M-CONTRACT · M-FE · M-FUZZ · M-CRAWL · M-FAULT · M-MUT | nadstavba |

---

## Legenda statusů

- ⬜ netestováno · ✅ ověřeno OK · 🐛 nález → [`../error-contract-audit.md`](../error-contract-audit.md) (`EC-xx`) · ⚠️ podezřelé · ⏭️ blokované/`[human]`
- `K-ECx` seed kandidát (hypotéza)

## Pracovní postup

1. **Tooling** — postav [`tools/error-contract-scan`](tools/error-contract-probe.md): M-GREP (klasifikace 818 throwů) + M-CONTRACT (FE↔BE code parity). `npm run audit:errors`. Oblast 00. (L2)
2. **Sweep jádra (L2→L4)** — oblasti 01–04: HTTP shape → code contract → validation → auth-leak; každá scanem + čtením, klíčové potvrzeny **e2e probe** (M-SHAPE).
3. **Hloubka (L4→L5)** — oblast 05 (uncaught + leak), 06 (WS), 07 (FE konzumace + parser testy M-FE), 08 (throttler/misc).
4. **Maximum++ (L8→L9)** — `FZ`: property-based fuzz (`fast-check`) + exhaustive crawl ~206 endpointů; `UE` na L9 fault injection (Mongo/Cloudinary outage); celý audit přes `TE` mutaci.
5. **CI guard** — `error-contract-scan.mjs` (M-GREP + M-CONTRACT) do CI/precommit, aby nový nekonzistentní tvar / drift kódu nikdy neprošel tiše.
6. **Doporučený fix (L10)** — sdílený typový kontrakt chyby (BE↔FE) + catch-all filtr + `exceptionFactory`. Nález → `EC-xx` s **osa / soubor:řádek / tvar / dosažitelný klientem? / vratné?**; neopravovat tiše, opravy **gated souhlasem**.
