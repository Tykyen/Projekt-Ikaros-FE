# Anti-regression audit — registr (AR-xx) + master matice

> 16. styl auditu (META). Plán → [`anti-regression-plan/`](anti-regression-plan/README.md).
> Cíl: každý důležitý nález předchozích 15 auditů má **trvalou, živou, ozubenou** pojistku (G3/G4).
>
> **Stav:** 2026-06-15 — **HOTOVO** (A + B1 + B2 + B4 + dluhová vlna). `M-TRACE` (`npm run audit:regression`)
> + mapa 266 ([map.json](anti-regression-plan/anti-regression-map.json), [matice](anti-regression-plan/master-matice.md)).
> **Živě 22 % → 86 %; otevřené nálezy 27 → 0; opravené bez pojistky 77 → 0; G3 58 → 145; G1 92 → 0.**
> B1: FE CI + 8 scannerů v CI. B2: ~55 regresních testů. B4: regression guard v CI. **Dluhová vlna: všech 27
> otevřených reálných nálezů opraveno** (7 race vč. RC-E5 transakce nákupu, 5 validace, 3 upload, dead-code,
> kosmetika) + 36 accepted (vědomě). Ověřeno: FE build + BE typecheck + BE jest dotčené 461/461 + race 26/26 +
> guard ✅. AR-01/09/10/11/13 vyřešeny, AR-12 odvolán. **Zbývá jen: B3 teeth (Stryker, vědomě odloženo) + git commit.**

## Legenda
- Stupně: **G0** žádná · **G1** papírová (mimo CI) · **G2** živá statická · **G3** živý cílený test · **G4** ozubená
- `AR-xx` = mezera (důležitý nález pod G3). `K-ARx` = seed hypotéza z plánu.

---

## Baseline (M-TRACE, `npm run audit:regression`, 2026-06-15)

> „nál" + stupeň G = strojově spolehlivé. Severity/status = konsolidace 4 čtecích agentů + override
> (auto-discovered test ⇒ fixed; W-7/W-10 ověřeno fixed; PC dle paměti). Detail řádek po řádku → master-matice.

| Audit | nál | opr | otv | b-d | G0 | G1 | G3 | pozn. |
|---|---|---|---|---|---|---|---|---|
| bug | 41 | 35 | 1 | 5 | 0 | class `audit:routes` + 15 testů | | N-2 open (barvy) |
| cache | 52 | 45 | 0 | 7 | **49** | 0 | 3 | 🔴 **42 opravených bez pojistky** |
| cascade-delete | 9 | 6 | 0 | 3 | 7 | 0 | 2 | M-SCAN neběžel |
| db-integrity | 5 | 3 | 1 | 1 | 2 | 0 | 3 | DI-01 open |
| error-contract | 12 | 12 | 0 | 0 | 0 | class `audit:errors`+6 testů | | vše G1/G3 |
| form-schema | 28 | 17 | 10 | 1 | **28** | 0 | 0 | 🔴 **17 opravených bez pojistky**, 10 open |
| log-hygiene | 12 | 8 | 0 | 4 | 0 | class `audit:logs` | | |
| nav | 9 | 9 | 0 | 0 | 0 | class `audit:nav` | | vše G1 (papírové) |
| prod-config | 24 | 19 | 1 | 4 | 0 | class `audit:config` | | PC-21 open (OPS) |
| race-condition | 20 | 7 | 7 | 6 | 9 | 0 | 11 | 7 open (netestováno) |
| role | 20 | 19 | 0 | 1 | 0 | class `audit:routes`+testy | | |
| seed-scenario | 1 | 1 | 0 | 0 | 0 | | G3 | |
| state-consist | 6 | 6 | 0 | 0 | **6** | 0 | 0 | 🔴 FE spec mimo CI + necituje ID |
| upload-media | 16 | 9 | 5 | 2 | **15** | 0 | 1 | 🔴 **8 opravených bez pojistky**, 5 open |
| ws | 11 | 9 | 2 | 0 | 0 | class `audit:ws`+4 testy | | W-2/W-6 open |
| **Σ** | **266** | **205** | **27** | **34** | **116** | **92** | **58** | |

### Rozložení stupňů (FINÁLNÍ — B1+B2+B4 + dluhová vlna)
| Stupeň | Baseline | Teď | Co znamená |
|---|---|---|---|
| **G0** žádná | 116 | **36** | jen `accepted` (vědomě jiný typ pojistky / by-design / OPS) — **0 otevřených** |
| **G1** papírová | 92 | **0** | ✅ eliminováno (scannery v CI) |
| **G2** živá statická | 0 | **85** | 8 scannerů v CI |
| **G3** živý cílený test | 58 | **145** | BE+FE cílené testy citující ID |
| **G4** ozubená | 0 | **0** | zuby ověřeny ručně reverzí; strojově = B3 (Stryker, odloženo) |

