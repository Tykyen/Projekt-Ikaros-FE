# Chybový deník — oblast: ops (provoz, zálohy, monitoring, CI)

Detailní záznamy. Index: [README.md](README.md).

---

### ✅ ŘEŠENÍ — 23.1 zálohy s off-site cílem + automatizovaný restore drill · 2026-07-19
**Co nakonec zabralo:** `db-backup.yml` rozšířen o denní cron (02:00 UTC) + rclone upload server→B2 přímo; klíče tečou z GitHub secrets přes SSH **stdin** jako `RCLONE_CONFIG_B2_*` env (printf exports + quoted heredoc pipnuté do `ssh bash -s`) → na serveru žádný secret, nic v argv. Retence v B2 `--min-age` + `--b2-hard-delete` (B2 jinak soubory jen skrývá a účtuje) + bucket lifecycle „keep last version" jako pojistka. Test obnovy NE jednorázově, ale **trvalý workflow** `db-restore-drill.yml` (měsíčně): nejnovější záloha z B2 → čistý `mongo:7` v runneru → verifikace počtů kolekcí/dokumentů + hlídání stáří zálohy < 48 h (drill tak zároveň hlídá, že cron žije). Fail-fast krok bez B2 konfigurace (záloha bez off-site nesmí být zelená).
**Proč to je správně (a ne další variace):** jednorázový „otestoval jsem obnovu" degraduje s časem — drill jako cron dává trvalou evidenci (červený signál 28.1 „neověřený restore" má automatickou kontrolu). Přímý upload server→B2 (ne přes runner) = data tečou jednou. Env-var config rclone řeší „žádné secrets na serveru" bez kompromisu.
**Jak ověřeno:** YAML parse (js-yaml) + `bash -n` extrahovaného SSH skriptu předem; pak ostrý běh: první záloha v B2 `daily/` (shoda velikostí lokál/B2) + zelený drill — 110 kolekcí / 43 127 dokumentů, download ~10 s, restore ~7 s + 🟢 Discord souhrn. Fail-fast krok se sám potvrdil: první run spadl na chybějící secrets (uživatel je vkládal jinam), po doplnění zeleno.
**Zhodnocení:** zabralo napoprvé (jediný zádrhel = secrets v UI, což pojistka chytila přesně dle návrhu). Zbývá pasivní kontrola: ráno po prvním nočním cronu mrknout do Actions; časy zapsány do runbooku §6 (BE `507e303`).

---

