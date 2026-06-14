# Log hygiene audit — registr nálezů

> Registr 14. stylu auditu. Plán: [`log-hygiene-plan/`](log-hygiene-plan/README.md).
> Stav: **plán napsán, sweep nezačal** (2026-06-14).
>
> ⚠️ **Citlivé hodnoty se sem NIKDY nezapisují** — jen **lokace + typ leaku**. Runtime probe zachycený
> stdout je artefakt běhu, necommituje se.

---

## Skóre

| | Počet |
|---|---|
| Seed kandidáti (`K-LOGx`) | 15 |
| Potvrzené nálezy (`LH-xx`) | 12 (M-SCAN + ruční verdikt 2026-06-14) |
| 🔴 kritických | **0** |
| 🟠 vysokých | 2 (LH-02 level gate, LH-05 sink rotace) |
| 🟡 středních | 6 |
| 🟢/✅ pozitivních | 4 |
| **Opraveno** | **8** (LH-01,02,03,04,05,06,07 + LH-12 už pokryto PC-09); LH-08 ⚖️ záměr, LH-09/10/11 ✅ bez akce |

Severity legenda: 🔴 kritická (token/heslo/hash leak) · 🟠 vysoká (PII / unbounded sink / 3rd-party debug) ·
🟡 střední (stack/debug šum) · 🟢 pozitivní (ověřeno OK) · ⚖️ vědomě akceptováno.

> **Závěr sweepu (M-SCAN, 2026-06-14):** BE 136 log volání (115 runtime), FE 16 (14 runtime). **Žádný 🔴.**
> Kód je log-vědomý (token truncation, klientovi neuniká stack F1, auth loguje jen IDs, žádný morgan).
> **Dominantní nález = systémový vzor `logger.error(msg, err)` (50×)** předávající celý `err` objekt.
> Strukturální nálezy: chybí log-level gate, chybí log rotace, chybí top-level handler. 3RD wire debug
> vše OFF (→ guard).

---

## Potvrzené nálezy

| ID | Osa | Sev | Lokace | Co teče / problém | Dosažitelné v prod? | Stav |
|---|---|---|---|---|---|---|
| LH-01 | OBJ/EXC | 🟡 | **43× systémově** (BE) — chat/upload/worlds/search/global-chat/pages gateways/joby/seed | `logger.error(msg, err)` / `.warn(msg, err)` předával **celý `err` objekt** — nepřesné; riskuje leak dat nesených chybou (Mongo `keyValue` s e-mailem, …) | ano | ✅ **OPRAVENO** — sdílený `logError`/`logWarn` ([common/logging/log-error.util.ts]) normalizuje na stack/String; 43 míst převedeno codemodem |
| LH-02 | LVL | 🟠 | main.ts:14 | `NestFactory.create` bez `logger` levels → `debug`/`verbose` v prod | ano | ✅ **OPRAVENO** — `logger: isProd ? ['log','warn','error'] : […+debug,verbose]` |
| LH-03 | PII | 🟡 | smtp-mailer.provider.ts:62 | e-mail příjemce v prod logu | ano | ✅ **OPRAVENO** — `mask()` → `t***@g***` |
| LH-04 | PII/SEC | 🟡 | log-mailer.provider.ts + mailer.module.ts:17 | LogMailer loguje e-maily + token[0:8]; bez fail-fast | jen misconfigurace | ✅ **OPRAVENO** — v `NODE_ENV=production` jen warn „mailer nenakonfigurován, mail neodeslán", žádný obsah; dev log zachován |
| LH-05 | SINK | 🟠 | docker-compose.prod.yml + docker-compose.yml | žádný `logging:` blok → `json-file` bez rotace → log roste donekonečna | ano | ✅ **OPRAVENO** — `x-logging` anchor (`json-file`, max-size 10m, max-file 3) na všechny služby |
| LH-06 | TOP | 🟡 | main.ts (chybělo) | žádný `unhandledRejection`/`uncaughtException` handler → raw dump při pádu | ano | ✅ **OPRAVENO** — handlery v `bootstrap()` logují name+stack přes Logger; uncaught → řízený `exit(1)` |
| LH-07 | 3RD | 🟢→guard | mongoose / nodemailer / socket.io / DEBUG env | vše OFF (ověřeno) | n/a | ✅ **GUARD** — `npm run audit:logs` + `--ci` (3RD wire debug / nový SEC / console v runtime selže CI) |
| LH-08 | PII | 🟡 | users.service.ts:90 | `JSON.stringify(conflicts)` loguje usernames | boot, vzácné | ⚖️ **by-design** — log JE účelem (operátor musí vidět, které username opravit); `onModuleInit`, jednorázová migrace |
| LH-09 | REQ | 🟢 | main.ts | žádný morgan / log middleware / request interceptor | — | ✅ OK |
| LH-10 | AUD | 🟢 | auth.service.ts:298,364,148/395/502 | security eventy logované jen s `userId`/`familyId`/`err.message` | — | ✅ základ OK (rozšíření failed-login/ban/admin volitelné) |
| LH-11 | DBG | ✅ | BE console.* runtime = 3 (socket-io.adapter:36, env.validation:80, redis.module:35 `err.message`) | benigní startup/diagnostika | — | ✅ OK |
| LH-12 | FE | 🟡 | socket.ts:38, WorldDiarySchemaEditorPage:289 | FE console v prod | jen browser | ✅ **už pokryto PC-09** — [vite.config.ts:18] `drop: ['console','debugger']` v prod buildu → FE v prod neloguje nic; dev browser logy OK |

