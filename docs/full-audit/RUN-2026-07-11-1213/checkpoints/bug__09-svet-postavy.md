# Checkpoint — bug / 09-svet-postavy

Datum: 2026-07-11 · RUN-2026-07-11-1213 · styl **bug** (registr `docs/bug-audit.md`, prefix `N-`)
Auditor: read-only, needituje kód.

## Dosažená vs cílová L

- **Cílová L (auto kritické cesty):** L3/L4.
- **Dosažená L:** **L2** (statické čtení L1 + kontrakt/authz reasoning L2 napříč celým BE záběrem). Pro peníze/authz cesty existují service-unit specy (campaign-purchase / character-accounts / campaign / bestiae / world-currencies / characters / character-subdocs / system-presets) → happy-path chování je L3, ale specy jsem v tomto běhu NEspouštěl (M3 neproveden). Doběh na L3 = spustit tyto jesty.

## Co jsem prošel (plná hloubka)

**BE — service vrstva (L1+L2, celé):**
- `characters.service.ts` (create/update/convert/delete/findBySlug/assertSubdocAccess/assertCanViewDirectory/syncKind/getPlayerCharacters) + `characters.controller.ts` (guardy, IDOR brány).
- `character-subdocs.service.ts` (diary lazy-create + customDataPatch delta merge + coerce/resolveAllowedKeys, finance/inventory/notes/calendar lazy-create + NOT_APPLICABLE brány, onCharacterCreated/Converted/Deleted kaskády, remap) + `character-subdocs.controller.ts` + `diary-overrides.controller.ts` + `repositories/character-diary.repository.ts` (delta `$set`/`$unset`, remapKeysByWorldId, clearOverrides).
- `character-accounts.service.ts` (adjust/assertCanAdjust, debitIfSufficient, undoLast/undoLastOnce, transfer + sequential fallback, changeCurrency, co-owners, permission helpers, onCharacterDeleted) + `character-accounts.controller.ts` (content/settings/adjust/undo/transfer gating).
- `campaign/services/campaign-purchase.service.ts` (purchase tx + sequential fallback + kompenzace, refund, listPurchases, removeFromInventory, effectiveDiscount).
- `campaign.service.ts` (resolveScope/resolveShopScope/canModify, subjects/relationships/storylines/scenarios/quicknotes/shopitems/shopgroups CRUD + IDOR + logChange, deleteShopGroup empty-guard, getDashboard/getChangelog) + `campaign.controller.ts` (role-floor gates, resolveIsShared, purchase/refund/list routy).
- `bestiae.service.ts` (list 3-scope + assertCanReadWorld, findById/create/update/softDelete/restore/clone, community createCommunity/updateLore/cloneCommunity/proposeStatblock/approve*, moderation*, authz helpers, hardDelete listener) + `bestiae.controller.ts` (guardy).
- `world-currencies.service.ts` (getCurrencies/updateCurrencies/convert/seedForWorld/getItems + assertMember/assertCanAdmin/assertCanEdit) + DTO `update-world-currencies.dto.ts`, `convert-currency.dto.ts`.
- `world-gm-notes.service.ts` (getNotes/updateNotes/assertPj).
- `system-presets.service.ts` (findAll/findOne + SYSTEM_TO_PRESET alias).

**FE — spot-check (L1+L2):**
- `shop/pricing.ts` (effectiveDiscount/effectivePrice) — parita s BE `effectiveDiscount` OK (item > subgroup > group, clamp 0–100, round4). SP-101/117 ✅L2.
- `currencies/validation.ts` (currencyItemBaseSchema/createCurrencyItemSchema) — code `^[A-Z0-9]{1,8}$`, name max 40, rate ≥ 0.0001, unique case-insensitive + excludeCode. SP-98/99 ✅L2.

**Neprošel do hloubky (FE [human]/[auto] zbytek):** FE komponenty bestiar/campaign/pavucina graph (SP-139–145), DiaryTab/schema editor (SP-40–43, 125–131), PurchaseDialog/MyPurchasesPanel/Transfer/AccountSwitcher UI (SP-54–58, 115–120), WorldGmDiaryPage (SP-150–152). Většina [human] nebo vyžaduje běžící FE.

## Ověřené spec body (výběr, bez nálezu)

