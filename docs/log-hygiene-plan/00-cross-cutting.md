# 00 — Cross-cutting: logovací architektura, master matice log míst, taint model, tooling

> Společný základ pro všechny oblasti. Drží: (A) **jak log vzniká a kam teče** v obou repo, (B) **master
> matici** log míst (kde → co → úroveň → sink), (C) **taint model** (co je „citlivý zdroj" tekoucí do logu),
> (D) **tooling spec**.
>
> ⚠️ Tento dokument zapisuje **vzory a lokace** log volání (veřejné v repu). **Nikdy** sem nepatří reálná
> zachycená hodnota (token/e-mail/heslo z runtime probe).

---

## A. Logovací architektura — jak log vzniká a kam teče

### BE (NestJS) — zdroje logu
1. **`new Logger(context)` + `this.logger.{log,error,warn,debug,verbose}(...)`** — **177 výskytů / 50 souborů**
   (M-SCAN přesní). Default `ConsoleLogger` → `process.stdout`/`stderr`. **Žádný wrapper, žádná redakce.**
2. **`console.{log,warn,error}`** — **5 výskytů / 4 soubory**: [socket-io.adapter.ts:36] (startup info),
   [env.validation.ts:80] (warn), [redis.module.ts:35] (`err.message`), [parity.spec] (test-only ×2). Nízká
   plocha, ale obchází i budoucí Logger gate.
3. **`NestFactory.create<NestExpressApplication>(AppModule)`** ([main.ts:14]) — **bez `logLevels`** → NestJS
   default zapíná **všechny úrovně vč. `debug`/`verbose`** i v produkci. **Bez `bufferLogs`, bez morgan, bez
   log middleware** (recon) → žádné HTTP request logování (dobré pro `REQ`, ale ani audit stopa).
4. **`HttpExceptionFilter`** ([http-exception.filter.ts:113]) — neočekávané (ne-HTTP) chyby loguje
   `error(name+message, stack)` **server-side**; klientovi jen generická CS hláška bez stacku (error-contract
   F1). **Jediné kontrolované místo pro exception dump.**
5. **Third-party knihovny** — mongoose, nodemailer, socket.io, ioredis. Vlastní debug **OFF** (recon: žádný
   `mongoose.set('debug')`, žádné `logger:true`/`debug:true`). Aktivovatelné jedním řádkem / env (`DEBUG=*`).
6. **Top-level** — **žádný** `unhandledRejection`/`uncaughtException` handler (recon). Pád → Node default raw
   dump na stderr. `process.on('error')` jen 3× (Redis/stream, logují `err.message`).

### BE — kam log teče (sink)
`stdout`/`stderr` → **Docker** → **`json-file` driver** (default, [docker-compose.prod.yml] nemá `logging:`
blok — jen `driver: bridge` = síťový) → soubor `/var/lib/docker/containers/<id>/<id>-json.log` na hostiteli
→ **bez rotace** (`max-size`/`max-file` nenastaveno) → roste donekonečna, čte `docker logs` / kdokoli s
přístupem k hostiteli. **Žádný agregátor / Sentry** (vědomá hranice L9).

### FE (React) — zdroje logu
1. **`console.{log,warn,error}`** — **18 výskytů / 12 souborů** (převážně tactical-map warny/erry s prefixy).
   Cíl = **konzole prohlížeče uživatele** (žádný egress; cross-ref: žádný Sentry/analytics/`sendBeacon`).
2. **`GlobalErrorBoundary`** ([GlobalErrorBoundary.tsx:19]) — `console.error('[GlobalErrorBoundary]', error,
   componentStack)`.
3. **Build** — `vite.config.ts` minimální → **žádné `drop_console`/`drop_debugger`** → `console.*` zůstává v
   prod bundlu (cross-ref prod-config K-PC9).

📚 **Důsledek:** BE log je **server-side artefakt** (vysoká severity leaku — čte ho provozovatel/útočník na
hostiteli, leží dlouho). FE log je **per-browser** (nižší severity — vidí ho jen ten uživatel), ale je
**veřejně viditelný** v jeho devtools a může zrcadlit BE data (`socket.ts:38` payload).

---

## B. Master matice log míst (recon 2026-06-14)

> Vstupní hypotéza, ne verdikt. M-SCAN doplní úplný katalog. Sloupce: **Zdroj · Soubor:ř · Co se loguje ·
> Úroveň · Sink · Osa**.

| Zdroj | Soubor:ř | Co se loguje (recon) | Úroveň | Sink | Osa |
|---|---|---|---|---|---|
| SmtpMailer | [smtp-mailer.provider.ts:62] | `template → e-mail příjemce` | `log` | BE stdout | PII |
| LogMailer | [log-mailer.provider.ts:22] | `to/oldEmail/newEmail/username` + token[0:8] (JSON) | `log` | BE stdout | PII/SEC |
| auth reuse | [auth.service.ts:298] | `userId`, `familyId` | `warn` | BE stdout | AUD ✅ |
| auth pwd change | [auth.service.ts:364] | `userId` | `log` | BE stdout | AUD ✅ |
| auth mailer fail | [auth.service.ts:148,395,502] | `user.id` + `err.message` | `warn` | BE stdout | EXC ✅ |
| captcha net err | [captcha.service.ts:68] | `'...network error'` + **`err` celý** | `error` | BE stdout | OBJ/EXC |
| captcha fail | [captcha.service.ts:62] | Turnstile `error-codes` | `warn` | BE stdout | ✅ |
| chat handlers | [chat.service.ts:1526-1840] | `worldId`/`userId` + **`err` celý** (~8×) | `error` | BE stdout | OBJ/EXC |
| exception filtr | [http-exception.filter.ts:113] | `name: message` + **stack** (server-side) | `error` | BE stdout | EXC ⚖️ |
| redis | [redis.module.ts:35] | `err.message` | `console.error` | BE stderr | EXC ✅ |
| socket startup | [socket-io.adapter.ts:36] | startup info | `console.log` | BE stdout | DBG ✅ |
| FE error boundary | [GlobalErrorBoundary.tsx:19] | `error`, `componentStack` | `console.error` | browser | FE |
| FE socket err | [socket.ts:38] | **BE error payload** | `console.error` | browser | FE |
| FE schema editor | [WorldDiarySchemaEditorPage.tsx:289] | syrový `err` | `console.error` | browser | FE |
| FE tactical-map | [useMapScene.ts:178,203] aj. | catch-up/reconnect `err` | `console.error/warn` | browser | FE |
| seed/migrace | `*.seed.ts`, migrace (7+) | ID/jména/počty | `log` | BE stdout (jednorázově) | SEED |
| Docker sink | [docker-compose.prod.yml] | — | — | `json-file` **bez rotace** | SINK |

---

## C. Taint model — co je „citlivý zdroj" tekoucí do logu

> Jádro M-SCAN: log volání není leak, dokud do něj neteče **citlivá hodnota**. Klasifikace argumentu:

| Třída argumentu | Příklad | Verdikt bez kontextu |
|---|---|---|
| **literál** | `'Chat backfill dokončen'` | ✅ bezpečné |
| **ID / počet** | `userId=${id}`, `(${n} světů)` | ✅ nízké (pseudonymní identifikátor) |
| **`err.message`** | `${err instanceof Error ? err.message : ...}` | 🟡 kontrolované (jen message, ne objekt) |
| **`err` / `error` objekt** | `logger.error('...', err)` | 🟠 `OBJ`/`EXC` (stack + pole) |
| **citlivě pojmenovaná proměnná** | `token`, `password`, `secret`, `hash`, `email`, `authorization`, `cookie` | 🔴 `SEC`/`PII` |
| **citlivý typ** | hodnota typu `User`/`*Dto`/`*Entity`/Mongoose `Document` | 🔴 `OBJ` (celá entita → `passwordHash`) |
| **request/body/payload** | `req.body`, `dto`, `payload` (ne jen `.id`) | 🟠 `CTX`/`REQ` |
| **user input string** | `username`, `name`, `query`, `message.content` v log textu | 🟡 `INJ` (newline forging) + příp. PII |

**Taint pravidlo (M-SCAN L3):** argument je **flagnut**, když je (a) citlivě pojmenovaný, (b) typovaný
citlivým typem (ts-morph type check), nebo (c) odvozený z citlivého zdroje (`req.body.*`, `*.passwordHash`,
`tokenService.*`) bez projití redakcí/`.id`/`.slice`. Literály a čisté ID se nehlásí (jinak šum).

**Sensitive identifier seznam (regex pro fallback grep):**
`token|password|passwd|pwd|secret|hash|jwt|bearer|authorization|cookie|session|apikey|api_key|email|e-mail`
+ české `heslo|token|tajn`. ⚠️ false-positive: `tokenizer` (search modul), `hashtag`, `emailVerified`
(boolean) → whitelist v scanneru.

---

## D. Dosažitelnost v prod (L3 gate)

> Leak je reálný jen když ho prod **pustí**. Tři brány:

1. **Log level** — `logger.debug`/`verbose` teče jen pokud `NestFactory` level dovolí. Dnes **dovolí vše**
   (K-LOG1) → debug leak je **v prod dosažitelný**. Po opravě (level gate) by debug leak byl dev-only.
2. **Branch gate** — dev-only větve (`if (NODE_ENV !== 'production')`, `LogMailerProvider` factory) → leak
   nedosažitelný v prod, pokud gate drží. M-SCAN/probe musí ověřit gate, ne jen existenci řádku.
3. **Sink** — i bezpečný level skončí na disku bez rotace (`SINK`) → otázka retence/přístupu, ne obsahu.

---

## E. Tooling spec (detail → [tools/log-hygiene-scan.md](tools/log-hygiene-scan.md))

| Tool | Vstup | Výstup | Úroveň |
|---|---|---|---|
| **M-SCAN** | ts-morph AST přes oba repo: každé `Logger.*`/`console.*` | katalog (soubor:ř, úroveň, třída argumentu, taint flag) + CI guard diff | L2/L3 |
| **M-RUNTIME** | `createTestApp` + stdout capture; protlač citlivé payloady + fault injection | grep zachyceného stdout na sensitive regex → empirický leak | L5/L8 |
| **M-DOCKER** | parse `docker-compose*.yml` | log driver + rotace (`max-size`/`max-file`) + verdikt | L2 |
| **M-MUT** | Stryker na redakční wrapper / level gate (po opravě) | testy/probe musí zčervenat | teeth |

> 💡 M-SCAN je kandidát na **CI guard** (`npm run audit:logs`, vzor [`scripts/error-contract-scan.mjs`]) —
> nový log s tainted argumentem / nový `console.*` v běhové cestě / zapnutý 3rd-party debug nesmí projít
> tiše do main.

---

## F. Pasti specifické pro tooling

- **M-SCAN multiline** — `logger.error(\n '...',\n err,\n)` se láme na víc řádků; AST (ts-morph) to řeší
  nativně (čte `CallExpression` argumenty), regex ne → **proto AST, ne grep** pro taint.
- **M-SCAN typová informace** — taint přes typ (`User`/`Document`) potřebuje `ts-morph` `getType()` s
  načteným `tsconfig`; bez typů jen jméno-based heuristika (slabší). FE i BE mají vlastní `tsconfig`.
- **M-RUNTIME stdout capture** — NestJS Logger píše přes `process.stdout.write`; v jest přesměrovat
  `process.stdout`/`stderr` na buffer **před** `createTestApp`; Mongo Memory flaky → `--runInBand`
  ([paměť `project_be_test_mongo_flaky`]).
- **M-RUNTIME fault injection** — vynutit pád: mock `MailerService.send` → throw, mock Mongo query → reject,
  mock Cloudinary → 500 → spustí catch dumpy (`OBJ`/`EXC`); pak grep stdout.
- **M-RUNTIME sensitive seed** — do payloadů vkládej **rozpoznatelné kanárky** (`CANARY_TOKEN_abc123`,
  `canary@leak.test`) → grep hledá kanárky, ne reálné hodnoty → **žádná reálná data v testu ani logu**.
- **false-positive `tokenizer`/`hashtag`/`emailVerified`** — whitelist (viz §C).
- **FE console = browser** — M-RUNTIME nedokáže FE console bez headless browseru; FE strana řešena
  staticky (M-SCAN) + cross-ref prod-config bundle. `FE` osa max L2-L3.
- **Žádná reálná data v registru/commitu** — probe zachycený stdout je **artefakt běhu**, nikam se
  necommituje; registr zapisuje jen lokaci + typ.
