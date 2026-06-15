# 00 — Cross-cutting: taxonomie, master matice, traceability nástroj

> Definuje **jazyk** celého auditu (stupně G0–G4, definice „důležitý"), staví **master matici** všech
> ~255 nálezů × stupeň pojistky, a **traceability nástroj** `M-TRACE`, který matici drží strojově. Bez
> téhle oblasti je zbytek auditu jen lidský odhad. Cíl: L2 (existence strojově) → L3 (živost).

---

## 1. Stupně pojistky G0–G4 (kanonická definice)

| G | Název | Test existuje? | Běží automaticky? | Cílí na nález? | Má zuby? |
|---|---|---|---|---|---|
| **G0** | žádná | ne | — | — | — |
| **G1** | papírová | ano | **ne** | (jedno) | (jedno) |
| **G2** | živá statická | ano (scanner/lint) | ano (CI/precommit) | obecně | částečně |
| **G3** | živý cílený test | ano | ano | **ano** | ne |
| **G4** | ozubená | ano | ano | ano | **ano** |

Hraniční pravidla (aby klasifikace nebyla subjektivní):
- **Scanner s `--ci`, ale mimo workflow = G1**, ne G2. Rozhoduje zapojení v `ci.yml`/`pre-commit`, ne
  schopnost selhat.
- **FE test (vitest) = max G1**, dokud FE nemá CI — bez ohledu na kvalitu testu. (Po Fázi B se přehodnotí.)
- **Test, který projde i po reverzi fixu = max G3 se ⚠️ TEETH-FAIL**, nikdy G4. M-MUT to musí potvrdit.
- **Scanner string-match (`audit:ws`/`audit:routes`) = G2 se ⚠️ DUR-RISK** — chytá drift, ale přejmenování
  ho obejde; není ekvivalent cíleného testu.

---

## 2. Definice „důležitý nález" (kam jde hloubka G3/G4)

Mapa G se dělá pro **všech ~255**. Hloubková práce (dotáhnout na G3/G4) cílí na **důležité**, definované
deterministicky (ne dojmem):

Nález je **důležitý**, pokud splní **aspoň jedno**:
1. severity 🔴 nebo 🟠 ve zdrojovém registru, **nebo**
2. třída = bezpečnost / authz / data-integrita / peníze (RC ekonomika), **nebo**
3. stav = **OTEVŘENÝ** (G0, ještě bez fixu — patří do dluhu), **nebo**
4. je **kořenem třídy** (víc nálezů sdílí jeden mechanismus — cache-key, WS reconnect, orphan blob).

> Uživatel zvolil **mapu i hloubku pro všech ~255** (varianta „úplně všech"); priorita pořadí práce ale
> jede podle důležitosti výše. 🟡 instance, které kořen už pokrývá, se uzavřou odkazem na chráněný kořen
> (CLASS), ne duplicitním testem.

---

## 3. Master matice nález × pojistka (jádro výstupu)

Žije v [`../anti-regression-audit.md`](../anti-regression-audit.md). Jeden řádek = jeden nález:

| Sloupec | Obsah |
|---|---|
| `ID` | původní (`N-7`, `RC-E2`, `CD-01`…) |
| `Audit` | zdrojový styl |
| `Sev` | 🔴/🟠/🟡 z registru |
| `Stav` | opraveno / otevřeno / by-design |
| `Třída` | bezpečnost / data / realtime / config / contract / money / nav / log / media |
| `Pojistka` | soubor:řádek testu/scanneru, nebo `—` |
| `G` | G0–G4 |
| `LIVE` | běží v CI/precommit? (ano/ne/N/A) |
| `TEETH` | mutace potvrdila? (ano/ne/netest.) |
| `AR-xx` | číslo mezery, pokud G<3 u důležitého |
| `Pozn.` | CLASS kořen, DUR riziko, „nejdřív fix" apod. |

Matice je **generovaná z** `anti-regression-map.json` (vstup pro M-TRACE), ne ručně psaná — aby se
nerozešla. `.md` je render mapy + lidský komentář.

---

## 4. `M-TRACE` — traceability scanner (postavit první)

Detail → [`tools/anti-regression-scan`](tools/anti-regression-scan.md). Shrnutí kroků:

1. **Sklízej nálezy** — parsuj všech 15 `*-audit.md`: vytáhni ID, severity, stav. Výstup: kanonický seznam
   (toto je strojový zdroj počtu ~255, ne odhad).
2. **Načti mapu** — `anti-regression-map.json`: ruční/poloautomatická vazba `ID → {test, scanner, ci}`.
3. **Ověř existenci** — že odkazovaný test/scanner soubor existuje a obsahuje očekávaný symbol (název
   testu / `it('...')` / ID v komentáři). `EX`.
4. **Ověř živost** — je ten test v `npm test` cestě? je scanner v `ci.yml`/`pre-commit`? `LIVE` → G1 vs G2/G3.
5. **Spočti G** — per nález dle pravidel §1.
6. **Report + exit** — tabulka G rozložení; `--ci` → exit 1, pokud **důležitý** nález klesne pod práh
   (default G0/G1 u důležitého = fail). Tím se stává CI guardem (`npm run audit:regression`).

> 💡 **Proč mapa jako JSON, ne jen `.md`:** strojová vazba přežije refactor a jde validovat v CI. `.md`
> registr je render. Bez JSON mapy je traceability G0 (žije v paměti) — to je K-AR11, kořen tohoto auditu.

---

## 5. `M-MUT` — teeth (ověř zuby)

Pro nález s tvrzeným G3, který chceme povýšit na G4:
1. Lokalizuj fix (commit / hunk podle registru).
2. **Reverze** — odeber fix (ruční revert hunku v pracovním stromu, **necommitovat**).
3. Spusť cílený test → **musí zčervenat**. Zelená = TEETH-FAIL → nález `AR-xx` (bezzubý test).
4. Vrať fix. U RC reuse existující `stryker.conf.json`; pro ostatní buď rozšířit scope, nebo ruční reverze.

⚠️ Mutace/reverze jen v pracovním stromu, nikdy commit. BE restart po změně ([feedback_be_restart_required]).

---

## 6. CI realita (zdroj pravdy — ne dokumentace auditů)

| Vrstva | BE | FE |
|---|---|---|
| Workflow na push/PR | ✅ [ci.yml]: typecheck+lint+`npm test` | 🔴 **žádný** (jen deploy.yml) |
| Precommit (husky) | ✅ typecheck+lint (bez testů) | 🔴 **žádný** |
| `audit:*` scannery v CI | 🔴 žádný | 🔴 žádný (8 scannerů G1) |
| Mutace (Stryker) | ⚠️ ruční, scope 6 race souborů | 🔴 nenakonfigurováno |

> To je baseline. Každé „G2/G3" v matici se měří **proti téhle tabulce**, ne proti tvrzení v registru.

---

## 7. Pasti (viz též README)

- „CI guard ✅" v registru je skoro vždy G1 — ověřuj `LIVE` proti §6.
- Explore přestřeluje počty → do matice jen čísla z M-TRACE.
- Otevřené nálezy = G0 „nejdřív fix", ne chyba tohoto auditu.
- Nepřepisovat cizí fixy; bezzubost = nový `AR-xx`, ne tichá oprava.
- BE jest flaky paralelně → `--maxWorkers=2` pro ověřovací běhy.

## 8. Výstup oblasti
- `anti-regression-scan.mjs` (M-TRACE) běží na L2.
- `anti-regression-map.json` v1 (kostra mapy, plní se v oblastech 01–06).
- Master matice v [`../anti-regression-audit.md`](../anti-regression-audit.md) — všech ~255 řádků, stupeň G.
