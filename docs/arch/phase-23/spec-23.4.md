# Spec 23.4 — Error tracking reálně zapnutý

**Stav:** schváleno uživatelem 2026-07-19 · implementováno · **ověřeno živě 2026-07-19** (testovací event `sentry-test-fe` v dashboardu přes tunnel se zapnutým adblockem; validace tunnel relaye vrací 400 pro cizí org)
**Karta:** roadmap3 fáze 23, karta 23.4

## Problém

Kód je kompletně zadrátovaný na obou stranách (FE `monitoring.ts` + globální handlery; BE `main.ts` init + exception filtr + process handlery; deploy pipeline FE vars → Dockerfile ARG, BE secret → compose env), ale DSN v produkci není nastaven → error tracking = no-op. Pády testerů nevidíme.

Recon navíc odhalil **2 blockery, které musí být opravené PŘED zapnutím DSN:**

1. **LH-13 (audit 2026-07-11):** FE `Sentry.init` nemá `beforeSend` scrubber. Axios error nese `config.headers.Authorization` (JWT), `config.data` (na loginu heslo) a `response.data` — Sentry serializuje enumerable pole erroru → **JWT/hesla by egresovala do agregátoru** v okamžiku zapnutí DSN.
2. **CSP:** `connect-src` v `default.conf.template` nezná Sentry ingest host → FE eventy by enforce CSP **tiše zahodila** (vypadalo by to, že tracking běží, ale dashboard by byl prázdný).

## Rozhodnutí

- **Služba = Sentry SaaS free tier** (dle roadmapy; 5k eventů/měs. stačí), **EU data residency** (`de.sentry.io` region při zakládání org — GDPR, sedí k provoznímu rámci). Zamítnuto: GlitchTip self-host — další kontejner na 1 serveru s napjatou RAM + údržba navíc, free tier to řeší za nás.
- **2 projekty** (ikaros-fe / ikaros-be) → 2 DSN. Oddělené kvóty a grouping.
- **FE scrubber `beforeSend`:** rekurzivně odstranit klíče `authorization`, `cookie`, `password`, `token`, `secret`, `apikey` z `event.request`/`extra`/`contexts`; + `ignoreErrors` na známý šum (`ResizeObserver loop`). DSN je veřejný by-design, scrubber chrání odchozí data.
- **BE scrubber `beforeSend`:** totéž zrcadlově v `main.ts` (outbound axios chyby — Cloudinary aj. — nesou API klíče v headers). Sentry SaaS má server-side scrubbing, ale klientský je robustnější a nezávislý na službě.
- **CSP přes envsubst:** nová proměnná `${SENTRY_HOST}` v `connect-src`, odvozená v deploy.yml z `VITE_SENTRY_DSN` (stejný vzor jako `BACKEND_HOST` z `VITE_API_URL` — jeden zdroj pravdy). Prázdný DSN → prázdná substituce → CSP beze změny. Zamítnuto: hardcode `*.sentry.io` (široké + rozbije se při případném přechodu na GlitchTip).
- **Tunnel (doplněno po živém testu):** přímé FE requesty na `*.ingest.sentry.io` blokují adblockery (`ERR_BLOCKED_BY_ADBLOCKER`, ověřeno Opera GX) → uživatelé s adblockem by byli neviditelní. FE proto posílá envelope přes `tunnel: <VITE_API_URL>/api/monitoring/tunnel`; BE `SentryTunnelController` ho přepošle na ingest. **Žádný open relay:** přeposílá se jen na host shodný s BE `SENTRY_DSN` (obě FE/BE projekty = stejná org) + číselné project ID; raw body (text/plain NDJSON) registruje middleware v `main.ts` PŘED json parserem; selhání ingestu vrací 200 `{relayed:false}` (ne 5xx → žádný alert spam/rekurze); rate-limit = globální ThrottlerGuard 100/min/IP. Zamítnuto: „vypni si adblock" (nefunguje pro testery) i samostatná subdoména (další DNS+cert, path stačí).

## Zásahy

| # | Soubor | Změna |
|---|---|---|
| 1 | FE `src/shared/lib/monitoring.ts` | `beforeSend` scrubber (rekurzivní strip citlivých klíčů) + `ignoreErrors` |
| 2 | FE `default.conf.template` | `connect-src` + `https://${SENTRY_HOST}` |
| 3 | FE `Dockerfile` | `SENTRY_HOST` do `NGINX_ENVSUBST_FILTER` + ENV default prázdný |
| 4 | FE `docker-compose.yml` | `environment: SENTRY_HOST` |
| 5 | FE `.github/workflows/deploy.yml` | derive `SENTRY_HOST` z `VITE_SENTRY_DSN` (strip schéma+klíč+cesta) + zápis do server `.env` |
| 6 | BE `src/main.ts` | `beforeSend` scrubber v `Sentry.init` + raw body middleware pro tunnel |
| 7 | BE `docs/ops-runbook.md` | nová sekce §10: dashboard, kvóta, tunnel, co dělat při alertu |
| 8 | BE `src/common/monitoring/sentry-tunnel.controller.ts` **(nový)** | tunnel relay (validace DSN vůči vlastní org, fetch timeout 5 s, fail-soft) |
| 9 | FE `src/shared/lib/monitoring.ts` | `tunnel:` option v `Sentry.init` (stejná base jako apiClient) |

## Konfigurace (uživatel, po mergi kódu)

- Sentry účet: free tier, **EU region**, 2 projekty (React + Node) → 2 DSN
- FE repo: GitHub **var** `VITE_SENTRY_DSN` (veřejný, jde do bundlu)
- BE repo: GitHub **secret** `SENTRY_DSN`
- Deploy FE + BE

## Ověření

① FE: na živém webu v konzoli `setTimeout(() => { throw new Error('sentry-test-fe') })` → event v dashboardu ikaros-fe (projde `window.error` handlerem) · ② FE: Network tab — envelope request na ingest host prošel (ne CSP block) · ③ BE: `docker compose exec backend printenv SENTRY_DSN` neprázdný; první reálný 5xx se objeví v ikaros-be · ④ scrubber: v testovacím eventu zkontrolovat, že `extra`/`request` neobsahuje Authorization/heslo.

## Vědomě nekryto

Source mapy (minifikované stack trace v FE eventech — čitelnost horší, ale grouping funguje; upload source map = samostatný krok, do bety netřeba). Performance tracing (`tracesSampleRate: 0` zůstává — jen chyby, šetří kvótu).
