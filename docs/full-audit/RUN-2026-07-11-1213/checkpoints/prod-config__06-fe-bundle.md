# prod-config / 06-fe-bundle — checkpoint RUN-2026-07-11-1213

> Auditor: claude-opus-4-8 · Datum: 2026-07-11 · READ-ONLY · styl prod-config (PC-), osy `BL` (bundle leak) + `DP` (build/deploy parita) — FE side.
> Předchůdce: RUN-2026-06-20-1621 (06-fe-bundle: PC-RUN-01..03). Tento běh = re-audit k HEAD 2026-07-11 (main).
> Klasifikace: 🆕 nové · ♻️ reziduum (nevyřešeno z minula) · 🔓 uvolněná dřívější oprava.

---

## Pokrytí (L1–L2)

| Artefakt | Pokryto |
|---|---|
| `vite.config.ts` — esbuild.drop + **build.minify:'esbuild'** (nové) | ✅ L2 |
| `Dockerfile` — VITE_API_URL warn-only, ARG/ENV | ✅ L2 |
| `docker-compose.yml` (FE) — build args + runtime env | ✅ L2 |
| `.github/workflows/deploy.yml` (FE) — .env zápis, BACKEND_HOST derive | ✅ L2 |
| `package.json` — `build` (stamp+tsc+vite+check-csp-hash) | ✅ L2 |
| `.env.example` (FE) | ✅ L2 |
| `src/shared/api/client.ts` + `features/chat/api/socket.ts` — `VITE_API_URL ?? localhost` | ✅ L2 |
| `src/app/main.tsx` — VITE_API_URL + PROD mode | ✅ L2 |
| `src/features/auth/.../RegisterModal.tsx` + `chat/.../AnonChatGate.tsx` — Turnstile fail-closed | ✅ L3 |
| `src/shared/lib/monitoring.ts` — **VITE_SENTRY_DSN** (nová var) | ✅ L3 |
| `index.html` — inline theme setter (CSP hash) + externí Google Fonts | ✅ L2 |
| `default.conf.template` — nginx CSP/HSTS/Perm-Policy | ✅ L2 |
| `scripts/check-csp-hash.mjs` — CSP hash guard (běží v `build`) | ✅ L2 |
| grep `import.meta.env.VITE_*` napříč `src/` | ✅ L2 |

**Dosažená L: L2** (statické čtení + grep katalog VITE_ vars). Reálné hodnoty GitHub vars + zapečený bundle = PROOF-REQUEST (mimo kód).

---

## Nálezy

### 🆕 Nové (k HEAD 2026-07-11)

**PC-RUN-14** — `DP`/`ED` — **`VITE_SENTRY_DSN` čteno-ale-nikde-nepředáno → FE error tracking tiše vypnutý v prod** 🟡 🆕
- Nová var od minulého běhu: `monitoring.ts:14` `const dsn = import.meta.env.VITE_SENTRY_DSN` — bez DSN se `Sentry.init` přeskočí (`if (dsn)`), zůstanou jen `window.onerror`/`unhandledrejection` handlery, které chybu jen `console.error`-nou (a ta je v prod **strippnutá** esbuild.drop → chyba zmizí beze stopy).
- Wiring řetězec je **kompletně přerušený**: Dockerfile (`:5-9`) nemá `ARG/ENV VITE_SENTRY_DSN` · compose (`docker-compose.yml:6-8`) předává jen `VITE_API_URL`+`VITE_TURNSTILE_SITE_KEY` · deploy.yml (`:61-67`) zapisuje do `.env` jen 5 var (bez SENTRY) · `.env.example` (2 řádky) ho nezná. Ani nastavení GitHub var by DSN do buildu nedostalo (chybí ARG).
- Dopad: „3. noha" monitoringu (FE error tracking do Sentry/GlitchTip) je v produkci **de facto mrtvá** — stejný vzor jako PC-RUN-03 (TOTP_ENC_KEY) z minula: feature označená hotová, ale v prod bez klíče/DSN neběží. DSN je veřejný (bundle-safe, potvrzeno komentářem `monitoring.ts:11`) → **není** to secret-leak, jen degradace pozorovatelnosti.
- Návrh: doplnit `ARG/ENV VITE_SENTRY_DSN` do Dockerfile + build arg do compose + řádek do deploy.yml `.env` + `.env.example`. NEBO vědomě přijmout jako dluh (FE bez remote error trackingu).
- Kde: `Dockerfile:5-9`, `docker-compose.yml:6-8`, `deploy.yml:61-67`, `.env.example`, `monitoring.ts:14`
- L3 (kontext dosažitelnosti: prod deploy = DSN undefined = init skip) · 🆕

