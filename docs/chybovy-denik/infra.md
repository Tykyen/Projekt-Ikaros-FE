# Chybový deník — oblast: infra / docker / build

Záznamy k provozu, kontejnerizaci, build pipeline. Index v [README.md](README.md).

---

## ✅ ŘEŠENÍ — docker build za corporate MITM proxy (apk + npm TLS) — 2026-06-22

**Kontext:** 15B.1 prerender — nový `prerender/Dockerfile` (`node:20-alpine` + `apk add chromium …`).

**Příznak:** `docker build` selhal na `apk add` s `(no such package)` pro **všechny** balíky včetně základních (nss, freetype) → ne chybějící chromium, ale apk vůbec nenačetl index. Diagnostika `docker run node:20-alpine apk update` ukázala kořen: `WARNING: … TLS: server certificate not trusted` → index se nestáhl → `2 unavailable` → žádné balíky.

**Kořen:** stroj má TLS inspekci s vlastní (corporate) CA. Alpine v kontejneru jí nedůvěřuje → HTTPS stahování apk/npm v dockeru padá. **Stejný kořen jako [project_npm_ssl_system_ca]** (FE `npm install` na hostu), jen teď uvnitř kontejneru (apk + npm).

**Co zabralo:** opt-in build-arg `INSECURE_TLS=1` v Dockerfile:
- `sed 's|https://|http://|g' /etc/apk/repositories` → apk přes HTTP (alpine balíky jsou kryptograficky **podepsané**, apk ověří podpis bez ohledu na transport → MITM nepodstrčí cizí balík).
- `npm config set strict-ssl false` (jen pod tímto argem).
Produkční build (`deploy.yml`, čistý server bez MITM) arg **nedává** → zůstává HTTPS.

**Jak ověřeno:** `docker build --build-arg INSECURE_TLS=1` prošel; smoke test (render + cache + fallback) OK.

**Zhodnocení — dobře:** degradace TLS izolovaná na lokální build (přepínač default vypnutý), prod zůstává čistý HTTPS; HTTP apk je u alpine bezpečné díky podpisům. **Poučení:** za MITM proxí padají v dockeru jak apk, tak npm po HTTPS — diagnostikuj `apk update` (TLS warning), ne obsah balíčku; fix drž jako opt-in, ať neoslabíš prod.

---

## ✅ ŘEŠENÍ — FE deploy padal na `npm ci` ERESOLVE (eslint@10 × jsx-a11y peer) — chyběl `.npmrc` v repu — 2026-07-05

**Kontext:** FE `Deploy to Server` workflow → `docker compose build` → Dockerfile `RUN npm ci` selhal. Navazuje na dnešní [CH-056] a řešení 17.8, kde eslint zvednutý na 10, ale `eslint-plugin-jsx-a11y@6.10.2` deklaruje peer jen `eslint ≤9`.

**Příznak:** `#16 [frontend build 4/7] RUN npm ci` → `npm error ERESOLVE could not resolve … Found: eslint@10.3.0 … peer eslint@"^3 || … || ^9" from eslint-plugin-jsx-a11y@6.10.2` → `process "/bin/sh -c npm ci" did not complete successfully: exit code 1`. Lokální `npm run build` prošel (existující `node_modules`), takže drift se projevil až v čistém dockeru.

**Kořen:** `legacy-peer-deps` byl použit jen lokálně/ad-hoc při 17.8, ale **nebyl zafixovaný v repu** → čistý `npm ci` v Dockeru o toleranci nevěděl a padl na striktním peer-checku. Chyba NENÍ z přejmenování typu stránky (Rodokmen→Zoom); je to pre-existující dependency drift.

**Co zabralo:** commitnutý `.npmrc` s `legacy-peer-deps=true` (root repo) + Dockerfile `COPY package*.json .npmrc ./` (glob `package*.json` `.npmrc` NEbere) před `npm ci`. jsx-a11y s flat configem/novým eslintem funguje, jen má zastaralý peer range.

**Proč to je správně (a ne přegenerovat lock):** `npm ci` instaluje PŘESNĚ podle `package-lock.json`, **nepřeřešuje** strom → legacy-peer-deps tu jen tlumí peer varování, nemění balíky. To se liší od `npm install --legacy-peer-deps` z [CH-056], které lock přeřeší a umí vypustit tranzitivní `@testing-library/dom` (rozbité testy). Ověřeno: lock ten balík stále má (grep 5×).

**Jak ověřeno:** `npm ci --dry-run` (s `.npmrc`) → `up to date in 2s`, exit 0 (ERESOLVE zmizel, lock konzistentní); `@testing-library/dom` v locku 5×. Reálný docker build proběhne až po pushnutí + redeployi.