> ⚠️ CTX flagy scanneru (9×) byly **false-positive** — BE loguje v message `.worldId`/`.userId`/`.id` (IDs),
> ne celé `dto`/`body`. Žádný nález celé entity v message části. (Scanner concat `user.iderr` rozbil `.id`
> boundary — vědomá nepřesnost jméno-based heuristiky, proto verdikt ruční.)

---

## Seed kandidáti (z [README](log-hygiene-plan/README.md) — verdikt až při běhu)

| Kandidát | Osa | Sev | Lokace | Oblast |
|---|---|---|---|---|
| K-LOG1 | LVL | 🟠 | main.ts:14 (bez `logLevels`) | 04 |
| K-LOG2 | PII | 🟡 | smtp-mailer.provider.ts:62 (e-mail v prod) | 02 |
| K-LOG3 | PII/SEC | 🟡 | log-mailer.provider.ts:22 (e-maily + token[0:8]) | 02 |
| K-LOG4 | OBJ/EXC | 🟡 | chat.service.ts:1526-1840 + captcha.service.ts:68 (`err` celý) | 03 |
| K-LOG5 | EXC | ⚖️ | http-exception.filter.ts:113 (stack server-side) | 03 |
| K-LOG6 | SINK | 🟠 | docker-compose.prod.yml (bez rotace) | 08 |
| K-LOG7 | 3RD | 🟢→guard | mongoose/nodemailer/socket.io debug OFF | 08 |
| K-LOG8 | TOP | 🟡 | chybí unhandledRejection/uncaughtException | 03 |
| K-LOG9 | FE/LVL | 🟡 | socket.ts:38 + WorldDiarySchemaEditorPage.tsx:289 + bundle | 07 |
| K-LOG10 | AUD | 🟢→ověřit | auth.service.ts:298,364 (security eventy) | 09 |
| K-LOG11 | INJ | 🟡 | user input v log stringu (search/chat) | 05/09 |
| K-LOG12 | CTX/JOB | 🟡 | chat/upload/worlds/users error logy + crony | 03/05 |
| K-LOG13 | SEED | 🟡 | matrix-seed + migrace (e-maily/hesla?) | 06 |
| K-LOG14 | DBG | ⚖️ | parity.spec dumpy za `PARITY_REGENERATE` | 04 |
| K-LOG15 | REQ | 🟢→ověřit | main.ts bez morgan/middleware | 05 |

---

## Tooling stav

| Nástroj | Stav | Pozn. |
|---|---|---|
| M-SCAN (`scripts/log-hygiene-scan.mjs`) | ✅ postaveno + spuštěno | katalog + taint; `--list`/`--docker`/`--ci`; balanced-paren parse (ne ts-morph) |
| M-DOCKER (sink scan) | ✅ součást scanneru `--docker` | potvrdil no-rotation + 3RD vše OFF + chybí TOP handler |
| M-RUNTIME (L5) | ✅ **postaveno + zelené 6/6** | [common/logging/log-hygiene.spec.ts] — zachytí args Loggeru (= co doteče na stdout), protlačí kanárky (CANARY_EMAIL/PWD/TOKEN) helperem `logError`/`logWarn` + Mongo-style chybou s enumerable poli + oběma mailery → asert žádný kanárek/JWT/passwordHash. Spy capture (ne raw stdout) = ekvivalent na log-boundary, nevyžaduje Mongo/full boot (žádný flaky) |
| Teeth (mutace) | ✅ **ověřeno koušou** | mutace `logError`→`logger.error(msg, err)` → spec zčervenal na uniklém `keyValue.email` kanárku (2 failed); po revertu zpět zelený |
| `npm run audit:logs` | ✅ přidáno | CI guard `--ci` (baseline: BE console 3 / SEC 1 gated dev / 3RD OFF) |

---

## Historie

- **2026-06-14** — plán + registr založeny (14. styl auditu). 15 seed kandidátů.
- **2026-06-14** — M-SCAN + M-DOCKER postaveny a spuštěny; **sweep hotový**, 12 nálezů `LH-01..12` (0🔴 / 2🟠 /
  6🟡 / 4🟢). Dominantní: LH-01 systémový `logger.error(msg,err)` 50×.
- **2026-06-14** — **OPRAVENO 8** (LH-01 helper+codemod 43 míst · LH-02 log level gate · LH-03 mask e-mail ·
  LH-04 LogMailer prod redakce · LH-05 docker log rotace obě compose · LH-06 top-level handler · LH-07 CI
  guard `audit:logs` · LH-12 už pokryto PC-09). LH-08 ⚖️ záměr, LH-09/10/11 ✅ bez akce. Ověřeno: BE
  `tsc --noEmit` čistý + **jest 2021/2021** (123 suites) + scanner `--ci` zelený + re-scan OBJ 41→1
  (zbytek dev/false-positive). Jednorázové codemody smazány. **PO BE změnách restart** + git commit na
  uživateli.
- **2026-06-14** — **DOTAŽENO na strop:** M-RUNTIME (L5) postaven — [common/logging/log-hygiene.spec.ts]
  (6/6 zelené) zachytí args Loggeru, protlačí kanárky helperem + Mongo-style chybou + oběma mailery, asert
  žádný leak. **Teeth ověřeny** (mutace logError → spec zčervenal na `keyValue.email`, revert → zelený).
  Audit pokryt na L2 (M-SCAN katalog) + L2 (M-DOCKER sink) + L5 (M-RUNTIME runtime) + teeth. Hlouběji už
  jen N/A (heap dumpy / agregátor retence — bez infra, vědomá hranice L9).
