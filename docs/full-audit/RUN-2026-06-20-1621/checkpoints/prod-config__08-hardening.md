# prod-config / 08-hardening — checkpoint RUN-2026-06-20-1621

> Auditor: claude-sonnet-4-6 · Datum: 2026-06-20 · READ-ONLY

---

## Pokrytí

Prošel jsem celý kód oblasti 08 (hardening) k HEAD:

| Artefakt | Pokryto |
|---|---|
| `backend/src/main.ts` — ValidationPipe, Helmet, Swagger gate, CORS, body limit | ✅ přečteno L1 |
| `backend/src/app.controller.ts` — /health info leak | ✅ přečteno L1 |
| `backend/src/app.module.ts` — ThrottlerModule, APP_GUARD, validateEnv | ✅ přečteno L1 |
| `backend/src/modules/auth/auth.module.ts` — JWT TTL, fail-fast | ✅ přečteno L1 |
| `backend/src/modules/auth/auth.service.ts` — refreshSecret fail-fast | ✅ přečteno L1 |
| `backend/src/modules/auth/captcha.service.ts` — fail-closed v prod | ✅ přečteno L1 |
| `backend/src/modules/auth/services/totp-crypto.service.ts` — 2FA klíč | ✅ přečteno L1 |
| `backend/src/common/throttler/throttler.config.ts` — Redis opt-in, fallback | ✅ přečteno L1 |
| `backend/src/common/config/env.validation.ts` — boot-time validace | ✅ přečteno L1 |
| `backend/src/common/config/origins.ts` — CORS/WS origin jeden zdroj | ✅ přečteno L1 |
| `backend/src/common/utils/auth-cookie.ts` — refresh cookie flags | ✅ přečteno L1 |
| `backend/src/gateways/base.gateway.ts` — WS gateway bez mrtvého cors | ✅ přečteno L1 |
| `backend/src/socket-io.adapter.ts` — WS CORS z origins.ts | ✅ přečteno L1 |
| `backend/src/modules/mailer/providers/smtp-mailer.provider.ts` — mailer URL | ✅ přečteno L1 |
| `backend/src/modules/mailer/providers/log-mailer.provider.ts` — prod log hygiene | ✅ přečteno L1 |
| `backend/src/database/database.module.ts` — NODE_ENV větvení DB | ✅ přečteno L1 |
| `backend/src/common/redis/redis.module.ts` — NODE_ENV=test větvení | ✅ přečteno L1 |
| `backend/docker-compose.prod.yml` — compose env, `:?required`, NODE_ENV=production | ✅ přečteno L1 |
| `backend/.env.example` — dokumentace (chybí TOTP_ENC_KEY) | ✅ přečteno L1 |
| `FE/src/shared/store/authStore.ts` — access token localStorage, refresh in-memory | ✅ přečteno L1 |
| `FE/src/shared/api/client.ts` — refresh přes cookie (withCredentials) | ✅ přečteno L1 |
| `FE/default.conf.template` — nginx headers, HSTS, CSP, Permissions-Policy | ✅ přečteno L1 |
| `FE/Dockerfile` — VITE_API_URL prázdný default → varování (ne exit 1) | ✅ přečteno L1 |
| `FE/.github/workflows/deploy.yml` — BACKEND_HOST odvozené, CSP_HEADER_NAME | ✅ přečteno L1 |
| `FE/docker-compose.yml` — env předání nginx runtime | ✅ přečteno L1 |
| `FE/scripts/check-csp-hash.mjs` — CSP hash guard | ✅ přečteno L1 |
| config.txt scanner (M-ENV + M-FALLBACK výstup) | ✅ přečteno |
| `@SkipThrottle` / `@Throttle` výskyt přes repo | ✅ grepped |
| NODE_ENV větvení (`production` / `test`) napříč src | ✅ grepped |

Nginx conf: soubor `nginx.conf` / `default.conf` není v repozitáři jako statický soubor — FE používá envsubst template (`default.conf.template`). Žádná statická `nginx.conf` nebyla nalezena — vše je v template.

