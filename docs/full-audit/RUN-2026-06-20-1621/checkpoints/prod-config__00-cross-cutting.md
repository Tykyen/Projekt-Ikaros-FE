# prod-config / 00-cross-cutting — checkpoint RUN-2026-06-20-1621

Datum: 2026-06-20. Read-only sweep. Záběr = celá konfigurační vrstva (BE NestJS + FE Vite),
cross-cutting pohled: architektura načítání, 4 zdroje pravdy, master matice, fallback katalog.

---

## Pokrytí

Přečteno (staticky, M1):
- `app.module.ts`, `env.validation.ts`, `origins.ts`, `main.ts`, `socket-io.adapter.ts`, `base.gateway.ts`
- `captcha.service.ts`, `auth.module.ts`, `auth-cookie.ts`, `totp-crypto.service.ts`
- `smtp-mailer.provider.ts`, `app.controller.ts` (health)
- `upload.service.ts:452`, `meili-search.service.ts:31-32`, `redis.module.ts:20`
- `embedding-search.service.ts:370-417` (model URL fallbacky)
- `throttler.config.ts`, `admin-stats.service.ts`, `presence.service.ts`
- `vite.config.ts`, `Dockerfile` (FE), `authStore.ts`, `client.ts`
- `docker-compose.prod.yml`
- Scanner output: `RUN-2026-06-20-1621/scanners/config.txt` (M-ENV + M-FALLBACK, 42 env proměnných)
- Registr `prod-config-audit.md` (24 nálezů PC-01..24 + stavy oprav)
- Oblast plán `00-cross-cutting.md` + README

Nepokryto (živá infra → PROOF-REQUEST):
- Boot-probe (BE s prázdným env → reálné chování) — L5
- FE↔BE config parita za běhu (CORS cross-domain cookie flow) — L6 (PC-18 post-deploy)
- Secret sken git historie (`M-SECRET` hluboká vrstva) — L5-SS
- Mutation testing env guardu — L7-teeth

---

## Dosažená L vs cílová L

| Oblast | Dosažená | Cílová (Maximum+) |
|---|---|---|
| `EV` env validace | L3 (validateEnv čtena, filosofie ověřena) | L4 |
| `SC` secrety | L3 (kód ověřen, git-hist. ne) | L5 |
| `OG` CORS/WS origin | L3 (origins.ts + main + adapter + base.gateway) | L4 |
| `FB` fallbacky | L3 (katalog ověřen vs compose override) | L3 |
| `ST` storage | L3 (upload.service:452, healthcheck) | L4 |
| `ML` mailer | L3 (smtp-mailer.provider:43 ověřen) | L4 |
| `DP` deploy parita | L3 (compose + Dockerfile čteny) | L4 |
| `BL` bundle leak | L3 (vite.config, Dockerfile, authStore) | L3 |
| `HD` hardening | L3 (main.ts, app.controller, throttler) | L3 |
| `TL` TLS/transport | L3 (auth-cookie.ts, smtp secure) | L3 |
| `PA` config parita | L2 (staticky — live cross-domain ne) | L6 |
| `ED/FK` drift/fallback | L2 (scanner M-ENV + M-FALLBACK) | L2 |
| `SS` secret sken | L1 (žádný .env tracked, placeholder OK; git-hist. ne) | L5 |
| `BP` boot-probe | ⏭️ blokováno | L5 |
| `TE` teeth | ⏭️ blokováno | L7 |

---

## Nálezy

### ♻️ Potvrzení oprav (původní PC-01..24 — verifikace HEAD kódu)

Všechny opravy z 2026-06-14 jsou v kódu přítomny a HEAD je konzistentní s registrem:

