# race-condition / 01-ekonomika — checkpoint RUN-2026-06-20-1621

**Datum:** 2026-06-20 · **Auditor:** agent · **Metoda:** statická L1-L3 (HEAD kód ověřen ručně)

---

## Pokrytí

Prošel jsem VEŠKERÝ ekonomický kód:

| Soubor | Obsah |
|---|---|
| `backend/src/modules/campaign/services/campaign-purchase.service.ts` | purchase, refund, removeFromInventory, purchaseSequentialFallback |
| `backend/src/modules/campaign/repositories/campaign-purchase.repository.ts` | markRefundedIfActive, create(session), update |
| `backend/src/modules/character-subdocs/character-accounts.service.ts` | adjust, debitIfSufficient, undoLast/undoLastOnce, transfer, transferSequentialFallback, addCoOwner, removeCoOwner, transferPrimaryOwnership, changeCurrency, addMonthly |
| `backend/src/modules/character-subdocs/repositories/character-account.repository.ts` | appendTransaction, appendTransactionIfSufficient, replaceMoneyFields, update |
| `backend/src/modules/character-subdocs/repositories/character-inventory.repository.ts` | appendItemToSection (fáze 1+2+retry), update |
| `backend/src/modules/character-subdocs/character-subdocs.service.ts` | appendInventoryItem, updateInventory |
| `backend/test/race/economy.race.e2e-spec.ts` | RC-E1..E5 testy + harness |

---

## Dosažená L vs cílová L

| Třída | Cílová | Dosažená | Poznámka |
|---|---|---|---|
| TOCTOU (E1) | L5-teeth | **L4** (opraveno + test zelený) | teeth = Stryker on-demand, neověřen v tomto běhu |
| DP (E2) | L5-teeth | **L4** | dtto |
| LU (E3) | L5-teeth | **L4** | dtto |
| LU (E4) | L5-teeth | **L4** | dtto |
| AT (E5) | L5-teeth | **L4** | dtto |
| WS (E6) | L2 | **L1** | by-design ⚖️, nezkoumán |
| LU (nový E7 — removeFromInventory) | — | **L2** | staticky nalezen, chybí deterministický test |
| LU (nový E8 — addCoOwner/removeCoOwner) | — | **L1** | hypotéza, nízká závažnost (metadata) |
| LU (nový E9 — changeCurrency s convert:true) | — | **L1** | hypotéza, nízká frekvence |

---

## Nálezy

### Potvrzen stav existujících (E1-E5) — ✅ OPRAVENO v HEAD

Všechna 4 původní TOCTOU/DP/LU/AT místa jsou v HEAD opravena:
- `appendTransactionIfSufficient` — atomický `$gte` filter (RC-E1) ✅
- `markRefundedIfActive` — atomický `status:'active'` filter (RC-E2) ✅
- `undoLast` — `withTransaction` + sekvenční fallback (RC-E3) ✅
- `appendItemToSection` — atomický `$push` + fáze 1/2/retry (RC-E4) ✅
- celý purchase — `withTransaction` + sekvenční fallback s plnou kompenzací (RC-E5) ✅

E6 (transfer bez balance floor) — stav ⬜ beze změny, registr označuje ⚖️ by-design.

---

### Nové nálezy

---

**RC-RUN-01** — [LU] `removeFromInventory` full-array `$set` — stejný vzor jako opravený RC-E4

- **Kde:** `campaign-purchase.service.ts:508-518` (`removeFromInventory` privátní helper)
- **Kód:**
  ```ts
  const inv = await this.subdocsService.getInventory(...)  // READ celých sections
  const sections = inv.sections.map(...)                    // JS mutace
  await this.subdocsService.updateInventory(character.id, { sections }) // $set full-array
  ```
- **Volající:**
  1. `refund()` L462 — odebrání položky ze storna (po atomickém `markRefundedIfActive`)
  2. `purchaseSequentialFallback()` L355 — kompenzace při selhání kroku 2 (debit)
  3. `purchaseSequentialFallback()` L391 — kompenzace při selhání kroku 3 (purchase log)
- **Dopad:** Souběžný nákup jiné položky (přes `appendItemToSection`) mezi `getInventory` a `updateInventory` v `removeFromInventory` → `updateInventory` přepíše inventář ze zastaralého snapshotu → nově koupená položka zmizí. Výsledek: ztráta inventáře bez záznamu. Závažnost 🟠 (totožný vzor jako RC-E4, který byl potvrzeno červený).
- **Konkrétní scénář:** hráč klikne "Koupit" (itemB) a PJ "Vrátit" (itemA) naráz — storno přečte sekce [itemA, itemB-in-flight], odstraní itemA, uloží jen []. itemB zmizí.
- **Návrh:** Atomický `$pull` položky ze sekce přes `arrayFilters` (vzor `appendItemToSection`); přidat `removeItemFromSection(characterId, sectionId, itemId)` do `CharacterInventoryRepository` — jeden `findOneAndUpdate` s `$pull: { 'sections.$[sec].items': { id: itemId } }`.
- **L2** (staticky ověřeno, bez deterministického race testu)
- 🆕

