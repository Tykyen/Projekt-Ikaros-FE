# prod-config / 07-deploy-parity — checkpoint RUN-2026-07-11-1213

Datum: 2026-07-11. READ-ONLY. Oblast = deploy parity (kód ↔ `.env.example` ↔ `deploy.yml` ↔
`docker-compose.prod.yml`) + FE↔BE config kruh + deploy strategie (down→up, healthcheck-gate, rollback).
Prefix `PC-`. Registr: `docs/prod-config-audit.md`. Plán: `docs/prod-config-plan/07-deploy-parity.md`.
Osy: `DP` `PA` `ED` `M-PARITY` 👑. Dosažená hloubka: **L2** (statika + var-diff + kontext dosažitelnosti).

Navazuje na registr 06-14 (PC-01..24) + checkpoint 00-cross-cutting tohoto běhu (PC-RUN-07..09).
IDs zde area-scoped `PC-RUN-DP-xx` (ostatní prod-config checkpointy reusují lokální `PC-RUN-0x` → kolize).

Přečteno:
- BE `.github/workflows/deploy.yml` (celý), FE `.github/workflows/deploy.yml` (celý)
- `docker-compose.prod.yml` (BE, celý), FE `docker-compose.yml`, FE `Dockerfile`
- BE `src/main.ts` (parent změny: shutdown hooks + keepAlive), `src/common/config/env.validation.ts`
- BE `src/app.controller.ts` (/api/health), refresh-TTL kód (auth.service/auth-cookie)

---

## 🆕 Nové nálezy (HEAD 2026-07-11, osa DP)

**PC-RUN-DP-01 — [DP] deploy `down --remove-orphans → up -d` = full-stack teardown, žádný healthcheck-gate ani rollback** · 🟠 · 🆕
- Kde: BE `deploy.yml:114-116` (`docker compose down --remove-orphans || true` → `up -d` → `ps`); FE `deploy.yml:87-88` totéž.
- `down` shodí **VŠECHNY** kontejnery včetně `mongo` (single-member `rs0`), `redis`, `meilisearch`, ne jen backend → každý deploy = plný výpadek (ne rolling). Data přežijí (volumes `mongo-data`/`redis-data`/`meili-data`/`uploads-data`), ale RS musí po `up` znovu projít healthcheck `rs.status()/rs.initiate` (compose.prod:29-43).
- Když nový image nenaběhne: staré kontejnery jsou už zničené → **žádný automatický rollback**; `restart: unless-stopped` jen zacyklí rozbitý nový. `Verify` (deploy.yml:119-132) selže (exit 1), ale server zůstává v rozbitém/down stavu — Action nevrátí předchozí funkční verzi.
- Mitigace nasazená parentem (viz ♻️ níže): `enableShutdownHooks` + keepAlive → `down` (SIGTERM) teď počká na in-flight místo tvrdého killu. Downtime + no-rollback ale trvá.
- Návrh: `up -d --wait` (gate na healthcheck) + strategie „build nový, přepni, teprve pak sundej starý" nebo aspoň `docker compose up -d --no-deps backend` (bez teardownu Mongo/Redis/Meili, které se mezi deployi nemění).
- L2 (čtení obou pipeline) · 🆕

**PC-RUN-DP-02 — [DP] backend nemá healthcheck; `Verify` gate ověřuje jen „container running", ne připravenost appky** · 🟠 · 🆕
- Kde: `docker-compose.prod.yml:77-147` — služba `backend` **bez** `healthcheck:` bloku (mongo/redis ho mají, ř.25-43/55-59). `Verify` (BE deploy.yml:119-132, FE 92-105) po `sleep 15`/`sleep 5` počítá `ps --status running` == `ps -q` a nic víc.
- „running" = proces žije, **ne** „Nest nabootoval + Mongo/Redis připojen + `/api/health` vrací 200". Backend, který naběhne a poté selže na první request (nebo běží s localhost fallbacky kvůli chybějícímu varu, viz DP-04), projde jako zdravý. `/api/health` (app.controller.ts:43-49, ověřuje Mongo readyState / Redis ping / Meili) existuje, ale **deploy ho nikdy nezavolá**.
- Pozn.: crash-loop (`restarting`) `Verify` naopak chytí (stav ≠ running) — díra je specificky na **app-level readiness**, ne na liveness.
- Návrh: přidat `healthcheck` (curl `localhost:3000/api/health`) do compose `backend` + `up -d --wait`, nebo `curl -f http://localhost:${BACKEND_PORT}/api/health` krok do `Verify`.
- L2 · 🆕

