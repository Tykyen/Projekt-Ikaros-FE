# Spec 11.3 — Obchod (Shop) + nákupní vrstva

**Status:** Draft — čeká na schválení
**Rozsah:** FE (stránka Obchod) + **nová BE vrstva** — (a) nákup/storno jako atomická transakce (§5), (b) skupiny jako entita + slevy na skupinu/položku (§5A). Bez tohoto BE rozšíření zadání (nákup → vybavení + odečet z účtu + storno; správa typů/skupin; slevy) nelze splnit bez dluhu.
**Repo:** `Projekt-ikaros-FE` (FE) + `Projekt-ikaros` (BE), pracuje se přímo na `main`
**Velikost:** odhad FE ~10–13 souborů / ~900 ř.; BE ~1 entita + 2 endpointy + service + testy
**Autor:** PJ + Claude
**Datum:** 2026-06-02
**Souvisí:** roadmap-fe.md §11.3; staví na 11.4 (měny), 8.6 (CharacterAccount), CharacterInventory

> **Pozn. k rozsahu roadmapy:** roadmapa 11.3 popisuje jen **katalog** (a QuickNotes). Body „nákup → vybavení + odečet financí + storno" jdou **nad** roadmapu — je to nová transakční vrstva napříč `CampaignShopItem` ↔ `CharacterInventory` ↔ `CharacterAccount`. Tato spec to pokrývá explicitně. **QuickNotes (11.3a) je mimo rozsah této spec** — jiná doména (poznámky), řeší se samostatně.

---

## 1. Cíl

1. **Stránka `/svet/:worldSlug/obchod`** — katalog zboží světa. PJ/PomocnyPJ spravuje položky (CRUD, skupiny, ceny, wiki odkaz, „doporučeno", „často kupováno s"). Každý člen prohlíží, filtruje, řadí, vidí ceny v **své preferované měně** (11.4 převod).
2. **Nákup** — člen (hráč své postavě / PJ kterékoli postavě) koupí položku → atomicky: přibude do **vybavení** postavy + **odečte se z vybraného účtu**. Dialog ukazuje **zůstatek před i po**.
3. **Storno** — nákup lze vrátit: položka zmizí z vybavení, peníze se vrátí na účet. Opřeno o **purchase log** (záznam s referencemi), ne o heuristiku.

---

## 2. Kontext / motivace

- 11.4 dodala měny + sdílené komponenty (`convertAmount`, `<CurrencyDisplay>`, `<CurrencyAmountInput>`, `useUserPreferredCurrency`) **explicitně pro Shop** — teď je konzumujeme.
- 8.6 dodala `CharacterAccount` (multi-account, `adjust`/`undo` endpointy, flag `allowPlayerSelfAdjust`) a `CharacterInventory` (`sections[] → items[]`). Nákup = zápis do obou.
- Bez atomické BE operace hrozí **půlnákup** (item přidán, peníze ne / naopak) a **storno bez kotvy** (nevím co vrátit). Proto BE purchase log — viz §5.

---

## 3. Audit současného stavu

**BE — katalog hotový:**
- `campaign/schemas/campaign-shop-item.schema.ts` — `CampaignShopItem`: `worldId, ownerId, isShared, name, description?, group, subgroup?, price, currencyCode, linkedItemIds[], referenceLink?, isRecommended` + timestamps.
- Endpointy `/campaign/shopitems` (GET list, GET :id, POST, PUT :id, DELETE :id). Role/scope: PJ vidí vše; PomocnyPJ svoje+sdílené; Hráč svoje. `canModify`: PJ vždy / sdílené pro PomocnyPJ / vlastník.
- **Nákup/storno NEEXISTUJE** — nutno doplnit (§5).

**BE — finance/inventory (8.6) hotové:**
- `CharacterAccount` — `balance`, `currency`, `transactions[]`, endpointy `POST /worlds/:worldId/accounts/:id/adjust` (delta ±), `.../undo`, `allowPlayerSelfAdjust`.
- `CharacterInventory` — `sections[] → items[] {id, text, quantity?, note?}`, `PATCH /worlds/:worldId/characters/:slug/inventory` (přepis `sections`).

**FE — stub:**
- `src/features/world/pages/ShopPage.tsx`: `return <WorldStubPage area="shop" />`.
- Route `obchod` (memberOnly), nav položka existuje.
- Měnové komponenty: `src/features/world/currencies/shared/`.
- Finance/inventory hooky: `useCharacterAccounts.ts`, `useCharacterInventory`, `useUpdateCharacterInventory`.

---

## 4. Návrh řešení — FE stránka Obchod

