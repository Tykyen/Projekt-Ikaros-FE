# prod-config / 01-env-inventory — checkpoint RUN-2026-07-11-1213

Datum: 2026-07-11. READ-ONLY. Oblast = env inventory + validace (osy `EV` env inventory & validation,
`ED` env drift). Prefix `PC-`. Registr: `docs/prod-config-audit.md`. Plán: `docs/prod-config-plan/01-env-inventory.md`.
Scanner: `RUN-2026-07-11-1213/scanners/config.txt` (kód 48 · example 35 · deploy 37 · compose 44).

Navazuje: registr 2026-06-14 (PC-03 kořen = env.validation, PC-16 doc-gap, PC-24 meta-kořen compose fail-fast)
+ checkpoint 00-cross-cutting (PC-RUN-07/08/09 drift, PC-RUN-02/03/04/06 open). Tento CP = **hloubka os EV/ED**,
neduplikuje 00; přidává EV verdikt + registr-vs-kód drift.

---

## Pokrytí (M1 statika + M-ENV/M-FALLBACK scanner L2)

Přečteno k L2:
- `backend/src/common/config/env.validation.ts` (celý — validační funkce), zapojení `app.module.ts:78`
- `backend/.env.example` (celý, 34 klíčů), `docker-compose.prod.yml` (env blok + fail-fast)
- Scanner `config.txt` sekce (a)/(b)/(c)/(d) + M-FALLBACK katalog (35 dev defaultů)

Dosažená L: **EV L3** (statika + kontext dosažitelnosti compose/deploy), **ED L2** (scanner diff vyčíslen).
Blokováno bez infra: BP (boot-probe L5), TE (mutace env guardu L7) → PROOF-REQUEST.

---

## Osa EV — validace při startu

### ✅ PC-03 kořen UZAVŘEN a drží
`app.module.ts:78` `ConfigModule.forRoot({ isGlobal: true, validate: validateEnv })` →
`common/config/env.validation.ts` existuje (spec `env.validation.spec.ts`). Validace při startu ZAPOJENA.
Kořen z 2026-06-14 (žádné validation schema) je adresovaný. ♻️ potvrzeno.

### 🔓 PC-RUN-10 — [EV/DP] env.validation SOFTNUTA po fixu; registr OVERCLAIMuje sílu brány · 🟠 · 🔓 (deliberate)
- Kde: `env.validation.ts:16-88`. Soubor **přepracován 2026-06-18** (po Jun-14 fixu) — hlavička ř.6:
  „Filozofie (po deploy incidentu 2026-06-14): tvrdě selhat JEN na tom, bez čeho aplikace vůbec nemůže běžet".
- Realita kódu:
  - `REQUIRED_IN_PROD` (throw) = **jen** `MONGODB_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET` (ř.17).
  - `RECOMMENDED_IN_PROD` (jen `console.warn`, NEblokuje boot) = `FRONTEND_URL`, `BACKEND_BASE_URL`,
    `TURNSTILE_SECRET`, `MEILI_API_KEY`, `CLOUDINARY_URL`, `VAPID_*`, `SMTP_HOST/USER`, `TOTP_ENC_KEY` (ř.28-40).
  - localhost check na `PROD_URLS` = **jen warning** (ř.65-70, push do `warnings[]`), **NE throw**.
- Rozpor s registrem: `prod-config-audit.md:39` (systémový fix) tvrdí env.validation dělá **fail-fast na
  chybějící `FRONTEND_URL`/`BACKEND_BASE_URL`/`TURNSTILE_SECRET`/`MEILI_API_KEY` + odmítne `localhost` v prod URL**.
  To **v aktuálním kódu neplatí** — všech 5 je warn-only. Registr popisuje silnější stav, než kód dodává.
- Dopad: v prod s chybějícím `FRONTEND_URL`/`BACKEND_BASE_URL` app **nastartuje** (jen warn) a spadne do
  fallbacku localhost (`origins.ts`, mailer, disk-URL) → přesně povrch PC-02/PC-05, teď jen warn-gated, ne boot-gated.
  Captcha (`TURNSTILE_SECRET`) je runtime fail-closed (registrace selže) → funkčně krytá i bez boot-brány.
