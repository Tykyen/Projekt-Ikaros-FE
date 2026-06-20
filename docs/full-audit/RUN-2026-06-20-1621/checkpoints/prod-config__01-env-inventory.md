# prod-config / 01-env-inventory — checkpoint RUN-2026-06-20-1621

Datum: 2026-06-20. Read-only sweep. Záběr = oblast 01 (`EV`/`ED` osy): kompletní env inventura,
validace při startu, drift 4 zdrojů, fail-fast vs runtime.

Navazuje na `prod-config__00-cross-cutting.md` (sdílené povrchy tam, nezdvojuji).

---

## Pokrytí

Přečteno (staticky, M1 + M-ENV):
- `env.validation.ts` + `env.validation.spec.ts` (PC-03 oprava + test coverage)
- `app.module.ts:64` (ConfigModule.forRoot s validate)
- `docker-compose.prod.yml` (celý, verze HEAD)
- `.github/workflows/deploy.yml` (BE + FE)
- `backend/.env.example` (34 proměnných)
- `FE .env.example` + `FE docker-compose.yml` (FE nginx vars)
- Scanner `config.txt` (M-ENV + M-FALLBACK): 42 kód / 34 example / 32 deploy / 37 compose
- `totp-crypto.service.ts:26` (TOTP_ENC_KEY čtení + fail-closed logika)
- `throttler.config.ts:31` (THROTTLER_REDIS)
- `presence.service.ts:14-16` (PRESENCE_THRESHOLD_HOURS default 25)
- `admin-stats.service.ts:42-43` (PRESENCE_THRESHOLD_HOURS default 24)
- `embedding-search.service.ts:58-417` (EMBEDDING_* vars + model URL)
- `images.controller.ts:13` (CLOUDINARY_CLOUD_NAME)
- `origins.ts` (process.env vs ConfigService přístup)
- `default.conf.template` (BACKEND_HOST, CSP_HEADER_NAME nginx envsubst)
- `FE docker-compose.yml` (BACKEND_HOST, CSP_HEADER_NAME, FRONTEND_PORT)

Nepokryto (živá infra → PROOF-REQUEST):
- Boot-probe: BE s prázdným `NODE_ENV=production` env → reálné chování validateEnv (L5)
- Mutation: vymaž `REQUIRED_IN_PROD[0]` → spec musí červenat (L7-teeth)
- Secret sken git-hist. (oblast 02 / PROOF-SS)

---

## Dosažená L vs cílová L (oblast 01)

| Osa | Dosažená | Cílová |
|---|---|---|
| `EV` — env inventory kompletní | L3 | L4 |
| `EV` — validace při startu (validateEnv) | L3 (kód + spec čteny; reálný boot ne) | L4 |
| `ED` — 4-zdroj drift (M-ENV scanner) | L2 (scanner vyčíslil) | L2 |
| `ED` — dosažitelnost / gating | L3 (compose override, NODE_ENV gate) | L3 |
| Boot-probe `BP` | ⏭️ blokováno (živá infra) | L5 |
| Mutation `TE` | ⏭️ blokováno | L7 |

Celkové L3 / L4 cíl — L4 blokováno jen na boot-probe (L5 nutné pro plný L4 v plánu).

---

## Nálezy

### ♻️ Potvrzení stavu oprav (oblast 01 specifické)

**PC-03 ✅** — `app.module.ts:64` `ConfigModule.forRoot({ isGlobal: true, validate: validateEnv })` — validate přítomno.
- `env.validation.ts`: REQUIRED (throw) = `MONGODB_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`; RECOMMENDED (warn) = 11 dalších; PROD_URLS localhost check.
- `env.validation.spec.ts`: 6 testů pokrývá throw na každou fatal, warn pro doporučené, localhost check, prázdný string jako chybějící. Coverage těchto cest L3.

**PC-16 ✅** — `.env.example` rozšířeno z 13 → 34 proměnných. Scanner `example: 34`. Sekce (d) ukazuje 9 stále nezdokumentovaných — ale jsou to EMBEDDING_* tuneable konstanty + TOTP_ENC_KEY (viz PC-01-RUN níže) — ne bezpečnostní vars.

**PC-24 ♻️ — meta-kořen trvá na compose úrovni** — compose `:?required` stále jen 3 proměnné (`JWT_SECRET`, `JWT_REFRESH_SECRET`, `MEILI_MASTER_KEY`). Situace zlepšena přidáním `validateEnv` (kód-level), ale compose-level pojistka pro `TURNSTILE_SECRET`, `FRONTEND_URL`, `BACKEND_BASE_URL`, `CLOUDINARY_URL` stále chybí. Registr to zná; žádný nový nález.

---

### 🆕 / ♻️ Nové nálezy oblasti 01 (HEAD 2026-06-20)

