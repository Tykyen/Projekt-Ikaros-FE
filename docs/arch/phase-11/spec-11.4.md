# Spec 11.4 — Měny a převodník

**Status:** Draft — čeká na schválení
**Rozsah:** FE + **minimální BE patch** (rozšíření role gate v `world-currencies.service.ts` o PomocnyPJ pro edit existujících měn — viz §4.8b)
**Repo:** `Projekt-ikaros-FE`, větev: pracuje se přímo na `main`
**Velikost:** odhad ~12 souborů / ~600 ř.
**Autor:** PJ + Claude
**Datum:** 2026-05-26
**Souvisí:** roadmap-fe.md §11.4, plánuje 11.3c (cena v měně pro Shop) a 8.x (CharacterFinance.currency)

---

## 1. Cíl

Dva propojené výstupy:

1. **Stránka `/svet/:worldSlug/prevodnik-men`** — každému členovi světa rychlý převodník + PJ+ dostává správu měn (CRUD code/name/symbol/rate). První měna je vždy **základ** (rate = 1.0), ostatní kurzy jsou relativní.
2. **Sdílená currency infrastruktura** (`src/features/world/currencies/shared/`) — utily a komponenty navržené tak, aby je v budoucnu konzumovaly **Shop (11.3c)**, **Character finance / účty postav (8.x)**, **inventory / trade** a jakékoli další místo, kde se zobrazí cena nebo částka. Konkrétně: `convertAmount` util, `<CurrencyDisplay>`, `<CurrencyAmountInput>`, `<CurrencySelect>` komponenty, `useUserPreferredCurrency(worldId)` hook + atom. V 11.4 je zapojí jen samotná stránka — ostatní callsite přijdou ve fázích 11.3, 8.x a dál.

---

## 2. Kontext / motivace

- Roadmapa Fáze 11 doporučuje 11.4 jako první — Shop (11.3c) i další konzumenti potřebují měny.
- BE už při vzniku světa seeduje měny dle žánru (`fantasy/cyber/space/postapo/default`) — uživatelská hodnota je zablokovaná za FE.
- Uživatel chce 11.4 hotové, aby mohl ověřit/aplikovat svůj plán pro další kampaňové nástroje (11.1–11.3).
- **Klíčový insight z Matrix auditu:** převodník není „samostatná stránka", ale **napříč-platformový nástroj**. V Matrixu se `CurrencyConverter` reuse-uje, shop má `getConvertedPrice()` inline, character editor má dropdown měn účtu, finance viewer rezolvuje symboly. Pokud postavíme jen page-local kód, budeme každý další konzument psát znovu od nuly.
- Když to neuděláme správně: stránka zůstane stubem; **horší případ:** uděláme stránku jen monoliticky a v 11.3c / 8.x budeme refaktorovat na sdílené primitivy = 2× práce.

---

## 3. Audit současného stavu

**BE — kompletní:**
- `backend/src/modules/world-currencies/`
  - Schema (`world-currencies.schema.ts:8–21`): `worldId` (unique), `items: WorldCurrencyItem[]`, `updatedAt`
  - Item: `{ id, code, name, symbol, rate (≥0.0001) }`
  - Endpoint `GET /worlds/:worldId/currencies` — JWT, member-only, vrací `{ items: [...] }` nebo prázdné
  - Endpoint `PUT /worlds/:worldId/currencies` — JWT, **PJ+ only**, **přepisuje celý array** (UUID auto-assign u nových)
  - Endpoint `POST /worlds/:worldId/currencies/convert` — JWT, member-only, body `{ amount, from, to }`, vrací `{ amount, from, to, result }`, math: `Math.round((amount * fromRate/toRate) * 10000) / 10000`
  - Seed: `seedForWorld(worldId, genre)` při `WorldsService.createWorld`
- Testy: 11 unit (member/PJ check, convert math, seed varianty, UUID assign)

**FE — stub:**
- `src/features/world/pages/CurrencyPage.tsx`: `return <WorldStubPage area="currency" />`
- Route `src/app/router.tsx:262`: `{ path: 'prevodnik-men', element: memberOnly(p(CurrencyPage)) }`
- Nav `worldNavConfig.ts:67–71`: položka `prevodnik-men` ve skupině `hra`, skrytelná přes `hiddenNavItems`
- Žádné existující hooky / komponenty pro currencies ve FE

