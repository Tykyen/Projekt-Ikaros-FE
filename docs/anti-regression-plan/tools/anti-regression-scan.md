# tools/anti-regression-scan — M-TRACE · M-MUT · M-CI

> Nástrojová vrstva 16. auditu. Hlavní kus = **`scripts/anti-regression-scan.mjs`** (M-TRACE) — strojová
> vazba nález → pojistka → živost. Rozšiřuje vzor [`scripts/error-contract-scan.mjs`](../../../scripts/error-contract-scan.mjs)
> a [`scripts/nav-audit.mjs`](../../../scripts/nav-audit.mjs) (oba mají `--ci` + `process.exit(1)`).

---

## M-TRACE — `scripts/anti-regression-scan.mjs`

### Vstupy
- `docs/*-audit.md` (15 registrů) — zdroj nálezů.
- `docs/anti-regression-plan/anti-regression-map.json` — ruční vazba `ID → pojistka`.
- BE `.github/workflows/ci.yml`, BE `.husky/pre-commit`, FE `.github/workflows/*` — zdroj **živosti**.
- BE `package.json`/`jest.config` + FE `package.json`/`vitest.config` — co `npm test` reálně spustí.

### Mapa — tvar `anti-regression-map.json`
```jsonc
{
  "N-7": {
    "class": "authz",
    "guards": [
      { "kind": "test", "repo": "be", "file": "test/worlds-members.e2e-spec.ts",
        "symbol": "rejects member list without membership", "fix": "worlds.service.ts:findMembers" }
    ]
  },
  "RC-E2": {
    "class": "money",
    "guards": [
      { "kind": "test", "repo": "be", "file": "test/race/race-economy.e2e-spec.ts", "symbol": "..." },
      { "kind": "mutation", "repo": "be", "config": "stryker.conf.json" }
    ]
  },
  "EC-01": { "class": "contract",
    "guards": [{ "kind": "scanner", "cmd": "audit:errors", "file": "scripts/error-contract-scan.mjs" }] }
}
```
`kind`: `test` | `scanner` | `lint` | `mutation`. Chybějící nález v mapě = **G0** (nemá pojistku).

### Algoritmus
1. **harvestNálezy()** — regex přes `*-audit.md` hlavičky/tabulky → `{id, severity, status}`. Kanonický
   počet (zdroj pravdy ~255).
2. **loadMap()** — `anti-regression-map.json`.
3. **resolveGuard(guard)** — pro každý guard:
   - `test`: soubor existuje? obsahuje `symbol` (it/describe/komentář s ID)? → `EX`.
   - `scanner`/`lint`: `cmd` je v `package.json` scripts? skript soubor existuje? → `EX`.
   - `mutation`: `stryker.conf.json` existuje a pokrývá `fix` soubor v `mutate` glob? → `TEETH` (deklarovaný).
4. **resolveLive(guard)** — `LIVE`:
   - `test`/BE: spadá pod `npm test` glob a `ci.yml` job `backend-test` ho spustí? → živý.
   - `test`/FE: existuje FE CI workflow, co spustí vitest? (dnes ne → G1).
   - `scanner`: je `cmd` volán v nějakém `*.yml` workflow nebo `pre-commit`? (dnes ne → G1).
5. **grade(id)** — nejvyšší stupeň přes guardy dle [00 §1].
6. **report()** — rozložení G; seznam důležitých (dle [00 §2]) pod G3; `isImportant && G<2` → `failures`.
7. **`--ci`** → `process.exit(failures.length ? 1 : 0)`. To je `npm run audit:regression`.
8. **`--json`** → strojový výstup pro generování `anti-regression-audit.md` matice.

### Co M-TRACE **neumí** (vědomý limit, L7)
- Neposoudí **kvalitu** testu (jen existenci+symbol). Cílenost `AIM` a zuby `TEETH` jsou na `M-MUT`/ruční.
- Neví o pojistce, která **není v mapě** → mapa se musí plnit ve sweepu (oblasti 01–06). Prázdná mapa =
  vše G0; plnění mapy = vlastní práce auditu.

---

## M-MUT — teeth

Bez nového nástroje pro většinu: **ruční reverze hunku** fixu + běh cíleného testu (viz [00 §5]). Pro RC a
později pro rozšířené domény: `stryker.conf.json` — rozšířit `mutate` glob z 6 race souborů na soubory
fixů důležitých nálezů (gated, Fáze B). FE Stryker (`@stryker-mutator/vitest-runner`) je v devDeps, ale
bez konfigurace — postavit až s FE CI.

---

## M-CI — živost

Ne samostatný skript — je to **čtecí krok** uvnitř M-TRACE (`resolveLive`) + ruční audit workflow souborů.
Výstup = sloupec `LIVE` v matici a podklad pro Fázi B (návrh FE CI + zapojení scannerů).

---

## Pořadí stavby (Fáze A)
1. `harvestNálezy()` + report počtů (ověř ~255 strojově). 
2. `loadMap()` + `resolveGuard/Live` + `grade` na **prázdné mapě** → baseline „kolik je G0".
3. Plnit mapu při sweepu oblastí; matice roste.
4. `--ci` mód až po naplnění mapy (jinak by shodil vše). Zapojení do CI = Fáze B.
