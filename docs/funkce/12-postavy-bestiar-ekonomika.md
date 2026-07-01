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
- **Tisk deníku / postavy (14.7):** „Tisk / PDF" v záložce Deník + „Tisk všech záložek" u postavy → tisk v samostatném okně (pilíř A, kap. 11). Diary sheet má v `printMode` **statický tiskový render** (hodnoty z `<input>` jako text, pips/tracky `●●●○○`) — všech 12 systémů (matrix/coc/dnd5e/drd*/fate/gurps/jad/pi/shadowrun). Výbava (`InventoryTab`) se v tisku rozbalí; bestie staty mají mezeru (`print-stat`). ✅ reálně ověřeno (Matrix deník 2026-06-20); ostatní sheety přes vzor + testy.

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
- **Deník/listina (FE):** registry presetů `diary-systems/registry.ts`. Dedikovaný sheet pro 13 systémů: `generic, matrix, coc, dnd5e, drd2, drd16, drdh, drdplus, fate, gurps, jad, pi, shadowrun`. Neznámý `world.system` → `generic` preset (žádný crash). Aliasy: `dnd→dnd5e`, `pribehy_imperia→pi` a (16.2a) **„dlouhá" id z nabídky** `draci-hlidka→drdh`, `drd-plus→drdplus`, `call-of-cthulhu→coc` (nabídka ukládá tato id raw, engine je zná krátce). Stejná alias mapa zrcadlena v `map-systems/registry.ts`. Parity test (`diary-systems/__tests__/registry.test.ts`) hlídá, že každý systém z nabídky má dedikovaný sheet. (`registry.ts`)
- **Schema dat (FE→BE):** schémata canonical na FE (`tactical-map/schemas/registry.ts`), `scripts/export-schemas.mjs` je exportuje do BE.
- **System presety (BE):** `GET /system-presets` (seznam) a `GET /system-presets/:system` (plné `schema[]`); anonymní, in-memory `SYSTEM_PRESETS`. (`system-presets.controller.ts`, `system-presets.service.ts`)
- **Validace (BE):** `SystemStatsValidatorService` (`maps/schemas/system-entity-schema`) validuje `systemStats` bestií i tokenů. **Soft mode:** chybí-li BE schema pro systém (`errors._schema`), validace se přeskočí a důvěřuje se FE — jinak by šlo tvořit entity jen pro systémy s exportovaným schématem. (`bestiae.service.ts:108-122`)

**Jak vypadá listina:** Per-system React sheet komponenta (např. `MatrixSheet`, `DndSheet`, `CocSheet` …) čte hodnoty z `diary.customData` přes prefixovaný accessor `makeCdAccess(cd, 'matrix_', …)`; cizí prefixy z jiných presetů render neovlivní. Personal override schéma (`personalDiarySchema`) má přednost před schématem světa.

**Shadowrun 6e (2026-06-30):** `ShadowrunSheet` přepsán z legacy portu na cyberpunk HUD (sci-fi rodina `--mx-*`, třídy `.sr-*`) s **výpočetním jádrem** — 8 atributů → odvozené hodnoty (iniciativa REA+INT, HO=Tělo+zbroj, Composure/Odhad/Paměť/Zvedání) + velikosti záznamníků (8+⌈atr/2⌉); zranění −1 za 3 boxy se promítá do dice poolů; pool dovednosti/zbraně = atribut + hodnocení (+2 specializace). View/edit/print, PC/NPC, `sr_` klíče (reuse legacy). **Hody se v deníku nezobrazují** (kostky až v TM/chatu — záměr). SR6 success-pool engine + combat panel + bestie viz samostatný blok „Shadowrun 6e (success pool)" níže. (`sheets/shadowrun/ShadowrunSheet.tsx`, `styles/shadowrun.css`, `sheets/shadowrun/constants.ts`, `sheets/shadowrun/shared.ts`)

**Per-postava override:** Postava může mít vlastní `personalDiarySchema` (override nad světovým). `resolveAllowedKeys` (`character-subdocs.service.ts:98-110`): nejdřív personal, pak aktivní verze schématu světa, jinak `null` = pass-through (bez filtru — bezpečnější než ztratit data).

