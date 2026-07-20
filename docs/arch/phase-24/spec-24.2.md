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

**Nález 2 (P2, nalezen 2026-07-20 při dotahování karty):** audit **skutečného buildu** (`dist/`, ne jen `src/`) odhalil druhou díru — emoji picker `frimousse` (chat reakce) si `fetch`uje `emojibase-data` z `https://cdn.jsdelivr.net/npm/emojibase-data@…`, což `connect-src` nepovoloval. **Plná paleta emoji v chatu tedy visela na „Načítám…".** Nikdo si toho nevšiml, protože lokální český quick-pick (`czechEmoji.ts`, ~120 emoji) fungoval dál a picker vypadal funkčně.

**Oprava:** `https://cdn.jsdelivr.net` do `connect-src` — **jen tam, NE do `script-src`** (jde o stažení JSON dat, ne o spuštění cizího kódu). Zbývající provozní/bezpečnostní dluh (závislost na cizí CDN) → **D-075** (self-host dat přes prop `emojibaseUrl`).

> 💡 Proč to `src/`-audit minul: URL si knihovna skládá v template literálu uvnitř `node_modules`, takže v našich zdrojích není. **Audit externích zdrojů se musí dělat nad buildem, ne nad `src/`** — jinak nevidí, co do bundlu přinesou závislosti.

**Zbytek statického auditu — čistý:**

- Vlastní `eval` / `new Function`: nikde. (`'unsafe-eval'` v CSP je kvůli YouTube `www-widgetapi`, doloženo v 14.3.)
- Ostatní externí domény v `src/`: `paypal.com`, `music.youtube.com`, `youtu.be`, `botland.cz` ap. jsou jen v testech, komentářích, demo datech nebo parserech URL — žádný runtime fetch/embed.
- `www.w3.org` (683× v buildu) = SVG namespace, CSP se ho netýká.

**Audit nad buildem (`dist/`) — aktivně načítané zdroje:**

| Zdroj | Direktiva | Stav |
| --- | --- | --- |
| `fonts.googleapis.com` (CSS `@import`, 89×) | `style-src` | ✅ povoleno |
| `fonts.gstatic.com` (soubory fontů) | `font-src` | ✅ povoleno |
| `www.youtube.com` (IFrame API + embed) | `script-src` + `frame-src` | ✅ povoleno |
| `img.youtube.com` (náhledy) | `img-src` | ✅ **opraveno nálezem 1** |
| `cdn.jsdelivr.net` (emojibase-data) | `connect-src` | ✅ **opraveno nálezem 2** |
| `github.com`, `react.dev`, `reactrouter.com`, `prosemirror.net`, `socket.io`, `pixijs.com`, `shadertoy.com`, `jcgt.org`, `fb.me`, `uoou.gov.cz`, `twitter.com`, `facebook.com` | — | ✅ jen odkazy (`<a href>`), komentáře a hlášky knihoven — CSP navigaci neblokuje |

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
| `default.conf.template` | `img-src`: `i.ytimg.com` → **`img.youtube.com`** · `connect-src`: + **`cdn.jsdelivr.net`** (emoji picker) · + `report-uri`, `report-to`, hlavička `Reporting-Endpoints` |
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

**✅ Ověřeno na živu po deployi (2026-07-20 ~07:35 UTC):**

| Co | Výsledek |
| --- | --- |
| BE běží nad 24.2 | `/api/health` → `version.sha: "e623b1d"`, `builtAt: 2026-07-20T07:29:30Z`, status `ok`, 10/10 checků ✅ |
| **24.1 se prokázalo** | `sha` už není `unknown` — nasazený commit jde přečíst zvenku; `builtAt` vs. dopočtený start (~07:30:57) sedí, tedy restart = deploy, ne skrytý OOM |
| FE CSP | `img-src … https://img.youtube.com` ✅ · `report-uri https://www.projekt-ikaros.com/api/csp-report` ✅ · `report-to csp-endpoint` ✅ · hlavička `Reporting-Endpoints` ✅ |
| **CSP endpoint ostře** | `POST /api/csp-report` s `application/csp-report` → **204** · s `application/reports+json` → **204** (testovací záznamy s doménou `overovaci-test.invalid`) |
| **CSP po 2. deployi** | `img-src … img.youtube.com` ✅ · `connect-src … cdn.jsdelivr.net` ✅ — **oba nálezy živě** |
| **Bod ② uzavřen** | workflow run #1 (dry-run): `Legacy reportu v ikaros_discussion_reports: 0` → „Nic k migraci". **Ostrý zápis se nespouštěl a není potřeba.** |
| **Prerender po změnách** | bot UA → `HTTP 200`, `x-prerender-cache: MISS` (reálný render, ne cache), HTML nese obsah · **5 souběžných + 5 sekvenčních renderů = 10× 200** → `inflight` guard drží, race z `CH-124` se neprojevil |

> Pozn.: během deploye vracel BE ~4 min `502` (startovací okno), FE po celou dobu `200`.

