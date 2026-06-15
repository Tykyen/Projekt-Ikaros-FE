# 01 — CI / precommit živost (systémový kořen)

> **Nejdůležitější oblast.** Bez živé CI/precommit vrstvy je **každá** ostatní pojistka maximálně G1 —
> existuje, ale nikdo ji nespouští. Tahle oblast měří současný stav živosti a navrhuje, co povýšit na G2
> (Fáze B). Osa: `LIVE`.

## Současný stav (baseline, ověřeno recon 2026-06-15)
- BE [ci.yml](../../../Projekt-ikaros/.github/workflows/ci.yml): `backend-typecheck` (typecheck+lint) +
  `backend-test` (`npm test` = jest unit+e2e+race). **JEDINÁ živá testová síť projektu.**
- BE `.husky/pre-commit`: typecheck+lint, **bez testů**.
- FE: **žádný CI workflow** (jen `deploy.yml`), **žádný precommit**, **žádný lint-staged**.
- 8 scannerů (`audit:routes/nav/ws/config/errors/logs/contrast`, `lint:colors`): **v žádném workflow**.

## Seed kandidáti
- **K-AR1** 🔴 — 8 scannerů G1 (mimo CI). Audity EC/LH/PC/NAV/WS/bug se o ně opírají → reálně G1.
- **K-AR2** 🔴 — FE bez CI/precommit → veškeré FE pojistky G1 (vitest 42, nav 82 spec, role parity, socket-reconnect).

## Checklist (Fáze A — jen zjistit)
1. Potvrď, že žádný `.yml` v obou repo nevolá `npm test` mimo BE `ci.yml`. (M-TRACE `resolveLive`.)
2. Potvrď, že žádný `.yml`/`pre-commit` nevolá `audit:*`.
3. Ověř, jestli FE build (`npm run build`, tsc -b) vůbec někde běží na PR (dnes ne).
4. Zmapuj, které scannery mají korektní `--ci`/exit kód (předpoklad pro zapojení) — viz oblast 02.

## Návrh Fáze B (gated — nejdřív schválit)
- **FE CI workflow** (`.github/workflows/ci.yml`): `npm ci` → `npm run build` (tsc -b, [project_fe_build_preexisting_errors])
  → vitest run → vybrané `audit:*`. Pozor: FE vitest sériově ([project_fe_test_precommit]).
- **Zapojit scannery jako blocking** v obou repo — buď do BE `ci.yml` nový job `audit`, nebo do FE CI
  (scannery žijí ve FE `scripts/`). Začít těmi se spolehlivým `--ci`: `audit:errors`, `audit:logs`,
  `audit:config` (ověřeno že mají exit 1).
- **`audit:regression` (M-TRACE)** jako finální blocking guard.
- ⚠️ Riziko: scannery dnes možná **červenají na pre-existující stav** (ne každý nález je opraven). Před
  zapnutím blocking ověřit, že běží zeleně na `main`, jinak shodí každý PR. To je součást Fáze B.

## Výstup
- Sloupec `LIVE` naplněn pro všechny nálezy.
- Návrh CI (FE workflow + scanner job) ke schválení.