- SP-06/08/07/14/15/16/23 characters create/convert/slug/idempotent syncKind — ✅L2.
- SP-25/26 assertSubdocAccess Lokace 404-anti-leak + persona owner/staff — ✅L2.
- SP-28/29/30/31/32 diary lazy-create + pass-through + delta merge ($set/$unset) — ✅L2.
- SP-39 DiaryOverrides.resetAll `assertCanAdminWorld` — ✅L2.
- SP-51 accounts adjust hráč bez flagu → 403 PLAYER_ADJUST_DISABLED — ✅L2.
- SP-52/53 transfer sequential fallback revert + CURRENCY_MISMATCH — ✅L2.
- SP-73/75/76/77/86/87 bestiae scope authz + soft-mode — ✅L2.
- SP-88/89/90/91/92/93/94/95 currencies member/admin/edit + convert + duplicate guard + seed — ✅L2.
- SP-135/136/137/138 deleteSubject cascade rel, deleteShopGroup empty-guard, logChange fire-and-forget, createScenario maxOrder+1 — ✅L2.
- SP-146–149 GM notes PJ gate + Admin bypass — ✅L2.
- SP-121/122/123/124 system-presets meta + null soft-mode — ✅L2.

## Nálezy

### N-RUN-01 — 🆕 🟡 [E2 Ekonomika/obchod] Nákup neenforcuje `isShared` pro hráče (obejití publish-brány)
- **Kde:** `backend/src/modules/campaign/services/campaign-purchase.service.ts:86-91` (`purchase` — `item = shopRepo.findById(itemId); if (!item || item.worldId !== worldId) 404`), controller `campaign.controller.ts:796-809` (jen `role()` = membership check).
- **Úryvek:**
  ```ts
  const item = await this.shopRepo.findById(itemId);
  if (!item || item.worldId !== worldId)
    throw new NotFoundException({ code: 'CAMPAIGN_ITEM_NOT_FOUND', ... });
  // …žádná kontrola item.isShared pro non-staff…
  ```
- **Dopad:** `resolveShopScope` (N-22) skryje nesdílené (nepublikované/draft) položky ze SEZNAMU hráče, ale `purchase` je čte přímo přes id a `isShared` neověřuje. Hráč-člen, který zná `itemId` nepublikované položky (nebo dřív sdílené a odsdílené), ji může koupit → utratí vlastní peníze, položka spadne do inventáře a **response vrací `itemSnapshot`** (name/price/skupina) = leak detailu draftu. Nutnost znát ObjectId → nízká pravděpodobnost, ale jde o obejití autorizační publish-brány (BE je autorita). Souvisí facet N-RUN-02.
- **Návrh:** v `purchase` pro non-staff vyžadovat `item.isShared === true` (mirror `resolveShopScope`). Symetricky opravit i read (viz N-RUN-02).
- **L:** L2.

### N-RUN-02 — 🆕 🟡 [E2 Ekonomika/obchod] `findShopItemById` používá `canModify` jako read-bránu → hráč 403 i na SDÍLENOU položku
- **Kde:** `backend/src/modules/campaign/campaign.service.ts:954-973` (`findShopItemById` → `if (!this.canModify(entity, userId, worldRole)) 403`), controller `campaign.controller.ts:630-642` (`GET /campaign/shopitems/:id`).
- **Dopad:** `canModify` = write-brána (PJ / isShared+PomocnyPJ / owner). Pro obyčejného Hráče vrací `false` i u sdílené položky → **403 na detail sdílené položky**. Nesoulad s `resolveShopScope` (seznam sdílené hráči propouští). Pokud FE volá tento single-item GET pro hráče (detail/nákupní dialog), detail se rozbije; jinak latentní (FE renderuje detail z listu). Opačná polarita než N-RUN-01 (purchase příliš volný, read příliš přísný) — obě z toho, že single-item cesty ignorují `isShared`/`resolveShopScope` sémantiku obchodu.
- **Návrh:** pro shop číst přes isShared/resolveShopScope model (hráč vidí sdílené), ne přes `canModify`. Sloučit s opravou N-RUN-01 do jednotné shop-single-item authz.
- **L:** L2. **PROOF-REQUEST:** ověřit, zda FE (ShopItemDetail / PurchaseDialog) volá `GET /campaign/shopitems/:id` v roli Hráč → potvrdí, zda je 403 živý bug nebo latentní.

