# 12 — Postavy, bestiář & ekonomika

> Hloubková, kódem ověřená inventura. Pokrývá adresář postav, detail postavy, 3-tier model (PC / NPC / Bestie), 5 character subdokumentů, per-system schema engine, bestiář, obchod, převodník měn a finanční účty.
>
> Role: globální `Superadmin · Admin · Ikarus · Spravce*`; světové `Zadatel(0) · Ctenar · Hrac · Korektor · PomocnyPJ · PJ`. Číselné pořadí: vyšší role = více práv, gating typicky `role >= WorldRole.X`.

---

## Přehled stránek a rout (FE `router.tsx`)

| Routa | Komponenta | Gate |
|---|---|---|
| `/svet/:slug/postavy` | `CharactersPage` → `CharacterDirectory` | `memberOnly` |
| `/svet/:slug/postava/:slug` | `CharacterDetailRoute` (jen redirect) | `memberOnly` |
| `/svet/:slug/moje-postava` | `MyCharacterPage` | `memberOnly` |
| `/svet/:slug/:slug` (unified Page) | `PageViewer` → `PostavaLayout` | `memberOnly` |
| `/svet/:slug/bestiar` | `BestiarPage` | `memberOnly` (interní gate PomocnyPJ+) |
| `/svet/:slug/obchod` | `ShopPage` → `ShopView` | `memberOnly` |
| `/svet/:slug/prevodnik-men` | `CurrencyPage` | `memberOnly` |

`memberOnly` = jen členové světa (libovolná světová role); není to PJ-only.
Kód: `Projekt-ikaros-FE/src/app/router.tsx:63-274`.

---

### Seznam postav (adresář)

**Co to je:** Adresář všech postav světa — karty rozdělené do sekcí Postavy hráčů (PC) a NPC, plus volitelně Oblíbené a seskupení dle herní skupiny. Vyhledávání, filtr typu.

**Kde:** `/svet/:slug/postavy`. FE `CharactersPage.tsx` (tenký wrapper) → `CharacterDirectory.tsx`.

**Kdo (FE):** Vidí každý člen světa (`memberOnly`). Tlačítko „Nová postava" + wizard jen pro `userRole >= WorldRole.PJ` (`canManage`, `CharacterDirectory.tsx:156`).

**Kdo (BE):** Data jdou přes **Pages modul**, ne characters. Hook `usePersonaDirectory` volá `GET /worlds/:worldId/pages/directory?type=Postava hráče,NPC` (`usePersonaDirectory.ts:21`). Viditelnost jednotlivých karet tedy řídí **page-level visibility** v pages.service, ne characters.service. (Legacy `GET /characters/directory` existuje, ale FE ho už nepoužívá — `characters.repository.ts:96-99` to označuje jako backward-kompat k odstranění.)

**Co jde dělat (vše):**
- Filtr typu: Vše / Hráčské / NPC (URL `?filter=`).
- Fulltext hledání podle jména, slugu i jména hráče (URL `?q=`); `normalize()` zvládá diakritiku.
- Toggle „Skupiny" — PC rozdělí dle `membership.group` s barvami z `worldSettings.groupColors` (URL `?group=1`).
- Oblíbené postavy — `useFavoriteCharacters` (localStorage, per-world).
- „Nová postava" (PJ+) → `NewPageWizardModal` s volbami: PC → `/nova-stranka?type=PostavaHrace`, NPC → `?type=NPC`, „NPC z bestiáře" → naviguje na `/bestiar`.

**Hranice — co neumí:**
- Vytvoření postavy NEJDE z této stránky přímo — jen přesměruje do wizardu / editoru stránky. CreateCharacterModal byl zrušen (9.1).
- Filtr „Lokace" odstraněn — lokace jsou v `/stranky` (PageType Lokace), ne v adresáři.
- Seskupení funguje jen pro PC (NPC nemají owner/skupinu).
- Oblíbené jsou jen lokální (localStorage), nesynchronizují se mezi zařízeními.

**Stav:** ✅ funguje.
**Kód:** FE `CharacterDirectory.tsx:118-386`, `usePersonaDirectory.ts`. BE `pages` modul (directory endpoint).

---

### Detail postavy + Moje postava

**Co to je:** Dvě tenké routovací vrstvy nad sjednoceným Page viewerem.

