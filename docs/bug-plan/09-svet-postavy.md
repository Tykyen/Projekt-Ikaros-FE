# 09 — Svět: postavy, bestiář, ekonomika

Oblast pokrývá celý životní cyklus postav (Page+Character unifikace, PC/NPC/Lokace, 5 subdokumentů), bestiář (3-scope + per-system schema engine), finanční systém (měny, obchod, nákup/storno, účty), storylines/pavučinu a deník PJ.

**BE:** `characters`, `character-subdocs`, `bestiae`, `world-currencies`, `campaign` (purchase service), `system-presets`, `world-gm-notes`
**FE:** `features/world/bestiar`, `features/world/shop`, `features/world/currencies`, `features/world/campaign`, `features/world/pages/CharactersPage`, `features/world/pages/CharacterDetailPage` (taby), `features/world/pages/WorldDiarySchemaEditorPage`, `features/world/pages/WorldGmDiaryPage`, `features/world/pages/MyCharacterPage`
**Routy:** `/postavy`, `/postava/:slug`, `/moje-postava`, `/bestiar`, `/obchod`, `/prevodnik-men`, `/admin/sablona-deniku`, `/pavucina`, `/scenare`, `/denik-pj`

---

## A. Postavy — seznam & detail (Page+Character)

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| SP-01 | `GET /characters` vrátí `CharacterPublicView[]` (bez `diaryData`/`userId`) pro libovolného požadavče `[auto]` | M1 | ⬜ |
| SP-02 | `GET /characters/:slug` vrátí plnou postavu pro vlastníka CP (owner = `character.userId === requesterId`) `[auto]` | M2 | ⬜ |
| SP-03 | `GET /characters/:slug` vrátí plnou postavu pro PomocnyPJ+ (staff) `[auto]` | M4 | ⬜ |
| SP-04 | `GET /characters/:slug` vrátí jen `CharacterPublicView` (bez `diaryData`) pro cizího hráče `[auto]` | M2 | ⬜ |
| SP-05 | `GET /characters/:slug` → 404 pro neexistující slug `[auto]` | M1 | ⬜ |
| SP-06 | `POST /characters` → `assertCanManage` odmítne hráče (role < PJ) s 403 `[auto]` | M1 | ⬜ |
| SP-07 | `POST /characters` → ConflictException na duplicitní slug ve stejném světě `[auto]` | M1 | ⬜ |
| SP-08 | `POST /characters` → slug se lowercase-uje před persistence (DTO `slug = 'HERO'` → uloží `'hero'`) `[auto]` | M1 | ⬜ |
| SP-09 | Po `POST /characters` se emituje `character.created` a kaskádně vznikají subdokumenty (diary + calendar + finance + inventory + notes pro CP/NPC) `[auto]` | M1 | ⬜ |
| SP-10 | Po `POST /characters` s `kind:'location'` vznikne jen `calendar + finance + inventory` (bez diary/notes) `[auto]` | M1 | ⬜ |
| SP-11 | `PATCH /characters/:slug` — `diaryData` se deep-merge (existující klíče zachovány), `extraBlocks` se nahradí celé `[auto]` | M1 | ⬜ |
| SP-12 | `PATCH /characters/:slug` — optimistic concurrency: mismatch `expectedUpdatedAt` → 409 s kódem `CHARACTER_CONFLICT`; match projde bez pole v persist DTO `[auto]` | M1 | ⬜ |
| SP-13 | `PATCH /characters/:slug` — hráč-vlastník smí editovat svou CP, cizí hráč dostane 403 `[auto]` | M2 | ⬜ |
| SP-14 | `PATCH /characters/:slug/convert` → CP→NPC: `userId=undefined`, `isNpc=true`; emituje `character.converted` `[auto]` | M1 | ⬜ |
| SP-15 | `PATCH /characters/:slug/convert` → NPC→CP: nastaví `userId`, `isNpc=false`; emituje `character.converted` `[auto]` | M1 | ⬜ |
| SP-16 | `DELETE /characters/:slug` → smaže postavu a emituje `character.deleted` s `slug` `[auto]` | M1 | ⬜ |
| SP-17 | `GET /characters/players` vrátí jen PC (isNpc=false + userId defined), vyloučí Lokace (filter v repo) `[human]` | M1 | ⬜ |
| SP-18 | `GET /characters/directory` vrátí adresář bez citlivých dat (bez `diaryData`) `[auto]` | M1 | ⬜ |
| SP-19 | `GET /characters/by-user/:userId` vyžaduje JwtAuthGuard (bez tokenu → 401) `[auto]` | M1 | ⬜ |
| SP-20 | FE `CharactersPage` zobrazí karty postav dle dat z `usePersonaDirectory` nebo `/characters/directory` `[human]` | M1 | ⬜ |
| SP-21 | FE `CharacterCard` neukáže citlivé pole (`diaryData`) pro cizího hráče (veřejný view) `[human]` | M2 | ⬜ |
| SP-22 | FE `CharacterDetailRoute` přesměruje na `/moje-postava` pokud slug = postava aktuálního hráče `[human]` | M2 | ⬜ |
| SP-23 | `syncKind` je idempotentní: pokud `character.kind` == cílový kind, nevolá DB update `[auto]` | M1 | ⬜ |
| SP-24 | imageUrl postavy je přes `Page.imageUrl`, ne `Character` — FE `getPlayerCharacters` obohacuje přes `imageUrlBySlug` mapper `[auto]` | M1 | ⬜ |

