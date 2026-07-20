# spec-24.2 — Ops kroky vázané na deploy

**Stav:** ✅ IMPLEMENTOVÁNO 2026-07-20 (BE+FE) — **čeká deploy obou polovin + živý smoke (§7)** · **Fáze:** 24 (Nasazovací fronta & úklid) · **Roadmap:** [roadmap3.md](../../roadmap3.md) karta 24.2 · **Souvis.:** 15.8 (anon Hospoda), 14.3 (CSP), 15B.1 (prerender sidecar), 23.6 (infra hardening), 24.1 (deploy nad HEAD)

---

## 1. Cíl

Odbavit ops kroky, které nešly udělat při psaní kódu, protože jsou vázané na běžící produkci. Karta je „malý náklad", ale rešerše 2026-07-20 ukázala, že **dva ze čtyř bodů jsou jinak, než roadmapa tvrdí** — jeden už běží, jeden je nespustitelný.

## 2. Zjištěný stav (rešerše 2026-07-20)

| # | Bod karty | Skutečnost |
| --- | --- | --- |
| ① | `ANON_SESSION_TTL=14d` | Kód má default `'14d'` ([auth.service.ts:848](../../../../Projekt-ikaros/backend/src/modules/auth/auth.service.ts)) → produkce **už 14 d jede**. Env chybí v prod compose, `.env.example` i `deploy.yml`. |
| ② | migrace `discussion-reports` | **Byla nespustitelná** — prod image nemá `scripts/` ani `ts-node`. → přepsána na JS + workflow (§6), **D-074 zrušen**. |
| ③ | CSP enforce + smoke | Enforce **už běží živě** (hlavička `Content-Security-Policy`, ověřeno curlem). Statický audit našel **1 reálnou blokaci** (viz §3.2). |
| ④ | RAM prerender sidecaru | Nikdy neměřeno; compose **nemá `mem_limit`**, Chromium se nikdy nerecykluje, LRU cache bez stropu v bajtech. |

## 3. Rozsah

### 3.1 ① Explicitní `ANON_SESSION_TTL` — BE repo

**Problém:** hodnota žije jen jako skrytý default v kódu. Nikdo neví, že je laditelná; změna vyžaduje redeploy s úpravou zdrojáku.

**Změny:**

1. `docker-compose.prod.yml`, sekce `backend.environment`: `ANON_SESSION_TTL: ${ANON_SESSION_TTL:-14d}`
2. `.github/workflows/deploy.yml` (BE): předat `ANON_SESSION_TTL=${{ vars.ANON_SESSION_TTL }}` do `.env` — prázdná var → compose default 14 d, žádná regrese.
3. `backend/.env.example`: řádek s komentářem (co to je, jednotka, default).

**Chování se nemění** — jen se zviditelňuje. Fail-safe: chybějící var = dosavadní stav.

### 3.2 ③ CSP — oprava blokace + smoke checklist — FE repo

**Nález (P1):** CSP `img-src` whitelistuje `https://i.ytimg.com`, ale ten se v kódu **nepoužívá ani jednou**. Skutečně používaný host je `https://img.youtube.com` ([VideosPanel.tsx:104](../../../src/features/world/pages/PageEditor/panels/VideosPanel.tsx) — náhledy YT videí v editoru stránek), a ten ve whitelistu **chybí**. Enforce běží → náhledy jsou v produkci rozbité.

**Oprava:** v `default.conf.template` v `img-src` nahradit `https://i.ytimg.com` → `https://img.youtube.com`.
_Ponechat i `i.ytimg.com`? **Ne** — mrtvá položka ve whitelistu je zbytečně rozšířená plocha. Kdyby ji někdo v budoucnu potřeboval, přidá se s kódem, který ji volá._

**Zbytek statického auditu — čistý:**

- `@import` v CSS: jen lokální cesty + `@fontsource-variable/*` z npm → bundluje Vite, žádný externí request.
- Vlastní `eval` / `new Function`: nikde. (`'unsafe-eval'` v CSP je kvůli YouTube `www-widgetapi`, doloženo v 14.3.)
- Ostatní externí domény v `src/`: `paypal.com`, `music.youtube.com`, `youtu.be`, `botland.cz` ap. jsou jen v testech, komentářích, demo datech nebo parserech URL — žádný runtime fetch/embed.
- `www.w3.org` (642×) = SVG namespace, CSP se ho netýká.

