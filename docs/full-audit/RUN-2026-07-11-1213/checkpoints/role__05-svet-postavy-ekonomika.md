# Checkpoint — role / 05-svet-postavy-ekonomika

Datum: 2026-07-11 · RUN-2026-07-11-1213 · styl **role** (registr `docs/role-audit.md`, prefix `R-`)
Auditor: read-only, needituje kód. Oblast `docs/role-plan/05-svet-postavy-ekonomika.md`.

## Dosažená vs cílová L

- **Cílová L:** role body L2+; bezpečnostní (`ES`/`OW`/`LK`) L3+; kritické „FE schová → BE drží" red-team M8 → L4.
- **Dosažená L:** **L2** (statické čtení L1 + kontrakt/authz + FE↔BE parity reasoning L2 napříč celým BE záběrem + FE spot-check). Existující service/FE specy pokrývají happy-path (L3 potenciál), ale v tomto běhu jsem je NEspouštěl (M3/M7 neproveden). Kritické nálezy níže mají PROOF-REQUEST na M8 red-team → L4.

## Pokrytí (plná hloubka L1-L2)

**BE — kompletně čteno:**
- `characters.service.ts` + `characters.controller.ts` (assertCanManage / findBySlug / assertSubdocAccess / assertCanViewDirectory / update / convert / delete / IDOR brány).
- `character-subdocs.service.ts` + `character-subdocs.controller.ts` (diary/finance/inventory/notes/calendar + kaskády).
- `character-accounts.service.ts` + `character-accounts.controller.ts` (4-tier assert: read/write-content/write-settings/delete + adjust/assertCanAdjust + transfer/co-owners).
- `bestiae.service.ts` + `bestiae.controller.ts` (3-scope + community + moderation + authz helpers).
- `world-currencies.service.ts` + `world-currencies.controller.ts` (assertMember/assertCanAdmin/assertCanEdit + convert).
- `campaign.service.ts` + `campaign.controller.ts` (resolveScope/resolveShopScope/canModify + role-floor gates + IDOR).
- `campaign/services/campaign-purchase.service.ts` (purchase/refund/listPurchases).

**FE — spot-check:** `FinanceTab.tsx`, `shop/api.ts`, `shop/components/{ShopView,PurchaseDialog,MyPurchasesPanel}.tsx`, `PostavaLayout.tsx`, `accounts/SettingsAccountSection.tsx`.

---

## Nálezy

