# log-hygiene / 00-cross-cutting — checkpoint RUN-2026-06-20-1621

Auditor: plný-audit agent (READ-ONLY). Datum: 2026-06-20.

## Pokrytí

Prošel jsem:
- `docs/log-hygiene-plan/README.md` + `00-cross-cutting.md` (plán + taint model)
- `docs/log-hygiene-audit.md` (registr LH-01..12, stav ke 2026-06-14)
- `logs.txt` ze scanneru (M-SCAN + M-DOCKER výstup, aktuální HEAD)
- HEAD kód: `main.ts`, `log-error.util.ts`, `log-hygiene.spec.ts`, `smtp-mailer.provider.ts`, `log-mailer.provider.ts`, `auth.service.ts`, `totp-crypto.service.ts`, `campaign-purchase.service.ts`, `world-cleanup.cron.ts`, `account-cleanup.cron.ts`, `throttler.config.ts`, `trusted-devices.service.ts`, `game-events.service.ts`, `vite.config.ts`, `socket.ts`, `RegisterModal.tsx`, `docker-compose.prod.yml`, `docker-compose.yml`
- M-SCAN CI výstup (`node scripts/log-hygiene-scan.mjs --ci` + `--list`)
- NestJS `ConsoleLogger.stringifyMessage` zdrojový kód (node_modules)

## Dosažená L vs cílová L

| Osa | Cílová L | Dosažená L | Poznámka |
|---|---|---|---|
| `DBG` | L3 | L3 | 2× logger.debug v cron runtime cestách — gated log-level (prod drops debug) ✅ |
| `SEC` | L3 | L3 | SEC:1 = LogMailer dev-only gated ✅; žádný nový SEC |
| `PII` | L3 | L3 | smtp-mailer maskuje e-mail ✅ |
| `OBJ` | L3 | L3 | **Nový nález:** campaign-purchase.ts:385 `logger.error(msg, revertErr as Error)` — bypass logError 🆕 |
| `EXC` | L3 | L3 | http-exception.filter kontrolovaně; top-level handler existuje ✅ |
| `LVL` | L3 | L3 | main.ts:38-41 logLevels prod gate ✅ |
| `REQ` | L2 | L2 | žádný morgan/interceptor ✅ |
| `FMT` | L2 | L2 | scanner ukazuje konzistentní formáty |
| `SINK` | L3 | L3 | docker rotace oba compose ✅ |
| `3RD` | L3 | L3 | mongoose/nodemailer debug OFF + CI guard ✅ |
| `CTX` | L2 | L2 | false-positive dle registru; campaign-purchase CTX flag přesně trefil nový nález |
| `TOP` | L3 | L3 | unhandledRejection/uncaughtException handler v main.ts ✅ |
| M-SCAN | L2 | L2 | scanner CI zelený, --list ukazuje všechna tainted volání |
| M-RUNTIME | L5 | L5 | log-hygiene.spec.ts 6/6; teeth ověřeny |
| M-DOCKER | L2 | L2 | oba compose potvrzeny s rotací |

## Nálezy

### LH-RUN-01 — [OBJ/EXC] Nová regrese LH-01: `logger.error(msg, errObj)` v campaign-purchase.service.ts
- **Kde:** `backend/src/modules/campaign/services/campaign-purchase.service.ts:385`
- **Co:** `this.logger.error(msg, revertErr as Error)` — předává celý `Error` objekt jako druhý argument. NestJS `ConsoleLogger` volá `util.inspect(message)` (ověřeno ze zdrojáku node_modules) na non-string argumenty → pokud `revertErr` je Mongoose/Axios chyba s enumerable poli (`keyValue`, `response.data` atd.), tato pole se dostanou do stdout.
- **Přidáno:** commit `aba3085` (2026-06-15, AFTER log hygiene fix `5b48b5d` 2026-06-14).
- **Dopad:** 🟡 střední (tato cesta je compensation failure v race transakci, vzácná; ale když nastane, Mongoose E11000 error nese `keyValue` s duplicitním polem — může nést `accountId` / interní ID).
- **Proč to CI nezachytí:** `--ci` guard kontroluje jen `SEC/console/3RD` — OBJ regrese mimo jeho záběr. M-RUNTIME spec testuje jen `logError`/mailery, ne `campaign-purchase` cestu.
- **Návrh:** nahradit za `logError(this.logger, msg, revertErr)` (import z `common/logging/log-error.util.ts`).
- **L3** · 🆕

### LH-RUN-02 — [DBG] 2× `logger.debug` v runtime cron cestách — gated, ale nekonzistentní s LH-01 vzorem
- **Kde:**
  - `backend/src/modules/worlds/services/world-cleanup.cron.ts:34`
  - `backend/src/modules/users/services/account-cleanup.cron.ts:47`
- **Co:** `this.logger.debug('... nic k hard-cleanup')` v runtime `@Cron` metodách. Prod gate (LH-02) je zavedený: v produkci se debug nezaloguje. Ale existuje vzor (`log` místo `debug` u ostatních cron hlášek), takže `debug` semanticky správně říká „nízká priorita / skipped" — by-design by mohl být, ale scanner správně flaguje 2 debug volání v runtime.
- **Dopad:** 🟢 fakticky bezpečné (prod silenced); ale konzistenci by lépe zachoval `logger.verbose` nebo komentář.
- **Návrh:** ⚖️ by-design akceptovat (data jsou jen literál, žádná citlivá hodnota, prod gate existuje); nebo změnit na `logger.verbose` pro konzistenci.
- **L3** · ♻️ (seed kandidát K-LOG1 byl LVL — toto je subset, gated)

