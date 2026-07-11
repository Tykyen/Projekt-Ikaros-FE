# race · 01-ekonomika — checkpoint (RUN-2026-07-11-1213)

READ-ONLY. Styl 15 (race), prefix `RC-`. Registr: `docs/race-condition-audit.md`.
BE=`c:/Matrix/ProjektIkaros/Projekt-ikaros/backend`. Oblast: nákup / storno / adjust / undo / transfer / **změna měny**.

## Kontext / co je už vyřešené (NE-reportovat)
- RC-E1..E5 potvrzené + opravené (registr): TOCTOU overdraft (`appendTransactionIfSufficient` `$gte`), double-refund (`markRefundedIfActive` atomický flip), `undoLast` (`withTransaction`), inventář **add** (`appendItemToSection` `$push`), nákup atomicita (`withTransaction`+fallback). Pozitivní kontroly baseline/conservation drží.
- RC-E6 transfer bez balance floor — už kryto `FIX-13` (`appendTransactionIfSufficient` v tx i fallbacku), registr ⚖️.
- **Refund tx díra** (flip status → adjust kredit → removeFromInventory, ne v jedné tx; pád mezi = status refunded ale peníze nevrácené) = **známé ext-43**, nereportuji.
- e2e RC-E1..E5 existují (`test/race/economy.race.e2e-spec.ts` + `economy.model.race.e2e-spec.ts`).

Verdikt oblasti: **2 nové nálezy (🆕), oba L2** (statická jistota vysoká; deterministický repro Barrier/Gate nenapsán — READ-ONLY). Plus 2 sekundární (🟡/⚖️).

---

## 🆕 RC-E7 — `changeCurrency` (convert:true): lost-update celého peněžního pole na měnové cestě  🟠  třída LU/TOCTOU
**Uzel:** `character-accounts.service.ts:227-290` (`changeCurrency`) → repo `character-account.repository.ts:130-148` (`replaceMoneyFields`).
**Routa (živá, staff-gated):** `changeCurrency` v `character-accounts.controller.ts:187` (`assertWriteSettingsAccess`).

