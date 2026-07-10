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