**Reuse vzory (Projekt Ikaros):**
- `EventsPage` (9.1-I) — `useWorldContext`, role guard přes `viewerRole >= WorldRole.PomocnyPJ`, modal/list pattern
- `WorldEmotesAdminPage` (6.4c) — admin CRUD s dialogy
- `KebabMenu` (1.8), `ConfirmDialog` (1.8) — sdílené primitivy pro řádkové akce
- `EditCard` (1.3a) — Upravit/Uložit/Zrušit pattern

**Matrix reference (funkční vzor, ne vizuál):**
- `Matrix/frontend/src/pages/World/WorldCurrency.tsx` (118 ř.) — page-level wrapper, deleguje na sdílený `CurrencyConverter`
- `Matrix/frontend/src/pages/World/WorldCurrenciesAdmin.tsx` (425 ř.) — PJ admin: tabulka + inline form, kurz se zadává relativně („1 NOVÁ = X REF"), code autogenerován z názvu
- `Matrix/frontend/src/pages/CurrencyConverter.tsx` (174 ř.) — **sdílená komponenta** s props `customCurrencies`; logika `(amount * fromRate) / toRate`
- `Matrix/frontend/src/pages/World/WorldShop.tsx:86–94` — `getConvertedPrice(price, fromCode, toCode, currencies)`, hráč si vybere `userCurrencyCode`, všechny ceny se převedou
- `Matrix/frontend/src/components/editor/AccountPanel.tsx:149–167` — dropdown měn účtu v character editoru (world currencies → fallback global)
- `Matrix/frontend/src/components/finance/FinanceViewer.tsx` — rezoluce symbolu měny pro zobrazení stavu účtu
- `Matrix/frontend/src/entities.ts:268–288` — interface `Currency { id, code, name, symbol, rate }` + 11 globálních fallback měn

**Klíčový poznatek z Matrix:** sdílený `CurrencyConverter` + `getConvertedPrice` util byl použit na 4 různých místech (page, shop, account editor, finance viewer). My budeme mít stejnou potřebu — proto sdílená infrastruktura už v 11.4.

---

## 4. Návrh řešení

### 4.1 IA — jedna stránka, dvě sekce stackem

**Cílový layout (desktop):**
```
┌─────────────────────────────────────────────┐
│ ⇄  PŘEVODNÍK MĚN                            │ ← H1 = název stránky
├─────────────────────────────────────────────┤
│  ┌── Převodník ──────────────────────────┐  │
│  │  [100]      [ZL ▼]                    │  │
│  │       ⇅ swap                          │  │  ← „rychlá kalkulačka", vždy nahoře
│  │  [1000]     [ST ▼]    výsledek        │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  ┌── Měny ve světě  (PJ+: ✎ Upravit) ──┐  │  ← Hráč: read-only seznam
│  │  ⚓ ZL  Zlatý        1.0     [—]      │  │
│  │     ST  Stříbrný    0.1     [⋯]      │  │
│  │     MD  Měďák       0.01    [⋯]      │  │
│  │                     [+ Přidat měnu]   │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

**Rozhodnutí:** **stacked sekce, ne taby**. Důvod: 2 sekce, převodník je primární use case pro hráče, správa je sekundární pro PJ — stack = jednodušší IA, vidíš obojí naráz. Taby by skrývaly převodník hráči, který kliknul z reflexu na „Spravovat".

### 4.2 Sekce „Převodník" (pro všechny členy)

- 2 řádky: `[amount] [from-select]` → `[result] [to-select]` se swap tlačítkem mezi nimi
- Live recalc on input change (debounced 250 ms → POST `/convert`)
- Optimistic FE calc (klientská math s rate z `useWorldCurrencies` cache) zobrazí instant, BE odpověď ji nahradí (pro konzistenci se serverovým roundingem)
- Default při mountu: `from = base currency`, `to = první ne-base měna` (nebo prázdné, pokud jen 1 měna existuje)
- Swap tlačítko vymění from/to (amount zůstává)
- Result formátování: 4 desetinná místa, ale trailing zeros se ořežou (`100.0000` → `100`, `12.5000` → `12.5`, `0.0042` → `0.0042`)
- Edge case: `from === to` → result = amount, žádné volání BE
- Edge case: pouze 1 měna ve světě → sekce skrytá, místo ní hláška „Tento svět má jen 1 měnu — převodník není potřeba"
- Edge case: 0 měn → sekce skrytá

### 4.3 Sekce „Měny ve světě"

**Hráč (Hrac / WorldRole 1):**
- Read-only tabulka: code, name, symbol, rate, badge `základ` u base currency
- Žádné akce, žádné `+ Přidat`, žádné `⋯` menu

**PJ+ (PomocnyPJ / PJ / Admin / Superadmin):**
- Stejná tabulka + kebab menu `⋯` na každém řádku (Upravit / Smazat)
- Smazat **disabled** u base currency (tooltip „Základní měnu nelze smazat — nejprve nastav jinou jako základ")
- Tlačítko `+ Přidat měnu` pod tabulkou → otevře `CurrencyFormModal`
- Klik na řádek (mimo kebab) → otevře `CurrencyFormModal` v edit módu
- **Změna base** = drag-and-drop / reorder → **OUT OF SCOPE** (viz §5). V této spec base = první v seznamu, řazení dle BE pořadí. Změna base se řeší tlačítkem `Nastavit jako základ` v kebab menu u ne-base měn → toto pole UI je in scope, BE volání = klient přepíše rate na 1.0 a starý base dostane rate odpovídající poměru.

### 4.4 `CurrencyFormModal` (Přidat / Upravit jednu měnu)

**Pole:**
| Pole | Typ | Validace | Poznámka |
|---|---|---|---|
| `code` | text | required, 1–8 znaků, A-Z 0-9, unique ve světě | auto-uppercase při zápisu |
| `name` | text | required, max 40 znaků | „Zlatý", „Credit"… |
| `symbol` | text | optional, max 8 znaků | „⚜", „$", „₿", prázdné = používá se `code` |
| `rate` | number | required, > 0, step 0.0001, max 1 000 000 | u base disabled = 1.0 |

**Behavior:**
- Při edit base currency: `rate` field disabled + helper text „Základní měna má vždy kurz 1.0"
- Save = klient sestaví **kompletní nový items array** (modifikuje cíleně 1 položku) a pošle PUT (BE je full-replace)
- Optimistic update v TanStack Query cache
- 409 / duplicate code → inline error u `code` pole
- Modal používá existující `<Modal>` primitive

### 4.5 Smazání měny (ConfirmDialog)

- Klik na `⋯ → Smazat` → `<ConfirmDialog>` „Opravdu smazat měnu '{name} ({code})'? Tato akce ovlivní všechny obchody / postavy, které tuto měnu používají."
- Po potvrzení: klient odstraní item z arraye a PUT-uje zbytek
- Žádný cascade check ve FE (BE nemá referential integrity proti shop/character — to se vyřeší v 11.3 / 8.x; spec 11.4 toto nehlídá)

### 4.6 „Nastavit jako základ" flow

- Kebab → `Nastavit jako základ` (jen u ne-base měn)
- Spočítá nové kurzy: `newBase = currentBase * (1 / chosenCurrencyRate)`, všechny ostatní `x.rate = x.rate / chosenCurrencyRate`, chosen.rate = 1.0
- Modal s preview „Nové kurzy budou: ZL=10, ST=1, MD=0.1 → Pokračovat?"
- PUT celého nového arraye

**Matematika příklad:** dnes ZL=1, ST=0.1, MD=0.01. Hráč rozhodne ST = base.
- ST = 0.1 → faktor `1/0.1 = 10`
- nový rate: ZL = 1×10 = 10, ST = 0.1×10 = 1, MD = 0.01×10 = 0.1
- ✓ matematicky ekvivalentní (poměry zachovány: 1 ZL = 10 ST = 100 MD jak před, tak po)

### 4.7 Hooky a state (page-local)

**`src/features/world/currencies/`:**
- `api.ts` — `useWorldCurrencies(worldId)` (GET, 5min cache), `useUpdateCurrencies(worldId)` (PUT mutation s optimistic), `useConvertMutation(worldId)` (POST convert)
- `types.ts` — `WorldCurrencyItem`, `ConvertRequest`, `ConvertResult` (sjednoceno s BE DTO; pokud BE generuje TS typy, použít je — jinak ručně sync)
- `utils/setAsBase.ts` — výpočet pro 4.6 (přepočet kurzů při změně base)
- `validation.ts` — zod schemas pro `CurrencyFormModal`

**Komponenty stránky `src/features/world/currencies/components/`:**
- `ConverterSection.tsx` — sekce 4.2 (orchestruje sdílený `<CurrencyAmountInput>` + swap + result)
- `CurrenciesListSection.tsx` — sekce 4.3
- `CurrencyRow.tsx` — řádek (read-only / s kebab)
- `CurrencyFormModal.tsx` — 4.4
- `SetAsBaseModal.tsx` — 4.6 preview + confirm
- `index.ts` — re-exports

**Stránka:** `src/features/world/pages/CurrencyPage.tsx` přepsaná z stubu na orchestrátor.

### 4.7b Sdílená currency infrastruktura — **klíčová sekce**

**Cíl:** budoucí konzumenti (Shop 11.3c, Character finance 8.x, inventory, trade, …) sáhnou po hotových primitivách místo přepisování logiky. Žije v `src/features/world/currencies/shared/` s čistým export barrelem.

#### Util `convertAmount.ts`

```ts
// src/features/world/currencies/shared/convertAmount.ts
export function convertAmount(
  amount: number,
  fromCode: string,
  toCode: string,
  items: WorldCurrencyItem[],
): number | null {
  if (fromCode === toCode) return amount;
  const from = items.find(i => i.code === fromCode);
  const to = items.find(i => i.code === toCode);
  if (!from || !to) return null;
  // BE math: result = round((amount * fromRate / toRate) * 10000) / 10000
  return Math.round((amount * from.rate / to.rate) * 10000) / 10000;
}

export function formatAmount(amount: number, opts?: { maxDecimals?: number }): string {
  const max = opts?.maxDecimals ?? 4;
  // ořeže trailing zeros, max N decimals, cs-CZ separátor
  return new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: max }).format(amount);
}