**Zhodnocení — dobře, ale workaround:** odblokuje deploy s nulovým dopadem na verze/testy. **Poučení:** (1) `legacy-peer-deps` použitý lokálně MUSÍ do repa (`.npmrc`), jinak čistý `npm ci` v CI/dockeru padne; (2) `.npmrc` v Dockerfile explicitně kopírovat — glob `package*.json` ho nezahrne; (3) čistý stav dřív než čerstvý `npm ci`, ne lokální `npm run build` na starých `node_modules`. Dlouhodobě: upgrade jsx-a11y na eslint-10-kompatibilní verzi → zrušit workaround.

---

## CH-067 — seed-bestiae workflow: `ssh host bash -c '<víceřádkový>'` se rozpadl + `node /tmp/import.js` nenašel `mongoose` — 2026-07-09

**Kontext:** migrační workflow `seed-bestiae.yml` (import 547 komunitních bestií do PROD Mongo přes SSH → `docker exec projekt-ikaros-be node import.js`). První reálné spuštění (`workflow_dispatch`) selhalo za 20 s.

**Příznak (dvě chyby najednou v jednom logu):**
1. `bash: -c: option requires an argument`
2. `Error: Cannot find module 'mongoose'` … `requireStack: [ '/tmp/import.js' ]` → exit 1.

**Kořen — 2 nezávislé chyby:**
1. **SSH quoting:** `ssh host bash -c '<multiline>'` nefunguje — ssh **NEzachová uvozovky**, spojí argv mezerami a pošle vzdálenému shellu. Nový řádek = oddělovač příkazů → vzdálený shell dostal `bash -c` bez argumentu (další token byl newline) → error; zbytek řádků paradoxně proběhl přímo v login shellu, takže se to „napůl provedlo".
2. **Node module resolution:** `require('mongoose')` se resolvuje **od místa souboru** (`/tmp/import.js`), ne od cwd → hledá `/tmp/node_modules` → nic. BE app běží v `/app`, deps jsou v `/app/node_modules` (Dockerfile `WORKDIR /app`).

**Co zabralo:** (a) zrušit `bash -c`, celý remote příkaz **na jednom řádku**, kroky řetězit přes `&&`; (b) `docker cp import.js` do **`/app`** (ne `/tmp`) a spustit `docker exec -w /app … node import.js` → require najde `/app/node_modules/mongoose`. NDJSON zůstává v `/tmp/bestie.ndjson` (import.js ho čte absolutní cestou).

**Jak ověřeno:** zatím jen staticky (rozbor logu + Dockerfile `WORKDIR /app` + `COPY --from=build /app/node_modules ./node_modules`). Reálné ověření = re-run workflow po pushnutí.

**Zhodnocení — dobře:** obě chyby mají jasný kořen a fix je minimální. **Poučení:** (1) přes ssh posílej remote příkaz jako **jeden řetězec** (`&&`), nikdy `bash -c '<víceřádkový>'` — uvozovky se ztratí; (2) `node <soubor>` v cizím adresáři nenajde moduly — buď soubor vedle `node_modules`, nebo `NODE_PATH`; cwd (`-w`) na resolusi `require` **nemá vliv**, jen na relativní cestu k souboru. **Příznak cyklení:** „skript proběhl, ale spadl na chybějícím modulu / `-c requires argument`" u ssh+docker exec.

## ✅ ŘEŠENÍ — monitoring 3. noha: health readiness, Discord alerty, Sentry, heartbeat — 2026-07-11

**Kontext.** Vedle plny-audit + pentest (předletové brány) chyběla třetí noha — hlídač BĚŽÍCÍHO provozu. Postaveno na žádost uživatele (single server, docker-compose.prod, Discord komunita), cost-conscious nástroje.

**Co zabralo — postavené vrstvy (BE, na main).**
- `/health` z konfig-presence → **readiness probe**: aktivně Redis (ping+timeout), Meili (HTTP /health+timeout), Mongo (readyState), + disk (statfs, fail-open), SMTP/RSS info. Sdílené `health-checks.ts` (DRY: /health i cron). PC-08 strip v prod (veřejný endpoint neleakuje).
- `AlertService` (Discord webhook, rate-limited 10min/klíč, no-op bez `DISCORD_ALERT_WEBHOOK`) + `BruteForceMonitor` (login-fail spike centrálně v exception filtru — bez zásahu do AuthService).
- Triggery: **5xx** (exception filter) + **health-cron** (á min, dep down/up + disk<15% + RSS práh) + **brute-force** + **denní heartbeat** (dead-man switch ze strany appky).
- **Error tracking** `@sentry/node`/`@sentry/react` (BE+FE) guardované DSN → GlitchTip; FE navíc globální `unhandledrejection`/`error` handlery (chyby, co dnes mizí). Env vše zadrátováno do deploy.yml+compose.
- Bonus: **komunitní oznámení** (nový svět/postava → `DISCORD_EVENTS_WEBHOOK`).

**Proč to byl správný směr.** Monitoring = vždy-běžící systém, ne skill co „proběhne". Alerty do Discordu = víš dřív než hráči. Vše no-op bez env (bezpečné nasazení po dávkách). Webhooky živě otestované (HTTP 204).

