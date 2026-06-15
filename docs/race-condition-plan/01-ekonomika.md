# 01 — Paralelní ekonomika

> Nejtvrdší cíl: peníze. Lost update / TOCTOU / double-processing = záporný zůstatek nebo duplikované
> peníze. **Čteno přímo v kódu** (vysoká jistota) — tady se to **dokazuje** deterministickým interleavem.
> Test: [`economy.race.e2e-spec.ts`](../../../Projekt-ikaros/backend/test/race/economy.race.e2e-spec.ts).

## Povrch (routy ověřené v controllerech)

| Operace | Routa | Service | Zápis |
|---|---|---|---|
| adjust (vklad/výběr) | `POST /api/worlds/:w/accounts/:id/adjust` | `CharacterAccountsService.adjust` | `appendTransaction` = atomický `$push`+`$inc` ✅ |
| undo | `POST .../accounts/:id/undo` | `undoLast` | `update` = `$set` celého pole 🔴 RMW |
| transfer | `POST .../accounts/:id/transfer` | `transfer` | `withTransaction` + atomické append ✅ |
| nákup | `POST /api/campaign/shopitems/:id/purchase` | `CampaignPurchaseService.purchase` | balance read → check → `adjust` 🔴 TOCTOU |
| storno | `POST /api/campaign/purchases/:id/refund` | `refund` | `status` check → `adjust` → `update` 🔴 ne-atomické |

## Seed kandidáti (hypotézy → verdikt z běhu)

| ID | Třída | Uzel | Hypotéza | Repro | Verdikt |
|---|---|---|---|---|---|
| **K-RC-E1** | TOCTOU | [campaign-purchase.service.ts:144](../../../Projekt-ikaros/backend/src/modules/campaign/services/campaign-purchase.service.ts#L144) | `account.balance < paidAmount` čteno PŘED `$inc` bez floor → 2 nákupy → záporný zůstatek | `Barrier(2)` na `adjust` | _běh_ |
| **K-RC-E2** | DP | [campaign-purchase.service.ts:228](../../../Projekt-ikaros/backend/src/modules/campaign/services/campaign-purchase.service.ts#L228) | `status!=='active'` check není atomický → 2 storna → peníze 2× | `Barrier(2)` na `adjust` | _běh_ |
| **K-RC-E3** | LU | [character-accounts.service.ts:410](../../../Projekt-ikaros/backend/src/modules/character-subdocs/character-accounts.service.ts#L410) | `undoLast` čte tx pole → `$set` slice; adjust mezi read↔write → vklad zmizí | `Gate` na `repo.update` | _běh_ |
| **K-RC-E4** | LU | [campaign-purchase.service.ts:315](../../../Projekt-ikaros/backend/src/modules/campaign/services/campaign-purchase.service.ts#L315) | `addToInventory` full `sections` `$set` → 2 nákupy téže postavě → položka zmizí | `Barrier(2)` (sdílí scénář E1) | _follow-up_ |
| **K-RC-E5** | AT | campaign-purchase.service.ts (celé) | nákup přes 3 moduly bez transakce → pád na purchase-logu → položka+peníze pryč, bez storno-záznamu | `withGate` + throw na purchaseRepo | _follow-up_ |
| **K-RC-E6** | WS | [character-accounts.service.ts:424](../../../Projekt-ikaros/backend/src/modules/character-subdocs/character-accounts.service.ts#L424) | transfer nemá balance floor → souběžné transfery přečerpají | conservation test | ⚖️ možná by-design (PJ smí mínus) |

## Pozitivní kontroly (musí být zelené)
- **baseline:** 10× souběžný `adjust(+1)` → `balance==10` (atomický `$inc` drží) — pokud červené, chyba v harnessu, ne v kódu.
- **conservation:** 20× transfer A→B → `Σ balance` konstantní (`withTransaction` drží).

## Návrhy fixů (gated souhlasem — peněžní cesta, BE+FE nemíchat)
- **E1:** atomický conditional `$inc` s floor — `updateOne({_id, balance:{$gte:amount}},{$inc:{balance:-amount}})` → 0 modified = INSUFFICIENT_FUNDS; nebo celý nákup do `withTransaction` (vzor `transfer`).
- **E2:** atomický status flip — `updateOne({_id, status:'active'},{$set:{status:'refunded'}})` → 0 modified = ALREADY_REFUNDED, kreditovat až po úspěšném flipu.
- **E3:** `undoLast` přes atomický `$pop`+`$inc(-lastDelta)` v jednom updatu (ne read→`$set`), nebo `withTransaction`.
- **E4:** inventář přes cílený `$push` do sekce místo full `sections` `$set`.
- **E5:** celý `purchase` do `session.withTransaction` (dluh `shop-purchase-atomicity`, D-8.6-replica-set).

> 💡 Společný kořen E1–E5: **read-modify-write / check-then-act bez atomické DB podmínky**. Mongo má
> nástroje (`$inc`/`$pop`/conditional `updateOne`/`withTransaction`) — chybí jejich použití na peněžní cestě.