- **`CharacterDetailRoute`** (`/postava/:slug`) — jen permanentní redirect na sjednocenou URL `/svet/:slug/:slug`. Existuje pouze kvůli starým bookmarkům. Skutečný profil renderuje `PostavaLayout` v `PageViewer`. (`CharacterDetailRoute.tsx:14-20`)
- **`MyCharacterPage`** (`/moje-postava`) — zkratka člena ke své postavě:
  1. Má-li `character` v kontextu → redirect na `/postava/<characterPath>`.
  2. `characterPath` nastaven, ale postava smazána (stale) → hláška „Postava neexistuje".
  3. Žádná postava → CTA „Zobrazit adresář" (PJ navíc „Vytvořit postavu" → `/nova-stranka?type=PostavaHrace`).

**Kde / Kdo:** `memberOnly`. „Vytvořit postavu" jen `userRole >= WorldRole.PJ` (`MyCharacterPage.tsx:43`).

**Hranice:** Legacy `CharacterDetailPage` byl smazán (9.1 cleanup migrace `cleanup-character-duplicates-9.1`); bio data byla přesunuta z Character entity do Page, takže fallback na legacy detail už není možný.

**Stav:** ✅ funguje.
**Kód:** FE `CharacterDetailRoute.tsx`, `MyCharacterPage.tsx`.

---

### 3-tier model: PC / NPC / Bestie

Platforma rozlišuje **tři typy** herních entit. Klíčové je nesplést NPC (Character) s Bestií (samostatný model).

| | **PC (hráčská postava)** | **NPC** | **Bestie** |
|---|---|---|---|
| Reprezentace | Page `type='Postava hráče'` + Character `isNpc=false, kind='persona'` | Page `type='NPC'` + Character `isNpc=true, kind='persona'` | samostatný model `Bestie` (kolekce `bestiae`) |
| Owner | `userId` (hráč) | bez `userId` | `ownerUserId` (user scope) nebo `worldId` (world scope) nebo žádný (system) |
| Subdokumenty | všech 5 (deník/finance/výbava/kalendář/poznámky) | jen 3 (deník/kalendář/poznámky — Finance + Výbava → 404 `*_NOT_APPLICABLE`) | žádné subdocy; jen `systemStats` + `abilities` + `notes` |
| Deník | ano (vyprávěcí) | ano | ne |
| Karetní listina | per-system schema (deník) | per-system schema | per-system bestie schema (`systemStats`) |
| Kde se tvoří | adresář / wizard | adresář / wizard | Bestiář (`/bestiar`) |
| Na taktické mapě | PC token (z palety) | NPC token | Bestie token = nezávislá **instance** (snapshot) |

**Rozdíl NPC vs. Bestie (důležité):**
- **NPC** = plnohodnotná Character postava s deníkem, vystupuje ve fikci, má kalendář a poznámky. (`character.interface.ts:54-61`)
- **Bestie** = katalogová šablona statistik (`systemStats`) pro hromadné nepřátele/tvory. NpcTemplate model byl zrušen a sjednocen na Bestie. Bestie nemá deník.
- **Lokace** je 4. varianta Character (`kind='location'`): jen kalendář subdoc, ostatní skipnuty; finance/výbava → 404. Patří do `/stranky`, ne do adresáře postav. (`character-subdocs.service.ts:124-143`)

**Co řídí typ:** `isNpc` (PC vs NPC) + `kind` (`persona` vs `location`). `convert` endpoint umí překlopit NPC ↔ PC (přidá/odebere `userId`, `character-subdocs.service.ts:146-170` synchronizuje skryté finance/výbavu).

**Stav:** ✅ funguje.
**Kód:** FE `CharacterDirectory.tsx:54-78` (classify), `PostavaLayout.tsx`. BE `characters/interfaces/character.interface.ts`, `bestiae/interfaces/bestie.interface.ts`.

---

### Character subdokumenty (5 subdoc)

**Co to je:** Postava (Character entity) je po sjednocení 9.1 jen kontejner pro **5 subdokumentů**. Bio/obrázek/přístup žijí v Page entity.

**5 subdokumentů (potvrzeno v kódu):**
1. **Deník** (`CharacterDiary`) — vyprávěcí deník + per-system listina (`customData`, `personalDiarySchema`, `sections`, `extraBlocks`).
2. **Kalendář** (`CharacterCalendar`) — herní události postavy/lokace.
3. **Finance** (`CharacterFinance`) — měsíční bilance (income/expense entries), balance, transakce. **Jen PC.**
4. **Výbava / Inventory** (`CharacterInventory`) — sekce s položkami. **Jen PC.**
5. **Poznámky** (`CharacterNotes`) — volné poznámky / dohody s PJ.

