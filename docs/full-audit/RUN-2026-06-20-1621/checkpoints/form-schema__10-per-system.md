# form-schema / 10-per-system — checkpoint RUN-2026-06-20-1621

## Pokrytí

Přečteno:
- Všech 17 FE JSON schémat (`src/features/world/tactical-map/schemas/<system>/*.json`)
- `registry.ts`, `bootstrap.ts`, `types.ts`, `validateSystemStats.ts` (FE)
- `schema-registry.service.ts`, `system-stats-validator.service.ts`, `system-entity-schema.types.ts` (BE)
- `map-operations.service.ts` (write path tokeny, řádky 540–640, 1244–1307)
- `bestiae.service.ts` (write path bestie, create + update)
- `buildSpawnToken.ts` (spawn logika)
- `BestiePanelView.tsx` (save + initiative roll)
- `hpTier.ts`, `EntityStatbar.tsx`, `InitiativeBarItem.tsx` (render)
- `scripts/export-schemas.mjs` (pipeline)
- `buildSpawnToken.test.ts`, `bestiae.service.spec.ts` (testy)
- FE↔BE sync: `node scripts/export-schemas.mjs` (0 diff, 17/17 OK 2026-06-20)

Prošel jsem: SY-01 matice, SY-02 sync, SY-03 sdílená pole, SY-04 soft-mode, SY-05 verze, SY-06 combatBehavior enum, SY-07 number coercion + nové delta versus 2026-06-05.

## Dosažená L vs cílová L

- **SY-01 matice úplnosti:** L2 (statická shoda ověřena + export-schemas spuštěn) ✅
- **SY-02 FE↔BE sync:** L2 (export bez diff) ✅
- **SY-03 sdílená pole:** L2 (čtení + cross-systém srovnání) ✅
- **SY-04 soft-mode:** L3 (test `bestiae.service.spec.ts` + čtení kódu) ✅
- **SY-05 version:** L2 (všech 17 = version:1) ✅
- **SY-06 combatBehavior enum:** L2 (čtení obou mirror typů, JSON vzorků) ✅
- **SY-07 number coercion:** L2 (mirror kód ověřen) ✅
- **F-RUN-SY-01 initiative spawn drift:** L2 (statická analýza kódu) — PROOF-REQUEST pro L4
- **F-RUN-SY-02 movement spawn drift (dnd5e):** L2 — PROOF-REQUEST pro L4
- **F-RUN-SY-03 EntityStatbar damageable bestie:** L2 — PROOF-REQUEST pro L3

Cílová L pro oblast 10 = L2+ (statika) + L4 na write paths. Write paths (token.add / bestie.create) jsou L3 přes existující testy; nové spawn-reading nálezy dosahují L2, potřebují L4.

## Nálezy

### ♻️ Potvrzené (ze sweep 2026-06-05 — stav nezměněn)

| ID | Osa | Popis | Závaž. | Stav |
|---|---|---|---|---|
| SY-01 | pozn. | 17/17 FE=BE, matice úplná | — | ✅ |
| SY-02 | WL | Export-schemas 17/17 sync (ověřeno 2026-06-20 spuštěním) | — | ✅ |
| SY-03 | RQ/RN/EN | Token sdílená pole konzistentní; movement klíč liší per systém (tag=movement) ⚖️ | 🟢 | ✅ |
| SY-04 | RQ/WL | Soft-mode mechanika OK (L3 test) | 🟢 | ✅ |
| SY-D1 | RQ/WL | Generic-fallback asymetrie FE registry.get vs BE (by-design ⚖️) | 🟡 | ⚖️ |
| SY-D2 | RQ/WL | drd2 character-pc/npc prázdné sections — nedosažitelná write path | 🟡 | ⚖️ |
| SY-05 | pozn. | version=1 všude, engine nevynucuje | 🟢 | ✅ |
| SY-06 | EN/TY | combatBehavior enum 2× ruční kopie (FE/BE types), aktuálně shodné | 🟡 | ⚖️ |
| SY-07 | TY | Number coercion 1:1 mirror | 🟢 | ✅ |

### 🆕 Nové nálezy (HEAD 2026-06-20)

---

**F-RUN-SY-01 — `RQ`/`TY` `buildBestieToken` hardkóduje `initiative.base` (nefunguje pro 3 systémy)**

- **Kde:** `src/features/world/tactical-map/utils/buildSpawnToken.ts:95` + `BestiePanelView.tsx:112-113`
- **Popis:** `buildBestieToken` čte `bestie.systemStats['initiative.base']` jako základ iniciativy pro všechny systémy. Ale:
  - `gurps:bestie` — iniciativa = klíč `basic_speed` (combatBehavior:initiative, default:5)
  - `dnd5e:bestie` — iniciativa = klíč `attributes.dex` (combatBehavior:initiative, default:10)
  - `coc:bestie` — iniciativa = klíč `characteristics.dex` (combatBehavior:initiative, default:50)
  - `initiative.base` existuje jen v `drd2:bestie`, `matrix:bestie` a `fate:bestie`
