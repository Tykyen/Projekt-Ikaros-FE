# log-hygiene — 00 cross-cutting (RUN-2026-07-11-1213)

**Verdikt: hloubka L2 (M-SCAN katalog) + L3 (taint/dosažitelnost) + cross-source (docker/deploy). Prior fixy LH-01..12 DRŽÍ. 1 NOVÁ osa (Sentry/alert egress) → viz LH-13 níže.**

## Architektura (co se změnilo od 2026-06-14)
Scanner `npm run audit:logs`: BE 163 log volání (runtime 143), FE 18 (runtime 16). console.* v runtime BE=5 / FE=16. debug/verbose runtime BE=3, FE=0. Docker logging blok=ANO (obě compose), 3RD wire debug=OFF, TOP handler=ANO.

**Zásadní změna posture:** od minulého auditu přibyl **monitoring (3. noha)** — `@sentry/node` (BE) + `@sentry/react` (FE) + Discord `AlertService` + `BruteForceMonitor` + `HealthMonitor`. Tím **padá jádrový předpoklad plánu** („žádný agregátor / Sentry → egress teoretický, vědomá hranice L9"). Nyní egress path EXISTUJE (off-device do GlitchTip/Sentry + Discord webhook).

## Prior fixy — ověřeno v HEAD kódu
- LH-01 `logError`/`logWarn` util [common/logging/log-error.util.ts] existuje + používán (moderation listenery, mailer, captcha:73). ✅
- LH-02 log-level gate [main.ts:52] `logger: isProd ? ['log','warn','error'] : [+debug,verbose]`. ✅
- LH-03 `mask()` e-mail [smtp-mailer.provider.ts:71, mailer.service.ts:109]. ✅
- LH-04 LogMailer prod = content-free warn [log-mailer.provider.ts:27-31] (gated `NODE_ENV==='production'`). ✅
- LH-05 docker rotace `x-logging` (json-file, 10m, 3) obě compose [docker-compose.prod.yml:4-8, .yml:19-22]. ✅
- LH-06 top-level handlery [main.ts:36-48] unhandledRejection/uncaughtException→exit(1), jen name+stack. ✅
- LH-07 3RD wire debug OFF + CI guard `audit:logs` [FE .github/workflows/ci.yml:133]. ✅
- LH-08 users.service:95 `JSON.stringify(conflicts)` — ⚖️ by-design beze změny (onModuleInit migrace).
- LH-12 vite drop console [vite.config.ts:18] + NAVÍC oprava vite@8 oxc minify→`minify:'esbuild'` (:22), jinak by drop byl no-op. ✅

## Scanner flagy = ověřené false-positive (concat heuristiky)
`user.iderr` (auth 181/536 = `user.id` + `err.message`), `targetIdp` (moderation = `p.targetId`+`p.decisionId`), SEC:1 log-mailer:33 (dev-gated větev). Vše ručně ověřeno jako IDs / err.message / gated. Žádný leak celé entity/tokenu/hesla.

## 🆕 tento run
- **LH-13 🟡 NOVÉ** — přidán Sentry/alert egress bez redakčního `beforeSend` scrubberu. Detail v log__03 / log__07 / log__08 + registr.