**Pasti, které jsem cestou vyřešil.**
- **emitAsync blokace:** `character.created` je `emitAsync` (čeká na listenery) → kdyby můj @OnEvent listener awaitoval Discord (až 5 s), zdržel by 201 tvorby postavy. Fix = SYNCHRONNÍ void handler + `void this.notify*()` (fire-and-forget). **Lekce: @OnEvent na emitAsync eventu nesmí awaitovat pomalou I/O.**
- **health-ping nesmí sám viset:** každý check má timeout (Redis ping race, Meili AbortSignal), jinak by mrtvá závislost pověsila /health.
- **spyOn ts-jest:** `jest.spyOn(import * as checks, 'checkDisk')` funguje i na destrukturovaný import (TS kompiluje named import na namespace přístup).
- **Sentry bezpečně:** `Sentry.init` jen když je DSN (žádné hooky bez DSN); `captureException` bez init = no-op.

**Jak ověřeno.** tsc 0, eslint 0, ~35 nových unit testů + error-contract e2e 12/12 + npm audit prod (high) OK. **Poctivá mezera:** vnitřní monitoring neumí ohlásit vlastní smrt (totální výpadek serveru) → nutný EXTERNÍ UptimeRobot (dead-man switch z druhé strany) — akce uživatele. **Zhodnocení dobře:** dávka po dávce, každá ověřená+pushnutá; no-op bez env = nulové riziko nasazení. **Špatně:** full-app e2e boot timeoutuje (heavy) → health ověřen unit s mock deps místo e2e.

## ✅ ŘEŠENÍ — RSS alert cinkal každých 30 min: fixní práh POD baseline (ONNX ~2,46 GB), ne leak → trend-based monitor — 2026-07-12

**Symptom.** Discord „⚠️ Vysoká paměť (RSS) 2460–2483 MB > práh 1536 MB — možný memory leak" à ~30 min celou noc. Uživatel: „musíme s tím něco udělat, je to každou hodinu."

**Diagnóza (kořen).** NENÍ leak. Za 4 h RSS 2460→2483 MB (+23 MB) a od 3:19 stagnuje = **vysoká plochá baseline**, ne růst k OOM. Baseline = dva ONNX embedding modely granite (107M+278M) načtené IN-PROCESS (~2–2,5 GB, `embedding-search.service.ts:83`). Práh `RSS_ALERT_MB=1536` je nastavený POD baseline → `rss > 1536` je pravda pořád → cron (á 1 min, cooldown 30 min) alertuje každých 30 min. **Absolutní práh je špatný signál pro leak** — vysoká baseline je legitimní.

**Fix (2 páky).** (1) **Trvalá úspora:** `EMBEDDING_ENABLED=0` v prod `.env` + restart → RSS −2 GB (~500 MB); keyword hledání (MeiliSearch, primární) jede dál, mizí jen sémantická nadstavba. **Akce uživatele** (prod). (2) **Správný monitor (kód):** `health-monitor.service.ts` z „alert když RSS > fixní práh" → **trend-based**: (a) warn „Rostoucí paměť (RSS trend)" jen když RSS trvale nad MINIMEM okna (default +384 MB a ≥20 % za ~30 min) → chytí reálný leak nezávisle na baseline, plochá baseline (i vysoká) mlčí; (b) critical „Kritická paměť (RSS)" při `RSS > RSS_HARD_MB` (default 3500) = blízkost OOM. Nové env volitelné (`RSS_WINDOW`/`RSS_LEAK_GROWTH_MB`/`RSS_HARD_MB`), `RSS_ALERT_MB` deprecated.

**Proč správně.** Baseline (ONNX) je legitimní stav, ne chyba — monitor má hlásit ZMĚNU (růst = leak) nebo REÁLNÉ nebezpečí (blízko OOM), ne absolutní číslo, které závisí na tom, co je zrovna v paměti. Minimum okna (ne nejstarší vzorek) = odolné proti krátkému spiku (export/PDF) na kraji okna. Reset historie při restartu = správně (nový proces nedědí staré vzorky).

**Jak ověřeno.** nest build ✅ · tsc ✅ · eslint ✅ · spec 9/9 (3 nové: plochá 2460 MB → ticho · růst 500→1000 → trend warn · 3600 → critical). Commit 9e854fc.

**Zhodnocení.** Dobře: rozlišení „vysoká baseline vs. rostoucí" je jádro — bez něj monitor buď spamuje (práh nízko) nebo prospí leak (práh vysoko). Špatně/pozor: trend okno 30 vzorků = leak se ohlásí až po ~30 min růstu (přijatelné); velmi pomalý leak pod +384 MB/30 min nechytne (kompromis proti false-pozitivům). Poučení: než „memory leak" → změř TREND, ne absolutní RSS; vysoká baseline ≠ leak.
