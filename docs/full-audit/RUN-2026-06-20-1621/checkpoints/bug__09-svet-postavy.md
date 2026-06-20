# bug / 09-svet-postavy — checkpoint RUN-2026-06-20-1621

Datum: 2026-06-20
Auditor: agent (read-only, bez editace src/)

---

## Pokrytí

### BE moduly (statické čtení)
- `characters/characters.controller.ts` + `characters.service.ts` + `characters.repository.ts`
- `character-subdocs/character-subdocs.controller.ts` + `character-subdocs.service.ts`
- `character-subdocs/character-accounts.controller.ts` + `character-accounts.service.ts`
- `character-subdocs/diary-overrides.controller.ts`
- `campaign/campaign.service.ts` + `campaign.controller.ts` (vyňatky)
- `campaign/services/campaign-purchase.service.ts`
- `bestiae/bestiae.service.ts` + `bestiae.gateway.ts`
- `world-currencies/world-currencies.service.ts` + `world-currencies.controller.ts`
- `world-gm-notes/world-gm-notes.service.ts` + `world-gm-notes.controller.ts`

### FE (statické čtení)
- `features/world/shop/api.ts` + `types.ts` + `pricing.ts`
- `features/world/shop/components/PurchaseDialog.tsx` + `MyPurchasesPanel.tsx` + `ShopView.tsx`
- `features/world/bestiar/types.ts` + `hooks/useBestiar.ts`
- `features/world/pages/api/characters.types.ts` + `useCharacterSubdocs.ts` + `useCharacterAccounts.ts`

### Axisy pokryté
- A (postavy – seznam & detail), B (subdokumenty: B1-B6), C (NPC), D (bestiář), E (ekonomika: E1-E2), F (per-system schema), G (storylines/deník PJ)
- M1 statická analýza, M2 kontrakt FE↔BE, M4 auth gating (role guardy)

---

## Dosažená L vs cílová L

- Dosaženo: **L2** pro auth gating (BE controller + service přečteny), L1 pro logiku
- Cílová: L3 (existující testy + zelené); L4 (nové testy) dle plánu
- Testy nebyly spuštěny (infrastruktura) → vrstvy L3/L4 = PROOF-REQUEST

---

## Nálezy

### N-SP-01 — `assertCanAdjust` kontroluje jen první postavu uživatele (false 403) 🐛 🟠
- **Osa:** B4 Finance / auth gate
- **Kde:** `backend/src/modules/character-subdocs/character-accounts.service.ts:392`
- **Popis:** `assertCanAdjust` volá `this.charactersService.findByUser(requesterId, account.worldId)` — tato metoda (`characters.repository.ts:51`) vrátí jen JEDNU postavu (`findOne`, první MongoDB výsledek). Pokud má uživatel 2+ postav (N-24 dokument říká, že je to možné), a `ownerCharacterIds` obsahuje ID druhé postavy ale ne té první nalezené, vrátí `isOwner = false` → 403 `FORBIDDEN_ADJUST`. Stejný bug v `isStaffOrOwner` (service:814-825): `assertReadAccess` a `assertWriteContentAccess`.
- **Dopad:** Hráč s více postavami nemůže adjustovat (vkladem/výběrem) ani číst účet vlastní neprní postavy. Tichý 403 při nákupu a read-view účtu. Dopad roste s počtem hráčů s více PC.
- **Návrh:** Použít `findManyByUserAndWorld` (repository:65) a kontrolovat `ids.some(id => account.ownerCharacterIds.includes(id))`.
- **L1** 🆕

### N-SP-02 — `GET /characters/directory` bez JwtAuthGuard (public) 🐛 🟡
- **Osa:** A / auth gate
- **Kde:** `backend/src/modules/characters/characters.controller.ts:52-57`
- **Popis:** Endpoint `@Get('directory')` nemá `@UseGuards(JwtAuthGuard)`. Kdokoli anonymní může zavolat `GET /worlds/:worldId/characters/directory` a dostat slug/name/isNpc/kind všech postav světa — bez ohledu na visibility světa ani membership. Ani service `getDirectory` nekontroluje membership.
- **Dopad:** Auth-leak enumerace postav pro privátní světy anonymním requesterem.
- **Návrh:** Přidat `@UseGuards(JwtAuthGuard)` (popř. i membership check analogicky k N-7). Minimálně auth, politiku visibility dořešit per world.
- **L1** 🆕

