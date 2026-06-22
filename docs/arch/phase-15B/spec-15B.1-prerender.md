# Spec 15B.1 — Prerender veřejných stránek (SEO pro crawlery)

**Stav:** ✅ IMPLEMENTOVÁNO 2026-06-22 (kód hotový, lokálně ověřeno; **čeká deploy** + ops ověření RAM serveru) · **Fáze:** 15B (H2 Objevitelnost / SEO) · **Roadmap:** [15B.1](../../roadmap2.md) [H2-01] · **Navazuje:** 15.7 (anon homepage), veřejný shell světa `/svet/:slug` (D-063) · **Připravuje:** 15B.2 (meta/title/sitemap), 15B.6 (OG sdílení) · **Souvis.:** [auth-leak-policy], prod nginx 14.3

**Cíl:** Crawlery (Googlebot, **Seznambot**, sociální scrapery) dostanou na veřejných routách **plné HTML s vyrenderovaným obsahem** místo prázdného SPA shellu. Lidé dál dostávají interaktivní SPA beze změny. Bez velkého zásahu do architektury.

---

## 0. Rozhodnutí z brainstormingu (2026-06-22)

| # | rozhodnutí | volba | proč |
|---|---|---|---|
| R1 | **Prerender vs SSR** | **runtime prerender**, ne SSR | SSR = přepsat fungující SPA (PIXI/WS/jotai/client-only) → obří riziko. Prerender je oddělená vrstva, SPA nechá netknutou. |
| R2 | **Provoz** | **self-hosted headless Chrome sidecar**, ne placený Prerender.io | žádná 3rd-party závislost/náklad; tým umí Chrome headless (PDF/export pipeline); sedí na existující nginx + docker-compose. |
| R3 | **Trigger** | **nginx přepíná dle `User-Agent`** — bot → prerender, člověk → SPA | známý vzor (prerender.io nginx recipe); zero dopad na lidský provoz. |
| R4 | **Scope 15B.1** | **jen pipeline** (bot vidí plný DOM); per-page `<title>`/description/OG až **15B.2** | drží kroky oddělené (žádný odložený půlfix); plný DOM = už velká SEO výhra (Google i Seznam indexují obsah). |
| R5 | **Build-time vs runtime** | **runtime** (ne react-snap/SSG) | runtime pokryje i **dynamické** routy (světy, články, galerie) bez rebuildu při každém novém obsahu. |

**Trade-off vědomě přijatý (R1+R4):** runtime prerender = ops závazek (běžící Chrome kontejner, RAM, cache) výměnou za nulový zásah do SPA a pokrytí dynamického obsahu. Bez per-page meta (R4) crawler v 15B.1 vidí obsah, ale titulek/description jsou zatím globální — doplní 15B.2.

---

## 1. Architektura

```
                    ┌─────────────────────────────────────────┐
   request ───────▶ │ nginx (projekt-ikaros-fe)                │
                    │  map $http_user_agent $is_bot            │
                    │  + whitelist veřejných cest              │
                    └───────┬───────────────────────┬─────────┘
              bot & public  │                        │  člověk / nepublic
                            ▼                        ▼
            ┌───────────────────────────┐   ┌──────────────────────┐
            │ prerender sidecar         │   │ try_files /index.html │
            │ (node + headless Chrome)  │   │ = dnešní SPA          │
            │ načte SPA jako ANONYM,    │   └──────────────────────┘
            │ počká na hotový DOM,      │
            │ vrátí statické HTML       │
            │ + in-memory cache (TTL)   │
            └───────────────────────────┘
                            │ fetchne ▼
                    SPA (same origin, bez tokenu)
```

