# prod-config / 08-hardening — checkpoint RUN-2026-07-11-1213

> Auditor: claude-opus-4-8 · Datum: 2026-07-11 · READ-ONLY · styl prod-config (PC-), osy HD/RL/TL/KR
> Předchůdce: RUN-2026-06-20-1621 (PC-RUN-01..08). Tento běh = re-audit k HEAD 2026-07-11 (main).

---

## Pokrytí (L1-L3)

| Artefakt | Pokryto |
|---|---|
| `backend/src/main.ts` — helmet/CSP/HSTS, ValidationPipe, Swagger gate, CORS, body limit, shutdown hooks, keepAlive | ✅ L2/L3 |
| `backend/src/app.controller.ts` — /health prod strip | ✅ L3 |
| `backend/src/app.module.ts` — ThrottlerModule.forRootAsync + APP_GUARD | ✅ L3 (grep) |
| `backend/src/common/throttler/throttler.config.ts` — Redis opt-in fallback | ✅ L3 |
| `backend/src/common/config/env.validation.ts` — boot fail-fast/warn | ✅ L3 |
| `backend/src/common/config/origins.ts` — CORS/WS origin 1 zdroj | ✅ L3 |
| `backend/src/common/utils/auth-cookie.ts` — refresh+trust cookie flags, TTL | ✅ L3 |
| `backend/src/modules/auth/auth.module.ts` — JWT TTL, fail-fast | ✅ L3 |
| `backend/src/modules/auth/captcha.service.ts` — fail-closed prod | ✅ L3 |
| `backend/src/socket-io.adapter.ts` — WS CORS, buffer 5MB, account gate | ✅ L3 |
| `docker-compose.prod.yml` — ports, mongo/redis auth, healthchecky, env fail-fast, log rotace | ✅ L3 |
| `FE/src/shared/store/authStore.ts` — access token localStorage | ✅ L3 |
| `FE/Dockerfile` — VITE_API_URL warn-only | ✅ L3 |
| `FE/default.conf.template` — nginx CSP/HSTS/Perm-Policy | ✅ L2 |
| csp.txt scanner (check-csp-hash OK) | ✅ |

**Dosažená L: L3** (statika kompletní; live-probe = PROOF-REQUEST, viz níže). Cross-ref: **ops styl 31** (ports 0.0.0.0 / mongo-redis auth / healthcheck) — sdílený povrch, potvrzuji + zařazuji pod TL/HD.

---

## Nálezy

### 🆕 Nové (k HEAD 2026-07-11)

**PC-RUN-09** — `TL`/`HD` — **Backend port bind 0.0.0.0 → bypass TLS** 🟠
- `docker-compose.prod.yml:137-138`:
  ```yaml
  ports:
    - "${BACKEND_PORT:-3001}:3000"
  ```
- Docker default = bind na `0.0.0.0:3001`. Plaintext HTTP BE (+ WS) je dosažitelný na VŠECH host interfejsech → `http://<server>:3001/api/...` obchází reverzní proxy (Caddy) a její TLS terminaci. Bez host firewallu = API/WS venku bez šifrování.
- Návrh: `127.0.0.1:${BACKEND_PORT:-3001}:3000` (jen loopback, proxy dosáhne přes host). **Cross-ref ops styl 31** (tam nalezeno první).
- L3 (compose ověřen; skutečná dosažitelnost = firewall stav = PROOF-REQUEST) · 🆕

**PC-RUN-10** — `TL`/`SC` — **Mongo i Redis bez autentizace** 🟡
- `docker-compose.prod.yml:16-22` mongod `--bind_ip_all` **bez** `--auth`/`--keyFile`; `:52` redis `--appendonly yes` **bez** `--requirepass`.
- Obě služby jen na `ikaros-net` bridge (žádné `ports:` mapování → nejsou host-exposed), takže NENÍ přímo dosažitelné zvenčí → defence-in-depth mezera, ne otevřená díra. Riziko jen při kompromitaci sítě / dalším kontejneru na netu. `MONGODB_URI`/`REDIS_URL` v compose bez credentials to potvrzují.
- Návrh: mongo keyfile + `--auth` (replset už běží, keyfile je stejně doporučen), redis `--requirepass ${REDIS_PASSWORD}`. **Cross-ref ops styl 31.**
- L3 · 🆕

**PC-RUN-11** — `HD` (monitoring) — **Backend service bez compose healthcheck** 🟡
- `docker-compose.prod.yml:77-147` — služba `backend` nemá `healthcheck:` blok, ačkoli `/api/health` readiness endpoint existuje (`app.controller.ts:43`). Mongo (`:25-43`) i redis (`:55-59`) healthcheck MAJÍ.
- Dopad: orchestrátor nedetekuje app-level „unhealthy" (degraded mongo/redis/meili) — `restart: unless-stopped` chytí jen pád procesu, ne zaseknutý/degradovaný stav. Budoucí `depends_on: backend condition: service_healthy` nelze použít.
- Návrh: `healthcheck: test: wget/curl -f http://localhost:3000/api/health` + interval/retries. Pozn.: ops styl 31 „chybí healthcheck" = částečně vyřešeno (mongo/redis ano, backend ne).
- L3 · 🆕