Read-modify-write nad VŠEMI peněžními poli ze zastaralého snapshotu:
```
227  async changeCurrency(accountId, newCurrency, convert) {
232    const account = await this.getAccount(accountId);      // READ (balance + celé transactions[])
...    // přepočet r = from.rate/to.rate nad account.transactions/income/expense
273    const balance = transactions.length ? Σdelta : account.balance*r;
277    const updated = await this.accountsRepo.replaceMoneyFields(accountId, {
             currency, balance, transactions, incomeEntries, expenseEntries });  // WRITE full $set
```
Repo `replaceMoneyFields`:
```
141  this.model.findByIdAndUpdate(accountId, { $set: fields }, { new: true })
```
Komentář u repo („Single-doc update = atomický (žádná tx potřeba)") je **zavádějící**: samotný `$set` je atomický, ale **hodnoty pocházejí ze stale readu**. Mezi řádkem 232 (read) a 277 (write) může souběžný `adjust` / `debitIfSufficient` (nákup) / `transfer` / `appendTransaction` udělat atomický `$push`+`$inc` — a `replaceMoneyFields` ho **přepíše celým polem** ze staré verze.

**Dopad:** souběžný vklad/výběr/nákup provedený během konverze měny **zmizí** — transakce se ztratí z `transactions[]` a její příspěvek k `balance` je pryč. Porušuje invariant `balance = Σ delta` (peníze se ztratí, případně u výběru „vrátí"). Přesně třída, kterou audit honí, a **v registru není** (E1-E6 se `changeCurrency` netýkají).

**Pravděpodobnost:** nižší (trigger = staff mění měnu účtu právě když na účtu závodí jiná operace), proto 🟠 ne 🔴. Ale konverze přepisuje CELÉ pole transakcí → jakákoli souběžná tx se ztratí bez stopy.

**Návrh fixu (gated, BE, nemíchat s FE):** buď `changeCurrency` celé do `withTransaction` (write-conflict → retry re-čte čerstvý stav; vzor RC-E3), nebo conditional `replaceMoneyFields` s `updatedAt`-guardem (`findOneAndUpdate({_id, updatedAt: expected})` → 0 modified = 409 CONFLICT, klient opakuje). Vzor RC-P1 `updateIfUnchanged`.

**Pokrytí:** žádný test (`grep changeCurrency|replaceMoneyFields test/` = 0).

---

## 🆕 RC-E8 — `removeFromInventory` (storno + kompenzace fallbacku): full-sections `$set` = lost-update souběžného nákupu  🟠  třída LU
**Uzel:** `campaign-purchase.service.ts:519-541` (`removeFromInventory`) → `character-subdocs.service.ts:525-545` (`updateInventory`) → `inventoryRepo.update` (full `$set`).
**Volají:** `refund` (l. 479) a `purchaseSequentialFallback` kompenzace (l. 369, 406).

```
519  private async removeFromInventory(character, sectionId, itemId) {
524    const inv = await this.subdocsService.getInventory(...);          // READ celé sections[]
529    const sections = inv.sections.map(sec => sec.id===sectionId
             ? {...sec, items: sec.items.filter(it=>it.id!==itemId)} : sec);
535    await this.subdocsService.updateInventory(character.id, { sections }, ...); // WRITE full $set
```
RC-E4 opravil pouze **add** cestu (`appendItemToSection` `$push`). **Remove** cesta (storno) pořád dělá read→map→full-array `$set` celých `sections`. Souběžný nákup, který mezi readem (524) a zápisem (535) atomicky `$push`ne položku, se **přepíše** stale snapshotem → **koupená položka z inventáře zmizí** (peníze odečteny, ale předmět není).

**Dopad:** ztráta právě zakoupené položky při souběhu storno×nákup (nebo dvě souběžná storna → přepis). 🟠, není to peníze, ale je to nezlogovaná ztráta obsahu na kritické cestě, kterou E4 vědomě adresoval na druhé straně.

**Návrh fixu (gated):** cílený `$pull` položky ze sekce v repo (analog `appendItemToSection`), místo read→full `$set`. Pak i storno kompenzace odolá souběhu.

**Pokrytí:** žádný test (`grep removeFromInventory test/` = 0).

---

## Sekundární (nižší priorita)

### 🟡 RC-E9 (L1) — co-owner / primary ops: full-array `$set` `ownerCharacterIds` ze stale readu
`character-accounts.service.ts` `addCoOwner` (701), `removeCoOwner` (714), `transferPrimaryOwnership` (737), event `onCharacterDeleted` (842) — všechny: read account → `update` full `$set` `ownerCharacterIds`. Dva souběžné `addCoOwner` → jeden co-owner se ztratí (LU). `onCharacterDeleted` (event, souběžně s `addCoOwner`/dalším deletem) ze stale snapshotu → smazaná postava může zůstat vlastníkem nebo se ztratí jiný co-owner / špatný `primaryOwnerId`. Vlastnictví účtu, ne peníze → 🟡. Není v registru. Fix: atomický `$addToSet`/`$pull` místo full `$set`.

### ⚖️ RC-E10 — `addMonthly` bez idempotence (DP)
`character-accounts.service.ts:306` — nemá dedup klíč; dvě souběžná (nebo dvojklik) `addMonthly` → dvě „Měsíční zúčtování" transakce → dvojí zaúčtování. Samotný `appendTransaction` je atomický (balance=Σdelta drží), takže to není conservation-break, jen chybějící idempotence uživatelské akce → hodnotím ⚖️/by-design (PJ smí zaúčtovat víckrát). Zmíněno pro úplnost.

---

## Pozitivní kontroly (drží — čteno v kódu)
- `debitIfSufficient` → `appendTransactionIfSufficient` `findOneAndUpdate({_id, balance:{$gte}})` atomický ✅ (RC-E1).
- `markRefundedIfActive` `findOneAndUpdate({_id, status:'active'})` atomický ✅ (RC-E2).
- `undoLast` / nákup `runPurchaseSteps` / `transfer` v `withTransaction` + replSet fallback ✅ (RC-E3/E5/E6, FIX-13).
- Nákup `appendInventoryItem` → `appendItemToSection` `$push` (add) ✅ (RC-E4).

## Reprodukce (pokud se povolí opravy)
`Gate` na `replaceMoneyFields` (drž changeCurrency po readu, prožeň `adjust(+X)`, pusť) → po dokončení `balance != Σdelta` / vklad zmizel = červená (RC-E7). `Barrier(2)` storno×nákup na `updateInventory` vs `appendItemToSection` → položka zmizí (RC-E8). Oba do `test/race/economy.race.e2e-spec.ts`.