---

## B. Subdokumenty (deník / inventář / finance / poznámky / kalendář)

### B1 — Access gate

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| SP-25 | `assertSubdocAccess` — Lokace: bez membership → 404 (anti-leak); členský hráč bez PomocnyPJ → 403 `[auto]` | M4 | ⬜ |
| SP-26 | `assertSubdocAccess` — persona: PomocnyPJ+ nebo owner dostane přístup, jiný hráč → 403 `[auto]` | M4 | ⬜ |
| SP-27 | `GET .../calendar` pro Lokaci předá `{action:'read'}` do `assertSubdocAccess` — spec 9.2 (členský hráč může číst kalendář lokace) `[human]` | M1 | ⬜ |

### B2 — Deník (diary)

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| SP-28 | `getDiary` — lazy-create: pokud subdoc chybí a `worldId` předán → vytvoří se transparentně `[auto]` | M1 | ⬜ |
| SP-29 | `getDiary` — lazy-create bez `worldId` → 404 (BC-safe) `[auto]` | M1 | ⬜ |
| SP-30 | `getDiary` — pass-through všech customData klíčů (nefiltruje); klíče z jiných system presetů zůstávají v DB `[auto]` | M1 | ⬜ |
| SP-31 | `updateDiary` přes `customDataPatch` → delta merge (`$set` per klíč); ostatní klíče v DB nedotčeny `[auto]` | M1 | ⬜ |
| SP-32 | `updateDiary` přes `customDataPatch` — `null` hodnota = `$unset` daného klíče `[auto]` | M1 | ⬜ |
| SP-33 | `updateDiary` legacy `customData` full-replace stále funguje (backward compat), loguje warning `[auto]` | M1 | ⬜ |
| SP-34 | `updateDiary` s `personalDiarySchema` — coerce přes nové schema (ghost klíče se zahodí) `[auto]` | M1 | ⬜ |
| SP-35 | `updateDiary` s `personalDiarySchema=null` — coerce přes aktivní svět-level schema `[auto]` | M1 | ⬜ |
| SP-36 | `remapCustomDataKeys` přejmenuje klíče podle mapping (hodnoty se zachovají) `[auto]` | M1 | ⬜ |
| SP-37 | `resetAllPersonalSchemas` smaže `personalDiarySchema` u všech postav světa; vrátí počet `[auto]` | M1 | ⬜ |
| SP-38 | `remapAllKeysByWorld` prázdný mapping → 0, DB query se nevolá `[auto]` | M1 | ⬜ |
| SP-39 | `DiaryOverridesController.resetAll` vyžaduje `assertCanAdminWorld` (PJ+); hráč → 403 `[human]` | M4 | ⬜ |
| SP-40 | FE `DiaryTab` zobrazí skelet loadu, chybu a prázdný stav správně `[auto]` | M1 | ⬜ |
| SP-41 | FE `DiaryTab` odešle `customDataPatch` (delta), ne legacy `customData` `[human]` | M1 | ⬜ |
| SP-42 | Per-system diary sheet (např. `drd16`, `dnd5e`, `matrix`) renderuje správná pole pro daný systém světa `[human]` | M3 | ⬜ |
| SP-43 | FE A→B→A persistence test: přepnutí systému světa a zpět neztrácí customData klíče druhého systému `[human]` | M3 | ⬜ |

