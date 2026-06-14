# Log hygiene — uniká do logů něco citlivého a zůstaly v běhu debug zbytky?

> **Účel:** vzít **celou logovací plochu** obou repo (BE NestJS `Logger` + `console.*`, FE `console.*`,
> third-party knihovny, Docker stdout) a tvrdě ověřit, že **produkční běh nevypisuje do logů token,
> heslo, e-mail, PII ani secret**, že nezůstaly v běhu **debug zbytky a syrové exception dumpy**, a že
> log jako artefakt je **uzavřený** (rotovaný, nepřístupný, neforgovatelný). Cílová otázka:
> „když Ikaros běží na ostro a někdo otevře `docker logs` / log soubor na disku — **vidí jen
> bezpečné provozní záznamy**, nebo tam leží reset token, App Password, e-maily uživatelů, celý
> Mongoose dokument s `passwordHash`, nebo syrový stack z pádu?"
>
> **Čtrnáctý sourozenec** [`bug-plan/`](../bug-plan/README.md), [`ws-contract-plan/`](../ws-contract-plan/README.md),
> [`role-plan/`](../role-plan/README.md), [`form-schema-plan/`](../form-schema-plan/README.md),
> [`cache-plan/`](../cache-plan/README.md), [`state-consistency-plan/`](../state-consistency-plan/README.md),
> [`cascade-delete-plan/`](../cascade-delete-plan/README.md), [`db-integrity-plan/`](../db-integrity-plan/README.md),
> [`seed-scenario-plan/`](../seed-scenario-plan/README.md), [`nav-plan/`](../nav-plan/README.md),
> [`upload-media-plan/`](../upload-media-plan/README.md), [`prod-config-plan/`](../prod-config-plan/README.md)
> a [`error-contract-plan/`](../error-contract-plan/README.md). Je to **statický breadth-first sweep jedné
> starosti** (co a jak se loguje) napříč oběma repo — jako předchozích třináct — ale s **vlastní
> spustitelnou vrstvou**: scanner katalogizuje **každé log volání + klasifikaci argumentů** (taint ze
> citlivého zdroje), runtime probe **zachytí reálný stdout** za chybových i adversariálních podmínek, a
> Docker scan ověří, kam log fyzicky teče. Nálezy jsou tak **strojově prokázané**, ne jen vyčtené.
>
> **Stav:** zahájeno 2026-06-14. Plán napsán, sweep nezačal. Nálezy → [`../log-hygiene-audit.md`](../log-hygiene-audit.md) (ID `LH-xx`).

---

## Proč samostatný plán (co ostatní audity míjí)

Předchozích třináct auditů řeže systém po **datech, stavu, kontraktu a konfiguraci**. Dva se chybě věnují
přímo, ale z jiného úhlu:

- **error-contract** řešil **tvar chyby, kterou dostane KLIENT** (`{error:{code,message}}`) — *co letí po drátě
  zpátky do prohlížeče*. Neřešil **co se při té samé chybě zapíše na server** do stdout.
- **prod-config** řešil **konfiguraci, se kterou se proces nastartuje** (secrety, origin, fallbacky) — okrajově
  zmínil `console.log` v FE bundlu (K-PC9), ale **nesystematicky** a jen pro FE build.

**Žádný audit nepokrývá vrstvu *za* aplikací — log jako artefakt na disku/stdout/agregátoru, který čte
provozovatel.** A přesně tam žije vlastní třída úniků, kterou žádný kontraktový sweep nevidí, protože data
**neopouští server směrem ke klientovi** — uniknou **stranou, do logu**, kde sedí dlouho a čte je kdokoli
s přístupem k hostiteli:

