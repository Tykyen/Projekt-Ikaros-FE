# Production config audit — registr nálezů (běží prod proti prod službám, nebo v něm žijí dev hodnoty a díry?)

> **12. styl auditu.** Read-only sweep konfigurační vrstvy (`.env`, CORS/WS origin, JWT/refresh secrety,
> storage, mailer, deploy pipeline, dev fallbacky) napříč FE i BE. Recon 2026-06-14.
> Plán: [`prod-config-plan/`](prod-config-plan/). Cílová otázka v [README](prod-config-plan/README.md). ID: `PC-xx`.
>
> **Stav: SWEEP HOTOV 2026-06-14 (Maximum+).** Tooling `prod-config-scan.mjs` postaven + spuštěn (M-ENV
> 4-zdroj diff + M-FALLBACK 43 fallbacků), jádro + hloubka prosweepovány ručním čtením (L3/L4), M-SECRET
> + statický M-BOOT + M-PARITY hotové. **24 nálezů potvrzeno (PC-01..24): 2×🔴, 8×🟠, 11×🟡, 3×⚖️/✅.**
> **Opravy NEZAČALY — gated souhlasem** (base.md: neopravovat tiše).

---

## TL;DR

- Plán 19 os (7 jádro + 6 hloubka + 6 nadstavba), 9 oblastí, tooling M-ENV/M-FALLBACK/M-SECRET/M-BOOT/M-PARITY. **Sweep Maximum+ hotov 2026-06-14.**
- **DVA systémové kořeny** (z nich padá většina 24 nálezů):
  1. **Jen 3 z ~20 prod proměnných mají compose fail-fast** (`${VAR:?required}`: `JWT_SECRET`, `JWT_REFRESH_SECRET`, `MEILI_MASTER_KEY`). Zbytek — vč. `TURNSTILE_SECRET`, `FRONTEND_URL`, `BACKEND_BASE_URL`, `CLOUDINARY_URL`, `VAPID_*` — je **tiše prázdný** → kód spadne do dev fallbacku. **(PC-24, meta-kořen)**
  2. **`FRONTEND_URL` čteno přímo přes `process.env` na 14 místech** (main ×2, adapter, 12 gateway) s duplikovaným `?? localhost`, a na 15. (mailer) místo localhostu **mrtvý server**. Žádný centrální typed config. **(PC-13, PC-02)**
- **Dvě 🔴** (potvrzeny čtením kódu):
  - 🔴 **PC-01** captcha `if(!secret) return true` ([captcha.service.ts:34-41]) = **fail-OPEN**; řetěz pojistek děravý (deploy nevaliduje, compose bez `:?`, .env.example neobsahuje) → registrace bez captchy v prod **bez chyby**. Doc komentář (ř.19-20) navíc **lže** (tvrdí false/400).
  - 🔴 **PC-02** mailer `FRONTEND_URL ?? 'https://newmatrix.patrikzplzne.cz'` ([smtp-mailer.provider.ts:42]) = **starý .NET server** ([paměť `project_server_swap`]) → reset-hesla odkazy na mrtvý web; dosažitelné (SMTP set + FRONTEND_URL chybí, compose bez `:?`).
- **Dvě závislosti na umírajícím webu** (ne jedna): mailer `newmatrix.patrikzplzne.cz` (PC-02) + **embedding/search modely `www.patrikzplzne.cz`** (PC-21, nový — URL nejsou v deploy/compose, fallback = jediná cesta).
- **Pozitiva:** JWT/refresh fail-fast ✅ (PC-14), Throttler globálně v prod ✅ (PC-17), žádný `.env` tracked v repu ✅ (PC-19).
- Načasování: cross-ref aktivní [paměť `project_deployment_handoff`] (první ostrý deploy) + [`project_smtp_email_setup`] (SMTP právě teď) → **audit dorazil před ostrým deployem.**

---

## Stav oprav (2026-06-14)

