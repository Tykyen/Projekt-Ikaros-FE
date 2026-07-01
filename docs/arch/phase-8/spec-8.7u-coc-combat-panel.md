# Spec 8.7u — Call of Cthulhu: bojový panel (TM) + percentilový roll engine

**Status:** 🚧 schválen vizuál (HTML prototyp `c:\tmp\coc-mapa-audit.html`, 2026-07-01) — implementováno, build+testy zelené, čeká živé ověření po deployi.
**Navazuje na:** 8.7t (deník). **Vzor:** GURPS 8.7q (combat panel) + `rollTarget`/`rollUnder` (roll-under engine).

## 1. Cíl

Redesign legacy CoC combat panelu (10.2c) do horror-dossier jazyka deníku 8.7t a **doplnění CoC úrovní úspěchu do roll enginu** — bez nich byl hod v CoC jen zavádějící číslo (`total = hod + %`).

## 2. Percentilový roll engine (CoC „1k100 pod cíl")

Analogie GURPS `rollTarget` (3k6 pod cíl), jiná kostka. **Aditivní, BC:** `kind:'d100'` bez `target` = starý součtový d100; s `target` = percentile.

- `rollEngine.ts` — `rollPercentile(target)` → `PercentileResult { roll, tens, ones, target, level, success }`. Úrovně:
  - `01` = kritický úspěch (vždy) · `≤ ⅕` extrémní · `≤ ½` výrazný · `≤ cíl` běžný · `> cíl` neúspěch
  - **krach:** `100` (vždy), nebo `96–99` když cíl < 50
  - `PERCENTILE_LEVEL_LABEL` (CZ názvy, 1 zdroj pravdy).
- `dicePayload.ts` — `percentile?: {target, level, success}` na base + `buildPercentilePayload` (`type:'d100'`, sum/total = hod, bez modifieru).
- `rollFromSheet.ts` (mapa) + `rollFromDiary.ts` (chat) — větev `kind:'d100' && target != null` → percentile.
- `DiceLogPanel.tsx` + `DiceRollOverlay.tsx` — render `percentile` (hod vs cíl → úroveň úspěchu). **Reuse barev** `critSuccess/totalPositive/totalNegative/critFail` (0 nových CSS tříd): krit/extrém→critSuccess, výrazný/běžný→totalPositive, neúspěch→totalNegative, krach→critFail.

## 3. Bojový panel (`CocCombatPanel`)

Herní pult — hází se odsud:
- **Vitals:** Životy + Příčetnost = bar + `±` (rychlé zranění / ztráta SAN, debounce 500ms draft), Magie + Štěstí malé.
- **Klik na vlastnost / dovednost / zbraň** → `onRoll({kind:'d100', target: %})`.
- **Iniciativa = OBR** → `onRoll({kind:'flat', modifier: OBR, initiative:true})` (v CoC se nehází, jen řadí).
- Status pečeti (5 flagů, immediate patch), Boj derived (Pohyb/Stavba/Úhyb/BZ).
- Data `coc_*` beze změny; HP bar na tokenu už jede (`resolveCharacterHp` case `coc`).
- HP/SAN bar fill = CSS gradient (ne inline — past sablona-skiny §9.15); font bez `@import` (CSP, CH-027).

## 4. Akceptační kritéria (DoD)

1. Panel = horror-dossier (sladěno s deníkem), bojové minimum.
2. Hod z panelu → dicelog/3D readout ukáže **CoC úroveň úspěchu** (Extrémní/Výrazný/Běžný/Neúspěch/Krach), ne holé číslo.
3. Percentile BC: ostatní d100 (bez target) i ostatní systémy netknuté.
4. Build čistý · rollEngine 41 · CocCombatPanel 15 · DiceLogPanel 8 · DiceRollOverlay readout 7 · ESLint čistý.
5. Živé ověření na mapě + v chatu (po deployi).

**Odloženo:** bestie panel (fáze 4) + chat propsání (fáze 5) + 8 skinů (skill `skin`).