> Poznámka: PC-RUN-01..06 byly zaneseny v checkpointu 00-cross-cutting. Oblast 01 přináší
> detailnější analýzu EV/ED os a klasifikaci scannerových výsledků. Nálezy zde jsou
> upřesnění nebo nové doplňky nad rámec 00.

---

**PC-RUN-07 — [EV] TOTP_ENC_KEY chybí v .env.example** · 🟠 · 🆕
- Kde: `env.validation.ts:38` (RECOMMENDED), `.env.example` (chybí), `deploy.yml` (chybí), `docker-compose.prod.yml` (chybí)
- Scanner sekce (a) i (d): čteno v kódu, nezdokumentováno pro vývojáře i v deployi.
- `env.validation` ho řadí do RECOMMENDED (jen warn) — ale to předpokládá, že správce ví o proměnné. Bez záznamu v `.env.example` admin proměnnou neví, nevytvoří ji → 2FA v prod nevede k boot-warnu (TOTP_ENC_KEY je RECOMMENDED), ale uživatel dostane 503 při prvním pokusu o 2FA setup.
- Rozdíl od PC-RUN-01 (checkpoint 00): PC-RUN-01 zdůrazňoval deploy/compose; tento nález zdůrazňuje chybějící dokumentaci v `.env.example` jako onboarding problém. De-facto stejný kořen, jiný dopad: nová instance bez dokumentace nenakonfiguruje 2FA vůbec.
- Dopad: 2FA feature nepoužitelná v novém prod deployi bez ruční znalosti proměnné. Tichá, bez logu.
- Návrh: doplnit do `.env.example`:
  ```
  # ── 2FA / TOTP (volitelné — bez klíče je 2FA setup fail-closed)
  # Generuj: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
  TOTP_ENC_KEY=
  ```
  A zároveň doplnit `${TOTP_ENC_KEY}` do compose a deploy.yml vars (bez `:?`, opt-in).
- L2 (scanner) + L3 (env.validation kód ověřen) · 🆕

---

**PC-RUN-08 — [ED] Scanner sekce (b): 6 z 10 „dead" vars jsou FE-nginx vars, ne BE vars** · 🟡 · 🆕
- Kde: `FE docker-compose.yml:15-18`, `FE deploy.yml:62-66`, `default.conf.template` (envsubst)
- Scanner sekce (b) hlásí 10 proměnných „předáno ale nečteno v kódu" — z nich 6 jsou FE/infra vars:
  - `BACKEND_HOST`, `FRONTEND_PORT`, `CSP_HEADER_NAME` → FE docker-compose + nginx envsubst (`default.conf.template`), **ne BE JS kód** → FALSE POSITIVE scanneru v BE kontextu
  - `SERVER_HOST`, `SERVER_PORT`, `SSH_USER`, `SSH_PRIVATE_KEY` → CI/CD infra (SSH přístup na server), **ne app env** → FALSE POSITIVE
  - `HOST` → nemá výskyt v BE src ani FE src — skutečně mrtvá/neznámá, vypadá jako ghost var
  - `MEILI_MASTER_KEY` → předáno deploy.yml, v compose slouží jako zdroj pro `MEILI_API_KEY` (řádek 91), **ne přímé čtení v kódu** → by-design alias
  - `BACKEND_PORT` → port mapping v compose `ports:`, ne app env var → by-design
- Z 10 „dead" vars v sekci (b): 8 je by-design nebo false positive, 1-2 potenciálně problematické.
- Skutečný nález: `HOST` — není vidět ve FE src, BE src, deploy ani compose jako funkční proměnná. Buď ghost, nebo historical artefakt.
- Dopad: nízký (extra var v deploy nemůže ublížit), ale matoucí pro onboarding; zbytečná entropie v deploy konfiguraci.
- Návrh: ověřit původ `HOST` vars ve FE/BE deploy.yml — pokud ghost, odstranit z deploy.yml. Ostatní přijmout jako ⚖️ by-design.
- L2 (scanner) + L3 (čtení deploy+compose+nginx template) · 🆕

---

**PC-RUN-09 — [ED] Embedding tuneable vars chybí v deploy.yml** · 🟡 · 🆕
- Kde: `embedding-search.service.ts:58-63`, `deploy.yml`, scanner sekce (a)+(d)
- 6 vars (`EMBEDDING_CHUNK_SIZE`, `CHUNK_OVERLAP`, `GRANITE107_DIMENSION`, `GRANITE107_SEQUENCE_LENGTH`, `GRANITE278_DIMENSION`, `GRANITE278_SEQUENCE_LENGTH`, `EMBEDDING_MODEL_CACHE_DIR`) jsou čteny v kódu s bezpečnými defaulty, ale:
  1. Nejsou v `deploy.yml` — admin je nemůže přepsat přes GitHub vars bez úpravy yml
  2. Nejsou v `.env.example` — nezdokumentovány
  3. Compose je nepředává (ani s `:- default`)
