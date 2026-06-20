# prod-config / 06-fe-bundle — checkpoint RUN-2026-06-20-1621

> Auditor: read-only sweep. HEAD k 2026-06-20. Záběr: BL (bundle leak) + DP (deploy parity) — FE side.

---

## Pokrytí

| Soubor / oblast | Stav |
|---|---|
| `vite.config.ts` | ✅ přečteno |
| `Dockerfile` | ✅ přečteno |
| `docker-compose.yml` (FE) | ✅ přečteno |
| `.github/workflows/deploy.yml` (FE) | ✅ přečteno |
| `.github/workflows/ci.yml` (FE) | ✅ přečteno |
| `src/shared/api/client.ts` | ✅ přečteno |
| `src/features/chat/api/socket.ts` | ✅ přečteno |
| `src/app/main.tsx` (VITE_ ref) | ✅ přečteno |
| `src/features/auth/components/RegisterModal.tsx` (Turnstile) | ✅ přečteno |
| `.env.example` (FE) | ✅ přečteno |
| `default.conf.template` (nginx CSP) | ✅ přečteno |
| `scripts/check-csp-hash.mjs` | ✅ přečteno |
| `scripts/prod-config-scan.mjs` (scanner) | ✅ přečteno (hlavička) |
| `package.json` (`build` + `audit:*` skripty) | ✅ přečteno |
| `config.txt` (scanner výstup z RUN) | ✅ přečteno |
| `prod-config-audit.md` (registr PC-xx) | ✅ přečteno — stav oprav znám |
| BE `env.validation.ts` | ✅ přečteno (cross-ref: TOTP_ENC_KEY) |
| BE `totp-crypto.service.ts` | ✅ přečteno (cross-ref: TOTP fail-closed) |
| BE `deploy.yml` (TOTP_ENC_KEY chybí) | ✅ přečteno |

---

## Dosažená L vs cílová L

| Osa | Cíl | Dosaženo | Poznámka |
|---|---|---|---|
| `BL` bundle leak | L3 | **L3** | VITE_ vars přečteny, sourcemap default ověřen, esbuild.drop ověřen |
| `DP` deploy parity (FE strana) | L4 | **L3** | deploy.yml přečten; bez živé prod infry nelze ověřit reálné hodnoty v GitHub vars |

---

## Nálezy

### ✅ Opravené (potvrzeno v kódu, ne jen v registru)

**PC-09 opraveno** — `vite.config.ts:18` má `esbuild: mode === 'production' ? { drop: ['console', 'debugger'] } : {}`. V prod buildu se `console.*` a `debugger` odstraní. Sourcemap není nastaven (`build.sourcemap` není v configu) = Vite default `false` v prod. ♻️ L3

**PC-15 zmírněno** — `Dockerfile:18-25` vrátí varovací banner místo `RUN test -n` (původní plán 🔴 fail). Tichý localhost je **stále možný** — build neselže, jen vypíše WARNING. Viz PC-RUN-01 níže.

**Turnstile test-key fail-closed** — `RegisterModal.tsx:55-57`:
```
VITE_TURNSTILE_SITE_KEY ?? (import.meta.env.PROD ? null : TURNSTILE_TEST_SITE_KEY)
```
V prod bez env → `null`, widget se nerenderuje + `console.error`. Registrace je blokovaná (uživatel neuvidí captchu = nemůže odeslat formulář). Správné chování. ✅ L3

**CSP hash guard** — `scripts/check-csp-hash.mjs` existuje, běží jako **součást `npm run build`** (`package.json:8`). Build selže při nesouladu sha256 inline skriptu s hodnotou v `default.conf.template`. CRLF→LF normalizace ošetřena. ✅ L3

**VITE_ vars — žádný secret** — `grep import.meta.env.VITE_` vrátil jen `VITE_API_URL` (URL) a `VITE_TURNSTILE_SITE_KEY` (veřejný Cloudflare site-key). Žádný secret/klíč v bundlu. ✅ L3

---

### 🆕 Nové nálezy

**PC-RUN-01** 🟡 `DP`/`BL` — **Dockerfile varování místo fail**: `Dockerfile:18-25` implementuje prázdné `VITE_API_URL` jako **WARNING banner**, ne `exit 1`. Plán oblasti (06-fe-bundle.md, krok 4) + původní PC-15 návrh říkaly `RUN test -n "$VITE_API_URL"` → build selže. Aktuální kód build **projde** a zapeče `localhost:3000` fallback. Dopad: deploy bez `VITE_API_URL` var v GitHub tiše vytvoří nepoužitelný FE kontejner (docker compose up projde, ps zelené, FE ale volá localhost). Registr PC-15 byl označen ✅, ale kód implementoval pouze slabší variantu.
- **Kde:** `Dockerfile:18-25`
- **Dopad:** tichý prod build s localhost fallbackem; CI/CD neselže; odhalí se až uživatelsky (FE nedosáhne BE)
- **Návrh:** zvážit `exit 1` po banneru (nebo aspoň `exit 1` ve verify stepu deploy.yml pokud VITE_API_URL chybí v vars)
- **L2** (statické čtení) 🆕