**PC-RUN-12** — `KR` — **JWT access TTL uvolněn 1d → 3d + drift compose↔kód** 🟡 🔓
- `auth.module.ts:35-41`:
  ```ts
  // Access TTL 3 dny (uživatelské rozhodnutí 2026-06-21) …
  expiresIn: (config.get<string>('JWT_EXPIRES_IN') ?? '3d')
  ```
- vs `docker-compose.prod.yml:98` `JWT_EXPIRES_IN: ${JWT_EXPIRES_IN:-1d}`. **Drift**: kódový default `3d`, compose default `1d` → mimo compose (nebo když se compose default změní) běží 3d. PC-12 to kdysi opravilo na 1d; nyní vědomě uvolněno na 3d. Kombinace s access tokenem v localStorage (PC-RUN-02) = okno zneužití ukradeného tokenu až 3 dny.
- Návrh: sjednotit default (kód i compose 3d NEBO 1d dle rozhodnutí); dokumentovaný trade-off, ale drift je matoucí.
- L3 · 🔓 (uvolnění dřívější opravy PC-12) — vědomé rozhodnutí uživatele

**PC-RUN-13** — `KR` — **Refresh cookie TTL prodloužen 30d → 60d** 🟡
- `auth-cookie.ts:25` `Number(process.env.JWT_REFRESH_TTL_DAYS ?? 60)`; compose `:100` `JWT_REFRESH_TTL_DAYS: ${JWT_REFRESH_TTL_DAYS:-60}`. Sliding session, dřív 30d (PC-18). Delší okno pro ukradený refresh (httpOnly cookie, mimo dosah XSS → nižší riziko). Trust cookie 30d (`:60`).
- Návrh: přijmout jako by-design (sliding + httpOnly) nebo zkrátit; jen zaznamenat.
- L3 · 🆕 (minor)

### ♻️ Reziduum (nevyřešeno z RUN-2026-06-20)

**PC-RUN-03** — `HD` — **Helmet bez `Permissions-Policy` na BE API** 🟡 ♻️
- `main.ts:96-110` helmet konfig — žádný `permissionsPolicy` (grep BE src = 0 výskytů). Helmet v7+ ho defaultně NEpřidává. FE nginx ho má na HTML (`default.conf.template:115`), ale `/api/*` a `/static/*` z BE ne.
- Návrh: `permissionsPolicy: { features: {} }` do helmetu. L2 (live = PROOF-REQUEST) · ♻️

**PC-RUN-05** — `HD` — **`crossOriginResourcePolicy: false` globálně — API bez CORP** 🟡 ♻️
- `main.ts:108` `crossOriginResourcePolicy: false` (kvůli `/static/` PixiJS texturám, které si CORP `cross-origin` řídí samy na `:121`). Důsledek: `/api/*` JSON nemá CORP header (měl by mít `same-origin` jako defence-in-depth; CORS je primární obrana).
- Návrh: `crossOriginResourcePolicy: { policy: 'same-origin' }` + přepis na `cross-origin` jen v `useStaticAssets.setHeaders`. L2 · ♻️

**PC-RUN-02** (= PC-18 reziduum) — `TL` — **Access token stále v localStorage** 🟡 ♻️
- `FE/src/shared/store/authStore.ts:5` `atomWithStorage<string|null>('ikaros.jwt', null)`. Refresh token přesunut do httpOnly cookie (PC-18 ✅), access token záměrně v localStorage. XSS → exfiltrace access tokenu, okno = TTL (nyní 3d, viz PC-RUN-12). Known trade-off.
- L3 · ♻️

**PC-RUN-08** — `HD`/`DP` — **FE Dockerfile: prázdný `VITE_API_URL` jen varuje, ne exit 1** 🟠 ♻️
- `FE/Dockerfile:18-26` — `if [ -z "$VITE_API_URL" ]; then echo VAROVANI…; fi` pak `RUN npm run build` bez `exit 1`. Build projde s prázdným → runtime fallback `localhost:3000` → tichý prod outage při zapomenutí varu. PC-15 (fail-fast) byl vědomě downgradeován ("Build NEblokujeme").
- Návrh: buď `|| exit 1`, nebo přijmout jako záměr (warn > fail). L3 · ♻️

---

## Pozitiva potvrzená k HEAD

