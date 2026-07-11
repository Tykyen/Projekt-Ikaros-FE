# prod-config / 03-cors-origin — checkpoint RUN-2026-07-11-1213

Datum: 2026-07-11. Auditor: hloubkový READ-ONLY agent oblasti 03 (styl prod-config, prefix `PC-`).
Rozsah: REST CORS (`main.ts`) · WS CORS (`socket-io.adapter` + 14 gateway) · static `/static/` CORS · **CSP** (BE helmet + FE nginx). Osy `OG` `FB` (+ `HD`/`TL` pro CSP).

## Pokrytí (HEAD kódu, přečteno celé)

- `backend/src/common/config/origins.ts` — centrální helper `getAllowedOrigins()` / `getPrimaryOrigin()`
- `backend/src/main.ts` — REST `enableCors` (ř.82-85), **helmet CSP** (ř.96-110, NOVÉ od 14.3), static `/static/` CORS (ř.116-123)
- `backend/src/socket-io.adapter.ts` — WS CORS (ř.73-76) + `maxHttpBufferSize` (ř.72) + `wsAccountGate` middleware
- `backend/src/gateways/base.gateway.ts` — bez `cors:` v dekorátoru; grep `cors` přes všech 14 `*.gateway.ts` → jen komentáře „PC-13"
- `backend/src/common/config/env.validation.ts` — `FRONTEND_URL` v `RECOMMENDED_IN_PROD` (jen varuje) + localhost check
- `docker-compose.prod.yml` — BE compose env (`NODE_ENV=production` ř.85; `FRONTEND_URL: ${FRONTEND_URL}` ř.95 BEZ `:?`)
- `.github/workflows/deploy.yml` (BE) — `FRONTEND_URL=${{ vars.FRONTEND_URL }}` ř.56 (PROOF-03-B z minula VYŘEŠEN — je wired)
- `Projekt-ikaros-FE/default.conf.template` — **FE nginx CSP** (ř.116, primární XSS hranice), security headers (ř.107-115)
- `Projekt-ikaros-FE/docker-compose.yml` + `.github/workflows/deploy.yml` (FE) — `BACKEND_HOST` odvozen z `VITE_API_URL`, `CSP_HEADER_NAME` enforce default

## Dosažená L vs cílová L

- **Cílová L (oblast 03):** L4 (jádro `OG`/`FB`, deploy parita 4 zdrojů)
- **Dosažená L: L3** — přečteno + kontext dosažitelnosti + gatednost `:5174` a `NODE_ENV` ověřena čtením; deploy parita čtena (compose ↔ kód ↔ deploy.yml), **živá infra neověřena** (READ-ONLY) → PROOF níže
- CSP prosweepováno **L1-L3** (statika + kontext dosažitelnosti/reachability BACKEND_HOST/CSP_HEADER_NAME)

---

## ♻️ Opravené nálezy — STÁLE DRŽÍ (re-ověřeno HEAD)

**PC-04 ♻️ (localhost:5174 v prod allowlistu)** — `origins.ts:10-16`: `getAllowedOrigins()` v produkci vrací JEN `[FRONTEND_URL ?? localhost:5173]`; dev porty `5173`/`5174` se přidají pouze `if (process.env.NODE_ENV !== 'production')` (ř.12-14). REST (`main.ts:83`) i WS (`socket-io.adapter.ts:74`) čtou stejný helper. Osa `OG`/`FB` · L3 · ♻️ drží.

**PC-13 ♻️ (mrtvý CORS ve 13 gateway dekorátorech)** — grep `cors` přes 14 `*.gateway.ts` → 0 aktivního `cors:`, jen komentáře „PC-13: WS CORS řeší CustomIoAdapter". `base.gateway.ts:12-14` `@WebSocketGateway({ namespace: '/' })` bez cors. Jediný zdroj WS originu = adapter. Osa `OG`/`HD` · L3 · ♻️ drží.

## Persistující nález z minulého RUNu (re-ověřen, nezměněn)

