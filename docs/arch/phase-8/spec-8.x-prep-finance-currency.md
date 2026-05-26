# Spec 8.x-prep — Finance polish + currency integration

**Status:** Draft — čeká na schválení
**Rozsah:** FE + BE (nový endpoint adjust + per-account flag schema rozšíření)
**Repo:** `Projekt-ikaros-FE` + drobný patch `Projekt-ikaros/backend`
**Velikost:** odhad ~14 souborů / ~700 ř.
**Autor:** PJ + Claude
**Datum:** 2026-05-26
**Souvisí:** [spec-11.4.md](../phase-11/spec-11.4.md) (shared currency vrstva — tato spec ji jako první konzument dogfooduje), bude součástí fáze 8.x

---

## 1. Cíl

Čtyři nezávislé sub-cíle pro stránku Finance postavy (`/svet/<slug>/<character>?tab=finance`):

- **B1 — Currency integrace:** napojit existující FinanceTab + AccountSwitcher + související komponenty na sdílenou currency vrstvu z 11.4 (`<CurrencyDisplay>`, `formatCurrency`, `useUserPreferredCurrency`). Dnes zobrazuje surový `account.currency` string (vidíš „EU" místo symbolu).
- **B2 — UX fix „Zaúčtovat měsíc":** vstupní pole Měsíční příjmy/výdaje nemají jasné labels (uživatel neví, kde je popis a kde částka — píše „15 000" do labelu). Po zaúčtování s prázdnou/nulovou delta žádné varování, transakce „+0" mate.
- **B3 — Manuální vklad/výběr:** nový BE endpoint pro PJ přímou úpravu balance bez transferu. Per-účet flag `allowPlayerSelfAdjust` (povolí hráči-vlastníkovi vlastní vklad i výběr).
- **B4 — In-game datum transakcí:** každá transakce (Zaúčtovat měsíc + Manuální vklad/výběr) přijímá **in-game datum** (kdy se to herně odehrálo). Default = `worldSettings.currentInGameDate`. Reuse `<FantasyDatePicker>` z 9.3/9.4. Historie zobrazí in-game datum primárně, real-world v tooltipu.

---

## 2. Kontext / motivace

**Reálný incident** ze screenshotu (2026-05-26):
- User na účtu „EU" zadal „15 000" do levého inputu (label), pravý zůstal 0
- Klikl Zaúčtovat měsíc → `income(0) − expense(0) = 0` → transakce v historii „Měsíční zúčtování +0 EU" → balance se nezvedl
- User to vnímá jako bug, ale je to UX past: dva textové inputy bez kontextu

**Proč 11.4 shared vrstva je hotová a 8.x ji ještě nepoužívá:**
- 11.4 dogfooduje jen sama sebe (stránka převodníku). Reálný proof, jestli `<CurrencyDisplay>` + `useUserPreferredCurrency` jsou dobře navržené, musí přijít z mimo-currency feature.
- Když tu integraci uděláme brzo, odhalíme nedostatky API komponent dřív, než přibude víc konzumentů (Shop 11.3c, inventory…). Memory: refaktor 1-na-N je bolestivější než N-na-1.