- **PC-01** ✅ — `captcha.service.ts:46` `if (process.env.NODE_ENV === 'production') return false` — fail-closed správně.
- **PC-02** ✅ — `smtp-mailer.provider.ts:43` fallback na `'http://localhost:5173'`; mrtvý newmatrix odkaz odstraněn.
- **PC-03** ✅ — `app.module.ts:64` `ConfigModule.forRoot({ isGlobal: true, validate: validateEnv })` — validate přítomno.
- **PC-04** ✅ — `origins.ts:12-14` localhost:5174 jen mimo produkci (`NODE_ENV !== 'production'` gate).
- **PC-05** ✅ — `upload.service.ts:452` stále `?? 'http://localhost:3000'` — ale `env.validation` RECOMMENDED varuje + compose předává `BACKEND_BASE_URL`.
- **PC-07** ✅ — `main.ts:55` `forbidNonWhitelisted: true`.
- **PC-08** ✅ — `app.controller.ts:85-98` detail `missing[]` jen mimo produkci.
- **PC-09** ✅ — `vite.config.ts:18` `esbuild: mode === 'production' ? { drop: ['console','debugger'] } : {}`.
- **PC-11** ✅ — `app.controller.ts:61` čte `CLOUDINARY_URL` (parita s uploadem).
- **PC-12** ✅ — `auth.module.ts:37` `?? '1d'` (dřív 7d).
- **PC-13** ✅ — `base.gateway.ts:12` žádný `cors:` v dekorátoru; komentář PC-13 přítomen.
- **PC-15** ✅ — `Dockerfile:18-25` `if [ -z "$VITE_API_URL" ]` varování; pozn.: BUILD NEBLOKUJE (jen varuje).
- **PC-16** ✅ — scanner: `example: 34` (z původních 13); podstatně doplněno.
- **PC-18** ✅ — `authStore.ts:8` `refreshTokenAtom = atom<string|null>(null)` — in-memory, ne localStorage; `auth-cookie.ts` httpOnly cookie.
- **PC-22** ✅ — `main.ts:108` Swagger za `if (!isProd)`.
- **PC-23** ✅ — `docker-compose.prod.yml:116` `DELETION_HOLD_DAYS: ${DELETION_HOLD_DAYS:-30}`.
- **PC-24** — meta-kořen: compose fail-fast stále jen 3 proměnné (JWT ×2 + MEILI_MASTER_KEY); `env.validation` kryje jako alternativa (ale jen WARN ne throw pro doporučené). Situace zlepšena (validateEnv), ale systémový root trvá na compose úrovni.

---

### 🆕 Nové nálezy (HEAD, 2026-06-20)

**PC-RUN-01 — [SC/EV] TOTP_ENC_KEY chybí v deploy i compose** · 🟠
- Kde: `totp-crypto.service.ts:26`, `env.validation.ts:38` (RECOMMENDED), scanner config.txt sekce (a) ř.17
- Scanner: `TOTP_ENC_KEY` — čteno v kódu, NEPŘEDÁNO v deploy ani compose.
- `env.validation` ho řadí do RECOMMENDED (jen warn, ne throw) → 2FA setup v prod bude tichý fail-closed bez varování při startu (runtime throw z `requireKey()` při prvním použití, ne boot).
- Dopad: uživatel spustí 2FA setup, dostane HTTP 503 `TOTP_NOT_CONFIGURED` bez předchozí informace; správce nevidí problém v logu při bootu.
- Návrh: doplnit `TOTP_ENC_KEY` do `docker-compose.prod.yml` jako `${TOTP_ENC_KEY}` (bez `:?`, protože opt-in) + do `deploy.yml` vars/secrets + zdokumentovat v `.env.example`. Env.validation ho už varuje — stačí propagace do compose/deploy.
- L2 (scanner) · 🆕

**PC-RUN-02 — [FB] PC-15 oprava varuje, ale neblokuje build** · 🟡
- Kde: `Dockerfile:18-25`
- Původní PC-15 byl hodnocen jako 🟠 `NEPŘEDÁNO → tichý localhost`. Oprava zvolila VAROVÁNÍ (echo), ne `exit 1`. Build s prázdným `VITE_API_URL` projde do produkce bez chyby a FE volá `localhost:3000`.
- Rozdíl od registru: registr uvádí `RUN test -n "$VITE_API_URL"` (která by build zastavila) — **skutečný kód používá jen echo, ne exit**. Původní nález PC-15 tedy není plně opraven (registr říká ✅, kód to neblokuje).
- Dopad: tiché nasazení broken FE v prod (stejný dopad jako před opravou — bez noise v build logu mimo scrollback).
- Návrh: přidat `|| { echo "..."; exit 1; }` za echo blok, nebo: `RUN test -n "$VITE_API_URL" || (echo "VITE_API_URL prazdne!" && exit 1)`.
- L3 (dosažitelnost v prod ověřena čtením Dockerfile) · ♻️ (oprava neúplná)

**PC-RUN-03 — [ED] THROTTLER_REDIS nepředán v compose** · 🟡
- Kde: `throttler.config.ts:31`, scanner config.txt sekce (a) ř.16
- `THROTTLER_REDIS` je čteno (`process.env.THROTTLER_REDIS !== '1'`), ale NEPŘEDÁNO v compose (scanner: sekce a). Default = `in-memory` throttler.
- Dopad: v multi-instance prod (2+ BE repliky) každá počítá vlastní bucket → reálné rate-limity N× volnější. Single-instance: bezpečné.
- Přijatelné pro single-instance deploy (SOCKET_IO_REDIS=1 je v compose pro WS, ale THROTTLER_REDIS ne) — ale nevědomé: compose to nedeklaruje ani jako komentář.
- Návrh: doplnit `THROTTLER_REDIS: ${THROTTLER_REDIS:-0}` do compose jako dokumentaci záměru (similar to SOCKET_IO_REDIS pattern).
- L2 (scanner) · 🆕