**PC-RUN-03-01 ♻️→stále 🟠 — `FRONTEND_URL` bez compose fail-fast → CORS/static fallback na localhost v prod**
- Kde: `origins.ts:10` + `origins.ts:20` · `docker-compose.prod.yml:95` · `env.validation.ts:28-29` (RECOMMENDED = jen varuje, ř.65-88)
- Popis: `getAllowedOrigins()`/`getPrimaryOrigin()` čtou `process.env.FRONTEND_URL ?? 'http://localhost:5173'`. `FRONTEND_URL` je v `RECOMMENDED_IN_PROD` → `env.validation` jen **varuje** (neblokuje start). `compose:95` `FRONTEND_URL: ${FRONTEND_URL}` bez `:?required`. Pokud je GitHub `vars.FRONTEND_URL` **prázdný**, origins vrátí `http://localhost:5173` jako jediný povolený origin → REST + WS + static CORS odmítnou VŠECHNY požadavky z `www.projekt-ikaros.com` (funkční blok, tichý — start nespadne).
- Reachability update: **PROOF-03-B z RUN-06-20 vyřešen** — `deploy.yml:56` `FRONTEND_URL=${{ vars.FRONTEND_URL }}` je wired do `.env`. ALE nic negarantuje, že `vars.FRONTEND_URL` je neprázdný (na rozdíl od `JWT_SECRET` s `:?` v compose + `test -n` v deploy). Fallback tedy dosažitelný při zapomenutém/prázdném GitHub varu.
- Dopad: 🟠 — funkční průlom v prod (app nefunguje, žádná startup chyba). Vztah PC-10 (config parita), PC-24 (meta-kořen: 3/~20 compose fail-fast).
- Návrh: `FRONTEND_URL: ${FRONTEND_URL:?required}` v compose NEBO přesun do `REQUIRED_IN_PROD` v `env.validation.ts` (filozofie ř.7-11 to záměrně neblokuje — pak aspoň compose `:?`).
- L3 · ♻️ · `OG`/`FB`

---

## 🆕 Nové nálezy (CSP — L1-L3, nová plocha od RUN-06-20)

Kontext: `main.ts:96-110` přidal **BE helmet CSP** (`default-src 'none'`, `frameAncestors 'none'`, HSTS, `crossOriginResourcePolicy:false`) — 14.3 API hardening, POZITIVUM. Primární XSS-CSP ale žije na FE nginx (`default.conf.template:116`). Sweep CSP:

**PC-RUN-03-06 🆕 🟡/⚖️ — FE CSP `script-src 'unsafe-eval'` (nejzávažnější slabina CSP)**
- Kde: `Projekt-ikaros-FE/default.conf.template:116` (`script-src 'self' 'sha256-…' 'unsafe-eval' https://challenges.cloudflare.com https://www.youtube.com https://meet.jit.si`)
- Popis: `'unsafe-eval'` povoluje `eval()`/`new Function()` → oslabuje XSS obranu (gadget pro spuštění kódu z injektovaného stringu). Dokumentováno (ř.93-95): YouTube `www-widgetapi` volá eval, CSP nemá per-doménový eval → musí být globální. Skripty jinak tvrdé (`'self'` + sha256 hash, žádné volné `'unsafe-inline'` v script-src). Ústupek doložen report-only fází (2026-06-19).
- Dopad: 🟡/⚖️ — dokumentovaný, 3rd-party vynucený ústupek; přijatelný, ale je to největší CSP slabina. Alternativa: sandbox YT do samostatného iframe originu bez eval (velký zásah, zbytek CSP by pak eval nepotřeboval).
- L2 · 🆕 · `HD`

**PC-RUN-03-07 🆕 🟡 — FE CSP `connect-src` bere holý `${BACKEND_HOST}` bez schématu → matchuje i `http://`/`ws://`**
- Kde: `default.conf.template:116` (`connect-src 'self' data: ${BACKEND_HOST} https://res.cloudinary.com …`)
- Popis: `${BACKEND_HOST}` je holý host (např. `api.projekt-ikaros.com`) BEZ schématu — v CSP host-source bez schématu matchuje `http`, `https`, `ws` i `wss`. Záměr (komentář ř.4-5): pokrýt naráz `https` (REST/polling) i `wss` (Socket.IO). Vedlejší efekt: povoluje i plaintext `http://`/`ws://` na ten host. Mitigováno `upgrade-insecure-requests` (tentýž řádek) → browser upgraduje na TLS. Nekonzistence: `img-src` tentýž host používá se schématem (`https://${BACKEND_HOST}`), `connect-src` bez.
- Dopad: 🟡 — nízký (upgrade-insecure-requests kryje); spíš konzistence/hygiena. Pozor: kdyby `BACKEND_HOST` byl prázdný (odvozen z prázdného `VITE_API_URL`), `connect-src` by ztratil API/WS host → CSP zablokuje veškerou komunikaci s BE. Kryto ale tranzitivně PC-15 (FE Dockerfile `RUN test -n "$VITE_API_URL"`), protože `BACKEND_HOST` se odvozuje z téhož `VITE_API_URL` (`deploy.yml:53-57`). Neduplikuji jako samostatný 🟠.
- L3 · 🆕 · `OG`/`TL`

