# tools/prod-config-scan — spec nástrojů (M-ENV / M-FALLBACK / M-SECRET / M-BOOT / M-PARITY)

> Spustitelná vrstva auditu. Cíl: nálezy **strojově prokázané**, ne vyčtené; M-ENV + M-FALLBACK kandidáti
> na **CI guard** (vzor [`scripts/route-audit.mjs`](../../../scripts/route-audit.mjs), `npm run audit:routes`).
> Stav: ⬜ nepostaveno (1. krok sweepu). Tento soubor je **spec**, ne implementace.

---

## M-ENV — trojzdrojový (4-zdrojový) diff

**Cíl:** sjednotit 4 zdroje pravdy a vypsat drift (oblast 01 `ED`).

**Vstup:**
1. **Kód** — grep přes oba repo:
   - BE: `process\.env\.([A-Z_]+)` + `configService\.get(?:<[^>]+>)?\(['"]([A-Z_]+)['"]\)`
   - FE: `import\.meta\.env\.(VITE_[A-Z_]+)`
2. **`.env.example`** (BE + FE) — klíče `^([A-Z_]+)=`.
3. **`deploy.yml`** (BE + FE) — `\$\{\{ (?:vars|secrets)\.([A-Z_]+) \}\}`.
4. **`docker-compose.prod.yml`** — env klíče + `\$\{([A-Z_]+)`.

**Výstup (3 seznamy):**
- **(a) čteno, ale nepředáno** (kód ∖ (deploy ∪ compose)) → prod použije fallback. Severity dle kritičnosti z master matice.
- **(b) předáno, ale nečteno** ((deploy ∪ compose) ∖ kód) → mrtvá / přejmenovaná proměnná.
- **(c) v example, ale nečteno** (example ∖ kód) → zavádějící dokumentace.

**Filtr:** vyřadit test-only (`JEST_WORKER_ID`, `PARITY_REGENERATE`, `NODE_ENV`).

---

## M-FALLBACK — katalog dev defaultů

**Cíl:** seznam všech `?? '…'` / `|| '…'` / prázdných defaultů + verdikt dosažitelnosti v prod (oblast 00 §D, osa `FK`).

**Vstup:** grep přes oba repo:
- `\?\?\s*['"]([^'"]+)['"]` (nullish fallback se string literálem)
- `\|\|\s*['"]([^'"]+)['"]`
- `\.get\([^)]+\)\s*\?\?\s*['"]` (ConfigService fallback)

**Výstup:** tabulka `fallback | soubor:ř | kryto compose/deploy? | verdikt`. Sloupec „kryto?" = cross-check proti compose override (např. `MEILI_HOST` kryje → ⚖️, `BACKEND_BASE_URL` nekryje → 🐛).

**Heuristika rizika:** literál obsahuje `localhost` / `127.0.0.1` / `http://` / prázdný `''` → flag.

---

## M-SECRET — secret sken (strom + historie)

**Cíl:** hardcoded secrety / placeholdery / nízká entropie (oblast 02 `SS`).

**Vstup:**
- **Strom** — gitleaks (pokud v repu) nebo regex: `(SECRET|PASSWORD|API_KEY|TOKEN)\s*[=:]\s*['"][^'"]{8,}` mimo `.env.example`.
- **Historie** — `git log -p --all` přes oba repo → stejný regex. Cross-ref [paměť `project_git_history_cleanup`] (filter-repo proběhl — ověřit úplnost).
- **Vars vs secrets** — parse `deploy.yml`: secret-tvar proměnná (JWT/PASS/URL s creds/PRIVATE_KEY) musí být `secrets.`, ne `vars.`.

**Výstup:** seznam podezřelých výskytů + lokace. ⚠️ Do registru jen **lokace + název**, nikdy hodnota.

---

## M-BOOT — boot-probe

**Cíl:** empiricky ověřit fail-fast vs tichý fallback (oblast 01/02, osa `BP`, L5).

**Mechanika:** BE `createTestApp` (jest e2e vzor) s **prázdným / minimálním** `.env` (dummy hodnoty):
1. Prázdný env → očekávej **throw** na `JWT_SECRET`/`JWT_REFRESH_SECRET` (fail-fast ✅).
2. Minimální (jen JWT) → zaznamenej, co tiše fallbackne (FRONTEND_URL→localhost, BACKEND_BASE_URL→localhost, MEILI_API_KEY→'', captcha→bypass).
3. Tabulka „padlo fail-fast | tiše fallbacklo | hodnota fallbacku".

**Pozn.:** spouštět s dummy secrety (ne produkčními); cíl je chování, ne funkční app. Cross-ref [paměť `project_seed_scenario_audit`] (harness `createTestApp` + MongoMemoryReplSet bloker — sdílet infra).

---

## M-PARITY — FE↔BE config kruh 👑

**Cíl:** ověřit konzistenci config kruhu napříč repo (oblast 07 `PA`, L6).

**Kontroly:**
1. FE `VITE_API_URL` (deploy var / Dockerfile ARG) → ukazuje na BE base.
2. BE `FRONTEND_URL` == CORS origin (main.ts) == mailer `appUrl` == WS origin (adapter + base.gateway).
3. `BACKEND_BASE_URL` == veřejná BE URL.
4. **Všechna prod URL `https://`** (žádné `http://`, žádné `localhost`, žádné `newmatrix.patrikzplzne.cz`).

**Výstup:** kruh ✅ konzistentní / ❌ mismatch (kde). Čte **oba** `deploy.yml`.

---

## M-MUT — teeth (volitelně, Maximum+)

**Cíl:** dokázat, že audit/testy mají zuby (osa `TE`, L7).

**Mutace:** `JWT_SECRET ?? throw` → `?? 'dev'`; odeber `:?required` z compose; změň CORS origin na `'*'`. Boot-probe / config testy **musí** zčervenat. Pokud projdou → pokrytí je divadlo. Nástroj: Stryker (BE už má devDep z [nav-audit] Maximum+).

---

## Pořadí stavby

1. **M-ENV** + **M-FALLBACK** (nejvyšší hodnota, statické, CI guard kandidát).
2. **M-SECRET** (strom rychlý, historie pomalejší).
3. **M-BOOT** (potřebuje createTestApp infra — sdílet se seed-scenario).
4. **M-PARITY** (čte oba repo, L6).
5. **M-MUT** (až je co mutovat — po opravách).
