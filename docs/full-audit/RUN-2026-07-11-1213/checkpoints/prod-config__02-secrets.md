# prod-config / 02-secrets — checkpoint RUN-2026-07-11-1213

Datum: 2026-07-11 · Auditor: hloubkový READ-ONLY agent (oblast 02 only) · BE=`Projekt-ikaros/backend` FE=`Projekt-ikaros-FE`.
Osy: `SC` (secrets), `SS` (secret sken stromu+historie), částečně `KR` (TTL), `TL` (transport).
Cíl dle plánu: `SC` L4 · `SS` L5. Dosaženo: **L3** (statika + kontext dosažitelnosti); L4/L5 (deploy parita strojově + boot-probe) = PROOF-REQUEST (live infra).

Klasifikace: 🆕 nový · ♻️ recidiva/známé · 🔓 regrese (dřív zavřené, teď otevřené).

---

## Pokrytí (soubory čteny na HEAD)

| Soubor | Co | Verdikt |
|---|---|---|
| `auth/auth.module.ts:29-33,40-41` | JWT_SECRET fail-fast + JWT_EXPIRES_IN default | ✅ throw · ⚠️ TTL drift (viz PC-RUN-04) |
| `auth/auth.service.ts:94-101` | JWT_REFRESH_SECRET fail-fast (`?? throw`) | ✅ |
| `auth/strategies/jwt.strategy.ts:12-17` | JWT_SECRET 3. výskyt fail-fast | ✅ |
| `auth/captcha.service.ts:42-56` | TURNSTILE_SECRET fail-closed v prod | ✅ PC-01 drží |
| `auth/services/totp-crypto.service.ts:25-42` | TOTP_ENC_KEY AES-256-GCM, fail-closed (null key) | ✅ |
| `common/config/env.validation.ts` | REQUIRED vs RECOMMENDED, prod URL localhost warn | ✅ + 2 mezery |
| `common/config/env.validation.spec.ts` | testy fail-fast + RECOMMENDED `.each` | ⚠️ PC-RUN-03 (neúplný `.each`) |
| `search/meili-search.service.ts:30-33` | MEILI_API_KEY `''` default | ♻️ PC-06 (kryto compose) |
| `mailer/providers/smtp-mailer.provider.ts:41-43` | FRONTEND_URL bez mrtvého webu | ✅ PC-02 drží |
| `push/push.service.ts` | VAPID (push volitelný) | ✅ mimo záběr rizika |
| `docker-compose.prod.yml` | compose fail-fast `:?required` | ✅ 3 secrety + reconciliation |
| `.github/workflows/deploy.yml` (Projekt-ikaros) | .env skládání + pre-deploy validace | ✅ TOTP_ENC_KEY nyní předáván |
| `backend/.env.example` | placeholdery + dokumentace | ✅ |
| `git ls-files` + grep secretů | SS sken stromu | ✅ čistý (jen test fixtures) |

**Mimo záběr** (jiné oblasti): CORS/WS origin (03), MEILI/Cloudinary storage lifecycle (04), Swagger/health/ValidationPipe (08).

---

## Regrese-check — VŠECHNY prior fixy oblasti 02 drží (žádné 🔓)

| ID | Stav na HEAD 2026-07-11 | Závěr |
|---|---|---|
| **PC-01** captcha fail-open | `captcha.service.ts:46-50` `NODE_ENV==='production' → return false`; doc komentář (ř.20-25) opravený, nelže | ✅ drží, žádná regrese |
| **PC-14** JWT/refresh fail-fast | 3 místa `?? (()=>{throw})()`: auth.module.ts:29-33, jwt.strategy.ts:12-17, auth.service.ts:94-101 — žádná bypass cesta | ✅ drží (pozitivum) |
| **PC-02** mailer → mrtvý web | `smtp-mailer.provider.ts:43` `FRONTEND_URL ?? 'http://localhost:5173'`; hardcoded `newmatrix.patrikzplzne.cz` pryč | ✅ drží |
| **PC-19** secret sken čistý | `git ls-files` → žádný `.env` (non-example) tracked; grep secretů v `src/` → jen `.spec.ts` fixtures (RFC test TOTP `JBSWY3DPEHPK3PXP`, log canary, spec mocky) | ✅ SS strom čistý |
| **PC-RUN-01** TOTP_ENC_KEY chybí ve 3 zdrojích (z RUN-06-20) | **VYŘEŠENO**: compose:104 `${TOTP_ENC_KEY:-}`, deploy.yml:62 `secrets.TOTP_ENC_KEY`, .env.example:25, env.validation RECOMMENDED:39 | ✅ zavřeno |
| compose fail-fast `:?required` | `JWT_SECRET`:97, `JWT_REFRESH_SECRET`:99, `MEILI_MASTER_KEY`:71,91 mají `:?`; deploy.yml:84-98 pre-deploy validace testuje ty samé 3 (+ MEILI ≥16 B) | ✅ konzistentní |