**Smoke neprozkoumaných stránek** — nemůžu dělat já (zákaz prohlížeče, `base.md`). Dodám ti checklist jako součást dodávky: galerie · postavy · bestiář · kalendář · admin · motivy, u každé co přesně sledovat v DevTools konzoli (`Refused to …` = CSP blok).

**⚠️ Systémový problém k rozhodnutí (§5):** CSP nemá `report-uri` ani `report-to`. Enforce tedy běží **naslepo** — jediná zpětná vazba je tester, který nahlásí „rozbitý obrázek". Přesně tenhle nález (`img.youtube.com`) by report-uri odhalil sám během report-only fáze.

### 3.3 ④ Prerender sidecar — strop paměti + recyklace — FE repo

**Riziko:** [prerender/index.js:41-55](../../../prerender/index.js) drží jednu sdílenou instanci Chromia, která se restartuje **jen když spadne**. Headless Chromium při dlouhém běhu roste (typický leak vzor). K tomu LRU cache `max: 500` položek **bez stropu v bajtech** — 500 vyrenderovaných HTML může být klidně 200 MB. Kontejner nemá `mem_limit`, takže růst jde přímo proti hostiteli, kde BE už drží RSS ~2,4 GB baseline (viz `project_rss_memory_embedding`).

**Změny:**

1. `docker-compose.yml`, služba `prerender`: `mem_limit: 768m`
   _Velkorysá pojistka proti OOM celého stroje, ne přesné ladění. Po naměření se doladí. `restart: unless-stopped` už tam je → případný OOM kill se sám zvedne._
2. `prerender/index.js`: recyklace browseru po `RECYCLE_AFTER` renderech (default 200) — počítadlo, po překročení `browser.close()` + zahodit promise. Řeší **příčinu** růstu, ne symptom.
3. `prerender/index.js`: LRU cache dostane `maxSize` (~64 MB) + `sizeCalculation` dle délky HTML. Dnes je strop jen v počtu položek, což o paměti neříká nic.
4. `.github/workflows/server-check.yml`: přidat krok `docker stats --no-stream` → **měření**, které karta požaduje. Dnes workflow sleduje jen porty a Caddy.

## 4. Co tato karta NEdělá

- **Nespouští migraci ②** — D-074, čeká na trigger.
- **Nemění chování anon sessions** — TTL zůstává 14 d.
- **Neladí `mem_limit` na přesnou hodnotu** — to jde až po měření z bodu ④.4.
- **Neprovádí živý smoke** — dodá checklist, testuje uživatel.

## 5. Rozhodnutí (uživatel, 2026-07-20)