---

## Dosažená L vs cílová L

| Podoblast | Cílová L | Dosažená L | Poznámka |
|---|---|---|---|
| ValidationPipe (K-PC7) | L3 | **L3** | kód ověřen, dosažitelnost ověřena |
| /health info leak (K-PC8) | L3 | **L3** | kód ověřen, NODE_ENV gate ověřen |
| Swagger gate (PC-22) | L3 | **L3** | gate `!isProd` v main.ts ověřen |
| Throttler (K-PC17) | L3 | **L3** | APP_GUARD globálně, žádné dev-disable |
| TLS / cookie transport (K-PC18) | L3 | **L3** | auth-cookie.ts flags ověřeny |
| JWT TTL (K-PC12) | L3 | **L3** | 1d access / 30d refresh, fail-fast OK |
| NODE_ENV konzistence | L3 | **L3** | `=== 'production'` vs `=== 'test'` sweep |
| Helmet / BE security headers | L2 | **L2** | přečteno, bez live probe |
| FE nginx headers (CSP, HSTS, Perm-Policy) | L2 | **L2** | template přečteno, bez live probe |
| TOTP_ENC_KEY v compose/example | L2 | **L2** | scanner potvrzen, ručně ověřeno |
| Boot-probe (L5) | L5 | ⏭️ **PROOF-REQUEST** | nelze z tohoto prostředí |
| Post-deploy cookie smoke (PC-18) | L5 | ⏭️ **PROOF-REQUEST** | cross-domain cookie za běhu |

Celková dosažená L pro oblast 08: **L3** (statická hloubka kompletní; L5 proof-request).

---

## Nálezy

### Opravené (ověřeno k HEAD) — potvrzení stavu z prod-config-audit.md

| ID | Stav | Co |
|---|---|---|
| PC-07 | ✅ OPRAVENO | `forbidNonWhitelisted: true` — main.ts:52-59 |
| PC-08 | ✅ OPRAVENO | /health `expose = NODE_ENV !== 'production'` — app.controller.ts:85 |
| PC-12 | ✅ OPRAVENO | JWT TTL snížen na `1d` (auth.module.ts:37), refresh `30d` (auth-cookie.ts:22) |
| PC-17 | ✅ SHODA | ThrottlerGuard jako APP_GUARD (app.module.ts:128), `ThrottlerModule.forRootAsync` bez NODE_ENV gate |
| PC-18 | ✅ OPRAVENO | refresh `ikaros_rt` httpOnly cookie, `Secure` prod / `Lax` dev, `path=/api/auth`; access stále localStorage (by-design, TTL 1d) |
| PC-22 | ✅ OPRAVENO | Swagger jen `if (!isProd)` — main.ts:108 |
| PC-13 | ✅ OPRAVENO | base.gateway.ts bez cors; origins.ts = jeden zdroj; socket-io.adapter.ts používá getAllowedOrigins() |

### Nové nálezy

---

**PC-RUN-01** — `HD` / `KR` — **TOTP_ENC_KEY chybí v compose i .env.example**
- Kde: `docker-compose.prod.yml` (celý soubor), `backend/.env.example` (celý soubor)
- Potvrzeno: config.txt scanner sekce (a) řádek 17 (`TOTP_ENC_KEY` = čteno v kódu, ale nepředáno) + sekce (d) řádek 43
- Dopad: Produkční BE nastartuje bez `TOTP_ENC_KEY` → TotpCryptoService vydá WARN + `key=null`. Každý uživatel s nastavenou 2FA nebude moci ověřit druhý faktor (ServiceUnavailableException: TOTP_NOT_CONFIGURED) — **2FA lockout v prod po deploy bez nastavení klíče**. env.validation ho má jen v RECOMMENDED → pouze WARN, neblokuje start.
- Závažnost: 🟠 (funkční riziko: tiché selhání 2FA pro uživatele s activated TOTP)
- Návrh: přidat `TOTP_ENC_KEY: ${TOTP_ENC_KEY}` do `docker-compose.prod.yml` (env sekce backend) + `TOTP_ENC_KEY=` (s komentářem o 32B base64) do `.env.example`. Deploy checklist upozornit.
- L: L2 (scanner + kód) · 🆕