**PC-RUN-04 — [ED] PRESENCE_THRESHOLD_HOURS nekonzistence: 25 vs 24** · 🟡
- Kde: `presence.service.ts:16` default `25`, `admin-stats.service.ts:43` default `24`
- Dva consumeři téže env proměnné mají odlišné hardcoded defaulty (25 h vs 24 h). Pokud `PRESENCE_THRESHOLD_HOURS` není set, „online" badge a admin statistika "aktivní dnes" počítají s jiným oknem.
- Scanner config.txt ř.72,77: oba fallbacky viditelné (`?? "25"` a `?? "24"`).
- Dopad: přítomnostní badge říká „online" pro uživatele aktivní 24-25 h zpět, admin stats ne → nesouhlasí v admin panelu.
- Návrh: sjednotit jeden default (doporučeno: `24` = semanticky "dnes"), `presence.service.ts:16` opravit na `25` → `24` nebo naopak + dokumentovat v `.env.example`.
- L2 · 🆕

**PC-RUN-05 — [FB] origins.ts čte `process.env` přímo (ne ConfigService)** · 🟡
- Kde: `origins.ts:10,20` — `process.env.FRONTEND_URL` + `process.env.NODE_ENV`
- `origins.ts` čte přímo `process.env`, ne `ConfigService`. To je vědomý vzor (helper volaný v main.ts před DI bootstrapem), ale:
  1. Mimo DI → `validateEnv` ho nevaliduje (ConfigService předá validovaný object, process.env ne vždy)
  2. Test isolation: mock `ConfigService` nefunguje na `process.env.FRONTEND_URL` v origins.ts
- Dopad: nízký v praxi (env.validation proběhne před bootstrap → FRONTEND_URL je buď nastavena nebo je warn zalogován). Ale systematická nekonzistence (dva vzory čtení env = kořen z plánové osy).
- Návrh: přijmout jako ⚖️ by-design (helper musí být synchronní + mimo DI) nebo předat `process.env.FRONTEND_URL` jako parametr z main.ts (kde už je validate proběhl).
- L3 · 🆕

**PC-RUN-06 — [ST/FB] PC-21 model URL v compose mají `:- default` stále na `patrikzplzne.cz`** · 🟠
- Kde: `docker-compose.prod.yml:121-124`
- PC-21 bylo opraveno zápisem do compose. Ale compose defaulty (`:-`) stále míří na `https://www.patrikzplzne.cz/...` — přepsatelné env var, ale pokud var není nastavena, stále se stahují modely z cizí domény.
- Registr to uvádí jako `PC-21 jen OPS krok (nahrát soubory)` → stav přijatý, ale **kódový default je stále aktivní risk**.
- Dopad: prod search závisí na dostupnosti `www.patrikzplzne.cz` (osobní web); pokud web selže, search modely se nestáhnou → search nefunguje.
- L3 (ověřeno čtením compose) · ♻️ (PC-21 known, ale compose default stále aktivní)

---

### Potvrzená pozitiva (beze změny)

- **PC-14** ✅ `auth.module.ts:30-33` JWT fail-fast throw přítomen.
- **PC-17** ✅ `app.module.ts:69` ThrottlerModule globálně.
- **PC-19** ✅ žádné `.env` non-example v repu (scanner nekřičel).
- **PC-20** ✅ `docker-compose.prod.yml:88-91` Redis/Meili/Socket override přítomen.

---

## PROOF-REQUEST

1. **PROOF-BP** (L5 boot-probe): spustit BE s prázdným env (jen `NODE_ENV=production`) → ověřit, že `validateEnv` hodí na chybějící `MONGODB_URI/JWT_SECRET/JWT_REFRESH_SECRET`; a že pro chybějící `TURNSTILE_SECRET` jen varuje (ne throw). Bez živé infra nelze potvrdit staticky.
2. **PROOF-PC18** (L6 cross-domain cookie): po deployi na `www.projekt-ikaros.com` — přihlásit se, počkat na expiraci access tokenu (nebo zkrátit `JWT_EXPIRES_IN` na test), ověřit silent refresh přes `ikaros_rt` cookie (FE↔BE cross-domain `SameSite=None; Secure`).
3. **PROOF-SS** (L5 secret sken git-hist.): spustit `gitleaks detect --source . --log-opts="--all"` nebo ekvivalent přes oba repo; cross-ref s `project_git_history_cleanup` (filter-repo proběhl) — ověřit, že starý history nedrží secrety.
4. **PROOF-TE** (L7 teeth): zmutovat `validateEnv` (`REQUIRED_IN_PROD` prázdné) → `env.validation.spec.ts` musí zčervenat; zmutovat `captcha.service.ts:46` (`!== 'production'` → `=== 'production'`) → test musí odhalit.