1. **CSP `report-uri` — ANO.** Přibyl BE endpoint `POST /api/csp-report`.
2. **`mem_limit: 768m` nasadit rovnou**, doladit podle měření (ne odkládat kvůli měření).
3. **Bod ② se DĚLÁ** (uživatel: „chci to dotáhnout") — původně odložen jako D-074; místo odkladu přepsán do spustitelné podoby, **D-074 zrušen**.

## 6. Co se reálně změnilo

**BE (`Projekt-ikaros`)**

| Soubor | Změna |
| --- | --- |
| `src/common/csp-report/csp-report.controller.ts` | `POST /api/csp-report`, 204, `@Throttle` 30/min, `body: unknown` (DTO by na kebab-case polích vracelo 400 kvůli `forbidNonWhitelisted`) |
| `src/common/csp-report/csp-report.service.ts` | normalizace obou formátů, dedupe 10 min / max 500 klíčů, ořez polí na 200 znaků |
| `src/common/csp-report/csp-report.body-parser.ts` | **sdílená** konfigurace parseru — volá ji `main.ts` i e2e test |
| `src/main.ts` | `app.use(CSP_REPORT_PATH, cspReportBodyParser())` |
| `src/app.module.ts` | registrace `CspReportModule` |
| `docker-compose.prod.yml`, `deploy.yml`, `.env.example` | explicitní `ANON_SESSION_TTL` (default 14d) |
| `scripts/migrate-discussion-reports-to-content-reports/README.md` | varování, že TS varianta v produkci nejede + odkaz na workflow; TS+testy zůstávají referencí |
| `test/helpers/app-factory.ts` | volitelný `configure` hook (middleware před `init()`) |

**FE (`Projekt-ikaros-FE`)**

| Soubor | Změna |
| --- | --- |
| `default.conf.template` | `img-src`: `i.ytimg.com` → **`img.youtube.com`**; + `report-uri`, `report-to`, hlavička `Reporting-Endpoints` |
| `docker-compose.yml` | `mem_limit: 768m` + `RECYCLE_AFTER` na prerenderu |
| `prerender/index.js` | recyklace Chromia po N renderech (`inflight` guard), LRU `maxSize` 64 MB |
| `.github/workflows/server-check.yml` | kroky 13/14 — `docker stats` + restarty/OOM |
| `scripts/seed-migrace/migrate-discussion-reports.js` | **nový** — spustitelná JS varianta migrace ② (default dry-run, idempotentní) |
| `.github/workflows/migrate-discussion-reports.yml` | **nový** — `docker cp` + `docker exec node`, vzor `backfill-name-sort.yml` |

## 7. Ověření

**Hotovo:**

| Co | Výsledek |
| --- | --- |
| BE unit `csp-report.service` | 14/14 ✅ |
| BE e2e `csp-report` | 4/4 ✅ (těžiště = body parser, ne logika) |
| BE e2e regrese po zásahu do `app-factory` | 9/9 ✅ |
| BE `typecheck` + `lint:check` + prettier | ✅ |
| FE `npm run build` + `check-csp-hash` + bundle budget | ✅ (300,8 kB / 350 kB SLO) |
| živé hlavičky před opravou | ✅ `curl -sSI --ssl-no-revoke` — potvrdilo enforce i chybějící host |

**⏳ Čeká na deploy** (do té doby se `report-uri` ani `mem_limit` neprojeví):

0. **Workflow „Migrace nahlášených příspěvků"** → spustit **bez** `apply` (dry-run). Výpis `Legacy reportu v ikaros_discussion_reports: N` je zároveň odpověď na otázku, jestli je vůbec co migrovat: `0` → hotovo, nic dalšího. `N > 0` → spustit znovu se zaškrtnutým `apply` a zkontrolovat frontu „Zpracovat".
1. `curl -sSI --ssl-no-revoke https://www.projekt-ikaros.com/` → `img-src` obsahuje `img.youtube.com`, na konci CSP je `report-uri`/`report-to`, přibyla hlavička `Reporting-Endpoints`.
2. `server-check.yml` → krok 13 ukáže RSS prerenderu proti limitu 768m; krok 14 restarty (`OOMKilled=false`).
3. BE log po pár dnech: řádky `CSP blok: …` — pokud jich je hodně, whitelist má další díru; pokud nic, je čistý.

**⏳ Živý smoke — pro uživatele** (nemůžu, zákaz prohlížeče). Na každé stránce otevřít DevTools → Console a hledat řádky `Refused to load/connect …` (= CSP blok):

| Stránka | Na co se dívat |
| --- | --- |
| **editor stránek → panel Videa** | 🔴 **prioritní** — přesně tohle bylo rozbité; náhledy YT videí se musí zobrazit |
| galerie | obrázky z Cloudinary, lightbox |
| postavy / deník | avatary, fonty skinů, kostky (3D dice textury) |
| bestiář | obrázky bestií, karty motivů |
| kalendář | ikony, barvy událostí |
| admin | grafy analytics, seznamy |
| motivy (výběr skinu) | náhledy motivů, fonty |
| svět se zvuky / YT embed | přehrávač (`frame-src` + `unsafe-eval` pro YT widgetapi) |
| Putyka / voice | Jitsi iframe (kamera/mikrofon přes `Permissions-Policy`) |

Co v konzoli vyskočí, pošli — CSP hlásí přesně direktivu i zablokovanou URL, oprava je pak jednořádková.

---

**Workflow:** spec → schválení ✅ → kód ✅ → **deploy + živý smoke**.