---

**PC-RUN-02** — `HD` / `TL` — **access token v localStorage — přetrvává**
- Kde: `FE/src/shared/store/authStore.ts:5` (`atomWithStorage('ikaros.jwt', null)`)
- Dopad: access token (TTL 1d) je přístupný z JavaScriptu (XSS → exfiltrace). Refresh token byl přesunut do httpOnly cookie (PC-18 ✅), access token zůstává v localStorage záměrně (krátká životnost). Pro kompletní eliminaci by access token musel být taky in-memory (atom bez storage). Aktuální kompromis je obhajitelný (1d TTL + httpOnly refresh), ale XSS únik access tokenu stále umožňuje autentizované akce po dobu až 1d.
- Závažnost: 🟡 (known trade-off, by-design; sníženo zkráceným TTL z 7d na 1d + httpOnly refresh)
- Návrh: zvážit `atom<string|null>(null)` místo `atomWithStorage` (in-memory access token) — po reload se obnoví přes silent refresh cookie. Větší UX zásah (logout při reload bez cookie). Nebo dokumentovat jako known trade-off.
- L: L3 (dosažitelnost potvrzena — localStorage přístupný z JS) · ♻️ (existoval jako PC-18, zůstatek po částečné opravě)

---

**PC-RUN-03** — `HD` — **Helmet `Permissions-Policy` a `dnsPrefetchControl` NA BE chybí**
- Kde: `backend/src/main.ts:79-91` — helmet konfigurace
- Dopad: Helmet bez explicitního nastavení `permissionsPolicy` a `dnsPrefetchControl` používá defaulty: `dnsPrefetchControl` defaultně `on` (Helmet v7 default posílá `X-DNS-Prefetch-Control: off`) — OK. `Permissions-Policy` Helmet v7 NEPŘIDÁVÁ automaticky (není v defaultech). FE nginx template má `Permissions-Policy` na HTML dokumentech (řádek 58), ale BE API (`/api/*`) a static assety (`/static/*`) Permissions-Policy header nemají.
- Závažnost: 🟡 (nízký dopad: BE vrací jen JSON/binárky, Permissions-Policy na API endpointech je secondary concern; FE dokument je pokryt nginx)
- Návrh: přidat `permissionsPolicy: { features: {} }` do helmet konfigurace (zakáže všechny features pro API odpovědi).
- L: L2 (přečteno + Helmet API znalost; live ověření = PROOF-REQUEST) · 🆕

---

**PC-RUN-04** — `HD` — **`X-XSS-Protection: "0"` na FE, BE Helmet posílá legacy hodnotu**
- Kde: `backend/src/main.ts:79-91` — helmet bez `xssFilter` explicitního vypnutí; Helmet v7 default = `X-XSS-Protection: 0` (opuštěn browser)
- Stav: Helmet v7 sám od sebe posílá `X-XSS-Protection: 0` (správné — legacy auditor deprecated). FE nginx posílá `X-XSS-Protection: "0"` (řádek 55) — shoda. Toto je POZITIVUM.
- Závažnost: ✅ shoda, ne nález

---