**Kde:** BE modul `character-subdocs`. Routy `worlds/:worldId/characters/:slug/{diary,calendar,finance,inventory,notes}` (`character-subdocs.controller.ts:30`). FE taby v `PostavaLayout.tsx:26-30` (DiaryTab/FinanceTab/InventoryTab/NotesTab/CalendarTab).

**Kdo (FE):** Subdoc taby (Deník/Finance/Výbava/Kalendář/Poznámky) jsou viditelné jen pro `userRole >= PomocnyPJ` NEBO vlastníka PC (`canSeePrivate`, `PostavaLayout.tsx:69`). Veřejnost vidí jen tab Profil (Bio). PJ může jednotlivé subdoc taby skrýt přes `worldSettings` (character-tab-visibility, `getVisibleTabs`).

**Kdo (BE):** `assertSubdocAccess` (`characters.service.ts:149-194`):
- Persona: PomocnyPJ+ (štáb) NEBO vlastník (`!isNpc && userId === requester`).
- Lokace: jen PomocnyPJ+ (read i write); bez membership → 404 (anti-leak).
- Cizinec → 403 `CHARACTER_ACCESS_DENIED`. BE je autoritativní — skrytí tabů na FE je jen UX.

**Co jde dělat (vše):**
- **Deník:** edit listiny (per-system sheet), custom bloky, `customDataPatch` delta merge (per-key `$set`/`$unset`). PJ akce: remap klíčů (rename bloku), reset všech personal schémat světa, bulk remap napříč postavami. (`character-subdocs.service.ts:236-354`)
- **Finance:** balance, příjmové/výdajové položky, „přičíst měsíční", undo poslední transakce. (`addMonthly`, `undoLastTransaction`)
- **Výbava:** sekce + položky; atomický append (nákup z obchodu přes `appendItemToSection` `$push`).
- **Kalendář:** events postavy; `read` action umožní i ne-staff členům číst (mírnější gate).
- **Poznámky:** volný text.

**Lazy-create / self-healing:** Subdocy se vytvoří při `character.created` eventu (kaskáda). Legacy postavy bez subdocu se uzdraví prvním GET (lazy-create) s RC-D1 rollbackem, pokud se rodičovská postava mezitím smaže (orphan guard, `character-subdocs.service.ts:75-87`).

**Hranice — co neumí:**
- Finance a Výbava NPC/Lokace nemají → GET vrací 404 `FINANCE_NOT_APPLICABLE` / `INVENTORY_NOT_APPLICABLE`; FE z toho udělá klidnou hlášku (SubdocErrorState). Budoucí NPC obchodník/Lokace sklad = odebrat gate (`character-subdocs.service.ts:407-417`).
- Bio nemá inline edit v PostavaLayout — „Upravit Bio" navádí na PageEditor (`/edit/<slug>`).
- `customData` full-replace (legacy) je deprecated — varuje v logu; preferuje se delta `customDataPatch` (jinak hrozila data loss při switchi systému).

**Zvláštnosti:** Při převodu PC→NPC se finance/výbava nesmažou, jen označí `isHidden=true` (a zpět při NPC→PC). Smazání postavy → cascade `character.deleted` smaže všech 5 subdoc + účty (best-effort, selhání neshodí delete).

**Stav:** ✅ funguje.
**Kód:** FE `PostavaLayout.tsx:150-290`, `CharacterDetailPage/components/*`. BE `character-subdocs/character-subdocs.service.ts`, `character-subdocs.controller.ts`.

---

### Per-system schema engine (listina postavy)

**Co to je:** Postava má statistiky podle herního systému světa (`world.system`). Listina (character sheet) se renderuje per-system; schémata jsou canonical na FE a exportují se do BE pro soft-mode validaci.

