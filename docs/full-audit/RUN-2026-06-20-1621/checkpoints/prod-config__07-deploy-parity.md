# prod-config / 07-deploy-parity — checkpoint RUN-2026-06-20-1621

Auditor: hloubkový agent (READ-ONLY). Datum: 2026-06-20.

---

## Pokrytí

Prošly všechny povrchy oblasti 07:

| Artefakt | Přečten |
|---|---|
| BE `.github/workflows/deploy.yml` | ✅ |
| FE `.github/workflows/deploy.yml` | ✅ |
| BE `docker-compose.prod.yml` | ✅ |
| FE `docker-compose.yml` | ✅ |
| BE `backend/Dockerfile` | ✅ |
| FE `Dockerfile` | ✅ |
| FE `default.conf.template` | ✅ |
| BE `src/common/config/env.validation.ts` | ✅ |
| BE `src/common/config/origins.ts` | ✅ |
| BE `.env.example` | ✅ |
| FE `.env.example` | ✅ |
| `config.txt` (M-ENV scanner výstup) | ✅ |
| Produkční `prod-config-audit.md` (stav oprav) | ✅ |
| Git log post-audit (14.1 TOTP, 14.3 CSP) | ✅ |

**Celkem 4 zdroje pravdy cross-referovány:** kód × .env.example × deploy.yml × docker-compose.prod.

---

## Dosažená L vs cílová L

| Cíl dle plánu | Dosaženo | Poznámka |
|---|---|---|
| `DP`/`PA`/`ED` na **L4** (4 zdroje sjednoceny) | **L4** ✅ | statický drift vyčíslen, viz nálezy |
| `M-PARITY` 👑 na **L6** | **L4** | config kruh staticky ověřen; runtime end-to-end = PROOF-REQUEST |
| `TE` (teeth / mutace) na **L7** | **neprovedeno** | L7 = M-MUT (Stryker) → PROOF-REQUEST |

Dosažená úroveň: **L4** (statika + 4-zdroj diff). L5 (boot-probe) a L6 (živý cross-repo config kruh) vyžadují infru → PROOF-REQUEST.

---

## Nálezy

> Stav registru před tímto sweepem: PC-01..24 z 2026-06-14 (19 opraveno, 5 zbývá).
> Tento sweep přidává nové nálezy (🆕) nebo upřesňuje stav existujících (♻️).

---

### PC-RUN-01 — `DP` · TOTP_ENC_KEY chybí ve všech 3 deploy artefaktech po 14.1
**🟠 · 🆕**

- **Kde:**
  - Čteno v kódu: `backend/src/modules/auth/services/totp-crypto.service.ts:26`
  - Přidáno do `env.validation.ts` RECOMMENDED: commit `c54cef0` (14.1, 2026-06-18)
  - CHYBÍ: `backend/.github/workflows/deploy.yml` (žádný řádek `TOTP_ENC_KEY=...`)
  - CHYBÍ: `docker-compose.prod.yml` (žádný řádek v `environment:` bloku backend service)
  - CHYBÍ: `backend/.env.example` (vůbec nedokumentováno)
- **Scanner config.txt:** sekce (a) — čteno v kódu, nepředáno deploy+compose; sekce (d) — chybí v .env.example
- **Dopad:** `TOTP_ENC_KEY` je 2FA šifrovací klíč (AES-256-GCM). Bez něj je 2FA setup runtime fail-closed (`TotpCryptoService.requireKey()` hází `ServiceUnavailableException`). Admin nemá možnost nastavit klíč přes GitHub vars (pole v deploy.yml není), ani ví, že existuje (není v .env.example). Uživatel aktivuje 2FA → setup selže bez informativní chybové zprávy v dashboardu. Klíč ztracený při výpadku = **permanent loss uživatelských 2FA secretů v DB** (re-decrypt nefunguje).
- **Návrh:** (1) Přidat `TOTP_ENC_KEY=${{ secrets.TOTP_ENC_KEY }}` do BE deploy.yml `.env` bloku. (2) Přidat do `docker-compose.prod.yml` environment: `TOTP_ENC_KEY: ${TOTP_ENC_KEY}`. (3) Přidat do `backend/.env.example` s komentářem (32 B base64, `openssl rand -base64 32`). 
- **L3**

---

### PC-RUN-02 — `DP` · PC-15 opraveno jako warning-only, ne hard-fail (nesoulad audit↔kód)
**🟠 · ♻️ (re-otvírá PC-15)**

- **Kde:** `Dockerfile (FE):18-25`
- **Popis:** Audit `prod-config-audit.md` tvrdí: `"PC-15 — FE [Dockerfile] RUN test -n "$VITE_API_URL" → build selže místo tichého localhostu."` Aktuální kód:
  ```
  RUN if [ -z "$VITE_API_URL" ]; then \
        echo "# VAROVANI: VITE_API_URL je prazdny!"; \
        ...
      fi
  RUN npm run build   ← build pokračuje bez ohledu
  ```
  Chybí `exit 1` — build **neselže**, jen vypíše WARNING do build logu (který nikdo nevidí po deployi). Kombinace s 14.3 (CSP enforce): prázdný `VITE_API_URL` → prázdný `BACKEND_HOST` → CSP `connect-src 'self' data: https://res...` (backend chybí) → **API volání blokovaná CSP v produkci** (místo pouze nefunkčního FE).