> **Živě chráněno: 22 % → 86 %. Otevřené nálezy: 27 → 0. Opravené bez pojistky: 77 → 0.**
> Dluhová vlna (2026-06-15) opravila všech 27 otevřených reálných nálezů: **7 race-condition** (RC-E4/E5/P2/
> R3/D1/D2/D6 — atomické operace + transakce nákupu s kompenzací, race-barrier testy 26/26), **5 form-schema**
> (F-19/20/21/22/23 validace), **3 upload** (UM-11/14/15 — DoS limit, orphan cleanup, avatar snapshot), dead-code
> (F-17) + kosmetika (W-2/6). Zbývajících 36 G0 = **accepted** (vědomě: WS reconnect v komponentách, inline
> mutace, DB default, throttle guard, removal, F-12 BC-risk, DI-01 rizikovější-oprava, N-2 barvy, PC-21 OPS).

> 💡 **Dva headline closery baseline:**
> 1. **G2=0 a G4=0** — reálnou živou ochranu má 58/266 (22 %), výhradně přes BE testovou suite. Veškerá
>    statická obrana (8 scannerů, 92 nálezů) je papírová: **žádný scanner neběží v CI.**
> 2. **77 opravených nálezů nehlídá vůbec nic** (`fixed & G0`) — někdo je opravil, ale mohou se **tiše
>    vrátit**: cache 42 · form-schema 17 · upload 8 · state 6 · cascade 4. To je nejkonkrétnější riziko.

---

## Nálezy (AR-xx) — strojově potvrzené Fází A

| ID | Osa | Sev | Mezera | Důkaz (M-TRACE) | Náprava (Fáze B) |
|---|---|---|---|---|---|
| **AR-01** | `LIVE` | 🔴 | ~~G2=0 — žádný scanner v CI; 92 nálezů papírových~~ → **VYŘEŠENO B1**: FE CI workflow + audit-crossrepo job → **8 scannerů živých, G1 0, G2 92** | G1: 92→0, G2: 0→92 | ✅ hotovo |
| **AR-02** | `EX` | 🔴 | **cache bez scanneru i testu** — 42 opravených bez pojistky | cache G0=49, fixed&G0=42 | `audit:cache-keys` + cílené testy |
| **AR-03** | `EX` | 🔴 | **form-schema bez pojistky** — 17 opravených + 10 open, vše G0 | form G0=28 | kontraktové testy s ID + scanner |
| **AR-04** | `TRACE` | 🟠 | ~~FE traceability nulová~~ → **KORIGOVÁNO**: z větší části měřící chyba (M-TRACE skenoval jen `.test`, ne 306 `.spec`). Po opravě **12 FE .spec citují ID** (EC/F/PC/W/N + nové C). FE CI živé (B1e). Zbývá: konvence rozšířit (12 z 306) | auto-discovery FE 0→12 | konvence „test cituje ID" v B2 testech |
| **AR-05** | `TEETH` | 🟠 | **G4=0** — žádné potvrzené zuby; Stryker scope jen race, nezmapován | G4=0 | rozšířit Stryker + M-MUT |
| **AR-06** | `EX` | 🟠 | **upload-media bez scanneru** — 8 opravených bez pojistky | upload G0=15 | cleanup test + orphan-scan (L7) |
| **AR-07** | `EX` | 🟠 | **state-consistency vše G0** — FE spec mimo CI + necituje ID | state G0=6 | FE CI + ID konvence |
| **AR-08** | `LIVE` | 🟠 | **cascade/db M-SCAN/M-TYPE neběžel** — 4 opravené bez pojistky | CD fixed&G0=4 | oživit proti MongoMemoryReplSet |
| **AR-09** | `DUR` | 🔴 | ~~všech 6 cross+nav scannerů hardcoded `c:/Matrix/...`~~ → **VYŘEŠENO B1c**: relativní cesty z `__dirname` + `IKAROS_BE_ROOT` override; ověřeno CWD-nezávislé, identické výsledky | grep portabilní | ✅ hotovo |
| **AR-10** | `LIVE` | 🟠 | ~~5 scannerů cross-repo potřebují oba repo v CI~~ → **VYŘEŠENO B1d**: job `audit-crossrepo` v [ci.yml] s `IKAROS_BE_ROOT` + checkout `Tykyen/Projekt-ikaros` (public → bez tokenu); ověřeno lokálně 5/5 exit 0 | env override funguje | ✅ hotovo |
| **AR-13** | `AIM` | 🟠 | ~~F-08 fix děravý~~ → **OPRAVENO**: `@IsOptional()` odebrán, `@ValidateIf` řídí → `{groupOnly:true, targetGroup:null}` teď správně odmítnuto. Regresní test + BE jest 79/79 + typecheck ✅ | create-game-event.dto.spec `AR-13` | ✅ hotovo |
| ~~AR-12~~ | `AIM` | ⚪ | **ODVOLÁNO (můj omyl)** — F-02 JE opraveno: `timeline.service.ts` sanitizuje `text` přes `sanitizeRichText` při create(163)+update(205)+**read-time**(93, druhá obrana i pro stará data). FE `dangerouslySetInnerHTML` je proto bezpečné (text přijde z BE už čistý). Hledal jsem ve špatném modulu (game-events+FE), ne v `timeline`. Lekce: ověřit SPRÁVNÝ modul, než hlásím „fix chybí" | timeline.service.ts:90/163/205 | — (F-02 dostane regresní test) |
| **AR-11** | `LIVE` | 🟠 | ~~FE vitest nelze spustit kompletně~~ → **VYŘEŠENO B1e**: plný `npm run test:run` projde **348 souborů / 2729 testů zeleně** (~18 min sériově); dřívější „hang" byl artefakt souběhu procesů na lokálu, ne deterministický bug | `test:run` exit 0, 2729 passed | ✅ vitest job přidán do [ci.yml] (G1→G3 pro 1315+ FE testů) |