### 4.0 Vizuál / design (frontend-design audit)
- **Princip: konzistence, ne revoluce.** Obchod je world stránka vedle Pavučiny / Měn / Storyboardu — sdílí jejich vizuální jazyk. Žádné nové fonty/barvy, vše přes existující **design tokeny** (`--bg-secondary`, `--border`, `--radius-lg`, `--accent`, `--surface-*`, `--font-display`, `--sp-*`, `--text-*`). ⚠️ Theme isolation: žádné globální/shared CSS edity, jen page-local `*.module.css`.
- **Reuse patternů:** `.section` karta, header flex space-between, badge (`--radius-full`, uppercase, letter-spacing — vzor `readonlyBadge`), responsivní tabulka→karty ≤600px, `font-display` title (vzor `campaign.module.css`, `CurrenciesListSection.module.css`).
- **Vlastní charakter Obchodu** (v rámci tokenů): zboží jako **mřížka karet** (`grid auto-fill`, ne tabulka — obchod je vizuální), cena velká v `--accent`; sleva = přeškrtnutá původní cena (`--text-secondary`, line-through) + badge „−20 %"; **👛 peněženka** = výrazný accent chip v headeru, na mobilu sticky.

### 4.1 IA — jedna stránka, tři vrstvy

```
┌──────────────────────────────────────────────────────┐
│  Obchod světa   👛 Aragorn: 40 ZL   [moje ▾] [+ Pol.] │  ← header: peněženka + scope + PJ akce
│                 (PJ: [nakupuji pro: Aragorn ▾])        │  ← PJ volí cílovou postavu; hráč = jeho postava (zámek)
├──────────────┬───────────────────────────────────────┤
│  Filtry      │  Mřížka / seznam položek               │
│  · hledání   │  ┌────────┐ ┌────────┐                 │
│  · skupina   │  │ ⭐ Meč  │ │ Lano   │  …              │
│  · měna ▾    │  │ 12 ZL  │ │ 2 ZL   │                 │
│  · řazení ▾  │  └────────┘ └────────┘                 │
│              │  [🛒 Moje nákupy]  ← panel/záložka, storno│
└──────────────┴───────────────────────────────────────┘
```

- **Peněženka v headeru** (👛) — trvale ukazuje zůstatek **cílové postavy** v její měně (víc účtů → souhrn / rozklik). **Hráč** vidí svou postavu, **PJ** vidí postavu, kterou si vybral v „nakupuji pro". Tím obě role vidí stav před nákupem bez otevírání dialogu.
- **„Nakupuji pro" ▾** (jen PJ/PomocnyPJ) — výběr cílové postavy světa, pro kterou se nakupuje a jejíž peněženka/nákupy se zobrazují. Hráč tuto volbu nemá (zamčeno na jeho postavu).
- **Scope přepínač** (moje / sdílené / vše) řídí FE partitioning dle `ownerId`+`isShared` (vzor 11.1e). PJ vidí vše.
- **Měna ▾** = `useUserPreferredCurrency` — přepočítá ceny všech položek přes `convertAmount` (preview, bez BE round-tripu). Tooltip s originální měnou (`<CurrencyDisplay convertTo>`).
- **Karta položky:** název, „⭐ doporučeno" badge, cena (v preferované měně), skupina/podskupina, ikona wiki odkazu (`referenceLink`), „🛒 Koupit".
- **Detail položky** (modal/expand): description, `referenceLink` (otevře wiki/stránku), „často kupováno s" (`linkedItemIds` → klikací odkazy na položky).