**Hranice:**
- Bez exportovaného BE schématu = žádná serverová validace statů (soft mode důvěřuje FE).
- `Character.systemStats` jako samostatné indexované pole zatím NEexistuje — token.update pro PC/NPC jen loguje debug, neukládá staty zpět do Character (`map-operations.service.ts:618-631`). Staty PC/NPC žijí v `diary.customData`.

**Stav:** ✅ funguje (soft-mode validace záměrná).
**Kód:** FE `diary-systems/registry.ts`, `scripts/export-schemas.mjs`. BE `system-presets/*`, `maps/schemas/system-entity-schema/system-stats-validator.service.ts`.

---

### JaD deník — tvorba postavy (multipovolání, obory)

**Co to je:** Dedikovaný list systému `jad` (Jeskyně a draci = český port D&D 5e SRD). Od 8.7p umí multipovolání, výběr oboru/specializace dle JaD pravidel, osobní zázemí a strukturované přidávatelné sekce (dřív 1:1 přenos legacy listu).

**Kde:** Deník postavy (`DiaryTab`) ve světě s `world.system = 'jad'` → záložka Deník. Tab „Hlavní zápisník postavy" + volitelný tab „Kouzla".

**Kdo:** Vidí člen světa s přístupem k postavě; edituje vlastník PC / PJ+ (gating řeší `DiaryTab`; sheet jen renderuje `mode=view|edit`, ve view jsou všechny vstupy/akce disabled).