**Kde / jak:**
- **Deník/listina (FE):** registry presetů `diary-systems/registry.ts`. Dedikovaný sheet pro 13 systémů: `generic, matrix, coc, dnd5e, drd2, drd16, drdh, drdplus, fate, gurps, jad, pi, shadowrun`. Neznámý `world.system` → `generic` preset (žádný crash). Aliasy: `dnd→dnd5e`, `pribehy_imperia→pi`. (`registry.ts:26-71`)
- **Schema dat (FE→BE):** schémata canonical na FE (`tactical-map/schemas/registry.ts`), `scripts/export-schemas.mjs` je exportuje do BE.
- **System presety (BE):** `GET /system-presets` (seznam) a `GET /system-presets/:system` (plné `schema[]`); anonymní, in-memory `SYSTEM_PRESETS`. (`system-presets.controller.ts`, `system-presets.service.ts`)
- **Validace (BE):** `SystemStatsValidatorService` (`maps/schemas/system-entity-schema`) validuje `systemStats` bestií i tokenů. **Soft mode:** chybí-li BE schema pro systém (`errors._schema`), validace se přeskočí a důvěřuje se FE — jinak by šlo tvořit entity jen pro systémy s exportovaným schématem. (`bestiae.service.ts:108-122`)

**Jak vypadá listina:** Per-system React sheet komponenta (např. `MatrixSheet`, `DndSheet`, `CocSheet` …) čte hodnoty z `diary.customData` přes prefixovaný accessor `makeCdAccess(cd, 'matrix_', …)`; cizí prefixy z jiných presetů render neovlivní. Personal override schéma (`personalDiarySchema`) má přednost před schématem světa.

**Per-postava override:** Postava může mít vlastní `personalDiarySchema` (override nad světovým). `resolveAllowedKeys` (`character-subdocs.service.ts:98-110`): nejdřív personal, pak aktivní verze schématu světa, jinak `null` = pass-through (bez filtru — bezpečnější než ztratit data).

**Hranice:**
- Bez exportovaného BE schématu = žádná serverová validace statů (soft mode důvěřuje FE).
- `Character.systemStats` jako samostatné indexované pole zatím NEexistuje — token.update pro PC/NPC jen loguje debug, neukládá staty zpět do Character (`map-operations.service.ts:618-631`). Staty PC/NPC žijí v `diary.customData`.

**Stav:** ✅ funguje (soft-mode validace záměrná).
**Kód:** FE `diary-systems/registry.ts`, `scripts/export-schemas.mjs`. BE `system-presets/*`, `maps/schemas/system-entity-schema/system-stats-validator.service.ts`.

---

### Bestiář

**Co to je:** Katalog bestií (tvorů/nepřátel) se statistikami per herní systém, ve **3 scope**.

**Kde:** `/svet/:slug/bestiar`. FE `bestiar/BestiarPage.tsx`. BE modul `bestiae` — controller `bestiae` (NE pod `worlds/`, top-level).

**3 scope (taby):**
- **Můj (`user`)** — osobní bestie uživatele (`ownerUserId`), cross-world (vázané jen na systém).
- **Tohoto světa (`world`)** — bestie světa, spravuje PomocnyPJ+.
- **Systémové (`system`)** — globální bestiář systému; read-only přes API, tvoří jen platform Admin/Superadmin.

**Kdo (FE):**
- Tlačítko „Nová bestie": system tab → jen globální Admin/Superadmin; user/world tab → `isPjInWorld` (PomocnyPJ+ nebo globální Admin). (`BestiarPage.tsx:84`)
- `canEdit`: system → nikdy (kromě globálního Admina); user → jen owner; world → PomocnyPJ+. (`BestiarPage.tsx:58-64`)

**Kdo (BE):** `bestiae.service.ts`:
- `assertCanRead`: system = veřejné; user = jen owner (+globální Admin); world = člen světa.
- `assertCanWrite`: system → jen globální Admin (`SYSTEM_BESTIE_READ_ONLY`); user → jen owner; world → PomocnyPJ+ (`assertCanManageWorld`).
- Globální Admin/Superadmin bypass všude.

**Co jde dělat (vše):** list (3-scope filtrovaný `findVisible`), detail, create, update, soft-delete (koš), restore, **clone** (libovolný scope → user/world; přenese staty, schopnosti, obrázek, `clonedFromId`). WS signál `bestiar:changed` (scope-routed, leak-safe) → klient refetchne; invaliduje cross-world stejného systému. (`bestiae.service.ts:185-217`, `useBestiar.ts:20-25`)