**⏳ Zbývá ověřit:**

0. **Workflow „Migrace nahlášených příspěvků"** → spustit **bez** `apply` (dry-run). Výpis `Legacy reportu v ikaros_discussion_reports: N` je zároveň odpověď na otázku, jestli je vůbec co migrovat: `0` → hotovo, nic dalšího. `N > 0` → spustit znovu se zaškrtnutým `apply` a zkontrolovat frontu „Zpracovat".
1. **BE log** — `docker logs projekt-ikaros-be --tail 50 | grep CSP` musí ukázat dva testovací záznamy `overovaci-test.invalid` (img-src + font-src). Tím se dokáže, že 204 není jen zdvořilé přikývnutí a report se opravdu **zapisuje**.
2. **Druhé měření RAM za pár dní** (`server-check.yml`) — viz §8 níž, jeden snímek trend nedokazuje.
3. BE log po pár dnech: řádky `CSP blok: …` z reálného provozu — hodně jich = whitelist má další díru; nic = je čistý.

## 8. Měření paměti — bod ④ (2026-07-20, `server-check.yml` run)

| Kontejner | MEM USAGE / LIMIT | % |
| --- | --- | --- |
| **projekt-ikaros-prerender** | **419,2 MiB / 768 MiB** | **54,59 %** |
| projekt-ikaros-be | 2,332 GiB / 8,004 GiB | 29,14 % |
| projekt-ikaros-mongo | 488,6 MiB | 5,96 % |
| projekt-ikaros-meili | 409,2 MiB | 4,99 % |
| projekt-ikaros-fe | 5,555 MiB | 0,07 % |
| projekt-ikaros-redis | 11,7 MiB | 0,14 % |

Restarty: `prerender / fe / be → restartů=0, poslední_exit=0, OOMKilled=false`. Stroj celkem ~3,9 GB z 8 GB.

**Zjištění:** karta počítala s „Chromium ~150–300 MB", realita je **419 MiB — o 40 % nad horní hranicí odhadu**, a to po pouhých ~11 renderech (1 bot + 10 ověřovacích). BE 2,33 GiB sedí se známým ONNX baseline (`project_rss_memory_embedding`).

**Reakce:** `RECYCLE_AFTER` **200 → 50**. Pokud RSS s počtem renderů roste, 200 renderů by se do stropu 768 MiB nemuselo vejít. Recyklace je levná — Chromium startuje 1–2 s a čeká na ni jen crawler, ne uživatel; cache HIT se jí netýká. `mem_limit` ponechán na 768 MiB (prostor na stroji je; snižovat bez znalosti trendu = hádání).

> ⚠️ **Co tenhle snímek NEdokazuje:** jestli 419 MiB je baseline Chromia, nebo mezistav růstu. Není známo, kolik renderů reálně proběhlo. Rozdíl mezi „v pořádku" a „za týden OOM" rozhodne až **druhé měření** — spustit `server-check.yml` znovu za pár dní a porovnat. Teprve dva body dělají trend.

### Smoke: co pokryl statický audit a co ne

Původní zadání („smoke neprozkoumaných stránek") mělo najít, kde enforce něco láme. **Audit nad buildem to udělal důkladněji než klikání** — prošel *všechny* zdroje v bundlu, ne jen ty na stránkách, které by někoho napadlo otevřít. Našel obě díry (`img.youtube.com`, `cdn.jsdelivr.net`).

**✅ Staticky pokryto — proklikání by to nenašlo líp:**
chybějící doména ve whitelistu pro `fetch` / `img` / `font` / `script` / `frame` (tj. třída obou nálezů). Ověřeno proti `dist/`, tedy včetně toho, co do bundlu vnesou závislosti.

**⏳ Zbývá naklikat — tohle statika neuvidí** (nemůžu, zákaz prohlížeče):

| Co | Proč to audit nechytí |
| --- | --- |
| **editor stránek → panel Videa** | 🔴 potvrzení nálezu 1 — náhledy YT se musí zobrazit |
| **chat → emoji picker (plná paleta)** | 🔴 potvrzení nálezu 2 — nesmí viset na „Načítám…" |
| runtime-skládané URL (`new Image().src = …`) | doména vzniká až za běhu z proměnné, v bundlu není |
| inline `style="…"` vkládané JS knihovnou | `style-src` má `'unsafe-inline'`, takže projde — ale ověřit vizuálně |
| Jitsi voice (Putyka) | iframe + `Permissions-Policy` delegace kamery/mikrofonu se testuje jen živě |
| 3D kostky (PixiJS textury) | WebGL + `blob:`/`data:` cesty |

Postup: DevTools → Console, hledat `Refused to load/connect …`. **Nově ale nemusíš hlídat konzoli sám** — každé porušení teď spadne i do BE logu (`grep CSP`), takže stačí appku běžně používat a po pár dnech se do logu podívat.

---

**Workflow:** spec → schválení ✅ → kód ✅ → deploy ✅ → **zbývá: 3 workflow + potvrzovací proklik**.