- **Dopad:** Deploy "proběhne" bez chyby. FE v produkci: (a) volá `localhost:3000` (kód), (b) CSP (enforce od 14.3) blokuje requesty na backend. Výsledek: zcela nefunkční produkce, žádný build error.
- **Návrh:** Změnit varování na hard-fail: přidat `exit 1` uvnitř `if` bloku. Alternativně přidat krok `test -n "$VITE_API_URL" || exit 1` do FE `deploy.yml` před `Build images`.
- **L3**

---

### PC-RUN-03 — `DP` · FE deploy.yml nemá žádný pre-deploy validation krok
**🟡 · 🆕**

- **Kde:** `Projekt-ikaros-FE/.github/workflows/deploy.yml` (celý soubor)
- **Popis:** BE deploy.yml obsahuje krok `Validate deployment environment` (ověří JWT_SECRET/JWT_REFRESH_SECRET/MEILI_MASTER_KEY). FE deploy.yml nemá **žádný ekvivalent** — nověří ani `VITE_API_URL` (kritická pro funkčnost FE v prod), ani `VITE_TURNSTILE_SITE_KEY` (bez něj Turnstile nefunguje). Pokud admin zapomene nastavit GitHub var, deploy projde a FE je nefunkční.
- **Dopad:** Symetrie BE/FE validation je narušena. `VITE_API_URL` je analogicky kritická jako `JWT_SECRET` (bez ní FE nefunguje).
- **Návrh:** Přidat do FE deploy.yml validation krok po vytvoření `.env`:
  ```bash
  test -n "$VITE_API_URL" || { echo "VITE_API_URL is missing"; exit 1; }
  ```
- **L3**

---

### PC-RUN-04 — `ED` · EMBEDDING URL vars v compose bez deploy bypass — PC-21 half-open
**🟡 · ♻️ (upřesňuje PC-21)**

- **Kde:**
  - `docker-compose.prod.yml:121-124` — 4 vars `EMBEDDING_GRANITE*_ONNX_URL`/`TOKENIZER_URL` s `:-https://www.patrikzplzne.cz/...` defaulty
  - `backend/.github/workflows/deploy.yml` — **žádný řádek pro tyto URL vars**
  - `backend/.env.example:66-69` — URL dokumentovány (✅)
- **Popis:** Audit zaregistroval PC-21 a říká `"kód hotový"` (URL vars v compose a .env.example). Compose sice má `${EMBEDDING_GRANITE107_ONNX_URL:-https://www.patrikzplzne.cz/...}`, ale deploy.yml tyto vars **nepředává** do server .env (jen `EMBEDDING_GRANITE107_ENABLED`/`278_ENABLED`). Výsledek v produkci: override URL pomocí GitHub vars **nefunguje** — deploy `.env` tyto klíče neobsahuje → compose `:-default` = vždy `patrikzplzne.cz`. Cesta override = ruční zásah do `.env` na serveru nebo úprava compose.
- **Dopad:** PC-21 je dokumentovaný jako by-design OPS krok, ale mechanismus (GitHub var → deploy) **chybí**. Embedding search závisí na externí osobní doméně a není způsob to opravit přes standardní deploy pipeline bez kódu.
- **Návrh:** Buď (a) přidat 4 URL vars do BE deploy.yml .env bloku s `${{ vars.EMBEDDING_* }}`, nebo (b) přijmout jako vědomý OPS dluh s explicitní poznámkou v deploy.yml.
- **L4**

---

### PC-RUN-05 — `ED` · PRESENCE_THRESHOLD_HOURS — dva různé defaults (25 vs 24)
**🟡 · 🆕**

- **Kde:**
  - `backend/src/modules/presence/presence.service.ts:16` — `configService.get('PRESENCE_THRESHOLD_HOURS', 25)`
  - `backend/src/modules/admin/admin-stats.service.ts:42` — `configService.get('PRESENCE_THRESHOLD_HOURS', 24)`
  - Scanner config.txt sekce M-FALLBACK: `?? "25"` i `?? "24"` pro stejnou proměnnou
- **Popis:** Var není v deploy/compose/example (správně — má bezpečné defaults). Ale dva konzumenti téže var mají **rozdílné defaults** (25 h vs 24 h). Bez env override = presence a admin-stats používají jiná okna → admin vidí jiné počty "online" uživatelů než presence gate.
- **Dopad:** Nízký — pouze zobrazovací nekonzistence admin dashboardu. Žádný bezpečnostní dopad.
- **Návrh:** Sjednotit na 1 konstantu (`PRESENCE_THRESHOLD_HOURS_DEFAULT = 24`) sdílenou oběma službami, nebo přidat do `.env.example` s dokumentovanou hodnotou.
- **L3**

---