---

**RC-RUN-02** — [LU] `addCoOwner` / `removeCoOwner` full-array `$set ownerCharacterIds`

- **Kde:** `character-accounts.service.ts:695-724` (`addCoOwner` L702, `removeCoOwner` L720)
- **Kód:**
  ```ts
  const account = await this.getAccount(accountId)          // READ ownerCharacterIds
  const next = account.ownerCharacterIds.filter(...)        // JS filter
  await this.accountsRepo.update(accountId, { ownerCharacterIds: next }) // $set full-array
  ```
- **Dopad:** Dva souběžné `addCoOwner` nebo `removeCoOwner` volání → druhý přepíše stav prvního. V praxi: PJ přidá spoluvlastníka A a B naráz → jen B zůstane (A se ztratí, přestože server vrátil 200). Závažnost 🟡 (metadata, ne peníze; neviditelná ztráta přístupu).
- **Návrh:** `$addToSet` pro addCoOwner (idempotentní atomický); `$pull` pro removeCoOwner — oba bez read fáze.
- **L1** (hypotéza z inspekce kódu)
- 🆕

---

**RC-RUN-03** — [LU+TOCTOU] `changeCurrency(convert:true)` — read-then-full-replace peněžních polí

- **Kde:** `character-accounts.service.ts:232-289` + `character-account.repository.ts:130-148` (`replaceMoneyFields`)
- **Kód:**
  ```ts
  const account = await this.getAccount(accountId)          // READ transactions/balance
  const transactions = account.transactions.map(...)        // přepočet kurzem
  await this.accountsRepo.replaceMoneyFields(accountId, { currency, balance, transactions, ... })
  ```
- **Dopad:** Pokud se mezi `getAccount` a `replaceMoneyFields` provede `adjust` nebo `transfer` (atomický `$inc`), `replaceMoneyFields` přepíše `balance` a `transactions` z zastaralého snapshotu → nová transakce zmizí. Výsledek: tichá ztráta transakce + nekonzistentní balance. Závažnost 🟡 (vzácná operace, PJ-only).
- **Poznámka:** Riziko je nízké — `changeCurrency(convert:true)` je admin operace, neprovádí se souběžně s adjust běžně. Ale pattern je stejný jako RC-E3.
- **Návrh:** Celý blok do `withTransaction` nebo optimistic lock (podmíněný `replaceMoneyFields` ověřit `balance === expectedBalance`).
- **L1** (hypotéza z inspekce kódu)
- 🆕

---

### Stav existujícího RC-E6 (dle registru ⬜)

Transfer bez balance floor → přečerpání je registrován jako ⚖️ by-design (PJ smí mínus). Kód potvrzen: `transfer()` L507 neobsahuje balance check před `withTransaction` — záměrné.

---

## Dosažená úroveň L vs. cílová

- Existující E1-E5: **L4** (opraveno, testy zelené; L5-teeth = Stryker, pouze on-demand, neověřen v tomto statickém běhu) → **PROOF-REQUEST viz níže**
- Nový RC-RUN-01: **L2** statická (vzor totožný s potvrzenými RC-E4)
- Nový RC-RUN-02, RC-RUN-03: **L1** (hypotéza)

---

## PROOF-REQUEST

**PR-E-01 (L5-teeth):** Spustit Stryker mutační testy na race ekonomika specy:
```
npx stryker run --testRunner jest --files "src/modules/campaign/**,src/modules/character-subdocs/**" --testFiles "test/race/economy.race.e2e-spec.ts"
```
Cíl: ověřit, že mutace `$gte` → `$gt` (RC-E1), `status:'active'` → `{}` (RC-E2), `withTransaction` odstranění (RC-E5) způsobí červené testy. Bez tohoto kroku testy dokazují existenci bugu před fixem, ale ne úplnou sílu detekce.

**PR-E-02 (L3 pro RC-RUN-01):** Napsat deterministický race test pro `removeFromInventory` + souběžný `appendItemToSection`:
```
Gate na updateInventory → spusti appendItemToSection → pusť updateInventory → ověř totalItems
```
Očekávání: test červený bez atomického `$pull` fixu; zelený po fixu.

**PR-E-03 (L2 pro RC-RUN-02):** Stres test `Promise.all([addCoOwner(A), addCoOwner(B)])` → ověř `ownerCharacterIds.length === original+2`. Pravděpodobnost race v Node single-thread je nízká, ale `$addToSet` fix je triviální.