---

## Nálezy

### PC-RUN-04 — [KR/DP] JWT_EXPIRES_IN drift: kód 3d, ale prod pipeline vždy 1d · 🟡 · 🆕 · L3

**Kde:**
- `auth.module.ts:40-41` — `config.get('JWT_EXPIRES_IN') ?? '3d'`; komentář ř.35-39 tvrdí **vědomé UX rozhodnutí 2026-06-21 = access TTL 3 dny**.
- `docker-compose.prod.yml:98` — `JWT_EXPIRES_IN: ${JWT_EXPIRES_IN:-1d}` → default **1d**.
- `backend/.env.example:14-15` — `JWT_EXPIRES_IN=1d` („Default 1d").
- `deploy.yml:59` — `JWT_EXPIRES_IN=${{ vars.JWT_EXPIRES_IN }}` → pokud GitHub var nenastaven, `.env` řádek prázdný → compose `:-1d` → **1d**.

**Mechanika:** compose (v prod jediná cesta) VŽDY předá konkrétní hodnotu — buď GitHub var, nebo `1d`. Kódový default `'3d'` se v produkci **nikdy neuplatní** (nastane jen při holém `node` bez compose/deploy, což prod nedělá). Efektivní prod access-TTL = **1d** (nebo hodnota varu), NE dokumentované 3d.

**Dopad:** nízký bezpečnostně (1d je bezpečnější než 3d), ale je to **tichý config drift** — 3 zdroje si odporují a kódový komentář **lže** o skutečné prod hodnotě (přesně třída chyby, kterou tento audit loví: „dokumentovaná/zamýšlená hodnota nedosáhne prod, maskováno vícezdrojovostí"). Cross-ref seed K-PC12 (JWT TTL) + PC-12 (dřív sjednoceno na 1d, kód se posunul na 3d, deploy vrstva zůstala 1d).

**Návrh:** sjednotit — buď zvednout compose/.env.example/deploy default na `3d` (chce-li se ta UX volba reálně nasadit), nebo upravit komentář v auth.module.ts, že efektivní prod hodnota řídí compose/var (`3d` je jen bare-node fallback).

---

### PC-RUN-03 — [SC] env.validation.spec.ts nekryje 7 z 11 RECOMMENDED · 🟡 · ♻️ (z RUN-06-20, stále otevřené) · L3

**Kde:** `env.validation.spec.ts:34-43` — `.each` testuje jen **4** položky (`FRONTEND_URL`, `BACKEND_BASE_URL`, `TURNSTILE_SECRET`, `MEILI_API_KEY`), zatímco `env.validation.ts:28-40` `RECOMMENDED_IN_PROD` má **11** (chybí `CLOUDINARY_URL`, `VAPID_SUBJECT/PUBLIC_KEY/PRIVATE_KEY`, `SMTP_HOST`, `SMTP_USER`, **`TOTP_ENC_KEY`**).

**Dopad:** nízký (RECOMMENDED jen varuje, neshazuje boot). Test-matice ale nepokrývá celý seznam → odebrání položky z RECOMMENDED (nebo změna warn logiky) projde zeleně. PC-RUN-03 identifikováno už 2026-06-20, dosud neopraveno.

**Návrh:** doplnit chybějících 7 do `.each` na ř.34, nebo test generovat z importu `RECOMMENDED_IN_PROD`.

---

### PC-RUN-05 — [TL/PA] env.validation nevynucuje https:// na prod URL · 🟡 · 🆕 · L3

**Kde:** `env.validation.ts:65-70` — `PROD_URLS` (`FRONTEND_URL`, `BACKEND_BASE_URL`) se validují jen na `localhost|127.0.0.1` (varování). Prod URL přes plain **`http://`** (ne-localhost) projde tiše.

**Dopad:** nízký; README cíl M-PARITY L6 chtěl „všechna prod URL `https://`". Překrývá se s **PC-10** (config kruh / https vynucení), který byl 2026-06-14 ponechán jako volitelný CI follow-up. Cross-area (spíš oblast 07/08), zaznamenáno pro úplnost `TL`/`PA`.

**Návrh:** přidat do env.validation warn (nebo throw) na `^http://` u ne-localhost prod URL; nebo M-PARITY guard do CI (`VITE_API_URL===BACKEND_BASE_URL` + `https://`).

---

## Reconciliation (⚖️ — ne nález, ale registr je zastaralý)

Registr `prod-config-audit.md` ř.39 tvrdí: *„Druhá vrstva: `${VAR:?required}` v compose pro `FRONTEND_URL`/`BACKEND_BASE_URL`/`TURNSTILE_SECRET`."* — **na HEAD to tak NENÍ**: `docker-compose.prod.yml:95-96` (`FRONTEND_URL: ${FRONTEND_URL}`, `BACKEND_BASE_URL: ${BACKEND_BASE_URL}`) a :116 (`TURNSTILE_SECRET: ${TURNSTILE_SECRET}`) jsou **bez `:?`**. Není to regrese — jde o **vědomý posun filozofie** (`env.validation.ts` ř.6-11 + compose komentáře ř.92-94,114-115: po „deploy incidentu 2026-06-14" se tvrdě-fatální nechává JEN pro DB/JWT; zbytek = runtime fail-closed captcha + env.validation warn, aby netechnický deploy nespadl). Konzistentní a obhájené. **Doporučení:** aktualizovat registr, aby popis seděl s kódem (jinak čtenář hledá `:?` fixy, co neexistují).

---

## PROOF-REQUEST (L4/L5 — vyžadují live infra)

- **PR-02-01 (L5 boot-probe):** BE v docker s minimálním env → ověř empiricky: chybějící `JWT_SECRET` v prod → fail-fast při startu (`JwtModule.registerAsync` factory / env.validation), NE lazy; chybějící `TURNSTILE_SECRET`+`NODE_ENV=production` → registrace 400 CAPTCHA_FAILED; chybějící `TOTP_ENC_KEY` → boot OK + 2FA setup 503.
- **PR-02-02 (L4 deploy parita):** `npm run audit:config` (prod-config-scan M-ENV 4-zdroj) → JWT_EXPIRES_IN drift (PC-RUN-04) by měl vyskočit jako code-default ≠ deploy/compose.
- **PR-02-03 (L7-teeth mutace):** zmutuj `auth.module.ts:31` (`throw`→`?? 'dev'`) → `env.validation.spec.ts` + boot-probe musí zčervenat.

---

## Souhrn oblasti 02

| ID | Záv. | Klas. | Popis | L |
|---|---|---|---|---|
| PC-RUN-04 | 🟡 | 🆕 | JWT_EXPIRES_IN: kód 3d vs compose/.env.example/deploy 1d → prod efektivně 1d, komentář lže | L3 |
| PC-RUN-03 | 🟡 | ♻️ | env.validation.spec `.each` kryje 4/11 RECOMMENDED (chybí TOTP_ENC_KEY, VAPID_*, CLOUDINARY_URL, SMTP_*) | L3 |
| PC-RUN-05 | 🟡 | 🆕 | env.validation nevynucuje https:// na prod URL (jen localhost warn); překryv PC-10 | L3 |

**Nula 🔴/🟠 nových.** Obě původní 🔴 (PC-01 captcha, PC-02 mailer) i pozitivum PC-14 (JWT fail-fast) **drží bez regrese**. PC-RUN-01 (TOTP_ENC_KEY) z minulého běhu **vyřešeno**. Nejzávažnější nový = 🟡 PC-RUN-04 (TTL drift). Oblast 02 je v dobrém stavu.