### B3 — Inventář (inventory)

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| SP-44 | `getInventory` — lazy-create pro PC, NPC i Lokaci (žádné NOT_APPLICABLE) `[auto]` | M1 | ⬜ |
| SP-45 | `updateInventory` — 404 pokud subdoc chybí (starý kód bez lazy create) `[auto]` | M1 | ⬜ |
| SP-46 | FE `InventoryTab` — `SectionListEditor` přidá / odebere sekci; při save odešle celé `sections` `[auto]` | M1 | ⬜ |
| SP-47 | FE `InventoryTab` — NPC/Lokace s `isHidden=true` schová záložku Výbava od hráčů `[human]` | M4 | ⬜ |

### B4 — Finance (starý model + CharacterAccount)

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| SP-48 | `getFinance` — lazy-create pro PC, NPC i Lokaci `[auto]` | M1 | ⬜ |
| SP-49 | `addMonthly` přičte součet entries k balance a zapíše transakci s delta `[auto]` | M1 | ⬜ |
| SP-50 | `undoLastTransaction` odebere poslední transakci a odečte delta `[auto]` | M1 | ⬜ |
| SP-51 | `CharacterAccountsController.adjust` — hráč bez `allowPlayerSelfAdjust` → 403 `PLAYER_ADJUST_DISABLED` `[auto]` | M2 | ⬜ |
| SP-52 | `CharacterAccountsController.transfer` — revert obou stran při chybě zdroje/cíle (fallback bez replica set) `[auto]` | M1 | ⬜ |
| SP-53 | `CharacterAccountsController.transfer` — cross-currency transfer odmítnut (code `CURRENCY_MISMATCH`) `[auto]` | M1 | ⬜ |
| SP-54 | FE `FinanceTab` `AdjustBalanceModal` — hráč bez self-adjust flag nevidí tlačítko Vklad/Výběr `[human]` | M2 | ⬜ |
| SP-55 | FE `ConfirmAddMonthlyModal` zobrazí delta a nový zůstatek před potvrzením `[auto]` | M1 | ⬜ |
| SP-56 | FE `InGameDateField` — prázdný vstup se přenáší jako `null` (ne `undefined`) do API `[auto]` | M1 | ⬜ |
| SP-57 | FE `TransferModal` — odeslání s amount=0 blokováno validací formuláře `[human]` | M1 | ⬜ |
| SP-58 | FE `AccountSwitcher` — výchozí účet = primary; přepnutí mění context pro adjust/transfer `[human]` | M2 | ⬜ |

### B5 — Poznámky (notes)

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| SP-59 | `getNotes` — lazy-create pokud subdoc chybí `[auto]` | M1 | ⬜ |
| SP-60 | FE `NotesTab` odesílá `PATCH notes` se správnou strukturou `[auto]` | M1 | ⬜ |
| SP-61 | FE `NotesTab` zobrazuje rich-text editor pro PJ/vlastníka, jen čtení pro PomocnyPJ `[human]` | M4 | ⬜ |

### B6 — Kalendář (calendar)

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| SP-62 | `getCalendar` — lazy-create pokud subdoc chybí a `worldId` předán `[auto]` | M1 | ⬜ |
| SP-63 | `PUT .../calendar` — Lokace může editovat kalendář jen PomocnyPJ+ (`action:'write'`) `[human]` | M4 | ⬜ |
| SP-64 | FE `CalendarTab` — správně renderuje `FantasyDate` objekt (ne legacy string `YYYY-MM-DD`) `[auto]` | M1 | ⬜ |
| SP-65 | FE `EventEditorModal` — symbol pole se ukládá a zobrazuje na eventové kartě `[human]` | M1 | ⬜ |

---

## C. NPC

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| SP-66 | NPC `isNpc=true` nemá `userId` → `assertSubdocAccess` nepovažuje nikoho za ownera (přístup jen štáb) `[auto]` | M4 | ⬜ |
| SP-67 | Convert CP→NPC skryje `finance.isHidden=true` a `inventory.isHidden=true` `[auto]` | M1 | ⬜ |
| SP-68 | Convert NPC→CP odkryje nebo lazy-cretuje `finance`/`inventory` `[auto]` | M1 | ⬜ |
| SP-69 | FE `CharacterDetailPage` — pro NPC skryje záložky Finance a Výbava od hráčů (isHidden respektováno) `[human]` | M4 | ⬜ |
| SP-70 | FE `CharactersPage` — NPC karty odlišeny od PC karet vizuálně (badge/label) `[human]` | M1 | ⬜ |