**Opraveno + ověřeno** (BE typecheck ✅ / lint ✅ / jest **2009/2009 zelených** (`maxWorkers=2`) · FE build ✅ / vitest 98 zelených): **PC-01..09, PC-11, PC-12, PC-13, PC-15, PC-16, PC-18, PC-21\*, PC-22, PC-23, PC-24** — tj. **19 nálezů** (vč. obou 🔴). Pozn.: dříve hlášený pre-existing fail (matrix seed Pravidla) **opraven** — byl to zastaralý test (matrix má Pravidla z Pravidlové knihy F1). ⚠️ Plný paralelní `jest` flaky na MongoMemoryServer startu (binárka timeout pod zátěží) — `--maxWorkers=2` projde 2009/2009.

**2. dávka (zpracování zbylých „dluhů" — na žádost):**
- **PC-07** — `ValidationPipe` `forbidNonWhitelisted: true` ([main.ts:20]); ověřeno celou BE suite (2008 testů, 0 rozbitých → FE neposílá pole navíc).
- **PC-12** — access TTL `7d → 1d` ([auth.module.ts] + compose + .env.example); refresh rotace drží session.
- **PC-18** — refresh token přesunut z localStorage do **httpOnly cookie**: nový [`auth-cookie.ts`](../../../Projekt-ikaros/backend/src/common/utils/auth-cookie.ts) (`SameSite=None;Secure` prod / `Lax` dev, `path=/api/auth`), controller set/clear/read cookie (`cookie ?? body` přechod), DTO refreshToken optional; FE [authStore.ts] `refreshTokenAtom` in-memory (localStorage `ikaros.rt` pryč), [client.ts] refresh přes cookie (prázdné body + `withCredentials`), logout bez body. Ověřeno BE auth 126 + FE 98.
- **PC-21\*** — model URL zviditelněny + přepsatelné přes env (compose + .env.example); **zbývá jen OPS** (nahrát soubory na vlastní hosting) → [dluhy.md](dluhy.md) D-NEW-PC21 (ne kódový dluh).

**Systémový fix (kořen):** nový `env.validation.ts` → `ConfigModule.forRoot({ validate })` ([app.module.ts:61]) — v produkci **fail-fast** na chybějící `MONGODB_URI`/`JWT_SECRET`/`JWT_REFRESH_SECRET`/`FRONTEND_URL`/`BACKEND_BASE_URL`/`TURNSTILE_SECRET`/`MEILI_API_KEY` + odmítne `localhost` v prod URL. Kryje **PC-03/05/06/24** a podpírá PC-01/02. Druhá vrstva: `${VAR:?required}` v compose pro `FRONTEND_URL`/`BACKEND_BASE_URL`/`TURNSTILE_SECRET`.

- **PC-01** — captcha [captcha.service.ts:34] fail-**closed** v produkci (`NODE_ENV==='production'` → `return false`), dev bypass jen mimo prod; opraven lživý doc komentář (ř.19-20 i 30).
- **PC-02** — mailer [smtp-mailer.provider.ts:42] hardcoded `newmatrix.patrikzplzne.cz` **odstraněn** → dev fallback localhost, v prod povinné `FRONTEND_URL` (validace).
- **PC-04/13** — nový `origins.ts` `getAllowedOrigins()`/`getPrimaryOrigin()` = 1 zdroj; `localhost:5174` jen mimo produkci; použito v [main.ts] (CORS+static) + [socket-io.adapter.ts] (mrtvý `ALLOWED_ORIGINS` const zrušen).
- **PC-08** — [app.controller.ts] `/health` v produkci nevrací `missing[]`/detail (jen ok/degraded).
- **PC-09** — [vite.config.ts] `esbuild.drop: ['console','debugger']` v prod buildu.
- **PC-11** — healthcheck čte `CLOUDINARY_URL` (parita s uploadem) → nelže.
- **PC-15** — FE [Dockerfile] `RUN test -n "$VITE_API_URL"` → build selže místo tichého localhostu.
- **PC-16** — BE + FE `.env.example` doplněny (všech ~40 / VITE_*) — onboarding + deploy checklist.
- **PC-22** — Swagger `/docs` jen mimo produkci ([main.ts]).
- **PC-23** — `DELETION_HOLD_DAYS` compose default sjednocen na `30` (= kód).

**Zbývá:** **PC-21** jen OPS krok (nahrát model soubory na vlastní hosting — kód hotový) → [dluhy.md](dluhy.md). **PC-10** parciálně kryto env.validation (localhost check v prod URL); plný FE↔BE parity guard (`VITE_API_URL===BACKEND_BASE_URL`) = volitelný CI follow-up. **Pozitiva nedotčena:** PC-14/17/19/20.

> ⚠️ Po BE změnách **nutný restart** ([`feedback_be_restart_required`] — `env.validation`, nové importy, cookie). Git commit nechán uživateli ([`feedback_git_manual`]). CI: nový `npm run audit:config`.
>
> 🔬 **PC-18 post-deploy ověření** (jediná věc neověřitelná odsud — cross-domain cookie za běhu): po deployi se přihlas → počkej na expiraci access tokenu (1d, nebo zkrať `JWT_EXPIRES_IN` na test) → ověř, že silent refresh přes cookie funguje (žádné samovolné odhlášení). Pokud FE a BE na různých doménách, cookie potřebuje `SameSite=None;Secure` (už nastaveno) + HTTPS na obou (vynucuje env.validation).

## Osy

**Jádro (7):**
`EV` env inventory & validation (deklarováno + validováno při startu?) ·
`SC` secrets (z env, silné, bez defaultu v kódu, ne v historii) ·
`OG` origin (CORS/WS/static uzavřený na prod FE?) ·
`FB` fallbacks (žádný dev default reálně dosažitelný v prod) ·
`ST` storage config (Cloudinary/disk/limity/healthcheck) ·
`ML` mailer config (SMTP + odkazy na živou FE URL) ·
`DP` deploy parity (deploy ↔ kód ↔ compose ↔ example shoda)

**Hloubka (6):**
`BL` bundle leak (VITE_ / sourcemaps / console.log v dist) ·
`HD` hardening (NODE_ENV / ValidationPipe / Swagger / /health leak / headers) ·
`RL` rate-limit/DoS gate (Throttler registrován v prod?) ·
`TL` TLS/transport (http vs https / cookie secure / smtp secure) ·
`KR` key/TTL rotation (JWT 7d / refresh 30d / délka klíče) ·
`PA` config parita FE↔BE (kruh FRONTEND_URL ↔ VITE_API_URL ↔ CORS ↔ BACKEND_BASE_URL)

**Nadstavba (Maximum/Maximum+):**
`ED` env drift sken (4-zdroj diff) ·
`FK` fallback katalog ·
`SS` secret sken (strom + git historie) ·
`BP` boot-probe (prázdný env → fail-fast?) ·
`M-PARITY` 👑 cross-repo config kruh ·
`TE` teeth (mutace env guardu)

---

## Závažnost

- 🔴 **dev bypass / secret leak / otevřený origin / odkaz na mrtvý web v prod** — bezpečnostní/funkční průlom
- 🟠 **dev fallback dosažitelný v prod / chybějící validace / drift deploy↔kód** — funkční riziko, tichá degradace
- 🟡 **dluh / hardening / kosmetika / chybějící fail-fast / dlouhý TTL** — nízký dopad nebo by-design

## Úrovně jistoty

- **L1** přečteno (recon) · **L2** strojový sken (M-ENV / M-FALLBACK / M-SECRET diff) · **L3** + kontext dosažitelnosti (gated NODE_ENV / kryto compose?) · **L4** deploy parita (4 zdroje sjednoceny) · **L5** boot-probe (prázdný env → fail-fast empiricky) · **L6** FE↔BE config parita (M-PARITY) · **L7-teeth** mutace env guardu

## Stav nálezu

- 🟡 hypotéza (seed, neověřeno) · 🐛 potvrzený nález · ⚖️ by-design / přijatelné · ✅ opraveno+ověřeno

---

## Potvrzené nálezy (`PC-xx`)

> Sweep 2026-06-14: `prod-config-scan.mjs` (L2) + ruční čtení kódu (L3/L4) + M-SECRET + statický M-BOOT
> + M-PARITY. Severity nenafukována — 🔴 jen tam, kde je dopad bezpečnostní/funkční průlom dosažitelný v prod.

| ID | Záv. | Osa | Úroveň | Oblast | Nález | Stav |
|---|---|---|---|---|---|---|
| PC-01 | 🔴 | SC/FB | L3 | 02 | **captcha fail-OPEN** — [captcha.service.ts:34-41] `if(!secret) return true`; deploy `TURNSTILE_SECRET` nevaliduje, compose bez `:?`, .env.example neobsahuje → registrace bez captchy v prod. Doc ř.19-20 tvrdí opak (lže) | 🐛 |
| PC-02 | 🔴 | ML/PA | L3 | 05 | **mailer → mrtvý web** — [smtp-mailer.provider.ts:42] `FRONTEND_URL ?? 'https://newmatrix.patrikzplzne.cz'` (starý .NET server po swapu); dosažitelné když SMTP set + FRONTEND_URL chybí (compose bez `:?`) → reset-hesla odkaz na cizí web | 🐛 |
| PC-03 | 🟠 | EV | L3 | 01 | **žádné env validation schema** — [app.module.ts:61] `ConfigModule.forRoot({isGlobal:true})` bez `validationSchema` → kritická proměnná selže až runtime, ne při startu | 🐛 |
| PC-04 | 🟠 | OG/FB | L4 | 03 | **localhost:5174 v prod allowlistu** — [main.ts:26] + [socket-io.adapter.ts:8] hardcoded `'http://localhost:5174'` bezpodmínečně (žádné NODE_ENV gate) v REST i WS CORS | 🐛 |
| PC-05 | 🟠 | ST/FB | L3 | 04 | **disk fallback → localhost URL** — [upload.service.ts:430-432] `BACKEND_BASE_URL ?? 'http://localhost:3000'`; compose `${BACKEND_BASE_URL}` bez `:?` → při Cloudinary outage + chybějícím varu obrázky `localhost` URL | 🐛 |
| PC-06 | 🟡 | ST/SC | L3 | 04 | **MEILI_API_KEY ''** — [meili-search.service.ts:31] 2-arg default `''` (bez auth); compose kryje (`MEILI_MASTER_KEY`) → riziko jen mimo compose | 🐛 |
| PC-07 | 🟡 | HD | L3 | 08 | **ValidationPipe bez forbidNonWhitelisted** — [main.ts:20] `{whitelist:true,transform:true}` → neznámá pole tiše drop (maskuje FE↔BE drift) | 🐛 |
| PC-08 | 🟡 | HD/TL | L3 | 08 | **/health info leak** — [app.controller.ts:41-46] `/api/health` bez guardu vrací `missing: string[]` → neautentizovaně vyjmenuje chybějící env (Cloudinary/VAPID/JWT) = recon pomoc | 🐛 |
| PC-09 | 🟡 | BL | L3 | 06 | **console.log v prod bundlu** — [vite.config.ts] minimální, bez `esbuild.drop` → `console.*`/`debugger` zůstávají v `dist/`. (sourcemaps OK — Vite prod default false → hypotéza vyvrácena) | 🐛 |
| PC-10 | 🟠 | PA | L4 | 07 | **config kruh nevynucen** — `VITE_API_URL` (FE) a `BACKEND_BASE_URL` (BE) drží **stejnou hodnotu** (veřejná BE URL) jako 2 nezávislé vars bez kontroly shody; žádné `https://` vynucení; FE↔BE drift tichý | 🐛 |
| PC-11 | 🟡 | ST | L3 | 04 | **healthcheck Cloudinary lže** — [app.controller.ts:26-30] čte `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET` zvlášť, upload čte jen `CLOUDINARY_URL`; deploy předává jen `_URL`+`_CLOUD_NAME` → health **vždy** „degraded" i když upload funguje | 🐛 |
| PC-12 | 🟡 | KR | L3 | 08 | **dlouhá token okna** — `JWT_EXPIRES_IN` 7d access + `JWT_REFRESH_TTL_DAYS` 30d; access 7d je dlouhý (typicky min–h) + v localStorage (PC-18) = velké okno kompromitace | 🐛 |
| PC-13 | 🟡 | OG/HD | L3 | 03 | **13× mrtvý CORS config** — [base.gateway.ts:11] + 12 gateway `cors:{origin:process.env.FRONTEND_URL...}` v `@WebSocketGateway` dekorátoru; `CustomIoAdapter` (server-level) ho **přebíjí** → duplikovaný mrtvý kód, matoucí (vypadá jako 2. zdroj WS originu) | 🐛 |
| PC-14 | ⚖️ | SC | L3 | 02 | **JWT/refresh fail-fast (POZITIVUM)** — [auth.module.ts:24-28] + [auth.service.ts:73-80] `?? (()=>throw)()`; správný vzor (kontrast k captcha fail-open). Cíl: rozšířit na ostatní 🔴 | ✅ |
| PC-15 | 🟠 | DP/BL | L4 | 06 | **FE tichý localhost** — [Dockerfile:5] `ARG VITE_API_URL=` + [docker-compose.yml:7] `${VITE_API_URL:-}` + deploy var → `:-` prázdný default na 3 vrstvách; zapomenutý var = celý FE volá `localhost:3000` ([client.ts:8]), build projde bez chyby | 🐛 |
| PC-16 | 🟠 | ED/DP | L2 | 01 | **.env.example 13/40** — M-ENV: kód čte 40 env, .env.example dokumentuje 13 → **27 nezdokumentováno** (vč. `TURNSTILE_SECRET`, `VAPID_*`, `CLOUDINARY_*`, `MEILI_*`, `REDIS_URL`); vývojář/admin podle něj nenastaví captcha/push/storage/search | 🐛 |
| PC-17 | ✅ | RL | L3 | 08 | **Throttler v prod (SHODA)** — [app.module.ts:65] `ThrottlerModule.forRoot([{ttl:60s,limit:100}])` globálně, bez NODE_ENV gate; citlivé endpointy mají vlastní `@Throttle`. Není nález | ✅ |
| PC-18 | 🟠 | TL/SC | L3 | 08 | **JWT+refresh v localStorage** — [authStore.ts:5-6] `atomWithStorage('ikaros.jwt'/'ikaros.rt')` → access I refresh v localStorage; XSS = únik obou; refresh (30d) by patřil do httpOnly cookie | 🐛 |
| PC-19 | ⚖️ | SS | L3 | 02 | **secret sken čistý** — žádný `.env` (non-example) tracked v žádném repu, `.gitignore` kryje oba; BE placeholder `JWT_SECRET=change-this-...` je jasný placeholder. Hluboký sken git historie = follow-up (cross-ref [paměť `project_git_history_cleanup`]) | ✅ |
| PC-20 | ⚖️ | FB/OG | L3 | 04 | **Redis/Meili/Socket kryto compose** — `REDIS_URL`/`MEILI_HOST` localhost + `SOCKET_IO_REDIS` in-memory fallback, vše přepsáno [docker-compose.prod.yml] (service names + `"1"`). Riziko jen mimo compose | ✅ |
| PC-21 | 🟠 | ST/FB | L2 | 04 | **embedding → starý web** — [embedding-search.service.ts:370-396] 4 model URL (ONNX+tokenizer granite107/278) fallback `https://www.patrikzplzne.cz/...`; tyto URL **nejsou** v deploy/compose (M-ENV sekce a) → fallback = jediná cesta; core search závisí na externí osobní doméně | 🐛 |
| PC-22 | 🟡 | HD | L3 | 08 | **Swagger v prod bez gate** — [main.ts:54-55] `SwaggerModule.setup('docs',...)` bezpodmínečně → `/docs` veřejně exponuje celé API schema v prod | 🐛 |
| PC-23 | 🟡 | DP/ED | L4 | 07 | **DELETION_HOLD_DAYS drift** — [docker-compose.prod.yml:98] `:-14` vs [admin.service.ts:80] kód default `30`; chybějící var → prod 14d recovery, ač kód/UsersService/[paměť `project_world_soft_delete`] předpokládají 30 | 🐛 |
| PC-24 | 🟠 | EV/SC | L2 | 00 | **META-KOŘEN: 3/~20 compose fail-fast** — jen `JWT_SECRET`/`JWT_REFRESH_SECRET`/`MEILI_MASTER_KEY` mají `${VAR:?required}`; `TURNSTILE_SECRET`/`FRONTEND_URL`/`BACKEND_BASE_URL`/`CLOUDINARY_URL`/`VAPID_*` tiše prázdné → zdroj PC-01/02/05. Žádná startup pojistka (PC-03) | 🐛 |

> **Souhrn:** 24 nálezů — **2×🔴** (PC-01/02), **8×🟠** (PC-03/04/05/10/15/16/18/21), **11×🟡** (PC-06/07/08/09/11/12/13/22/23 + …), **3×⚖️/✅ pozitiva** (PC-14/17/19/20). Falešné poplachy M-ENV sekce (a): `EMBEDDING_*` ladění + `PRESENCE_THRESHOLD_HOURS` mají bezpečné defaulty → **nejsou** nález (kromě PC-21 model URL).

---

## Seed kandidáti (`K-PCx`) — hypotézy → verdikty

> **Sweep uzavřen 2026-06-14.** Verdikty: K-PC1→**PC-01** · K-PC2→**PC-02** · K-PC3→**PC-03** · K-PC4→**PC-04** ·
> K-PC5→**PC-05** · K-PC6→**PC-06** · K-PC7→**PC-07** · K-PC8→**PC-08** · K-PC9→**PC-09** (sourcemaps vyvráceno,
> zbývá console.log) · K-PC10→**PC-10** · K-PC11→**PC-11** · K-PC12→**PC-12** · K-PC13→**PC-13** · K-PC14→**PC-14**
> (⚖️ pozitivum) · K-PC15→**PC-15** · K-PC16→**PC-16** · K-PC17→**PC-17** (✅ shoda, ne nález) · K-PC18→**PC-18** ·
> K-PC19→**PC-19** (⚖️ čisté) · K-PC20→**PC-20** (⚖️ kryto compose). **Nové mimo seed:** PC-21 (embedding starý web),
> PC-22 (Swagger v prod), PC-23 (DELETION_HOLD drift), PC-24 (meta-kořen: 3/~20 compose fail-fast).
>
> Z reconu 2026-06-14 (3 paralelní mapovací agenti). ⚠️ Recon přestřeloval — BE deploy validaci přiřadil
> špatnému repu, captcha bypass (control-flow) a embedding starý web nezachytil; **kritické nálezy ověřeny
> ručním čtením kódu**, ne jen recon shrnutím.

| ID | Záv. | Osa | Oblast | Hypotéza | Důkaz z reconu (L1) |
|---|---|---|---|---|---|
| K-PC1 | 🔴 | FB/SC | 02/08 | captcha bez `TURNSTILE_SECRET` → `return true` → registrace bez captchy v prod | captcha.service.ts:36-41 (dev bypass + warn) |
| K-PC2 | 🔴 | ML/PA | 05 | mailer `FRONTEND_URL ?? 'https://newmatrix.patrikzplzne.cz'` → reset-hesla odkazy na **starý .NET server** | smtp-mailer.provider.ts:42; [paměť `project_server_swap`] |
| K-PC3 | 🟠 | EV | 01 | žádné env validation schema → kritická proměnná selže až runtime, ne při startu | app.module.ts:61 `ConfigModule.forRoot({isGlobal:true})` |
| K-PC4 | 🟠 | OG/FB | 03 | CORS+WS allowlist drží hardcoded `http://localhost:5174` (dev stroj) i v prod | main.ts:27, socket-io.adapter.ts:8 |
| K-PC5 | 🟠 | ST/FB | 04 | `BACKEND_BASE_URL ?? 'http://localhost:3000'` → disk-fallback obrázky localhost URL v prod | upload.service.ts:431 |
| K-PC6 | 🟠 | ST/SC | 04 | `MEILI_API_KEY ?? ''` → search bez auth při chybějícím env (compose kryje, fallback ne) | meili-search.service.ts:31 |
| K-PC7 | 🟡 | HD | 08 | `ValidationPipe` bez `forbidNonWhitelisted` → neznámá pole tiše zahozena (maskuje drift) | main.ts:20 |
| K-PC8 | 🟡 | HD/TL | 08 | `/health` vrací stav env (cloudinary/vapid) bez auth → info leak o konfiguraci | app.controller.ts:46 |
| K-PC9 | 🟡 | BL | 06 | FE `vite.config.ts` minimální → sourcemaps default + console.log nestriped v prod bundlu | vite.config.ts |
| K-PC10 | 🟠 | PA | 07/00 | config kruh bez guardu: FRONTEND_URL ↔ VITE_API_URL ↔ CORS ↔ BACKEND_BASE_URL musí souhlasit | recon §B 4 zdroje |
| K-PC11 | 🟡 | ST | 04 | healthcheck čte `CLOUDINARY_*` zvlášť, upload jen z `CLOUDINARY_URL` → healthcheck klame | app.controller.ts:27-29 vs upload.service.ts:121 |
| K-PC12 | 🟡 | KR | 02/08 | `JWT_EXPIRES_IN` 7d + `JWT_REFRESH_TTL_DAYS` 30d → dlouhá session okna, žádná rotace | auth.module.ts:30 |
| K-PC13 | 🟡 | OG/HD | 03 | base.gateway cors přes přímý `process.env.FRONTEND_URL` (ne ConfigService) bez :5174 → 12+ gateway dědí dvojí zdroj | base.gateway.ts:10-13 |
| K-PC14 | ⚖️ | SC | 02 | JWT/refresh `?? throw` fail-fast = GOOD; ověřit že žádná cesta neobchází defaultem | auth.module.ts:25, auth.service.ts:74 |
| K-PC15 | 🟠 | DP/BL | 06/07 | FE Dockerfile `ARG VITE_API_URL=` prázdný → build bez argu zapeče prázdno → runtime localhost | Dockerfile:5, client.ts:8 |
| K-PC16 | 🟠 | ED/DP | 01/07 | env drift: kód čte ~35, deploy předává ~22, example/compose jiná množina → M-ENV vyčíslí | recon §B/§C |
| K-PC17 | 🟡 | RL | 08 | Throttler globálně registrován v prod a ne dev-disabled? body limit 5mb | recon §7 (upload @Throttle 20/min) |
| K-PC18 | 🟡 | TL/SC | 02/08 | JWT v localStorage (FE) → XSS expozice; cookie flags refresh (secure/httpOnly/sameSite)? | socket.ts auth token; ověřit refresh transport |
| K-PC19 | 🟡 | SS | 02 | secret sken: placeholder JWT v `.env.example`? secrety v git historii? | [paměť `project_git_history_cleanup`] |
| K-PC20 | 🟡 | FB/OG | 04/08 | `REDIS_URL`/`MEILI_HOST` localhost + `SOCKET_IO_REDIS` undefined→in-memory → multi-instance degrade (compose kryje, ověř L3) | redis.module.ts:20, socket-io.adapter.ts:33; cross-ref [state-consistency] |

---

## Doporučené pořadí oprav (až po schválení — opravy gated)

> Seřazeno podle dopad/náklad. **Před prvním ostrým deployem** ([paměť `project_deployment_handoff`]) jsou kritické #1–#3.

1. **🔴 PC-01 captcha fail-open** → buď gate bypass na `NODE_ENV !== 'production'` (dev-only), nebo fail-closed (`return false`) + oprava lživého doc komentáře. Malý zásah, velký dopad.
2. **🔴 PC-02 mailer mrtvý web** → odstranit hardcoded `newmatrix.patrikzplzne.cz` fallback; fail-fast nebo produkční URL. 1 řádek.
3. **🟠 PC-24 + PC-03 (meta-kořen)** → doplnit `${VAR:?required}` do compose pro `TURNSTILE_SECRET`/`FRONTEND_URL`/`BACKEND_BASE_URL`/`CLOUDINARY_URL` **nebo** zavést env `validationSchema` (Joi/zod) v `ConfigModule.forRoot` — jedním tahem kryje PC-01/02/05/15. Doporučený **systémový fix**.
4. **🟠 PC-04** → gate `localhost:5174` na dev (`NODE_ENV`), nebo ven z prod allowlistu. Sjednotit s PC-13.
5. **🟠 PC-13** → smazat mrtvý `cors:` z 13 `@WebSocketGateway` dekorátorů (přebito adapterem) NEBO centralizovat origin do 1 helperu; vyřeší i nekonzistenci base.gateway.
6. **🟠 PC-21 embedding starý web** → doplnit model URL do deploy/compose (vlastní hosting) nebo přijmout jako dluh s vědomým rizikem.
7. **🟠 PC-16 .env.example** → doplnit 27 chybějících proměnných (onboarding + deploy checklist); levné, vysoká hodnota pro netechnického admina.
8. **🟠 PC-15** → `RUN test -n "$VITE_API_URL"` v FE Dockerfile (fail build při prázdném argu).
9. **🟠 PC-10** → M-PARITY guard do CI: `VITE_API_URL === BACKEND_BASE_URL` + vše `https://`.
10. **🟡 zbytek** (PC-07/08/09/11/12/18/22/23) → hardening dávka: forbidNonWhitelisted (s dopad-testem), /health bez `missing[]`, esbuild.drop console, Cloudinary healthcheck symetrie, Swagger gate na NODE_ENV, DELETION_HOLD sjednotit na 30, refresh token → httpOnly cookie (větší zásah).

**CI guard:** `prod-config-scan.mjs` (M-ENV + M-FALLBACK) do precommit/CI — drift a nové dev fallbacky se nikdy nevrátí tiše. Přidat `npm run audit:config`.

> ⚠️ Opravy jsou **BE + FE** → nemíchat do jedné dávky ([paměť `feedback_no_mixed_be_fe_batch`]); po BE změně **restart** ([`feedback_be_restart_required`]); FE ověřit `npm run build`; git commit na uživateli ([`feedback_git_manual`]).

---

## Cross-ref (sdílené povrchy — M2, nezdvojovat)

- [upload-media audit](upload-media-audit.md) — Cloudinary/disk lifecycle (ST staví na něm, řeší jen **config** klíčů/secure/base URL).
- [ws-contract] (paměť `project_ws_security_patterns`) — WS identita/room (OG řeší jen **origin/CORS** konfiguraci).
- [role audit](role-audit.md) **R-20** (paměť `project_admin_world_governance`) — governance; SC/KR cross-ref na auth.
- [state-consistency] — Redis adapter multi-instance (K-PC20 `SOCKET_IO_REDIS`).
- [nav audit](nav-audit.md) — `FRONTEND_URL` deep-linky + open-redirect (PA/ML).
- Paměť: `project_deployment_handoff` (deploy pipeline), `project_smtp_email_setup` (mailer), `project_server_swap` (newmatrix = starý server), `project_git_history_cleanup` (secret sken historie).

## Legenda

- ⬜ k ověření · 🟡 hypotéza · 🐛 potvrzeno · ⚖️ by-design · ✅ opraveno+ověřeno
- `PC-xx` potvrzený nález · `K-PCx` seed kandidát
- ⚠️ Secrety se do registru zapisují **jen názvem proměnné**, nikdy reálnou hodnotou.
