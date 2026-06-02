# Implementační plán — krok 11.3 Obchod (Shop) + nákupní vrstva

**Datum:** 2026-06-02
**Status:** ⏳ Čeká na schválení
**Spec:** [`spec-11.3.md`](./spec-11.3.md)
**Větev:** **`main`** — commit přímo (per `feedback_work_on_main.md`), git řeší uživatel ručně
**Repo:** `Projekt-ikaros-FE` (FE) + `Projekt-ikaros/backend` (BE — 2 nové entity + úprava `CampaignShopItem`)

---

## Pořadí stavby (proč)

Nákup sahá do 3 modulů přes BE i FE. ⚠️ Dle `feedback_no_mixed_be_fe_batch` BE a FE kroky **sekvenčně**, ne v jedné paralelní dávce. Dle `feedback_no_debt` žádné částečné odložení — každý sub-krok je kompletní (kód + testy).

1. **N0 (BE)** — skupiny + slevy: bez nich nemá katalog co zobrazit ani z čeho počítat cenu.
2. **11.3b (FE)** — katalog: stránka, scope, karty, CRUD položek/skupin, filtry, cena+sleva, referenceLink. Dogfooduje N0.
3. **N1 (BE)** — nákupní vrstva: `CampaignPurchase`, purchase/refund/list, atomicita.
4. **N2 (FE)** — nákupní UX: peněženka, „nakupuji pro", dialog (sleva/množství/zůstatek před→po).
5. **N3 (FE)** — storno UX: „Moje nákupy" panel + refund.
6. **11.3d** — `mobil-desktop` audit + `napoveda` + roadmap/dluhy.

**Commit strategie:** ~5 commitů (N0 / katalog / N1 / nákup+storno / docs). Každý revert-safe. BE commity v BE repu, FE v FE repu.

---

## ČÁST A — BACKEND (repo `Projekt-ikaros`)

### Step N0 — Skupiny + slevy (`CampaignShopGroup`)

**Nové soubory** (`backend/src/modules/campaign/`):
- `schemas/campaign-shop-group.schema.ts` — `CampaignShopGroup` (worldId, ownerId, isShared, name, parentId?, order, discountPercent default 0) + indexy `{worldId,ownerId}`, `{worldId,parentId}`.
- `interfaces/campaign-shop-group.interface.ts`
- `dto/create-campaign-shop-group.dto.ts` + `update-…` — `discountPercent` `@Min(0) @Max(100)`.

**Edit soubory:**
- `schemas/campaign-shop-item.schema.ts` — `group: string` → `groupId: string`, `subgroup?` → `subgroupId?`; `+ discountPercent` (0–100, default 0). Volitelně `groupName`/`subgroupName` denormalizovaný snapshot (rozhodnout — viz spec §5A.1).
- `interfaces/` + `dto/` položky — sjednotit pole.
- `campaign.controller.ts` — `+ /campaign/shopgroups` (GET list, POST, PUT :id, DELETE :id). DELETE neprázdné → `409` se seznamem položek.
- `campaign.service.ts` — scope/`canModify` reuse (stejný jako shopitems); guard mazání neprázdné skupiny.
- **`campaign.repository.ts` (toEntity mapper)** — ⚠️ per `project_be_field_checklist`: nová pole `groupId/subgroupId/discountPercent` doplnit do `toEntity`, jinak GET tiše zahodí. **Začít od mapperu.**

**Testy** (`*.spec.ts`): group CRUD (PJ ok / PomocnyPJ svoje+sdílené / Hrac 403), `discountPercent` validace 0–100, DELETE neprázdné → 409, položka s `groupId` round-trip (toEntity).

**Acceptance:** `npm run typecheck && npm run lint:check` ✓; jest zelený (ručně, per `feedback_be_precommit_prettier` — prettier --write + jest před commitem); restart BE (`feedback_be_restart_required`).

---

### Step N1 — Nákupní vrstva (`CampaignPurchase`)

