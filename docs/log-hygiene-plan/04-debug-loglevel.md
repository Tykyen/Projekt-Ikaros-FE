# 04 — Debug zbytky & log level

> **Otázka:** zůstaly v **běhové** cestě debug zbytky a teče `debug`/`verbose` do prod? **Osy:** `DBG`
> `LVL` `FMT`. **Plocha:** `console.*` (BE 5 / FE 18), `logger.debug/verbose`, [main.ts:14] `NestFactory`,
> FE `vite.config.ts`, parity dumpy.

## Povrch

| Místo | Co | Cesta | Verdikt-hypotéza |
|---|---|---|---|
| [main.ts:14] | `NestFactory.create(AppModule)` bez `logLevels` | běhová | 🟠 `LVL` debug v prod — K-LOG1 |
| [socket-io.adapter.ts:36] | `console.log` startup | běhová (1×) | ⚖️ startup info |
| [env.validation.ts:80] | `console.warn` | běhová (startup) | ⚖️ |
| [redis.module.ts:35] | `console.error(err.message)` | běhová | ✅ jen message |
| parity.spec ×2 (FE+BE) | `console.log` dumpy | **test** (PARITY_REGENERATE) | ⚖️ — K-LOG14 |
| FE `console.*` 18× | warny/erry | prod bundle | 🟡 `FE` (oblast 07) |
| `logger.debug`/`verbose` | M-SCAN spočítá | běhová | dosažitelné dokud K-LOG1 |

## Co ověřit

1. **K-LOG1** `LVL` — `NestFactory.create(AppModule, { logLevels: prod ? ['log','warn','error'] :
   ['log','debug','verbose','warn','error'] })`. Dnes default = vše vč. debug v prod. **Kořen** — bez gate
   je jakýkoli `logger.debug(sensitive)` v prod dosažitelný. M-SCAN: kolik `debug`/`verbose` volání existuje
   = velikost expozice.
2. **`DBG`** — M-SCAN: každý `console.*` v **běhové** (ne-test, ne-seed) BE cestě = nález (obchází Logger
   gate). 5 recon: 4 startup/clean (⚖️), 0 problémových mimo test → potvrdit.
3. **K-LOG14** `DBG` ⚖️ — parity dumpy za `PARITY_REGENERATE` env gate → test-only. Ověřit, že gate drží
   (ne `if (true)`).
4. **`FMT`** — žádný `${obj}` → `[object Object]`; konzistence string vs strukturovaný. Pro budoucí agregátor
   zvážit JSON formát (nice-to-have, ne nález).
5. **FE console stripping** — `vite.config.ts` `esbuild: { drop: ['console','debugger'] }` (prod) → cross-ref
   prod-config K-PC9, řeší oblast 07.

## Pasti
- NestJS default loguje **vše** — `LVL` ověřit reálné chování (boot s `NODE_ENV=production`), ne jen kód.
- `drop: ['console']` ve FE smaže i `console.error` z error boundary → zvážit ponechat `error`/`warn`,
  dropnout jen `log`/`debug`. Rozhodnout v oblasti 07.
- Test/seed `console.*` není nález — M-SCAN cesta klasifikace povinná (jinak falešné nálezy).
