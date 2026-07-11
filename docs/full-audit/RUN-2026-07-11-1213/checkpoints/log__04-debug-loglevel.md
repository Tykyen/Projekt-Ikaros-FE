# log-hygiene — 04 debug zbytky & log level (RUN-2026-07-11-1213)

**Osy DBG/LVL/FMT. Verdikt: ✅ čisté, 0 nových nálezů. Prior fixy LH-02/LH-12 drží.**

## Ověřeno (L3)
- **LVL (K-LOG1/LH-02)** [main.ts:52-56] — `NestFactory.create(AppModule, { logger: isProd ? ['log','warn','error'] : ['log','warn','error','debug','verbose'] })`. V prod `debug`/`verbose` NEtečou. Scanner: BE debug volání=5, ale gated → v prod nedosažitelné. ✅
- **DBG (BE console.* runtime = 5)** — benigní startup/diagnostika:
  - [socket-io.adapter.ts] startup info, [env.validation.ts] startup warn, [redis.module.ts] `err.message`. ⚖️ Žádný problémový console.* mimo test/seed. Sedí na baseline scanneru (5).
- **FMT** — logy jsou stringy s IDs; žádný `${obj}`→`[object Object]` v runtime cestě zachycen.
- **FE console stripping (LH-12)** [vite.config.ts:18] `drop:['console','debugger']` v prod + [:22] `minify:'esbuild'` (jinak vite@8 oxc minifier drop ignoruje = no-op). ✅ prod FE bundle neloguje.
- **parity dumpy** (K-LOG14) — za test gate, klasifikováno scannerem jako test (BE test=3), ne runtime. ⚖️

## 🆕 tento run: 0
Log-level gate + FE stripping beze změny. Pozn.: FE `monitoring.ts:37` `console.error` fallback je v prod stripnut dropem (řeší log__07).