### PC-RUN-06 — `ED` · EMBEDDING_MODEL_CACHE_DIR — default relpath bez volume v compose
**🟡 · 🆕**

- **Kde:**
  - `backend/src/modules/search/embedding-search.service.ts:58` — default `"data/model_cache"` (relativní cesta)
  - `docker-compose.prod.yml` — volume `uploads-data:/app/uploads`, ale **žádné** `model_cache` volume
  - `backend/Dockerfile` — žádný `mkdir` pro `data/` ani volume mount
- **Popis:** Modely se kešují do `data/model_cache` (relative to `/app` v kontejneru = `/app/data/model_cache`). Compose nemá volume pro tuto cestu → **soubory jsou ephemeral**. Každý restart kontejneru → modely se stáhnou znovu z `patrikzplzne.cz` (nebo vlastního hostingu). Při pomalém stahování = pomalý restart; při nedostupnosti zdroje = search nefunguje.
- **Dopad:** Operační — prodloužený restart (desítky sekund–minuty), závislost na externím zdroji při každém startu. Žádný bezpečnostní dopad.
- **Návrh:** Přidat do compose volume `model-cache-data:/app/data/model_cache` (a do `volumes:` sekce). Pak modely přežijí restart.
- **L3**

---

### PC-RUN-07 — `DP` / `M-PARITY` · config kruh staticky ověřen — bez záznamu o runtime ověření
**⚖️ staticky OK — PROOF-REQUEST na L6**

- **Kde:** FE deploy → `VITE_API_URL` (vars); BE deploy → `BACKEND_BASE_URL` (vars); origins.ts; CORS
- **Popis:** Staticky (L4): `.env.example` komentář říká `"VITE_API_URL mělo by být totožné s BE BACKEND_BASE_URL"`. Oba deploye čtou z oddělených GitHub vars (nelze garantovat shodu automaticky — záleží na správném nastavení). `origins.ts` správně izoluje dev origins. Env.validation varuje na localhost v PROD_URLS. **Config kruh je konzistentní na úrovni kódu** (žádný hardcoded drift). Chybí však živá `M-PARITY` CI pojistka (PC-10 z původního auditu označen jako `parciálně kryto`, plný guard = volitelný follow-up).
- **Dopad:** Bez automatické kontroly shody `VITE_API_URL === BACKEND_BASE_URL` může admin nastavit nekonzistentní hodnoty → CORS selže nebo obrázky míří jinam.
- **Návrh:** Viz PC-10 doporučení — M-PARITY CI guard porovnávající obě hodnoty.
- **L4 staticky; L6 = PROOF-REQUEST (živý kruh po deployi)**

---

## PROOF-REQUEST

| PR# | Co | Proč blokováno |
|---|---|---|
| PR-1 | **L5 boot-probe** — nabootovat BE s prázdným env a empiricky ověřit fail-fast chování | Vyžaduje Docker/server infru; READ-ONLY sweep |
| PR-2 | **L6 M-PARITY** — ověřit živý FE↔BE config kruh v produkci (CORS, VITE_API_URL→BACKEND_BASE_URL shoda, vše https://) | Vyžaduje přístup ke GitHub vars produkce nebo live deploy |
| PR-3 | **L7 TE** — mutation testing env.validation.ts (`?? throw` → `?? 'dev'`, odebrat REQUIRED check) → testy musí zčervenat | Vyžaduje Stryker run (živý nástroj) |

---

## Souhrn stavu původních nálezů (verifikace oprav)

Stav z auditu 2026-06-14 ověřen proti HEAD (2026-06-20):

| PC | Původní stav | Ověřeno HEAD | Závěr |
|---|---|---|---|
| PC-04/13 | ✅ opraveno (origins.ts) | origins.ts v HEAD = správně izoluje dev | ✅ DRŽÍ |
| PC-01 | ✅ opraveno (fail-closed) | captcha.service.ts:34 — ověřit ručně (mimo sweep) | ✅ drží dle kódu |
| PC-02 | ✅ opraveno | smtp-mailer.provider.ts:43 → `localhost:5173` fallback | ✅ DRŽÍ |
| PC-15 | ✅ označeno opraveno | **Dockerfile:18-25 = WARNING-ONLY, ne exit 1** | 🔓 REGRESE — hard-fail nebyl implementován |
| PC-22 | ✅ opraveno (Swagger gate) | ověřeno v deploy (mimo sweep) | ✅ drží dle logiky |
| PC-23 | ✅ opraveno (DELETION_HOLD 30) | compose:116 `${DELETION_HOLD_DAYS:-30}` | ✅ DRŽÍ |
| PC-24 | ✅ částečně (env.validation) | TOTP_ENC_KEY přidán do RECOMMENDED ale NE do deploy/compose | **PC-RUN-01 🆕** |
| PC-21 | ✅ označeno opraveno (OPS) | URL vars v compose ale NE v deploy | **PC-RUN-04 upřesňuje** |

---

*Checkpoint vytvořen 2026-06-20. READ-ONLY, opravy gated souhlasem.*
