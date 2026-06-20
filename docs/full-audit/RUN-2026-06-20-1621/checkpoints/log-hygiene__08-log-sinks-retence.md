# log-hygiene / 08-log-sinks-retence — checkpoint RUN-2026-06-20-1621

Datum: 2026-06-20. Oblast: SINK (docker log driver/rotace) + 3RD (wire-level debug). Read-only.

## Pokrytí

Prošel jsem:
- `docker-compose.prod.yml` + `docker-compose.yml` — `logging:` bloky, rotace, driver, env vars, síťový driver
- `backend/Dockerfile` — ENV proměnné
- `backend/src/main.ts` — `NestFactory` log level gate, top-level handler (LH-02, LH-06)
- `backend/src/database/database.module.ts` — MongooseModule.forRootAsync (žádný `mongoose.set`)
- `backend/src/modules/mailer/providers/smtp-mailer.provider.ts` — `createTransport` (bez `logger/debug:true`)
- `backend/src/common/redis/redis.module.ts` — ioredis init (bez `DEBUG=`)
- `backend/src/socket-io.adapter.ts` — CustomIoAdapter (bez socket.io debug)
- `scripts/log-hygiene-scan.mjs` — M-SCAN skript (--docker a --ci větve)
- `package.json` — `audit:logs` skript
- `.github/workflows/ci.yml` — CI job `audit-crossrepo`
- `backend/src/common/config/env.validation.ts` — `console.warn` line 83
- `backend/src/common/logging/log-hygiene.spec.ts` — M-RUNTIME teeth
- `docs/log-hygiene-audit.md` — registr (stav po 2026-06-14 sweep)
- `docs/full-audit/RUN-2026-06-20-1621/scanners/logs.txt` — M-SCAN výstup tohoto runu
- Grep celého `backend/src` na `mongoose.set('debug'`, `logger: true`, `debug: true`, `DEBUG=`

Osa SINK: ✅ LH-05 OPRAVENO (obě compose mají `x-logging` anchor + `logging: *default-logging` na všech službách).  
Osa 3RD: ✅ LH-07 — mongoose/nodemailer/socket.io debug vše OFF; Dockerfile bez `ENV DEBUG`; MeiliSearch `MEILI_ENV: production`.  
CI guard: `audit:logs` = `--docker` (pouze tisk, neexit). `--ci` větev (exit≠0 na SEC/console/3RD) NIkoliv v CI pipeline.

## Dosažená L vs cílová L

| Osa | Cíl | Dosaženo | Poznámka |
|---|---|---|---|
| SINK | L3 (taint+dosažitelnost) | **L2** statická verifikace kódu + scanner potvrzení; L3 by vyžadovalo runtime důkaz z prod logu (vědomá hranice L9) | Rotace ověřena staticky ze YAML + scanner |
| 3RD | L3 | **L2** grep + scanner potvrzení OFF + Dockerfile; L3/L5 = runtime prod capture (L9 hranice) | OFF ověřeno staticky |
| CI guard | — | **L2** (scanner v CI jako vizuální check, ne exit-code guard pro `--ci`) | Viz nález LH-RUN-01 |

## Nálezy

### LH-RUN-01 — [SINK/3RD] CI guard `audit:logs` nepoužívá `--ci` flag (exit-code guard) · 🆕

**Kde:** `c:/Matrix/ProjektIkaros/Projekt-ikaros-FE/package.json` + `.github/workflows/ci.yml:128`

**Co:** `package.json` definuje `"audit:logs": "node scripts/log-hygiene-scan.mjs --docker"`. CI job `audit-crossrepo` volá `npm run audit:logs` — tedy jen `--docker` větev (tisk sink stavu, nevychází s exit≠0 nikdy). Větev `--ci` v `log-hygiene-scan.mjs:235-252` testuje nárůst BE runtime `console.*` nad baseline (3), nárůst SEC taintu (>1) a zapnutí 3RD wire debug — a při nalezení selže s `process.exit(1)`. Tato pojistka není zapojena do CI.

**Dopad:** Pokud někdo přidá `mongoose.set('debug', true)`, nový `console.log` v runtime BE, nebo nový SEC-taineovaný log volání, CI nezčervená. Guard existuje v kódu (`--ci`), ale není aktivní. LH-07 stav „✅ GUARD" v registru je tedy nepřesný — guard existuje jako skript, není zapojen jako blokující CI krok.

**Návrh:** V `package.json` změnit `audit:logs` na `"node scripts/log-hygiene-scan.mjs --docker --ci"` nebo přidat separátní `"audit:logs:ci": "node scripts/log-hygiene-scan.mjs --ci"` a zavolat ho v CI jobu místo/vedle `audit:logs`.

**Závažnost:** 🟡 střední (guard existuje, jen není aktivní; staticky 3RD off ověřeno)  
**L2 · 🆕**

---

### LH-RUN-02 — [3RD] `socket-io.adapter.ts:36` console.log v prod runtime (v CI baseline jako benigní) · ♻️

**Kde:** `c:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/socket-io.adapter.ts:36`

**Co:** `console.log('[Socket.IO] Redis adapter aktivován (multi-instance).')` — spouští se v prod containeru když `SOCKET_IO_REDIS=1`. Existující nález, klasifikován jako benigní startup diagnostika (LH-11 precedens). Není citlivý (bez dat/secretů). Scanner `--ci` baseline = `beConsole: 3` pokrývá tento případ.

**Dopad:** Nulový z bezpečnostního hlediska. Šum v docker logs — jedno volání při startu.

**Závažnost:** ✅ benigní — bez akce  
**L2 · ♻️**

---

### LH-RUN-03 — [SINK] MeiliSearch container nemá `logging:` blok v dev compose · 🆕

**Kde:** `c:/Matrix/ProjektIkaros/Projekt-ikaros/docker-compose.yml:88`

**Co:** Scanner hlásí `docker-compose.yml: logging blok=ANO rotace=ANO` — ověřeno kódem: MeiliSearch v dev compose má `logging: *default-logging` (řádek 89). **Není nálezem** — oprava LH-05 pokryla i dev compose MeiliSearch.  
Kontrola `docker-compose.prod.yml:66` — MeiliSearch má `logging: *default-logging`. ✅ obě compose OK.

**Závažnost:** ✅ OK  
**L2 · ♻️**

---

## PROOF-REQUEST

### PR-08-01 — Runtime stdout capture pro 3RD wire debug (L5 / L9 hranice)

**Co chybí:** Empirický důkaz, že v prod containeru přes `docker logs` neteče žádný mongoose query dump / nodemailer SMTP trace / socket.io frame debug. Statická analýza (grep + scanner) to potvrdila na L2; L3/L5 by vyžadoval buď:
(a) spuštěný prod container + `docker logs <id>` grep, nebo  
(b) M-RUNTIME extension zachycující adapter-level loggery (socket.io/mongoose event emitter debug events).

**Vědomá hranice:** bez přístupu k běžící infra toto nelze provést. L9 hranice per README.

### PR-08-02 — Ověření `--ci` guard produkce (aktivace skriptu v CI)

**Co chybí:** Potvrzení, že `--ci` flag byl/bude aktivován v CI a nevyprodukoval žádné false-positive z aktuálního kódu. Lze ověřit lokálně:  
```
cd Projekt-ikaros-FE && node scripts/log-hygiene-scan.mjs --ci
```
Toto by mělo vrátit exit 0 (baseline SEC=1, console=3) — ale výsledek v CI (s BE z `IKAROS_BE_ROOT`) není znám.