---

## D. Bestiář

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| SP-71 | `GET /bestiae?systemId=X` vrátí segregované {system, user, world} pro daný systém `[auto]` | M1 | ⬜ |
| SP-72 | `GET /bestiae?systemId=X&worldId=Y` — world-scope bestie vrátí jen pro daný svět `[human]` | M1 | ⬜ |
| SP-73 | `POST /bestiae` scope=system → jen Admin/Superadmin; hráč → 403 `[auto]` | M1 | ⬜ |
| SP-74 | `POST /bestiae` scope=user → neautorizovaný reader bestie jiného uživatele → 403 při GET/update `[auto]` | M2 | ⬜ |
| SP-75 | `POST /bestiae` scope=world → vyžaduje PomocnyPJ+ v daném světě `[auto]` | M4 | ⬜ |
| SP-76 | `POST /bestiae` — soft-mode validace: schema chybí (`errors._schema`) → validace se přeskočí `[auto]` | M1 | ⬜ |
| SP-77 | `POST /bestiae` — reálná data-chyba (schema existuje) → 400 `BESTIE_STATS_INVALID` `[auto]` | M1 | ⬜ |
| SP-78 | `PATCH /bestiae/:id` — soft-mode validace analogicky k create `[auto]` | M1 | ⬜ |
| SP-79 | `DELETE /bestiae/:id` — soft delete; `restore` vrátí bestii `[auto]` | M1 | ⬜ |
| SP-80 | `POST /bestiae/:id/clone` → nová bestie s `clonedFromId`, abilities a systemStats zkopírovány `[human]` | M1 | ⬜ |
| SP-81 | Spawn bestie na mapu = snapshot semantics: abilities/notes/systemStats zkopírovány do tokenu, pozdější edit katalogu token neovlivní `[human]` | M1 | ⬜ |
| SP-82 | FE `BestiarPage` — sekce system/user/world jsou odlišeny; prázdná sekce se nezobrazuje `[human]` | M1 | ⬜ |
| SP-83 | FE `BestieEditorModal` — scope=system zobrazuje formfields jen Adminu; hráč vidí jen user/world scope `[human]` | M2 | ⬜ |
| SP-84 | FE `BestieCard` — statblock se renderuje dle systemId (per-system schema); prázdná pole zobrazena jako `-` `[human]` | M1 | ⬜ |
| SP-85 | FE `CloneBestieModal` — clone do jiného scope/worldId odešle správný payload `[human]` | M1 | ⬜ |
| SP-86 | `GET /bestiae/:id` — user-scope bestie: jiný uživatel → 403 i pro čtení `[auto]` | M2 | ⬜ |
| SP-87 | `GET /bestiae/:id` — world-scope bestie: nelenčník světa → 403 `[auto]` | M4 | ⬜ |

---

## E. Ekonomika (měny, obchod, nákup/storno)

### E1 — Měny

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| SP-88 | `getCurrencies` — jen člen světa; nečlen → 403 `[auto]` | M1 | ⬜ |
| SP-89 | `updateCurrencies` — přidání/smazání měny (změna code-setu) vyžaduje PJ+; PomocnyPJ → 403 `[auto]` | M4 | ⬜ |
| SP-90 | `updateCurrencies` — metadata-only edit (rate/name/symbol, stejný code-set) povolí PomocnyPJ `[auto]` | M4 | ⬜ |
| SP-91 | `updateCurrencies` — položky bez `id` dostanou UUID (BE přiřadí) `[auto]` | M1 | ⬜ |
| SP-92 | `convert` — ZL→ST výpočet přes `rate` (ZL rate=1, ST rate=0.1 → 5 ZL = 50 ST) `[auto]` | M1 | ⬜ |
| SP-93 | `convert` — from===to → 400 `CURRENCY_SAME_FROM_TO` `[auto]` | M1 | ⬜ |
| SP-94 | `convert` — neznámý `from` kód → 400 `CURRENCY_NOT_FOUND` `[auto]` | M1 | ⬜ |
| SP-95 | `seedForWorld` — fantasy genre seeduje ZL/ST/MD s rate 1/0.1/0.01 `[auto]` | M1 | ⬜ |
| SP-96 | FE `CurrencyPage` `ConverterSection` — živý výpočet při změně vstupní hodnoty nebo výběru měny `[auto]` | M1 | ⬜ |
| SP-97 | FE `CurrenciesListSection` — Hráč vidí seznam měn; editace je schována (jen PomocnyPJ+ vidí formulář) `[human]` | M4 | ⬜ |
| SP-98 | FE validace `currencyItemBaseSchema` — code uppercase, max 8 znaků, pouze alfanumerické; name required, max 40 `[auto]` | M1 | ⬜ |
| SP-99 | FE `createCurrencyItemSchema` — odmítne duplicitní code (case-insensitive), povolí self-edit přes `excludeCode` `[auto]` | M1 | ⬜ |

