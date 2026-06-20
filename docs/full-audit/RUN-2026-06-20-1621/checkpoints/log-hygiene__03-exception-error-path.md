# log-hygiene / 03-exception-error-path — checkpoint RUN-2026-06-20-1621

> Auditor: Claude Sonnet 4.6 · Datum: 2026-06-20 · READ-ONLY

## Pokrytí

| Soubor / povrch | Ověřeno |
|---|---|
| `http-exception.filter.ts` (K-LOG5 / EXC) | ✅ L3 |
| `main.ts` — top-level handler (K-LOG8 / TOP) | ✅ L3 |
| `main.ts` — logLevels gate (LH-02 / LVL) | ✅ L3 |
| `log-error.util.ts` — helper `logError`/`logWarn` | ✅ L3 |
| `log-hygiene.spec.ts` — M-RUNTIME L5 teeth | ✅ L5 |
| `chat.service.ts` — 9× logError (K-LOG4 fix) | ✅ L3 |
| `upload.service.ts` — 3× logError + 2× logger.* | ✅ L3 |
| `worlds.service.ts` — 3× logError | ✅ L3 |
| `campaign-purchase.service.ts` — logger.error s `revertErr as Error` | 🐛 LH-RUN-01 |
| `character-accounts.service.ts` — logger.error s `revertErr as Error` | 🐛 LH-RUN-02 |
| `pages.service.ts` — logger.error s `rollbackErr as Error` | 🐛 LH-RUN-03 |
| `mailer.service.ts` — error path loguje `payload.to` (raw email) | 🐛 LH-RUN-04 |
| `captcha.service.ts` — logger.error/warn jen message string | ✅ L3 |
| `jwt-auth.guard.ts` — logger.warn jen err.message | ✅ L3 |
| `global-chat.gateway.ts` — 5× logWarn (wrapper) | ✅ L3 |
| `game-event-reminder.job.ts` — logError/logWarn | ✅ L3 |
| `game-events.service.ts` — logger.warn s `(err as Error).message` | ✅ L3 |
| `world-cleanup.cron.ts` / `account-cleanup.cron.ts` — `(err as Error).message` v message | ✅ L3 |
| `world-calendar-config.repository.ts` — `(err as Error).message` v message | ✅ L3 |
| `world-hard-delete.service.ts` — `(err as Error).message` v message | ✅ L3 |
| `ikaros-articles/article-category-slug-migration.ts` — `(err as Error).message` v message | ✅ L3 |
| `article-categories.seed.ts` + `gallery-categories.seed.ts` — `(err as Error).message` | ✅ L3 (seed/runtime) |
| `push.service.ts` — `String(err)` + endpoint URL | ⚖️ diskutabilní (viz LH-RUN-05) |
| `schema-registry.service.ts` — `String(e)` | ✅ L3 |
| Scanner logs.txt (M-SCAN re-run HEAD) | ✅ přečteno |
| M-RUNTIME spec (log-hygiene.spec.ts) | ✅ L5 |

## Dosažená L vs cílová L

| Osa | Cílová L | Dosažená L | Pozn. |
|---|---|---|---|
| `EXC` | L3 | **L3** | filtr čistý (K-LOG5 ✅); 3 nové regrese v catch blocích |
| `OBJ` | L3 | **L3** | dominantní vzor logError/43 míst ✅; 3 regrese „as Error" bypass |
| `TOP` | L2–L3 | **L3** | LH-06 fix ✅ ověřen |
| `CTX` | L2–L3 | **L3** | logWarn/logError v catch blocích logují jen IDs; 1 PII miss (mailer error path) |
| M-RUNTIME | L5 | **L5** | spec 6/6 zelené + teeth |
| `PII` (error path) | L3 | **L2** | LH-03 fix SMTP success path; error path (`mailer.service.ts:82`) missed |

## Nálezy

### LH-RUN-01 — [OBJ/EXC] `campaign-purchase.service.ts:385` — `revertErr as Error` přímý objekt obchází `logError`
- **Kde:** `c:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/campaign/services/campaign-purchase.service.ts:385-388`
- **Co:** `this.logger.error(msg, revertErr as Error)` — přímý NestJS logger.error s `Error` objektem jako druhý arg (NestJS bere jako `trace`). Codemod LH-01 (43 míst) tento soubor minul — soubor `campaign-purchase.service.ts` nebyl mezi původními ~8 `chat.service.ts` cíli.
- **Dopad:** Mongo/HTTP chyba z revert operace může nést enumerable pole (napr. `keyValue` s účtem) → teče do stdout celý. `🟡` střední (revert path, ne happy path; Mongo pole typicky `dto.accountId` string, ne email).
- **Návrh:** Nahradit `logError(this.logger, msg, revertErr)` — stejný vzor jako chat.service.ts.
- **L3** 🆕

