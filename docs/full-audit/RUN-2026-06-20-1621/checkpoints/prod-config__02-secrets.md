# prod-config / 02-secrets — checkpoint RUN-2026-06-20-1621

Datum: 2026-06-20 · Auditor: hloubkový agent (oblast 02 only) · Read-only.

---

## Pokrytí

Prošel jsem všechny soubory v záběru oblasti 02 (`SC`/`SS` osy):

| Soubor | Co | Metoda |
|---|---|---|
| `auth.module.ts` | JWT_SECRET fail-fast (2× throw) | M1 čtení + git log |
| `auth.service.ts` | JWT_REFRESH_SECRET fail-fast + bcrypt(10) | M1 čtení |
| `jwt.strategy.ts` | JWT_SECRET fail-fast třetí výskyt | M1 čtení + git log |
| `captcha.service.ts` | TURNSTILE_SECRET fail-closed v prod | M1 čtení |
| `totp-crypto.service.ts` | TOTP_ENC_KEY AES-256-GCM, fail-closed (null key) | M1 čtení |
| `totp.service.ts` | backup kódy crypto.randomBytes(5)→hex, bcrypt(10) | M1 čtení |
| `env.validation.ts` | REQUIRED_IN_PROD vs RECOMMENDED_IN_PROD | M1 čtení |
| `env.validation.spec.ts` | testy fail-fast + TOTP_ENC_KEY pokrytí | M1 čtení |
| `.env.example` | přítomnost TOTP_ENC_KEY | M1 čtení |
| `deploy.yml` | přítomnost TOTP_ENC_KEY, TOTP v deploy | M1 čtení |
| `docker-compose.prod.yml` | přítomnost TOTP_ENC_KEY | M1 čtení |
| `app.controller.ts` | /health info-leak v prod | M1 čtení |
| `admin.service.ts` | bcrypt(10) | M1 grep |
| `users.service.ts` | bcrypt(10) | M1 grep |
| `auth.service.spec.ts` | JWT mock hodnoty v testu | M1 čtení |
| git log (`--all -p`) | .env nikdy tracked; placeholder hodnoty v history | M-SECRET (statický) |

**Explicitně mimo záběr** (jiné oblasti): JWT TTL/cookie (oblast 08/KR/TL), CORS origin (oblast 03), MEILI bez auth (oblast 04), Cloudinary URL (oblast 04).

---

## Dosažená L vs cílová L

Oblast 02 cíl dle plánu: `SC` na **L4** (trojzdrojový diff + deploy parita), `SS` na **L5** (statický sken stromu + git historie).

| Osa | Dosažená L | Cílová L | Poznámka |
|---|---|---|---|
| `SC` — JWT/refresh fail-fast | **L3** | L4 | deploy parita ověřena manuálně (čtením deploy.yml); M-ENV tool diff k L4 by vyžadoval spuštění skriptu (PROOF-REQUEST) |
| `SC` — captcha fail-closed | **L3** | L4 | staticky potvrzeno; dosažitelnost v prod ověřena (NODE_ENV gate) |
| `SC` — TOTP_ENC_KEY | **L3** | L4 | nový nález: chybí ve 3 zdrojích (deploy/compose/.env.example) |
| `SC` — bcrypt cost | **L2** | L3 | cost=10 ve všech 5 místech; L3 = zda je dosažitelný downgrade (není) |
| `SS` — sken stromu + git historie | **L3** | L5 | git log prošel, .env nikdy tracked; placeholder-only v historii; L5 = boot-probe empiricky (PROOF-REQUEST) |

Celková dosažená hloubka: **L3** (statická + kontextová dosažitelnost). L4 (deploy parita 4 zdrojů strojově) a L5 (boot-probe empiricky) vyžadují live infru → PROOF-REQUEST.

---

## Nálezy

### ♻️ Opravené nálezy (z původního sweep 2026-06-14) — ověření HEAD stavu