| Slepá skvrna | Příklad reálného rizika v Ikarovi | Dopad |
|---|---|---|
| **Secret/token do logu** | reset/verify token, JWT, App Password (SMTP) vypsaný v debug/error logu | 🔴 převzetí účtu z logu |
| **PII do prod logu** | `smtp-mailer.provider.ts:62` loguje e-mail příjemce každého mailu na `log` level | 🟠 e-maily uživatelů v logu |
| **Celý objekt/entita** | `logger.error('...', err)` nebo log Mongoose user dokumentu → vysype `passwordHash` + vše | 🔴 hash hesla v logu |
| **Syrový exception dump** | `logger.error(err)` / `${err}` / Node default při pádu → celý stack s interními cestami | 🟡 info leak o vnitřku |
| **Debug zbytek v prod** | `console.log` / `logger.debug` ponechaný v běhu; `NestFactory.create` bez `logLevels` → debug teče do prod | 🟡 šum + leak |
| **Wire-level 3rd-party** | někdo flikne `mongoose.set('debug', true)` / nodemailer `logger:true` → každý dotaz s daty / SMTP AUTH v logu | 🔴 masivní leak, jediný řádek kódu |
| **Log injection (CWE-117)** | user input (username, zpráva, search dotaz) logovaný s `\n` → zfalšované řádky logu / rozbitý parser | 🟠 forging / poisoning |
| **Log sink bez rotace** | Docker bez `logging:` bloku → default `json-file` bez `max-size` → log roste donekonečna, leaknutá data leží napořád | 🟠 unbounded persistence |
| **Chybějící security audit log** | failed login / authz denial / ban / admin akce se neloguje → není stopa po průniku | 🟡 nelze detekovat útok |
| **Top-level dump** | žádný `unhandledRejection`/`uncaughtException` handler → pád = nekontrolovaný raw dump | 🟡 leak při pádu |

> 💡 **Kořen (jako každý audit má jeden):** **neexistuje logovací politika ani centrální logger wrapper.**
> 177 přímých `Logger.*` volání (50 souborů) + 23 `console.*` cpou **volné argumenty** (stringy, objekty,
> `err`, payloady) přímo do výstupu — **bez jediného místa, kde by se dalo zaškrtnout „tohle se nesmí
> logovat" / „tohle zredaguj".** A `NestFactory.create(AppModule)` ([main.ts:14]) nemá `logLevels`, takže
> default loguje **i `debug`/`verbose` v produkci.** Drift je tichý: stačí jeden `logger.debug(token)` nebo
> `mongoose.set('debug', true)` a leak je v prod, aniž cokoli spadne. Audit to zviditelní strojově (scanner
> + taint klasifikace + runtime stdout capture) a rozhodne, kde zavést **redakční wrapper / scrubber** a
> **log-level gate**.

📚 **Co je „log hygiene / scrubbing / log injection / log sink":** *Log hygiene* = disciplína, **co** smí a
**co nesmí** do logu (a na jaké úrovni). *Scrubbing/redakce* = automatické začernění citlivých polí
(`password`→`***`) než se zapíšou. *Log injection (CWE-117)* = útočník vloží do logovaného textu znaky
(`\n`, ANSI), kterými **zfalšuje** další řádky nebo rozbije parser agregátoru. *Log sink* = kam log fyzicky
teče (stdout → Docker `json-file` → soubor na disku → agregátor) a jak dlouho tam leží.

---

## Prior art (co už existuje a co míjí)

> ⚠️ Část pojistek už **existuje** — stavíme na nich, neduplikujeme.

| Artefakt | Co dělá | Co míjí |
|---|---|---|
| `http-exception.filter.ts:113` | neočekávané chyby loguje **server-side** (name+message+stack) a klientovi pošle generickou CS hlášku **bez stacku** (error-contract F1) | stack stále teče do stdout/sink; ostatní služby logují `err` syrově jinde |
| `log-mailer.provider.ts:28` | token ořezán na 8 znaků (anti-leak komentář) | stále loguje plné e-maily (`to`/`oldEmail`/`newEmail`) + 8 znaků tokenu je částečný leak |
| captcha/auth logy | logují většinou **jen IDs** (`userId=`, `familyId=`) + `err.message`, ne hesla/tokeny | mailer e-maily, captcha `logger.error(err)` celý objekt; žádná systematická záruka |
| [error-contract audit](../error-contract-audit.md) | tvar chyby **ke klientovi** (žádný stack leak v odpovědi) | obsah **server-side logu** při téže chybě |
| [prod-config audit](../prod-config-audit.md) K-PC9 | zmínil sourcemaps + `console.log` ve FE bundlu | jen FE build; ne BE; ne taint citlivých dat; ne runtime |
| paměť `project_ws_security_patterns` | WS identita/room security | co WS gateway **loguje** (payload zpráv?) |

> 💡 **Pozice tohoto auditu:** je to **vrstva logu jako artefaktu**, kterou žádný předchozí audit
> nepokrývá systematicky. Existující pojistky jsou **bodové** (jeden filtr, jeden truncation). Tenhle audit
> dělá **systematický katalog všech ~200 log míst + taint klasifikaci + runtime stdout capture + Docker
> sink** napříč oběma repo. Sdílené povrchy (FE bundle K-PC9, error tvar) **křížově odkazuje** (M2),
> nezdvojuje.