**Obrázek + výřez:** editor (`BestieEditorModal`) nahrává obrázek přes sdílenou `HeroUploadCard` a umožňuje zvolit **výřez** — focal bod (klik do obrázku), zoom 100–400 %, fit cover/contain (parity s akcemi/stránkami/novinkami). Pole `imageFocalX/Y`, `imageZoom`, `imageFit` napříč FE (`bestiar/types.ts`) i BE (interface/schema/Create+Update DTO/`toEntity`); default null = cover 50/50. Výřez se projeví v katalogu (`BestieCard` přes `getImageStyle`), na **tokenu taktické mapy** (`TokenSprite` `getSpriteTransform` — cover/focal/zoom posunem+scale spritu v kruhové masce; opravilo i dřívější roztažení na čtverec) i v paletě (`PaletteAvatar`). PC/NPC tokeny focal nenesou (`characterData` bez focal) → původní render. (`BestieEditorModal.tsx`, `bestiae/dto/*`)

**Snapshot semantics při spawn:** Bestie spawnutá na taktickou mapu = **nezávislá instance** (token), ne read-only odkaz do katalogu. Token dostane `characterId` ve tvaru `bestie:<id>`, kopii `systemStats`/schopností/`notes` a vlastní `health.current`. Pozdější změna katalogu instanci na mapě neovlivní; per-scéna whitelist přes `scene.activeBestieIds`. (`map-operations.service.ts:507-525,618-631`)