**Proč PJ-adjust feature:**
- User: „potřeboval bych si přidat peníze jako PJ, s tím že to může povolit i hráči"
- Dnes neexistuje endpoint pro úpravu balance bez transferu (žádný „loot drop", žádná odměna od barona, žádná pokuta).
- Workaround dnes: PJ musí vytvořit fake účet a poslat transfer → znečištěná historie + admin overhead.

**Proč in-game datum (B4):**
- User: „V mém světě je třeba červen 2039 a bude to u jiných PJ jiné. Potřebuji, aby herně měli hráči přehled."
- Dnes každá transakce uloží `date: new Date()` = real-world timestamp. „Měsíční zúčtování 26. 5. 2026" je matoucí, když ve hře je červen 2039.
- Hráč chce vidět chronologii **ve hře** (např. „výplata za leden 2039", „nákup zbraně 14. Vědurnu 1453"), nikoli pořadí klikání.
- BE už má `worldSettings.currentInGameDate` (in-game „dnes" světa) díky 9.4 weather modulu — reuse infrastruktury, žádný nový BE state.

**Když to neuděláme:** stránka financí zůstane matoucí, „Zaúčtovat měsíc" bude dál vyvolávat support otázky, currency display zůstane hardcoded text, PJ bude obcházet systém přes fake transfers.

---

## 3. Audit současného stavu

**Datový model** ([character-account.schema.ts:8–46](../../../../Projekt-ikaros/backend/src/modules/character-subdocs/schemas/character-account.schema.ts)):
- `CharacterAccount { id, worldId, label, ownerCharacterIds[], primaryOwnerId, accountType, accessLocation, currency, balance, incomeEntries[], expenseEntries[], transactions[], notes }`
- `FinanceEntry { id, label, amount }` — uloženo přímo na účtu jako pole
- `FinanceTransaction { id, date, delta, description, transferRef?, performedByUserId }`
- `currency` je **string** (kód měny, např. `'ZL'`, `'EU'`)

**Currency integrace dnes:**
- ✅ `CreateAccountModal.tsx:94–105` — měna se vybírá ze `useWorldCurrencies` (částečně OK)
- ✅ `SettingsAccountSection.tsx:176–193` — měna v Settings rovněž ze world-currencies
- ❌ `FinanceTab.tsx:233,286,293,300,366,472` — vykresluje **surový** `{account.currency}` (kód), žádný symbol, žádný převod
- ❌ Summary [FinanceTab.tsx:172](src/features/world/pages/CharacterDetailPage/components/FinanceTab.tsx#L172) `acc[a.currency] = (acc[a.currency] ?? 0) + a.balance` — accumulator per currency, ale nikde se nepřevádí na user-preferred
- ❌ Existují účty s `currency` které **není** ve `world_currencies` (např. „EU" když svět nemá Eurozone) — FE to tiše zobrazí jako text, žádné varování

**Zaúčtovat měsíc:**
- ✅ BE `addMonthly` ([character-accounts.service.ts:209–233](../../../../Projekt-ikaros/backend/src/modules/character-subdocs/character-accounts.service.ts)) je atomický: `$push transaction + $inc balance` v jednom Mongo update
- ✅ FE cache invalidace ([useCharacterAccounts.ts:122–137](src/features/world/pages/api/useCharacterAccounts.ts#L122)) funguje: `setQueryData(accountDetail)` + `invalidateQueries(['characters', worldId])`
- ❌ UI inputy Měsíční příjmy/výdaje nemají visible labels — user neví, který input je popis a který částka
- ❌ Žádná visible jednotka měny u amount inputu (uživatel neví, jestli zadává peníze nebo počet kusů)
- ❌ Pokud user klikne Zaúčtovat s prázdnými/nulovými entries, transakce s delta=0 tiše projde
- ❌ Toast „Měsíc zaúčtován" neukazuje konkrétní delta (uživatel neví, kolik se přičetlo/odečetlo)

**Manuální adjust:**
- ❌ Neexistuje žádný endpoint pro úpravu balance bez transferu
- Workaround dnes: jen `transfer` (vyžaduje 2 účty) nebo úprava `incomeEntries` + `addMonthly`

**Permission model dnes** ([service.ts:494–561](../../../../Projekt-ikaros/backend/src/modules/character-subdocs/character-accounts.service.ts)):
- `assertReadAccess` — staff (PJ+) nebo v `ownerCharacterIds`
- `assertWriteContentAccess` — stejné jako read
- `assertWriteSettingsAccess` — jen PJ+
- `assertDeleteAccess` — staff NEBO primary owner

---

## 4. Návrh řešení

### 4.1 B1 — Currency integrace

**FE změny:**

1. **`FinanceTab.tsx`** — všechna místa kde se vykresluje částka + currency string:
   - **Hero balance:** `{fmtAmount(account.balance)} {account.currency}` → `<CurrencyDisplay amount={account.balance} currencyCode={account.currency} items={currencies} />`
   - **Income/Expense sum:** stejně přes `<CurrencyDisplay>`
   - **Transaction history rows:** přes `<CurrencyDisplay>` s `convertTo={preferredCode}` (tooltip ukáže originál)
   - **AccountSwitcher** kompaktní badge: `{account.currency}` → `formatCurrency(account.balance, account.currency, currencies)` util
2. **Summary „nad účty" panel** (FinanceTab.tsx:172) — místo per-currency accumulator:
   - Přidat `useUserPreferredCurrency(worldId, currencies)` → `resolvedCode`
   - Spočítat `totalInPreferred = accounts.reduce((sum, a) => sum + (convertAmount(a.balance, a.currency, resolvedCode, currencies) ?? 0), 0)`
   - Zobrazit: „Celkem (v {resolvedCode}): X" + sbalitelný expandable s rozkladem po měnách
   - Pokud některá `a.currency` není v `currencies`, přeskočit z totalu + warning chip „N účtů s neznámou měnou"
3. **Fallback display pro neznámou měnu (Q3):**
   - `<CurrencyDisplay>` už má fallback (`formatCurrency` vrátí surový code pokud měna chybí)
   - **Nově:** přidat `<UnknownCurrencyChip>` mini komponent — ⚠ s tooltipem „Měna '{code}' není ve světě — kontaktuj PJ"
   - Zobrazí se u hero balance + u AccountSwitcher badge pokud `!items.find(c => c.code === account.currency)`
4. **Settings → měna účtu** (SettingsAccountSection.tsx) — už používá `<select>` s world-currencies. Refaktor na `<CurrencySelect>` ze shared barrelu pro konzistenci stylingu.

**Žádné BE změny pro B1.**

### 4.2 B2 — UX „Zaúčtovat měsíc"

**FE změny (FinanceTab.tsx + entry editor):**

1. **Vstupní řádky příjmů/výdajů — refaktor:**
   - Místo dvou „nahých" inputů přidat **visible labels**:
     - Levý input: label „Popis" + placeholder „např. Nájem, Plat, Daně…"
     - Pravý input: label „Částka" + suffix `{account.currency symbol}` (přes `formatCurrency('', code, items).split(' ')[1]`)
   - `type="number"` na amount inputu (dnes je text), `min={0}` + `step={1}`
2. **Validace prázdných entries** před `addMonthly`:
   - Pokud všechny entries mají `amount === 0` NEBO oba seznamy jsou prázdné → otevřít `<ConfirmDialog>` „Není co účtovat. Income aktuálně 0, expense aktuálně 0. Opravdu zaúčtovat měsíc s nulovou změnou?"
   - User confirm → projde dál (zachová dnešní chování pro debug); Cancel → návrat
3. **Toast s konkrétní deltou:**
   - Místo „Měsíc zaúčtován" → `"Zaúčtováno: {formatCurrency(delta, code, items)} ({delta > 0 ? 'přírůstek' : delta < 0 ? 'úbytek' : 'beze změny'})"`
   - Pokud delta = 0, varianta „beze změny" + ⚠ ikona v toastu
4. **Pomocný `<EntryRow>` komponent** (extract z FinanceTab) — sdílený pro income i expense, propsuje currencyCode:
   ```tsx
   <EntryRow
     entry={e}
     currencySymbol={getCurrencySymbol(account.currency, currencies)}
     onChange={...}
     onDelete={...}
   />
   ```

**Žádné BE změny pro B2.**

### 4.3 B3 — Manuální vklad/výběr (PJ + opt-in hráč)

**Datový model — rozšíření:**

1. **`CharacterAccount` přidat pole:**
   ```ts
   allowPlayerSelfAdjust?: boolean; // default false; když true, hráč-vlastník smí vklad i výběr
   ```
2. **`FinanceTransaction.transferRef` zachován**; nově `transaction.description` ponese **povinný reason text** pro adjust akce. Žádné nové pole na transakci.

**BE změny (`character-accounts/`):**

1. **Schema:** `CharacterAccountSchemaClass` přidat `allowPlayerSelfAdjust: { type: Boolean, default: false }`
2. **DTO** `AdjustBalanceDto`:
   ```ts
   {
     amount: number;       // může být negativní (= výběr) nebo pozitivní (= vklad)
     reason: string;       // required, min 1, max 200
   }
   ```
3. **Endpoint** `POST /worlds/:worldId/accounts/:accountId/adjust` (controller):
   - Body: `AdjustBalanceDto`
   - Permission: nová `assertCanAdjust` (viz §4.4)
   - Service:
     - Vytvoří `FinanceTransaction { delta: dto.amount, description: dto.reason, performedByUserId: requester.id }`
     - Atomicky volá `accountsRepo.appendTransaction` (reuse existující funkce z transferu)
4. **Settings update endpoint** — `PATCH /worlds/:worldId/accounts/:accountId/settings` (existující) rozšířit DTO o `allowPlayerSelfAdjust: boolean | undefined`
5. **Permission `assertCanAdjust`:**
   ```ts
   if (isStaff(requester)) return; // PJ+ vždy smí
   if (!isOwner(requester, account)) throw 403 FORBIDDEN_ADJUST;
   if (!account.allowPlayerSelfAdjust) throw 403 PLAYER_ADJUST_DISABLED;
   ```

**FE změny:**

1. **Nový hook** `useAccountAdjust(worldId, accountId)` v `useCharacterAccounts.ts` — POST `/adjust`, invalidace stejná jako transfer/addMonthly
2. **Nový modal** `AdjustBalanceModal.tsx`:
   - Pole: amount (number, povolí negativní), reason (text, required, max 200)
   - Switch: „Vklad ↔ Výběr" (toggle změní sign na amount inputu pro UX)
   - Submit volá `useAccountAdjust`
3. **Tlačítko „Vklad / Výběr"** v FinanceTab header:
   - Vedle „Poslat" (transfer)
   - **Visibility:**
     - PJ+ → vždy viditelné
     - Vlastník-hráč → viditelné jen pokud `account.allowPlayerSelfAdjust === true`
     - Ostatní (čtenáři) → skryté
4. **Settings sekce nový řádek:**
   - „Povolit hráči-vlastníkovi vlastní vklad/výběr" — checkbox, PJ-only edit
   - Helper text: „Hráči-vlastníkovi povolíš samostatně přidávat nebo odebírat peníze s povinným důvodem. Historie zůstává auditovatelná."
5. **Transaction history řádek:**
   - Pro `description` začínající velkým písmem volného textu (manuální reason) zobrazit chip „Manuální" v opozitu k „Měsíční zúčtování" / „Transfer". Nebo: nové vizuální rozlišení podle typu transakce.

### 4.4 B4 — In-game datum transakcí

**Audit potvrdil reuse infrastrukturu** (žádné nové utility):
- `worldSettings.currentInGameDate: string | null` (ISO) — existuje díky 9.4 weather
- `<FantasyDatePicker>` v `@/shared/ui` — props `{ config, value, onChange, allowHour, required }`
- `formatFantasyDate(date, config, { includeHour })` — formátování („14. Vědurnu 1453, 12:30")
- `getActiveCalendarConfig(configs, timelineSlug, defaultSlug)` — výběr kalendáře, kterým interpretovat datum
- `useCalendarConfigs(worldId)`, `useWorldSettings(worldId)` — data sources

**Schema rozšíření (BE + FE):**

```ts
// FantasyDate z @/shared/lib/calendarEngine/types
interface FantasyDate { year: number; monthIndex: number; day: number; hour?: number; minute?: number; }

interface FinanceTransaction {
  id: string;
  date: Date;                        // real-world timestamp (audit) — zachován
  inGameDate?: FantasyDate | null;   // ← NOVÉ — herní čas akce
  delta: number;
  description: string;
  transferRef?: { … };
  performedByUserId: string;
}
```

`inGameDate` je **optional + nullable**:
- `undefined` u všech existujících transakcí (backward compat — žádná data migrace)
- `null` u nově vytvořených pokud user explicitně odznačí pole (edge case — chce „neherní" zápis)
- `FantasyDate` objekt v běžném případě

**BE změny:**

1. **Schema** `character-account.schema.ts` → `transactions` subdoc array povoluje `inGameDate: Mixed` (volné Object pole pro FantasyDate JSON)
2. **Service metody** `addMonthly`, `transfer`, `adjust` (B3) — všechny přijímají optional `inGameDate?: FantasyDate` parametr a propagují do nově vytvořené transakce
3. **Validace** `inGameDate`:
   - Pokud zadané: `year` integer (záporné OK = BC), `monthIndex >= 0 && < calendarConfig.months.length`, `day >= 1 && <= daysInMonth(monthIndex, year, config)` — server-side validace přes `calendarEngine` util sdíleného mezi FE+BE? **Out of scope — BE povolí libovolný FantasyDate JSON**, validace je FE-only (FantasyDatePicker už clampuje den). Důvod: BE má vlastní calendar engine pouze pro weather/timeline, sdílení modulů s FE je out-of-scope této spec. Riziko low — FE picker je jediný entry point.

**FE změny:**

1. **DateField sdílený podkomponent** v `src/features/world/pages/CharacterDetailPage/components/accounts/InGameDateField.tsx`:
   ```tsx
   <InGameDateField
     value={inGameDate}
     onChange={setInGameDate}
     worldId={worldId}
     label="Herní datum"
     allowReset  // tlačítko „Dnes" → currentInGameDate
   />
   ```
   Interně:
   - `useWorldSettings(worldId)` → `currentInGameDate` parse na `FantasyDate`
   - `useCalendarConfigs(worldId)` + `getActiveCalendarConfig(...)` → aktivní `config`
   - `<FantasyDatePicker config={config} value={value} onChange={onChange} allowHour={true} />`
   - Pokud world nemá calendar configs → fallback skrýt picker, použít date input (Gregorian)
   - Pokud `currentInGameDate === null` → default = (config-aware) první den prvního měsíce roku 1 + helper „Nastav herní čas" odkaz do worldSettings
2. **AdjustBalanceModal** (z B3) — přidat `<InGameDateField>` před reason
3. **„Zaúčtovat měsíc" akce** (B2) — dnes je jen tlačítko, nyní otevře malý `<ConfirmAddMonthlyModal>`:
   - Pole: `<InGameDateField>` (default = currentInGameDate)
   - Preview deltу (income.sum − expense.sum)
   - Tlačítka Zrušit / Zaúčtovat
   - Nahradí dnešní tichý mutate
4. **TransferModal** (existující) — přidat `<InGameDateField>` (default = currentInGameDate). Sjednoceno s adjust + addMonthly pro konzistenci.
5. **Historie transakcí — display:**
   - Primárně `formatFantasyDate(inGameDate, config)` — např. „14. Vědurnu 1453, 12:30" nebo „14. 6. 2039"
   - Fallback na real-world `date` pokud `inGameDate` chybí (legacy transakce)
   - Real-world `date` vždy v tooltipu („Zapsáno: 26. 5. 2026 18:42")
   - Visual marker (📅 chip) u transakcí které mají in-game datum, nepatrný rozdíl vs. legacy

**API hook změny:**

- `useAccountAddMonthly(worldId, accountId)` — `mutate({ inGameDate?: FantasyDate })` místo `mutate(undefined)`
- `useAccountTransfer(worldId, accountId)` — DTO přidat `inGameDate?: FantasyDate`
- `useAccountAdjust(worldId, accountId)` (nový z B3) — DTO obsahuje `inGameDate?: FantasyDate`

### 4.5 Permission matrix (sumár po B3)

| Operace | Hráč-vlastník | PJ+ |
|---|:---:|:---:|
| Read účet | ✅ | ✅ |
| Edit label / notes / entries | ✅ | ✅ |
| Transfer (poslat) | ✅ | ✅ |
| **Adjust (vklad)** | ✅ jen pokud `allowPlayerSelfAdjust` | ✅ vždy |
| **Adjust (výběr)** | ✅ jen pokud `allowPlayerSelfAdjust` | ✅ vždy |
| Edit Settings (incl. `allowPlayerSelfAdjust` flag) | ❌ | ✅ |
| Delete | ✅ primary owner | ✅ |
| Zaúčtovat měsíc | ✅ | ✅ |
| **Nastavit in-game datum transakce** | ✅ vždy (autor akce) | ✅ vždy |

---

## 5. Out of scope

- **Auto-repeat měsíčních entries** (cron nebo trigger na změnu in-game data) — entries zůstávají manuální seed pro Zaúčtovat měsíc
- **Audit log mimo `performedByUserId`** — žádná separátní `AuditLog` entita; historie transakcí je primární audit
- **Schvalovací workflow pro hráčův vklad/výběr** — pokud má flag, jde rovnou bez PJ confirm
- **Limit částky** na hráčův adjust — žádný cap (PJ to umí kdykoli zakázat flagem)
- **Bulk adjust** víc účtů najednou — jeden účet, jedna akce
- **Změna měny u existujícího účtu s historií transakcí** — Settings to dnes umožní, ale neřeší přepočet historie (samostatný dluh, mimo 8.x-prep)
- **Auto-migrace existujících `currency` stringů** na `world_currencies` codes — fallback display + manuální Settings re-select (Q3 odpověď)
- **Real-time WS sync** balance napříč PJ + vlastníky — refresh po focus stačí (currency modul WS nemá taky)
- **BE server-side validace `inGameDate`** proti calendar configu (BE nemá sdílený calendar engine; FE picker už clampuje, riziko low)
- **Backfill `inGameDate` na existující transakce** — zůstanou bez in-game data, fallback na real-world `date`
- **Auto-advance currentInGameDate při Zaúčtovat měsíc** (např. „posunout svět o měsíc dopředu") — out of scope, řeší worldSettings / weather modul nezávisle
- **Filtrování/řazení historie podle in-game data** — historie zůstane v insert pořadí (= real-world chronology). Per-month grouping a in-game sort je samostatný cíl

---

## 6. Acceptance kritéria

**B1 — Currency integrace:**

1. ✅ FinanceTab hero balance používá `<CurrencyDisplay>` (symbol z world-currencies, ne surový code)
2. ✅ Transaction history rows zobrazují částku přes `<CurrencyDisplay>` s `convertTo={preferredCode}` + tooltip s originálem
3. ✅ Summary panel ukazuje „Celkem v {preferredCode}: X" + expandable per-currency rozklad
4. ✅ `useUserPreferredCurrency(worldId)` per-world persistence funguje (přepnu měnu v 11.4 převodníku, vrátím se na finance → summary v nové měně)
5. ✅ Účty s `currency` ne ve world-currencies zobrazí `<UnknownCurrencyChip>` + jsou vyloučené z totalu
6. ✅ AccountSwitcher používá `formatCurrency` util pro kompaktní badge
7. ✅ SettingsAccountSection používá `<CurrencySelect>` ze shared barrelu
8. ✅ Žádný import currency funkcionality z mimo shared barrelu (jen `@/features/world/currencies/shared`)

**B2 — UX „Zaúčtovat měsíc":**

9. ✅ Income/Expense entry rows mají visible labels „Popis" + „Částka"
10. ✅ Amount input má suffix se symbolem měny účtu
11. ✅ Amount input je `type="number"` s `min={0}` + `step={1}`
12. ✅ Zaúčtovat měsíc s nulovou delta → ConfirmDialog „Není co účtovat, …"
13. ✅ Toast po addMonthly ukazuje konkrétní deltu („Zaúčtováno: −15 000 EU (úbytek)")
14. ✅ Při delta=0 toast má variant „beze změny" + ⚠ ikona

**B3 — Manuální vklad/výběr:**

15. ✅ BE schema má `allowPlayerSelfAdjust: boolean` field
16. ✅ BE `POST /worlds/:worldId/accounts/:accountId/adjust` endpoint funguje
17. ✅ `AdjustBalanceDto` validuje `reason: required string 1–200`
18. ✅ `assertCanAdjust` brání hráči adjust pokud `allowPlayerSelfAdjust=false` (403)
19. ✅ PJ+ smí adjust vždy
20. ✅ Hráč smí adjust pokud flag true
21. ✅ Nový `AdjustBalanceModal` umožňuje vklad i výběr s povinným reasonem (1–200 znaků)
22. ✅ Settings sekce má checkbox `allowPlayerSelfAdjust` (PJ-only edit)
23. ✅ Tlačítko „Vklad / Výběr" v FinanceTab header — visible podle role + flag matrix (§4.4)
24. ✅ Transakce z adjust akce má `description = reason`, `delta = amount`, `performedByUserId = current user`
25. ✅ Historie transakcí rozliší manuální adjust od transferu / měsíčního zúčtování (vizuální chip)

**B4 — In-game datum transakcí:**

26. ✅ FE `FinanceTransaction` typ + BE interface obsahuje `inGameDate?: FantasyDate | null`
27. ✅ `<InGameDateField>` sdílený komponent existuje (interně reuse `<FantasyDatePicker>`)
28. ✅ Default value = parse `worldSettings.currentInGameDate` na `FantasyDate`
29. ✅ Tlačítko „Dnes" resetuje na `currentInGameDate`
30. ✅ Fallback Gregorian když world nemá calendar configs
31. ✅ AdjustBalanceModal (B3), ConfirmAddMonthlyModal (B2 nový), TransferModal — všechny mají `<InGameDateField>`
32. ✅ Historie transakcí zobrazuje `formatFantasyDate(inGameDate, config)` primárně + real-world `date` v tooltipu
33. ✅ Legacy transakce bez `inGameDate` fallbackují na real-world `date` (žádná data migrace)
34. ✅ Vizuální 📅 chip u transakcí s in-game datem (drobné rozlišení od legacy)

**Obecné:**

35. ✅ Všechny existující testy procházejí (FinanceTab.spec.tsx, accounts BE testy)
36. ✅ +cca 25 nových testů (BE 5 pro adjust + permission gate + inGameDate propagation; FE 20 pro currency integraci + UX + AdjustBalanceModal + InGameDateField + history display)
37. ✅ `npm run lint`, `lint:colors`, `test:run`, `build` ✓
38. ✅ `mobil-desktop` audit + `napoveda` (krátká aktualizace popisu Detail postavy → Finance)

---

## 7. Test plán

**BE (Jest):**
- `character-accounts.service.spec.ts` rozšíření:
  - `adjust` — PJ vklad ok / PJ výběr ok / hráč adjust s flag=true ok / hráč adjust s flag=false → 403 / čtenář → 403
  - `assertCanAdjust` matrix
  - `reason` validation (prázdný → 400)

**FE (Vitest):**
- `FinanceTab.spec.tsx` rozšíření:
  - Hero balance ukazuje symbol ne code
  - Summary převedený do preferred currency
  - Unknown currency chip se zobrazí pro neznámou měnu
  - Entry row labels „Popis" / „Částka" viditelné
  - Amount suffix má symbol měny
  - Zaúčtovat s nulovou delta → ConfirmDialog
  - Toast obsahuje konkrétní deltu
- `AdjustBalanceModal.spec.tsx` (nový):
  - Render pole + validace povinný reason
  - Switch vklad ↔ výběr přepíše sign
  - Submit volá hook
  - Optimistic update
- `SettingsAccountSection.spec.tsx`:
  - Flag checkbox `allowPlayerSelfAdjust` PJ-only
- `InGameDateField.spec.tsx` (nový):
  - Default value parse z `currentInGameDate`
  - Tlačítko „Dnes" reset
  - Fallback Gregorian když calendar configs prázdné
  - onChange propaguje FantasyDate
- `ConfirmAddMonthlyModal.spec.tsx` (nový):
  - Render preview delty
  - InGameDateField default
  - Cancel / Confirm
  - Delta=0 → varovná hláška

**Manuální smoke:**
1. Otevři účet jako PJ → klikni „Vklad/Výběr" → vlož 1000 s reasonem „Test" → balance += 1000, v historii „Test +1 000 EU"
2. Settings → zaškrtni „Povolit hráči vlastní vklad/výběr" → log jako hráč-vlastník → tlačítko Vklad/Výběr viditelné → výběr 500 s reasonem „Útrata u barda" → balance −= 500
3. Hráč bez flag → tlačítko Vklad/Výběr skryté
4. Účet s currency=„EU" (ne ve world-currencies) → hero zobrazí „1500 EU ⚠" + tooltip „Měna 'EU' není ve světě"
5. Změň preferred currency v 11.4 převodníku na ST → vrať se na finance → summary „Celkem v ST: X"
6. Income entry: napíš popis vlevo, částku vpravo → uloží → Zaúčtovat měsíc → toast „Zaúčtováno: +X EU"
7. Income/expense oba prázdné → Zaúčtovat měsíc → ConfirmDialog
8. Mobil 375 px → modal AdjustBalance scroll OK, tlačítko Vklad/Výběr v header wrap
9. **In-game datum:** otevři AdjustBalanceModal → InGameDateField předvyplněn `currentInGameDate` → změň den → submit → v historii vidíš „14. Vědurnu 1453 — Test +1 000 ZL" (tooltip: „Zapsáno 26. 5. 2026 18:42")
10. **In-game datum legacy:** stará transakce (před B4) v historii zobrazí real-world datum (žádný 📅 chip)
11. **In-game datum + Zaúčtovat měsíc:** klik → ConfirmAddMonthlyModal s preview delta + datum → confirm → transakce má `inGameDate` z modalu
12. **In-game datum world bez calendars:** AdjustBalanceModal použije nativní Gregorian date input (žádný error)

---

## 8. Riziko & rollback

| Riziko | Pravděp. | Dopad | Mitigace |
|---|---|---|---|
| Hráč zneužije flag a rabuje účet | střední | vysoký | PJ má kdykoli flag vypnout; každá akce má reason v historii (audit) |
| Změna `currency` v Settings rozbije historii (transakce v jiné měně) | nízká | střední | Out of scope — pre-existing problem; pokud user změní currency, historie zůstane v původní (display jen current symbol) |
| Migrate existing accounts s `currency='EU'` na world-currencies | nízká | nízký | Q3=Fallback display — žádná force migrace; PJ ručně přiřadí přes Settings |
| `allowPlayerSelfAdjust` flag default false → existující účty hráče neumí adjust | jistá | žádný | Záměr — striktní default, PJ explicitně opt-in |
| BE patch zlomí existující testy (schema change) | nízká | střední | Field je optional s default — backward compat; existující JSON load → undefined → false |
| Hráč v UI vidí tlačítko Vklad/Výběr, ale BE odmítne (flag false in DB → out-of-sync s cache) | nízká | nízký | Toast error „Nemáš oprávnění" + invalidate cache → načte fresh flag |
| User zadá in-game datum mimo definici calendar (smyšlený měsíc/den) | nízká | nízký | FantasyDatePicker clampuje den dle config; nedovolí měsíc mimo `months.length` |
| World nemá calendar configs → InGameDateField crashne | nízká | střední | Fallback: nativní HTML date input, FantasyDate převod přes Gregorian wrapper. Test pokrytý #28 |
| Legacy transakce bez `inGameDate` zmizí z historie | nemožná | vysoký | Fallback render: `inGameDate ?? real-world date`. Pokrytý #33. |
| User v B2 omylem klikne Zaúčtovat s default `currentInGameDate` který je out-of-date | střední | nízký | ConfirmAddMonthlyModal vždy zobrazí datum + tlačítko „Změnit". User vidí co bude uložené před confirm. |

**Rollback:**
- **FE:** revert FinanceTab + SettingsAccountSection + smazat AdjustBalanceModal + smazat useAccountAdjust hook
- **BE:** revert `allowPlayerSelfAdjust` field, smazat adjust endpoint/service method. DB documents s tímto polem zůstanou (no harm — pole ignorováno). Žádná data loss.

---

## 9. Otázky k autorovi

Žádné — autor delegoval rozhodnutí včetně 3 Q&A:

- **B3 hráč:** per-účet flag, vklad i výběr v jednom
- **B3 reason:** povinný (1–200 znaků)
- **B1 unknown currency:** fallback display + warning chip (žádná auto-migrace)

Plus dodatek z konverzace (2026-05-26):
- B2 musí mít visible labels „Popis" + „Částka" + symbol měny u amount inputu (uživatel se chytil v zaškrtnutí labelu jako částky)
- **B4 nový sub-cíl:** in-game datum transakcí (reuse FantasyDatePicker + worldSettings.currentInGameDate); platí pro Zaúčtovat měsíc, Transfer i AdjustBalance; default = currentInGameDate; historie zobrazí in-game datum primárně

---

**Po schválení specu napíšu implementační plán** (pořadí kroků: BE schema rozšíření o `inGameDate` + adjust patch → FE shared currency integrace → InGameDateField sdílený → UX entries + ConfirmAddMonthlyModal → AdjustBalanceModal → Settings flag → historie display → testy → docs).