---

## Kontrolní osy (22 — 10 jádrových + 8 hloubkových + 4 nadstavba)

### Jádro (tvrzeno na celé logovací ploše)
| Osa | Zkr | Otázka | Cross-ref |
|---|---|---|---|
| **Debug zbytky** | `DBG` | žádný `console.*` / `logger.debug`/`verbose` / zakomentovaný log / parity dump není v **běhové** (ne-test) cestě | prod-config K-PC9 |
| **Secret/credential leak** | `SEC` | žádný token / heslo / hash / JWT / cookie / `authorization` header neteče do žádného log argumentu | prod-config SC |
| **PII** | `PII` | e-mail / username / IP / jméno / obsah zpráv-deníků se neloguje (nebo jen pseudonymizovaně) | db-integrity |
| **Exception dumpy** | `EXC` | `err`/`err.stack`/`${err}` se neloguje syrově; stack je jen server-side a kontrolovaně | error-contract F1 |
| **Log level** | `LVL` | prod log level je **gated** (`NestFactory` `logLevels` bez debug/verbose); FE console stripnut v buildu | prod-config K-PC9 |
| **Request/response** | `REQ` | žádný morgan/interceptor neloguje body / headers / query / cookies | nový |
| **Formát** | `FMT` | log je konzistentní (žádný `[object Object]`, žádný `${obj}` bez `JSON`); strojově parsovatelný | error-contract FMT |
| **Celé objekty** | `OBJ` | neloguje se **celá entita/dto/`err`/`req`/`user`** (Mongoose dok → `passwordHash`); jen vybraná pole | nový 👑 |
| **Log sink** | `SINK` | kam log fyzicky teče — Docker driver, **rotace** (`max-size`/`max-file`), kdo čte, retence | prod-config DP |
| **Third-party (wire)** | `3RD` | mongoose query debug / nodemailer SMTP debug / socket.io frame debug je **OFF v prod a guardnuto** | nový 👑 |

### Hloubka (skok ze čtení na prokázání)
| Osa | Zkr | Konkrétní tah | Co reálně chytí |
|---|---|---|---|
| **Kontext leak** | `CTX` | co se loguje „navíc" v catch blocích — celý dto / user / body vedle ID | tichý PII/secret leak v error cestě |
| **Job/cron logy** | `JOB` | cleanup/cron loopy logují počty + **ID/jména entit** uživatelů | PII v periodických logech |
| **Seed/migrace** | `SEED` | matrix-seed + migrace skripty (e-maily/hesla migrovaných účtů?) | leak při importu starého Matrixu |
| **FE browser** | `FE` | syrové `err`/payload v `console` v prohlížeči; debug šum v prod bundlu | BE error data / stav v konzoli |
| **WS gateway** | `WS` | gateway logger volání s **payloadem** zprávy | obsah chatu / souřadnice do logu |
| **Log injection** | `INJ` | user input (username, zpráva, search) logovaný s `\n`/ANSI bez sanitizace | log forging / poisoning (CWE-117) |
| **Security audit (inverzní)** | `AUD` | loguje se failed login / authz denial / ban / admin akce — **bez** citlivé části? | chybějící stopa po průniku |
| **Top-level** | `TOP` | `unhandledRejection`/`uncaughtException` handler — kontrolovaný dump při pádu? | nekontrolovaný raw dump |

### Nadstavba (Maximum+ — strop hloubky)
| Osa/nástroj | Zkr | Konkrétní tah | Co reálně chytí |
|---|---|---|---|
| **Scanner (AST taint)** | `M-SCAN` | katalog všech log volání + klasifikace argumentu (literál / proměnná / objekt / `err`) + **taint**: hodnota typu `User`/`*Dto` nebo pojmenovaná `password\|token\|email` tekoucí do log argu | leak ze citlivého zdroje, ne jen literál |
| **Runtime probe** | `M-RUNTIME` | e2e: protlač citlivé payloady všemi cestami + **fault injection** (pád DB/SMTP/Cloudinary → catch dumpy) → grep zachyceného **stdout** na token/email/secret regexy | empirický důkaz leaku |
| **Docker sink scan** | `M-DOCKER` | parse compose: log driver, rotace, kdo má přístup | unbounded/otevřený sink |
| **Teeth (mutace)** | `TE` | zmutuj redakční wrapper (zaloguj token) / zapni `mongoose.set('debug')` → probe **musí** zčervenat | audit-divadlo |