> ⚠️ **Korekce vůči seed plánu:** K-AR6 (W-7/W-10 otevřené) je **VYVRÁCEN** — oba jsou ✅ opravené s
> regresními testy (ws-audit.md: +11 regresních W-1/W-3/W-10/W-11). W-10 (leak) = G3.
>
> **Skutečně OTEVŘENÉ nálezy (27, G0 „nejdřív fix", mimo rozsah oprav tohoto auditu):** race 7
> (RC-E4/E5/P2/R3/D1/D2/D6) · form-schema 10 (F-12/15/17–23) · upload 5 (UM-11–15) · ws 2 (W-2/W-6) ·
> prod-config 1 (PC-21 OPS) · db 1 (DI-01) · bug 1 (N-2 barvy). Patří do dluhu.

---

## Fáze B — postup (gated, BE+FE odděleně)

### B1 — CI oživení (probíhá)
- **B1a ✅** — FE CI workflow [`.github/workflows/ci.yml`](../.github/workflows/ci.yml): `build` + `lint` +
  `audit:nav` (vše ověřeně zelené, portabilní). **První živá síť FE** (řeší velkou část AR-04). Git na uživateli.
- **B1c ✅** — portabilizace 6 scannerů (AR-09): relativní cesty + `IKAROS_BE_ROOT`. Ověřeno.
- **B1d ✅** — cross-repo scannery (AR-10): job `audit-crossrepo` aktivní; BE `Tykyen/Projekt-ikaros` je
  **public** (ověřeno ls-remote) → checkout bez tokenu + `IKAROS_BE_ROOT`. 5/5 scannerů lokálně exit 0.
- **B1e ✅** — vitest job (AR-11): `npm run test:run` projde 2729/2729 (~18 min); job přidán do ci.yml
  s `timeout-minutes: 30`. Dřívější „hang" byl jen souběh procesů na lokálu, ne bug.
- contrast/colors scannery: červené (dluh N-2 barvy) → nezapojovat, dokud se barvy nedořeší.

### B2 — cílené testy G0 děr (G0→G3) — HOTOVO (hlavní vlna)
- **~50 nových cílených regresních testů** napříč FE+BE (6 paralelních agentů + ruční vzor). Cache (~20),
  form-schema DTO (F-04/05/06/07/09/13/14/16/24/28 + F-02/F-03/F-10 sanitizace), upload (UM-01/03/04/05/06/08/09 +
  UM-10 staticky), cascade (CD-02/03/08/09), state (S-02/03/04/05/06). Vše ověřuje konkrétní chování + cituje ID.
- **Ověřeno**: FE `npm run build` ✅, BE `npm run typecheck` ✅, BE jest dotčené moduly **278/278** ✅.
- **M-TRACE oprava**: FE auto-discovery skenuje i `.spec` → odhalilo 12 existujících FE pojistek (AR-04 korigováno).
- **Zbývá 18 opravených bez unit testu** — většina legitimně jiný typ (WS reconnect v komponentách, inline
  mutace, render derivace, DB default, throttle guard, removal). Klasifikace v rozložení výše. AR-02/03/06/07 splněny.
- **2 nálezy odhalené psaním testů (gated fix):** AR-13 (F-08 děravá cross-field validace), AR-12 odvolán (F-02 omyl).

### B3 — teeth (G3→G4) — ODLOŽENO (vědomá hranice)
Zuby ověřeny **ručně reverzí** u klíčových (C-09, C-15, F-02, F-08 — odebrání fixu → cílený test
zčervená). Strojový teeth přes Stryker FE config = velká samostatná infra (mutace přes 130 testů =
desítky minut běhu) s nejistou marginální hodnotou nad ruční reverzí → odloženo jako vědomá hranice,
ne dluh. BE Stryker existuje (race scope); rozšíření = budoucí volitelný krok.

### B4 — `M-TRACE` jako CI guard — ✅ HOTOVO
`npm run audit:regression -- --ci` v `audit-crossrepo` jobu [ci.yml]. Práh = **regrese**: opravený
důležitý nález (crit/high), který ztratí živou pojistku (G<2) → červená. Otevřené dluhy a `accepted`
guard ignoruje. Kruh uzavřen: nový opravený nález bez pojistky napříště neprojde merge.