- **Schopnosti** bestie se editují přes per-system schéma (sekce „Schopnosti" v `bestie.json` → ukládá se do `systemStats.abilities`, list `{label,value}`). To je **jediný zdroj** — čtou ho katalogová karta (`BestieCard`) i spawn na mapu přes sdílený helper `getBestieAbilities` (`bestiar/lib/bestieAbilities.ts`). Spawn (`buildSpawnToken`) je kopíruje do `token.abilities`; token panel (`BestieStatblock`) je zobrazí a umožní **hod kostkou** (🎲 podle hodnoty). Dřívější duplicitní top-level pole `bestie.abilities` (model/DTO/schema) bylo **odstraněno** (D-NEW-BESTIE-ABILITIES-DUP) — editor do něj nikdy nepsal.

**Hranice:**
- Bestie nemá deník/finance/výbavu/kalendář (jen `systemStats` + `abilities` + `notes`).
- System scope se přes běžné UI needituje — jen Admin platformy.
- Staty se validují jen v soft mode (viz schema engine).

**Stav:** ✅ funguje.
**Kód:** FE `bestiar/BestiarPage.tsx`, `bestiar/hooks/useBestiar.ts`. BE `bestiae/bestiae.controller.ts`, `bestiae/bestiae.service.ts`.

---

### Obchod (Shop)

**Co to je:** Katalog položek k nákupu se skupinami/typy, slevami, vícem. měnami a napojením na finanční účty postav (nákup odečte peníze a přidá položku do výbavy).

**Kde:** `/svet/:slug/obchod`. FE `shop/components/ShopView.tsx`. **BE NEMÁ vlastní modul `shop`** — vše běží přes modul **`campaign`** (`/campaign/shopitems`, `/campaign/shopgroups`, `/campaign/purchases`). Nákupní logika v `campaign/services/campaign-purchase.service.ts`. (`shop/api.ts:22-25`)

**Kdo (FE):**
- Správa katalogu (přidat/upravit/mazat položku i typ, „Spravovat typy"): `canManage = viewerRole >= PomocnyPJ`.
- Sdílení položky (`isShared`): `canShare = PomocnyPJ+`.
- Nákup: každý hráč pro svou postavu; staff (`canManage`) pro libovolnou postavu („Nakupuji pro" select).
- Filtry „Jen moje / Jen sdílené" jen pro `canManage`. (`ShopView.tsx:32-34,109-110`)

**Kdo (BE):**
- `findShopItems`/`findShopGroups` scope dle role: PJ vidí vše; PomocnyPJ svoje+sdílené; hráč svoje+sdílené (děleno klientsky na vrstvy). (`shop/api.ts:24-26`)
- `createShopGroup` vyžaduje PomocnyPJ+ (`campaign.controller.ts:637-641`).
- `purchase`: hráč smí kupovat jen své postavě (`NOT_YOUR_CHARACTER`); staff komukoli. Účet musí patřit postavě a být v daném světě. (`campaign-purchase.service.ts:99-126`)

**Co jde dělat (vše):**
- Položky: název, cena, měna (`currencyCode`), sleva %, skupina/podskupina, doporučeno, reference link, sdílení.
- Skupiny/typy: 2 úrovně (parent/child), vlastní sleva % (dědí se na položky).
- Slevy se NEsčítají — priorita položka > podskupina > skupina (`effectiveDiscount`).
- **Nákup** (`shopitems/:id/purchase`): množství, sleva, převod do měny účtu (autorita BE), kontrola dostatku (`INSUFFICIENT_FUNDS`). 3 atomické kroky: append do výbavy → odečet z účtu → purchase log. Replica set → `withTransaction`; jinak sekvenční fallback s plnou kompenzací (peníze se neztratí). (`campaign-purchase.service.ts:75-396`)
- **Storno** (`purchases/:id/refund`): vrátí peníze + odebere položku z výbavy; atomický flip statusu (souběžné storno vrátí max 1×). (`campaign-purchase.service.ts:398-470`)
- **Historie nákupů**: staff vidí vše/per-postava; hráč jen své postavy (`listPurchases`).
- Řazení dle ceny převedené na preferovanou měnu uživatele; preferovaná měna per-user.

**Hranice:**
- Není samostatný `shop` BE modul — je to fasáda campaign modulu (potenciálně matoucí při hledání kódu).
- `characterId` se musí dohledat z detailu postavy (PageDirectoryEntry.id ≠ characterId — `ShopView.tsx:68-71`).
- Nákup jde jen pro PC (NPC/Lokace nemají výbavu ani účet relevantní pro nákup).

**Stav:** ✅ funguje.
**Kód:** FE `shop/components/ShopView.tsx`, `shop/api.ts`, `shop/pricing.ts`. BE `campaign/campaign.controller.ts:539-731`, `campaign/services/campaign-purchase.service.ts`.

---

### Převodník měn + měny světa

**Co to je:** Definice měn světa (kód/název/symbol/kurz) + kalkulačka přepočtu mezi nimi.

**Kde:** `/svet/:slug/prevodnik-men`. FE `CurrencyPage.tsx` → `currencies/components/{ConverterSection, CurrenciesListSection}`. BE modul `world-currencies`, routy `worlds/:worldId/currencies` (`world-currencies.controller.ts:25-63`).

**Kdo (FE):**
- Převodník: každý člen.
- `canEdit` (upravit rate/název/symbol existující měny, „Nastavit jako základ"): `PomocnyPJ+`.
- `canAddOrDelete` (přidat/smazat měnu): `PJ+`. (`CurrencyPage.tsx:27-28`)

**Kdo (BE):** `world-currencies.service.ts`:
- `getCurrencies`/`convert`: jen člen světa (`assertMember`).
- `updateCurrencies`: rozlišuje **metadata-only edit** (stejná sada kódů — jen rate/name/symbol) → `assertCanEdit` (PomocnyPJ+) vs. **add/delete** (změna sady kódů) → `assertCanAdmin` (PJ+). Globální Admin/Superadmin bypass. (`world-currencies.service.ts:45-91`)

**Co jde dělat (vše):**
- Seznam měn: kód, název, symbol, kurz (`rate` relativní k základní = 1.0).
- Přepočet: `result = amount * (from.rate / to.rate)`, zaokrouhlení na 4 desetinná místa (`convert`).
- Úprava sady (PUT = úplné přepsání), guard na duplicitní kód (`CURRENCY_CODE_DUPLICATE` — embedded pole nelze indexovat na uniqueness, proto guard v service).
- Seed měn dle žánru světa při založení (`seedForWorld`): fantasy = Zlaťák/Stříbrňák/Měďák; cyber = Kredit/NUSA Dolar; space = Kredit/Krystal; postapo = Zátka/Příděl; jinak Mince. (`world-currencies.service.ts:143-189`)
- Měny pohánějí i nákup v obchodě a změnu měny finančního účtu (přepočet kurzem).

**Hranice:**
- `convert` odmítne stejné from==to (`CURRENCY_SAME_FROM_TO`).
- Update je full-replace celé sady (PUT), ne delta — FE musí poslat kompletní seznam.
- Kurzy jsou statické (žádné historické/živé kurzy).

**Stav:** ✅ funguje.
**Kód:** FE `pages/CurrencyPage.tsx`, `currencies/api.ts`, `currencies/components/*`. BE `world-currencies/world-currencies.controller.ts`, `world-currencies/world-currencies.service.ts`.

---

### Finanční účty postav (kontext k Financím a Obchodu)

**Co to je:** Per-postava bankovní účty (multi-account, sdílené, převody) — pohánějí FinanceTab i nákup v obchodě. Subdoc `Finance` (měsíční bilance) je něco jiného než tyto `Account` entity.

**Kde:** BE `character-subdocs/character-accounts.controller.ts` (routy `worlds/:worldId/characters/:slug/accounts` + `worlds/:worldId/accounts/:accountId/*`). FE `CharacterDetailPage/components/accounts/*`, `FinanceTab.tsx`.

**Co jde dělat:** vytvořit/upravit/smazat účet, měna účtu + změna měny (přepočet kurzem nebo jen přeznačení), spoluvlastníci (PJ-only), převod primary ownership, vklad/výběr (adjust), undo, transfer mezi účty, „přičíst měsíční bilanci", herní datum transakcí.

**Kdo (BE):** Per-akce permission v `character-accounts.service.ts`: read / write-content / write-settings / delete; PJ+ vždy, hráč-vlastník jen s flagem `allowPlayerSelfAdjust`. (`character-accounts.controller.ts:251-274`)

**Stav:** ✅ funguje.
**Kód:** BE `character-subdocs/character-accounts.controller.ts`, `character-accounts.service.ts`. FE `CharacterDetailPage/components/accounts/`, `FinanceTab.tsx`.

---

## ⚠️ Nesrovnalosti & dluhy (k ověření)

1. **Obchod nemá vlastní BE modul** — vše běží přes `campaign` (`/campaign/shopitems`…). Hledání „shop" v BE modulech selže; dokumentace/onboarding to musí zdůraznit. (`shop/api.ts:22-25`, `campaign.controller.ts:539+`)
2. **Dva zdroje adresáře postav** — FE čte Pages directory (`usePersonaDirectory`), zatímco BE `GET /characters/directory` + `findDirectory` je legacy „k odstranění v navazujícím cleanup" (`characters.repository.ts:96-99`), ale stále existuje. Viditelnost karet tedy řídí page-level visibility, NE characters.service — ověřit, že to odpovídá očekávání (NPC se skrytou stránkou se v adresáři nezobrazí).
3. **Staty PC/NPC se z taktické mapy neukládají zpět** — `token.update` se `systemStats` pro PC/NPC jen loguje debug (`map-operations.service.ts:618-631`); `Character.systemStats` jako pole „zatím není rozšířené". Staty PC/NPC reálně žijí v `diary.customData`. Změna HP/statů tokenu na mapě se tedy nepropíše do listiny postavy (kromě bestií, které mají snapshot na tokenu). Potenciální nekonzistence k ověření.
4. **Soft-mode validace statů** — bez exportovaného BE schématu (`scripts/export-schemas.mjs`) se `systemStats` bestií i tokenů nevaliduje (`errors._schema` → skip). Záměrné, ale znamená, že nesprávná data projdou pro systémy bez schématu.
5. **Per-system listina = 13 dedikovaných sheetů** (`registry.ts`), neznámý `world.system` spadne na `generic`. Ověřit, zda všechny systémy v `SYSTEM_PRESETS` (BE) mají odpovídající FE preset a naopak (dvojí zdroj pravdy: FE registry vs. BE SYSTEM_PRESETS).
6. **Finance/Výbava NPC/Lokace → 404 `*_NOT_APPLICABLE`** je záměr, ne bug — ale FE musí 404 odlišit od skutečné chyby (SubdocErrorState). Budoucí „NPC obchodník / Lokace sklad" = odebrat gate v `getFinance`/`getInventory` (`character-subdocs.service.ts:407,486`).
7. **Měny: full-replace PUT** — `updateCurrencies` přepisuje celou sadu; klient musí vždy poslat kompletní seznam, jinak hrozí ztráta měn. Bez delta merge.
8. **Convert přesnost** — přepočet měn i ceny v obchodě zaokrouhluje na 4 desetinná místa (`round4`); řetězené převody (item currency → account currency) mohou kumulovat zaokrouhlovací chybu. K ověření u drahých položek.
9. **Bestie update payload nesmí nést immutable pole** — `systemId`/`scope`/`worldId` jsou na BE immutable a nejsou v `UpdateBestieDto`; s `forbidNonWhitelisted` jakékoli pole navíc → **PATCH 400**. FE `BestieEditorModal` proto posílá `systemId` jen do create. (Bylo příčinou 400 při úpravě bestie; opraveno.)
