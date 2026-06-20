# log-hygiene / 04-debug-loglevel — checkpoint RUN-2026-06-20-1621

## Pokrytí

Oblast: `DBG` `LVL` `FMT` — debug zbytky a log level v produkci.

Zkontrolováno:
- `main.ts` — log-level gate (LH-02)
- `socket-io.adapter.ts:36` — console.log startup
- `env.validation.ts:80` — console.warn startup
- `redis.module.ts:35` — console.error (err.message only, isJest gate)
- `account-cleanup.cron.ts:47` — logger.debug runtime
- `world-cleanup.cron.ts:34` — logger.debug runtime
- `article-category-slug-migration.ts:52` — logger.debug (scanner: seed, reálně OnApplicationBootstrap)
- `world-page-templates.matrix-seed.ts:102` — logger.debug (seed)
- parity.spec.ts (BE+FE) — console.log za `PARITY_REGENERATE` gate
- `vite.config.ts:18` — FE console stripping v prod buildu
- `GlobalErrorBoundary.tsx:19` — console.error (stripped v prod)
- CI guard `npm run audit:logs --ci` — zelený
- M-SCAN aktuální výstup (RUN-2026-06-20-1621/scanners/logs.txt) — totožný s předchozím RunEm (BE: 105 log volání, runtime 86, debug v runtime 2, console runtime 3; CI zelený)
- Delta oproti předchozímu RUN-2026-06-20-1303: +1 logger.log v `trusted-devices.service.ts` (payload.userId, CTX, osa 09 ne 04)

## Dosažená L vs cílová L

| Osa | Cílová L | Dosažená L | Metoda |
|-----|----------|-----------|--------|
| `DBG` | L3 | **L3** | M1 (čtení) + M-SCAN (katalog) + ověřena dosažitelnost v prod (LH-02 gate) |
| `LVL` | L3 | **L3** | M1 main.ts + M-SCAN + taint: debug/verbose gated v prod (isProd filter) |
| `FMT` | L2 | **L2** | M1 čtení: žádný `${obj}` → [object Object] v runtime lozích; JSON.stringify pouze v log-mailer (dev-only gate) a users.service (LH-08 by-design) |

## Nálezy

Žádné nové nálezy (`🆕`). Ověřeny předchozí verdikty:

**LH-02** `LVL` ✅ OPRAVENO (♻️)
- Kde: `main.ts:39-41`
- Co: `NestFactory.create` s `logger: isProd ? ['log','warn','error'] : [+debug,verbose]`
- Stav: gate drží; `logger.debug` v cron jobech (`account-cleanup.cron:47`, `world-cleanup.cron:34`) nedosáhne prod stdout
- L3 — mechanika ověřena staticky

**LH-11** `DBG` ✅ OK (♻️)
- Kde: `socket-io.adapter.ts:36` · `env.validation.ts:83` · `redis.module.ts:35`
- Co: 3 `console.*` v BE runtime — výhradně startup/diagnostika; žádné citlivé argumenty
- `socket-io.adapter.ts`: jen `[Socket.IO] Redis adapter aktivován` — benigní; podmíněno `SOCKET_IO_REDIS=1 && REDIS_URL` (prod feature flag)
- `env.validation.ts`: `console.warn` (NestJS Logger nedostupný v ConfigModule validate fn) — by-design
- `redis.module.ts`: `console.error` s `err.message` only + `isJest` guard — OK
- Baseline CI: 3 (všechny 3 pokryty)

**K-LOG14** `DBG` ⚖️ by-design (♻️)
- Kde: `backend/.../parity.spec.ts:22-29` · `FE src/.../parity.spec.ts:23-29`
- Gate: `const REGENERATE = process.env.PARITY_REGENERATE === '1'` — NENÍ `if (true)`, je env-gated
- `console.log` uvnitř `if (REGENERATE)` bloku, mimo normální test run; oba soubory `.spec.ts` → scanner: test kategorie
- Verdikt: ⚖️ záměrné, bez akce

**FMT** ✅ OK (♻️)
- Žádný `${obj}` → `[object Object]` v runtime lozích nalezen
- `JSON.stringify` jen v log-mailer (dev-only v prod guard line 27) a users.service:94 (by-design LH-08)
- FE console.error/warn droppovány v prod buildu (`vite.config.ts:18 drop:['console']`) → FMT problém v prod bundlu neexistuje

**Article-category-slug-migration `logger.debug`** — scanner false-classification (ℹ️)
- Kde: `article-category-slug-migration.ts:52`
- Scanner klasifikuje jako `seed` (filename obsahuje `migration`) — reálně `OnApplicationBootstrap` injectable (spustí se každý boot v prod)
- Nicméně: LH-02 gate → v prod `debug` level filtrován → nedosáhne stdout
- L3 dosaženo; žádné citlivé argumenty

## PROOF-REQUEST

Žádné PROOF-REQUEST pro tuto oblast. Vrstvy L4/L5 (runtime stdout capture) jsou pokryty
existujícím `M-RUNTIME` harnessem (`common/logging/log-hygiene.spec.ts`, 6/6 zelené, teeth ověřeny).
Tato oblast nevyžaduje živou infru nad rámec toho, co je již spuštěno.

> Vědomá hranice L9: bez log agregátoru nelze harvestovat retenci — pokryto v oblasti 08 (SINK).