export function formatCurrency(
  amount: number,
  code: string,
  items: WorldCurrencyItem[],
): string {
  const cur = items.find(i => i.code === code);
  const sym = cur?.symbol || code;
  return `${formatAmount(amount)} ${sym}`;
}
```

Pure functions, žádný React. Klient-side mirror BE matematiky → instant optimistic UI bez round-tripu.

#### Hook `useUserPreferredCurrency(worldId)`

**Per-world hráčova preferovaná měna** pro zobrazení cen v jeho oblíbené měně napříč shopem / financemi.

```ts
// src/features/world/currencies/shared/useUserPreferredCurrency.ts
// Jotai atomFamily, persisted v localStorage pod klíčem `ikaros.currency.preferred.<worldId>`
// Default = base currency (první item), pokud uložená preference není v aktuálním items seznamu, fallback na base
const userPreferredCurrencyAtomFamily = atomFamily((worldId: string) =>
  atomWithStorage<string | null>(`ikaros.currency.preferred.${worldId}`, null),
);

export function useUserPreferredCurrency(worldId: string): {
  preferredCode: string | null;
  setPreferred: (code: string) => void;
  resolvedCode: string; // vždy resolved (base fallback)
  resolvedItem: WorldCurrencyItem | null;
}
```

Konzument (Shop / Finance): „vidím cenu 100 ZL v shopu, hráč preferuje ST → `convertAmount(100, 'ZL', preferredCode, items)` = 1000 ST".

#### Komponenta `<CurrencySelect>`

```tsx
<CurrencySelect
  value={code}
  onChange={(code) => …}
  items={currencies}
  showSymbol  // default true
  filterBy?: (item) => boolean  // např. pro „jen měny tohoto světa, ne globální"