**Co jde dělat:**
- **Multipovolání:** přidat/odebrat libovolný počet povolání (11 povolání), každé s vlastní úrovní a oborem. Úroveň postavy = **auto součet** úrovní povolání (read-only badge).
- **Obor/specializace:** select plněný dle zvoleného povolání; **zamčený**, dokud úroveň povolání nedosáhne prahu (Čaroděj/Černokněžník/Klerik od 1., Druid/Kouzelník od 2., ostatní od 3.) — pod prahem hint „obor od N. úrovně".
- **Zázemí:** select 16 osobních zázemí + „Vlastní…" (volný text).
- 6 vlastností (auto modifikátor), záchrany (zdatnost pip), 18 dovedností (cyklus žádná/zdatnost/expertíza), pasivní smysly (auto `10+mod`), OČ/iniciativa/rychlost, HP/kostky obnovy/záchrany proti smrti.
- **Přidávatelné sekce:** Zdatnosti (zbroje/zbraně/nástroje), Jazyky, Schopnosti (název+popis), Zbraně (tabulka). Poznámky k hraní na celou šířku úplně dole.
- **Kouzla** (tab, jen je-li zapnut „Sesilatel / Alchymista"): pozice 0.–9. stupně, max/použité sloty, seznam kouzel. Sekce se sama nabídne, je-li mezi povoláními kouzlící (`JAD_CASTERS`), dokud uživatel toggle ručně nepřepne.

**Hranice / co neumí:** Obory jen jako jména — bez číselných účinků schopností (záměr, dohledává se v příručce). Nepočítá legálnost multiclassu (sloty kouzel, vstupní podmínky) — list je evidence, ne pravidlový engine. JaD má **8 vlastních skinů** (16.2g — viz „Skin deníku" níž; fantasy = nový default, dnešní světlý pergamen = no-skin fallback).

**Zvláštnosti:** Migrace legacy je **read-only** — starý `jad_class`/`jad_other_profs`/`jad_features` se odvodí pro zobrazení a do nových polí (`jad_classes`, `jad_profs`, `jad_feats`) se zapíše až prvním editem; odebraná pole (jméno/přesvědčení/hráč/pomůcky) se z DB **nemažou**, jen se neukazují. Data v `customData` prefix `jad_*` (delta merge přes `makeCdAccess`).

**Stav:** ✅ funguje (8.7p).
**Kód:** FE `diary-systems/sheets/jad/JadSheet.tsx`, `jad/constants.ts` (`JAD_CLASSES`/`JAD_BACKGROUNDS`/`JAD_CASTERS`), `jad/formulas.ts`, `styles/jad.css`. Spec `docs/arch/phase-8/spec-8.7p-jad-redesign.md`.

---

### Příběhy Impéria deník (`pi`) — osekaný Matrix-derivát

**Co to je:** Dedikovaný list systému `pi` (Příběhy Impéria). Přepsán z dřívějšího Fate-like wrapperu (`FateLikeSheet`, viktoriánské brass) na **osekaný derivát Matrixu** — sci-fi cyan HUD sladěný s `MatrixSheet`.

**Kde:** Deník postavy (`DiaryTab`) ve světě s `world.system = 'pi'` (nabídka „Příběhy Impéria"; raw id i alias `pribehy-imperia` → `pi`).

**Kdo:** Vidí člen světa s přístupem k postavě; edituje vlastník PC / PJ+ (gating `DiaryTab`; sheet jen `mode=view|edit`).

**Co jde dělat:**
- **Hero:** jméno z entity postavy (`character.name`, ne deníkové pole), Stát + Povolání (deníková pole `pi_bornWhere`/`pi_profession`), Body osudu 0–3 (★).
- **Fyzický stav:** Životy 0–5 + postih za zranění (4–5→0, 2–3→−1, 1→−2, 0→SMRT, dynamický readout) · **Ochrana = jediné políčko** (0–1).
- **Body schopností:** trojúhelník (úroveň N = 1+2+…+N) + každý aspekt nad 3 = 6 b., progress bar utraceno/strop.
- **Schopnosti:** pips 1–7 (PC) / 1–10 (NPC) + číslo + **slovní stupeň** (Nováček/Učeň/Tovaryš/Zkušený/Mistr oboru/Veterán/Legenda + 8–10 entity) v tooltipu na hover.
- **Aspekty:** chip Nabitý/Vybitý (toggle). Poznámky (textarea). Print režim (statický `PiPrintView`).

**Hranice / co neumí:** Oproti Matrixu ZÁMĚRNĚ chybí **jazyky, únava, přetlaky, runa, magie** (genom i 📘 flag). Deník sám **nehází kostkou ani iniciativu** (to combat panel na mapě). **8 vlastních skinů** (viz „Skin deníku" níž; scifi = default = osekaný Matrix HUD). Stará Fate `pi_*` data (jiné klíče) se v novém listu nezobrazí (zůstávají v DB).

**Zvláštnosti:** Data `customData` prefix `pi_*` (delta merge `makeCdAccess`); 0 migrace registrů. Iniciativa PC (jen v combat panelu) = čistý hod `4dF` bez bonusů. Schopnost > počtu aspektů → warn „toohigh".

**Stav:** ✅ funguje.
**Kód:** FE `diary-systems/sheets/pi/PiSheet.tsx`, `pi/constants.ts` (`PI_SKILL_LEVELS`, `piLevelName`), `styles/pi.css`, preset `presets/pi.ts`. BE: žádné (customData pass-through pro dedikované systémy).

---

### FATE — deník + bestiář + mapa + chat (`fae` + `fate`)

**Co to je:** Systém FATE ve **dvou variantách** sdílejících jednu kostru: `fae` = **Fate Accelerated** (6 fixních Přístupů Pečlivě/Chytře/Oslnivě/Rázně/Rychle/Lstivě), `fate` = **Fate Core** (volné Dovednosti + slovní žebříček). V nabídce „Herní systém" dvě samostatné položky (dřív 1 sloučená „Fate Core / Accelerated"). Default vzhled **„Karty osudu"** (slonovina + sépiové serify + signature 4dF kostky −/0/+).

**Kde:** Svět s `world.system = 'fae'` nebo `'fate'`. Deník (`DiaryTab`), bestiář (`/svet/:slug/bestiar`), taktická mapa (token panel), chat (rail).

**Kdo:** Jako ostatní systémy — člen s přístupem k postavě; edituje vlastník PC / PJ+. Bestiář dle 3 scope (viz „Bestiář").

**Co jde dělat:**
- **Deník** (`FateLikeSheet`, variant `fae`/`core`): Hlavní koncept + Problém + další aspekty · 6 Přístupů (+N) NEBO volné Dovednosti · Triky (název+popis) · Stres (sized boxy, default 3) · Následky (Drobný 2 / Mírný 4 / Vážný 6) · Obnova (★) · Deník/Poznámky. **Bez kostek** (záznam, ne boj). Print režim.
- **Bestiář** (`FateBestieCard`, „Karty osudu"): 2 schémata (`fae`/`fate:bestie`) řízená `world.system` — Hlavní koncept + aspekty + Přístupy/Dovednosti + Triky + Stres + Následky; editor přes generický `EntitySchemaForm`.
- **Taktická mapa**: PC combat panel (`FateCombatPanel` v `COMBAT_PANELS`) + bestie panel (`FateBestiePanel`) — sdílené UI jádro `FateCombatBody`; **hod 🎲 = 4dF + bonus**, klikací stres, Body osudu počítadlo, Iniciativa = prosté 4dF.
- **Chat**: PC zdarma přes `DiaryRollPanel`→`COMBAT_PANELS`; bestie přes `FateChatBestiePanel` (katalog read-only + instance v boji editovatelná). Sdílí `fateBestieView` s mapou (0 drift).
- **8 skinů** (default `minimal`) — viz „Skin deníku".

**Hranice / co neumí:** List = evidence, ne pravidlový engine (nepočítá útraty Obnovy ani limity triků). **HP bar na tokenu = žádný** (stres ≠ HP, `resolveCharacterHp` vrací `null` — herní rozhodnutí). Iniciativa bez statu (prosté 4dF). Fate Core = zjednodušen na **jeden** stres track (ne kanonické dva). Bestie data = `systemStats` (neprefix), deník = `customData` prefix `fae_*`/`fate_*` — jiné vrstvy.

**Zvláštnosti:** Deník+panel+bestie+chat sdílí 3 komponenty (`FateLikeSheet`, `FateCombatBody`, `fateBestieView`) přes `variant`/prefix → 0 drift. Bestie token = superset profilu v `systemStats` (BE `token.update` REPLACE + strict patch → schéma musí být superset). 4dF = fudge kostky (−/0/+).

**Stav:** ✅ funguje.
**Kód:** FE `_shared/FateLikeSheet.tsx`, `sheets/{fae/FaeSheet,fate/FateSheet}.tsx`, `presets/{fae,fate}.ts`, `styles/fate.css`; `bestiar/components/FateBestieCard.tsx`; `tactical-map/.../system-panels/{FateCombatPanel,FateBestiePanel}.tsx` + `fate/{FateCombatBody,fateBestieView}`; `chat/.../rail/FateChatBestiePanel.tsx`; schémata `tactical-map/schemas/{fae,fate}/`. BE: `fae/fate` token+bestie schémata v `backend/assets/schemas/` (export-schemas), jinak pass-through.

---

### Shadowrun 6e (success pool)

**Co to je:** Plné herní pokrytí systému Shadowrun 6e (Sixth World) — deník, taktická mapa, chat, bestiář — postavené na **success-pool** mechanice (hod hromadou k6, úspěchy = tváře 5–6), narozdíl od součtových (d20/2k6) systémů.

**Kde:** Svět s `world.system = 'shadowrun'`. Deník (`DiaryTab`), bestiář (`/svet/:slug/bestiar`), taktická mapa (token panel), chat (rail). Default skin `scifi`.

**Kdo:** Jako ostatní systémy — člen s přístupem k postavě; edituje vlastník PC / PJ+. Bestiář dle 3 scope.

**Co jde dělat:**
- **Deník** (`ShadowrunSheet`): viz blok „Per-system schema engine" výše (HUD `.sr-*`, výpočetní jádro, bez kostek v deníku).
- **SR6 dice engine** (`rollPoolHits(count, sides=6, threshold=5)`): hodí pool kostek, počítá **úspěchy** (tvář ≥5), **glitch** (víc než polovina kostek = 1), **kritický glitch** (glitch + 0 úspěchů). Reusable i pro jiné success-pool systémy (WoD d10/threshold 8). Roll flow `kind:'pool-d6'` + `pool` v `performSheetRoll` (TM) i `rollDiaryRequest` (chat); vykreslení úspěchů/glitche v `DiceLogPanel` + `DiceRollOverlay`. **Iniciativa = Reakce+Intuice + 1k6 (součet, `kind:'d6'`)**, NE pool.
- **Taktická mapa — PC** (`ShadowrunCombatPanel` v `COMBAT_PANELS`): kompaktní celý deník (bojové jádro + Detaily Kouzla/Matrix/Augmentace/Kvality/Kontakty/Identita v centrovaném `Modal`u reusujícím deníkové sekce). Klik na atribut/dovednost/útok = SR6 pool hod → dicelog. HP bar tokenu = fyzický záznamník (`resolveCharacterHp` case `shadowrun`: max = 8+⌈Tělo/2⌉, zbývá = max − `sr_cond_phys`).
- **Taktická mapa — bestie** (`ShadowrunBestiePanel`): jantarový statblok (`--srb-*`) — fyzický záznamník (damageable HP) + omráčení (postih), Obrana/Zbroj/Pohyb/Iniciativa, 8 atributů (klik = pool), útoky/dovednosti (přímý pool, klik = hod), schopnosti (powers, readonly), poznámky.
- **Bestiář** (2 schémata `shadowrun:bestie`/`shadowrun:token`): editor přes generický `EntitySchemaForm` (sekce Profil & boj / Atributy / Útoky / Dovednosti / Schopnosti); bestie drží **přímý pool** u útoků/dovedností a přímá odvozená pole (NE počítá z atributů jako PC).
- **Chat**: PC zdarma přes `DiaryRollPanel`→`COMBAT_PANELS`; bestie přes `ShadowrunChatBestiePanel` (katalog read-only + instance v boji editovatelná přes `onPatch`). Sdílí `shadowrunBestieView` + `ShadowrunBestieBody` s mapou (0 drift) — týž plný panel, jen užší rail.

**Hranice / co neumí:** Hod ukáže jen **počet úspěchů + glitch** — práh obtížnosti (kolik úspěchů je potřeba) řeší PJ ad hoc, neukládá se do statbloku. Bestie útoky/dovednosti = předpočítaný pool (nepočítá se z atributů). Edge (Hrana) v deníku evidovaná, ale boj ji automaticky neutrácí (PJ ručně). Práh úspěchu kostky pevně 5 (SR6); Attack/Defense Rating + auto-Edge nejsou modelované. 8 skinů zatím NEhotové (jen default scifi).

**Zvláštnosti:** Deník+combat panel sdílí výpočetní jádro `sheets/shadowrun/shared.ts` (`readAttrs/poolOf/woundPenalty/srDerived`) → 0 drift list↔panel. Bestie+chat sdílí `shadowrunBestieView` + `ShadowrunBestieBody`. Bestie token = superset profilu v `systemStats` (BE `token.update` REPLACE + strict patch → `token.json` musí být superset `bestie.json` + `health.current`/`stun_cur`/`initiative.current`). Bestie HP = damageable `health.current` (PC HP = odvozené z fyzického záznamníku přes `resolveCharacterHp`, jiná vrstva).

**Stav:** ✅ funguje (8 skinů zbývají).
**Kód:** FE `sheets/shadowrun/{ShadowrunSheet,constants,shared}.ts(x)`; dice `chat/dice/lib/{rollEngine,dicePayload}.ts` + `rollFromSheet.ts`/`rollFromDiary.ts`; `tactical-map/.../system-panels/ShadowrunCombatPanel.tsx` + `shadowrun/{ShadowrunBestieBody,shadowrunBestieView}` + `ShadowrunBestiePanel.tsx`; `chat/.../rail/ShadowrunChatBestiePanel.tsx`; `utils/resolveCharacterHp.ts`; schémata `tactical-map/schemas/shadowrun/`. BE: `shadowrun` token+bestie schémata v `backend/assets/schemas/` (export-schemas, push 5db1b33), jinak pass-through.

---

### Skin deníku (vizuální „kabát" listu)

**Co to je:** Vizuální styl per-system listu, nezávislý na obsahu/datech. Rodina **8 skinů** (`scifi · fantasy · horror · steampunk · nature · minimal · retro · anime`=MLP); každý vlastní paleta + tvarový jazyk + signature ornament, identita drží napříč systémy.

**Volba:** per **uživatel × svět** (`WorldMembership.diarySkin`); bez volby padá na default systému (`DEFAULT_SKIN_BY_SYSTEM`: matrix→scifi, **pi→scifi** (osekaný Matrix), drd16/drdplus/drd2/jad/drdh→fantasy, coc→horror, **fae/fate→minimal** (≈ Karty osudu)). User-facing picker `DiarySkinSelector` („🎨 Vzhled") na `DiaryTab` jen pro skinovatelné systémy (do tisku/PDF nejde). Registr `diary-systems/skins/registry.ts`, BE whitelist `update-member.dto.ts` (`@IsIn`, 8 ID).

**Jak se aplikuje:** `DiarySystemProvider` (deník) i `DiarySkinScope` (embedy: mapa/chat/dice) dají na předka `data-diary-system` + `data-diary-skin`; CSS sady (`styles/diary-skins.css` + `<sys>-skins/<id>.css`) přebíjí přes compound selektor `[data-diary-system][data-diary-skin]` přes tokeny `--mx-*` (HUD) / `--dd-*` (pergamen) / `--dd-embed-*` (embed plochy). Pokrývá: **deník list + bojový/bestie panel na mapě i v chatu (PC/NPC/Bestie stejně) + obal v TM + vyčíslení hodu + log kostek**.

**Stav per systém:** matrix ✅, drd16 ✅ (7 skinů), drdplus ✅ (8), **drd2 ✅ (16.2f — 7 skinů, fantasy = baseline listu)**, **jad ✅ (16.2g — 8 skinů, fantasy = nový default; světlý pergamen = no-skin fallback)**, **pi ✅ (8 skinů; scifi = default = osekaný Matrix HUD; port rodiny matrix→pi přes `--pi-*`/`--pi-log-*`)**, **fae/fate ✅ (8 skinů; minimal = default; `--dd-*` rodina, deník+panel render-ověřeno, embedy přes `:is()` enumerace + živý audit, panel akce nesou primární akcent skinu)**, **drdh ✅ (16b — 8 skinů; fantasy = default; `--dd-*`/`--drdh-*` rodina sourozenec drdplus/drd16; render-audit 8×9 povrchů + mobil 375/768 bez overflow; embed baseline+`:is()` enumerace v 5 modulech, readout signature + obal avatar opraveny drdh-scoped)**. Ostatní systémy: list bez skinů (jen default vzhled; shadowrun 8 skinů zbývá). Playbook: `docs/arch/phase-16/sablona-skiny-per-system.md`; spec drd2: `spec-16.2f-skiny-drd2.md`.
**Kód:** FE `diary-systems/skins/` (`registry.ts`, `DiarySkinSelector.tsx`, `useDiarySkin.ts`), `diary-systems/DiarySkinScope.tsx`, `styles/diary-skins.css` + `styles/{matrix,drd16,drdplus,drd2,jad,pi,drdh}-skins/`. Bestie panel v chatu = TÝŽ plný statblok jako na mapě (ne osekaná varianta). pi/drdh embed signatury (readout/obal TM) v `*.module.css`; chat rail chrome per-skin přes `:has()`; dicelog/orchestrace/rail jen barva (ornament policy). drdh: readout signature = `drdh` přidán do per-skin `:is()` skupin v `DiceRollOverlay.module.css` (aliasy dědí z compound scope), obal avatar drdh-scoped v `TokenInfoPanel.module.css` (`--dd-embed-*`).

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

**Render editoru/karty (per-system schéma):** editor (`BestieEditorModal` → generický `EntitySchemaForm`) i karta (`BestieCard` → `EntityStatbar`) se generují z `tactical-map/schemas/<system>/bestie.json` přes `systemEntitySchemaRegistry.get(systemId,'bestie')`. Bestie schéma mají: `matrix`, `dnd5e`, `coc`, `drd2`, `drd16`, **`drdplus` (16.2d)**, `fate`, `gurps` (`generic` má jen `token`, ne `bestie` → neznámý systém = „schéma není zaregistrované"). `drd16` má navíc **custom** kartu/form (`Drd16BestieCard`/`Drd16BestieForm`), ostatní jedou generic. Slovní popis bytosti = `Bestie.notes` (vestavěné v editoru, mimo schéma).
- **DrD+ schéma (`drdplus/bestie.json`, 16.2d):** 6 sekcí — Boj (`mez_zraneni` = `damageable` HP, `ochrana` = `armor-reducer`, `nezranitelnost`, **`utoky`** = list `{name,bc,uc,oc,zz,type}`), Vlastnosti (Sil/Obr/Zrč/Vol/Int/Chr), Tělo a pohyb (`rychlost` = `movement`, Odolnost/Výdrž/Velikost/Rozměry), Smysly (5×), Výskyt a ekologie (Četnost/Aktivita enum + Místo/Organizace), Schopnosti (list `{label,value}`). Spec: `spec-16.2d-bestie-drdplus.md`.
- **Normalizace `systemId` (16.2d):** `BestiarPage` mapuje `world.system` přes `resolveSystemId` — „dlouhá" id z nabídky (`drd-plus`→`drdplus`, `call-of-cthulhu`→`coc`, `draci-hlidka`→`drdh`) na canonical engine id. Bez toho by schema lookup minul a DrD+/CoC/Dračí hlídka bestiář spadl na „schéma není zaregistrované". BE `bestiae` je pass-through (ukládá/filtruje `systemId` beze změny → konzistentní). (`BestiarPage.tsx:27`, `systemId.ts`)

**Hranice:**
- Bestie nemá deník/finance/výbavu/kalendář (jen `systemStats` + `abilities` + `notes`).
- System scope se přes běžné UI needituje — jen Admin platformy.
- Staty se validují jen v soft mode (viz schema engine).
- **DrD+ „Mez zranění"** je lineární `damageable` HP, ne věrný 3řádkový pás zranění (bez postihu/postih/kóma) jako u postav — odloženo (D-DRDPLUS-WOUND-LINEAR).

**Stav:** ✅ funguje.
**Kód:** FE `bestiar/BestiarPage.tsx`, `bestiar/hooks/useBestiar.ts`, per-system bestie schémata `tactical-map/schemas/<system>/bestie.json` (+ `schemas/bootstrap.ts`, `schemas/registry.ts`). BE `bestiae/bestiae.controller.ts`, `bestiae/bestiae.service.ts`, mirror `backend/assets/schemas/<system>-bestie.json` (flat název, export-schemas).

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

### Výbava + Finance v herním embedu (taktická mapa + chat)
- **Co to je:** Tlačítka 🎒 Výbava / 💰 Finance přímo v deníku **hráčské postavy (PC)** na **taktické mapě** a v **chat railu** — otevřou modal s plnou Výbavou / Financemi, bez odchodu na stránku postavy. Reuse: modal mountuje existující `InventoryTab` / `FinanceTab` (soběstačné, data dle slugu).
- **Kde:** lišta `EmbedSubdocsBar` v `TokenSystemSheet` (mapa) + `DiaryRollPanel` (chat rail). Modal = sdílený `@/shared/ui` Modal, fetch `usePage(worldId, slug)`.
- **Kdo:** lišta se zobrazí **jen u PC** (NPC ani bestie Výbavu/Finance nemají — záměr, viz nesrovnalost #6; gate `!token.isNpc` / `attribution.kind !== 'npc'`); editace dle `canEdit` (vlastník/PJ, stejné gating jako panel). Finance vklad/výběr dál řídí BE per-akce.
- **Co jde dělat:** otevřít Výbavu (sekce + množství) i Finance (zůstatek, vklad/výběr, transfer, transakce) v modalu; přepínat taby; edit toggle (canEdit).
- **Hranice / co neumí:** vnitřek modalu zatím **není per-skin tokenizovaný** (drží světový vzhled); chrome lišty/tabů skin bere přes `--dd-embed-*`/`--mx-log-*`. Plné per-skin sladění vnitřku = následný krok.
- **Zvláštnosti:** modal portaluje do fullscreen elementu (funguje i v TM fullscreenu).
- **Stav:** 🚧 funkční pro PC (per-skin vnitřek čeká).
- **Kód:** FE `CharacterDetailPage/components/embed/EmbedSubdocsBar.tsx`, integrace `tactical-map/.../TokenSystemSheet.tsx` + `chat/components/rail/DiaryRollPanel.tsx`.

---

## ⚠️ Nesrovnalosti & dluhy (k ověření)

1. **Obchod nemá vlastní BE modul** — vše běží přes `campaign` (`/campaign/shopitems`…). Hledání „shop" v BE modulech selže; dokumentace/onboarding to musí zdůraznit. (`shop/api.ts:22-25`, `campaign.controller.ts:539+`)
2. **Dva zdroje adresáře postav** — FE čte Pages directory (`usePersonaDirectory`), zatímco BE `GET /characters/directory` + `findDirectory` je legacy „k odstranění v navazujícím cleanup" (`characters.repository.ts:96-99`), ale stále existuje. Viditelnost karet tedy řídí page-level visibility, NE characters.service — ověřit, že to odpovídá očekávání (NPC se skrytou stránkou se v adresáři nezobrazí).
3. **Staty PC/NPC se z taktické mapy neukládají zpět** — `token.update` se `systemStats` pro PC/NPC jen loguje debug (`map-operations.service.ts:618-631`); `Character.systemStats` jako pole „zatím není rozšířené". Staty PC/NPC reálně žijí v `diary.customData`. Změna HP/statů tokenu na mapě se tedy nepropíše do listiny postavy (kromě bestií, které mají snapshot na tokenu). Potenciální nekonzistence k ověření.
4. **Soft-mode validace statů** — bez exportovaného BE schématu (`scripts/export-schemas.mjs`) se `systemStats` bestií i tokenů nevaliduje (`errors._schema` → skip). Záměrné, ale znamená, že nesprávná data projdou pro systémy bez schématu.
5. **Per-system listina = 13 dedikovaných sheetů** (`registry.ts`), neznámý `world.system` spadne na `generic`. Ověřit, zda všechny systémy v `SYSTEM_PRESETS` (BE) mají odpovídající FE preset a naopak (dvojí zdroj pravdy: FE registry vs. BE SYSTEM_PRESETS).
6. **Finance/Výbava NPC/Lokace → 404 `*_NOT_APPLICABLE`** je záměr, ne bug — ale FE musí 404 odlišit od skutečné chyby (SubdocErrorState). Budoucí „NPC obchodník / Lokace sklad" = odebrat gate v `getFinance`/`getInventory` (`character-subdocs.service.ts:407,486`). (Embed lišta Výbava/Finance v TM+chatu proto cílí **jen na PC** — rozhodnutí autora 2026-06-30, že NPC Výbavu/Finance mít nebudou.)
7. **Měny: full-replace PUT** — `updateCurrencies` přepisuje celou sadu; klient musí vždy poslat kompletní seznam, jinak hrozí ztráta měn. Bez delta merge.
8. **Convert přesnost** — přepočet měn i ceny v obchodě zaokrouhluje na 4 desetinná místa (`round4`); řetězené převody (item currency → account currency) mohou kumulovat zaokrouhlovací chybu. K ověření u drahých položek.
9. **Bestie update payload nesmí nést immutable pole** — `systemId`/`scope`/`worldId` jsou na BE immutable a nejsou v `UpdateBestieDto`; s `forbidNonWhitelisted` jakékoli pole navíc → **PATCH 400**. FE `BestieEditorModal` proto posílá `systemId` jen do create. (Bylo příčinou 400 při úpravě bestie; opraveno.)

> Vyřešeno 16.2d Fáze 2: ~~DrD+ wound lineární~~ (`DrdPlusBestiePanel` má 3 pásma na mapě, dluh D-DRDPLUS-WOUND-LINEAR uzavřen) · ~~`world.system` raw na mapě~~ (`TacticalMapView` normalizuje přes `resolveSystemId`, dluh D-NEW-SYS-WORLDSYSTEMID-RAW uzavřen).
