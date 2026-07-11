# ext-43 — Transakční integrita & durabilita · dosažená L3 (statika)

## 🔴 POTVRZENO: refund() bez transakce → ztráta peněz
- `campaign-purchase.service.ts:413-487` `refund()` = 3 zápisy do RŮZNÝCH dokumentů, MIMO tx, BEZ kompenzace:
  1. `markRefundedIfActive(purchaseId)` :451 flip active→refunded
  2. `accountsService.adjust(...)` :461 kredit peněz (jiný dok)
  3. `removeFromInventory(...)` :479
- Pád mezi 1 a 2 = status `refunded` bez kreditu → hráč trvale blokován `PURCHASE_ALREADY_REFUNDED` (:427,:455) = nevratná ztráta.
- purchase (:212) i transfer (character-accounts:573) UŽ mají withTransaction+fallback (RC-E5/D-8.6); refund vypadl.

## ⭐ Další:
- `database.module.ts:19` connect bez writeConcern → NAVRH `{ writeConcern:{w:'majority',j:true}, readConcern:{level:'majority'} }`. (Mongo 5+ default w:majority, ale j:true není explicitní.)
- 4× `withTransaction(fn)` bez transactionOptions (campaign-purchase:212, character-accounts:460,:573, worlds:944) → commit na default.
- ŽÁDNÝ idempotency-key na purchase/transfer → double-click/axios retry = 2× odečet. `PurchaseShopItemDto`, `TransferBody` bez pole.
- revert-fail (transfer:685, purchase fallback:399) jen `logError('ruční oprava nutná')` → chce outbox/reconciliation (větší, dluh).

## FIX (BE, replSet je k dispozici — compose rs0):
1. **refund → withTransaction + kompenzace** NEBO přeuspořádat: kredit+inventář PRVNÍ, flip statusu POSLEDNÍ. Invariant „peníze vráceny ⇔ refunded". = HLAVNÍ FIX.
2. writeConcern default v database.module + do withTransaction.
3. idempotency-key na purchase/transfer (unique index (worldId, idempotencyKey)) — střední, možná dluh.
- Test: `backend/test/race/economy.race.e2e-spec.ts` (replSet:true, má purchase-atomicity :290) → přidat refund fault-injection: spyOn(accountsService,'adjust').mockRejectedValueOnce po markRefunded → assert status nezůstal refunded bez kreditu.

## Fix status: refund tx + writeConcern = FIXNU (BE, test-first). idempotency+outbox → dluh/diskuze.