### 🆕 R-RUN-P1 — [`ES`/`OW`] `add-monthly` + editace income/expense obchází `allowPlayerSelfAdjust` (obchvat RE-1)
- **Kde:** BE `character-accounts.controller.ts:211-224` (`add-monthly` → `assertWriteContentAccess` = staff||owner, **BEZ** flag checku) · `character-accounts.service.ts:169-183` (`updateAccountContent` mění `incomeEntries`/`expenseEntries`, gate write-content = owner) · FE `FinanceTab.tsx:426-433` a `:759-766` (tlačítko „Zaúčtovat měsíc" NEgatováno `canAdjust`, komentář `:357-359` to explicitně říká) + edit-mode entry editor `:726-748`.
- **Osa:** `ES` (vertikální — hráč získá efekt PJ money-mint), `OW`.
- **Dopad:** Owner-Hrac s vlastním účtem (účet si smí založit sám přes `POST characters/:slug/accounts`, gate `assertSubdocAccess`=owner → je primaryOwner): edituje `incomeEntries` na libovolnou částku (write-content, owner OK) → „Zaúčtovat měsíc" (`add-monthly`, write-content, owner OK) → `balance += Σincome-Σexpense`. **Bez** `allowPlayerSelfAdjust`. Přitom `adjust` („Vklad/Výběr", stejný efekt na balance) JE flag-gated (`assertCanAdjust`, `:383-408`). Sourozenecké dveře k mutaci zůstatku — jedny zamčené flagem, druhé ne. Přesně obchvat RE-1 (v plánu „nejkritičtější": hráč nemá sám měnit zůstatek bez PJ souhlasu). Insider (jen vlastník účtu), herní integrita/férovost ekonomiky.
- **Návrh:** buď `add-monthly` + `updateAccountContent(incomeEntries/expenseEntries)` pro non-staff ownera gate `assertCanAdjust` (flag), NEBO vědomě potvrdit jako záměr (hráč spravuje vlastní rozpočet) a doplnit do plánu/matice (dnes plán mlčky předpokládá, že flag je jediná brána mutace zůstatku). **PROOF-REQUEST: M8 red-team** — Hrac-owner bez flagu nafoukne balance přes add-monthly.
- **L:** L2 (BE staticky + FE potvrzeno).

### 🆕 R-RUN-P2 — [`DD`] refund flipne status PŘED re-checkem `assertCanAdjust` → částečný stav
- **Kde:** `campaign-purchase.service.ts:442` (vnější gate `isStaff||isOwner`) → `:451` `markRefundedIfActive` (flip statusu) → `:461` `accountsService.adjust` → `assertCanAdjust` (owner potřebuje flag).
- **Osa:** `DD` (vrstvení zámku — vnější gate slabší než vnitřní autoritativní, mutuje před ním).
- **Dopad:** Owner bez `allowPlayerSelfAdjust` projde vnějším `isOwner` gate, status se flipne na `refunded`, pak `adjust` hodí `PLAYER_ADJUST_DISABLED` → **status=refunded, peníze nevráceny, položka v inventáři zůstává**. Latentní (FE `MyPurchasesPanel.tsx:45-49` `canRefund` skrývá tlačítko non-flag hráči), ale přímým API voláním (M8) reachable → nekonzistentní/nedurabilní stav.
- **Návrh:** pre-check `assertCanAdjust` PŘED `markRefundedIfActive`, nebo status flip + kredit v jedné kompenzované transakci. **PROOF-REQUEST: M8** direct `POST purchases/:id/refund` non-flag owner.
- **L:** L2.

### 🆕 R-RUN-P3 — [`OR`/`PC`] `findShopItemById` gate = `canModify` (write) → hráč vidí `isShared` položku v listu, detail 403
- **Kde:** `campaign.service.ts:954-973` (`findShopItemById` → `canModify` `:122-126`) vs `:938-952` (`findShopItems` → `resolveShopScope` `:112-120`, hráč vidí `isShared`). Controller `campaign.controller.ts:630-642`.
- **Osa:** `OR` (over-restrikce), `PC` (dvoje dveře k témuž zdroji, různý zámek).
- **Dopad:** LATENTNÍ — FE `shop/api.ts` NEvolá `GET /shopitems/:id` (jen `useShopItems` list + `usePurchases`). Přímým API voláním hráč dostane `403 CAMPAIGN_FORBIDDEN` na detail sdílené položky, kterou VIDÍ v listu. Bez FE konzumenta = dnes neblokuje, ale nekonzistence.
- **Návrh:** detail-read obchodní položky přes shop-scope logiku (isShared čitelné hráči), ne `canModify`. Analogie R-09 latentnosti.
- **L:** L2.

### ♻️ R-RUN-P4 — [`OW` drift, R-14 záměr] `assertSubdocAccess` IGNORUJE `_options.action` (PO-05 fakticky revertnuto)
- **Kde:** `characters.service.ts:152-197` (`_options?: {action}` prefix `_`, nikdy nepoužit) ↔ controller `character-subdocs.controller.ts:109-114` (`getCalendar` posílá `{action:'read'}`, komentář `:107-108` tvrdí „read umožňuje Lokaci číst kalendář všem členům") a `:128-133` (`updateCalendar` `{action:'write'}`).
- **Podstata:** Lokace = PomocnyPJ+ pro read I write (`:174-186`), `action` param mrtvý. Plán **PO-05** (N-10 regrese: „assertSubdocAccess má respektovat action, GET Lokace kalendáře hráči = read → member") je tímto REVERTNUTO. = **R-14 záměr** (8.1-FIR 2026-05-24 vědomě přebíjí spec 9.2, registr `role-audit.md`). Ne bezpečnostní nález; mrtvý param + klamavý controller komentář = code-hygiene dluh. **Doc-fix:** aktualizovat PO-05 v plánu (action se neaplikuje, Lokace subdoc = staff-only záměr).
- **L:** L2 (známé, R-14).

### ♻️ R-RUN-P5 — [plan drift] PO-01/PO-03 zastaralé: `update` postavy = PomocnyPJ+ || owner, ne PJ-only
- **Kde:** `characters.service.ts:319-344` (`update` = `isStaff` PomocnyPJ+ `||` `isOwner`), zatímco create/convert/delete zůstávají `assertCanManage` PJ-only (`:86-110`, controller `:142/:174/:188`). FE `PostavaLayout.tsx:70-77` `canEdit = world.elevated || role>=PomocnyPJ || isOwner` = **PARITA s BE**.
- **Podstata:** Plán PO-01 („postavy spravuje PJ, ne PomocnyPJ") + PO-03 + matice řádek „editovat postavu: PomocnyPJ ⛔, PJ ✅" jsou proti aktuálnímu kódu ŠPATNĚ. 8.1 vědomě rozšířil edit na PomocnyPJ+owner. Foreign edit stále 403 (isStaff=false, isOwner=false → `CHARACTER_FORBIDDEN`), žádný `OW` leak. **Není parita-bug** (FE↔BE sedí), jen doc-fix matice/PO-01/PO-03.
- **L:** L2.

### Low observations (neeviduji jako R, jen zaznamenávám)
- **R-RUN-P6 [`OW` low]** `createAccount` (`character-accounts.service.ts:129-165`, gate `assertSubdocAccess`=owner) přijme libovolné `ownerCharacterIds` bez validace world/consent. Post-creation `addCoOwner` je staff-only (`assertWriteSettingsAccess` `:282-291`) → nekonzistence: co-owner NEjde přidat později, ale JDE při create. Sdílí jen VLASTNÍ účet → leak omezený; cross-world `characterId` = drobný data-bleed do listingu cizí postavy (`listAccountsForCharacter`→`findByOwnerCharacterId`). Low.
- **R-RUN-P7 [observation]** `listCommunity` (`bestiae.controller.ts:57-64` → service `:330-336`) bez brány na `status:'draft'` → kdokoli přihlášený listuje draft komunitní bestie. Community = veřejná Společná tvorba, drafty = návrhy k review → pravděpodobně záměr. Ne nález.

---

## Ověřeno bez díry (L2) — potvrzuje registr

- **PO-07..10 účet 4-tier** — controller `character-accounts.controller.ts` každý endpoint volá správný assert: read (`getOne`→`assertReadAccess` `:135`), write-content (update-content/add-monthly/undo/transfer→`assertWriteContentAccess`), write-settings (settings/currency/co-owners/transfer-primary→`assertWriteSettingsAccess`, staff-only `:780-793`), delete (`assertDeleteAccess` staff||primary `:795-812`), adjust (`assertCanAdjust` staff||owner+flag). **PO-09 write-settings staff-only ✅** (potvrzuje registr).
- **PO-11** `resolveShopScope` hráč<PomocnyPJ → `{worldId, isShared:true}` ✅ · **PO-12** `listPurchases` `$in` own chars, cizí `characterId` ignorován (IDOR-safe) ✅ · **PO-13** refund `isStaff||isOwner`, cizí→403, atomický `markRefundedIfActive` ✅ · **PO-15** FE `MyPurchasesPanel canRefund = isStaff||allowPlayerSelfAdjust` = parita s BE ✅.
- **PO-16/17 currencies** dual-threshold: `assertCanAdmin` PJ (add/remove = změna `code` sady), `assertCanEdit` PomocnyPJ+ (metadata-only), `assertMember` read (jakýkoli member vč. Zadatel role 0 → potvrzuje registr doc-fix „PO-17 Zadatel čte") ✅.
- **PO-18/19/20 bestiae 3-scope** — `assertCanRead` (system=all, user=owner||GlobalAdmin, world=member), `assertCanWrite` (system=GlobalAdmin only, user=owner BEZ admin bypassu, world=PomocnyPJ+). Hráč zapíše system → 403; edituje cizí user-scope → 403 ✅.
- **R-02** `isWorldStaff` GlobalAdmin bypass přes `worldAdminBypass` (elevation-gated, fail-safe bez requestera → false) — ověřeno opravené `characters.service.ts:69-84`.
- **PO-14 dluh vyřešen** — `POST shopitems` teď MÁ role-floor PomocnyPJ+ (FIX-3, controller `:655-659`; bulk `:622-626`; service re-gate `:1043`). Registr „accepted debt bez role-gate" je zastaralý.
- **worldAdminBypass elevation** konzistentní napříč characters/accounts/bestiae/currencies/campaign; `assertCanViewDirectory` OptionalJwt public/private brána (IDOR fix) ✅.

## PROOF-REQUESTy (doběh na L3/L4)

1. **M8** — Hrac-owner bez `allowPlayerSelfAdjust` nafoukne balance přes `add-monthly` po editaci `incomeEntries` (R-RUN-P1). Kritické.
2. **M8** — direct `POST purchases/:id/refund` non-flag owner → ověřit částečný stav status=refunded bez kreditu (R-RUN-P2).
3. **M8** — direct `GET /campaign/shopitems/:id?worldId=` jako Hrac na isShared položku → 403 vs list ji ukáže (R-RUN-P3).
4. **M3** — spustit existující specy (character-accounts / campaign-purchase / bestiae) pro L3 happy-path (v tomto běhu neproveden).