| ID | Stav HEAD | Závěr |
|---|---|---|
| PC-01 captcha fail-open | opraveno: `captcha.service.ts:46` `NODE_ENV==='production' → return false` | ✅ ověřeno čtením |
| PC-14 JWT fail-fast | ✅ zůstává; 3 místa (auth.module.ts:30-32, auth.service.ts:94-97, jwt.strategy.ts:12-14) | ✅ ověřeno |
| PC-19 secret sken čistý | git log potvrdil: `.env` nikdy tracked, placeholders v `.env.example` jsou `change-this-secret-in-production` + Turnstile test key (1x000…) | ✅ ověřeno, stav platný |

### 🆕 Nové nálezy

#### PC-RUN-01 — [SC/SS] `TOTP_ENC_KEY` chybí ve VŠECH 3 deploy zdrojích · 🟠

**Kde:** `deploy.yml` (žádná zmínka), `docker-compose.prod.yml` (žádná zmínka), `.env.example` (žádná zmínka)

**Kód:** `totp-crypto.service.ts:26` čte `config.get<string>('TOTP_ENC_KEY')` — přidáno commitem `c54cef0` (2026-06-18, 14.1 2FA).

**`env.validation.ts:39`** má TOTP_ENC_KEY v `RECOMMENDED_IN_PROD` (VARUJE, neshazuje boot) — ale ani toto varování nemůže nastat, pokud proměnná není v `.env` na serveru. Deploy pipeline ji do `.env` **nepřenáší** → na serveru chybí → 2FA opt-in feature je v produkci funkčně mrtvá (setup/login 2FA = `ServiceUnavailableException`), bez varování při startu (deploy ji nikdy nepošle, env.validation ji ve warning nezachytí, protože v `.env` prostě není).

**Dopad:** 2FA (14.1) je kompletně nasazená feature, ale bez klíče v deployi ji nelze aktivovat ani ověřit. Pokud někdo 2FA nastaví v dev a pak migruje nebo pokud bude přidána v budoucnu — zůstane tiše nefunkční v prod.

**Návrh:**
1. Přidat `TOTP_ENC_KEY: ${TOTP_ENC_KEY}` do `docker-compose.prod.yml` (bez `:?required` — logika je fail-closed, ne boot-fatal)
2. Přidat `TOTP_ENC_KEY=${{ secrets.TOTP_ENC_KEY }}` do `deploy.yml` (Create .env file krok, řádek ~72)
3. Přidat `TOTP_ENC_KEY=` do `.env.example` s komentářem: `# 2FA šifrovací klíč (AES-256-GCM). Generuj: node -e "require('crypto').randomBytes(32).toString('base64')|console.log()". Bez něj 2FA nefunguje (fail-closed), zbytek běží.`

**L3** · 🆕

---

#### PC-RUN-02 — [SC] Stará cesta JWT bez fail-fast přežila v git historii (neopravitelné, ale zaznamenáno) · 🟡

**Kde:** `git show aede950` — první commit `jwt.strategy.ts` měl `secretOrKey: config.get<string>('JWT_SECRET') as string` (žádný throw). Tato verze **nikdy nedošla do produkce** (git history prošel filter-repo, .env nebyl tracked), ale technika `as string` maskuje `undefined` — kdyby se JWT_SECRET nenastával, Passport by přijal `undefined` jako secret (chyba za běhu, ne fail-fast).

**Dopad:** historický; HEAD má správný throw (L3 ověřeno). Relevantní jen jako dokumentace vzoru — pokud někdo revertuje nebo přidá nový JWT modul, ví o pasti.

**Návrh:** bez akce; přidat do PROOF-REQUEST TE (mutation test) pro ci guard.

**L2** · 🆕 (historický, neopravitelné)

---

#### PC-RUN-03 — [SC] `env.validation.spec.ts` nekryje `TOTP_ENC_KEY` v RECOMMENDED · 🟡

**Kde:** `env.validation.spec.ts:34-43` — test `.each` pro RECOMMENDED zahrnuje `FRONTEND_URL`, `BACKEND_BASE_URL`, `TURNSTILE_SECRET`, `MEILI_API_KEY` — ale NE `TOTP_ENC_KEY`, které bylo přidáno v komitu 14.1.