### N-SP-03 — `GET /characters` (findAll) bez membership check 🐛 🟡
- **Osa:** A / auth gate (SP-01 plánu)
- **Kde:** `backend/src/modules/characters/characters.controller.ts:36-42` + `characters.service.ts:109`
- **Popis:** `findAll` je sice za `JwtAuthGuard`, ale `findByWorld` nekontroluje membership žadatele. Libovolný přihlášený uživatel může listovat postavy soukromého světa bez membership.
- **Dopad:** Slabší než N-SP-02 (vyžaduje přihlášení), ale stále auth-leak — jméno/slug/isNpc/imageUrl pro cizí privátní svět.
- **Návrh:** Přidat membership assertion v service (vzor `WorldCurrenciesService.assertMember`).
- **L1** 🆕

### N-SP-04 — Plán SP-44/48 vs kód: `getInventory`/`getFinance` vrací NOT_APPLICABLE pro NPC/Lokaci (nesoulad plán↔kód) ⚠️ 🟡
- **Osa:** B3/B4 — lazy-create
- **Kde:** `character-subdocs.service.ts:407-425` (getFinance), `486-504` (getInventory)
- **Popis:** Plán SP-44 říká „lazy-create pro PC, NPC i Lokaci (žádné NOT_APPLICABLE)"; plán SP-48 totéž pro finance. Ale kód po 8.1-FIR vrátí `404 FINANCE_NOT_APPLICABLE` / `INVENTORY_NOT_APPLICABLE` pro NPC a Lokaci. Nejde o bug v kódu (policy je záměrná per komentář EC-03), ale plán je zastaralý.
- **Dopad:** Žádný funkční bug, ale plán zavádí testery — SP-44/SP-48 by měly být označeny ⏭️ nebo přepsány.
- **Návrh:** Aktualizovat plán oblasti (mimo scope auditu). Netestovat SP-44/SP-48 jako lazy-create pro NPC/Lokaci.
- **L1** ♻️ (plan-vs-code)

### N-SP-05 — `assertSubdocAccess` ignoruje `_options.action` — hráč 403 na GET kalendáře Lokace ♻️
- **Osa:** B1/B6 / auth gate (SP-25, SP-27)
- **Kde:** `characters.service.ts:149-194`
- **Popis:** Toto je **pre-existující nález N-10** ze stávajícího bug-audit.md (označen jako by-design po 8.1-FIR). Controller `getCalendar` předává `{action:'read'}`, ale service parametr `_options` ignoruje a vždy vyžaduje PomocnyPJ+. Spec 9.2 (člen světa čte kalendář Lokace) není splněn.
- **Dopad:** Hráč dostane 403 při GET kalendáře Lokace. Plán to označuje jako „Spec 9.2 ustupuje přísnější UX policy 8.1-FIR".
- **L1** ♻️ (known/by-design)

### N-SP-06 — `bestiar.clone` bez system-scope guard pro clone TARGET 🐛 🟡
- **Osa:** D / auth gate (SP-80)
- **Kde:** `bestiae.service.ts:188-224`
- **Popis:** `clone` kontroluje, že uživatel smí ČÍST zdroj (`assertCanRead`). Ale pro cíl scope=user není žádná kontrola — kdokoli přihlášený může klonovat system bestii do user scope svého. To je záměrné (je to allowed). Pro scope=world: `assertCanManageWorld` je voláno. Ale `CloneBestieDto.scope` může být jen `'user'|'world'` (FE type i DTO). **Klonování do scope=system není v DTO/FE exponováno.** OK.
- **Verdikt:** false-positive — clone do system chybí v DTO záměrně. ✅