### E2 — Obchod & nákup

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| SP-100 | `purchase` — happy path: odečte cenu z účtu, přidá položku do inventáře, zapíše purchase log `[auto]` | M1 | ⬜ |
| SP-101 | `purchase` — sleva položky přebije skupinu i podskupinu (specificity rule) `[auto]` | M1 | ⬜ |
| SP-102 | `purchase` — dědí slevu skupiny pokud položka nemá vlastní `[auto]` | M1 | ⬜ |
| SP-103 | `purchase` — různé měny → konverze přes `WorldCurrenciesService.convert` `[auto]` | M1 | ⬜ |
| SP-104 | `purchase` — quantity > 1 → celková cena = unitPrice × quantity `[auto]` | M1 | ⬜ |
| SP-105 | `purchase` — nedostatek prostředků → 409 `INSUFFICIENT_FUNDS`; inventář se nezapíše `[auto]` | M1 | ⬜ |
| SP-106 | `purchase` — hráč nakupující cizí postavě → 403 `NOT_YOUR_CHARACTER` `[auto]` | M2 | ⬜ |
| SP-107 | `purchase` — hráč bez self-adjust → 403 před zápisem inventáře `[auto]` | M2 | ⬜ |
| SP-108 | `purchase` — položka zdarma (price=0) → bez adjustu účtu, log `paidAmount=0` `[auto]` | M1 | ⬜ |
| SP-109 | `purchase` — kompenzace: pokud `adjust` selže po zápisu inventáře, položka se odebrán z inventáře `[auto]` | M1 | ⬜ |
| SP-110 | `purchase` — `characterId` v DTO je character.id (ne page.id) — past D-directory_id `[human]` | M2 | ⬜ |
| SP-111 | `refund` — vrátí peníze na účet a odebere položku z inventáře `[auto]` | M1 | ⬜ |
| SP-112 | `refund` — opakovaný refund → 409 `PURCHASE_ALREADY_REFUNDED` `[auto]` | M1 | ⬜ |
| SP-113 | `refund` — tolerantní: smazaná položka v inventáři neblokuje vrácení peněz `[auto]` | M1 | ⬜ |
| SP-114 | `listPurchases` — hráč vidí jen nákupy své postavy; staff vidí vše (filtr dle `characterId`) `[auto]` | M2 | ⬜ |
| SP-115 | FE `PurchaseDialog` — zobrazí zůstatek před a po nákupu `[auto]` | M1 | ⬜ |
| SP-116 | FE `PurchaseDialog` — WalletBadge ukáže aktuální balance bez nutnosti refresh `[human]` | M1 | ⬜ |
| SP-117 | FE `ShopItemCard` — cena po slevě se vypočte identicky jako BE (specificity rule) `[auto]` | M1 | ⬜ |
| SP-118 | FE `ShopItemForm` — validace povinných polí (name, price ≥ 0, currencyCode not empty) `[auto]` | M1 | ⬜ |
| SP-119 | FE `MyPurchasesPanel` — storno volá BE `DELETE /purchases/:id/refund` a invaliduje cache `[human]` | M1 | ⬜ |
| SP-120 | FE `ShopGroupsManager` — smazání neprázdné skupiny zobrazí chybovou hlášku (BE vrátí 409 `CAMPAIGN_SHOPGROUP_NOT_EMPTY`) `[human]` | M1 | ⬜ |