**Dopad:** nízký (TOTP_ENC_KEY je jen warning, ne throw), ale test-matice nepokrývá celý RECOMMENDED seznam → pokud někdo přidá do RECOMMENDED bez aktualizace testu, pokrytí tiše chybí.

**Návrh:** přidat `'TOTP_ENC_KEY'` do `.each` v `env.validation.spec.ts:39`.

**L3** · 🆕

---

### ♻️ Potvrzena shoda HEAD (bez nálezů)

- **JWT_SECRET / JWT_REFRESH_SECRET fail-fast:** ✅ 3 místa, žádná bypass cesta bez `throw`
- **captcha PC-01 opravena:** ✅ `NODE_ENV === 'production'` gate přítomen, fail-closed
- **bcrypt cost factor:** 10 na všech 5 místech (register, login pw reset, admin pw set, users pw change, backup codes); přijatelné (12 by bylo lepší, ale 10 není zranitelnost — 🟡 `KR` dluh, mimo oblast 02)
- **TOTP backup codes entropy:** `crypto.randomBytes(5).toString('hex')` = 10 hex znaků = 40 bitů entropie; bcrypt(10) hash; ✅ přijatelné
- **TOTP AES-256-GCM:** správný algoritmus, random IV (12B), auth tag ověřen; ✅
- **git historie čistá:** `.env` nikdy tracked; hodnoty v `.env.example` jsou jasné placeholdery (Cloudflare test key + `change-this-secret-in-production`)
- **`/health` v prod:** `expose = process.env.NODE_ENV !== 'production'` gate přítomen, PC-08 opravena ✅

---

## PROOF-REQUEST

### PR-02-01: Boot-probe empiricky (L5)
**Co:** nastartuj BE v docker s minimálním env (jen DB/JWT) → ověř že:
  - s `TOTP_ENC_KEY` chybějícím: BE nabootuje, warning v logu, 2FA endpoint vrátí 503
  - s `TURNSTILE_SECRET` chybějícím + `NODE_ENV=production`: registrace vrátí 400 CAPTCHA_FAILED
  - s `JWT_SECRET` chybějícím: BE nespadne při startu (env.validation) vs. selže při prvním JWT pokusu (Passport lazy init)
**Proč:** staticky L3 potvrzeno, ale Passport `JwtModule.registerAsync` factory běží při module init — fail-fast nebylo empiricky ověřeno (mohlo by být lazy)
**Nástroj:** docker-compose.prod.yml s dummy env nebo BE jest createTestApp

### PR-02-02: env.validation deploy parita (L4)
**Co:** spustit `npm run audit:config` (prod-config-scan.mjs M-ENV) **po** přidání TOTP_ENC_KEY do deploy.yml + compose → sekce (a) by neměla TOTP_ENC_KEY obsahovat
**Proč:** L4 = 4 zdroje sjednoceny strojově; manuální čtení = L3

### PR-02-03: Mutation test JWT guard (L7-teeth)
**Co:** zmutovat `auth.module.ts:31` (throw → `?? 'dev'`) + `env.validation.spec.ts` → test musí zčervenat
**Proč:** TE osa; ověří, že fail-fast guard má zuby v CI

---

## Souhrn nálezů oblasti 02

| ID | Záv. | Popis | L |
|---|---|---|---|
| PC-RUN-01 | 🟠 | `TOTP_ENC_KEY` chybí v deploy.yml + compose + .env.example → 2FA mrtvá v prod | L3 |
| PC-RUN-02 | 🟡 | historická jwt.strategy bez throw (git; neopravitelné, nová verze OK) | L2 |
| PC-RUN-03 | 🟡 | `env.validation.spec.ts` nekryje TOTP_ENC_KEY v RECOMMENDED testu | L3 |

Dosažená L: **L3** (statická + dosažitelnost). 3 PROOF-REQUEST bloky (L4/L5/L7) vyžadují live infru.