### N-SP-07 — `purchaseSequentialFallback` může nechat inventář s položkou při selhání purchase-log i po kompenzaci 🐛 🟠
- **Osa:** E2 / SP-109
- **Kde:** `campaign-purchase.service.ts:365-395`
- **Popis:** Při selhání purchase-log (krok 3) se kompenzuje: vrátí peníze + odebere inventář. Ale `removeFromInventory` (504-518) načte celý inventář (`getInventory`), vyfiltruje sekci a zavolá `updateInventory` — toto je full-array `$set`, ne atomický `$pull`. Pokud se mezitím přidala jiná položka (jiný nákup), přepíše ji. V replica-set cestě (`withTransaction`) je rollback atomický a tento problém nenastane; jen v fallback cestě.
- **Dopad:** Potenciální ztráta inventářové položky při concurrent nákupu (fallback cesta bez replica set). Known-risk D-NEW (plán o tom ví), ale konkrétní mechanismus nebyl v plánu přesně popsán.
- **Návrh:** Použít `$pull` operátor pro odebrání konkrétní položky místo full-array replace. Viz RC-E4 fix pro append (appendItemToSection). Nebo nasadit replica set (D-8.6-replica-set).
- **L1** 🆕

### N-SP-08 — `WorldGmNotesService.assertPj` - nečlen bez membership vrátí `WorldRole.Hrac` místo 403 NOT_MEMBER ⚠️ 🟡
- **Osa:** G2 / SP-146
- **Kde:** `world-gm-notes.service.ts:44-56`
- **Popis:** Když uživatel není členem světa, `membership?.role ?? WorldRole.Hrac` → role=Hrac → menší než PomocnyPJ → 403 `INSUFFICIENT_WORLD_ROLE`. Funkčně správné (hráč nedostane přístup), ale chybová hláška říká „Deník PJ spravují jen vedoucí světa" místo „Nejsi členem tohoto světa" — zavádějící pro nečlena.
- **Dopad:** UX neshoda. Žádný bezpečnostní problém (přístup správně odepřen).
- **Návrh:** Přidat explicit `!membership → throw ForbiddenException NOT_A_MEMBER` před role check. Nízká priorita.
- **L1** 🆕 (UX)

---

## Ověřené správně (vybrané)

