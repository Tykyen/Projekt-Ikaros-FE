# Anti-regression guard — má každý opravený nález trvalou, živou a ozubenou pojistku?

> **Účel:** vzít **všechny nálezy předchozích 15 auditů** (~255 ID napříč prefixy
> `N`/`C`/`CD`/`DI`/`EC`/`F`/`LH`/`NAV`/`PC`/`RC`/`R`/`SS`/`S`/`UM`/`W`) a u každého tvrdě prokázat,
> jestli se opravená chyba **už nikdy nemůže tiše vrátit** — protože ji hlídá pojistka, která **reálně
> běží** (ne jen existuje jako soubor), **cílí přímo na ten nález** (ne jen obecně sousedí) a **má zuby**
> (když fix odeberu, pojistka zčervená). Cílová otázka:
> „když za půl roku někdo při refactoru omylem vrátí chybu N-7 / RC-E2 / CD-01 — **spadne mu build /
> zčervená test ještě před mergem**, nebo to projde tiše až do produkce, protože pojistka buď neexistuje,
> nebo existuje jen na papíře a nikdo ji nespouští?"
>
> **16. styl auditu — a první META-audit.** Předmětem nejsou moduly systému, ale **kvalita obrany
> ostatních patnácti auditů**. Je to guard, který hlídá guardy. Sourozenec
> [`bug-plan/`](../bug-plan/README.md) … [`race-condition-plan/`](../race-condition-plan/README.md).
>
> **Stav:** zahájeno 2026-06-15. Plán napsán, sweep nezačal. Varianta **Maximum** (mapa všech ~255 +
> `M-TRACE` CI guard + `M-MUT` teeth + gated dostavění pojistek vč. CI). Nálezy →
> [`../anti-regression-audit.md`](../anti-regression-audit.md) (ID `AR-xx`).

---

## Proč samostatný audit (co ostatních 15 z principu nevidí)

Předchozích 15 auditů hledá **chyby**. Každý z nich u svých nálezů často **dopsal i pojistku** (test,
scanner, CI guard) — ale **žádný z nich neověřuje pojistky napříč** a žádný neměří, jestli ta pojistka
**reálně chrání**. Audit se uzavře větou „opraveno + CI guard ✅" a tím to končí. Nikdo se nikdy nevrátil
zeptat: *běží ten guard vůbec? Chytne, když fix odeberu? Existuje ještě po refactoru?*

A přesně tady žije vlastní třída selhání — **regrese opravené chyby** — kterou žádný z 15 auditů
nezachytí, protože každý se dívá jen na svůj výsek a jen v jednom okamžiku:

| Slepá skvrna | Příklad v Ikarovi | Dopad |
|---|---|---|
| **Papírová pojistka** | `audit:errors`/`audit:logs`/`audit:config` mají `--ci` mód, ale **neběží v žádném workflow** → drift projde | 🔴 iluze ochrany |
| **FE bez sítě úplně** | FE nemá **žádný** CI ani precommit → žádný typecheck/lint/test/audit nehlídá merge | 🔴 vše FE bez pojistky |
| **Test bez zubů** | regresní test existuje, ale je tak slabý, že projde i s vrácenou chybou (mock maskuje) | 🟠 falešný klid (R-07 mock) |
| **Pojistka jen sousedí** | „opraveno, je tam test" — ale test ověřuje vedlejší cestu, ne přesně ten nález | 🟠 AIM gap |
| **Chráněná instance, ne třída** | opraven 1 z 10 výskytů cache-key mismatchu; ostatní 9 se vrátí jinde | 🟠 CLASS gap |
| **Pojistka odumřela tiše** | scanner vázaný na smazaný soubor / string, co se přejmenoval → běží, ale nic netestuje | 🟡 DUR gap |
| **Bez traceability** | vazba nález→test žije jen v lidské paměti / v `.md` → po smazání registru nikdo neví, co co hlídá | 🟡 nedohledatelné |
| **Otevřený nález bez plánu** | W-7 / W-10 stále OTEVŘENÉ — žádná pojistka, protože ani fix není | 🔴 dluh bez stopy |