**PC-RUN-15** — `BL` — **console-drop (PC-09) je nově dvojitě-vázaný na vynucený esbuild minifier** 🟡 🆕
- `vite.config.ts:18` `esbuild: mode==='production' ? { drop:['console','debugger'] } : {}` + **nově** `:21-23` `build:{ minify:'esbuild' }` s komentářem: *„vite@8 defaultuje minifikaci na 'oxc', kde esbuild.drop výše je no-op — console.*/debugger by přežily. Vynutit esbuild minifier."*
- Tj. účinnost PC-09 (žádné `console.*` v prod bundlu) nyní závisí na **dvou** současně správných věcech: `esbuild.drop` **A** `minify:'esbuild'`. Odebrání/změna kteréhokoli (nebo vite upgrade měnící default) → `console.*` se **tiše vrátí** do prod bundlu. Aktuálně kód je správně (drop účinný), riziko je křehkost, ne aktivní chyba. Dokumentováno v configu = řízené.
- Trade-off (menší): vynucení `esbuild` přes vite@8 default `oxc` může vydat o něco větší/méně optimalizovaný bundle — cross-ref styl 21 (bundle SLO 350 kB, viz níže).
- Návrh: přijmout (dokumentováno) + regresní pojistka — grep `dist/assets/*.js` na `console.` po buildu (viz PROOF-REQUEST PR-06-04).
- Kde: `vite.config.ts:16-23`
- L2 · 🆕

### ♻️ Reziduum (nevyřešeno z RUN-2026-06-20)