**Nové soubory:**
- `schemas/campaign-purchase.schema.ts` — dle spec §5.1 (worldId, characterId, buyerUserId, shopItemId, itemSnapshot, quantity, unitPriceOriginal, discountPercent, accountId, accountTransactionId, paidAmount, paidCurrency, inventorySectionId, inventoryItemId, status, refundedAt?). Index `{worldId, characterId, status}`.
- `interfaces/` + `dto/` (purchase dto: `{characterId, accountId, quantity?, sectionId?}`).
- `services/campaign-purchase.service.ts` — orchestrace nákupu/storna (viz níže).

**Endpointy** (`campaign.controller.ts`):
- `POST /campaign/shopitems/:id/purchase` — body `{characterId, accountId, quantity?, sectionId?}` → `{purchase, newBalance}`.
- `POST /campaign/purchases/:id/refund` → `{purchase, newBalance}`.
- `GET /campaign/purchases?characterId=` — list.

**Service logika (purchase):**
1. Načti item (+ skupinu kvůli slevě), postavu, účet; ověř účet patří postavě.
2. Efektivní sleva = `item.discountPercent ?? group.discountPercent ?? 0`; eff. cena/ks = `price×(1−sleva/100)`; převod do měny účtu (reuse `WorldCurrenciesService.convert` math `fromRate/toRate`); `paidAmount = converted×quantity`.
3. Kontrola zůstatku (`balance < paidAmount` a bez debetu → `409`).
4. Odečti z účtu (reuse account `adjust` service, delta `-paidAmount`, desc „Nákup: {name}") → `accountTransactionId`.
5. Přidej do `CharacterInventory` (sekce `sectionId` nebo auto „Nakoupeno z obchodu") → `inventoryItemId`.
6. Zapiš `CampaignPurchase` (status `active`).
- ⚠️ **Atomicita** — Mongo session/transaction; pokud replica set nepodporuje → kompenzace (rollback kroku 4 při selhání 5). Ověřit prostředí (spec §11).

**Service logika (refund):** vrátit `+paidAmount` na účet → odebrat inventory item (tolerantně, když chybí → peníze vrátit, edge do dluhů) → `status: refunded`.

**Role gate:** hráč jen své postavě + `account.allowPlayerSelfAdjust` (jinak 403); PJ/PomocnyPJ kterékoli. Refund stejně.

**Testy:** nákup happy path (odečet+inventory+log), sleva aplikována, převod měny, nedostatek → 409, hráč cizí postava → 403, hráč bez self-adjust → 403, refund vrací peníze+item, refund smazaného itemu (tolerantní), množství >1.

**Acceptance:** stejné jako N0 (typecheck/lint/jest/restart).

---

## ČÁST B — FRONTEND (repo `Projekt-ikaros-FE`)

**Nová složka** `src/features/world/shop/` (paralelní k `currencies/`, `campaign/`).

### Step 11.3b — Katalog FE

**Foundation:**
- `shop/types.ts` — `ShopItem`, `ShopGroup` (sjednoceno s BE; per `type-sync` skill ověřit).
- `shop/api.ts` — hooky: `useShopItems(worldId)`, `useShopGroups(worldId)`, `useCreate/Update/DeleteShopItem`, `…ShopGroup` (queryKey `['shop-items'|'shop-groups', worldId]`, invalidace on success).
- `shop/pricing.ts` — `effectiveDiscount(item, group)`, `effectivePrice(item, group)`, `comparePriceInBase(...)` (reuse `convertAmount` z currencies/shared). + `pricing.spec.ts`.

**Komponenty** (`shop/components/`):
- `ShopItemCard.tsx` — karta: název, cena (`<CurrencyDisplay convertTo={preferred}>`), sleva (přeškrtnuto + badge), ⭐, 📖 (Link na `referenceLink`), 🛒.
- `ShopItemForm.tsx` — modal CRUD: name, description, skupina (select `ShopGroup` + „nová"), podskupina, cena `<CurrencyAmountInput>`, sleva %, **referenceLink = `PagePicker`** (reuse `PageEditor/components/PagePicker` + `usePagesDirectory`), isRecommended, isShared, „často kupováno s" multiselect.
- `ShopGroupsManager.tsx` — drawer/modal CRUD skupin/typů (strom skupina→podskupiny, reorder, sleva %; vzor `SectionListEditor`).
- `ShopFilters.tsx` — hledání, filtr skupina, měna ▾ (`useUserPreferredCurrency`), řazení.
- `ShopItemDetail.tsx` — modal: description, referenceLink, „často kupováno s" odkazy.

**Page:** `ShopPage.tsx` — přepsat stub: header (title, scope ▾, peněženka placeholder, „+ Položka"/„Spravovat typy" pro PJ), filtry, mřížka karet. (Peněženka + „nakupuji pro" + nákup až N2 — v 11.3b jen katalog + CRUD.)

**Testy** (vitest, bez globals, fireEvent — per `project_fe_test_precommit`): pricing util (sleva/převod/řazení), ShopItemCard (sleva render), ShopItemForm (validace), ShopGroupsManager (CRUD).

**Acceptance:** `npx tsc --noEmit` ✓; `eslint --fix` (NE prettier — `feedback_fe_no_prettier`); `npm run test:run` zelený; `npm run build` ✓.

---

### Step N2 — Nákupní UX FE

- `shop/api.ts` +`usePurchase(worldId)`, `usePurchases(worldId, characterId)` (invalidace: shop purchases + `useCharacterAccounts` + inventory query po nákupu).
- `shop/components/WalletBadge.tsx` — 👛 zůstatek cílové postavy (reuse `useCharacterAccounts` + `<CurrencyDisplay>`), sticky mobil.
- `shop/components/BuyerSelect.tsx` — „nakupuji pro" ▾ (jen PJ/PomocnyPJ; reuse persona/pages directory). Hráč = jeho postava (zámek).
- `shop/components/PurchaseDialog.tsx` — dialog §6.1: pro=cílová postava, účet ▾ (+zůstatky), množství (stepper+ruční), sleva, celkem, **zůstatek před→po** (živě, červeně <0), block při nedostatku / bez self-adjust → „požádej PJ".
- `ShopPage.tsx` — zapojit wallet + buyerSelect do headeru, 🛒 otevírá dialog.
- Auth: per `auth-policy` skill ověřit 403 handling (hráč cizí postava / bez self-adjust).

**Testy:** PurchaseDialog (zůstatek před→po, množství×cena, block nedostatek), pricing v dialogu, WalletBadge.

**Acceptance:** stejné jako 11.3b.

---

### Step N3 — Storno UX FE

- `shop/components/MyPurchasesPanel.tsx` — záložka/panel „🛒 Moje nákupy": list `usePurchases(characterId)`, „↩ Vrátit" → `ConfirmDialog` → `useRefund` (invalidace accounts+inventory+purchases).
- `ShopPage.tsx` — zapojit panel (cílová postava dle headeru).

**Testy:** MyPurchasesPanel (list, refund flow, scope hráč vs PJ).

**Acceptance:** stejné.

---

## Step 11.3d — Audit + dokumentace

1. **`mobil-desktop`** skill — mřížka→1 sloupec, peněženka sticky, dialog scroll, tabulka skupin→karty ≤600px (desktop ≥1024 / tablet 769–1024 / mobil ≤768).
2. **`napoveda`** skill — sekce Obchod (role, nákup, storno, slevy) do `/ikaros/napoveda`; přechod 🚧→✅.
3. **Roadmap** — zaškrtnout 11.3b/c/d v `roadmap-fe.md`; poznámka že 11.3a QuickNotes zůstává.
4. **Dluhy** — `dluh` skill na edge-cases: refund smazané inventory položky, atomicita bez Mongo transakce (pokud prostředí nepodporuje), případný groupName snapshot drift.

---

## Verifikace (před každým FE commitem)
```
npx tsc --noEmit
npx eslint src --fix
npm run test:run
npm run build
```
BE (ručně před commitem, per `feedback_be_precommit_prettier`): `prettier --write` dotčené + `npm run typecheck` + `npm run lint:check` + `jest` + **restart BE**.

## Rizika (ze spec §11)
- ⚠️ Atomicita bez Mongo session → kompenzace + dluh.
- ⚠️ Drift inventory (hráč smaže koupené) → tolerantní refund + dluh.
- ⚠️ Smazaná položka/skupina katalogu → `itemSnapshot`/`groupName` snapshot.
- ⚠️ `groupId` migrace — shop je prázdný stub, žádná data; přesto ověřit, že žádný seed/fixture nečeká starý `group` string.
