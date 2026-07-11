# log-hygiene — 07 FE browser console (RUN-2026-07-11-1213)

**Osy FE/LVL. Verdikt: console prod-stripped ✅; 1 NOVÁ osa egress → LH-13 (ostřejší varianta zde).**

## Ověřeno
- **console stripping (LH-12)** [vite.config.ts:18,22] `drop:['console','debugger']` + `minify:'esbuild'` → prod bundle neloguje do konzole prohlížeče. FE console.* (16 runtime) = jen dev. ✅
- **socket.ts:45** `console.error('[socket] …', payload)` — BE error payload; díky error-contract F1 je generický tvar bez citlivých dat. V prod stripnuto. ⚖️
- **GlobalErrorBoundary.tsx:21** `console.error(error, componentStack)` — render chyba, prod stripnuto; NAVÍC volá `captureError(error, 'react-boundary')` [:23] → Sentry (viz níže). ⚖️
- tactical-map warny/erry (useMapScene, MapBackground, applyOperationToScene) — prefixované debug, prod stripnuto. ⚖️

## 🆕 LH-13 (🟡) — NOVÉ: FE Sentry egress bez scrubberu (ostřejší varianta)
[monitoring.ts] `@sentry/react` — `captureError(err, ctx)` [:33-38] volá `Sentry.captureException(err)`. Globální handlery [:25-30] zachytí **VŠECHNY** `unhandledrejection` + `window.error` + error boundary.
- **Riziko:** pokud je `err` **axios error**, nese `config.headers.Authorization` (JWT) + `config.data` (request body — na loginu heslo) + `response.data` (BE payload). Sentry serializuje enumerable pole erroru do `extra` → **JWT/heslo by egresovalo** do agregátoru. Žádný `beforeSend` scrubber, žádný explicitní `sendDefaultPii`.
- **Aktuálně LATENTNÍ:** FE Sentry NENÍ deploy-wired — `VITE_SENTRY_DSN` nikde v FE buildu/CI/env → `Sentry.init` se nespustí → `captureError` spadne na `console.error` (v prod stripnuto). Egress = 0, dokud někdo nenastaví `VITE_SENTRY_DSN`.
- **Doporučení:** před nastavením `VITE_SENTRY_DSN` přidat `beforeSend` (strip `authorization`/`password`/`token`/`cookie` z `event.extra`/`request`) + `ignoreErrors`. Pak by egress byl bezpečný. Bez toho = 🟠 v okamžiku zapnutí DSN.
