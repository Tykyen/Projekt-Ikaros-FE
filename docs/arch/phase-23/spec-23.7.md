# Spec 23.7 — Release brány: e2e+security do CI, cross-repo scannery, „deploy jen po zelené"

**Stav:** IMPLEMENTOVÁNO 2026-07-19 (kód hotový, ověřeno) · čeká externí kroky uživatele (deploy A+B, backfill, repo var) · **Karta:** roadmap3 fáze 23, karta 23.7
**Cíl:** Před pouštěním cizích lidí hlídat regrese automaticky; release má evidenci.

## Zjištění při inventuře (2026-07-19) — mění výchozí premisu karty

Karta předpokládá, že „229 testů vč. 7 útočných" prochází a jen chybí v CI. **Realita: `npm run test:e2e` lokálně padá 53 z 235** (4 suity: showcase, seed-scenario, rest-idor, auth-refresh). Nelze zadrátovat červenou sadu do CI jako deploy bránu → napřed sadu zezelenat. Dvě nezávislé příčiny:

### Příčina A (⚠️ i produkční riziko) — `sortKeyPlugin` volá `next()`, který Mongoose 9 nepředává

- `backend/src/common/utils/name-sort.ts` hooky `save` / `findOneAndUpdate` / `updateOne` / `updateMany` končí `next()`.
- Mongoose 9 (Kareem 3) přestal do pre-hooků předávat callback `next` → `TypeError: next is not a function` → **500 na každém create/update** 9 schémat (bestiae, items, name-sets, plants, potions, price-lists, riddles, spells).
- Deník D-NAMESORT (2026-07-19) opravil **jen** `insertMany` (chytil `tsc`); `next` u ostatních 4 je typovaný parametr, který se nepředá → `tsc` mlčí, chyba je běhová.
- **Nespadlo v produkci jen proto, že D-NAMESORT není nasazený** (deník: „Čeká deploy + backfill"). Po BE deployi by spadla tvorba/editace všech katalogů + bestií. `insertMany` (seedy) jede, proto naseedované katalogy fungují.
- Dělá ~28 z 53 červených; zbylých ~23 (IDOR pin-validity, seed-scenario role) je downstream rozbitého setupu → po fixu A padnou i ty.
- **Fix:** ze 4 hooků smazat `next` param i volání, tělo nechat (Kareem si návrat poawaituje). Empiricky ověřeno v tomto mongoose (hook bez `next` projde). ~10 řádků.

### Příčina B — 2 auth-refresh e2e testy zůstaly na chování před 23.5

- `backend/test/auth-refresh.e2e-spec.ts` očekává, že reuse refresh tokenu hned vrátí 401. 23.5 přidalo 60s grace okno → reuse ve window vrací 200 (týž nástupnický pár). Testy neaktualizované → 2 červené.
- **Fix:** grace okno zpřístupnit přes env `REFRESH_REUSE_GRACE_MS` (default 60000, prod beze změny) → security regrese je v CI **testovatelná** (přesně cíl 23.7). Test „grace idempotence" (reuse ve window = 200 týž pár) + test „reuse PO okně revokuje rodinu" (grace nastaveno na 0 přes `ConfigService.set`, pak reuse → 401 ABUSED, rotovaný token taky 401).

## Rozhodnutí a zásahy

### BE (repo Projekt-ikaros) — napřed, aby šla sada zezelenat

| # | Soubor | Změna |
|---|--------|-------|
| A | `src/common/utils/name-sort.ts` | 4 hooky bez `next` (mongoose 9 signatura); odstranit nepoužitý import `CallbackWithoutResultAndOptionalError`; komentář sjednotit |
| B1 | `src/modules/auth/auth.service.ts` | `REFRESH_REUSE_GRACE_MS` → getter z `ConfigService` (`REFRESH_REUSE_GRACE_MS`, default 60000) |
| B2 | `test/auth-refresh.e2e-spec.ts` | 2 aserce přepsat na záměr 23.5 (grace idempotence + reuse po okně) |
| C1 | `.github/workflows/ci.yml` | nový job `backend-e2e`: `npm run test:e2e` (mongodb-memory-server in-process, maxWorkers 1, timeout 20 min) |
| C2 | `.github/workflows/deploy.yml` | krok „Require green CI for HEAD" (gh api, `github.token`) PŘED buildem + krok „Release evidence" (sha/ref/čas/actor → `$GITHUB_STEP_SUMMARY`) |

### FE (repo Projekt-ikaros-FE)

| # | Soubor | Změna |
|---|--------|-------|
| D1 | `.github/workflows/deploy.yml` | totéž „Require green CI for HEAD" + „Release evidence" |
| D2 | `scripts/route-audit.mjs` | odstranit falešné pozitivy (FE `${base(worldId)}/…` helpery scanner staticky neresolvne) suffix-matchem BE rout + allowlist pro zbytek; cíl 0 reálně-missing |
| D3 | (dokumentace) | crossrepo job už v `ci.yml` je za `vars.ENABLE_CROSSREPO_AUDIT`; po D2 je green-able |

## Externí předpoklady (jen uživatel — nejde z lokálu)

1. **Deploy gate ③:** `deploy.yml` je `workflow_dispatch` z main. Po pushnutí na main musí doběhnout CI (zelená), teprve pak spustit deploy — jinak gate deploy zablokuje (in_progress/null ≠ success). To je záměr.
2. **② crossrepo zapnout:** nastavit repo variable `ENABLE_CROSSREPO_AUDIT='true'` na FE repu. Job dělá checkout BE repa (`Tykyen/Projekt-ikaros`) — pokud je private, potřebuje secret `BE_REPO_TOKEN` (PAT). Bez toho job selže na checkoutu. **Já repo vars/secrets nastavit nemůžu.**

## Vědomě mimo scope 23.7

- Rollback na image tag per sha (otevřená otázka karty) → karta 30.6; dnes git revert + redeploy.
- Backfill `nameSort` (`--apply`) + deploy D-NAMESORT → samostatný BE deploy krok (fix A ho odblokuje).

## Ověření

- BE: `test:e2e` zelené (235/235 mimo 1 skip), `tsc --noEmit`, `eslint`, `name-sort.spec` 7/7.
- CI: jobs viditelné, e2e job proběhne na PR i push.
- Deploy gate: manuálně ověří uživatel při příštím deployi (na live).