### N-RUN-03 — ♻️(sharpening D-LAUNCH-GAP refund) 🟠 [E2 · DUR] refund flipne status PŘED kontrolou oprávnění ke kreditu → deterministická ztráta peněz
- **Kde:** `backend/src/modules/campaign/services/campaign-purchase.service.ts:451-469` (`markRefundedIfActive` → poté `accountsService.adjust(...)` → `assertCanAdjust`).
- **Detail:** refund brána = `isStaff || isOwner` (bez `allowPlayerSelfAdjust` checku). Vlastník-hráč bez self-adjust flagu (typicky když nákup provedl **PJ/staff** na účet s vypnutým self-adjust, nebo PJ flag vypnul po nákupu) projde bránou → `markRefundedIfActive` přepne status na `refunded` → následný `adjust` hodí `PLAYER_ADJUST_DISABLED` (403) → **peníze se nevrátí, položka se neodebere, nákup je natrvalo `PURCHASE_ALREADY_REFUNDED`** (nevratný broken state, hráč blokován).
- **Vztah ke known:** rozšiřuje `D-LAUNCH-GAP-2026-07-11` „Refund ztratí peníze při pádu" o **deterministický (ne-crash) spouštěč** — stejný kořen (status flip bez kompenzace). FE N-23 skrývá tlačítko (snižuje pravděpodobnost), ale BE musí být bezpečný.
- **Návrh:** ověřit oprávnění ke kreditu (assertCanAdjust) PŘED `markRefundedIfActive`, nebo refund vlastníka gate-ovat stejně jako adjust; při selhání kroků po flipnutí přidat kompenzaci (revert statusu).
- **L:** L2.

## Známé nálezy potvrzené jako STÁLE PŘÍTOMNÉ (nehlásím jako nové)

- **N-10** (`assertSubdocAccess` ignoruje `_options.action`) — controller `character-subdocs.controller.ts:98-116` posílá `{action:'read'}` pro `GET calendar`, ale service `characters.service.ts:152-197` param nepoužívá → Lokace: člen-Hrac dostane 403 i na čtení kalendáře (spec 9.2 nesplněn). **Neopraveno.** ♻️ (registr + dluhy).
- **D-NEW-INV-DATA-SYNC** — `getFinance`/`getInventory` házejí `*_NOT_APPLICABLE` pro NPC/Lokaci (`character-subdocs.service.ts:416-435, 504-523`), ale `onCharacterCreated` finance+inventory subdoc pro NPC/Lokaci **zakládá** (řádky 141-152) → orphan data. ♻️. **Pozn.:** bug-plán SP-09/10/44/48 popisují OPAK (lazy-create pro NPC/Lokaci) — **plán je zastaralý vůči kódu** (spec drift, ne bug).
- **D-LAUNCH-GAP refund/undo/purchase durabilita** — `refund` bez tx/kompenzace (viz N-RUN-03); `undoLast` (`character-accounts.service.ts:480`) popne poslední tx bez typové vazby a obchází `allowPlayerSelfAdjust` (route `undo` gate = `assertWriteContentAccess`, ne `assertCanAdjust`) → potvrzeno stále přítomné. ♻️.
- **Starý finanční model** (`character-subdocs.service.ts` `addMonthly:459`/`undoLastTransaction:483`) dělá non-atomický read-modify-write balance (`balance: finance.balance ± delta` přes full `repo.update`) — na rozdíl od nového `CharacterAccount.undoLast` (withTransaction, RC-E3). Lost-update riziko při souběhu. Pravděpodobně deprecated cesta (PC-only finance tab); orientačně spadá pod race-condition audit / D-NEW-INV-DATA-SYNC. Nehlásím jako nový — nízká prio, známá oblast.

## PROOF-REQUESTy

1. **N-RUN-02:** grep FE, zda `GET /campaign/shopitems/:id` (single) je volán v roli Hráč (ShopItemDetail/PurchaseDialog) → potvrdí live vs latentní 403.
2. **Doběh na L3:** spustit BE jesty oblasti (`campaign-purchase.service.spec`, `character-accounts.service.spec`, `campaign.service.spec`, `bestiae.service.spec`, `world-currencies.service.spec`, `characters.service.spec`, `character-subdocs.service.spec`) → potvrdí happy-path chování ověřených SP bodů.
3. **N-RUN-01/03:** gap-fill test (M7) — hráč koupí `isShared:false` položku (má projít dnes, po fixu 403/404); refund vlastníka bez self-adjust flagu (dnes broken state, po fixu čistý 403 bez flipnutí statusu).