### LH-RUN-02 — [OBJ/EXC] `character-accounts.service.ts:681` — `revertErr as Error` přímý objekt
- **Kde:** `c:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/character-subdocs/character-accounts.service.ts:681-684`
- **Co:** `this.logger.error(msg, revertErr as Error)` — stejný vzor jako LH-RUN-01. Transfer revert catch bypass `logError`.
- **Dopad:** viz LH-RUN-01. Navíc `input.fromAccountId` je v message (ID, ne PII).
- **Návrh:** `logError(this.logger, msg, revertErr)`.
- **L3** 🆕

### LH-RUN-03 — [OBJ/EXC] `pages.service.ts:278` — `rollbackErr as Error` přímý objekt
- **Kde:** `c:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/pages/pages.service.ts:278-281`
- **Co:** `this.logger.error(msg, rollbackErr as Error)` — DI-04 rollback postavy catch. Stejný vzor, mimo codemod LH-01.
- **Dopad:** Mongoose chyba z `charactersService.delete()` může nést `keyValue`/`code` pole.
- **Návrh:** `logError(this.logger, msg, rollbackErr)`.
- **L3** 🆕

### LH-RUN-04 — [PII/CTX] `mailer.service.ts:82` — raw email v error-path logu
- **Kde:** `c:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/mailer/mailer.service.ts:82`
- **Co:** `Mailer send failed: template=${template} to=${payload.to}` — `payload.to` je plná e-mailová adresa příjemce. LH-03 fix správně maskoval `SmtpMailerProvider.mask()` v success path (`smtp-mailer.provider.ts:71`), ale dispatch error path v `mailer.service.ts` mask nedostal.
- **Dopad:** Každý selhavší odesílaný mail zaloguje plain e-mail příjemce do prod stdout. Dosažitelné v prod (SMTP timeout/misconfiguration → tato cesta). `🟡` střední (PII, ale bez tokenu; odpovídá závažnosti LH-03 original).
- **Návrh:** `to=${SmtpMailerProvider.mask(payload.to)}` nebo helper `maskEmail(payload.to)` přesunutý do sdíleného util. Pozor: `SmtpMailerProvider.mask` je privátní statická — vyextrahovat nebo duplikovat jednoduché regex maskování.
- **L3** 🆕

### LH-RUN-05 — [CTX] `push.service.ts:156` — endpoint URL v warn logu — ⚖️ diskutabilní
- **Kde:** `c:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/push/push.service.ts:156`
- **Co:** `Push failed for ${sub.endpoint}: ${String(err)}` — VAPID push endpoint URL (např. `https://fcm.googleapis.com/fcm/send/<device-specific-token>`). Endpoint je quasi-pseudonymní (neobsahuje email/jméno), ale je linkable na konkrétní zařízení uživatele.
- **Dopad:** Nízký — endpoint se rotuje, není trvalý identifikátor. Provozní diagnostika (zjistit, který endpoint selhal) má legitimní hodnotu. `⚖️` by-design pokud PJ akceptuje; alternativa je logovat jen prvních 20 znaků.
- **Návrh:** Zvážit zkrácení endpointu: `${sub.endpoint.slice(0, 40)}…`. Neopravovat bez souhlasu.
- **L3** ♻️ (upozornění, ne nový kritický nález)

## Pozitivní ověření (oblast 03 — vše OK)

- **K-LOG5 / `http-exception.filter.ts:113`** ✅ — exception filter loguje `exception.name: exception.message` + `exception.stack` (string) server-side; klientovi `{ error: { code:'INTERNAL', message:'Vnitřní chyba serveru' } }` bez jediného interního detailu. Duplicní-key větev (kód 11000) se loguje VŮBEC ne — jen generická 409 odpověď. ✅ **jediné kontrolované místo** pro neočekávané výjimky (F1 error-contract).
- **K-LOG8 / `main.ts:22-34`** ✅ — `unhandledRejection` → `bootLogger.error(msg, reason.stack)`, `uncaughtException` → `bootLogger.error(msg, err.stack)` + `process.exit(1)`. Oba handlery normalizují na string (`.stack`/`String(reason)`), žádný syrový objekt dump. ✅ LH-06 kompletní.
- **LH-02 / `main.ts:39-41`** ✅ — `logger: isProd ? ['log','warn','error'] : ['+debug','+verbose']` — prod neloguje debug/verbose.
- **`log-error.util.ts`** ✅ — `logError` → `err instanceof Error ? err.stack : String(err)` (ne celý objekt); `logWarn` → jen message. Centrální místo pro scrubber.

## PROOF-REQUEST

| # | Co | Proč nelze staticky |
|---|---|---|
| PR-01 | Runtime stdout capture při selhání SMTP (timeout injekce) — ověřit, že `mailer.service.ts:82` skutečně leakne raw email do Docker stdout | M-RUNTIME spec testuje `SmtpMailerProvider` spy, **ne** `MailerService.dispatch()` error path → mezera v L5 pokrytí |
| PR-02 | Ověřit, že LH-RUN-01/02/03 (`revertErr as Error`) v prod podmínkách skutečně nesou Mongoose enumerable pole — injekce Mongo duplicate-key chyby do revert path | M-RUNTIME spec kryje `logError` helper, ne bypass volání přímým `logger.error(msg, err)` |
