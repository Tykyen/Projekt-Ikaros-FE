---
name: plny-audit
description: Závěrečná HLOUBKOVÁ brána kvality — projede každou oblast (00→X) všech 16 auditních stylů + rozšířené styly 17–46 (a11y/sec/dep/type/bundle/inj/dead · výkon/škála/realtime/load/voice/stabilita/zero-warnings/provoz · SSRF/odolnost-3.stran/anti-abuse/session/XSS-META/FE-selhání/freemium/GDPR-erasure/cross-instance-korektnost · vizuální-render-regrese/transakční-durabilita/release-version-skew/doručovací-integrita/herní-integrita-férovost) proti AKTUÁLNÍMU kódu BE+FE do PLNÉ cílové hloubky (statika L1-L3 + proof-vrstvy +db/+e2e/+teeth/+formal/+load/+perf/+fault/+authz-runtime/+render). Vynucuje SLO bránu: 500 aktivních světů, jeskyně až 50 hráčů, souběžné voice cally, LCP ≤ 2,5 s, nula chyb/warningů, „aby se nikdo nedostal" (bezpečnost+soukromí), férovost herního stavu, „ukládá se dobře" (transakční durabilita). Nejdřív self-maintenance (plány sedí na HEAD + čistá vstupní baseline), pak vyčerpávající průchod s maximálním fan-outem (1 agent = 1 oblast), pak proof-vrstvy, brána a report. Běh klidně dny. Resumable. Spustit na konci 14.9, na konci Etapy II a před každým velkým nasazením. NEopravuje bez souhlasu.
---

# Skill: plný audit (hloubková závěrečná brána)

**NE rychlý orchestrátor.** Tohle je **závěrečná hloubková brána** spouštěná v klíčových bodech.
Cíl: projít **každý kousek** webu **píď po pídi, oblast po oblasti** přes všechny auditní styly
a doložit **maximální dosažitelnou jistotu, že nezůstala ani nejmenší chyba** — a že web unese
**provozní cíle (SLO níže)**. Hloubka před rychlostí — běh **klidně dny**. Rychlost se získává
**paralelizací** (masivní fan-out agentů po oblastech), NE zkracováním hloubky.

> Historie: dřív byl tento skill „rychlý orchestrátor L1-L2". To byla vada návrhu — audity byly
> stavěny jako **extrémně hloubkové** (dny běhu, záměr). Skill je přehrává v plné hloubce.
> 2026-07-11 přidána výkonnostní/škálovací/provozní vrstva (styly 24–31 + SLO + `+load`/`+perf`),
> protože RUN 07-05 doložil, že 16 stylů výkon a provoz systematicky míjí.

## Co dělá / NEdělá