`DBG`/`LVL`/`FMT` jsou osy **provozní čistoty** (žádný šum/debug v prod). `SEC`/`PII`/`OBJ`/`EXC`/`CTX`/`3RD`
jsou osy **úniku obsahu** (neteče ven citlivá hodnota?). `SINK`/`INJ`/`TOP`/`AUD` jsou osy **logu jako
artefaktu** (uzavřený, neforgovatelný, kompletní stopa?). `M-SCAN`/`M-RUNTIME`/`TE` jsou **nadstavba** —
posouvají audit ze čtení na **strojový a běhový důkaz**.

---

## Metody ověření + úrovně jistoty

| Kód | Metoda | Nástroj |
|---|---|---|
| **M1** | Statické čtení — `main.ts`, exception filtr, mailer, gateways, jobs, FE `console.*` | Read/Grep |
| **M-SCAN** | **Katalog + taint** — [`tools/log-hygiene-scan`](tools/log-hygiene-scan.md): každé log volání → klasifikace argumentu + taint ze citlivého zdroje/typu (`SEC`/`PII`/`OBJ`/`DBG`) | node + AST (ts-morph) |
| **M-RUNTIME** | **Stdout capture** — e2e přes `createTestApp`, zachyť stdout, protlač citlivé payloady + fault injection, grep na token/email/secret (`SEC`/`PII`/`EXC`) | jest + fast-check |
| **M-DOCKER** | **Sink scan** — parse `docker-compose.prod.yml` log driver + rotace (`SINK`) | node skript |
| **M-MUT** | **Mutation** — zmutuj redakci/level gate → probe musí zčervenat (`TE`) | Stryker |
| **M2** | Cross-ref — [error-contract](../error-contract-audit.md) (EXC tvar) / [prod-config](../prod-config-audit.md) (K-PC9 FE bundle) / paměť ws-security | čtení |

| Úroveň | Co znamená | Důkaz |
|---|---|---|
| **L1** | staticky přečteno — log vypadá čistě | nejslabší |
| **L2** | **scanner katalog** — všechna log místa vyčíslena + argumenty klasifikovány | strojový smoke |
| **L3** | + **taint + dosažitelnost v prod**: citlivá hodnota reálně teče do logu **a** log level/branch ji v prod pustí (ne dev-only) | mechanika |
| **L4** | + **cross-source**: stejný leak ověřen v kódu i v sink konfiguraci (kde končí) | 2 zdroje sjednoceny |
| **L5** | + **runtime stdout capture**: leak empiricky zachycen v zachyceném stdout při vyvolané cestě | běhový důkaz |
| **L6** | + **cross-repo** FE+BE: leak sledován od BE log po FE console (a opačně) | cross-stack důkaz |
| **L8** | + **fuzz + fault injection**: leak/clean potvrzen za adversariálních a chybových podmínek (`fast-check` + vynucené pády) | adversariální důkaz |
| **L9** | **vědomá hranice** — bez agregátoru/Sentry se retence/egress nedají harvestovat, jen syntetizovat (probe), ne dokázat z prod logu | strop |

**Cíl (varianta Maximum):** jádro (`DBG`/`SEC`/`PII`/`EXC`/`LVL`/`OBJ`/`SINK`/`3RD`) na **L3** (taint +
dosažitelnost); `M-SCAN` jako **CI guard** (`npm run audit:logs`) — nový leak/debug se nikdy nevrátí tiše.
`REQ`/`FMT`/`CTX`/`JOB`/`SEED`/`FE`/`WS`/`INJ`/`AUD`/`TOP` na L2–L3.

**Cíl (varianta Maximum+):** navíc — **L5 runtime stdout capture** (`M-RUNTIME`) na `SEC`/`PII`/`EXC`;
**L8 fuzz + fault injection**; **L6 cross-repo** (FE↔BE log tok); celý audit projde **teeth** (`TE` mutace
redakce/level gate). To je strop; hlouběji už je jen N/A (viz níže).

