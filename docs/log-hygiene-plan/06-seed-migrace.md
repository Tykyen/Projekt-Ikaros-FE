# 06 — Seed & migrace

> **Otázka:** logují seed/migrace skripty **e-maily / hesla / jména** importovaných účtů a obsah?
> **Osy:** `SEED` `SEC` `PII`. **Plocha:** `*.seed.ts` (matrix-world, article/gallery-categories,
> rulebook-matrix), migrace (`article-category-slug-migration`), import starého Matrixu.

## Povrch

| Skript | Log míst | Co loguje (hypotéza) | Riziko |
|---|---|---|---|
| matrix-world.seed.ts | 7 | světy/postavy/stránky — jména? ID? | 🟡 `PII`/`SEED` |
| rulebook-matrix-seed.ts | 4 | stránky pravidel | nízké |
| world-page-templates.matrix-seed.ts | 4 | šablony | nízké |
| article/gallery-categories.seed.ts | 3+3 | kategorie | ✅ |
| article-category-slug-migration.ts | 4 | slug remap | nízké |
| **import Matrix účtů** (migrace) | ? | **jméno + heslo + e-mail** migrovaných | 🔴 pokud loguje |

## Co ověřit

1. **K-LOG13** `SEED`/`SEC` — migrace 22 globálních Matrix účtů ([paměť `project_matrix_user_migration`]:
   jméno + bcrypt hash + placeholder e-mail). Skript **nesmí** logovat hesla/hashe ani plné e-maily. Ověřit
   migrace skript (jednorázový workflow přes secret `MIGRATION_USERS`) — loguje počty/jména (akceptovatelné
   pro one-off) nebo **hash/heslo** (🔴)?
2. **`PII`** — matrix-world.seed (7 log): loguje jména postav/světů? Pro **jednorázový** seed je log jmen
   nižší riziko (běží jednou, ne v request cestě), ale pokud běží na startu (`OnModuleInit`) opakovaně →
   periodický PII log.
3. **Cesta klasifikace** — M-SCAN: seed je `*.seed.ts` → kategorie `SEED`, ne `DBG`. Ale pokud se seed volá
   z běhové cesty (boot), jeho log je v prod stdout → ověřit, kdy se spouští.

## Pasti
- Migrace je **one-off** (cross-ref deployment-handoff) → log jmen při importu je provozně užitečný a běží
  jednou; **hash/heslo** ale ne nikdy. Rozlišit.
- Po migraci „uklidit dump + secret" ([paměť `project_matrix_user_migration`]) — pokud import loguje data,
  log je další kopie k úklidu (sink retence, oblast 08).
- Seed na `OnModuleInit` = běží při každém bootu → jeho log je trvalá prod cesta, ne one-off.