> 💡 **Kořen (jako každý audit má jeden):** **neexistuje vazba mezi nálezem a jeho pojistkou ani vrstva,
> která by pojistky reálně spouštěla.** Pojistky vznikaly ad-hoc u jednotlivých auditů, leží v repu jako
> mrtvé skripty a slabé testy, a jediné „CI", které reálně běží, je BE `typecheck + lint + jest`
> ([ci.yml](../../../Projekt-ikaros/.github/workflows/ci.yml)). FE nemá nic. 8 scannerů nikdo nespouští.
> Drift je tichý: stačí jeden merge, který vrátí starou chybu, a **nic nespadne**, protože pojistka buď
> chybí, nebo neběží, nebo nemá zuby. Audit to zviditelní strojově (traceability scanner nález→pojistka) a
> rozhodne, kde pojistku **postavit, oživit (CI) nebo naostřit (teeth)**.

📚 **Co je „regrese / anti-regression / teeth / traceability":** *Regrese* = dříve opravená chyba se
později vrátí (typicky refactorem, co netušil, proč tam fix je). *Anti-regression pojistka* = test/guard,
který tu konkrétní chybu hlídá a **selže dřív, než se dostane do produkce**. *Teeth (zuby)* = vlastnost
testu, že **reálně červená**, když chybu vrátíš (ověřeno mutací — Stryker). Test bez zubů je divadlo.
*Traceability* = strojově dohledatelná vazba **nález → pojistka** (který test/řádek hlídá který `AR`/`N`/…).

---

## Prior art (co už existuje a co míjí)

> ⚠️ Část pojistek **existuje** — stavíme na nich, neduplikujeme. Ale skoro žádná není **živá**.

| Artefakt | Co dělá | Reálná živost |
|---|---|---|
| BE [ci.yml](../../../Projekt-ikaros/.github/workflows/ci.yml) | na push/PR main: `typecheck` + `lint:check` + `npm test` (jest unit+e2e+race) | ✅ **JEDINÁ živá síť** — ale jen BE, jen testy, **žádný scanner** |
| BE husky `pre-commit` | `typecheck` + `lint:check` | ✅ živé, ale **bez testů** ([feedback_be_precommit_prettier]) |
| 8× `npm run audit:*` (routes/nav/ws/config/errors/logs/contrast) + `lint:colors` | statické scannery s `--ci`/exit kódem | ⚠️ **G1 papírové** — v žádném workflow, jen ruční běh |
| BE `stryker.conf.json` | mutace — ale **scope jen 6 race-fix souborů** | ⚠️ jen ručně (`npx stryker`), úzký scope |
| BE `test/race/race-barrier.ts` + `test/race/*.e2e-spec.ts` | deterministický interleave (RC nálezy) | ✅ běží v `npm test` → v CI |
| BE `test/` e2e (17×) + `createTestApp` + seed-scenario harness | end-to-end pokrytí | ✅ v CI |
| FE vitest (42 testů) | UI/utility/tactical-map | 🔴 **nikde v CI** (FE žádný workflow) |
| FE `fast-check` + `playwright` v devDeps | property/e2e nástroje | ⚠️ instalované, využití neznámé |
| 15× `*-audit.md` registr | lidsky čitelný seznam nálezů + někdy zmínka pojistky | ⚠️ **bez strojové vazby** nález→test |

> 💡 **Pozice tohoto auditu:** všechny předchozí pojistky jsou **bodové a většinou mrtvé**. Tenhle audit
> dělá **systematickou matici všech ~255 nálezů × stupeň pojistky (G0–G4)** napříč oběma repo, postaví
> **traceability scanner** (nález→pojistka→živost) a navrhne, jak chybějící/papírové/bezzubé pojistky
> povýšit. Nepřepisuje existující testy — **inventarizuje, oživuje a ostří**.