/>
```

Single-place styling pro výběr měny — reuse v: stránce převodníku (4.2), `AccountPanel` 8.x (měna účtu), shopu 11.3c (user preference switcher), `CurrencyAmountInput` interně.

#### Komponenta `<CurrencyDisplay>`

Read-only zobrazení: `{amount} {symbol}` s tooltipem `({amount v base} {base.symbol})`.

```tsx
<CurrencyDisplay amount={100} currencyCode="ZL" items={currencies} />
// renderuje: "100 ⚜" + tooltip "= 100 ⚜ (základ)"

<CurrencyDisplay amount={100} currencyCode="ZL" items={currencies} convertTo="ST" />
// renderuje: "1000 ◐" + tooltip "= 100 ⚜"
```

Konzument: Shop 11.3c zabalí každou cenu, Finance viewer 8.x zobrazí stav účtu, dashboardy.

#### Komponenta `<CurrencyAmountInput>`

Kombo `<NumberInput> + <CurrencySelect>` v jednom — používáno v převodníku (4.2) i jinde (např. „částka transakce" v 8.x finance).

```tsx
<CurrencyAmountInput
  amount={amount}
  currencyCode={code}
  onAmountChange={setAmount}
  onCurrencyChange={setCode}
  items={currencies}
/>
```

#### Barrel export

```ts
// src/features/world/currencies/shared/index.ts
export { convertAmount, formatAmount, formatCurrency } from './convertAmount';
export { useUserPreferredCurrency } from './useUserPreferredCurrency';
export { CurrencySelect } from './CurrencySelect';
export { CurrencyDisplay } from './CurrencyDisplay';
export { CurrencyAmountInput } from './CurrencyAmountInput';
export type { WorldCurrencyItem } from '../types';
```

Konzumenti (11.3c, 8.x, …) importují **jen z `@/features/world/currencies/shared`** — žádné hluboké importy do interního API stránky.

### 4.7c Datový zdroj pro sdílené komponenty

Všechny shared komponenty dostávají `items: WorldCurrencyItem[]` přes props (ne přes globální state) — důvod: konzument může chtít převádět i offline data / mock / preview, a komponenta zůstává čistá. Konzument typicky napojí na `useWorldCurrencies(worldId)`:

```tsx
const { data: currencies = [] } = useWorldCurrencies(worldId);
<CurrencyDisplay amount={price} currencyCode={item.currencyCode} items={currencies} />
```

`useWorldCurrencies` má 5min cache → většina volání bude cache-hit, žádný perf problém.

### 4.8 Role gate FE

Tři úrovně:

| Akce | Hráč (Hrac=2 / Ctenar=1) | PomocnyPJ (4) | PJ (5) / Admin / Super |
|---|:---:|:---:|:---:|
| Číst seznam měn | ✅ | ✅ | ✅ |
| Použít převodník | ✅ | ✅ | ✅ |
| Upravit existující měnu (rate / name / symbol) | ❌ | ✅ | ✅ |
| „Nastavit jako základ" (mass rate edit, sada kódů beze změny) | ❌ | ✅ | ✅ |
| Přidat novou měnu | ❌ | ❌ | ✅ |
| Smazat měnu | ❌ | ❌ | ✅ |

**FE checks (UI hiding):**
- `canEditExisting = userRole >= WorldRole.PomocnyPJ` (PomocnyPJ=4) — kebab „Upravit", „Nastavit jako základ"
- `canAddOrDelete = userRole >= WorldRole.PJ` (PJ=5) — tlačítko „+ Přidat měnu", kebab „Smazat"
- Globální Admin/Superadmin bypass řeší BE (FE neví o globální roli v `useWorldContext`)
- BE je autoritativní (403 pro neoprávněné). FE checks jen pro UI hiding (žádný „skrytý cheat").

### 4.8b BE patch — role gate pro PomocnyPJ

**Problém:** Dnes [world-currencies.service.ts:164–184](file:///c:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/world-currencies/world-currencies.service.ts#L164) má jediný `assertCanAdmin`, který vyžaduje `WorldRole.PJ` (5). PomocnyPJ dostane 403 i kdyby jen měnil rate.

**Patch:**

1. **Nová funkce** `isMetadataOnlyEdit(oldItems, newItems): boolean` — vrací `true` pokud sada `code` v obou je identická (jen edit existujících), `false` pokud add/delete.

2. **`updateCurrencies` flow:**
   ```ts
   async updateCurrencies(worldId, newItems, requester) {
     const current = (await this.repo.findByWorldId(worldId))?.items ?? [];
     const metadataOnly = this.isMetadataOnlyEdit(current, newItems);
     if (metadataOnly) {
       await this.assertCanEdit(worldId, requester); // PomocnyPJ+ nebo Admin/Super
     } else {
       await this.assertCanAdmin(worldId, requester); // PJ+ nebo Admin/Super (beze změny)
     }
     // ... rest beze změny
   }
   ```

3. **Nová `assertCanEdit`** = kopie `assertCanAdmin` ale práh `WorldRole.PomocnyPJ`. Globální `UserRole.Admin` bypass zachován.

4. **Error codes:**
   - `CURRENCY_FORBIDDEN` zachován (PJ+ check pro add/delete)
   - Nový `CURRENCY_FORBIDDEN_EDIT` pro PomocnyPJ+ check (FE rozliší toast text)

5. **Unit testy** rozšířené (`world-currencies.service.spec.ts`):
   - PomocnyPJ smí edit existující měnu ✅
   - PomocnyPJ NEsmí přidat měnu (přidá → 403 CURRENCY_FORBIDDEN)
   - PomocnyPJ NEsmí smazat měnu (odebere → 403 CURRENCY_FORBIDDEN)
   - PomocnyPJ smí "Nastavit jako základ" (mass rate edit, sada kódů stejná)
   - Hrac dál 403 na cokoliv kromě get/convert

**Velikost patche:** ~30 řádků v service, ~5 nových testů. Žádné DTO/schema změny.

### 4.9 Responsivita

- **Desktop:** stack jako v 4.1, max-width ~720 px, vycentrované
- **Tablet:** stejné, max-width 100 %
- **Mobil ≤ 768 px:**
  - Převodník: 2 řádky stack, swap button mezi nimi, full width
  - Tabulka měn: bez tabulky → card list (1 karta = 1 měna), kebab vpravo
- `mobil-desktop` skill spustím po implementaci (11.4c)

### 4.10 Loading / error states

- Initial load: skeleton 3 řádky tabulky + skeleton převodník
- Error fetch: error banner s „Zkusit znovu"
- Mutation error: toast (sonner) s lokalizovanou hláškou
- Empty (0 měn, edge případ): PJ vidí CTA „Přidat první měnu", hráč vidí „Tento svět zatím nemá měny — kontaktuj PJ"

---

## 5. Out of scope

**Z 11.4 (samotná stránka):**
- **Drag-and-drop reorder** měn (pořadí mimo base ↔ ne-base — všechny ne-base jsou „rovnocenné")
- **Historie změn kurzu** (CampaignChangeLog už BE má pro campaign, ne pro currencies)
- **Bulk import/export** měn
- **Genre-templates picker** ve FE (BE už seeduje při vzniku světa, FE neumožní re-seed)
- **Concurrent edit conflict** (BE PUT replace = last-write-wins; akceptovaná známá limitace)
- **Currency icon picker** (symbol je free text, žádná knihovna emoji/SVG)
- **i18n měn** (číselné formátování zatím cs-CZ pevně)
- WS gateway pro real-time sync mezi PJ — currency změny jsou rare, refresh stačí

**Sdílené komponenty (4.7b) — postavíme je, ale v 11.4 je nezapojí jiné stránky:**
- **Shop integrace** — `<CurrencyDisplay>` + `useUserPreferredCurrency` se zapojí v **11.3c**
- **Character finance integrace** — `<CurrencySelect>` v AccountPanel-equivalentu v **8.x**
- **Inventory / trade ceny** — později
- **Cascade integrity check** — varování „smažeš měnu, kterou používá X shop items / Y character účtů" — řeší se v 11.3 / 8.x (tehdy bude existovat data pipeline)

**Zásadní rozhodnutí: NE „postavíme jen co stránka potřebuje, infrastruktura přijde s konzumentem".** Důvod: refaktor 1-na-N je vždy bolestivější než N-na-1. Sdílená vrstva v 11.4 přidá ~150 ř. navíc, ušetří ~500+ ř. v 11.3c a 8.x.

---

## 6. Acceptance kritéria

1. ✅ Stránka `/svet/:worldSlug/prevodnik-men` zobrazuje funkční převodník pro každého člena světa
2. ✅ Hráč (WorldRole.Hrac) vidí read-only seznam měn bez akcí
3. ✅ PomocnyPJ+ vidí kebab menu (Upravit, Nastavit jako základ); PJ+ navíc Smazat a tlačítko `+ Přidat měnu`
4. ✅ Hráč ani v DOM nevidí žádné edit/add/delete tlačítka (UI hiding) — BE je dál autoritativní
4b. ✅ PomocnyPJ nevidí v DOM tlačítka „+ Přidat měnu" ani „Smazat" v kebab
5. ✅ Převodník reaguje live na změnu amount / from / to (debounce 250 ms)
6. ✅ Result se formátuje bez trailing zeros (`100`, `12.5`, `0.0042`)
7. ✅ Swap button vymění from/to (amount zůstává)
8. ✅ Edge: 0 nebo 1 měna → převodník skrytý + odpovídající hláška
9. ✅ Edge: from === to → result = amount, žádné BE volání
10. ✅ `CurrencyFormModal` validuje code (1–8 znaků, A-Z 0-9, unique), name (required, max 40), symbol (optional, max 8), rate (>0, step 0.0001)
11. ✅ Base currency má badge „základ", rate input disabled, Smazat disabled
12. ✅ `Nastavit jako základ` přepočítá kurzy správně (poměry zachovány)
13. ✅ Smazání měny = ConfirmDialog s textem identifikujícím měnu
14. ✅ Optimistic update funguje, error → revert + toast
15. ✅ Stránka funguje na mobilu (≤ 768 px) — tabulka → cards, převodník stack
16. ✅ Žádné hardcoded barvy — všechno přes CSS tokeny (`var(--surface-2)`, `var(--accent)`, …)
17. ✅ `npm run lint`, `npm run lint:colors`, `npm run test:run`, `npm run build` ✓
18. ✅ Skripty `mobil-desktop` + `napoveda` spuštěny po implementaci

**Sdílená infrastruktura (4.7b) — povinné acceptance:**

19. ✅ `convertAmount(amount, from, to, items)` util existuje, je pure, vrací `null` pro neznámé code, jinak číslo s rounding shodným s BE
20. ✅ `formatCurrency(amount, code, items)` formátuje s cs-CZ separátorem, ořezává trailing zeros, fallbackuje na `code` pokud `symbol` chybí
21. ✅ `useUserPreferredCurrency(worldId)` perzistuje volbu v `localStorage` pod `ikaros.currency.preferred.<worldId>`, fallbackuje na base pokud uložená volba není v items
22. ✅ `<CurrencySelect>`, `<CurrencyDisplay>`, `<CurrencyAmountInput>` existují, mají Storybook stories a unit testy
23. ✅ Barrel `src/features/world/currencies/shared/index.ts` exportuje všech 5 primitiv + `WorldCurrencyItem` typ
24. ✅ Sama stránka `CurrencyPage` konzumuje **z shared barrelu**, ne z interních souborů — dogfooding
25. ✅ Žádný hluboký import do `shared/` z mimo-currency feature (lint pravidlo nebo aspoň manuální check; ESLint `no-restricted-imports` je nice-to-have)

**BE patch (§4.8b) — povinné acceptance:**

26. ✅ `isMetadataOnlyEdit(old, new)` helper existuje, je pure, porovnává sady `code`
27. ✅ PomocnyPJ smí PUT pokud `metadataOnly === true` (edit existujících)
28. ✅ PomocnyPJ dostane 403 `CURRENCY_FORBIDDEN` pokud PUT mění sadu `code` (add nebo delete)
29. ✅ PJ+ smí PUT vždy (beze změny)
30. ✅ Hrac/Ctenar dál dostávají 403 na PUT vždy
31. ✅ 5 nových BE unit testů prochází

---

## 7. Test plán

**Automated (FE Vitest) — page-local:**
- `utils/setAsBase.spec.ts` — přepočet kurzů (poměry zachovány, base ze starého base na nový)
- `validation.spec.ts` — zod schema (code unique, formát, rate range)
- `ConverterSection.spec.tsx` — render, debounce, swap, edge 0/1 currency, from===to short-circuit
- `CurrenciesListSection.spec.tsx` — hráč vs PJ render, base badge, disabled mazání base
- `CurrencyFormModal.spec.tsx` — RHF integration, validace, optimistic save, error revert
- `SetAsBaseModal.spec.tsx` — preview math, confirm flow

**Automated (FE Vitest) — sdílená infrastruktura (4.7b):**
- `shared/convertAmount.spec.ts` — `convertAmount` (base→base, base→other, other→other přes base, neznámý code → null, from===to short-circuit, BE math parity test s fixturou)
- `shared/formatCurrency.spec.ts` — cs-CZ formátování, trailing zeros, symbol fallback na code
- `shared/useUserPreferredCurrency.spec.ts` — localStorage persist, fallback na base, reaction na změnu items (uložená měna zmizí)
- `shared/CurrencySelect.spec.tsx` — render, onChange, filterBy, symbol display toggle
- `shared/CurrencyDisplay.spec.tsx` — render bez/s convertTo, tooltip
- `shared/CurrencyAmountInput.spec.tsx` — controlled change amount + currency

**Storybook stories:** `CurrencySelect`, `CurrencyDisplay`, `CurrencyAmountInput` — 3+ varianty každá.

**Manuální smoke checklist:**
1. Vytvoř nový svět (genre `fantasy`) → otevři `/svet/:slug/prevodnik-men` → vidíš ZL/ST/MD
2. Jako PJ: přidej měnu „Drahokam DK rate 100" → zachová se po refreshi
3. Převedl 10 DK na ST → měl by vrátit 10 000 ST (100/0.1 = 1000 × 10)
4. Změň základ na ST → ověř, že DK = 1000 a ZL = 10
5. Smaž DK → potvrzovací dialog → položka zmizí
6. Přihlas se jako Hrac → seznam je read-only, převodník funguje
7. Mobil viewport 375 px → tabulka → cards, převodník čitelný, swap button funguje
8. Network throttling slow 3G → optimistic preview se zobrazí, BE odpověď ho upraví
9. **`useUserPreferredCurrency` persist (dogfood):** v převodníku změň `to` na ST → ulož v `localStorage` klíč `ikaros.currency.preferred.<worldId>` (smoke testem ověření, že hodnota tam je, i když 11.4 page ji jen čte na default-init). Po refreshi se převodník otevře s touto měnou jako preferovanou cílovou.

---

## 8. Riziko & rollback

| Riziko | Pravděp. | Dopad | Mitigace |
|---|---|---|---|
| Souběžná editace dvou PJ → last-write-wins ztratí změny | nízká | střední | Akceptovaná známá limitace BE; v UI tooltip „Změny uvidí ostatní PJ až po refreshi" (nebo invalidate po focus) |
| Klient sestaví špatný full-replace array (ztratí jinou položku) | nízká | vysoký | Mutation vždy spawnuje z fresh `useWorldCurrencies` cache, ne ze stale snapshotu; refetch před save pokud `dataUpdatedAt > 30 s` |
| „Nastavit jako základ" zhoršený rounding při mnoha měnách | nízká | nízký | Math.js-style přesnost není potřeba — 4 desetinná místa (BE rounding) jsou dost; FE math používá double s explicit `toFixed(4)` |
| BE seed neproběhl u starých světů → 0 měn | nízká | nízký | Empty state zobrazí PJ CTA „Přidat první měnu"; D-NEW (backfill) tracknout pokud user reportne v praxi |
| Z confusion s 9.x novou-fáze currency (game economy) | nízká | střední | Spec explicitně out-of-scope; 11.3c bude konzumovat tento modul |

**Rollback:** Revert změn `src/features/world/pages/CurrencyPage.tsx` + smazání `src/features/world/currencies/`. Žádné DB / BE změny → rollback = jen FE diff. Žádné riziko ztráty dat.

---

## 9. Otázky k autorovi

Žádné — autor delegoval rozhodnutí. Klíčové volby:

- **IA:** stacked sekce (převodník nahoře, seznam dole), ne taby
- **Form pattern:** modal na add/edit jedné měny (ne inline-edit tabulka), batch save via BE PUT replace
- **Base currency:** vždy první v seznamu, rate=1.0 disabled, nelze smazat; „Nastavit jako základ" v kebab přepočítá kurzy
- **Hráč:** vidí převodník + read-only seznam měn, žádné akce
- **Validace:** code 1–8 A-Z 0-9 unique, name required max 40, symbol optional max 8, rate >0 step 0.0001
- **Reuse:** `Modal`, `ConfirmDialog`, `KebabMenu`, `useWorldContext` pattern z `EventsPage`
- **Sdílená infrastruktura (4.7b):** util `convertAmount` + `formatCurrency` + `<CurrencySelect>` + `<CurrencyDisplay>` + `<CurrencyAmountInput>` + `useUserPreferredCurrency(worldId)` hook s localStorage persist — postavit už v 11.4, exportovat z `shared/index.ts` barrel pro 11.3c (Shop), 8.x (Character finance), inventory…
- **Out of scope:** drag reorder, cascade integrity, audit log, genre re-seed, currency icon picker, i18n měn, integrace shared komponent do shopu/character (přijde s jejich vlastními fázemi)

---

**Po schválení specu napíšu implementační plán** (přesné CLI / file diff / pořadí kroků).