### 4.2 Správa položek a skupin (PJ/PomocnyPJ)
- **Položka** — „+ Položka" / edit modal: name, description, **skupina = výběr z `CampaignShopGroup`** (existující + „nová skupina" inline), volitelně podskupina, **cena = `<CurrencyAmountInput>`** (částka + měna), **sleva % (volitelná)**, referenceLink (PagePicker — §4.3), isRecommended, isShared, „často kupováno s" (multi-select položek).
- **Skupiny / typy** — samostatná správa (panel „Spravovat typy" / sekce): CRUD `CampaignShopGroup` (name, parentId pro podskupinu, order, **sleva % na celou skupinu**). Viz §5A.
- Mazání: `ConfirmDialog`. ⚠️ mazání skupiny s položkami → blok nebo přesun položek (viz §5A.3). Role gate dle BE `canModify`.

### 4.3 referenceLink (překlik na stránku světa — reuse wiki linků)
- **Reuse hotové `PagePicker`** (`PageEditor/components/PagePicker.tsx`) + `usePagesDirectory(worldId)` — stejný mechanismus jako `[[wikilink]]` v editoru stránek. Uživatel vyhledá stránku světa (zbraň, vybavení, lokaci…) podle názvu, uloží se **slug** (ne URL).
- Render na kartě/detailu: `<Link to={/svet/:worldSlug/:referenceLink}>📖 Více info</Link>` (stejně jako `SubjectDetail`). Podporuje i „pending" odkaz na zatím neexistující stránku (chování PagePickeru).
- 💡 Nulová nová BE práce — `referenceLink` string už na entitě je, jen FE napojí existující picker.

### 4.4 Cena v měně + sleva (11.3c)
- **Efektivní cena** = `price × (1 − efektivníSleva/100)`. Efektivní sleva = `item.discountPercent ?? group.discountPercent ?? 0` (**položka přebíjí skupinu**, nesčítá se — §5A.2).
- Zobrazení přes `<CurrencyDisplay amount={efektivní} currencyCode items convertTo={preferred}>`. Při slevě ukázat **původní cenu přeškrtnutě** + slevu (badge „−20 %").
- Řazení „dle ceny" podle **efektivní převedené** hodnoty na base měnu (`convertAmount`), ne raw `price`. ⚠️ položka s `currencyCode` mimo seznam měn → fallback: zobraz raw + původní kód, do řazení na konec.

---

## 5A. Návrh řešení — Skupiny (typy) + slevy (NOVÁ BE entita)

### 5A.1 Entita `CampaignShopGroup`
PJ/PomocnyPJ vytváří „typy věcí" (skupiny) a podskupiny jako spravovatelné záznamy — drží i slevu. Collection `campaign_shop_groups`.
```
CampaignShopGroup {
  id
  worldId
  ownerId               // scope jako u položek (moje/sdílené/vše)
  isShared
  name
  parentId              // null = top skupina; jinak podskupina (2 úrovně, ne víc)
  order                 // řazení v UI
  discountPercent       // 0–100, sleva na celou skupinu (default 0 = bez slevy)
  createdAt, updatedAt
}
```
- **Položka mění `group`/`subgroup` (stringy) → `groupId` (ref) + volitelný `subgroupId`.** Shop je zatím prázdný stub → žádná migrace dat. Pokud bude na BE potřeba zpětná kompatibilita, denormalizovaný `groupName` snapshot na položce je možný (rozhodnout při BE impl.).

### 5A.2 Slevy — pravidla
- `discountPercent` je **na skupině i na položce**, vždy procenta (0–100). 🔀 Procenta, ne absolutní částka — absolutní by se vázala na měnu a rozbila při převodu.
- **Skládání:** `efektivníSleva = item.discountPercent ?? group.discountPercent ?? 0` — **položka přebíjí skupinu, nesčítá se.** (Podskupina: pokud má vlastní `discountPercent`, přebíjí top skupinu; pořadí specificity item > subgroup > group.)
- ⚠️ Validace 0–100 na BE i FE. `null`/`undefined`/0 = bez slevy.

### 5A.3 Endpointy skupin
- `GET /campaign/shopgroups` (scope dle role), `POST`, `PUT /:id`, `DELETE /:id`. Role gate jako položky (`canModify`).
- **Mazání skupiny s položkami:** BE vrátí `409` se seznamem dotčených → FE nabídne „přesunout položky do … / zrušit". (MVP: blokovat mazání neprázdné skupiny + hláška.)

### 5A.4 FE správa skupin
- Panel „Spravovat typy" (modal/drawer, jen PJ/PomocnyPJ): strom skupina → podskupiny, inline přidat/přejmenovat/řadit, pole sleva %. Vzor: `SectionListEditor` (CRUD + reorder ▲▼) z inventáře.

---

## 5. Návrh řešení — BE nákupní vrstva (NOVÁ)

### 5.1 Entita `CampaignPurchase` (purchase log)
Kotva pro storno + audit. Collection `campaign_purchases`.
```
CampaignPurchase {
  id
  worldId
  characterId            // komu koupeno
  buyerUserId            // kdo provedl (audit: hráč/PJ)
  shopItemId             // odkaz na CampaignShopItem (může být později smazán)
  itemSnapshot           // { name, groupName?, subgroupName?, unitPrice, currencyCode, discountPercent, referenceLink? } — odolné vůči smazání položky/skupiny
  quantity               // libovolné ≥1 (po jednom i velké množství)
  // ceny (audit):
  unitPriceOriginal      // cena/ks před slevou (v currencyCode položky)
  discountPercent        // efektivní sleva uplatněná při nákupu
  // kotvy pro storno:
  accountId              // z kterého účtu placeno
  accountTransactionId   // id transakce v CharacterAccount.transactions (z adjust)
  paidAmount             // skutečně odečteno (v měně účtu, po slevě × quantity, po převodu)
  paidCurrency           // měna účtu
  inventorySectionId     // sekce ve vybavení
  inventoryItemId        // id přidané položky v inventáři
  status                 // 'active' | 'refunded'
  createdAt, refundedAt?
}
```
💡 **itemSnapshot:** kdyby PJ položku z katalogu smazal, historie nákupů i storno musí přežít — proto snapshot, ne jen ref.

### 5.2 Endpoint `POST /campaign/shopitems/:id/purchase`
Body: `{ characterId, accountId, quantity?, sectionId? }`.
Atomicky (jedna service metoda, v ideálu Mongo session/transaction):
1. Načti item (+ jeho skupinu kvůli slevě), postavu, účet. Ověř, že účet patří postavě.
2. **Spočti efektivní slevu** (`item.discountPercent ?? group.discountPercent ?? 0`), **efektivní cenu/ks** = `price × (1−sleva/100)`, **převeď** do měny účtu (`fromRate/toRate`), `paidAmount = converted × quantity`. ⚠️ slevu i převod počítat na BE (FE číslo je jen náhled — autorita je BE).
3. **Kontrola zůstatku:** pokud `account.balance < paidAmount` a hráč nemá debet povolen → `409 Conflict` (FE blokuje už dřív, BE je pojistka).
4. **Odečti z účtu** (adjust delta `-paidAmount`, description „Nákup: {name}") → vznikne `accountTransactionId`.
5. **Přidej do vybavení** — do `sectionId` (nebo auto-sekce „Nakoupeno z obchodu", vytvoř pokud chybí). Item text = `name` (+ qty). Vznikne `inventoryItemId`.
6. Zapiš `CampaignPurchase` se všemi kotvami, `status:'active'`.
7. Vrať `{ purchase, newBalance }`.
- Při selhání kroku 4/5 → rollback (session) nebo kompenzace; nikdy nezůstat v půlstavu.

**Role gate:**
- Hráč: smí kupovat **jen své** postavě **a jen** když `account.allowPlayerSelfAdjust` (jinak `403` + FE nabídne „požádat PJ"). Ověř ownership postavy přes membership.
- PJ/PomocnyPJ: kterékoli postavě.

### 5.3 Endpoint `POST /campaign/purchases/:id/refund`
1. Načti purchase (`status:'active'`).
2. **Vrať peníze** na `accountId` (adjust `+paidAmount`, description „Storno: {name}").
3. **Odeber položku** z vybavení dle `inventorySectionId`+`inventoryItemId` (pokud ji hráč mezitím nesmazal → tolerantně přeskoč, peníze vrať tak jako tak; ⚠️ zaznamenej do dluhu jako edge-case).
4. `status:'refunded'`, `refundedAt`.
- Role gate stejný jako purchase (hráč jen své+self-adjust, PJ vše).

### 5.4 GET historie
- `GET /campaign/purchases?characterId=` — list nákupů postavy (pro „Moje nákupy" + storno tlačítka). Scope: hráč své, PJ vše.

---

## 6. Nákupní UX (FE)

### 6.1 Dialog „Koupit {název}"
```
┌────────────────────────────────┐
│  Koupit: Dlouhý meč            │
│  Cena: 1̶5̶ → 12 ZL  (−20 %)     │  ← přeškrtnutá orig. cena při slevě
│  Pro: Aragorn                  │  ← převzato z headeru „nakupuji pro" (ne výběr zde)
│  Platit z účtu: [Osobní 40 ZL ▾]│
│  Množství: [1]  ⊖ ⊕            │  ← libovolné ≥1 (po jednom i velké množství)
│  ─────────────────────────────│
│  Celkem:    12 ZL × 3 = 36 ZL  │
│  Zůstatek:  40 ZL → 4 ZL       │  ← PŘED → PO (živě, červeně když < 0)
│  (cena převedena z … na měnu účtu)│
│         [Zrušit] [Koupit]      │
└────────────────────────────────┘
```
- **Účet ▾** = účty postavy (`useCharacterAccounts`) + zůstatky. Efektivní cena (po slevě) se převede do měny účtu (`convertAmount`).
- **Množství** libovolné ≥1 (stepper ⊖⊕ + ruční vstup pro velké počty). Celková cena = efektivní cena × množství.
- **Zůstatek před → po** se přepočítá živě dle množství i zvoleného účtu. Záporný výsledek = červeně + „Koupit" disabled, pokud postava nemá debet (a u hráče bez `allowPlayerSelfAdjust` rovnou hláška „požádej PJ").
- Po úspěchu: toast „Koupeno, přidáno do vybavení", invalidace inventory+accounts queries.

### 6.2 „Moje nákupy" / storno — **jen na stránce Obchod**
- Panel/záložka „🛒 Moje nákupy" na stránce Obchod: seznam nákupů **cílové postavy** (`GET /campaign/purchases?characterId=`), u každého „↩ Vrátit" → `ConfirmDialog` → refund endpoint.
- Hráč = nákupy své postavy; PJ = nákupy postavy zvolené v „nakupuji pro". **Obchod není v deníku postavy** — veškerý nákup i storno žije zde.

### 6.3 Vstupní body (kdo odkud) — vše na stránce Obchod
- **Hráč:** cíl = jeho postava (zamčeno), nákup jen z účtu s `allowPlayerSelfAdjust`.
- **PJ/PomocnyPJ:** zvolí cílovou postavu v headeru („nakupuji pro" ▾) → peněženka, nákup i nákupní historie/storno se přepnou na ni. Stejná komponenta dialogu, jen předvyplněná postava.

---

## 7. Role a viditelnost (souhrn)

| Akce | Hráč | PomocnyPJ | PJ |
|------|------|-----------|-----|
| Prohlížet katalog | ✅ (svoje+sdílené) | ✅ svoje+sdílené | ✅ vše |
| CRUD položek | ❌ | ✅ svoje+sdílené | ✅ vše |
| CRUD skupin/typů + slevy | ❌ | ✅ svoje+sdílené | ✅ vše |
| Koupit sobě | ✅ jen účet s `allowPlayerSelfAdjust` | ✅ | ✅ |
| Koupit jiné postavě | ❌ | ✅ | ✅ |
| Storno | ✅ vlastní nákup (self-adjust) | ✅ | ✅ vše |

---

## 8. Rozhodnutí (uzavřeno)

- **Obchod = samostatná stránka**, NE v deníku postavy. Nákup i storno žijí jen tady.
- **PJ volí cílovou postavu** v headeru („nakupuji pro" ▾); hráč zamčen na svou.
- **Peněženka v headeru** — zůstatek cílové postavy viditelný trvale pro hráče i PJ (§4.1).
- Množství libovolné ≥1 (§6.1) · referenceLink = PagePicker / wiki link (§4.3) · skupiny jako entita + slevy % (§5A).

---

## 9. Mimo rozsah

- **QuickNotes (11.3a)** — samostatná spec/krok.
- Sleva/akce, sklad/omezené množství kusů na světě, nákup více položek najednou (košík), historie cen, směna mezi postavami.
- Drag přesun koupené položky mezi sekcemi vybavení (funguje stávající inventory editor — ne nová práce).

---

## 10. Plán dílčích kroků (po schválení → impl. plán)

- **11.3-N0 — BE skupiny + slevy:** `CampaignShopGroup` entita + CRUD endpointy; položka `group/subgroup` → `groupId/subgroupId`; `discountPercent` na skupině i položce + testy.
- **11.3b — Katalog FE:** stránka, scope, karty, CRUD modal položek, správa skupin/typů (§5A.4), referenceLink (PagePicker), detail, filtry/řazení, cena v měně + sleva.
- **11.3-N1 — BE nákupní vrstva:** `CampaignPurchase` entita + purchase/refund/list endpointy + service (atomicita, sleva, převod) + testy.
- **11.3-N2 — Nákupní UX FE:** dialog (sleva, množství, zůstatek před→po), hooky, integrace inventory+accounts invalidace.
- **11.3-N3 — Storno UX FE:** seznam nákupů + refund, vstupní body hráč/PJ.
- **11.3d — `mobil-desktop` audit + `napoveda`.**

⚠️ **Pořadí:** N0 a N1 jsou BE, jdou před FE konzumenty. Dle pravidla nemíchat BE+FE v paralelní dávce — BE kroky sekvenčně před FE.

---

## 11. Rizika

- ⚠️ **Atomicita bez Mongo transakce:** pokud replica set nepodporuje session, nutná kompenzační logika (rollback po kroku). Ověřit při BE impl.
- ⚠️ **Drift inventory:** hráč ručně smaže koupenou položku z vybavení → storno ji nenajde. Řešení: tolerantní refund (peníze vrátí vždy), edge-case do dluhů.
- ⚠️ **Smazaná položka katalogu** po nákupu → řeší `itemSnapshot`.
- ⚠️ **Mix BE+FE:** dle pravidla nemíchat BE+FE v jedné paralelní dávce — kroky N1 (BE) a N2/N3 (FE) jdou sekvenčně.