---

## Páteř — taxonomie síly pojistky (osa `G`)

Každý nález dostane stupeň. Cíl auditu = posunout **každý důležitý** nález co nejvýš.

| Stupeň | Definice | Reálná ochrana | Jak se pozná |
|---|---|---|---|
| **G0** | nález opraven, **nic** ho nehlídá | 🔴 žádná | v registru ani v kódu žádný test/guard cílený na nález |
| **G1 — papírová** | pojistka existuje (scanner/spec/test), ale **neběží automaticky** | ⚠️ iluze | scanner mimo CI; FE test mimo CI; ruční `npx` |
| **G2 — živá statická** | scanner/lint/typecheck běží v CI/precommit a chytí drift | ✅ kód/contract | je v `ci.yml`/`pre-commit`, blocking |
| **G3 — živý cílený test** | regresní test cílí **přímo** na nález a běží v CI | ✅ behavior | test pojmenovaně reprodukuje nález, je v `npm test` |
| **G4 — ozubená** | mutace/reverze fixu → pojistka prokazatelně červená | ✅✅ prokázaná | Stryker zabil mutaci / ruční reverze fixu zčervená |

> 💡 **„Co nejhlouběji" tady = posunout důležité nálezy na G3/G4, ne se spokojit s G1.** Většina dnešních
> „CI guard ✅" v registrech je reálně **G1** (scanner mimo CI). To je hlavní iluze, kterou audit boří.

---

## Kontrolní osy (7 jádrových + 2 nadstavba)

### Jádro (tvrzeno na každém nálezu)
| Osa | Zkr | Otázka | Selhání = stupeň |
|---|---|---|---|
| **Existence** | `EX` | má nález vůbec namapovanou pojistku? | G0 |
| **Živost** | `LIVE` | běží pojistka automaticky (CI/precommit), nebo jen ručně? | G1 |
| **Cílenost** | `AIM` | testuje pojistka **přesně** ten nález, nebo jen obecně sousedí? | slabé G3 |
| **Zuby** | `TEETH` | reverze fixu / mutace → pojistka zčervená? | chybí G4 |
| **Traceability** | `TRACE` | existuje **strojová** mapa nález→pojistka, nebo jen lidská paměť? | nedohledatelné |
| **Trvanlivost** | `DUR` | přežije pojistka refactor (nevisí na smazatelném souboru/stringu)? | křehké |
| **Pokrytí třídy** | `CLASS` | chráněn **celý kořen** třídy, nebo jen jedna instance? | CLASS gap |

### Nadstavba (Maximum — strojový a běhový důkaz)
| Osa/nástroj | Zkr | Konkrétní tah | Co reálně chytí |
|---|---|---|---|
| **Traceability scanner** 👑 | `M-TRACE` | parsuj všechny `*-audit.md` → seznam nálezů; parsuj mapu `nález→test`; ověř, že každý důležitý nález má **existující** test/guard a že ten **je v CI**; report G0/G1 | papírové + chybějící pojistky strojově; CI guard `npm run audit:regression` |
| **Teeth (mutace)** 👑 | `M-MUT` | u klíčových opravených nálezů odeber fix (mutace / ruční reverze) → cílený test **musí** zčervenat | bezzubé testy (audit-divadlo) |

`EX`/`LIVE`/`TRACE` jsou osy **existence a živosti** (je tam vůbec něco, co běží?). `AIM`/`TEETH`/`CLASS`
jsou osy **kvality** (chrání to reálně a celé?). `DUR` je osa **trvanlivosti** (přežije to čas).
`M-TRACE`/`M-MUT` posouvají audit ze čtení registrů na **strojový a běhový důkaz**.

---

## Metody ověření + úrovně jistoty

