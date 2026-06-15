# 02 — Souběžné úpravy stránky

> Page update = read-modify-write s full `$set`. Test:
> [`pages.race.e2e-spec.ts`](../../../Projekt-ikaros/backend/test/race/pages.race.e2e-spec.ts).
> **Hotovo:** race 4/4 zelený, pages unit 48/48 (P1+P4 opraveny, P3 vyvráceno).

## Nálezy

| ID | Třída | Verdikt | Fix |
|---|---|---|---|
| **RC-P1** | LU 🟠 | 🐛 POTVRZENO (conflicts=0) — optimistic lock `expectedUpdatedAt` je app-level mezi `findById` a `update` (ne atomický) → 2 edity stejné verze obě projdou → tichý lost update | ✅ `updateIfUnchanged(id, patch, expectedUpdatedAt)` = `findOneAndUpdate({_id, updatedAt: expected})` → druhý dostane 409 |
| **RC-P2** | LU 🟠 | ⬜ stejný kořen jako P1 (full-array `$set` sekcí/akjTabs/grantů); netestováno samostatně — kryje ho stejný atomický vzor | — |
| **RC-P3** | TOCTOU 🟡 | ✅ DRŽÍ — duplicitní slug → čistý 409, 1 stránka v DB, žádné 500. `create` ošetřuje E11000. **Hypotéza Explore vyvrácena.** | — |
| **RC-P4** | PH 🟡 | 🐛 POTVRZENO (200 s null tělem) — update mazané stránky v okně `findById`↔`update` vrátil `updated!`=null jako Page | ✅ null-guard po update → `NotFoundException` (404) |

## Metodika
- **RC-P1:** `Barrier(2)` na `pagesRepo.update` (buggy cesta volá `update`) → vynutí, že oba projdou app-level checkem před zápisem. Po fixu jde cesta přes `updateIfUnchanged` (DB atomicita), bariéra dormantní; na regresi (návrat k `update`) zase ožije → test má zuby pro oba stavy.
- **RC-P4:** `Gate` na `pagesRepo.update` drží PATCH po `findById`, mezitím DELETE, pak release.

💡 Kořen P1+P4: read (findById) a write (update) jsou dvě operace s oknem mezi nimi. Fix = atomická podmínka v jednom DB volání (`findOneAndUpdate` s podmínkou / null-guard).