- Klasifikace: 🔓 oslabení oproti Jun-14 fixed stavu, ale **záměrné a v kódu dokumentované** (deploy incident).
  Legitimní tradeoff „neshodit deploy netechnikovi" — ale **registr musí být opraven** (stále overclaimuje).
- Návrh: srovnat registr `prod-config-audit.md:39` s realitou (warn ≠ fail-fast); zvážit, zda aspoň
  `FRONTEND_URL` nepovýšit zpět na fatální (bez něj CORS+maily+odkazy rozbité — degradace, ne „běží").
- L3 (kód přečten celý) · 🔓

---

## Osa ED — 4-zdrojový drift (scanner L2, reconciliován se soubory)

Scanner vs. skutečné soubory ověřeno čtením — čísla sedí.

### (a) čteno v kódu, nepředáno deploy+compose (11) → prod fallback
- `THROTTLER_REDIS` (throttler.config.ts:31) — v `.env.example:47-49` ✅, ale **ne v compose** → in-memory
  rate-limit. Single-instance OK, multi = N× volnější. **♻️ = PC-RUN-03** (00-CP), by-design pro 1 instanci.
- `VITE_SENTRY_DSN` (FE monitoring.ts:14) — **🆕 = PC-RUN-07** (00-CP): strukturálně mrtvý (chybí ARG v FE Dockerfile).
- `ANON_SESSION_TTL` (auth.service.ts:703, default 14d) — **🆕 = PC-RUN-09** (00-CP), bezpečný default.
- `EMBEDDING_CHUNK_SIZE/OVERLAP`, `EMBEDDING_GRANITE107/278_DIMENSION/SEQUENCE_LENGTH`, `EMBEDDING_MODEL_CACHE_DIR`
  (8×, embedding-search.service.ts) — ladicí knoby, **všechny bezpečné defaulty** (750/250/384/128/768/128/`data/model_cache`).
  ⚖️ **nejsou nález** (= verdikt registru 2026-06-14: „EMBEDDING_* ladění mají bezpečné defaulty → ne nález").
- `PRESENCE_THRESHOLD_HOURS` (presence.service.ts:14, default 25) — 🆕, viz níže dvoj-default.

### (b) předáno deploy/compose, nečteno v Node kódu (12) → mrtvé/mimo app
- `SSH_PRIVATE_KEY`, `SSH_USER` (deploy-time GitHub Actions), `BACKEND_HOST/PORT`, `SERVER_HOST/PORT`,
  `FRONTEND_PORT/INTERNAL`, `PRERENDER_HOST`, `HOST`, `CSP_HEADER_NAME`, `MEILI_MASTER_KEY`.
- Verdikt: **většina false-positive „mrtvá"** — konzumují je Caddy/nginx/deploy skript/meili kontejner,
  ne Node process (`MEILI_MASTER_KEY` čte meilisearch kontejner; BE čte `MEILI_API_KEY`). ⚖️ by-design,
  scanner (b) přirozeně nadhodnocuje (nevidí infra konzumenty). Stejná povaha jako 2026-06-14.

### (c) v .env.example, nečteno v kódu (1)
- `TURNSTILE_SITE_KEY` — v BE `.env.example:30`, ale je to **FE/public** klíč (widget), BE ho nečte.
  🟡 mírně zavádějící (BE example listuje FE var); nízké. ♻️/kosmetika.

### (d) čteno v kódu, chybí v .env.example (14) → doc gap
- **🆕 = PC-RUN-08** (00-CP, regrese osy PC-16): nové monitoring/session vars nezdokumentovány v `.env.example`:
  `DISCORD_ALERT_WEBHOOK`, `DISCORD_EVENTS_WEBHOOK`, `SENTRY_DSN`, `RSS_ALERT_MB`, `VITE_SENTRY_DSN`, `ANON_SESSION_TTL`
  (JSOU v deploy+compose, ale ne v example) + doc-only ladění `EMBEDDING_*_DIMENSION/SEQUENCE_LENGTH/CHUNK_*`,
  `PRESENCE_THRESHOLD_HOURS` (bezpečné defaulty).
- Kontext: PC-16 (kořen doc-gap) byl uzavřen rozšířením `.env.example` z 13→~40; jádro **drží** (TURNSTILE/VAPID/
  CLOUDINARY/MEILI/REDIS/SMTP dnes v example ✅). Reziduál 14 = **nová feature „3. noha monitoring" nedoplnila
  své vars** → drift se otevřel znovu na nové ose. Netechnik podle example monitoring nenastaví.

### Dvoj-default (ED, area-specific)
- **♻️ = PC-RUN-04** (00-CP): `PRESENCE_THRESHOLD_HOURS` — `presence.service.ts:14 ?? '25'` vs
  `admin-stats.service.ts:42 ?? '24'`. Bez env „online" badge a admin „aktivní dnes" počítají jiné okno. 🟡 🔓.

---

## Osa DP (compose fail-fast) — protíná EV, area-specific ověření

**PC-24 meta-kořen: compose fail-fast pořád JEN 3** — ověřeno `docker-compose.prod.yml`:
`${VAR:?…}` má jen `JWT_SECRET` (ř.97), `JWT_REFRESH_SECRET` (ř.99), `MEILI_MASTER_KEY` (ř.71+91). Scanner ✅.

⚠️ **Upřesnění vůči 00-CP a registru:** `FRONTEND_URL` (ř.95), `BACKEND_BASE_URL` (ř.96), `CLOUDINARY_URL` (ř.112),
`TURNSTILE_SECRET` (ř.116) jsou **plain `${VAR}` bez `:?` i bez `:-`** → při unset docker dosadí **prázdno**
(warning, ne fail). Tj. pro tyto 3 URL/captcha vars **NEEXISTUJE tvrdá brána na ANI JEDNÉ vrstvě**:
compose = prázdno, env.validation = jen warn (PC-RUN-10). Registr `prod-config-audit.md:39` uvádí `${VAR:?required}`
v compose pro `FRONTEND_URL`/`BACKEND_BASE_URL`/`TURNSTILE_SECRET` — **nepřítomno v kódu** (nikdy nedodáno / vráceno).
Tvrzení „PC-24 … kryto env.validation (REQUIRED_IN_PROD)" platí jen pro JWT/DB, ne pro tyto 3. 🔓 (součást PC-RUN-10).

---

## Souhrn (osy EV/ED, oblast 01)

- **0× 🔴.** Kořen PC-03 (validace zapojena) i jádro PC-16 (`.env.example` rozšířen) **drží**.
- **Area-specific nový nález: 🔓 PC-RUN-10** — env.validation po Jun-14 fixu záměrně softnuta na warn-only
  pro `FRONTEND_URL`/`BACKEND_BASE_URL`/`TURNSTILE_SECRET`/`MEILI_API_KEY`; registr overclaimuje fail-fast.
  Kombinace s „compose plain `${VAR}`" = **tyto 3 vary bez tvrdé brány na žádné vrstvě** (captcha runtime fail-closed drží).
- **ED L2:** drift 4-zdroj vyčíslen; nové nálezy = PC-RUN-07/08/09 (00-CP), znovu-otevřený doc-gap na monitoring vars.
  (b)/(c) převážně false-positive (infra konzumenti / FE var v BE example). EMBEDDING_* ⚖️ ne-nález (bezpečné defaulty).
- **♻️ open z 06-20:** PC-RUN-03 (THROTTLER_REDIS ne v compose), PC-RUN-04 (PRESENCE dvoj-default 25/24), PC-RUN-06 (embedding cizí web).

## PROOF-REQUEST
1. **PROOF-BP** (L5): BE s `NODE_ENV=production` + prázdný zbytek → `validateEnv` MUSÍ throw jen na
   `MONGODB_URI`/`JWT_SECRET`/`JWT_REFRESH_SECRET`, jen warn na FRONTEND_URL/BACKEND_BASE_URL/TURNSTILE_SECRET/MEILI/URL-localhost. Potvrdí PC-RUN-10.
2. **PROOF-TE** (L7): zmutuj `REQUIRED_IN_PROD=[]` → `env.validation.spec.ts` musí zčervenat (ověří zuby brány).
3. **Doc-fix (ne infra):** srovnat `prod-config-audit.md:39` s realitou warn-only + doplnit `.env.example`
   sekci Monitoring (PC-RUN-08) + M-ENV drift do CI (`audit:config`, slíbený PC-16 guard nikdy nedodán).