| Kód | Metoda | Nástroj |
|---|---|---|
| **M1** | Statické čtení registrů + grep testů na ID/klíčové symboly nálezu | Read/Grep |
| **M-TRACE** | **Traceability scan** — registry → nálezy → mapa → test → CI; report G0/G1; CI guard | node ([`tools/anti-regression-scan`](tools/anti-regression-scan.md)) |
| **M-RUN** | Spuštění pojistky — `npm test` (BE), vitest (FE), `audit:*` scannery; běží zeleně? | jest/vitest/node |
| **M-MUT** | **Mutace/reverze** — odeber fix, cílený test musí zčervenat | Stryker / ruční git revert hunku |
| **M-CI** | Ověření živosti — je pojistka v `ci.yml`/`pre-commit`? blocking? | čtení workflow |
| **M2** | Cross-ref na zdrojový audit (severity, stav, kořen třídy) | čtení `*-audit.md` |

| Úroveň | Co znamená | Důkaz |
|---|---|---|
| **L1** | nález vyčten z registru, stupeň G odhadnut z dokumentace | nejslabší |
| **L2** | **M-TRACE**: strojově ověřeno, jestli pojistka **existuje** (soubor/test) | strojový smoke |
| **L3** | + **živost**: ověřeno, že pojistka je v CI/precommit a je blocking (G2+) | mechanika |
| **L4** | + **cílenost & běh**: pojistka spuštěna, je zelená, a prokazatelně cílí na ten nález (G3) | běhový důkaz |
| **L5-teeth** | + **mutace**: reverze fixu → pojistka červená (G4) | důkaz síly |
| **L6** | + **CLASS**: chráněn celý kořen třídy, ne jen instance | systémový důkaz |
| **L7** | **vědomá hranice** — multi-instance / infra-pojistky (Cloudinary orphan-scan, deploy smoke) nelze v repu plně ozubit, jen syntetizovat | strop |

**Cíl (Maximum):** matice všech ~255 na **L2** (existence strojově) + **L3** (živost); každý **důležitý**
nález na **L4** (cílený živý test) a klíčové na **L5-teeth**; `M-TRACE` jako **CI guard**
(`npm run audit:regression`) — nově opravený nález bez pojistky se napříště **nikdy nezavře tiše**.

---

## Cílová varianta: **Maximum**

Mapa všech ~255 nálezů na G0–G4 (`M-TRACE`, L2–L3) **+** dotažení každého důležitého nálezu na G3
(cílený živý test, L4) **+** `M-MUT` teeth na klíčové opravené nálezy (L5) **+** oživení CI: nový FE
workflow a zapojení 8 scannerů jako blocking checků (G1→G2) **+** `M-TRACE` jako nový CI guard, který
od teď vynucuje vazbu nález→pojistka. Multi-instance / externí-infra pojistky = dokumentovaný limit (L7).

---

## Baseline + pasti prostředí

| Check | Stav | Pozn. |
|---|---|---|
| Vazba nález→pojistka (traceability) | ⬜ **NEEXISTUJE** | kořen — registry jsou lidský text, žádná strojová mapa |
| FE CI workflow | ⬜ **NEEXISTUJE** | jen `deploy.yml`; žádný typecheck/lint/test/audit na PR |
| FE precommit / lint-staged | ⬜ **NEEXISTUJE** | žádná FE síť vůbec |
| 8× `audit:*` scanner v CI | ⬜ **NEEXISTUJE** | všechny G1 papírové (mají `--ci`, nikdo nespouští) |
| BE `ci.yml` testy | ✅ živé | typecheck+lint+jest na push/PR main |
| BE husky pre-commit | ✅ živé | typecheck+lint, **bez testů** |
| BE Stryker | ⚠️ úzký | jen 6 race-fix souborů, ruční běh |
| `anti-regression-scan.mjs` (M-TRACE) | ⬜ postavit (oblast 00) | rozšiřuje vzor [`error-contract-scan.mjs`](../../scripts/error-contract-scan.mjs) |