**PC-RUN-03-08 🆕 🟡 — FE CSP `connect-src 'data:'` (a `font-src data:`)**
- Kde: `default.conf.template:116` (`connect-src 'self' data: …`)
- Popis: `data:` v `connect-src` je neobvyklé — povoluje fetch/XHR na `data:` URI. Malý povrch (data: nemá origin, nelze exfiltrovat na cizí server), ale zbytečně široké; typicky pozůstatek po ladění. `font-src … data:` je běžné (inline fonty), OK.
- Dopad: 🟡 — nízký, hygiena; ověřit, zda appka `data:` v connect-src reálně potřebuje, jinak odebrat.
- L2 · 🆕 · `HD`

## Ostatní ověřené body (bez samostatného nálezu)

- ✅ **BE helmet CSP** (`main.ts:99-104`) `default-src 'none'` + `frameAncestors 'none'` na /api — správný restriktivní hardening (JSON API nepotřebuje víc). POZITIVUM (14.3).
- ✅ **`credentials: true`** na REST (`main.ts:84`) i WS (`socket-io.adapter.ts:75`); origin je explicitní allowlist (pole), NE `*`/`origin:true`. Prohlížeč by `*`+credentials odmítl — není riziko.
- ✅ **`maxHttpBufferSize` 5 MB** (`socket-io.adapter.ts:72`) konzistentní s body limitem `5mb` (`main.ts:62-63`, oblast 08).
- ✅ **static `/static/` CORS** (`main.ts:116-123`): `Access-Control-Allow-Origin: getPrimaryOrigin()` (jedna hodnota, správně pro setHeaders) + `Cross-Origin-Resource-Policy: cross-origin` (PixiJS WebGL textury). Riziko localhost fallbacku = shodné s PC-RUN-03-01.
- ✅ **FE security headers** (`default.conf.template:107-116`): `frame-ancestors 'self'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `X-Content-Type-Options nosniff`, HSTS, `Permissions-Policy` (jen Jitsi A/V) — solidní. `CSP_HEADER_NAME` default enforce (`docker-compose.yml:16`).
- ⚠️ `main.ts:108` **`crossOriginResourcePolicy: false`** vypíná helmetí CORP globálně → /api JSON odpovědi nemají CORP hlavičku (default same-origin zrušen). Nízké — /api chrání CORS, ne CORP; static si CORP nastavuje sám. Není origin-allowlist problém, jen poznámka.

## Verdikt oblasti

- **Žádný 🔴, žádný 🔓 (otevřený/regreslý origin).** Origin allowlist je uzavřený, dev porty gated na `NODE_ENV`, žádný wildcard, WS credentials+explicit origin. PC-04/PC-13 opravy drží.
- **Nejzávažnější: PC-RUN-03-01 (🟠 persistující)** — `FRONTEND_URL` bez compose fail-fast → tichý localhost CORS blok v prod při prázdném varu. Návrh: `:?required` v compose.
- CSP nová plocha: solidní základ, jediná reálná slabina `'unsafe-eval'` (🟡/⚖️ dokumentovaný, YT-vynucený); + 2× hygiena (`connect-src` holý host / `data:`).

## PROOF-REQUEST (nezměřitelné z READ-ONLY)

**PROOF-03-A — živá infra: je `NODE_ENV=production` reálně v běžícím BE kontejneru?**
- `docker-compose.prod.yml:85` deklaruje `NODE_ENV: production` (staticky OK). Bez ověření běhu nelze empiricky tvrdit, že `origins.ts:12` gate `:5174` v prod skutečně sepnul. Priorita: střední (edge case). Ověř `docker inspect` / startup log.

**PROOF-03-B — VYŘEŠEN** — `FRONTEND_URL` je wired do BE `deploy.yml:56` (`vars.FRONTEND_URL`). Zbývá jen slabina „var může být prázdný" (= PC-RUN-03-01), ne „vůbec se nepředává".

**PROOF-03-C 🆕 — je `CSP_HEADER_NAME` v prod nastaveno na enforce (ne report-only)?**
- FE `deploy.yml:66` píše `CSP_HEADER_NAME=${{ vars.CSP_HEADER_NAME }}`; prázdný var → compose default `Content-Security-Policy` (enforce, `docker-compose.yml:16`). Ověřit, že `vars.CSP_HEADER_NAME` NENÍ omylem zaseklý na `Content-Security-Policy-Report-Only` (pak CSP jen loguje, neblokuje). Priorita: střední. Ověř response header živého FE.