📌 **Vědomá hranice (aby „nejhlubší" neznamenalo nafukování):**
- **Bez log agregátoru a bez Sentry** (FE potvrzeno — žádný `@sentry`/analytics/`sendBeacon`) → „retence
  v agregátoru" a „off-device egress" jsou **teoretické**. Reálný sink je Docker `json-file` na disku — a
  *to* je nález (`SINK`, žádná rotace). FE leak je **jen do uživatelovy vlastní konzole** → nižší severity.
- **Heap/core dumpy** (Node `--heapsnapshot-signal`, secrety v dumpu) = teoretický strop, nízká hodnota →
  **note-and-skip**, nestaví se.
- **Distribuovaná log korelace / request-ID tracing** = nice-to-have, ne bezpečnost (single-instance) →
  zmíněno v `AUD`, nestaví se nástroj.

---

## Baseline + pasti prostředí

| Check | Stav | Pozn. |
|---|---|---|
| Centrální logger wrapper / scrubber | ⬜ **NEEXISTUJE** | kořen — 177 `Logger` + 23 `console.*` přímo, žádná redakce |
| `NestFactory` `logLevels` gate | ⬜ **NEEXISTUJE** | [main.ts:14] default → debug/verbose v prod |
| Docker `logging:` blok (rotace) | ⬜ **NEEXISTUJE** | [docker-compose.prod.yml] jen `driver: bridge` (síť), žádný log driver |
| `unhandledRejection`/`uncaughtException` handler | ⬜ **NEEXISTUJE** | recon — žádný; Node default dump při pádu |
| mongoose/nodemailer/socket.io debug | ✅ OFF | recon — nikde zapnuto; audit má **guardnout**, ať nejde zapnout v prod |
| http-exception.filter server-side log | ✅ existuje | [http-exception.filter.ts:113] name+message+stack server-side, klientovi nic |
| token truncation v log-mailer | ✅ částečně | [log-mailer.provider.ts:28] 8 znaků (dev provider) |
| `log-hygiene-scan.mjs` (katalog + taint) | ⬜ postavit (oblast 00) | rozšiřuje vzor [`scripts/error-contract-scan.mjs`](../../scripts/error-contract-scan.mjs) |
| runtime stdout capture harness | ⬜ postavit (oblast 00) | reuse BE jest `createTestApp` (cross-ref seed-scenario) |

⚠️ **Pasti (z paměti + recon):**
- **NestJS Logger defaultně loguje VŠE** (log/error/warn/debug/verbose) → `logger.debug(...)` **dorazí do
  prod** dokud `NestFactory.create(AppModule, { logLevels: [...] })` neomezí. `LVL` musí ověřit **reálné
  chování**, ne jen kód.
- **Docker stdout = log.** Cokoli na stdout/stderr chytne `docker logs` a `json-file` driver → soubor na
  disku. „Jen `console.log` na vývoj" v prod containeru = trvalý záznam.
- **`logger.error(message, err)` 2. argument** — NestJS ho bere jako `trace` (stack string), ale když
  předáš **`Error` objekt**, zaloguje celý (vč. potenciálně citlivých polí). ~8× v [chat.service.ts] +
  [captcha.service.ts:68]. `OBJ`/`EXC`.
- **FE leak je jen do prohlížeče uživatele** (žádný egress) → nižší severity než BE; ale `socket.ts:38`
  loguje **BE error payload** (data z druhé strany) → ověřit obsah.
- **Po BE změně restart** ([paměť `feedback_be_restart_required`]) — `nest --watch` drží starý bundle;
  level/logger změna se bez restartu neprojeví.
- **FE bez prettieru** ([paměť `feedback_fe_no_prettier`]) → formátuj `eslint --fix`. **BE precommit =
  typecheck+lint, ne testy** ([paměť `feedback_be_precommit_prettier`]) → `M-RUNTIME`/jest ručně.
- **BE jest flaky paralelně** ([paměť `project_be_test_mongo_flaky`]) → `--maxWorkers=2`/`runInBand` pro
  ověřovací běh.
- 🔴 **Do registru NIKDY reálná hodnota** (token/e-mail/heslo zachycený probe). Zapisuje se **jen lokace +
  typ leaku** — stejná disciplína jako [prod-config M-SECRET](../prod-config-plan/02-secrets.md). Probe
  zachycený stdout se **nikam necommituje**.
- **Test/seed kód není prod cesta** — `parity.spec`, `*.seed.ts` spouštěné ručně/v testu jsou jiná
  kategorie; `DBG`/`SEED` musí rozlišit běhovou vs jednorázovou cestu (jinak falešný nález).

---

## Seed kandidáti (hypotézy — verdikt až při běhu)

> Běh každý povýší na `🐛 LH-xx`, `✅ shoda` nebo `⚖️ by-design`. Detail → [`../log-hygiene-audit.md`](../log-hygiene-audit.md).

- **K-LOG1** `LVL` 🟠 — [main.ts:14] `NestFactory.create(AppModule)` bez `logLevels` → `debug`/`verbose`
  teče do prod; 177 `Logger` volání vč. debug projde. **Kořen-level.** Oblast 04.
- **K-LOG2** `PII` 🟡 — [smtp-mailer.provider.ts:62] `Sent ${template} → ${payload.to}` na `log` level →
  e-mail příjemce v **prod** logu každého odeslaného mailu. Oblast 02.
- **K-LOG3** `PII`/`SEC` 🟡 — [log-mailer.provider.ts:22-36] loguje `to`/`oldEmail`/`newEmail`/`username` +
  8 znaků tokenu jako JSON; ověřit, že prod tenhle provider **nikdy** nepoužije (factory gate) + 8 znaků =
  částečný leak. Oblast 02.
- **K-LOG4** `OBJ`/`EXC` 🟡 — `logger.error('...', err)` s **celým `Error` objektem** ~8× v
  [chat.service.ts:1526-1840] + [captcha.service.ts:68] → stack/vnitřní pole do logu. Oblast 03.
- **K-LOG5** `EXC` ⚖️ — [http-exception.filter.ts:113] stack server-side (klientovi NEuniká, F1 GOOD);
  ověřit, že je to **jediné** kontrolované místo a stack neobsahuje PII. Oblast 03.
- **K-LOG6** `SINK` 🟠 — [docker-compose.prod.yml] bez `logging:` bloku → default `json-file` bez
  `max-size`/`max-file` → log roste donekonečna, leaknutá data leží napořád. Oblast 08.
- **K-LOG7** `3RD` 🟢→guard — mongoose/nodemailer/socket.io debug je OFF (recon) → ověřit + **CI guard**,
  ať nikdo neflikne `mongoose.set('debug')` / nodemailer `logger:true` v prod. Oblast 08.
- **K-LOG8** `TOP` 🟡 — žádný `unhandledRejection`/`uncaughtException` handler (recon) → pád = Node default
  raw dump na stderr. Oblast 03.
- **K-LOG9** `FE`/`LVL` 🟡 — FE bez console stripping (cross-ref prod-config K-PC9); [socket.ts:38] loguje
  **BE error payload**, [WorldDiarySchemaEditorPage.tsx:289] syrový `err`. 18 `console.*`/12 souborů zůstává
  v prod bundlu. Oblast 07.
- **K-LOG10** `AUD` 🟢→ověřit — auth **loguje** security eventy (reuse detection [auth.service.ts:298],
  password change [auth.service.ts:364]) jen s `userId`/`familyId` → pozitivní; ověřit **úplnost** (failed
  login? ban? admin akce?) a že nikde **není** sensitive část. Oblast 09.
- **K-LOG11** `INJ` 🟡 — user input v log stringu (username/world name/search dotaz) bez sanitizace `\n` →
  log forging; recon: BE loguje hlavně IDs (nižší riziko), ověřit search/chat content cesty. Oblast 05/09.
- **K-LOG12** `CTX`/`JOB` 🟡 — služby s nejvíc error logy (chat 11, upload 7, worlds 7, users 5) + cron joby
  → ověřit, že catch nelogují celý dto/user/body a joby nelogují jména/e-maily. Oblast 03/05.
- **K-LOG13** `SEED` 🟡 — matrix-seed + migrace (7+ Logger volání) → logují e-maily/hesla migrovaných účtů?
  Cross-ref [paměť `project_matrix_user_migration`] (jméno+heslo+placeholder e-mail). Oblast 06.
- **K-LOG14** `DBG` ⚖️ — `parity.spec` dumpy (FE+BE) za `PARITY_REGENERATE` gate → test-only, by-design;
  ověřit gate + že to není v běhové cestě. Oblast 04.
- **K-LOG15** `REQ` 🟢→ověřit — [main.ts] bez morgan/log middleware (recon) → žádné body/header logging →
  pozitivní; potvrdit, že žádný interceptor neloguje request. Oblast 05.

---

## Index oblastí (10)

| # | Oblast | Jádro povrchu | Osy |
|---|---|---|---|
| 00 | [Cross-cutting](00-cross-cutting.md) | logovací architektura (NestJS Logger default, console surface, exception filtr, mailer, FE console), master matice log míst, taint model, tooling | všechny |
| 01 | [Auth & secrets](01-auth-secrets.md) | auth.service (6), captcha (5), jwt guard, tokeny/hesla/refresh family | `SEC` `OBJ` `AUD` |
| 02 | [Mailer & PII](02-mailer-pii.md) | smtp/log mailer, e-maily, reset/verify tokeny v odkazech | `PII` `SEC` |
| 03 | [Exception & error path](03-exception-error-path.md) | http-exception.filter, `logger.error(err)` napříč službami, top-level handler | `EXC` `OBJ` `TOP` `CTX` |
| 04 | [Debug zbytky & log level](04-debug-loglevel.md) | `console.*` (BE 5 / FE 18), `logger.debug/verbose`, `NestFactory` logLevels, FE console stripping, parity dumpy | `DBG` `LVL` `FMT` |
| 05 | [Request / WS / job](05-request-ws-job.md) | morgan/interceptory, gateway logy s payloadem, cron/job loopy | `REQ` `WS` `JOB` `INJ` |
| 06 | [Seed & migrace](06-seed-migrace.md) | matrix-seed, migrace skripty, import starého Matrixu (jména/e-maily/hesla) | `SEED` `SEC` `PII` |
| 07 | [FE browser console](07-fe-browser-console.md) | error boundary, socket payload, syrový `err`, tactical-map warny, prod bundle | `FE` `LVL` |
| 08 | [Log sinks & retence](08-log-sinks-retence.md) | Docker log driver/rotace, third-party wire debug (mongoose/nodemailer/socket.io), kdo čte | `SINK` `3RD` |
| 09 | [Security audit trail](09-security-audit-trail.md) | inverzní hygiena — loguje se dost security eventů? bez citlivé části? log injection na auth cestě | `AUD` `INJ` |
| — | [tools/log-hygiene-scan](tools/log-hygiene-scan.md) | M-SCAN (katalog+taint) · M-RUNTIME (stdout capture) · M-DOCKER · M-MUT | nadstavba |

---

## Legenda statusů

- ⬜ netestováno · ✅ ověřeno OK · 🐛 nález → [`../log-hygiene-audit.md`](../log-hygiene-audit.md) (`LH-xx`) · ⚠️ podezřelé · ⏭️ blokované/`[human]`
- `K-LOGx` seed kandidát (hypotéza)

## Pracovní postup

1. **Tooling** — postav [`tools/log-hygiene-scan`](tools/log-hygiene-scan.md): (a) M-SCAN katalog všech
   `Logger.*`/`console.*` volání + klasifikace argumentu + taint ze citlivého zdroje/typu (L2), (b) M-DOCKER
   sink scan. Oblast 00.
2. **Runtime harness** — M-RUNTIME: `createTestApp` + stdout capture, protlač citlivé payloady + fault
   injection (L5). Oblast 00. Sdílet infra se [seed-scenario](../seed-scenario-plan/README.md).
3. **Sweep jádra (L2→L3)** — oblasti 01–04: auth/secrets → mailer/PII → exception/error → debug/level;
   každá osa scanem + taint + ověřením dosažitelnosti v prod (level/branch gate).
4. **Hloubka (L3→L5)** — oblasti 05–09: request/WS/job → seed/migrace → FE console → sink/3rd → audit
   trail; runtime stdout capture na `SEC`/`PII`/`EXC`.
5. **Maximum+ (L6→L8)** — fuzz + fault injection (`fast-check` + vynucené pády), cross-repo FE↔BE log tok,
   mutace redakce/level gate (`TE`).
6. **CI guard** — `log-hygiene-scan.mjs` (M-SCAN) do CI/precommit, aby nový leak/debug/3rd-party-debug
   nikdy nevrátily tiše.
7. **Nález → `LH-xx`** s **osa / soubor:řádek / co teče / na jaké úrovni / dosažitelné v prod? / vratné?**;
   neopravovat tiše, opravy gated (souhlas). **Citlivé hodnoty v registru jen typem, nikdy hodnotou.**