**PC-RUN-05** — `HD` — **`crossOriginResourcePolicy: false` pro /static/ — CORP chybí na API**
- Kde: `backend/src/main.ts:90-91` `crossOriginResourcePolicy: false`
- Dopad: Helmet globálně vypíná `Cross-Origin-Resource-Policy`, protože `/static/` potřebuje `cross-origin` pro PixiJS textury. Důsledek: `/api/*` endpointy také nemají CORP header, ač by měly mít `same-origin` (bezpečnější default pro JSON API). Útočník s cross-origin script inclusion nemůže číst JSON (CORS brání), ale CORP přidává hloubkovou obranu.
- Závažnost: 🟡 (nízký dopad — CORS je primární obrana; CORP je defence-in-depth)
- Návrh: Místo globálního `false` nastavit `crossOriginResourcePolicy: { policy: 'same-origin' }` v helmet (API) a přepsat na `cross-origin` jen v `useStaticAssets.setHeaders`. Viz main.ts:99-104 — tam je to explicitně.
- L: L2 · 🆕

---

**PC-RUN-06** — `RL` — **THROTTLER_REDIS chybí v docker-compose.prod.yml**
- Kde: `docker-compose.prod.yml` backend env sekce (celý soubor) — `THROTTLER_REDIS` není uveden
- Config.txt scanner: sekce (a) řádek 16 — `THROTTLER_REDIS` čteno v kódu ale nepředáno deploy+compose
- Dopad: compose prod nasadí single-instance backend bez Redis throttleru (throttler.config.ts:31 — `THROTTLER_REDIS !== '1'` → in-memory). Pro single instance to je správné. Pokud někdo v budoucnu přidá repliku, je třeba na `THROTTLER_REDIS=1` myslet. Komentář v `app.module.ts:68` existuje. Riziko = jen při scale-out bez vědomé konfigurace.
- Závažnost: 🟡 (by-design pro single instance; riziko jen při scale-out)
- Návrh: Přidat `THROTTLER_REDIS: ${THROTTLER_REDIS:-}` do compose (opt-in, prázdné = vypnuto) + komentář. Parity s `SOCKET_IO_REDIS: "1"` (který v compose JE nastaven).
- L: L2 (scanner) · 🆕

---

