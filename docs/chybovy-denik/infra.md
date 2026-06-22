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
