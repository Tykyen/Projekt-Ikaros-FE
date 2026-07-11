# prod-config / 00-cross-cutting — checkpoint RUN-2026-07-11-1213

Datum: 2026-07-11. READ-ONLY sweep. Záběr = celá konfigurační vrstva (BE NestJS + FE Vite),
cross-cutting: architektura načítání, 4 zdroje pravdy, master matice, fallback katalog, tooling.
Prefix `PC-`. Registr: `docs/prod-config-audit.md`. Plán: `docs/prod-config-plan/00-cross-cutting.md`.

Navazuje na dva předchozí sweepy: registr 2026-06-14 (PC-01..24, 19 opraveno) + checkpoint
RUN-2026-06-20-1621 (PC-RUN-01..06). Tento běh ověřuje HEAD + **nové config povrchy od 06-20**
(monitoring „3. noha": Sentry/GlitchTip, Discord alerting, health-cron, guest sessions 15.8).

---

## Pokrytí (M1 statika + M-ENV/M-FALLBACK scanner L2)

Přečteno:
- `env.validation.ts`, `origins.ts`, `main.ts` (Sentry init, helmet, CORS, Swagger gate)
- `docker-compose.prod.yml` (celý), BE `.github/workflows/deploy.yml` (aktualizován Jul 11), FE `deploy.yml`, FE `Dockerfile`, FE `docker-compose.yml` (build args)
- **Nové:** `common/alerting/alert.service.ts` (DISCORD_ALERT_WEBHOOK), `common/health/health-monitor.service.ts` (RSS_ALERT_MB), `modules/community-notify/community-notify.service.ts` (DISCORD_EVENTS_WEBHOOK), `common/throttler/throttler.config.ts` (THROTTLER_REDIS), `auth.service.ts:703` (ANON_SESSION_TTL), FE `shared/lib/monitoring.ts` (VITE_SENTRY_DSN)
- BE `.env.example`, FE `.env.example`
- Scanner `RUN-2026-07-11-1213/scanners/config.txt` (kód 48 · example 35 · deploy 37 · compose 44)

Nepokryto (živá infra → PROOF-REQUEST): boot-probe L5, cross-domain cookie L6, git-hist secret sken L5-SS, mutace env guardu L7.

## Dosažená L

Jádro (EV/SC/OG/FB/ST/ML/DP) **L3** (statika + scanner + kontext dosažitelnosti vs compose/deploy).
ED/FK **L2** (scanner). BP/TE/SS/PA-live ⏭️ blokováno (bez infra).

---

## Nálezy

### ♻️ Potvrzení — opravy PC-01..24 + PC-RUN-01/06 stále v kódu

- **PC-01** ✅ captcha fail-closed v prod (`captcha.service`), newmatrix odkaz pryč (**PC-02** ✅ `smtp-mailer.provider` fallback localhost).
- **PC-03** ✅ `app.module` `validate: validateEnv`; **PC-04/13** ✅ `origins.ts` jediný zdroj, `localhost:5174` jen mimo prod.
- **PC-07** ✅ `main.ts:69` `forbidNonWhitelisted`; **PC-22** ✅ Swagger za `if(!isProd)`; **PC-08** ✅ `/health` bez `missing[]` v prod.
- **PC-14** ✅ JWT/refresh fail-fast; **PC-17** ✅ Throttler globálně; **PC-24** ✅ compose fail-fast pořád jen 3 (`JWT_SECRET`/`JWT_REFRESH_SECRET`/`MEILI_MASTER_KEY`) — kryto `env.validation` (REQUIRED_IN_PROD).
- **PC-RUN-01** ✅ vyřešeno — `TOTP_ENC_KEY` teď v compose (`:-`) + deploy secret + `.env.example`.
- **PC-23** ✅ `DELETION_HOLD_DAYS :-30` v compose = kód.

**Pozitivum (nový povrch, GOOD):** BE monitoring vars (`SENTRY_DSN`, `DISCORD_ALERT_WEBHOOK`, `DISCORD_EVENTS_WEBHOOK`, `RSS_ALERT_MB`) jsou plně zapojeny — compose `:-` defaulty (ř.120-125) + deploy.yml. Klasifikace v deploy správná: DSN + oba webhooky jako **secrets** (ř.78-80), `RSS_ALERT_MB` jako **var** (ř.81). Všechny opt-in, no-op bez hodnoty, `env.validation` je (správně) nevyžaduje. Alerting nikdy neshodí app (fire-and-forget + rate-limit). Kód přibyl čistě.

---

### 🆕 Nové nálezy (HEAD 2026-07-11)

**PC-RUN-07 — [BL/DP/ED] `VITE_SENTRY_DSN` je v produkci STRUKTURÁLNĚ MRTVÝ (FE monitoring vypnutý)** · 🟠 · 🆕
- Kde: FE `src/shared/lib/monitoring.ts:14` čte `import.meta.env.VITE_SENTRY_DSN`; scanner sekce (a) ř.18 (čteno-ale-nepředáno) + (d) ř.51 (chybí v `.env.example`).
- Řetěz plumbingu je přerušený na VŠECH úrovních:
  1. FE `Dockerfile:5-9` — deklaruje `ARG`/`ENV` jen pro `VITE_API_URL` + `VITE_TURNSTILE_SITE_KEY`. **Žádný `ARG VITE_SENTRY_DSN`.**
  2. FE `docker-compose.yml:6-7` — `build.args` předává jen `VITE_API_URL`. **VITE_SENTRY_DSN chybí.**
  3. FE `deploy.yml:59-67` — `.env` blok zapisuje jen FRONTEND_PORT / VITE_API_URL / VITE_TURNSTILE_SITE_KEY / BACKEND_HOST / CSP_HEADER_NAME. **VITE_SENTRY_DSN se nikam nepředá.**
  4. FE `.env.example` — nezmiňuje ho.
- Dopad: `VITE_*` se zapéká při **buildu**. Protože Dockerfile nemá ARG, hodnota se do bundlu NIKDY nedostane — ani kdyby admin založil GitHub var. `initMonitoring()` proto v prod vždy padne do větve `dsn === undefined` → FE polovina „3. nohy" (error tracking uživatelských chyb) je **trvale a tiše vypnutá bez možnosti zapnout bez změny kódu**. Globální `unhandledrejection`/`window.error` handlery sice běží, ale jen `console.error` (nikam se neodesílá).
- Návrh: přidat `ARG VITE_SENTRY_DSN=` + `ENV VITE_SENTRY_DSN=$VITE_SENTRY_DSN` do FE Dockerfile, `VITE_SENTRY_DSN: ${VITE_SENTRY_DSN:-}` do compose `build.args`, řádek do deploy.yml `.env` bloku, dokumentovat v `.env.example`. (Vzor: přesně jak je zapojen `VITE_API_URL`.)
- L3 (dosažitelnost ověřena čtením celého plumbingu) · 🆕

**PC-RUN-08 — [ED/DP] doc-gap regrese `.env.example`: nové monitoring/session vars nezdokumentovány** · 🟠 · 🆕 (regrese osy PC-16)
- Kde: scanner sekce (d) ř.37-51 — 14 proměnných čteno v kódu, chybí v `.env.example`.
- Nově přidané, které NEjsou v `.env.example` (ač JSOU v deploy+compose): `DISCORD_ALERT_WEBHOOK`, `DISCORD_EVENTS_WEBHOOK`, `SENTRY_DSN`, `RSS_ALERT_MB` (BE) + `VITE_SENTRY_DSN` (FE) + `ANON_SESSION_TTL`. Dále doc-only diagnostika: `EMBEDDING_*_DIMENSION/SEQUENCE_LENGTH/CHUNK_*` (bezpečné defaulty), `PRESENCE_THRESHOLD_HOURS`.
- Dopad: PC-16 byl uzavřen doplněním `.env.example`, ale nová feature (monitoring 3. noha) do něj své proměnné nedoplnila → 4-zdrojový drift se otevřel znovu. Netechnický admin/nový vývojář podle `.env.example` monitoring/alerting **nenastaví** (nevidí, že existuje). Onboarding + „jak zapnout Sentry/Discord" mizí.
- Návrh: doplnit sekci `# ── Monitoring (3. noha) ──` do BE `.env.example` (DISCORD_ALERT_WEBHOOK, DISCORD_EVENTS_WEBHOOK, SENTRY_DSN, RSS_ALERT_MB, THROTTLER_REDIS už je) + `ANON_SESSION_TTL` do server sekce; `VITE_SENTRY_DSN` do FE `.env.example`. Ideálně M-ENV drift do CI (osa PC-16 měla být CI guard).
- L2 (scanner) · 🆕

**PC-RUN-09 — [ED] `ANON_SESSION_TTL` (guest sessions 15.8) nepředán v deploy/compose** · 🟡 · 🆕
- Kde: `auth.service.ts:703` `config.get('ANON_SESSION_TTL') ?? '14d'`; scanner sekce (a) ř.8 + (d) ř.38.
- Nová proměnná (host/guest session pro Hospodu). Bezpečný fallback 14 d, čistě opt-in ladění délky guest tokenu. Není v deploy/compose ani `.env.example`.
- Dopad: nízký — default je rozumný; jen nelze v prod přeladit bez znalosti názvu. Konzistenčně patří k PC-RUN-08.
- L2 · 🆕

### 🔓 Stále otevřené z předchozích běhů (neopraveno)

**PC-RUN-02 — [FB/DP] FE Dockerfile na prázdný `VITE_API_URL` jen VARUJE, neblokuje build** · 🟡 · 🔓
- `Dockerfile:18-25` = pořád jen `echo` blok, žádný `exit 1`. Registr uvádí PC-15 jako ✅ „`RUN test -n`", ale kód build nezastaví → tichý deploy FE s fallbackem `localhost:3000` je stále možný. Rozdíl kód↔registr trvá z 06-20.

**PC-RUN-04 — [ED] `PRESENCE_THRESHOLD_HOURS` dva defaulty 25 vs 24** · 🟡 · 🔓
- `presence.service.ts:14` `?? '25'` vs `admin-stats.service.ts:42` `?? '24'` (scanner ř.83,89). Bez env „online" badge a admin „aktivní dnes" počítají jiné okno. Neopraveno od 06-20.

**PC-RUN-06 — [ST/FB] embedding model URL default = cizí osobní web** · 🟠 · 🔓 (= PC-21, OPS dluh)
- `docker-compose.prod.yml:131-134` `:-https://www.patrikzplzne.cz/...` (+ `.env.example:74-77`). Search modely se bez override stahují z osobní domény; pokud spadne, core search nefunguje. Kód přepsatelný, ale default aktivní risk. OPS krok (nahrát na vlastní hosting) → `dluhy.md` D-NEW-PC21.

**PC-RUN-03 — [ED] `THROTTLER_REDIS` nepředán v compose** · 🟡 · 🔓 (částečně)
- Nově zdokumentován v `.env.example:47-49` (zlepšení od 06-20), ale v `docker-compose.prod.yml` stále nefiguruje ani jako `:-0` komentář. Single-instance OK; multi-instance = rate-limit N× volnější. Vzor `SOCKET_IO_REDIS: "1"` by měl mít protějšek.

---

### ⚖️ Ověřená pozitiva / by-design

- `env.validation.ts` REQUIRED_IN_PROD = pouze `MONGODB_URI`/`JWT_SECRET`/`JWT_REFRESH_SECRET` (fatální bez fallbacku) → throw; vše ostatní warn. Filozofie „neshodit deploy netechnikovi" konzistentní; nové monitoring vars správně mimo REQUIRED. GOOD.
- `SENTRY_DSN` (main.ts:23) i `origins.ts`/`throttler.config` čtou přes `process.env` přímo (pre-DI / statická helper vrstva) — vědomý vzor (PC-RUN-05 by-design). Sentry init gated na `if(process.env.SENTRY_DSN)` → prázdné = úplně bez hooků.
- Deploy secret/var klasifikace nových vars správná (DSN + webhooky = secret).
- helmet CSP `default-src 'none'` + HSTS + graceful shutdown + keepAlive hardening v `main.ts` — nic nového rozbité.

---

## Souhrn pro tento běh

- **0× 🔴** — žádná nová bezpečnostní/mrtvý-web díra; kritické opravy (captcha fail-closed, JWT fail-fast, mailer newmatrix pryč) drží.
- **Nejzávažnější 🆕:** **PC-RUN-07** — `VITE_SENTRY_DSN` strukturálně mrtvý (chybí ARG v Dockerfile → FE error tracking v prod trvale a tiše vypnutý; nelze zapnout bez změny kódu). Feature „3. noha" má funkční jen BE polovinu.
- **2× 🟠** (PC-RUN-07 + PC-RUN-08 doc-gap regrese), **1× 🟡 🆕** (PC-RUN-09), **4× 🔓** neopraveno z 06-20 (PC-RUN-02/03/04/06).
- Meta-vzor: monitoring feature přibyla čistě do kódu+compose+deploy, ale **minula FE build-arg plumbing a `.env.example`** — přesně 4-zdrojový drift, který má hlídat CI guard (M-ENV, PC-16 follow-up nikdy nedodán).

## PROOF-REQUEST

1. **PROOF-BP** (L5): BE s prázdným env (jen NODE_ENV=production) → `validateEnv` musí throw na MONGODB_URI/JWT×2, jen warn na monitoring/URL/captcha.
2. **PROOF-FE-SENTRY** (L3-empiric): po deployi otevřít FE, vyvolat chybu → ověřit, že `VITE_SENTRY_DSN` skutečně chybí v bundlu (grep `dist/`), potvrdit PC-RUN-07 (bez opravy Dockerfile nelze zapnout).
3. **PROOF-TE** (L7): zmutovat `validateEnv` REQUIRED_IN_PROD=[] → `env.validation.spec` musí zčervenat.
