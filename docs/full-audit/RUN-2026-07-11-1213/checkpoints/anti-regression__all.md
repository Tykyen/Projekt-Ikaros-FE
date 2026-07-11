# checkpoint — anti-regression (16. styl, META, prefix AR-), RUN 2026-07-11-1213

STATUS: DONE · READ-ONLY (nic needitováno) · FE=Projekt-ikaros-FE, BE=Projekt-ikaros/backend
Přečteno: `anti-regression-plan/` README + 00–06 + `tools/anti-regression-scan.md` + `master-matice.md`
+ `anti-regression-map.json` + registr `anti-regression-audit.md` + zdrojový skript `scripts/anti-regression-scan.mjs`.
Spuštěno: `node scripts/anti-regression-scan.mjs` (report) + `--json` + `--emit-matrix` (NE `--ci`, dle zadání).
Ověřeno grepem: F-20, R-02, F-17, F-25 citace v BE testech; N-42 v registru.

## TL;DR
- **#🆕 = 3** (N-RUN nález N-42 nově v registru s fantomovou známkou · 2 META-nálezy o samotné pojistkové vrstvě).
- **🔓 nejrizikovější tichá regrese: `F-20`** — od baseline (2026-06-15) **ztratil cílený test: G3 → G0**. `create-bestie.dto.spec.ts` už F-20 necituje (cituje jen F-09). Fix (schema `@ValidateNested` na `abilities[]`) může být v kódu, ale **nic ho strojově nehlídá** → může se tiše vrátit. Severity 🟡 → **`audit:regression --ci` ho NEchytí** (práh jen crit/high).
- **🔓 `R-02` degradace G3 → G2** — `characters.service.spec.ts` už R-02 necituje; spadl na class-scanner `audit:routes` (obecné krytí, ztráta cíleného behaviorálního testu / AIM).
- **KOŘEN (META):** `anti-regression-map.json` má **0 ručních guardů ve všech 266 záznamech** — celá traceability visí VÝHRADNĚ na auto-discovery „test textově obsahuje ID nálezu". Jakýkoli refactor, co odstraní ID-komentář, tiše degraduje pojistku (přesně to se stalo F-20 i R-02). To je realizace `DUR` rizika, před kterým audit sám varoval.
- **11 „důležitých bez G≥2" NENÍ regrese** — všech 11 je `accepted`/`bydesign` (0× `fixed`) → CI guard je záměrně ignoruje, sedí s registrem (36+ accepted G0). ♻️ známé.
- Guard `--ci` by proběhl **ZELENĚ** i přes ztrátu F-20 (blind spot na `med`).

---

## M-TRACE — reprodukovaná čísla (2026-07-11)

```
Nálezů celkem: 267   (baseline 266 → +1 = N-42)
Stupně G: G0=37  G1=0  G2=85  G3=145  G4=0
Důležitých nálezů: 131; z toho bez živé pojistky (G<2): 11
🔴 Opravené nálezy bez JAKÉKOLI pojistky (fixed & G0): 3
Auto-discovery: 145 nálezů má test citující ID; 85 jen class-scanner (G1→v CI G2)
Pojistek v ruční mapě (guards[]): 0 z 266
```

Registr `anti-regression-audit.md` tvrdí „HOTOVO, G1 0, opravené bez pojistky 77→0". To **platilo k baseline**; od té doby došlo k **driftu** (viz níže). Registr NEaktualizován.

---

## Drift od baseline (master-matice.md 2026-06-15 → dnešní `--emit-matrix`)

| ID | Baseline | Teď | Typ | Poznámka |
|---|---|---|---|---|
| **F-20** | G3 (be:.../create-bestie.dto.spec.ts) | **G0 —** | 🔓 **ztráta pojistky** | spec cituje jen F-09; F-20 komentář zmizel. `fixed`, 🟡. **Tichá regrese, guard nechytí.** |
| **R-02** | G3 (be:characters.service.spec.ts) | **G2 (class:audit:routes)** | 🔓 degradace | ztráta cíleného testu → jen obecné route-krytí (AIM↓) |
| **N-42** | — (neexistoval) | G2 (class:audit:routes) | 🆕 nový + fantomová známka | viz META-1 |
| PC-08 | G2 | G3 | ⬆️ zlepšení | (nový test cituje ID) |
| R-20 | G2 | G3 | ⬆️ zlepšení | (nový test cituje ID) |

IDs zmizelé z registrů: 0. Baseline 266 → teď 267 IDs.

---

## Nálezy bez pojistky (kompletní seznam — riziko tiché regrese)

### A) `fixed` & G0 — opravené, NIC nehlídá (3)
| ID | Sev | Třída | Stav pojistky | Klasifikace |
|---|---|---|---|---|
| **F-20** | 🟡 | data | **byl G3, teď G0** (test přestal citovat ID) | 🔓 |
| F-17 | 🟡 | cache | G0 už od baseline; registr tvrdí „+ regresní test / ověřeno", ale **žádný test F-17 necituje** → claim nedohledatelný | ♻️ (TRACE gap) |
| F-25 | `?` | config | G0 už od baseline; stejný nesoulad (note tvrdí test, M-TRACE nenachází) | ♻️ (TRACE gap) |

> Poznámka: registrové poznámky u F-17/F-20/F-25 „Opraveno + regresní test / ověřeno" jsou v rozporu s G0. Buď test neexistuje, nebo necituje ID (auto-discovery ho nevidí). U F-20 prokázáno, že test **existoval a citaci ztratil**.