**PC-RUN-08** (= PC-15) — `DP`/`BL` — **FE Dockerfile: prázdný `VITE_API_URL` jen VARUJE, ne `exit 1`** 🟠 ♻️
- `Dockerfile:15-26` — `if [ -z "$VITE_API_URL" ]; then echo VAROVANI…; fi` pak `RUN npm run build` **bez** `exit 1` (komentář `:16`: „Build NEblokujeme (deploy projde)"). Build s prázdným argem projde → zapeče `client.ts:12` fallback `http://localhost:3000` → celý FE v prod volá localhost, `docker compose ps` zelené, deploy verify (`deploy.yml:99-105`) neselže (počítá jen running kontejnery). Odhalí se až uživatelsky.
- Vědomý downgrade původního PC-15 (`RUN test -n` → warn). **Sdílený povrch s 08-hardening (tam PC-RUN-08)** — dle plán-indexu je oblast 06 primární vlastník (`BL`/`DP`), 08 jen cross-ref.
- Kde: `Dockerfile:18-26`
- L3 · ♻️

**CSP `connect-src` — `${BACKEND_HOST}` bez schématu (schemeless wss)** — `BL`/`TL` 🟡 ♻️ (= minulý PC-RUN-02)
- `default.conf.template:116` `connect-src 'self' data: ${BACKEND_HOST} https://res.cloudinary.com … wss://meet.jit.si`. Pro backend (REST polling + Socket.IO wss) spoléhá na **schemeless host match** (CSP L3 = kryje https i wss naráz; komentář `:4-5`). Pro `meet.jit.si` už explicitní `wss://` **doplněn**, pro `${BACKEND_HOST}` ne. Striktní/starší prohlížeč (Safari Mobile ≤ 15) může Socket.IO WS odmítnout.
- Dokumentovaný design choice, nízký dopad. Návrh: přidat `wss://${BACKEND_HOST}` explicitně vedle holého hostu.
- Kde: `default.conf.template:116`, `deploy.yml:53-57`
- L2 · ♻️

---

## Pozitiva potvrzená k HEAD

| Co | Kde | Stav |
|---|---|---|
| `console.*`/`debugger` strippnuté v prod (esbuild.drop **+ vynucený esbuild minify**) | vite.config.ts:16-23 | ✅ (PC-09 drží; viz křehkost PC-RUN-15) |
| Sourcemaps v prod OFF — žádný `build.sourcemap` → Vite default `false` | vite.config.ts | ✅ (K-PC9 sourcemaps zůstává vyvráceno) |
| Žádný secret ve `VITE_*` — jen `VITE_API_URL` (URL) · `VITE_TURNSTILE_SITE_KEY` (veřejný site-key) · `VITE_SENTRY_DSN` (veřejný DSN, bundle-safe) | grep `src/` | ✅ |
| Turnstile **fail-closed** v prod (bez env → `null`, widget se nerenderuje + `console.error`, registrace/anon-chat blokovaný, žádný tichý přepad na test key) | RegisterModal.tsx:54-64; AnonChatGate.tsx:11-12 | ✅ |
| CSP **hash guard** běží v `npm run build` (čte `dist/index.html`, CRLF→LF normalizace, mismatch → exit 1) — CSP hash check OK | package.json:8; check-csp-hash.mjs:41-60 | ✅ |
| CSP **enforce** mode default (`CSP_HEADER_NAME=Content-Security-Policy`); `object-src 'none'` · `base-uri 'self'` · `frame-ancestors 'self'` · `upgrade-insecure-requests` | Dockerfile:41; default.conf.template:116 | ✅ |
| nginx security headers na HTML (X-Frame SAMEORIGIN, nosniff, HSTS 1y+includeSubDomains, Referrer-Policy, Permissions-Policy) + immutable asset cache 1y | default.conf.template:107-116,54-58 | ✅ |
| FE Dockerfile předává jen 2 build args, oba veřejné (žádný secret do image layer) | Dockerfile:5-9; docker-compose.yml:6-8 | ✅ |

---

## Cross-ref (jiné styly / oblasti — nezdvojovat)

- **Styl 21 (bundle/perf SLO):** eager **TipTap 457 kB > 350 kB SLO** → lazy-load `RichTextEditor` (`report.md:39,59-60`). Bundle **SIZE**, ne leak → vlastní styl 21, zde jen cross-ref. Souvisí s PC-RUN-15 (esbuild vs oxc minify může velikost dál zhoršit).
- **`index.html:60-65` externí Google Fonts stylesheet (~80 rodin, render-blocking, `display=swap`)** — perf/LCP, cross-ref styl 21/perf; CSP `style-src`/`font-src` je povoluje (`fonts.googleapis.com`/`fonts.gstatic.com`). Ne bundle-leak.
- **CSP `'unsafe-eval'` (YouTube widgetapi) + `'unsafe-inline'` v `style-src` (router inline styly)** — `default.conf.template:92-95`, doložené report-only fází ústupky → XSS hardening, vlastní oblast 08 / styl XSS-META. Ne `BL`.
- **08-hardening (RUN-2026-07-11):** access token v localStorage (PC-RUN-02), FE Dockerfile warn (PC-RUN-08), nginx CSP/HSTS pozitiva — sdílené, tam potvrzeno.

---

## PROOF-REQUEST (nelze staticky)

| PR# | Co |
|---|---|
| PR-06-01 | Živá nginx CSP hlavička v prohlížeči: `${BACKEND_HOST}` schemeless kryje wss (Socket.IO) i na Safari Mobile? (PC-RUN-08 CSP wss) |
| PR-06-02 | GitHub var `VITE_API_URL` reálně nastavena v env `production` (jinak tichý localhost, PC-RUN-08) — OPS check |
| PR-06-03 | `VITE_SENTRY_DSN` na serveru / v GitHub vars? Bez něj FE error tracking mrtvý (PC-RUN-14) |
| PR-06-04 | grep zapečený `dist/assets/*.js` na `console.` — ověřit, že esbuild.drop je reálně účinný pod vynuceným minifierem (PC-RUN-15) |

---

## Souhrn nálezů oblasti 06 (RUN 2026-07-11)

| ID | Záv. | Osa | Klas. | Popis |
|---|---|---|---|---|
| PC-RUN-14 | 🟡 | DP/ED | 🆕 | `VITE_SENTRY_DSN` čteno-ale-nepředáno (Dockerfile/compose/deploy/example) → FE error tracking tiše off v prod |
| PC-RUN-15 | 🟡 | BL | 🆕 | console-drop dvojitě-vázaný na `build.minify:'esbuild'` (vite@8 default = oxc, kde drop no-op); křehké, teď správné |
| PC-RUN-08 | 🟠 | DP/BL | ♻️ | FE Dockerfile: prázdný `VITE_API_URL` jen varuje, ne exit 1 (tichý localhost) — primární vlastník area 06 |
| (CSP wss) | 🟡 | BL/TL | ♻️ | `${BACKEND_HOST}` schemeless v connect-src (spoléhá na CSP L3 https+wss match) |

**Nejzávažnější: PC-RUN-08** (🟠, tichý localhost prod build — vědomý downgrade PC-15, nese i 08-hardening). Žádný 🔴, žádný secret-leak. Jádrová `BL` pozitiva **drží a zesílila** (console-drop nově pojištěn proti oxc default; sourcemaps off; CSP hash guard; Turnstile fail-closed). Dvě nové 🟡: **PC-RUN-14** (Sentry monitoring wiring chybí — vzor „feature hotová, v prod nezapojená" jako TOTP) a **PC-RUN-15** (křehkost console-drop). Bundle SIZE (TipTap 457 kB) = styl 21, ne tato oblast.
