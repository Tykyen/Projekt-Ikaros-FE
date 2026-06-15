# 04 — Mazání entity při souběžné operaci

> Test: [`deletion.race.e2e-spec.ts`](../../../Projekt-ikaros/backend/test/race/deletion.race.e2e-spec.ts).
> **Přesah:** orphan = stejná třída jako [cascade-delete](../cascade-delete-audit.md) + [db-integrity](../db-integrity-audit.md). Tady RACE úhel: dítě vzniká, zatímco rodič mizí.

## Nálezy

| ID | Třída | Verdikt | Pozn. |
|---|---|---|---|
| **RC-D3** | PH 🟠 | 🐛 POTVRZENO (liveOrphans=1) — zpráva uložená do kanálu smazaného v okně `findById`↔`save` zůstane živá s `channelId` na neexistující kanál | **fix DEFER**: vyžaduje tx (sendMessage read+insert) nebo guard; overlap cascade-delete (deleteGroup soft-maže existující zprávy, ale ne ty vzniklé po deletu) |
| **RC-D4** | DP 🟡 | ✅ DRŽÍ — 2 souběžná smazání kanálu → žádné 500, kanál odstraněn (2. `findById`→404) | idempotence OK |
| RC-D1 | PH 🟠 | ⬜ cross-ref — char delete vs subdoc create (event/lazy) → orphan subdoc; pokryto cascade-delete/db-integrity | netestováno race úhel (event timing) |
| RC-D2 | PH 🟠 | ⬜ analýza — create v soft-smazaném světě (create nečte `isActive`) → dítě v mrtvém světě | destruktivní na sdílený seed → netestováno |
| RC-D6 | PH 🟡 | ⬜ = CD-04 — scéna delete vs assign → dangling `currentSceneId`; cascade-delete řeší `clearSceneForAll` | cross-ref |

## Metodika
- **RC-D3:** `Gate` na `messageRepo.save` → drží uložení zprávy po přečtení kanálu, mezitím DELETE kanálu, pak release → orphan.
- **RC-D4:** 2× `Promise.allSettled` DELETE → assert žádné 500 + kanál pryč.

💡 Doporučení: D3/D1/D2 řešit společně s cascade-delete auditem (sdílený kořen — chybí atomicita „insert dítěte jen když rodič žije"). Mongo to bez tx neumí; buď tx, nebo background sweep orphanů.