### LH-RUN-03 — [FE/LVL] `console.error` v RegisterModal.tsx:61 — drop=console v prod, ale komentář lže
- **Kde:** `src/features/auth/components/RegisterModal.tsx:59-64`
- **Co:** Module-level `console.error('[captcha] VITE_TURNSTILE_SITE_KEY chybí...')` s komentářem „Viditelné v prod logu". Ve skutečnosti `vite.config.ts:18` má `drop: ['console']` v prod buildu → tenhle `console.error` se do prod bundlu nedostane. Fail-closed logika (`TURNSTILE_SITE_KEY === null`) funguje správně, ale log warning zmizí tiše — operátor ho v prod neuvidí.
- **Dopad:** 🟡 nízký (bezpečnostně OK — captcha je fail-closed; ale komentář zavádí; operátor přijde o diagnostiku).
- **Návrh:** odstranit komentář „Viditelné v prod logu" nebo nahradit za BE-side logging (operátor by stejně četl server log). Není urgentní.
- **L3** · 🆕

### LH-RUN-04 — [CI/OBJ] CI guard nepokrývá OBJ regresi (nemá baseline pro `logger.error(msg, errObj)`)
- **Kde:** `scripts/log-hygiene-scan.mjs` + `--ci` mód
- **Co:** `--ci` kontroluje jen `SEC/console/3RD` proti baselinu. `OBJ` a přímý `logger.error(msg, errObj)` pattern nemají CI guard → regrese LH-01 (LH-RUN-01) prošla do main tiše.
- **Dopad:** 🟡 strukturální mezera; bez guardu se stejný vzor může opakovat.
- **Návrh:** rozšířit `--ci` o check „žádné `logger.error(msg, errObject)` — tj. druhý arg musí být string nebo chybět" (scaner to musí rozlišit od `logError(logger, msg, err)` volání).
- **L2** · 🆕

## Ověřeno jako ✅ OK (HEAD potvrzeno)

| Co | Kde | Stav |
|---|---|---|
| LH-01 logError helper 43 míst | `common/logging/log-error.util.ts` + caller sites | ✅ HEAD čistý; 1 regression LH-RUN-01 |
| LH-02 log level gate prod | `main.ts:38-41` | ✅ |
| LH-03 smtp-mailer mask() | `smtp-mailer.provider.ts:54-59` | ✅ |
| LH-04 LogMailer prod gate | `log-mailer.provider.ts:27-32` | ✅ |
| LH-05 Docker rotace | `docker-compose.prod.yml` + `docker-compose.yml` | ✅ |
| LH-06 top-level handler | `main.ts:17-34` | ✅ |
| LH-07 3RD wire debug OFF + CI guard | `audit:logs --ci` zelený | ✅ |
| LH-08 users.service JSON.stringify conflicts | by-design ⚖️ | ✅ |
| LH-09 žádný morgan | main.ts | ✅ |
| LH-10 auth security eventy jen s IDs | auth.service.ts:399-465 | ✅ |
| LH-11 BE console.* runtime = 3 benigní | socket-io.adapter, env.validation, redis | ✅ |
| LH-12 FE drop:['console','debugger'] | vite.config.ts:18 | ✅ |
| M-RUNTIME 6/6 zelené | log-hygiene.spec.ts | ✅ (teeth ověřeny 2026-06-14; nová cesta campaign-purchase netestována) |
| auth sanitize (passwordHash/totpSecretEnc/backupCodeHashes) | auth.service.ts:680-688 | ✅ |
| 2FA TOTP logger — jen warn o chybějícím klíči | totp-crypto.service.ts:28-31 | ✅ |
| trusted-devices logger — jen userId v šabloně | trusted-devices.service.ts:92,105 | ✅ |
| throttler logger — err.message v šabloně | throttler.config.ts:57-59 | ✅ |
| game-events logger — err.message v šabloně | game-events.service.ts:271 | ✅ |
| RegisterModal debug commit (b6978214) | printMode.ts — reverted | ✅ (revert potvrzen) |

## PROOF-REQUEST

**PR-LH-00-01** `M-RUNTIME rozšíření na campaign-purchase`:
Stávající `log-hygiene.spec.ts` netestuje compensation failure cestu v `campaign-purchase.service.ts`. Pro L5 důkaz je potřeba test, který namockuje `purchaseRepo.create` → throw Mongoose-error s `keyValue: { accountId: CANARY_ID }` a přes spion zachytí co `this.logger.error` dostane. Blokováno: vyžaduje aplikaci opravy LH-RUN-01 (nahradit `logError`), pak test zčervená na nemodifikovaném kódu = teeth důkaz.

**PR-LH-00-02** `CI guard OBJ baseline`:
Po implementaci rozšíření scanneru (LH-RUN-04) spustit `audit:logs --ci` a ověřit zelenou na HEAD (po opravě campaign-purchase). Bez živé CI pipeline nelze strojově prokázat.