### ✅ ŘEŠENÍ — 23.4 error tracking: 2 skryté blockery před zapnutím DSN · 2026-07-19
**Co nakonec zabralo:** karta vypadala jako čistě ops úkol („jen nastav DSN"), ale recon před zapnutím našel 2 věci, které by tracking rozbily/otrávily: ① **LH-13** (z full-auditu 07-11) — FE `Sentry.init` bez `beforeSend`: axios error nese `config.headers.Authorization` (JWT) + `config.data` (heslo na loginu) → v okamžiku zapnutí DSN by citlivá data egresovala do agregátoru; ② **CSP** — `connect-src` neznal Sentry ingest host → enforce CSP by envelope requesty **tiše zahodila** a dashboard by zůstal prázdný při zdánlivě zapnutém trackingu. Fix: rekurzivní scrubber (`authorization/cookie/password/token/secret/api[-_]?key` → `[scrubbed]`) v FE `monitoring.ts` i BE `main.ts` + `${SENTRY_HOST}` v CSP šabloně odvozený v deployi z `VITE_SENTRY_DSN` (stejný vzor jako `BACKEND_HOST` z `VITE_API_URL`).
**Proč to je správně:** scrubber PŘED prvním eventem (ne po incidentu); CSP host z DSN = jeden zdroj pravdy, prázdný DSN → prázdná substituce → nulový dopad. Bare host (bez `https://` prefixu v šabloně) — prázdná hodnota nezanechá invalidní `https://` token v policy.
**Jak ověřeno:** BE typecheck+lint zeleně, FE build zeleně; deploy ověřen zvenku (CSP hlavička obsahuje ingest host, DSN v bundlu, `initMonitoring` v entry).
**Zhodnocení:** dobře — „hodinový ops task" měl 2 miny, obě našel statický recon před zapnutím (žádné cyklení na „proč je dashboard prázdný"). Poučení: u „jen zapni službu X" karet vždy zkontrolovat CSP/egress cestu a co poteče ven.
**Dodatek (3. mina, našel až živý test):** event nedorazil — `net::ERR_BLOCKED_BY_ADBLOCKER` (Opera GX vestavěný adblock; `*.ingest.sentry.io` je na standardních blocklistech → ~30–40 % uživatelů by bylo neviditelných, přesně ti „mlčky odejdou" testeři). Fix = Sentry `tunnel`: FE posílá envelope na `POST /api/monitoring/tunnel` (vlastní doména, blocklisty neblokují), BE `SentryTunnelController` přepošle na ingest — validace DSN vůči hostu vlastního `SENTRY_DSN` (žádný open relay), raw body middleware PŘED json parserem, fail-soft 200 `{relayed:false}` (5xx by spamoval alerty). Poučení: statika CSP/egress nestačí — mezi prohlížečem a sítí stojí ještě extensions; u telemetrie počítej s adblockem od začátku.
**Finální ověření živě (2026-07-19):** testovací event `sentry-test-fe` dorazil do dashboardu přes tunnel se ZAPNUTÝM adblockem; probe s cizí DSN → 400 (validace org drží, zároveň důkaz `SENTRY_DSN` v BE prod env). 23.4 zaškrtnuto.

---

### ✅ ŘEŠENÍ — 23.6 ověřovací brána před deployem odhalila mylnou premisu runbooku (žádný Caddy, server za NAT) · 2026-07-19
**Co nakonec zabralo:** karta žádala bind 3001 (a po rozšíření i 8081) na 127.0.0.1 dle runbooku §1 („Caddy na hostu proxuje na localhost"). Do spec jsem dal **blokující předpoklad**: před deployem ověřit Caddyfile na serveru. Uživatel neumí SSH → postaven `server-check.yml` (workflow_dispatch, read-only diagnostika přes tentýž SSH klíč jako deploy). Výsledek: **žádný Caddy neexistuje**, stroj má jen privátní IP (10.10.10.111) — TLS ukončuje edge proxy POSKYTOVATELE (leafhost) na jiném stroji a na porty chodí po interní síti. Loopback bind by odřízl produkci → změna VRÁCENA (v obou compose zůstal varovný komentář), runbook §1/§5/§7 přepsán podle reality, zbytkové riziko (interní síť + starý matrix-mongodb na 0.0.0.0:27017) → runbook §1 / karta 30.5.
**Proč to je správně (a ne další variace):** doktrína „ověř PŘED zásahem" z runbooku zafungovala přesně jak má — bez ní by šel na prod slepý deploy podle zastaralé dokumentace a web by spadl (a rollback by dělal uživatel bez SSH znalostí). Testy zvenku (`/dev/tcp` na 5.39.203.33) navíc vyvrátily i původní hrozbu — NAT porty 3001/8080/27017 do internetu vůbec nepouští.
**Jak ověřeno:** server-check výstup (hostname -I jen privátní IP, žádná proxy služba/kontejner, ufw inactive) + porty testované zvenku z lokálu; `docker compose config` po revertu = původní mapping.
**Zhodnocení:** dobře — nulové cyklení, žádný výpadek; karta se z „udělej X" překlopila na „zjisti proč X nejde a zdokumentuj realitu". Poučení: ops dokumentace psaná od stolu (runbook vznikl 2026-07-12 hromadně) může popisovat infrastrukturu, která nikdy neexistovala — před KAŽDÝM serverovým zásahem nejdřív diagnostika reality, ne důvěra v dokument. Vedlejší produkt `server-check.yml` je teď trvalý nástroj pro budoucí ops karty.
**Dodatek (oprava nálezů týž den):** uživatel nechtěl dluh → `server-hardening.yml` (diagnose/apply): matrix-mongodb publish → 127.0.0.1 (compose záloha `.bak-23-6`, backend restart) + DOCKER-USER (RETURN edge 10.10.10.104 + host + ESTABLISHED, DROP zbytek /24, systemd persistence) s auto-rollbackem gated na curl web+API přes edge z runneru. Apply zelený napoprvé, pravidly hned tekly pakety. Vzor „diagnose/apply + auto-rollback" = použitelný pro budoucí serverové zásahy bez SSH.

---

### ✅ ŘEŠENÍ — 24.1 jak zvenku dokázat, který commit je nasazený · 2026-07-20

**Co nakonec zabralo:** karta 24.1 zněla „deploy obou částí nad HEAD", ale správná první otázka byla „**běží už HEAD?**" — a odpověď byla ano, bez jediného deploye. Tři nezávislé techniky ověření zvenku:
- **FE (tvrdý důkaz):** z posledního commitu dotýkajícího se `src/` (`f693bd48`) vytáhnout **uživatelský text**, který přežije minifikaci („Když se ti návrh nepovede"), najít v živém `index-*.js` název lazy chunku (`HelpPage-DKC64IbD.js`), stáhnout a grepnout. Marker sedí → bundle prokazatelně obsahuje ten commit.
- **BE (řetěz):** `/api/health` `uptimeSec` → dopočet času startu kontejneru (21:56:49 UTC); `git log -g refs/remotes/origin/main` → **čas reálného pushe** (`update by push` 21:49:30 UTC, v commitu ho nenajdeš); čas deploy runu z Actions (21:55). Push < start deploye < restart → checkout musel vzít HEAD.
- **Odlišení, které repo screenshot Actions ukazuje:** živý FE `index.html` měl `Last-Modified` **pozdější** než nejnovější run na screenshotu → screenshot je z BE repa.

**Proč to je správně (a ne další variace):** `Last-Modified` a „deploy proběhl" dokazují jen *že se něco buildilo*, ne *co v tom je* — přesně tahle nejednoznačnost stála 2 falešné runy 2026-07-14 (www servírovalo starý bundle, protože runy #332/#333 běžely PŘED pushem; čas commitu ≠ čas pushe). Marker z konkrétního commitu + reflog push-čas tuhle mezeru zavírají. Deploy gate z 23.7 ji **nezavírá**: kontroluje jen zelenou CI pro checked-out sha, takže „nasadil starší sha, protože nový nebyl pushnutý" by prošlo zeleně.

**Jak ověřeno:** `curl --ssl-no-revoke` na www (apex míří na Vercel — jiná věc); marker nalezen 1× v živém chunku; health 10/10 ok; reflog + Actions screenshot od uživatele.

**Zhodnocení:** dobře — karta uzavřena bez zásahu do produkce, deploy by nasadil jen `docs/`+`ci.yml`. Vedlejší zjištění: log rotace FE nginxu (23.6) je aktivní (compose 17:28 < deploy 22:02). **Vlastní chyba:** v roadmapě jsem tuhle past nejdřív přiřkl „CH-073" — to je ale scroll bug v chatu; záznam o stale bundlu v deníku vůbec nebyl (žil jen v paměti `project_fe_deploy_stale_bundle`), proto teď vzniká tenhle. Poučení: než odcituju ID z deníku, ověřit ho grepem.

**Dodatek — mezera zavřena týž den (`/api/health` → `version`):** dopočet z `uptimeSec` není jen nepohodlný, je **falešně pozitivní** — dává čas posledního *restartu*, takže restart z jiné příčiny (OOM; RSS baseline ~2,4 GB) vypadá jako čerstvý deploy. Proto do health přibylo `version: { sha, builtAt }`: `deploy.yml` krok „Stamp build metadata" (samostatný — heredoc `.env` je quoted, `$(date)` by se v něm neexpandovalo, a odquotovat nelze kvůli secrets s `$`) → `.env` → compose → controller. **Klíčové rozlišení: `uptimeSec` = poslední restart, `builtAt` = poslední deploy; rozdíl mezi nimi = restart bez deploye.** Zvoleno env, ne build `ARG` (ARG mění vrstvu image při každém sha → invaliduje docker cache za nulový přínos). Fallback přes `||` ne `??` — compose dosadí prázdný `""`, ne undefined (ověřeno `compose config` bez hodnot). PC-08 vědomě: `sha` zkrácený na 7 a vrácený i v produkci, protože autentizovaný endpoint by zabil celý use-case (`curl` bez tokenu); privátní repo → neodemyká nic. Ověřeno: unit 9/9 (vč. prázdné var a ne-strip v produkci), e2e 2/2, typecheck+lint+prettier. **Účinek se projeví až prvním BE deployem** — do té doby běžící image proměnnou nezná a vrací `unknown`.

**Poučení navíc:** „záměr" (Actions: co se nasadit mělo) a „realita" (health: co běží) jsou dvě různé veličiny a stale bundle 07-14 byl přesně jejich rozpor. Zelený deploy run realitu nedokazuje.

---

### CH-124 — recyklace Chromia: `inflight++` až za `await` = okno pro zavření prohlížeče pod běžícím requestem · 2026-07-20

**Kontext:** karta 24.2 bod ④ — prerender sidecar (`prerender/index.js`) držel jednu instanci headless Chromia, která se restartovala jen při pádu. Přidával jsem recyklaci po N renderech, aby se řešila příčina růstu paměti, ne jen symptom přes `mem_limit`.

**Co jsem udělal špatně:** čítač souběžných renderů jsem zvedal až **po** získání prohlížeče:

```js
const browser = await getBrowser();   // ← await uvolní event loop
inflight++;                            // ← až tady
```

**Proč to nefungovalo:** `await` uvolní kontrolu event loopu. Request B mohl uváznout přesně mezi těmi dvěma řádky, zatímco request A doběhl, v `finally` uviděl `inflight === 0`, uzavřel podmínku „nikdo nerenderuje" a zavřel prohlížeč. B pak pokračoval a volal `newPage()` nad zavřeným browserem → 503 pro crawlera. Okno je úzké, takže by se to v testu ani při ručním zkoušení skoro jistě neprojevilo a spadlo by to až v produkci pod souběžným provozem botů.

**Oprava:** `inflight++` jako **první příkaz funkce**, ještě před `await getBrowser()`; vnější `finally` čítač vždy sníží, takže ani selhání `getBrowser()` ho nenechá viset.

**Poučení:** u sdíleného zdroje s počítadlem „kdo ho zrovna používá" musí inkrement předcházet **každému** `await` na cestě k jeho použití. Jinak si mezi rezervaci a použití vklíní cizí cleanup. Obecně: `await` není jen čekání, je to bod, kde smí běžet cizí kód — a otázka zní „co se stane, když se právě tady vystřídám?"

**Příznak cyklení:** píšu úklidovou logiku (close/dispose/recycle) podmíněnou čítačem nebo flagem a ptám se „stačí to takhle?" — pak projít každý `await` mezi rezervací zdroje a jeho použitím. Nalezeno vlastní kontrolou před dodáním, ne za běhu.

---

### ✅ ŘEŠENÍ — 24.2 ops kroky: dva ze čtyř bodů byly jinak, než karta tvrdila · 2026-07-20

**Co nakonec zabralo:** začít **rešerší stavu místo implementací zadání**. Karta 24.2 vypadala na čtyři drobné ops úkony; po ověření proti kódu a živé produkci se rozpadla jinak:

| bod | co karta čekala | realita |
| --- | --- | --- |
| ① `ANON_SESSION_TTL=14d` | nastavit env | kód má default `'14d'` → produkce **už tak běží**; chyběl jen explicitní zápis (compose/`.env.example`/deploy) |
| ② migrace discussion-reports | spustit `npm run …` | **nespustitelné** — prod image nemá `scripts/` ani `ts-node` (devDep padne přes `npm prune`) → D-074, odloženo (uživatel: kolekce je nejspíš prázdná) |
| ③ CSP enforce + smoke | přepnout na enforce | **enforce už běžel** (ověřeno `curl -I`) — a běžel **naslepo**, viz níž |
| ④ RAM prerenderu | změřit | nešlo změřit (workflow RAM nesledoval) a kontejner neměl `mem_limit` |

**Hlavní nález (③):** statický audit externích domén ve `src/` proti CSP whitelistu odhalil, že `img-src` povoluje `i.ytimg.com`, který kód **nikdy nevolá**, zatímco reálně používaný `img.youtube.com` ([VideosPanel.tsx](../../src/features/world/pages/PageEditor/panels/VideosPanel.tsx) — náhledy YT videí) ve whitelistu **chybí**. Oba hosty servírují tytéž thumbnaily, ale CSP porovnává hostname doslova. Enforce tedy v tichosti lámal náhledy videí v editoru stránek.

**Proč to je správně (a ne jen ta jednořádková oprava):** samotná výměna hostu opraví jeden příznak a nechá příčinu — CSP neměla `report-uri` ani `report-to`, takže jediným detektorem porušení byl uživatel s rozbitou stránkou. Proto přibyl BE endpoint `POST /api/csp-report` (oba formáty, rate-limit 30/min, deduplikace 10 min, ořez polí do logu). Tenhle konkrétní nález by ohlásil sám.

**Vedlejší zjištění (metodické):** e2e harness (`test/helpers/app-factory.ts`) staví app vlastní cestou a **neregistruje body parsery z `main.ts`**. Test s `Content-Type: application/csp-report` by tedy ověřoval svou vlastní kopii konfigurace — tedy přesně to místo, kde by se drift schoval. Řešení: parser vytažen do sdílené `csp-report.body-parser.ts` (volá ji `main.ts` i test) + volitelný `configure` hook ve factory.

**Jak ověřeno:** BE unit 14/14, e2e 4/4 (těžiště na parseru, ne na logice), `typecheck` + `lint:check` + prettier, e2e regrese sdíleného harnessu 9/9. FE `npm run build` + `check-csp-hash` + bundle budget zelené. Živé hlavičky ověřeny `curl -sSI --ssl-no-revoke`.

**Zhodnocení:** dobře — ale poučení je o **zadání, ne o kódu**: dvě ze čtyř položek roadmapy neodpovídaly realitě a slepá implementace by u ① duplikovala hotové, u ② narazila na nespustitelný skript a u ③ „přepínala" už přepnuté, aniž by kdokoli našel rozbité náhledy. **Ops karty psané dopředu stárnou tiše** — mezi jejich napsáním a odbavením se stav změní a nikdo to nepozná. Vlastní chyba během práce: CH-124 (race v recyklaci). **Zbývá:** živý smoke stránek (nemůžu — zákaz prohlížeče) + BE/FE deploy, teprve pak se `report-uri` a `mem_limit` reálně projeví.

---