**PC-RUN-DP-03 — [DP/TL] service porty publikovány na 0.0.0.0 → obcházejí TLS; reverse-proxy (TLS) není v žádném repu** · 🟠 · 🆕/🔓
- Kde: `docker-compose.prod.yml:137-138` backend `ports: "${BACKEND_PORT:-3001}:3000"`; FE `docker-compose.yml:19-20` `"${FRONTEND_PORT:-8081}:80"`. Docker publish bez host-IP → bind **0.0.0.0** → holý HTTP backend/FE přímo dostupný na veřejném rozhraní, mimo jakoukoli TLS terminaci.
- TLS proxy (dle skill `monitoring` = Caddy) **není verzován v žádném z obou repo** → celá HTTPS vrstva je out-of-repo/nezdokumentovaná, přitom `env.validation`/config kruh počítají s `https://` URL. To je parity-díra: `https://` URL, které kód očekává, dodává neverzovaný proxy → audit je nemůže ověřit.
- Návrh: bind `127.0.0.1:${BACKEND_PORT}:3000` / `127.0.0.1:${FRONTEND_PORT}:80` (jen proxy na loopbacku), nebo firewall; commitnout Caddyfile/reverse-proxy config do repo (parity zdroj pravdy). Cross-ref 08-hardening TL.
- L2 · 🆕/🔓 (parent flag „ports 0.0.0.0 bypass TLS")

**PC-RUN-DP-04 — [DP/PA/ED] `FRONTEND_URL` / `BACKEND_BASE_URL` / `TURNSTILE_SECRET` nemají ŽÁDNÝ fail-fast; registr 06-14 tvrdil compose `:?` — v kódu NENÍ** · 🟠 · 🆕
- Řetěz pojistek děravý na všech vrstvách:
  1. Deploy-time validace (BE deploy.yml:84-98) ověřuje **jen** `JWT_SECRET`, `JWT_REFRESH_SECRET`, `MEILI_MASTER_KEY≥16B`.
  2. Compose (compose.prod:95-96 `FRONTEND_URL: ${FRONTEND_URL}` / `BACKEND_BASE_URL: ${BACKEND_BASE_URL}`, ř.116 `TURNSTILE_SECRET: ${TURNSTILE_SECRET}`) — **bez** `:?required` (jen `JWT_SECRET`/`JWT_REFRESH_SECRET`/`MEILI_MASTER_KEY` mají `:?`, ř.97/99/71).
  3. `env.validation.ts:28-43` má tyto 3 v `RECOMMENDED_IN_PROD` (+`PROD_URLS`) → jen `console.warn`, **ne** throw (REQUIRED_IN_PROD = pouze MONGODB_URI/JWT×2, ř.17).
- Registr 06-14 „Systémový fix" (audit.md ř.39) explicitně tvrdí *„Druhá vrstva: `${VAR:?required}` v compose pro `FRONTEND_URL`/`BACKEND_BASE_URL`/`TURNSTILE_SECRET`."* — **v aktuálním compose.prod.yml to není** (ani jedna z těch tří má `:?`). Checkpoint 00 (PC-24 ✅) navíc píše „kryto env.validation (REQUIRED_IN_PROD)" — nepřesné: tyto 3 jsou RECOMMENDED (warn), ne REQUIRED.
- Dopad: zapomenutý var při deployi projde **všemi** branami tiše. `FRONTEND_URL` prázdné → mailer i CORS origin localhost (FE↔BE CORS blok, reset-hesla odkazy localhost); `BACKEND_BASE_URL` prázdné → disk-fallback obrázky localhost URL; `TURNSTILE_SECRET` prázdné → captcha fail-**closed** v prod (registrace tvrdě selže). Ve všech případech `Verify` „úspěch" (kontejnery běží) → operátor nedostane žádný signál.
- Návrh: buď doplnit `:?required` do compose pro tyto 3 (soulad s registrem), nebo rozšířit deploy-time `test -n` guard, nebo přesunout do REQUIRED_IN_PROD (pozor: shodí deploy netechnikovi — vědomé rozhodnutí filozofie env.validation). Cross-ref PC-24/PC-10.
- L2 (čteno všemi 4 zdroji) · 🆕

**PC-RUN-DP-05 — [DP] build-cache asymetrie BE vs FE; ani jeden `--pull`** · 🟡 · 🆕
- Kde: FE `deploy.yml:79` `docker compose build --no-cache` (komentář ř.75-78 dokumentuje incident stale FE bundle — cache-hit servíroval starý build); BE `deploy.yml:106` `docker compose build` **bez** `--no-cache`. Ani jeden nepoužívá `--pull` (base image `node:20-alpine`/`mongo:7`/`redis:7-alpine` může být stale).
- Dopad: BE build spoléhá na invalidaci `COPY . .` layeru (u nest buildu funguje), takže riziko stale bundle je nižší než u FE, ale nekonzistence dvou pipeline je latentní past (kdyby BE Dockerfile změnil pořadí COPY/build). `--pull` chybí → bezpečnostní patche base image se nezískají, dokud se ručně neprunuje.
- Návrh: sjednotit (BE také `--no-cache` nebo obojí bez, s vědomím) + periodické `--pull`.
- L2 · 🆕

**PC-RUN-DP-06 — [DP] backend `depends_on meilisearch: service_started` + meili bez healthchecku → BE může nastartovat před připraveností search** · 🟡 · 🆕
- Kde: `docker-compose.prod.yml:139-145` backend čeká na `mongo`/`redis` = `service_healthy` (dobře), ale na `meilisearch` = `service_started` (ř.144-145); `meilisearch` (ř.63-75) **nemá** healthcheck. `up -d` nečeká na `--wait`.
- Dopad: první search/indexace requesty po deployi mohou selhat, dokud Meili nedoběhne (obvykle vteřiny). Nízké — search degraduje dočasně, nezhroutí boot.
- Návrh: doplnit meili healthcheck (`curl /health`) + povýšit na `service_healthy`.
- L2 · 🆕

---

## ♻️ Potvrzení — parent změny v main.ts jsou v kódu a korektní

- **`enableShutdownHooks`** — `main.ts:144` (komentář „OPS styl 31 — graceful shutdown"). Na SIGTERM (`compose down`) počká na in-flight HTTP/WS + `onModuleDestroy` (Mongo/Redis/sockety) místo tvrdého killu. **Přímo zmírňuje DP-01** (data-loss na `down`). GOOD.
- **keepAlive hardening** — `main.ts:151-152` `server.keepAliveTimeout = 61_000` / `headersTimeout = 65_000` (nad proxy keep-alive → brání sporadickým 502 + slow-loris). `requestTimeout` vědomě nenastaven (dlouhý export/PDF). GOOD.
- Var/secret klasifikace v deploy.yml **čistá**: secrets = JWT×2, TOTP_ENC_KEY, CLOUDINARY_URL, TURNSTILE_SECRET, VAPID_PRIVATE_KEY, MEILI_MASTER_KEY, SMTP_PASS, DISCORD×2, SENTRY_DSN (ř.58-80); vars = zbytek vč. VAPID_PUBLIC_KEY/CLOUDINARY_CLOUD_NAME/VITE_TURNSTILE_SITE_KEY. **Žádný secret jako var.** ⚖️ GOOD (cross-ref oblast 02 SS).
- Refresh TTL parita OK: kód default `60` (auth.service.ts:729, auth-cookie.ts:25) = compose `:-60` (ř.100). Žádný drift (spec mock `30` je jen test). Ne nález.

## Var-diff (4 zdroje, osa ED, L2)

- Deploy `.env` blok (BE deploy.yml:54-82) zapisuje **27** vars → všech 27 je konzumováno compose `environment` blokem. Žádné „předáno-ale-nekonzumováno" na compose úrovni.
- Infra vars nastavené v compose přímo (ne přes deploy): `MONGODB_URI`, `REDIS_URL`, `SOCKET_IO_REDIS`, `MEILI_HOST`, `MEILI_API_KEY`, `NODE_ENV`, `PORT`, `EMBEDDING_*_ONNX/TOKENIZER_URL` (×4). OK — správně, deploy je nemá řešit.
- **Čteno v kódu, chybí v deploy i compose** (už trackováno, jen cross-ref, nezdvojuji): `THROTTLER_REDIS` (PC-RUN-03 00-cp), `ANON_SESSION_TTL` (PC-RUN-09 00-cp), `PRESENCE_THRESHOLD_HOURS` (PC-RUN-04), `EMBEDDING_*_DIMENSION/SEQUENCE_LENGTH/CHUNK_*` (bezpečné defaulty).

## 🔓 Stále otevřené (cross-ref, nezdvojuji)

- **PC-10** 🟠 🔓 — config kruh `VITE_API_URL`(FE) ↔ `BACKEND_BASE_URL`(BE) ↔ CORS ↔ `FRONTEND_URL` bez guardu; `https://` **nevynuceno** nikde (env.validation.ts:65-70 jen varuje na localhost, deploy předává URL vars bez validace). M-PARITY guard nedodán. (osa PA/M-PARITY 👑)
- **PC-RUN-02** 🟡 🔓 — FE `Dockerfile:18-25` na prázdný `VITE_API_URL` jen `echo`, žádný `exit 1` → tichý FE-localhost deploy stále možný (registr PC-15 „✅ RUN test -n" ≠ kód). `Verify` to nechytí (nginx běží).
- **PC-RUN-06 / PC-21** 🟠 🔓 — embedding model URL default `patrikzplzne.cz` (compose.prod:131-134); OPS dluh D-NEW-PC21.
- **Mongo/Redis bez auth** — parent flag; ale mongo/redis/meili **nemají `ports:`** → dostupné jen na interní `ikaros-net`, ne z venku (na rozdíl od backend portu, DP-03, což je app port, ne DB). Externí expozice ~nulová → defense-in-depth 🔓 nízké. Cross-ref 04/08.

---

## Souhrn pro tento běh (oblast 07)

- **0× 🔴.** Deploy pipeline funkčně naváže, kritické opravy z 06-14 drží, parent shutdown/keepAlive hardening je v kódu a korektní.
- **⭐ Nejzávažnější 🆕: PC-RUN-DP-04** — 3 kritické vars (`FRONTEND_URL`/`BACKEND_BASE_URL`/`TURNSTILE_SECRET`) nemají **žádnou** fail-fast bránu (deploy nevaliduje, compose bez `:?`, env.validation jen warn), a registr 06-14 tvrdí opak (compose `:?` — neaplikováno) → zapomenutý var = tichý prod degrade s „úspěšným" deployem.
- **4× 🟠** (DP-01 down→up bez rollbacku, DP-02 verify bez app-readiness, DP-03 porty 0.0.0.0/TLS bypass, DP-04 chybějící fail-fast), **2× 🟡** (DP-05 cache asymetrie, DP-06 meili service_started).
- Meta-vzor: `Verify` gate ověřuje **liveness kontejneru**, ne **readiness appky** → celá třída „deploy prošel, appka je rozbitá" (DP-02/DP-04) je pod radarem; TLS terminace je out-of-repo (DP-03) → parity nelze uzavřít bez commitnutého proxy configu.

## PROOF-REQUEST (živá infra, mimo statiku)

1. **PROOF-DP-VERIFY** (L3-empiric): nasadit s vědomě chybějícím `FRONTEND_URL` → ověřit, že deploy Action skončí „success" (Verify pass) přesto, že CORS/mailer běží na localhost → potvrdí DP-02+DP-04.
2. **PROOF-DP-PORT** (L3): z veřejné IP `curl http://SERVER:${BACKEND_PORT}/api/health` → pokud odpoví, potvrzuje DP-03 (holý HTTP mimo TLS).
3. **PROOF-DP-ROLLBACK** (L4): nasadit rozbitý image → ověřit, že server zůstane down (žádný auto-rollback na předchozí) → potvrdí DP-01.