| SP | Výsledek | L |
|----|----------|---|
| SP-06 `assertCanManage` rejects Hráč | ✅ Kód správný: `membership.role < WorldRole.PJ → 403` | L1 |
| SP-07 ConflictException na duplicate slug | ✅ `existsBySlugAndWorld` → ConflictException | L1 |
| SP-08 slug lowercase | ✅ `slug.toLowerCase()` v create | L1 |
| SP-09 character.created → subdoc kaskáda | ✅ `onCharacterCreated` emitAsync, await Promise.all | L1 |
| SP-10 kind='location' → jen calendar | ✅ `!isLocation` guard | L1 |
| SP-11 diaryData shallow merge | ✅ `{...char.diaryData, ...dto.diaryData}` | L1 |
| SP-12 expectedUpdatedAt concurrency 409 | ✅ `CHARACTER_CONFLICT` | L1 |
| SP-14/15 convert CP↔NPC | ✅ `toNpc ? undefined : dto.userId` | L1 |
| SP-16 delete + character.deleted event | ✅ s best-effort error log | L1 |
| SP-23 syncKind idempotent | ✅ `character.kind === kind → return` | L1 |
| SP-31 customDataPatch delta merge | ✅ `updateWithCustomDataPatch` | L1 |
| SP-32 null = $unset | ✅ in `updateWithCustomDataPatch` (nazváno v interface) | L1 |
| SP-52 transfer cross-account revert | ✅ `transferSequentialFallback` má revert | L1 |
| SP-53 cross-currency transfer odmítnut | ✅ `from.currency !== to.currency → CURRENCY_MISMATCH` | L1 |
| SP-73 scope=system jen Admin | ✅ `isGlobalAdmin` check | L1 |
| SP-75 scope=world → PomocnyPJ+ | ✅ `assertCanManageWorld` | L1 |
| SP-76 soft-mode validace bestie | ✅ `!result.valid && !result.errors._schema` skip | L1 |
| SP-79 soft delete + restore | ✅ `softDelete` + `restore` metody | L1 |
| SP-86 user-scope bestie: cizí uživatel → 403 | ✅ `assertCanRead` checks `ownerUserId !== user.id` | L1 |
| SP-87 world-scope bestie: nečlen → 403 | ✅ `assertCanRead` checks `memberRepo.findByUserAndWorld` | L1 |
| SP-88 getCurrencies jen člen | ✅ `assertMember` | L1 |
| SP-89 add/delete měny = PJ+ | ✅ `isMetadataOnlyEdit=false → assertCanAdmin` | L1 |
| SP-90 metadata edit = PomocnyPJ+ | ✅ `isMetadataOnlyEdit=true → assertCanEdit` | L1 |
| SP-93 from===to → CURRENCY_SAME_FROM_TO | ✅ | L1 |
| SP-100 purchase happy path (logika) | ✅ `runPurchaseSteps` — 3 kroky + withTransaction | L1 |
| SP-101 sleva položka > podskupina > skupina | ✅ `effectiveDiscount` v BE i FE identicky | L1 |
| SP-105 INSUFFICIENT_FUNDS before inventory | ✅ balance check PŘED appendInventoryItem | L1 |
| SP-106 hráč nakupuje cizí postavě → 403 | ✅ `NOT_YOUR_CHARACTER` | L1 |
| SP-110 characterId = character.id (ne page.id) | ✅ ShopView.tsx:71-73 `useCharacter` | L1 |
| SP-111 refund vrací peníze + odebere inventář | ✅ `adjust` + `removeFromInventory` | L1 |
| SP-112 opakovaný refund → PURCHASE_ALREADY_REFUNDED | ✅ `markRefundedIfActive` atomický | L1 |
| SP-117 FE sleva = BE sleva | ✅ `pricing.ts` identický algoritmus | L1 |
| SP-132 findSubjects scope per role | ✅ `resolveScope` | L1 |
| SP-134 canModify per role | ✅ PJ/PomocnyPJ/Hráč | L1 |
| SP-135 deleteSubject kaskáda relationships | ✅ `deleteBySubjectId` | L1 |
| SP-136 deleteShopGroup NOT_EMPTY | ✅ `CAMPAIGN_SHOPGROUP_NOT_EMPTY` | L1 |
| SP-137 logChange fire-and-forget | ✅ `.catch(() => {})` | L1 |
| SP-138 createScenario order = maxOrder+1 | ✅ | L1 |
| SP-146 getNotes Hráč → 403 | ✅ `assertPj` | L1 |

---

## PROOF-REQUEST

### PR-1: L3 — unit testy `assertCanAdjust` s více postavami
```
cd backend
npx jest character-accounts.service.spec --no-coverage
```
Co ověří: N-SP-01 — existuje test pro případ user má 2 postavy a account patří druhé?
Pokud test chybí → L4 gap (přidat `findManyByUserAndWorld` mock).

### PR-2: L3 — auth-guard test pro `GET /characters/directory` anonymem
```
cd backend
# Curl anonymní GET /worlds/<id>/characters/directory
# Nebo integration test v characters.service.spec / controller test
```
Co ověří: N-SP-02 — endpoint vrátí 401 pro anonymous?

### PR-3: L3 — BE testy membership pro `findByWorld`
```
cd backend
npx jest characters.service.spec --no-coverage
```
Co ověří: N-SP-03 — je testováno, že nečlen nedostane seznam postav?

### PR-4: L3 — `purchaseSequentialFallback` rollback test s reálným Mongo
```
cd backend
npm run test:e2e -- seed-scenario --testNamePattern="purchase rollback"
```
Co ověří: N-SP-07 — při selhání purchase-log se inventář skutečně odebere (ne jen mock).

### PR-5: L3 — testy campaignColors spec
```
cd frontend
npx vitest run --project '!storybook' src/features/world/bestiar
```
Co ověří: SP-144 (campaignColors), SP-80 (clone DTO).