---

## F. Per-system schema engine

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| SP-121 | `SystemPresetsService.findAll()` vrátí meta (system + displayName) pro všechny presety `[auto]` | M1 | ⬜ |
| SP-122 | `SystemPresetsService.findOne(system)` vrátí null pro neznámý systém (FE soft-mode se spustí) `[auto]` | M1 | ⬜ |
| SP-123 | `SystemStatsValidatorService.validateForCreate` — soft-mode: schema chybí → `errors._schema`, `valid=false` ale BE nekasuje `[auto]` | M1 | ⬜ |
| SP-124 | `SystemStatsValidatorService.validateForPatch` — analogicky k create `[auto]` | M1 | ⬜ |
| SP-125 | FE per-system diary sheet registruje se přes `DiarySystemProvider`/registry a renderuje správný komponent `[human]` | M3 | ⬜ |
| SP-126 | FE `DiarySystemContext` — při přepnutí systému světa se znovu resolvuje aktivní sheet `[human]` | M3 | ⬜ |
| SP-127 | FE `SchemaValueEditor` — každý blok typ (stat/bar/list/text/image/formula) renderuje správný editor `[auto]` | M1 | ⬜ |
| SP-128 | FE `WorldDiarySchemaEditorPage` — změna klíče bloku detekovaná přes stabilní UUID `id` odešle remap request `[human]` | M3 | ⬜ |
| SP-129 | FE `WorldDiarySchemaEditorPage` — `SchemaVersionPicker` umožňuje přepnout na starší verzi a vidět diff `[human]` | M3 | ⬜ |
| SP-130 | FE `useDiarySchema.useActiveDiarySchema` — vrátí `activeMeta` (null pokud žádná aktivní verze) bez pádu `[auto]` | M1 | ⬜ |
| SP-131 | FE export-schemas flow: FE schémata jsou canonical; BE obdrží schema přes export a používá je pro validaci bestie/diary `[human]` | M3 | ⬜ |

---

## G. Storylines / pavučina / deník PJ

### G1 — Storylines & scénáře

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| SP-132 | `findSubjects` — PJ vidí vše; PomocnyPJ vidí vlastní + isShared; Hráč jen vlastní `[auto]` | M4 | ⬜ |
| SP-133 | `findSubjects/relationships/storylines` — `resolveScope` aplikuje správný MongoDB filter pro každou roli `[auto]` | M4 | ⬜ |
| SP-134 | `canModify(entity, userId, worldRole)` — PJ: vždy true; PomocnyPJ: isShared nebo owner; Hráč: jen owner `[auto]` | M4 | ⬜ |
| SP-135 | `deleteSubject` kaskádně smaže i relacionované `CampaignRelationship` (`deleteBySubjectId`) `[auto]` | M1 | ⬜ |
| SP-136 | `deleteShopGroup` — neprázdná skupina → 409 `CAMPAIGN_SHOPGROUP_NOT_EMPTY` (itemCount/childCount) `[auto]` | M1 | ⬜ |
| SP-137 | `logChange` fire-and-forget: selhání logu nesmí blokovat hlavní operaci `[auto]` | M1 | ⬜ |
| SP-138 | `createScenario` — `order` = maxOrder+1 v rámci ownera/scope `[auto]` | M1 | ⬜ |
| SP-139 | FE `CampaignPage` / `PavucinaGraph` — `buildGraphData` vyhodí hranu jejíž subjekt v aktuální vrstvě chybí `[auto]` | M1 | ⬜ |
| SP-140 | FE `PavucinaGraph` — `neighborIds` vrátí fokus + přímé sousedy; jiné uzly jsou zhasnuty `[auto]` | M1 | ⬜ |
| SP-141 | FE `linkPassesFilter` — filtr crisis/positive/negative/all odpovídá specifikaci `[auto]` | M1 | ⬜ |
| SP-142 | FE `StorylinesPage` — storyliny se filtrují dle level/status; výsledky se zobrazují bez pádu `[human]` | M1 | ⬜ |
| SP-143 | FE `CampaignPage` dashboard — `crisisRelationships` max 10 položek, `pinnedNotes` seřazeny dle pinned `[human]` | M1 | ⬜ |
| SP-144 | FE `campaignColors` — typy subjektu mají unikátní barvy a styl (spec campaignColors.spec.ts) `[auto]` | M1 | ⬜ |
| SP-145 | FE `scenarioMeta` — metadatová značení scénářů (stav, ikony) jsou korektní `[auto]` | M1 | ⬜ |