⚠️ **Pasti (z paměti + recon):**
- **„CI guard ✅" v registru ≠ živý guard.** Většina je G1 (scanner mimo CI). `LIVE` osa musí ověřit
  **reálné zapojení** v `ci.yml`/`pre-commit`, ne zmínku v `.md`.
- **FE testy neběží nikde** ([feedback_fe_no_prettier], [project_fe_test_precommit]) → FE pojistky jsou
  z definice G1, dokud nevznikne FE CI. To je velká část mapy.
- **BE jest flaky paralelně** ([project_be_test_mongo_flaky]) → ověřovací běh `--maxWorkers=2`/`runInBand`.
- **FE build = `npm run build` (tsc -b)**, ne jen `tsc --noEmit` ([project_fe_build_preexisting_errors]).
- **Po BE změně restart** ([feedback_be_restart_required]) — pro M-RUN/M-MUT běhy.
- **Nemíchat BE+FE v jedné dávce** ([feedback_no_mixed_be_fe_batch]) — Fáze B odděleně.
- **Git na uživateli** ([feedback_git_manual]) — audit necommituje sám; práce na `main` ([feedback_work_on_main]).
- **Explore přestřeluje** (paměť napříč audity) → do registru **jen strojově ověřená** čísla z `M-TRACE`,
  ne odhady. Počty nálezů níže jsou orientační, **ověří je scanner ve Fázi A**.
- **Otevřené nálezy (W-7, W-10, DI-02…)** nemají fix → nemají co hlídat. Patří do mapy jako G0 s
  poznámkou „nejdřív fix" — **ne** chyba tohoto auditu, ale jeho výstup (seznam dluhu).
- 🔴 **Tento audit NEpřepisuje cizí fixy.** Jen mapuje, oživuje a ostří pojistky. Pokud `M-MUT` odhalí, že
  fix sám je špatně (test nezčervená protože fix nefunguje), je to **nový nález** → registr + gated oprava.

---

## Orientační objem nálezů (ověří `M-TRACE` ve Fázi A)

> Dle hlaviček registrů; přesná čísla, stavy a stupně G dodá scanner. **Nepřebírat jako fakt.**

| Audit | Prefix | ~Nálezů | Pozn. k pojistce (z registru) |
|---|---|---|---|
| bug-audit | `N` | ~41 | `audit:routes` (G1), mix e2e/unit testů |
| cache-audit | `C` | ~50 | **bez scanneru** — největší G0 riziko |
| cascade-delete | `CD` | ~9 | M-SCAN tool připraven, **neběžel** (DB) |
| db-integrity | `DI` | ~5 | M-TYPE/M-SCAN **neběžel** |
| error-contract | `EC` | ~12 | `audit:errors` + e2e + teeth (G1→nutno CI) |
| form-schema | `F` | ~28 | `export-schemas` + kontraktové testy |
| log-hygiene | `LH` | ~12 | `audit:logs` + M-RUNTIME 6/6 (G1→CI) |
| nav-audit | `NAV` | ~9 | `audit:nav` (G1), 82 FE spec (mimo CI) |
| prod-config | `PC` | ~24 | `audit:config` + env.validation (G1→CI) |
| race-condition | `RC` | ~11 | race-barrier v CI ✅ + Stryker (G3/G4) |
| role-audit | `R` | ~20 | BE jest ✅, **FE role parity chybí** |
| seed-scenario | `SS` | ~1 | boot baseline, bez teeth |
| state-consistency | `S` | ~6 | TLA+ + socket-reconnect spec (G1 FE) |
| upload-media | `UM` | ~16 | **bez CI**, orphan-scan čeká Cloudinary |
| ws-audit | `W` | ~11 | `audit:ws` jen string-match; W-7/W-10 **otevřené** |
| **Σ** | | **~255** | |

---