| Co | Kde | Stav |
|---|---|---|
| ValidationPipe `forbidNonWhitelisted: true` + CS exceptionFactory | main.ts:66-74 | ✅ |
| /health v prod strippnutý (jen `{ok}`, `expose = NODE_ENV!=='production'`) | app.controller.ts:114,128-141 | ✅ |
| Swagger jen `if (!isProd)` | main.ts:126-139 | ✅ |
| ThrottlerGuard globálně (APP_GUARD), forRootAsync, bez NODE_ENV gate | app.module.ts:83,158 | ✅ (PC-17 drží) |
| Throttler Redis opt-in fallback (nespadne start) | throttler.config.ts:31-63 | ✅ |
| Helmet CSP `default-src/frame-ancestors 'none'`, HSTS 1y+includeSubDomains, referrer no-referrer, frameguard deny | main.ts:97-109 | ✅ |
| Refresh + trust token httpOnly cookie, `Secure`+`SameSite=None` prod / `Lax` dev, path `/api/auth` | auth-cookie.ts:30-79 | ✅ |
| JWT/refresh secret fail-fast (`?? throw`) | auth.module.ts:29-33; env.validation.ts:17,52-60 | ✅ |
| Captcha fail-closed v prod | captcha.service.ts:44-56 | ✅ |
| env.validation: fatal jen DB/JWT, zbytek warn + localhost-check prod URL | env.validation.ts:45-88 | ✅ |
| WS CORS z origins.ts (localhost jen mimo prod), buffer 5MB | socket-io.adapter.ts:70-77; origins.ts:9-16 | ✅ |
| body limit 5mb json+urlencoded | main.ts:62-63 | ✅ |
| **NEW** graceful shutdown `enableShutdownHooks()` (ops 31) | main.ts:144 | ✅ |
| **NEW** keepAliveTimeout 61s / headersTimeout 65s (anti slow-loris, 502 fix) | main.ts:151-152 | ✅ |
| **NEW** unhandledRejection/uncaughtException handlery + Sentry opt-in | main.ts:23-48 | ✅ |
| TOTP_ENC_KEY nyní v compose (`:-`) — PC-RUN-01 vyřešeno | docker-compose.prod.yml:104 | ✅ |
| compose fail-fast `:?` na JWT_SECRET/JWT_REFRESH_SECRET/MEILI_MASTER_KEY; log rotace 3×10MB; mongo+redis healthcheck | docker-compose.prod.yml:4-8,71,97,99 | ✅ |
| FE nginx CSP enforce + HSTS + Permissions-Policy + Referrer-Policy + CSP hash guard | default.conf.template:107-116; csp.txt | ✅ |
| Swagger/CSP hash guard CI (check-csp-hash OK) | scanners/csp.txt | ✅ |

---

## PROOF-REQUEST (nelze staticky)

| PR# | Co |
|---|---|
| PR-1 | Live BE helmet hlavičky v `/api/health` (X-Frame-Options DENY, HSTS, CSP default-src none, chybějící Permissions-Policy/CORP) |
| PR-2 | Host firewall stav pro port 3001 (PC-RUN-09 — je 0.0.0.0:3001 reálně dosažitelný z internetu?) |
| PR-3 | FE nginx live hlavičky (CSP enforce, Permissions-Policy, HSTS) na `GET /` |
| PR-4 | Throttler pod zátěží (429 po 100/min; login limit) |

---

## Souhrn nálezů oblasti 08 (RUN 2026-07-11)

| ID | Záv. | Osa | Klas. | Popis |
|---|---|---|---|---|
| PC-RUN-09 | 🟠 | TL/HD | 🆕 | Backend port 0.0.0.0:3001 → bypass TLS (cross-ref ops 31) |
| PC-RUN-10 | 🟡 | TL/SC | 🆕 | Mongo `--bind_ip_all` bez auth + Redis bez requirepass (internal-only) |
| PC-RUN-11 | 🟡 | HD | 🆕 | Backend service bez compose healthcheck (mongo/redis ho mají) |
| PC-RUN-12 | 🟡 | KR | 🔓 | JWT access TTL uvolněn 1d→3d; drift compose(1d)↔kód(3d) |
| PC-RUN-13 | 🟡 | KR | 🆕 | Refresh cookie TTL 30d→60d (httpOnly, minor) |
| PC-RUN-03 | 🟡 | HD | ♻️ | Helmet bez Permissions-Policy na BE API |
| PC-RUN-05 | 🟡 | HD | ♻️ | CORP globálně false (API bez CORP header) |
| PC-RUN-02 | 🟡 | TL | ♻️ | Access token v localStorage (okno = TTL 3d) |
| PC-RUN-08 | 🟠 | HD/DP | ♻️ | FE Dockerfile: prázdný VITE_API_URL jen varuje, ne exit 1 |

**Nejzávažnější: PC-RUN-09** (0.0.0.0 port = plaintext API/WS venku, obchází TLS) — 🟠, cross-ref ops styl 31. Žádný 🔴. Jádrová hardening pozitiva (pipe/Swagger/health/throttler/CSP/cookie) drží; přibyly ops pojistky (shutdown hooks, keepAlive, uncaught handlery). Regrese jen jedna vědomá: JWT 1d→3d (PC-RUN-12, uživatelské rozhodnutí).