| Dělá | NEdělá |
|---|---|
| projede **každou oblast 00→X** každého auditu do **plné cílové hloubky** | nestrop­uje na L1-L2 / nešidí hloubku kvůli času |
| **self-maintenance**: ověří + doplní, že plány sedí na aktuální HEAD | nepouští audit proti zastaralému plánu (tichý drift) |
| **vstupní baseline brána**: build/lint/testy obou rep MUSÍ být známé PŘED auditem | nezačíná na špinavé baseline (RUN 07-05: „2473/2473" nesedělo) |
| **maximální fan-out** agentů (1 agent = 1 oblast), ve vlnách | nehrne vše jedním sériovým průchodem |
| **infra je default ON** (+db/+e2e/+teeth/+formal/+load/+perf); chybí → hlasitě stojí | netváří se „hotovo", když proof-vrstva neproběhla |
| **vynucuje SLO bránu** (kapacita, rychlost, nula warningů — tabulka níže) | nespokojí se s „staticky to vypadá dobře" u výkonu |
| **každý nález = hypotéza** → 🔴/⭐ ověřit čtením kódu před zápisem | nepřebírá agentní TL;DR jako fakt (halucinace se opakovaly) |
| **resumable** (per-oblast checkpoint HNED po dojetí jednotky) | nezačíná po přerušení od nuly (RUN 07-05: jen 50/126 checkpointů) |
| 16. (anti-regression) jako **závěrečná brána** | neopravuje automaticky / bez souhlasu |

## Argumenty

| Arg | Význam |
|---|---|
| _(bez)_ | **plná hloubka, vše ON** — freshness + vyčerpávající průchod 00→X + styly 17–31 + všechny proof-vrstvy + SLO brána |
| `--resume` | pokračuj z checkpointů (přeskoč už hotové oblasti) |
| `--audit <a,b,…>` | jen vyjmenované audity (názvy plán-dirů bez `-plan`, nebo čísla 17–31), pořád plná hloubka |
| `--area <NN>` | jen oblast(i) daného čísla — **platí jen v kombinaci s `--audit`** (samostatně víceznačné = chyba) |
| `diff <ref>` | jen audity/oblasti dotčené git diffem proti `<ref>` (rychlý mezikrok, NE závěrečná brána) |
| `--no-db` / `--no-e2e` / `--no-teeth` / `--no-formal` / `--no-load` / `--no-perf` | **opt-OUT** proof-vrstvy (vědomě nižší hloubka — do reportu jako ⏭️) |
| `--fault` / `--authz-runtime` / `--render` | **opt-IN** těžké proof-vrstvy: fault injection 3. stran+durabilita+herní (33/43/46) · runtime freshness role/session (35) · screenshot/PDF baseline diff (42) |
| `--pentest` | **opt-IN** ofenzivní proof-vrstva (skill [`pentest`]) — autentizované útočné testy pro bezpečnostní styly 2/22/32/34/35/36/39/40/46; povyšuje je ze statiky na exploit-ověřeno |
| `--update-baseline` | po běhu ulož census jako nový coverage baseline |

> **Inverze proti staré verzi:** hloubka je **default**, infra se odpojuje opt-outem. Bez příznaku =
> nejhlubší možný běh. Opt-out se v reportu objeví jako vědomá mezera, ne ticho.

---

## SLO — provozní cíle, které brána vynucuje

Byznys cíl: **500 souběžně aktivních jeskyní (světů), typicky 10 hráčů, jeskyně až 50 hráčů,
souběžné voice cally, špičky výrazně vyšší.** Převod na měřitelné cíle (audit je měří, ne odhaduje):

| # | SLO | Cíl | Jak se měří (proof) |
|---|---|---|---|
| S1 | Souběžní WS klienti | ≥ 5 000 stabilně, špička 10 000 bez pádu (řízená degradace, ne outage) | `+load` profil A |
| S2 | 50hráčová jeskyně | chat doručení do room p95 < 500 ms při 1–2 zpr./s; žádný O(members) full-scan DB na zprávu | `+load` profil B + kód (styl 25) |
| S3 | API latence | TTFB hot endpointů (worlds list, chat history, pages) p95 < 300 ms pod zátěží | `+load` + profiler |
| S4 | Načtení stránky | LCP ≤ 2,5 s (cíl 1,5 s) na mobil throttlingu · INP ≤ 200 ms · CLS ≤ 0,1 (standard roadmapy 22.2 — vynucen už teď) na KLÍČOVÝCH STRÁNKÁCH | `+perf` Lighthouse |
| S5 | Bundle budget | eager entry graf z `dist/index.html` (JS+CSS vč. modulepreload; bez fontů/obrázků) ≤ 350 kB gzip; žádný eager TipTap/PIXI/three | `+perf` bundle check |
| S6 | Deploy | bez ztráty zpráv/operací: graceful shutdown + health-gate; reconnect storm po restartu nepoloží BE | `+load` profil D + styl 31 |
| S7 | Paměť | soak ≥ 2 h: RSS BE stabilní; po odpojení klientů in-memory mapy prázdné; FE tab (mapa/kostky/voice) bez růstu | `+load` soak + styl 29 |
| S8 | Nula chyb/warningů | build+lint 0 errorů; eslint warningy: trend → 0 (D-17.8), žádný NOVÝ proti `zw-baseline.json` minulého RUN; browser konzole 0 error/warn na KLÍČOVÝCH STRÁNKÁCH; prod bundle bez console.* | styl 30 |
| S9 | Voice | světový hovor funguje souběžně s mapou/chatem (minimální proof stylu 28); kapacita 50 = doložená rešerše + plán, ne víra | styl 28 |
| S10 | Obnovitelnost | záloha existuje + OSTRÝ restore drill proběhl (RTO změřeno) | styl 31 (🔴 dokud 14.4 ⬜) |

> **KLÍČOVÉ STRÁNKY** (jeden seznam pro S3/S4/S8 a styly 24/29/30): login, dashboard světa, chat,
> deník postavy, taktická mapa — mobil i desktop viewport. Hot endpointy pro S3: worlds list,
> chat history, pages.
>
> SLO čísla jsou **výchozí brána** — zpřísnit lze kdykoli, změkčit jen s explicitním souhlasem
> uživatele (do reportu jako vědomá výjimka). **Nesplnitelné lokálně** (strop = load-generátor/HW
> na témže stroji, cizí infra jako meet.jit.si) ≠ ❌: zapiš změřený strop + verdikt
> `⏭️ nedoložitelné lokálně` + návrh, jak doložit (staging, 2. stroj).

---

## Fáze 0 — Příprava + infra (nic se nesmí tiše ošidit)

1. **Git HEAD** obou repo (`git rev-parse HEAD` ve FE i BE) → do reportu.
2. **Vstupní baseline brána (lekce RUN 07-05):** FE `npm run build` (tsc -b + vite + csp) + `npm run lint`
   · BE `typecheck` + `lint:check` + jest `--maxWorkers=2` · FE vitest (pozor D-064: lokálně může být
   suite-wide rozbitý → ověř posledním CI runem, nediagnostikuj slepě). Výsledek zapiš do reportu —
   nálezy auditu se počítají OD této baseline. Politika: **build/typecheck FAIL = STOP** (čekej na
   rozhodnutí uživatele); lint/test nálezy = zapiš do reportu jako vstupní stav a pokračuj.
3. **Auto-discovery + manifest oblastí:** vyjmenuj `docs/*-plan/` ↔ `docs/<name>-audit.md`. Pro každý
   audit naglobuj **oblasti**: `docs/<audit>-plan/[0-9][0-9]-*.md` (00, 01, … X) + README.
   Výsledek = **manifest jednotek** `(audit, oblast)` — celý pracovní seznam (**~110–130 jednotek**;
   RUN 07-05 = 126) + **30 jednotek rozšířených stylů 17–46 (1 styl = 1 jednotka)** → celkem ~140–160.
   Oblast v README bez souboru → mezera pro Fázi A.
4. **Dedup vstup:** načti `docs/dluhy.md` + registry `docs/*-audit.md` — známé dluhy/nálezy se
   nehlásí jako 🆕, klasifikují se `🔓 otevřený` s odkazem na existující ID.
5. **Infra bring-up / verify (default ON):**
   - **Mongo** (`+db`): `docker-compose.yml` v BE rootu = mongo:7 **1-node replSet rs0** (transakce OK)
     + redis + meili. **Produkční DB jen read-only a jen s EXPLICITNÍM souhlasem uživatele**
     ([project_server_swap]).
   - **Stryker** (`+teeth`): BE `backend/stryker.conf.json` ✅ existuje. **FE config NEEXISTUJE**
     (deps `@stryker-mutator/core`+`vitest-runner` jsou v devDeps) → při bring-upu FE config vytvoř,
     nebo vrstvu za FE hlasitě označ ⏭️.
   - **TLC** (`+formal`): `tla2tools.jar` (bývá `c:/tmp/`) + Java 1.8. Modely: `state-consistency-plan/tla/`
     (MapReconnect) + `race-condition-plan/tla/` (money, `.cfg` už existuje).
   - **e2e** (`+e2e`): BE jest e2e harness (`MongoMemoryReplSet` v `test/helpers/`), config
     `test/jest-e2e.json` (pinuje `maxWorkers: 1` — serialita je v configu; `--maxWorkers=2` platí
     pro unit sadu).
   - **`+load`**: k6 (binary) NEBO Node swarm skript nad `socket.io-client` + `autocannon` (npx) —
     materializuje se do `RUN/proof/load/`. Cíl VŽDY lokální/staging stack, **nikdy prod bez souhlasu**.
   - **`+perf`**: Chrome headless + `npx lighthouse` (pasti: `--user-data-dir` povinný,
     min viewport ~482 px — [reference_chrome_headless_viewport], [project_pdf_generation]).
   - Cokoli chybí a není opt-outnuto → **STOP s instrukcí, jak odblokovat** (ne tiché snížení hloubky).
6. **RUN složka:** `docs/full-audit/RUN-<YYYY-MM-DD-HHmm>/` + `scanners/` + **`checkpoints/`**
   (styly 1–16 per-jednotka `<audit>__<oblast>.md`; styly 17–31 `ext-<NN>__<styl>.md`; proof-vrstvy
   `proof__<vrstva>[-<profil>].md` — i Fáze C je resumable) + `proof/` (výstupy proof-vrstev).
   **Checkpoint se zapisuje HNED po dojetí každé jednotky**, ne dávkově na konci vlny — RUN 07-05
   zapsal jen 50/126 a resume by ~76 jednotek počítal znovu.

### Mapa audit → scanner + proof-vrstvy (per oblast čti cílovou L z plánu)

| Plán dir | Registr (prefix) | Scanner (podpora Fáze A) | Repo | Proof-vrstvy (Fáze C) |
|---|---|---|---|---|
| `bug-plan` | `bug-audit.md` (`N-`) | `npm run audit:routes` | FE↔BE | e2e |
| `role-plan` | `role-audit.md` (`R-`) | `npm run audit:routes` | FE↔BE | e2e |
| `nav-plan` | `nav-audit.md` (`NAV-`) | `npm run audit:nav` | FE↔BE | e2e/crawl |
| `ws-contract-plan` | `ws-audit.md` (`W-`) | `npm run audit:ws` | BE | e2e |
| `prod-config-plan` | `prod-config-audit.md` (`PC-`) | `npm run audit:config` + `npm run audit:csp` | BE+FE | — |
| `error-contract-plan` | `error-contract-audit.md` (`EC-`) | `npm run audit:errors` | FE+BE | e2e probe |
| `log-hygiene-plan` | `log-hygiene-audit.md` (`LH-`) | `npm run audit:logs` | BE | runtime e2e |
| `form-schema-plan` | `form-schema-audit.md` (`F-`) | — | FE↔BE | e2e round-trip |
| `cache-plan` | `cache-audit.md` (`C-`) | — | FE | e2e round-trip |
| `upload-media-plan` | `upload-media-audit.md` (`UM-`) | — | BE | +db + e2e (probe) |
| `state-consistency-plan` | `state-consistency-audit.md` (`S-`) | — | FE+BE | +formal (TLC) |
| `cascade-delete-plan` | `cascade-delete-audit.md` (`CD-`) | — | BE | +db (orphan/blob-scan) |
| `db-integrity-plan` | `db-integrity-audit.md` (`DI-`) | — | BE | +db (integrity-scan/M-TYPE) |
| `race-condition-plan` | `race-condition-audit.md` (`RC-`) | — | BE | +e2e + +formal (TLC) |
| `seed-scenario-plan` | `seed-scenario-audit.md` (`SS-`) | — | BE | +e2e (replSet) |
| `anti-regression-plan` | `anti-regression-audit.md` (`AR-`) | `npm run audit:regression -- --ci` | META | **běží POSLEDNÍ** |
| _(všechny)_ | — | — | — | `+teeth` (Stryker) ověří sílu testů |

### Rozšířené kontroly 1 — kvalita kódu (17–23, přidáno po RUN 2026-07-05)

Tyto styly **nemají vlastní `-plan/` dir**, ale RUN 2026-07-05 doložil, že chytají třídy chyb, které 16 auditů míjí. **Dělba:** scanner/grep část běží ve Fázi 0/A na pozadí (rychlé, read-only); jednotka stylu ve Fázi B pak dělá **ruční sweep NAD výstupem scanneru** (klasifikace, citace, cross-ref) — NE opakování scanu. Nálezy klasifikuj do reportu jako `EXT-*`. Nikdy je tiše nevynechávej — chybí → `⏭️` do reportu.

| # | Styl | Prefix | Jak spustit | Co chytá (doloženo RUN 07-05) |
|---|---|---|---|---|
| 17 | **a11y / přístupnost** | `A11Y-` | `npm run audit:contrast`; + ruční sweep `prefers-reduced-motion` guardů, ARIA role (listbox/option), focus | contrast on-danger <4.5:1, reduced-motion gaps, ARIA `role=option` na `<button>` |
| 18 | **secret / supply-chain** | `SEC-EXT-` | grep `BEGIN PRIVATE KEY`/`sk_live`/`AKIA`/`ghp_`/`AIza` ve `src/`; `git ls-files \| grep .env`; `.github/workflows/` na hardcoded email/token + PII do CI logu; **gitleaks/secret-scan v CI (dnes chybí)**; **co přesně deploy rsync kopíruje na server** (.git? .env?); Dependabot/Renovate (dnes 0) | CI workflow s reálným emailem v gitu, email dump do Actions logu; historie už jednou čištěna ([project_git_history_cleanup]) — bez scanneru se únik zopakuje |
| 19 | **dependency health** | `DEP-` | `npm audit --json` (FE+BE); `npx madge --circular --extensions ts,tsx src`; volitelně `npm outdated` | vitest-browser RCE (dev), js-yaml/qs DoS; circular deps |
| 20 | **type-safety depth** | `TS-` | grep `import type` na DTO použité jako `@Body`/`@Param` (maže class-validator metadata!), `@ts-ignore`, `as any`, `!`-nonnull na security cestách | `import type` v emotes → 400 pro všechny (feature mrtvá); vzor se opakoval (dungeon-maps) |
| 21 | **bundle / prod-build** | `BUILD-` | `npm run build` → grep `dist/assets/*.js` na vlastní `console.*`; ověř `build.minify` (vite@8 default `oxc` → `esbuild.drop` no-op; dnes explicitně `esbuild` — hlídej regresi); blocking fonts | `console.*` v prod bundlu (SEC-24, empiricky 2×) |
| 22 | **injection surface** | `INJ-` | grep user-controlled `$regex`/`new RegExp` bez `escapeRegex()`; `$where`; Mongo operator injection z payloadu | ReDoS: neescapovaný regex v user-search (SEC-28) — CPU stall celé platformy |
| 23 | **dead-code / unused** | `DEAD-` | grep BE endpoint/service metody bez FE volajícího; nepoužité exporty; `_options` param nikde nečtený | mrtvé FE stránky, legacy subdocy, stub moduly |

### Rozšířené kontroly 2 — výkon · škála · provoz (24–31, přidáno 2026-07-11)

Motivace: RUN 07-05 našel výkonnostní díry jen **bodově** (ReDoS, dice DoS, WebGL leak) — žádný styl
je nehledá systematicky, a byznys cíl (500 jeskyní / 50 hráčů / voice / „extrémně rychlé načítání")
neměl v repu **jediný test**. Tyto styly jsou od 2026-07-11 **plnohodnotná část brány** — vážou se na
SLO tabulku a proof-vrstvy `+load`/`+perf`. Prefix nálezů dle tabulky.

| # | Styl | Prefix | Jak auditovat | Co hlídá (váže na SLO) |
|---|---|---|---|---|
| 24 | **PERF-FE (načítání)** | `PERF-F-` | `+perf` Lighthouse na klíčových stránkách (login, dashboard světa, chat, deník, mapa; mobil throttling) + bundle check: z `dist/index.html` vyjmenuj modulepreload/stylesheet graf a sečti gzip; audit fonts/CSS/obrázků/SW | S4, S5. Eager graf bez TipTap/PIXI/three (past: barrel `shared/ui` re-export zatáhl news+TipTap 499 kB do entry); render-blocking Google Fonts (61 rodin v index.html + ~23 v diary-skins.css @import → subset/self-host); skiny CSS: 107 @import → 1,5MB chunk (lazy per skin); Cloudinary transformace (`cloudinaryThumb` jen ~7 konzumentů — zbytek míst s obrázky bez `w_/q_auto/f_auto`); cache headers celého řetězu (BE `/static`, `dist/textures` 429 MB!, brotli, HTTP/2); SW cachuje jen `/assets/` |
| 25 | **PERF-BE (dotazy+HTTP)** | `PERF-B-` | statická inventura hot-path + `+db` explain/profiler (slowms 100, `$indexStats`, brána „0× COLLSCAN") + `+load` měření | S2, S3. Paginace/projekce: `GET /worlds` vrací vše; `pages.findByWorld` tahá plná TipTap těla; `BaseMongoRepository.findAll` bez limitu (dědí desítky repo). N+1: `getMembers`→`enrichMembers` (publicProfile per člen), `getUnreadCounts` (2 count dotazy per kanál), push `notifyUsers` (DB dotaz per user). Chat zpráva = 2× full-scan membershipů světa. Chybí: compression, keep-alive tuning (Node default 5 s za proxy = sporadické 502; sladit s proxy timeouty), Mongoose pool tuning (`maxPoolSize` vs 500 světů), `autoIndex: false` v prod (~154× `.index()` ve schématech se builduje při KAŽDÉM startu), job queue (push/export/Meili inline v handlerech) + úklid mrtvých push subscriptions (410 Gone) |
| 26 | **SCALE-RT (realtime+DoS)** | `SCALE-` | čtení gateway/adapterů + `+load` profily B/D + scale-out zkouška (2 repliky + Redis adapter) | S1, S2, S6. `presence:update` = globální broadcast VŠEM klientům při každé změně (`io.emit`/`client.broadcast.emit` — O(N²)); 3 in-memory presence mapy (presence/chat/voice) → split-brain při 2+ instancích (dluh D-NEW-chat-presence-scale); handshake `isBlocked`: pozitivní ban-cache existuje (vědomý trade-off), ale negativní výsledek se necachuje → DB dotaz per socket = reconnect storm; FE reconnect = desítky room re-join hooků (runtime odhad) + refetch vlna (501× `invalidateQueries`/136 souborů, bez debounce); WS eventy bez rate limitu (chat REST má jen globální 100/min, `map:ping`/typing/reactions nic); `maxHttpBufferSize` 5 MB = paměťový DoS vektor; connection cap per IP chybí; unbounded listy jako DoS (viz 25); pomalý klient = neomezený write buffer (volatile emit pro high-freq eventy); sticky sessions pro polling-first transport nedokumentovány; `THROTTLER_REDIS` v prod compose chybí → při scale-out N× volnější limity |
| 27 | **LOAD (empirická zátěž)** | `LOAD-` | celý styl žije v `+load` proof-vrstvě (profily A–D + soak — detail ve Fázi C); ve Fázi B jen vydá PROOF-REQUESTy, checkpoint až po Fázi C | S1, S2, S3, S6, S7. Bez těchto čísel jsou styly 25/26 jen hypotézy — cíl NENÍ „projde/neprojde", ale **změřit strop** a zapsat ho do reportu (kolik zpráv/s, kolik socketů, kde to praská). Strop daný generátorem/HW na témže stroji → `⏭️ nedoložitelné lokálně`, ne ❌ (viz pozn. pod SLO) |
| 28 | **VOICE (kapacita+odolnost)** | `VOICE-` | čtení `features/voice/` + **minimální proof**: 3–4 headless Chrome s `--use-fake-device-for-media-stream` v jednom roomu SOUBĚŽNĚ s mapou/chatem + rešerše limitů meet.jit.si; kapacitu 50 NEsimulovat reálnými klienty — rešerše + verdikt ⏭️ s doporučením self-host | S9. Vše stojí na VEŘEJNÉ meet.jit.si bez SLA: limity pro ~50 účastníků nedoloženy, novější požadavek přihlášeného moderátora, ToS riziko pro stovky `ikaros-*` roomů; LiveKit swap = jen interface, implementace neexistuje; chybí participant cap, fallback UX když Jitsi nejede, degradace kvality; room salt výslovně NENÍ bezpečnost (spec-17.6 §5 — self-host+JWT veden jako dluh) |
| 29 | **STAB (dlouhá seance+zařízení)** | `STAB-` | Playwright long-session drill (cykly mapa↔chat↔deník, přepínání scén, hod kostkou, voice iframe; měř `performance.memory` + počet WebGL kontextů) + webkit projekt + mobil matice | S7. Herní seance = 4–6 h bez reloadu: PIXI `Application.destroy`/Assets eviction/three `dispose()` na unmount (DiceBox3D WebGL leak už nalezen); **stale-bundle po deployi**: 76 lazy routes → starý tab po deployi = dynamic import 404 = bílá stránka (ověř `vite:preloadError` handler / reload prompt; CH-066 SW banner to neřeší); iOS Safari/low-end Android: WebGL context limit, autoplay/mic policy, výkon mapy s 50 tokeny (CI testuje jen chromium!) |
| 30 | **ZERO-WARN (brána čistoty)** | `ZW-` | FE+BE: eslint warning count **per pravidlo** ulož do `RUN/proof/zw-baseline.json` a porovnej s posledním RUN (glob `docs/full-audit/RUN-*/proof/zw-baseline.json`; první běh = založ baseline) — `--max-warnings 0` je cílový stav až po odbagrování D-17.8, do té doby brána = žádný NOVÝ warning; Playwright smoke s assertem `console.error/warn == 0` + žádný failed request na KLÍČOVÝCH STRÁNKÁCH; CSP violation report; grep `console.*` v `dist/assets` | S8. Pozor kontext: FE react-hooks+jsx-a11y schválně na warn (dluh D-17.8, čistí se postupně); 178× FE eslint-disable inventarizovat; CI mezery: cross-repo scannery za `ENABLE_CROSSREPO_AUDIT` (defaultně NEběží → spusť lokálně), BE CI nespouští `nest build`, deploy není podmíněn zeleným CI |
| 31 | **OPS (provozní připravenost)** | `OPS-` | čtení `DEPLOYMENT.md`+`docker-compose.prod.yml`+`.github/workflows/` + drily se souhlasem | S6, S10. **Zálohy: mongodump cron NEEXISTUJE (14.4 ⬜) + OSTRÝ restore drill s měřeným RTO — dokud nesplněno, report má trvalé 🔴** (Mongo single-node na TÉMŽE stroji jako app); monitoring/alerting = 0 (uptime na `/health`, error tracking FE+BE, metriky: sockety/event-loop lag/RSS/pool/5xx/disk, alerty); deploy = `compose down→up` výpadek bez healthcheck-gate a `enableShutdownHooks` (deploy drill „během aktivní seance": ztracená zpráva? token op?); cold start čas-do-healthy; resource limits v compose žádné (OOM Meili/Chromium položí i Mongo) + kapacitní model RAM 1 stroje (Node+Mongo+Meili+Redis+prerender Chromium); disk: 429 MB textur/deploy, růst Mongo, docker images; retence vysokoobrátkových kolekcí (chatmessages TTL jen opt-in, game-events, notifikace) — výkon historie na ~10M docs; migrace: 35 ad-hoc GitHub Actions workflows místo verzovaného frameworku (migrate-mongo) s up/down |

### Rozšířené kontroly 3 — bezpečnostní hloubka · compliance · korektnost (32–41, přidáno 2026-07-11)

Motivace: cílený gap-hunt (7 optik hrozeb + 2 doběhy, ~990k tokenů) doložil, že styly 1–31 pokrývají
korektnost/výkon/škálu, ale **aktivní bezpečnostní povrch mimo IDOR/injection, GDPR compliance a
cross-instance korektnost NEmají systematickou optiku**. Headline nálezy jsou reálné díry v HEAD
(SSRF exfiltrace v exportu, pád instance při výpadku Redisu, dvojí odeslání zpráv při 2 replikách).
Prefix nálezů dle tabulky. Priorita: 🔴 must = přímo „aby se nikdo nedostal"; ⭐ should; ○ nice.

| # | Styl | Prefix | Prio | Jak auditovat | Co hlídá (seed nálezy 2026-07-11 = hypotézy k re-verifikaci) |
|---|---|---|---|---|---|
| 32 | **SSRF / egress security** | `SSRF-` | 🔴 | statika: inventura všech `fetch`/axios/`pipe` s user-controlled URL + jejich gate; volitelně `+e2e` pokus o egress na 169.254.169.254 | Server fetchuje uživatelovu URL → **host-allowlist** (jen `res.cloudinary.com`), blok privátních/link-local rozsahů (169.254/10./127./metadata), redirect-limit, **size cap + timeout**, a NEvydat tělo odpovědi zpět. 🔴 `world-export.service.ts:60-63` gate `isMediaUrl` propustí jakoukoli http URL s media příponou NEBO podřetězcem „cloudinary" → `:251` `fetch(url)` bez limitu → bajty interní sítě do ZIP ke stažení |
| 33 | **Odolnost 3. stran (degradace)** | `RES-` | 🔴 | statika (grep AbortController/SDK timeout, `.on('error')` na klientech) + nová proof `+fault`: kill/zpomal Redis/Meili/Cloudinary za běhu → degrade-not-crash + reconcile | Každé outbound volání 3. strany má **timeout + fallback + pozorovatelný signál + reconcile**, a neošetřená chyba knihovny NEshodí proces. 🔴 `socket-io.adapter.ts:95-96` Redis pub/sub **bez `.on('error')`** → výpadek Redisu za běhu (nutný pro 500 světů) = pád celé instance; outbound bez AbortController drží slot minuty (undici ~5 min); Meili fire-and-forget drift indexu; disk-fallback uploadu → 404 z jiné instance |
| 34 | **Anti-abuse: kvóty & fan-out** | `ABU-` | 🔴 | statika: inventura creatable entit + kaskádový násobič + DTO bounds + role-gate `@all` + dedup klíč; volitelně worst-case fuzz | Každá user-creatable entita/upload/volné pole má **kumulativní hard-cap** (počet, bajty) a každý fan-out (mention/report) role-gate nebo dedup — proti resource-exhaustion mimo per-minute rate. 🔴 `characters.service.ts:285` create bez capu → 1 účet zaplaví 100k+ dokumentů (kaskáda subdoců); `upload.controller.ts:44` throttle 20/min ale **žádná storage kvóta** = TB/den Cloudinary (freemium!); `chat.service.ts:1318` `@all`/`@here` bez gate → notifikační DoS; `moderation.service.ts:114` report bez dedup |
| 35 | **Auth/session attack surface** | `SESS-` | 🔴 | nová proof `+authz-runtime`: demote admina → starý token musí dostat 403; 6× špatný TOTP z různých IP → challenge invalid; měření login timingu | Non-IDOR auth: vydaný token respektuje **změnu role/logout-all**, MFA má per-účet lockout, registrace neprozrazuje existenci účtu. ⭐ `jwt-auth.guard.ts:68` čte roli ze STARÉ JWT (nesync z DB) → demotovaný Admin drží práva až 3 dny + „odhlásit všude" nezabije access token; `auth.service.ts:262` špatný TOTP nespotřebuje čítač (jen IP throttle → brute-force rotací IP); `:195` login timing + `/auth/check-email` = enumeration |
| 36 | **XSS sink↔sanitizer (META)** | `XSS-` | ⭐ | nová proof: CI META guard párující každý FE `dangerouslySetInnerHTML` ↔ `sanitizeRichText` na write-path zdrojového pole | Každý HTML-sink má na BE write-path odpovídající sanitizaci — META brána proti regresní stored-XSS třídě. ⭐ Obě dosavadní díry (F-02 timeline, F-RUN-02) se našly REAKTIVNĚ až v prod; párování se dnes drží ručně → nový rich-text field bez sanitize = tichá stored XSS |
| 37 | **FE failure handling** | `FEF-` | ⭐ | statika (grep `useQuery` konzument bez `isError`; onError-rollback bez `toast`; absence `unhandledrejection`; počet boundaries) + drobná runtime: mock 500 na list endpointy | Selhání je viditelné uživateli (error stav ne prázdno, toast u rollbacku) I vývojáři (globální `unhandledrejection`/`error` handler + telemetrie), a 1 crashlý widget neshodí celou routu. ⭐ `ArticlesPage.tsx:99` `data=[]` bez `isError` → 500 vypadá jako „nic tu není" (i Gallery/Favorites); `main.tsx` 0× `unhandledrejection`; `GlobalErrorBoundary:20` jen `console.error`; jediná top-level boundary |
| 38 | **FE async lifecycle** | `FEL-` | ⭐ | statika (grep `onKeyDown`→submit bez `isPending`; `useEffect` s `.then(set…)` bez cleanup; `setTimeout` bez clear) + runtime: dvojí Enter → 1 request | Klávesnicové submit cesty guardují `isPending` (double-submit přes Enter), ruční async v effektu má cleanup, timery se ruší. `CommentComposer.tsx:39` submit bez `isPending` guardu + Enter na `:62` → 2 komentáře; `EmailVerifyPage.tsx:44` `.then(setState)` bez cancelled guardu (vzor `let cancelled` nekonzistentní přes ~10 souborů, hist. C-30) |
| 39 | **Freemium/entitlement BE backstop** | `ENT-` | ○ | statika: inventura FE gate (`isEffectiveSupporter`/`locked`) → dohledat BE bránu; fuzz přímým API ne-supporter tokenem | Každý FE premium gate má BE bránu — proti obejití přímým API v okně „FE napřed před BE". `chat.service.ts:2397` `chatSkin` bez supporter gate (na rozdíl od `diceSkinMapping` hned pod ním); pozitivně: světy i dice skiny BE backstop MAJÍ → chybí systematická inventura |
| 40 | **GDPR / erasure / retence** | `GDPR-` | 🔴 | statika: pro každou PII kolekci dohledej `@OnEvent('user.deletion.hardDeleted')` handler; porovnej data-export sekce se seznamem kolekcí s userId; audit TTL/retence | Veřejná 15+ platforma: **erasure musí smazat/anonymizovat VŠECHNU PII**, export (čl. 15) být úplný, retence definovaná. 🔴 `chatmessages.senderName`+`content` se při erasure NIKDY neanonymizují (chat modul bez hardDeleted handleru) → zprávy identifikovatelné napořád; push subscriptions přežijí; `anonymizeForHardDelete` nechá `username`/`characterName`; věková brána 15+ (`isMinor`) NEblokuje (mrtvý flag); `/data-export/me` vynechává chat/postavy/obrázky/2FA; `upload_consents` drží IP navždy; audit log není tamper-evident |
| 41 | **Korektnost: cross-instance / čas / číslo / čeština** | `CORR-` | 🔴 | statika: grep cronů bez atomického claimu / distributed locku; `sort()` bez `_id` tiebreaku; float měny; `@Cron` bez `timeZone`; collation; volitelně 2-repliky drill | Třídy, které styly 1/14 (per-oblast / 1-proces CAS) nechytají cross-instance. 🔴 `scheduled-messages.job.ts:24` čte pending a AŽ POTOM `setStatus` (bez atomického claimu) → **2 repliky pošlou zprávu 2×**; ŽÁDNÝ cron nemá distributed lock (hard-delete/push/anonymizace běží 2×); ekonomika na **float** (`world-currencies.service.ts:124` `$inc` IEEE-754 drift → overdraft guard selže); offset-paginace bez `_id` tiebreaku (duplicity/výpadky přes stránky); Mongo bez `cs` collation; slug strhává diakritiku → kolize; camp cron bez `Europe/Prague` |

> **Nové proof-vrstvy k 32–41:** `+fault` (fault injection 3. stran — styl 33) a `+authz-runtime`
> (freshness role/session — styl 35) jsou opt-in přes `--fault`/`--authz-runtime`; bez nich statika +
> ⏭️ do reportu. Ostatní styly jedou na statice (grep/inventura) + existující `+db`/`+e2e`.

### Rozšířené kontroly 4 — render · durabilita · release · doručování · herní integrita (42–46, přidáno 2026-07-11, 2. gap-hunt)

Motivace: 2. cílený gap-hunt (6 optik pro produkční launch + přísný dedup) našel 5 tříd s **vlastní
metodikou/proof, kterou žádný z 41 stylů neumí** (pixel-baseline, durability fault-injection,
deployed-SHA matice, doručovací integrita, výsledkové property testy). Provozní tvrdost (porty/TLS/
fd-limity) kritik VĚDOMĚ NEudělal novým stylem — je to z ⅔ doostření stylů 5/31 (viz „Sharpeningy"
níže) + jednorázový ops-runbook. Prefix nálezů dle tabulky.

| # | Styl | Prefix | Prio | Jak auditovat | Co hlídá (seed nálezy 2026-07-11 = hypotézy k re-verifikaci) |
|---|---|---|---|---|---|
| 42 | **VR — vizuální / render regrese** | `VR-` | 🔴/⭐ | statika (must): overflow assert + CSS scope-leak lint 96 skinů + detektor „nainstalovaný-ale-nespuštěný" vizuál nástroj · nová proof `+render` (should): headless screenshot baseline diff per skin×povrch×viewport + PDF + vzorkování *computed* barvy textu vs pozadí | Porovnává vyrenderovaný FRAME proti schválené baseline — nikdo z 41 to nedělá (24=CLS posun, 30=dark-on-dark nezachytí, 17=6 statických hex párů, `if(!fg.startsWith('#'))continue` přeskočí rgba/var/gradient a NENÍ v CI). 🔴 96 skin CSS bez brány (edit tokenu tiše rozbije skin, build zelený); `playwright.config.ts:25` jen chromium/desktop → 0 mobil viewport → neasertuje `scrollWidth<=clientWidth` (memory zná `anon-header-overflow`); `scripts/screenshot-all-skins.mjs:68` screenshot BEZ assertu; Chromatic+addon-vitest nainstalován ale 0 skin stories + 0 CI job (falešný dojem pokrytí); PDF/tisk bez diffu (CH-004/007/008 už kously); scope-leak (holý `html/body/tag` v 1 z 96 skinů prosákne do všech) jen disciplína, vynucuje [[theme_isolation]]/[[theme_root_ownership]] |
| 43 | **DUR — transakční integrita & durabilita** | `DUR-` | 🔴 | statika: inventura service metod se ≥2 zápisy do různých dokumentů → tx vs sekvenční; efektivní write concern; idempotency-key + outbox · nová proof `+fault` (durability): kill/throw uprostřed sekvence + invariant assert | 13=struktura, 14=CAS souběh, 31=zálohy — nikdo neřeší „je *acknowledgnutý* multi-write atomický a journaled, přežije crash uprostřed". 🔴 `campaign-purchase.service.ts:451-486` `refund()` = 3 zápisy BEZ tx i kompenzace → pád mezi kroky = status `refunded` ale peníze nevrácené, hráč blokován `PURCHASE_ALREADY_REFUNDED` (nevratná ztráta); revert-fail jen `logError('ruční oprava nutná')` (žádný outbox/reconciliation); `database.module.ts:9-20` bez `writeConcern:{w:'majority',j:true}`; `purchase`/`transfer` bez idempotency-key → axios retry/double-click = 2. plný odečet; `withTransaction` bez `transactionOptions` (commit na default w:1) |
| 44 | **SKEW — release version-skew & migrace** | `SKEW-` | 🔴/⭐ | statika: zapnout+rozšířit cross-repo `route-audit` na CI bránu (dnes vypnuto); deployed-SHA matice; expand→migrate→contract; migrace vázaná na deploy | Modeluje NASAZENOU dvojici FE×BE na časové ose — 4/8 i `route-audit.mjs` porovnávají jen HEAD↔HEAD stejného commitu, ne nasazené SHA v deploy-okně (2 repa, „FE napřed před BE"). 🔴 `route-audit` teď hlásí **62 FE volání bez BE routy** (`useNabory` `POST ozvat-se`, `useModeration` `GET decisions/mine`) a v `ci.yml:106` je VYPNUTÝ (`ENABLE_CROSSREPO_AUDIT`) → ani HEAD-drift se nehlídá; `main.ts:44` `setGlobalPrefix('api')` bez `/v1` (žádná content-negotiation); `migrate-world-maps.yml` „NUTNE po deployi BE" + rollback `deleteMany({})` za běhu = zdánlivá ztráta dat — migrace odpojená od deploye bez ledgeru |
| 45 | **DLV — doručovací integrita (mail+push)** | `DLV-` | ⭐ | statika: bounce/suppression handling? falešný signál „doručeno" u resetu? MAIL_FROM shoda s relayem? transakční vs bulk stream? idempotency-key na `notify`? · malá proof: black-hole endpoint nezablokuje request | „odesláno ≠ doručeno" — 6=vyhozené chyby, 33=timeout, 25/34=subs/kvóty, ale nikdo „přišel mail do schránky, právě jednou". `smtp-mailer.provider.ts:63` `sendMail` resolvne na relay-accept → log „Sent" i pro neexistujícího příjemce (bounce async, hráč zamčený); 1 Gmail ~500/den bez app-čítače/fronty (`forgotPassword` awaituje inline) → notifikační fan-out vyčerpá cap → legitimní reset ten den tiše selže; `push.service.ts:26` `tag` slučuje jen na zařízení → WS replay = 2 identické reset pushe/tokeny. Pozn.: SPF/DKIM/DMARC záznamy = ops-runbook, ne styl |
| 46 | **GI — integrita herního stavu & férovost** | `GI-` | ⭐ | statika: pro každé zapisovatelné herní pole (hp/xp/měna) hledej server clamp/monotonii; pro každý výsledek server-generaci nebo recompute · nová proof: property/fuzz (invarianta drží po libovolné hráčem povolené operaci) + forge payload | „je tento numerický herní výstup legitimní?" — katalog řeší identitu (kdo hází, styl 2), ne legitimitu výsledku. 🔴 `chat.service.ts:1419` uloží `dicePayload` verbatim, DTO jen `@IsObject()` → hráč pošle `{faces:[20],sum:20,total:999}` a všem se zobrazí pravý hod (RNG `rollEngine.ts` na FE; crypto brání predikci, ne manipulaci v devtools); `token-ops.dto.ts:25` „currentHp NEpenetruje" + 0 clampů HP v BE → hráč nastaví vlastnímu tokenu `currentHp:99999` i zápor; `combat.turn` pořadí z FE, `token.move`/`dice.roll` negated proti `currentTokenId` → hráč hází/hýbe mimo tah. Pohltí sharpening 2 (tvrzená role `rollerKind`) a 14/11 (verzování sdílené entity) |

> **Sharpeningy stávajících stylů (2. gap-hunt — NEnové styly, jen zostřený predikát):**
> - **styl 2:** `rollerKind`/`rollerName` v herním výstupu ověřit vůči skutečné `WorldMembership.role` (dnes jen `byUserId`).
> - **styl 5:** síťová expozice — `ports:` bez `127.0.0.1:` (backend `0.0.0.0:3001` obchází TLS); Mongo/Redis bez `--auth`/`--requirepass` + `--bind_ip_all` (nulová defense-in-depth při lateral move).
> - **styl 25:** dead push subs mazat i na 400/403/413 + idle GC dle `lastUsedAt`; `notifyAll` full-scan → `p-limit` + fronta.
> - **styl 26:** HTTP slow-loris — `headersTimeout`/`keepAliveTimeout`/`requestTimeout` v `main.ts` (dnes Node defaulty na exponovaném portu).
> - **styl 31:** healthcheck-gated deploy (backend service bez healthcheck, verify jen `ps`); tagované image + N-1 rollback (dnes `prune`+rebuild `latest`, žádný rollback); targeted `up -d --no-deps backend` (dnes `down` restartuje i Mongo); `ulimits.nofile`/`pids_limit`; disk-cap lokálního upload-fallbacku (sdílí disk s Mongo → outage Cloudinary zaplní disk → Mongo dolů); graceful shutdown SIGTERM.
> - **styl 33:** každý externí transport má explicitní timeout (SMTP/webpush `connectionTimeout`/`socketTimeout`=0 na kritické cestě).
> - **styl 37:** FE rozliší skew-404 (endpoint ještě není nasazený) od resource-404.
>
> **Ops-runbook (mimo skill — jednorázový launch checklist, NEauditovat opakovaně):** obnova TLS certu +
> DNS, SPF/DKIM/DMARC záznamy, TLS terminátor do IaC, host firewall + `ulimit`. Udělá se jednou; audit
> bránou to projíždět nemá smysl.

> **Nové proof-vrstvy k 42–46:** `+render` (screenshot/PDF baseline diff — styl 42) opt-in přes
> `--render`; durabilita (43) a herní integrita (46) používají `+fault` + property testy; `SKEW` (44)
> je statika (CI route-gate). Bez opt-inu → statická podmnožina + ⏭️ do reportu.

> **Seed nálezy (inventura 2026-07-11):** konkrétní soubory/řádky ve všech třech rozšířených sekcích
> (barrel leak, `io.emit`, full-scany, fonty, SSRF gate, erasure handlery, float měny…) pocházejí
> z kódem ověřené inventury při tvorbě těchto sekcí. Ber je jako **výchozí hypotézy k re-verifikaci
> proti HEAD**, ne věčnou pravdu — kód se mezitím hýbe.

> **Ponaučení RUN 07-05:** agenti oblastí si sami dělají pod-fan-out (1 oblast → 5 pod-agentů), což
> dramaticky prohloubí pokrytí — nech je. Nejvíc kritických děr bylo **cross-cutting** (WS `room:join
> user:` gate, cross-world IDOR vzor, elevation drift ~20 komponent, favorites-leak, `data.code` vs
> `data.error.code`, `import type` na DTO) — hledej **opakující se vzor** přes moduly, ne jen
> izolovaný nález.

---

## Fáze A — Freshness / self-maintenance (plány MUSÍ sedět na HEAD)

> Bez tohoto by se hloubkový průchod opřel o zastaralou inventuru a tiše minul nový kód.

1. `npm run audit:census -- --json` + spusť podpůrné scannery (`audit:routes/nav/ws/config/csp/errors/logs`)
   do `scanners/` — živý povrch.
2. **Per audit** porovnej plán (oblasti 00→X + jejich inventury) s aktuálním kódem:
   - nový povrch (kolekce/route/listener/DTO/upload/delete-cesta/env…) z census → patří do oblasti?
   - chybí soubor oblasti, který README slibuje?
   - sedí „zamrzlé" počty v plánu („~70 kolekcí" apod.) na realitu?
3. **Self-doplnění:** zastaralou inventuru / chybějící položku oblasti **doplň přímo do
   plánu** (`docs/<audit>-plan/…`), označ datem `(plný audit RUN <datum>)`. Nedestruktivně — přidávej,
   historii needituj.
4. **Self-maintenance SKILLU:** namátkově ověř, že tvrzení tohoto souboru (skripty, cesty, configy,
   seed nálezy stylů 24–31) pořád sedí na HEAD; drift oprav v SKILL.md s datem.
5. **Brána A:** report „všech 16 plánů aktuální vůči HEAD <git>". Teprve pak Fáze B. Doplněné oblasti
   vstupují do manifestu Fáze B.

---

## Fáze B — Vyčerpávající průchod oblastí (MAX paralelně)

Pracovní seznam = všechny `(audit, oblast)` z manifestu + jednotky stylů 17–31 (1 styl = 1 jednotka,
checkpoint `ext-<NN>__<styl>.md`; styly bez statické části — 27 — vydají jen PROOF-REQUESTy a
checkpointují se po Fázi C). S `--resume` přeskoč jednotky, co už mají hotový checkpoint.

### Vlnový fan-out (jádro rychlosti)
- Dispatchuj **co nejvíc agentů souběžně** — v jednom message tolik `Agent` volání, kolik harness
  unese; jak agenti dojíždějí, **doplňuj další jednotky** (drž pool nasycený na max).
- Agenti jsou **read-only** → paralelizace bezpečná. (Opravy ve Fázi E se neparalelizují a BE+FE se
  nemíchá — [feedback_no_mixed_be_fe_batch].)
- **Checkpoint každé jednotky zapiš HNED, jak dojede** — ne až po vlně (lekce RUN 07-05: 50/126).

### Prompt agenta oblasti (vyplň `<…>`)

> Jsi hloubkový auditor **oblasti `<NN-název>`** stylu **`<audit>`**. READ-ONLY — nepiš kód, jen čti a hlas.
> Tvůj záběr je JEN tato oblast, ale v ní **vyčerpávající** — píď po pídi.
> 1. Přečti **celý** soubor oblasti `docs/<audit>-plan/<NN-…>.md` + plán README (osy, perspektivy P*,
>    M-metody, úrovně jistoty L*, **Cílová hloubka pro tuto oblast**, „Pracovní postup", pasti) +
>    relevantní část registru `docs/<audit>-audit.md` (známé nálezy + stav).
> 2. Projdi **VEŠKERÝ** kód v záběru této oblasti podle „Pracovní postup" — **každý** dotčený soubor/
>    symbol, **každou osu**, **každou M-metodu dosažitelnou staticky**. Cíl = plná statická hloubka
>    (L1-L3: čtení + cross-ref + strukturální důkaz), ne L2 strop.
> 3. Vrstvy, co potřebují živou infru (DB/e2e/Stryker/TLC/load/perf), **NEoznačuj za hotové** — místo
>    toho vydej **PROOF-REQUEST**: přesně co spustit (`+db` integrity/orphan na kolekci X · `+e2e` která
>    sada · `+teeth` Stryker na modul Y · `+formal` TLC na Z.tla · `+load` profil · `+perf` stránka)
>    a co to má dokázat.
> 4. **Každý nález doluj citací:** soubor:řádek + krátký úryvek kódu. Nález bez citace se nepočítá —
>    agentní TL;DR je hypotéza (halucinace se v minulých bězích opakovaly).
> 5. Vrať: (a) **čerstvé nálezy** ve formátu registru, klasifikuj `🆕 nový`/`♻️ regrese`/`🔓 otevřený`,
>    formát `<PREFIX>-RUN — [osa] popis · Kde: soubor:řádek · Dopad · Návrh · dosažená L<n>`;
>    (b) **pokrytí**: které soubory/osy/M-metody jsi reálně prošel; (c) **dosažená L vs cílová L**
>    oblasti; (d) seznam **PROOF-REQUEST** pro Fázi C.
> Stručně, česky, žádné slepé výpisy souborů. Když nic čerstvého: „bez nových nálezů, prošel jsem
> <co>, dosažená L<n>".

Posbírej výstupy → zapiš checkpointy → pokračuj další vlnou, dokud manifest není hotový.

---

## Fáze C — Proof-vrstvy (centrálně, jednou, paralelně kde to jde)

Agreguj **PROOF-REQUESTy** ze všech oblastí a pusť těžké důkazy **jednou** (ne per agent):

- **`+db`** (read-only, nejdřív dev/staging/`matrix`; prod jen s explicitním souhlasem):
  `db-integrity-plan/tools/integrity-scan` (TYPE/OR/RR/DUP/INV…) + `cascade-delete-plan/tools/orphan-scan`
  + blob-audit (Cloudinary vs DB URL). Skripty materializuj z `.md` do `proof/`, spusť s `MONGO_URI`.
  Prázdná lokální DB nic nedokazuje → nejdřív seed s daty + záměrnými orphany (vzor
  `RUN-2026-07-05-2303/proof/seed-min.mjs` — scan MUSÍ detekovat nastražený orphan, jinak je slepý).
  Nově: `explain()` na hot-path dotazy + `$indexStats` → brána „0× COLLSCAN" (styl 25).
- **`+e2e`**: BE jest e2e (`test/jest-e2e.json`, serialita v configu) — seed-scenario
  (`test/seed-scenario*.e2e-spec.ts`, replSet), race (`test/race/`), error/log runtime probe.
  Pozn.: CI Playwright jede proti MOCKOVANÉMU BE — kontraktové drifty chytí jen test proti reálnému
  stacku; aspoň 1 smoke (login → svět → zpráva → WS doručení druhému klientovi → search) pusť proti
  živému compose stacku.
- **`+teeth`**: Stryker **per modul** (= další paralelizace) — měří, jestli testy chytí umělé mutace.
  Dlouhé; běž na pozadí. Referenční čísla RUN 07-05: plný BE běh 110 min, skóre 44 % (63 % v pokrytém
  kódu), 797 survived = slabé asserce.
- **`+formal`**: TLC per `.tla` (`state-consistency-plan/tla/`, `race-condition-plan/tla/`) s `tla2tools.jar`.
- **`+load`** (NOVÉ): do `proof/load/` materializuj (1) **`seed-load.mjs`** — přímý Mongo insert
  světů + uživatelů + membershipů (bcrypt hash jednoho sdíleného hesla) a JWT tokeny podepsané
  `JWT_SECRET` z BE `.env` (hodnotu netiskni) — bez toho profil A nemá 500 světů ani 5000 identit;
  (2) swarm skript (`socket.io-client` N klientů: login tokenem, join world+chat rooms, zprávy
  1–2/s); (3) HTTP zátěž (k6/autocannon na hot endpointy). **Profily:** A = 500 světů × 10 klientů ·
  B = 1 svět × 50 klientů (měř p95 doručení + DB ops/zprávu přes Mongo profiler) · C = spike 2×
  baseline · D = reconnect storm drill (restart BE pod plnou zátěží, měř špičku handshake dotazů +
  refetchů) · soak ≥ 2 h + heap diff (po odpojení všech klientů in-memory mapy prázdné). Výstup =
  ČÍSLA (p95, msg/s strop, RSS křivka), ne dojmy. Cíl lokální/staging stack; prod NIKDY bez souhlasu.
  Checkpoint per profil (`proof__load-A.md` …).
- **`+pentest`** (NOVÉ, skill [`pentest`]): autentizované útočné testy proti BE e2e harnessu (T1) —
  pro každý bezpečnostní styl reálně vypálený útok, který má selhat (403/blok). Povyšuje styly
  2/22/32/34/35/36/39/40/46 ze statické L2 na **exploit-ověřeno L3/L4** a nechává trvalou regresní
  pojistku. Útoky v `backend/test/security/*.attack.e2e-spec.ts` + atomické piny `src/**/*.<vektor>.spec.ts`
  (vzor: `world-export/world-export.ssrf.spec.ts`, PT-32). Volitelně T2 DAST (ZAP/nuclei) proti
  lokálnímu stacku přes `--dast`. Prod jen read-only + explicitní souhlas (napřed ukázat příkaz).
- **`+perf`** (NOVÉ): měř **prod build** (`vite preview` nebo compose stack), NE dev server. Auth:
  přihlas se Playwrightem/Chromem v daném `--user-data-dir`, pak `npx lighthouse` (mobil preset) se
  STEJNÝM `--user-data-dir` — session (httpOnly cookie) persistuje; jinak měříš jen login page.
  KLÍČOVÉ STRÁNKY → LCP/INP/CLS vs SLO S4; bundle check: parse `dist/index.html`
  (modulepreload+stylesheet graf) → gzip součet JS+CSS vs S5 + grep eager grafu na
  tiptap/pixi/three markery. Výsledky do `proof/perf/`, checkpoint `proof__perf.md`.
- **Mapuj výsledky zpět na oblasti**: každý PROOF-REQUEST dostane výsledek → oblast finalizuje
  `dosažená L = cílová L`, nebo (opt-out/chybí infra) hlasitě `⏭️ blokováno + jak odblokovat`.

---

## Fáze D — Konsolidace + META brána + report

1. **Verifikace kritických nálezů:** každý 🔴/⭐ nález znovu ověř čtením kódu (druhý agent nebo hlavní
   smyčka) — teprve pak jde do reportu. Lekce z minulých běhů: false-positives i halucinace se
   opakovaly ([chybovy-denik] banUser, GURPS HP).
2. `RUN/report.md` (šablona níže): **per-oblast matice** (každá `00→X`: cílová vs dosažená L, nálezy,
   proof výsledek) + souhrn za audit + **SLO tabulka** (cíl vs změřeno vs verdikt).
3. **Brána:** `npm run audit:regression -- --ci` (běží POSLEDNÍ). Nenulový exit = regrese-riziko → 🔴.
4. **TL;DR uživateli:** kolik oblastí dosáhlo cílové L / kolik blokováno · nálezy 🆕/♻️/🔓 · 🔴 ·
   **SLO verdikt (S1–S10)** · stav brány · coverage drift z Fáze A · návrh pořadí oprav.
   **Pak teprve člověk kontroluje.**

## Fáze E — Opravy (GATED)

NEopravuj bez souhlasu ([feedback_workflow]). Při opravách: **BE+FE nemíchat** v jedné dávce
([feedback_no_mixed_be_fe_batch]); po BE změně **restart** ([feedback_be_restart_required]); FE **nikdy
prettierem** → `eslint --fix` + `npm run build` ([feedback_fe_no_prettier], [project_fe_build_preexisting_errors]);
BE jest `--maxWorkers=2` + precommit typecheck+lint, testy ručně ([feedback_be_precommit_prettier]);
před přidáním gate/guardu zgrepuj VŠECHNY konzumenty metody (CH-011 — interní volání dostalo 403); ke
každé opravě **pojistka G≥2**; aktualizuj `docs/<audit>-audit.md` + inventuru plánu; git **na uživateli**
([feedback_git_manual]).

---

## Šablona reportu (`RUN/report.md`)

```markdown
# Plný audit (hloubková brána) — RUN <datum> (FE <head> / BE <head>)

## TL;DR
- Oblastí celkem: <N> · dosáhlo cílové L: <x> · ⏭️ blokováno: <y>
- Nálezy: <n> (🆕 <a> / ♻️ <b> / 🔓 <c>) · 🔴 <k>
- **SLO brána: <s>/10 splněno** (viz matice) · vstupní baseline: <čistá/nálezy>
- Freshness (Fáze A): <z> plánů doplněno na HEAD · coverage drift souhrn
- META brána (audit:regression --ci): ✅ / ❌
- Rozsah: <full/diff/výběr> · proof-vrstvy: <db/e2e/teeth/formal/load/perf — ON/opt-out>

## SLO matice
| SLO | Cíl | Změřeno | Verdikt | Proof |
|---|---|---|---|---|
| S1 souběžní klienti | ≥5000/10000 špička | … | ✅/❌/⏭️ | load-A |
| … (S2–S10) | | | | |

## Per oblast (matice)
| Audit | Oblast | Cílová L | Dosažená L | 🆕 | ♻️ | 🔓 | 🔴 | Proof | Pozn. |
|---|---|---|---|---|---|---|---|---|---|

## 📈 Freshness / coverage drift (Fáze A)
| Audit | Co bylo zastaralé | Doplněno do plánu |
|---|---|---|

## Detail nálezů
### <PREFIX>-RUN — …

## ⏭️ Neproběhlé vrstvy (opt-out / chybí infra)
| Audit/oblast | Vrstva | Důvod | Jak odblokovat |
```

## Pravidla a hranice

- **Hloubka je default.** Nikdy ji tiše nesnižuj kvůli času — paralelizuj, nebo hlasitě nahlas opt-out/blok.
- **Future-proof:** cílovou hloubku/postup oblasti čti vždy **live z plánu**; nikdy nehardcoduj do skillu.
  Seed nálezy stylů 24–31 jsou datované hypotézy — re-verifikuj proti HEAD.
- **Self-maintenance napřed:** plány (i tento skill) musí sedět na HEAD, než začne hloubkový průchod.
- **Nález bez citace kódu neexistuje.** Agentní TL;DR = hypotéza; 🔴/⭐ dvojitě ověřit.
- **Měřit, ne odhadovat:** výkonnostní verdikt smí vzniknout jen z `+load`/`+perf` čísel, ne ze statiky.
- **Resumable:** každá hotová jednotka = checkpoint HNED; `--resume` neopakuje hotové.
- **Nedestruktivně:** RUN report je nový soubor; registry/plány jen doplňuj, historii nepřepisuj.
- **Opravy jen po souhlasu** (Fáze E).

## Pasti prostředí (z paměti + deníku)

- `audit:ws/config/errors/logs` žijí ve FE `scripts/`, čtou BE přes `IKAROS_BE_ROOT` (default
  `../../Projekt-ikaros`). Spustitelné z FE rootu. V CI běží jen za `ENABLE_CROSSREPO_AUDIT` → lokální
  běh je jediná spolehlivá brána.
- **CH-014 (4× opakováno):** `Set-Location` v PS tiše přesune i Bash cwd → build/test běží ve špatném
  repu = falešná zelená. Před každým build/test ověř `pwd`. Pozor i na DVĚ `docs/` složky s jinou
  roadmapou (BE vs FE repo, CH-046).
- **CH-056:** maskované exit statusy — `| tail` vrací status tailu; prázdný `$TMPDIR` v Git Bash =
  krok se nespustil, ale task exit 0. Ověřuj výstup, ne jen exit kód.
- **CH-069:** dlouhé `npx`/testy pouštěj na pozadí (Monitor), timeoutnutý foreground orphanuje
  desítky node procesů → thrashing. Orphany zabij, nezvyšuj timeout.
- **FE testy:** `npm run test:run -- <path>` (NE `npx vitest run <file>` — padá na setup, CH-029);
  vitest NEdělá type-check → po úpravě testů vždy `npm run build` (CH-042); D-064: FE vitest může být
  lokálně suite-wide rozbitý (Node 24) — ověř přes CI (Node 20), nediagnostikuj slepě.
- BE e2e harness boot: `archiver` v8 je ESM → jest mock přes `moduleNameMapper` (`test/mocks/archiver.stub.ts`),
  jinak padá celá e2e sada (SS-RUN-01). `jest-e2e.json` pinuje `maxWorkers: 1`.
- Seed-scenario FA/RC tx potřebují replSet Mongo; compose mongo je 1-node rs0 (OK), e2e harness má
  vlastní `MongoMemoryReplSet`. BE unit jest plně paralelně flaky → `--maxWorkers=2`
  ([project_be_test_mongo_flaky]).
- `+db` skripty (`integrity-scan`/`orphan-scan`) jsou v `.md` → materializuj do `proof/*.mjs`, spusť z BE
  (kvůli `mongodb` driveru), `MONGO_URI` z BE `.env` (hodnotu netiskni). Produkční cíl
  `www.projekt-ikaros.com` — read-only + explicitní souhlas ([project_server_swap]).
- Proof infra vady z RUN 07-05 už OPRAVENY (Stryker RC-CC1 config + Windows tempDir, TLC `money.cfg`,
  e2e WorldElevationsModule + MONGOMS_LAUNCH_TIMEOUT) — při regresi viz `findings-raw.md` RUN 07-05.
- `tla2tools.jar` bývá v `c:/tmp/`; Java přítomná (1.8). Stryker: BE `backend/stryker.conf.json`;
  **FE config chybí — vytvořit při bring-upu** (deps jsou).
- Chrome headless (`+perf`): `--user-data-dir` povinný, min viewport ~482 px
  ([reference_chrome_headless_viewport], [project_pdf_generation]).
- Harness pustí omezený počet agentů naráz → fan-out po **vlnách**, pool drž nasycený.