### B) `important` (sev 🔴/🟠 nebo open) & G<2 (11) — VŠECHNY accepted/bydesign, guard je záměrně přehlíží
| ID | Sev | Stav | Důvod G0 (z registru) | Klasifikace |
|---|---|---|---|---|
| C-55 | 🟠 | bydesign | by-design | ♻️ |
| C-05 | 🟠 | accepted | WS reconnect handler v ChatRoom → e2e krytí, unit křehký | ♻️ |
| C-07 | 🟠 | accepted | WS reconnect refetch v useUnreadSync → reconnect callback | ♻️ |
| C-46 | 🟠 | accepted | WS reconnect (bell feed) v komponentě | ♻️ |
| C-24 | 🟠 | accepted | inline optimistic v 1500-řádk. TacticalMapView, klíč pokryt jinde | ♻️ |
| C-40 | 🟠 | accepted | render-time derivace z query, žádná cache mutace | ♻️ |
| C-27 | 🟠 | accepted | jotai hydration most, by-design | ♻️ |
| CD-05 | 🟠 | bydesign | by-design | ♻️ |
| RC-E6 | 🟠 | bydesign | by-design | ♻️ |
| UM-10 | 🟠 | accepted | @Throttle decorator guard na /upload — staticky ověřeno | ♻️ |
| UM-02 | 🟠 | bydesign | by-design (privátní media URL) | ♻️ |

Žádný z těchto 11 není `fixed` → `--ci` (práh `fixed && crit|high && g<2`) je nezahrnuje. Konzistentní. Riziko = jen že „accepted, jiný typ pojistky" nemá strojovou stopu, kde ta jiná pojistka je (žije v poznámce, ne v mapě).

---

## META-nálezy (nová třída — o samotné pojistkové vrstvě)

### AR-META-1 🆕 `DUR`/`TRACE` 🟠 — mapa má 0 ručních guardů, vše na string-match auto-discovery
`anti-regression-map.json`: 266 záznamů, **withManualGuards = 0**. `grade()` proto počítá výhradně z (a) testů, co textově obsahují ID, (b) class-scannerů. Celá „strojová vazba nález→pojistka" = křehký grep. Odstranění ID-komentáře při refactoru = tichá degradace (F-20, R-02 = důkaz, že se to už DĚJE). Audit sám (00 §1, plán README) označil string-match za `DUR-RISK` u `audit:ws`/`audit:routes` — ale jeho **vlastní** páteř je 100 % string-match bez durable zálohy (guard neváže na soubor:symbol s fallbackem).
**Návrh (gated):** doplnit skutečné `guards: [{kind:test, file, symbol}]` do map.json aspoň pro důležité `fixed` nálezy → přežije přejmenování testu líp než holé ID v komentáři; nebo přidat lint „když spec pokrývá known-ID chování, musí ID citovat".

### AR-META-2 🆕 `LIVE` 🟠 — CI guard má slepé místo na `med` severity
`--ci` fail práh = `fixed && (crit|high) && g<2`. F-20 (`fixed`, 🟡, **G0** = totální ztráta pojistky) **projde zeleně**. Tj. tichá regrese med-nálezu je pro guard neviditelná — přesně proti účelu auditu („když někdo vrátí chybu, zčervená před mergem"). Guard chrání jen crit/high.
**Návrh (gated):** rozšířit práh na `fixed && g<2` s výjimkovým whitelistem accepted/bydesign (které jsou vědomě G0), nebo aspoň med-warn (nefail) do reportu.

### AR-META-3 🆕 `AIM` 🟡 — N-42 fantomová známka G2
N-42 (nový, 🟡, `modre-nebe` CSS `prefers-reduced-motion` WCAG) dostal G2 přes `class:audit:routes`. Ale `audit:routes` je HTTP-route-kontrakt scanner — **s CSS reduced-motion nemá nic společného**. Class-scanner fallback tak uděluje „živou statickou pojistku" nálezům, které fakticky nehlídá. AIM=0 maskované jako G2. Nízká závažnost, ale systémový vzor: každý bug/role nález bez cíleného testu dostane „G2 audit:routes" bez ohledu na relevanci.

---

## Verdikt

- **Traceability drží z ~99 %**, ALE demonstrovatelně **teče** (F-20, R-02) mechanismem, který audit označil za riziko a přesto na něm celý staví (AR-META-1).
- **Priorita 1 (🔓):** F-20 — obnovit citaci ID v `create-bestie.dto.spec.ts` (nebo doplnit guard do map.json). Tichá, guardem nechycená.
- **Priorita 2 (🔓):** R-02 — obnovit cílený test v `characters.service.spec.ts`.
- **Priorita 3 (🆕 META):** rozšířit `--ci` práh na med (AR-META-2) + naplnit map.json guardy (AR-META-1) — jinak se stejná ztráta bude opakovat neviditelně.
- **Registr `anti-regression-audit.md` je zastaralý** vůči HEAD (tvrdí 266/„opravené bez pojistky 0"; realita 267/3 fixed&G0 + 2 degradace). Doporučeno přegenerovat matici + dopsat drift.
- 11 „important G<2" = ⚖️ accepted/bydesign, bez akce (jen chybí strojová stopa jejich „jiné" pojistky).