**PC-RUN-07** — `HD` — **CSP `connect-src` – holý host bez schématu pokrývá ws/wss (by-design OK)**
- Kde: `default.conf.template:59` — `connect-src 'self' data: ${BACKEND_HOST} ...`
- Posouzení: Dle CSP Level 3 spec, holý host v `connect-src` matchuje všechna schémata (http/https/ws/wss). Komentář v template řádek 5 to dokumentuje. Šance na problém při HTTP dev (ws:// → ws ale connect-src má holý host bez schématu = OK). `upgrade-insecure-requests` v CSP navíc přepne ws→wss v HTTPS kontextu.
- Závažnost: ✅ shoda, ne nález

---

**PC-RUN-08** — `HD` — **FE Dockerfile PC-15 downgrade: `RUN test -n` nahrazeno varováním (ne exit 1)**
- Kde: `FE/Dockerfile:18-26`
- Potvrzeno: prod-config-audit.md říká "PC-15: `RUN test -n "$VITE_API_URL"` v FE Dockerfile", ale HEAD kód je jen `echo` varování bez `exit 1`. Build NEPROJDE s chybou, jen varovně tiskne.
- Dopad: FE build bez `VITE_API_URL` projde → deploy zapeče prázdný řetězec → FE volá `localhost:3000`. Toto bylo záměrně změněno (komentář "NEblokujeme deploy") — ale původní záměr PC-15 byl fail-fast.
- Závažnost: 🟠 (regrese — oprava PC-15 byla downgradeována; tichý prod outage pokud se var zapomene)
- Návrh: Buď přidat `|| exit 1` za echo varování, nebo zdokumentovat jako záměrný kompromis (prefer warn over fail). Závisí na rozhodnutí — deploy-fail při chybném var vs. varovný deploy.
- L: L3 (kód ověřen, dosažitelnost potvrzena v compose) · ♻️ (PC-15 se vrátilo do staršího stavu)

---

### Pozitiva potvrzená k HEAD

| Co | Kde | Stav |
|---|---|---|
| `forbidNonWhitelisted: true` | main.ts:55 | ✅ |
| /health bez `missing[]` v prod | app.controller.ts:85-98 | ✅ |
| Swagger `if (!isProd)` | main.ts:108 | ✅ |
| ThrottlerGuard jako APP_GUARD globálně, bez dev-disable | app.module.ts:128 | ✅ |
| Refresh token `httpOnly`, `Secure` prod, `SameSite=None` prod / `Lax` dev | auth-cookie.ts:27-33 | ✅ |
| Trust cookie (2FA) stejné flags | auth-cookie.ts:58-65 | ✅ |
| JWT/refresh fail-fast `?? throw` | auth.module.ts:30-34, auth.service.ts:92-98 | ✅ |
| Captcha fail-closed v prod | captcha.service.ts:46-51 | ✅ |
| TOTP fail-closed (ServiceUnavailableException) | totp-crypto.service.ts:50-56 | ✅ |
| Helmet CSP `defaultSrc:'none'`, `frameAncestors:'none'`, `hsts:1y`, `referrer:'no-referrer'`, `frameguard:deny` | main.ts:79-91 | ✅ |
| FE nginx CSP enforce mode (default), HSTS, Permissions-Policy, Referrer-Policy | default.conf.template:53-59 | ✅ |
| FE CSP hash guard (CI ochrana) | scripts/check-csp-hash.mjs | ✅ |
| env.validation fail-fast na MONGODB_URI/JWT_SECRET/JWT_REFRESH_SECRET | env.validation.ts:17, 52-60 | ✅ |
| NODE_ENV větvení konzistentní (`=== 'production'` / `=== 'test'`) | grep ověřeno | ✅ |
| body limit 5mb (json+urlencoded) | main.ts:48-49 | ✅ |
| WS buffer limit 5MB | socket-io.adapter.ts:23 | ✅ |
| Auth: login 10/min, register 5/min, 2FA 15/min (controller-level @Throttle) | auth.controller.ts, two-factor.controller.ts | ✅ |
| Docker compose `NODE_ENV: production` hardcoded | docker-compose.prod.yml:85 | ✅ |

---

## PROOF-REQUEST

| PR# | Co nelze staticky ověřit | Proč |
|---|---|---|
| PR-1 | **BE Helmet hlavičky v live odpovědi** — ověřit že `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`, `Content-Security-Policy: default-src 'none'` reálně v `/api/health` response | Vyžaduje HTTP request na live BE |
| PR-2 | **FE nginx headers live** — ověřit že `Content-Security-Policy` (enforce), `Permissions-Policy`, `X-Frame-Options: SAMEORIGIN` v `GET /` response | Vyžaduje HTTP request na live FE |
| PR-3 | **cookie transport PC-18 cross-domain** — přihlásit se, počkat na expiraci access tokenu (1d), ověřit silent refresh přes cookie (žádné samovolné odhlášení) | Cross-domain za běhu |
| PR-4 | **Throttler pod zátěží** — ověřit 429 po 100 req/min na obecný endpoint; 10/min na login | Vyžaduje HTTP testovací zátěž |
| PR-5 | **TOTP_ENC_KEY chybí v prod** — ověřit, zda reálně nasazený prod ho má nastaven (nebo bude 2FA lockout) | Přístup k live env vars |

---

## Souhrn nálezů oblasti 08

| ID | Záv. | Osa | Popis |
|---|---|---|---|
| PC-RUN-01 | 🟠 | HD/KR | TOTP_ENC_KEY chybí v compose+example → 2FA lockout v prod |
| PC-RUN-02 | 🟡 | TL | access token stále v localStorage (known trade-off po PC-18) |
| PC-RUN-03 | 🟡 | HD | Helmet bez Permissions-Policy na BE API |
| PC-RUN-05 | 🟡 | HD | CORP globálně false (API bez CORP header) |
| PC-RUN-06 | 🟡 | RL | THROTTLER_REDIS chybí v compose (by-design single-inst; scale-out risk) |
| PC-RUN-08 | 🟠 | HD | PC-15 downgrade: Dockerfile varuje místo exit 1 při prázdném VITE_API_URL |