- **nginx** (`default.conf.template`): `map` z `$http_user_agent` → `$is_bot`; druhý `map` z `$uri` → `$is_public` (whitelist regex veřejných cest). Pokud `$is_bot=1` **a** `$is_public=1` → `proxy_pass` na prerender sidecar; jinak dnešní `try_files $uri $uri/ /index.html`. (Vzor `set $prerender` + named `@prerender` location — `if` jen pro `set`, ne pro return, kvůli „if is evil".)
- **Prerender sidecar** — samostatný kontejner: malý node service, který přes headless Chromium (playwright/puppeteer) načte `http://frontend/<path>` **jako anonym** (žádné cookies/token), počká na „network idle" / signál hotové SPA, vrátí `document.documentElement.outerHTML`. In-memory LRU cache s TTL.
- **Same-origin fetch** — sidecar volá nginx interně (docker network) → prerenderuje skutečnou produkční SPA, ne build kopii.

📚 **Sidecar = pomocný kontejner vedle hlavního** ve stejném compose; sdílí síť, ale má jednu úzkou roli (tady: renderovat pro boty).

---

## 2. Které routy prerenderovat (whitelist)

**ANO (veřejné, indexovatelné):**

| cesta | obsah |
|---|---|
| `/` | homepage (anon showcase) |
| `/ikaros/vesmiry` | seznam veřejných světů |
| `/ikaros/clanky`, `/ikaros/clanky/:id` | články (Published) |
| `/ikaros/galerie`, `/ikaros/galerie/:id` | galerie |
| `/ikaros/napoveda` | nápověda (statická) |
| `/ikaros/novinky` | novinky (veřejné) |
| `/podminky` | podmínky |
| `/svet/:slug` | veřejný shell světa (private → SPA vrátí 404, leak-safe) |

**NE (neprerenderovat → bot dostane SPA shell):**
- `/chat` (Hospoda) — za Turnstile captcha bránou, efemérní obsah, neindexovat.
- `/reset-password`, `/email-verify`, `/email-change/confirm` — citlivé tokeny v URL, **nikdy** neprerenderovat/necachovat.
- `/admin/*`, `/ikaros/profil`, `/ikaros/posta`, `/ikaros/diskuze`, `/ikaros/oblibene`, `/ikaros/akce`, `/ikaros/uzivatele`, `/ikaros/uzivatel/:id`, vše `/svet/:slug/*` member-only — auth-only, nemá smysl/nesmí.

⚠️ **Whitelist je bezpečnostní hranice**, ne jen optimalizace — drží prerender mimo citlivé/auth routy.

---

## 3. Bezpečnost / leak-safe (klíčové)

1. **Anonymní render** — sidecar fetchne SPA **bez jakýchkoli cookies/Authorization**. Privátní obsah je serverově nedostupný anonymovi (BE `OptionalJwtAuthGuard` → 404), takže prerender ho fyzicky nezíská. Drží [auth-leak-policy].
2. **Whitelist cest** — i kdyby bot požádal o auth routu, nginx ji na prerender nepustí.
3. **Žádné předávání hlaviček uživatele** do sidecaru (jen čistá cílová URL).
4. **Cache klíč = jen path** (žádný uživatel/token v klíči) → nemůže dojít k záměně cachované privátní odpovědi mezi uživateli (a privátní se stejně neprerenderuje).
5. **CSP** — prerendered HTML servírované botům nese stejné CSP hlavičky jako dnes; obsahuje tytéž `<script>` (s existujícím sha256 hashem). CSP hash guard (`check-csp-hash.mjs`) i index.html zůstávají netknuté. *(Ověřit, že prerendered HTML projde CSP — riziko v §7.)*

---

## 4. Cache

- **In-memory LRU + TTL** v sidecaru (klíč = path). TTL návrh: statické routy delší (≈ 24 h), dynamické kratší (≈ 15–60 min).
- **Invalidace při deployi** — nový SPA build → prerender cache zastará. Návrh: restart sidecaru v compose down/up (cache je in-memory → vyprázdní se) — řeší existující deploy flow „compose down && up" zdarma.
- **Limit paměti** — LRU cap (počet záznamů) ať Chrome+cache nepřeteče RAM serveru.

---

## 5. Docker / nasazení

- **Nový adresář** `prerender/` ve FE repu: `index.js` (render service) + `package.json` + `Dockerfile`.
- **docker-compose.yml** — přidat službu `prerender` (build z `prerender/`), `restart: unless-stopped`, na interní síti (žádný host port — volá ji jen nginx). `frontend` na ní závisí (`depends_on`).
- **nginx Dockerfile** — beze změny image; jen `default.conf.template` rozšířen o prerender větev (přidat `PRERENDER_HOST` do `NGINX_ENVSUBST_FILTER`).
- **deploy.yml** — beze změny flow; nová služba se postaví `docker compose build` + `up` automaticky. (Ověřit RAM serveru — Chromium ~150–300 MB/instance.)

⚠️ **Ops dopad:** přibude Chromium kontejner. Nutno ověřit volný RAM na produkčním serveru (memory: prod běží na www.projekt-ikaros.com).

---

## 6. Ověření (jak poznám, že 15B.1 funguje)

- `curl -A "Googlebot" https://.../` → HTML obsahuje viditelný text/`<h1>`/odkazy (ne prázdný `<div id="root">`).
- `curl -A "Seznambot" https://.../svet/<public-slug>` → obsah veřejného světa v HTML.
- `curl -A "Googlebot" https://.../svet/<private-slug>` → **žádný** privátní obsah (404/prázdno) = leak-safe.
- `curl https://.../` (běžný UA) → dnešní SPA shell beze změny (lidský provoz netknut).
- `/reset-password` přes bot UA → **neprerenderuje se** (SPA shell), token z URL nikde necachován.
- Lighthouse/Rich Results: obsah viditelný ve „View source" botího náhledu.
- Cache: druhý dotaz na stejnou path výrazně rychlejší (cache hit).

---

## 7. Otevřené otázky / rizika

1. ✅ **Render engine** — **puppeteer-core + system Chromium (alpine)** kvůli velikosti image (rozhodnuto 2026-06-22).
2. ✅ **„Hotová SPA" signál** — **explicitní `window.__PRERENDER_READY__` flag**, který SPA nastaví po dořešení dat; spolehlivější než `networkidle` u WS/poll (rozhodnuto 2026-06-22).
3. **CSP kompatibilita** — projde prerendered HTML existující CSP enforce? Ověřit při implementaci; případně pro botí odpovědi CSP zjednodušit.
4. ⏳ **RAM na serveru** — unese produkční server Chromium sidecar? Ops-ověření **při nasazení** (není blocker pro kód).
5. **TTL hodnoty** — konkrétní čísla per skupina rout (§4) — doladit v impl. plánu.
6. **Timeout/fallback** — když render selže/timeoutne, vrátit botovi normální SPA shell (graceful degradation), ne 5xx.

---

## 8. Dotčené soubory (předběžně)

- **Nové:** `prerender/index.js`, `prerender/package.json`, `prerender/Dockerfile`.
- **Změna:** `default.conf.template` (UA + whitelist mapy, prerender větev), `docker-compose.yml` (služba `prerender` + depends_on), `Dockerfile` (FE — jen `NGINX_ENVSUBST_FILTER` o `PRERENDER_HOST`), případně `src/app/main.tsx` (ready flag dle OO2).
- **Beze změny:** SPA kód, router, build, index.html, CSP hash.