- **Dopad:** Pro gurps/dnd5e/coc bestie tokeny: `initBase = undefined → 0`. Token se spawnuje s `initiative=0` a `initiativeBase=0` bez ohledu na skutečnou hodnotu v `systemStats`. Iniciativní lišta je pro tyto systémy nefunkční (všechny bestie řazeny stejně). `BestiePanelView.handleInitiativeRoll` taktéž používá `stats["initiative.base"]` → modifier=0 pro gurps/dnd5e/coc.
- **Žádná testová pojistka:** `buildSpawnToken.test.ts` testuje jen `drd2` systém.
- **Dopad na existující data:** Legacy gurps/dnd5e/coc bestie tokeny v DB mají `initiative=0` — to je aktuální stav, oprava spawn funkce nezmění stará data. Nové spawny budou korektní po opravě.
- **Návrh:** Místo hardkódovaného klíče použít schema-driven lookup — najít field s `combatBehavior==='initiative'` v `systemId:bestie` schématu a použít jeho klíč. Přidat test pro gurps/dnd5e bestie spawn.
- **L:** L2 (statická analýza). **Závažnost:** 🟡 (UX — iniciativa zobrazena špatně; manuálně opravitelné)

---

**F-RUN-SY-02 — `TY` `buildBestieToken` hardkóduje klíč `movement` (dnd5e používá `speed`)**

- **Kde:** `src/features/world/tactical-map/utils/buildSpawnToken.ts:96`
- **Popis:** `buildBestieToken` čte `bestie.systemStats.movement` pro pohyb. Ale `dnd5e:bestie` používá klíč `speed` (combatBehavior:movement, default:6) — klíč `movement` v dnd5e bestie neexistuje.
- **Dopad:** Pro dnd5e bestie tokeny: `movement = undefined → 5`. Token dostane movement=5 místo správné hodnoty `speed` (např. 6, nebo jiné PJ nastavené). V BestiePanelView se zobrazí 5 místo skutečné hodnoty. (A* pathfinding není implementován, takže žádný vliv na logiku — jen display.)
- **Dopad na existující data:** Legacy dnd5e bestie tokeny v DB mají `movement=5` — oprava spawn nezpůsobí drift.
- **Návrh:** Schema-driven lookup stejně jako F-RUN-SY-01 — najít field s `combatBehavior==='movement'` a použít jeho klíč. Nebo sjednotit klíč (přejmenovat dnd5e `speed` → `movement` v JSON, a odpovídající token field).
- **L:** L2. **Závažnost:** 🟡 (display-only, A* neimplementován)

---

**F-RUN-SY-03 — `TY` `EntityStatbar` špatně renderuje HP bar pro bestie schémata (damageable na `health.max`)**

- **Kde:** `src/features/world/tactical-map/components/schema-form/EntityStatbar.tsx:86-101` + všechna `*/bestie.json` (damageable na `health.max`, ne `health.current`)
- **Popis:** Všechna bestie schémata (6 systémů) mají `combatBehavior:damageable` na poli `health.max`. `EntityStatbar` pro damageable pole počítá `maxKey = field.key.replace(/\.current$/, '.max')` (řádek 89). Pokud key = `health.max` (žádný `.current` suffix), replace nic neudělá → `maxKey = 'health.max'` = totéž pole. Výsledek: `current = value['health.max']`, `maxValue = value['health.max']` → HP bar vždy ukazuje 100 % HP pro bestie statblok.
- **Kontext:** `EntityStatbar` s `bestie` entityType (katalogová karta bestie v bestiáři) zobrazí vždy plný HP bar i pro poraněnou bestii v katalogu. (Token HP bar v `TokenSprite`/`InitiativeBarItem` vždy používá `token` schema kde damageable = `health.current` → tam je správně.)
- **Dopad:** Vizuální chyba pouze v katalogovém pohledu (EntityStatbar pro bestie) — HP bar nefunkční. Tokenový HP bar (ve hře) není postižen.
- **Dopad na existující data:** Žádný (jen render).
- **Návrh:** (a) Přidat `health.current` (damageable) do bestie schémat a `health.max` ponechat bez tagu — pak EntityStatbar funguje; nebo (b) EntityStatbar detekovat, že damageable field nemá `.current` a chovat se jinak. Varianta (a) přidává pole do bestie schématu — nutný export-schemas + BE restart.
- **L:** L2. **Závažnost:** 🟡 (UX — HP bar v katalogu vždy plný; v herní mapě OK)

---

## Stav export-schemas pipeline (2026-06-20)

```
$ node scripts/export-schemas.mjs
[export-schemas] OK — copied 17 schémata do ...\backend\assets\schemas
$ git diff --name-only -- backend/assets/schemas/
(prázdný výstup — 0 diff)
```

17/17 sync. Žádná desync.

## PROOF-REQUEST

| ID | Proof | Co ověřit |
|---|---|---|
| F-RUN-SY-01 | M4 round-trip | Spawn gurps/dnd5e/coc bestie → ověřit, že `token.initiative` = skutečná hodnota ze systemStats (ne 0) |
| F-RUN-SY-02 | M4 round-trip | Spawn dnd5e bestie se `speed=9` → ověřit, že `token.movement` = 9 (ne 5) |
| F-RUN-SY-03 | M5 render | Otevřít katalog bestie s poraněnou bestii (health.max=10) → HP bar ukazuje 100 % → bug potvrzen vizuálně |
| SY-04 soft-mode | M5 red-team | POST /bestiae s neznámým systemId, validní body → 200 (soft-mode skip) |