## Seed kandidáti mezer (hypotézy — verdikt až při běhu M-TRACE)

> Běh každý povýší na `🐛 AR-xx` (mezera), `✅ kryto` (G3+) nebo `⚖️ akceptováno`. Detail →
> [`../anti-regression-audit.md`](../anti-regression-audit.md).

- **K-AR1** `LIVE` 🔴 — 8 scannerů (`audit:*`) má `--ci`, ale **žádný neběží v CI** → všechny audity, co se
  o ně opírají (EC/LH/PC/NAV/WS/bug), jsou reálně **G1**. Systémový kořen. Oblast 01/02.
- **K-AR2** `LIVE` 🔴 — **FE nemá CI ani precommit** → veškeré FE pojistky (vitest 42, nav 82 spec, role
  parity, socket-reconnect) jsou **G1**. Oblast 01.
- **K-AR3** `EX` 🔴 — **cache-audit (C, ~50 nálezů) nemá scanner** → cache-key regrese bez pojistky. Oblast 05.
- **K-AR4** `EX`/`TEETH` 🔴 — **CD-01..04** (blob leak) opraveny, ale M-SCAN **neběžel** → existenci pojistky
  nelze potvrdit. Oblast 04.
- **K-AR5** `TEETH` 🟠 — **R-07** fix ověřen testem **s mockem** (registr) → podezření na bezzubost
  (test projde i s vrácenou chybou). M-MUT. Oblast 03.
- **K-AR6** ~~`EX` 🔴 — W-7, W-10 OTEVŘENÉ~~ → **VYVRÁCENO Fází A**: oba ✅ opravené s regresními testy
  (ws-audit: +11 regr. W-1/W-3/W-10/W-11); W-10 leak = G3. Skutečně otevřených je 27 jiných (viz registr). Oblast 05.
- **K-AR7** `AIM` 🟠 — bug-audit „opraveno + audit:routes" — `audit:routes` ověřuje jen **existenci** route,
  ne authz (N-7/N-8) → AIM gap, nutný cílený authz test. Oblast 03.
- **K-AR8** `CLASS` 🟠 — cache-key mismatch (C-09/C-15) a WS reconnect (S-03/04/05, W-7) jsou **instance
  jednoho kořene** → ověřit, že je chráněn kořen, ne jen instance. Oblast 04/05.
- **K-AR9** `LIVE` 🟠 — **DI-02 vědomě neopraveno** + DI M-TYPE/M-SCAN neběžel → integrity drift bez
  pojistky. Oblast 04.
- **K-AR10** `DUR` 🟡 — `audit:ws`/`audit:routes` jsou **string-match** scannery → křehké vůči přejmenování
  (běží, ale míjí). Oblast 02.
- **K-AR11** `TRACE` 🔴 — **žádná strojová mapa nález→test** existuje → celá traceability je G0; bez ní
  nelze `M-TRACE` ani CI guard. **Nejdřív postavit mapu.** Oblast 00.
- **K-AR12** `TEETH` 🟡 — Stryker scope jen 6 race souborů → teeth jen pro RC; ostatní opravené nálezy
  (EC/LH/F/R) nemají potvrzené zuby. Oblast 06.

---

## Index oblastí (7)