### G2 — Deník PJ (WorldGmNotes)

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| SP-146 | `WorldGmNotesService.getNotes` — Hráč (role < PomocnyPJ) → 403 `[auto]` | M4 | ⬜ |
| SP-147 | `WorldGmNotesService.getNotes` — PomocnyPJ+ dostane přístup; per-PJ (worldId+userId identifikátor) `[human]` | M4 | ⬜ |
| SP-148 | `WorldGmNotesService.updateNotes` — content se uloží pro konkrétního PJ (findOrCreate) `[human]` | M4 | ⬜ |
| SP-149 | Platformový Admin dostane přístup k deníku PJ (UserRole.Admin bypass v `assertPj`) `[auto]` | M4 | ⬜ |
| SP-150 | FE `WorldGmDiaryPage` — stránka nedostupná hráčům (auth-policy gate) `[human]` | M4 | ⬜ |
| SP-151 | FE `WorldGmDiaryPage` — sdílené notebook jádro (DiaryTab reuse); save odesílá správný endpoint `[human]` | M4 | ⬜ |
| SP-152 | FE `WorldGmDiaryPage` — více PJ vidí svůj vlastní deník (per-PJ, ne globální) `[human]` | M4 | ⬜ |

---

## Test coverage gaps

- **BE integration testy chybí**: `characters.controller`, `campaign.controller`, `bestiae.controller`, `world-currencies.controller` — jen unit testy service vrstvy; rolování skutečných HTTP hovorů (middleware, guard) není pokryto.
- **Repo-level testy**: `CharacterDiaryRepository.updateWithCustomDataPatch` (delta merge $set/$unset logika v Mongo) chybí; ověřuje se jen na mock úrovni.
- **FE testy chybí nebo slabé**: `CharacterAccountsController` komplex (transfer/undo/co-owner), `CharactersPage/hooks/useFavoriteCharacters`, `WorldGmDiaryPage`, `StorylinesPage`, `CampaignPage/dashboard`, `BestieEditorModal`, `CloneBestieModal`.
- **E2E nákupní flow**: kompenzační logika (inventory rollback po selhání adjust) pokryta unit testem, ale nikdy nebyla testována s reálným Mongo (bez replica set fallback).
- **Per-system schema export flow**: test neexistuje ověřující, že FE presety jsou konzistentní se systémy registrovanými v BE (`system-presets/presets`).
- **Kalendář Lokace access**: spec 9.2 říká, že člen světa může číst kalendář lokace — BE předá `{action:'read'}` do `assertSubdocAccess`, ale service tento parametr ignoruje (`_options` je nevyužitý); chování se NELIŠÍ pro read vs. write — fakticky platí přísnější write rule (PomocnyPJ+) i pro read.

---

## Známá rizika

- **D-NEW — nákup bez Mongo transakce**: `CampaignPurchaseService.purchase` dělá kompenzaci ručně (add inventory → try adjust → catch → rollback inventory). Pokud rollback sám selže (síťová chyba), inventář obsahuje položku, ale peníze nebyly odečteny. Bez replica set session nelze zaručit atomicitu.
- **assertSubdocAccess `action` parametr ignorován**: Controller pro `GET .../calendar` předá `{action:'read'}` s úmyslem umožnit čtení kalendáře Lokace všem členům. Service ale parametr `_options` nepoužívá a aplikuje stejnou přísnější logiku (PomocnyPJ+) i pro read. Výsledkem je, že spec 9.2 o čtení kalendáře lokace členem světa není splněn — hráč s `WorldRole.Hrac` dostane 403 i při čtení.
- **Drift FE types vs. BE**: `CreateCharacterInput` na FE stále obsahuje `isLocation: boolean` (legacy field); BE `CreateCharacterDto` pravděpodobně používá `kind: 'location'|'persona'`; pokud mapper na FE nekonvertuje, API volání může projít, ale `kind` nebude nastaveno (defaultuje na undefined/persona), čímž se Lokace vytvoří jako persona a dostane diary/notes subdokumenty, které pro ni spec nepočítá.