**PC-RUN-02** 🟡 `BL`/`DP` — **CSP `connect-src` postrádá explicitní `wss://`**: `default.conf.template:59` má `connect-src 'self' data: ${BACKEND_HOST} ...`. `${BACKEND_HOST}` je holý host BEZ schématu (dle komentáře: „kryje https i wss naráz"). Skutečné pokrytí závisí na tom, zda prohlížeče bez schématu akceptují wss:// i https:// — dle CSP Level 3 spec **schemeless host** matchuje oba (http+ws / https+wss). Jde o záměrný design (komentáře v deploy.yml a default.conf.template), ale bez schématu `wss://` nebo `https://` prefix není explicitní → potenciální CSP report v striktních prohlížečích nebo starším Safari. Dokumentováno jako design choice, ne chyba.
- **Kde:** `default.conf.template:59`, `deploy.yml:56`
- **Dopad:** nízký — spec říká schemeless match = wss+ ✅, ale implicit; Safari Mobile ≤ 15 může odmítnout
- **Návrh:** zvážit přidat `wss://${BACKEND_HOST}` vedle `${BACKEND_HOST}` v connect-src (explicitní > implicit)
- **L2** 🆕

**PC-RUN-03** 🟡 `DP` — **TOTP_ENC_KEY chybí v BE deploy.yml a .env.example**: scanner `config.txt` řádek 17 hlásí `TOTP_ENC_KEY` jako `čteno-ale-nepředáno`. Ověřeno: BE `deploy.yml` (řádky 54–77) neobsahuje `TOTP_ENC_KEY`. BE `.env.example` ho neobsahuje. Kód (env.validation.ts:39) ho má v `RECOMMENDED_IN_PROD` → jen varuje, neblokuje boot. `totp-crypto.service.ts:27-31` je fail-closed (warn + null key → `ServiceUnavailableException` při pokusu o 2FA). Dopad: v prod deploy bez TOTP_ENC_KEY = **2FA globálně nefunkční** (setup i ověření vyhazují 503), ale BE se nastartuje. Feature `project_2fa_architecture` je označena HOTOVO (paměť) — v prod ale bez klíče 2FA nebude fungovat.
- **Kde:** `c:/Matrix/ProjektIkaros/Projekt-ikaros/.github/workflows/deploy.yml:54-77` (chybí), `backend/src/common/config/env.validation.ts:39` (RECOMMENDED), `backend/src/modules/auth/services/totp-crypto.service.ts:26`
- **Dopad:** 2FA nefunkční v prod (setup/verify = 503); uživatelé s 2FA zapnutým se nepřihlásí
- **Návrh:** přidat `TOTP_ENC_KEY=${{ secrets.TOTP_ENC_KEY }}` do BE deploy.yml + do BE `.env.example` s instrukcí (generate: `openssl rand -base64 32`)
- **L3** (kontext dosažitelnosti: deploy bez klíče = 2FA fail) 🆕

---

### ♻️ Potvrzené (z dřívějšího registru, ověřeno kódem HEAD)

| PC | Stav v registru | Ověřeno kódem HEAD |
|---|---|---|
| PC-09 console.log | ✅ opraveno | ✅ `vite.config.ts:18` esbuild.drop v prod |
| PC-15 Dockerfile ARG | ✅ opraveno | ⚠️ implementováno jako WARNING, ne fail — viz PC-RUN-01 |
| PC-16 .env.example | ✅ opraveno | ✅ FE `.env.example` má VITE_API_URL + VITE_TURNSTILE_SITE_KEY |
| K-PC9 sourcemaps | vyvráceno | ✅ Vite prod default `false`, žádné `build.sourcemap` v configu |

---

## PROOF-REQUEST

**PR-06-01** — Produkční nginx `Content-Security-Policy` hlavička v reálném prohlížeči: ověřit, že `BACKEND_HOST` se správně expanduje (`https://` + `wss://` nebo holý host) a že Safari Mobile nezahlásí CSP violation pro Socket.IO WebSocket. Vyžaduje živé nasazení (docker nginx s .env).

**PR-06-02** — Verify step v FE deploy.yml neověřuje obsah VITE_API_URL v .env ani v docker build args — ověřit, že GitHub vars `VITE_API_URL` je skutečně nastavena v GitHub environment `production` (OPS check, nedostupné z kódu).

**PR-06-03** — TOTP_ENC_KEY v prod: ověřit, že na serveru existuje v `.env` (nebo bude přidáno do BE deploy.yml). Bez tohoto klíče je 2FA (feature 14.1, HOTOVO) v produkci nefunkční.