- Dopad: tuneable parametry (velikost chunku, overlap, seq length) jsou v prod FIXNÍ na kódových defaultech bez možnosti změny bez redeploymentu. Nízký dopad pro single-instance (defaulty jsou rozumné), ale blokuje runtime tuning search výkonu.
- Návrh: buď zdokumentovat v `.env.example` se `# default:` komentáři, nebo přijmout jako ⚖️ by-design (dev-only tuneable). Nezahrnout do `REQUIRED_IN_PROD` (safe defaults). Pro `EMBEDDING_MODEL_CACHE_DIR` stojí za zvážení compose entry (cache dir by měl odpovídat volumes).
- L2 (scanner + kód) · 🆕

---

**PC-RUN-10 — [EV] validateEnv nehlídá `CLOUDINARY_CLOUD_NAME` separátně (riziko images proxy)** · 🟡 · 🆕
- Kde: `images.controller.ts:13` (`CLOUDINARY_CLOUD_NAME ?? ''`), `env.validation.ts` (není v RECOMMENDED)
- `images.controller.ts` čte `CLOUDINARY_CLOUD_NAME` separátně pro image proxy redirecty (`/images/*` → Cloudinary URL). Pokud je `CLOUDINARY_URL` nastaveno ale `CLOUDINARY_CLOUD_NAME` chybí, proxy redirect selže (prázdný cloud name = špatná URL), ale upload funguje.
- `env.validation.ts` má v RECOMMENDED `CLOUDINARY_URL`, ale ne `CLOUDINARY_CLOUD_NAME` — mezera.
- Dopad: images proxy vrátí chybné redirecty (ale upload přes `CLOUDINARY_URL` funuje) → nesouhlasí `/images/*` vs upload. Nízký dopad pro nové deploye (Cloudinary.url parsuje cloud name), ale pro starý zpětně-kompatibilní `/images/` proxy = tichá chyba.
- Návrh: přidat `CLOUDINARY_CLOUD_NAME` do RECOMMENDED v `env.validation.ts`, nebo sjednotit images proxy na parse z `CLOUDINARY_URL` (zdroj pravdy).
- L3 (kód + env.validation čteny) · 🆕

---

### Klasifikace scanneru pro oblast 01

| Scanner sekce | Počet | Skutečné nálezy | False positives / by-design |
|---|---|---|---|
| (a) čteno, nepředáno | 10 | 🆕 TOTP_ENC_KEY (🟠), THROTTLER_REDIS (🟡), PRESENCE_THRESHOLD_HOURS (🟡) | 7× EMBEDDING_* tuneable — safe defaulty, ⚖️ by-design |
| (b) předáno, nečteno | 10 | `HOST` neznámá var (🟡) | 9× by-design/false positive (nginx, CI/CD, alias) |
| (c) v example, nečteno v BE | 1 | `TURNSTILE_SITE_KEY` — FE var v BE example (🟡) | Zavádějící — var existuje na FE jako `VITE_TURNSTILE_SITE_KEY` |
| (d) čteno, chybí v example | 9 | TOTP_ENC_KEY (🟠), EMBEDDING tuneable (🟡) | EMBEDDING_* low-priority |

---

### Potvrzená pozitiva oblasti 01

- `validateEnv` spec: 6 testů pokrývá klíčové cesty — throw na fatal, not-throw na warn. Dobrá baseline.
- 3-fatální REQUIRED pojistka je správně kalibrována (DB/JWT = skutečně fatální; captcha/search = degradovatelné).
- `.env.example` (34 vars) = velké zlepšení od původních 13 (PC-16 ✅).
- compose fail-fast pro JWT + Meili = správný vzor.

---

## PROOF-REQUEST

1. **PROOF-BP-01** (L5 boot-probe EV): spustit BE s `NODE_ENV=production`, `MONGODB_URI=mongodb://db/ok`, `JWT_SECRET=x`, `JWT_REFRESH_SECRET=y` — bez `TOTP_ENC_KEY`, `TURNSTILE_SECRET`, `FRONTEND_URL`. Ověřit: (a) app nastartuje; (b) v logu je `[env.validation] Produkční konfigurace neúplná: chybí (degradovaný režim): FRONTEND_URL, TURNSTILE_SECRET, TOTP_ENC_KEY...`; (c) captcha v prod vrací `false` (fail-closed). Bez živé infra nelze staticky potvrdit skutečný log výstup.

2. **PROOF-TE-01** (L7 validateEnv teeth): zmutovat `env.validation.ts` — vymaž `'MONGODB_URI'` z `REQUIRED_IN_PROD`. Spustit `env.validation.spec.ts`. Musí červenat na testu `it.each(['MONGODB_URI', ...])(...)`. Ověřuje, že spec má zuby.

3. **PROOF-HOST** (ED sekce b): ověřit, zda `HOST` var v FE deploy.yml je skutečně nevyužitá (ghost) nebo zda je konzumovaná nginxem/shellem na serveru. Vyžaduje přístup k deployovanému prostředí nebo revizi shell scriptu deploye.