| # | Oblast | Jádro povrchu | Osy |
|---|---|---|---|
| 00 | [Cross-cutting](00-cross-cutting.md) | taxonomie G0–G4, **master matice nález×pojistka** (všech ~255), traceability scanner `M-TRACE`, definice „důležitý", CI realita, pasti | všechny |
| 01 | [CI/precommit živost](01-ci-zivost.md) | systémový kořen — scannery mimo CI, FE bez CI; návrh FE workflow + zapojení scannerů (G1→G2) | `LIVE` |
| 02 | [Vrstva scannerů](02-scannery.md) | 8 scannerů: chytají co tvrdí? mají zuby (mutace vstupu)? jsou trvanlivé (ne string-match)? | `LIVE` `DUR` `TEETH` |
| 03 | [Bezpečnost & authz](03-bezpecnost-authz.md) | N-7/8, R-03/07/08/11, W-10, NAV-06, PC-01/02 — cílený regresní test? bezzubost (R-07 mock)? | `EX` `AIM` `TEETH` |
| 04 | [Data & kaskády](04-data-kaskady.md) | CD-01..04, DI-02/05, F-data, UM blob — pojistka proti znovu-leaku; M-SCAN/M-TYPE oživit | `EX` `CLASS` `TEETH` |
| 05 | [Realtime / cache / state](05-realtime-cache.md) | W-7/10 (otevřené), C-09/15 (bez scanneru), S-xx reconnect — kořen třídy | `EX` `CLASS` `LIVE` |
| 06 | [Ekonomika / race + teeth](06-race-teeth.md) | RC-Exx (má race-barrier+Stryker = vzor G4); rozšířit teeth napříč na EC/LH/F/R | `TEETH` |
| — | [tools/anti-regression-scan](tools/anti-regression-scan.md) | M-TRACE (mapa nález→pojistka→CI) · M-MUT (teeth) · M-CI (živost) | nadstavba |

---

## Pracovní postup

### Fáze A — mapa (read-only, žádné změny kódu)
1. **Tooling** — postav [`tools/anti-regression-scan`](tools/anti-regression-scan.md): M-TRACE parsuje
   všechny `*-audit.md` → kanonický seznam nálezů (ID/severity/stav); načte mapu `nález→pojistka`
   (`anti-regression-map.json`); ověří existenci testu/guardu + jeho zapojení v CI → stupeň G. Oblast 00.
2. **Master matice** — všech ~255 nálezů × G0–G4 do [`../anti-regression-audit.md`](../anti-regression-audit.md);
   zdroj pravdy o stavu obrany. L2–L3.
3. **Sweep oblastí 01–06** — projít mezery, potvrdit/vyvrátit K-ARx, povýšit na `AR-xx`; u důležitých
   ověřit `AIM`/`TEETH` reálným během (M-RUN/M-MUT). L4–L5.
4. **Výstup Fáze A** — kompletní matice + seznam `AR-xx` mezer s prioritou + seznam otevřených dluhů (G0
   bez fixu). **Předložit ke schválení priorit Fáze B.**

### Fáze B — stavění pojistek (gated, každá dávka po souhlasu)
5. **CI oživení** — návrh FE CI workflow + zapojení `audit:*` scannerů jako blocking (G1→G2); nejdřív
   návrh ke schválení. BE+FE odděleně.
6. **Cílené testy** — dostavět chybějící G3 testy pro důležité nálezy po prioritě (bezpečnost → data →
   realtime → zbytek).
7. **Teeth** — rozšířit Stryker scope / ruční reverze na klíčové opravené nálezy → G4.
8. **`M-TRACE` jako CI guard** — `npm run audit:regression` do CI: nový nález bez namapované živé pojistky
   = červená. Tím se kruh uzavře — audit se stává trvalou pojistkou sám pro sebe.

> Každý nález → `AR-xx` s **osa / zdrojový nález / stupeň G / pojistka (soubor:řádek) / živá v CI? / má
> zuby? / vratné?**; opravy/nové testy **gated souhlasem**, BE+FE nemíchat, git na uživateli.

---

## Legenda statusů

- ⬜ nezmapováno · ✅ kryto (G3+, živé+cílené) · 🐛 mezera → [`../anti-regression-audit.md`](../anti-regression-audit.md) (`AR-xx`) · ⚖️ akceptováno · ⏭️ blokované/`[human]`
- Stupně: **G0** žádná · **G1** papírová · **G2** živá statická · **G3** živý cílený test · **G4** ozubená
- `K-ARx` seed kandidát mezery (hypotéza, verdikt až při běhu)
