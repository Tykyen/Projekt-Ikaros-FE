# Implementační plán — 8.x-prep Finance polish + currency + adjust + in-game datum

**Datum:** 2026-05-26
**Status:** ⏳ Čeká na schválení
**Spec:** [`spec-8.x-prep-finance-currency.md`](./spec-8.x-prep-finance-currency.md)
**Větev:** **`main`** (per `feedback_work_on_main.md`)
**Repos:** `Projekt-ikaros` (BE) + `Projekt-ikaros-FE`

---

## Strategie (proč v tomto pořadí)

**1× BE → 4× FE commit:**

1. **BE první** — schema + endpoint + permission gate musí existovat dřív, než FE může volat. Jeden BE commit pokryje vše (B3 adjust + B4 inGameDate + B3 flag).
2. **FE foundation** (types + hooks + sdílený `<InGameDateField>`) — nutné pro všechny FE změny dál.
3. **FE B1+B2 — currency display + UX entries** — bez modálů, jen integrace + visible labels.
4. **FE B3+B4 modaly + historie display** — AdjustBalanceModal, ConfirmAddMonthlyModal, Settings flag, history s in-game datem.
5. **Docs** — roadmap + napoveda + případné dluhy.

**Memory připomínky:**
- ⚠️ Před BE commitem `prettier --write` (husky hook) — [`feedback_be_precommit_prettier.md`]
- ⚠️ Po BE patchi nutný restart nest --watch — [`feedback_be_restart_required.md`]
- ⚠️ Žádný hluboký import do `@/features/world/currencies/shared` mimo barrel — [`spec-11.4 §6 #25`]
- ⚠️ Pre-existing TS errors / lint warnings = můj problém — [`feedback_preexist_debt_owned.md`]

---

## FÁZE A — BE patch (1 commit v `Projekt-ikaros`)

### Step A1 — Schema rozšíření CharacterAccount

**Soubor:** `backend/src/modules/character-subdocs/schemas/character-account.schema.ts`

- Přidat `@Prop({ type: Boolean, default: false }) allowPlayerSelfAdjust: boolean;`
- `transactions` (MixedArray) — žádná schema change, `inGameDate` se uloží jako součást subdoku (Mixed type přijme cokoliv)

### Step A2 — Interface rozšíření

**Soubory:**
- `backend/src/modules/character-subdocs/interfaces/character-account.interface.ts` — `allowPlayerSelfAdjust?: boolean`
- `backend/src/modules/character-subdocs/interfaces/character-finance.interface.ts` — `inGameDate?: FantasyDateLike | null` (typuju jako `{ year, monthIndex, day, hour?, minute? }` lokální typ; BE engine s tímto nepracuje, jen ukládá)

### Step A3 — DTO

**Nový soubor:** `backend/src/modules/character-subdocs/dto/adjust-balance.dto.ts`
```ts
export interface FantasyDateLike { year: number; monthIndex: number; day: number; hour?: number; minute?: number; }
export class AdjustBalanceDto {
  @IsNumber() amount!: number;
  @IsString() @MinLength(1) @MaxLength(200) reason!: string;
  @IsOptional() inGameDate?: FantasyDateLike | null;
}
```

**Edit existujících DTO:**
- `transfer.dto.ts` (nebo controller body type) — přidat optional `inGameDate?`
- `add-monthly` body type (dnes je prázdné) — POST přijme `{ inGameDate? }`
- `update-account-settings.dto.ts` — přidat optional `allowPlayerSelfAdjust?: boolean`

### Step A4 — Service metody

**Soubor:** `backend/src/modules/character-subdocs/character-accounts.service.ts`

- `addMonthly(accountId, performedByUserId, inGameDate?)` — propagovat `inGameDate` do nově vytvořené transakce
- `transfer(...)` — stejně
- **Nová metoda** `adjust(accountId, dto: AdjustBalanceDto, requester)`:
  ```ts
  await this.assertCanAdjust(accountId, requester);
  const tx = { id: randomUUID(), date: new Date(), inGameDate: dto.inGameDate ?? null, delta: dto.amount, description: dto.reason, performedByUserId: requester.id };
  return this.accountsRepo.appendTransaction(accountId, tx);
  ```
- **Nová** `assertCanAdjust(accountId, requester)`:
  - `isStaff(requester)` → return (PJ+ vždy)
  - Načti account, pokud `requester` není v `ownerCharacterIds` → 403 `FORBIDDEN_ADJUST`
  - Pokud `!account.allowPlayerSelfAdjust` → 403 `PLAYER_ADJUST_DISABLED`

### Step A5 — Controller

**Soubor:** `backend/src/modules/character-subdocs/character-accounts.controller.ts`

- **Nový endpoint:** `POST /worlds/:worldId/accounts/:accountId/adjust` — `@Body() dto: AdjustBalanceDto`, volá `service.adjust`
- **Edit existující:** `POST .../add-monthly` přijímá optional body `{ inGameDate? }`; `POST .../transfer` přijímá optional `inGameDate?` v body
- **Edit Settings PATCH** — body type rozšířen o `allowPlayerSelfAdjust?: boolean` (PJ-only přes existující `assertWriteSettingsAccess`)

### Step A6 — Repository (žádná změna)

`appendTransaction` v `character-account.repository.ts` už atomicky push libovolný transaction object — beze změny.

### Step A7 — BE testy

**Soubor:** `backend/src/modules/character-subdocs/character-accounts.service.spec.ts`

Nové testy (~7):
- `adjust` — PJ vklad ok / PJ výběr ok
- `adjust` — hráč s `allowPlayerSelfAdjust=true` → vklad ok
- `adjust` — hráč s flag=false → 403 PLAYER_ADJUST_DISABLED
- `adjust` — čtenář (ne owner, ne staff) → 403 FORBIDDEN_ADJUST
- `adjust` — reason chybí → 400 (přes DTO validator)
- `adjust` — propaguje `inGameDate` do transakce
- `addMonthly` — propaguje optional `inGameDate`

### Step A8 — Prettier + commit

```powershell
cd c:/Matrix/ProjektIkaros/Projekt-ikaros/backend
npx prettier --write src/modules/character-subdocs/
npx jest src/modules/character-subdocs/character-accounts.service.spec.ts
```

**Acceptance kroku:** existující testy ✓ + 7 nových ✓.

**Commit BE:**
```
feat(character-accounts-8.x-prep): adjust endpoint + allowPlayerSelfAdjust + inGameDate field

- schema: allowPlayerSelfAdjust: boolean (default false)
- interface: FinanceTransaction.inGameDate?: FantasyDateLike | null
- DTO: AdjustBalanceDto (amount + reason + optional inGameDate)
- service: adjust() + assertCanAdjust() + inGameDate propagation v addMonthly/transfer
- controller: POST /accounts/:id/adjust; Settings PATCH rozšířen o flag
- 7 novych unit testu

Spec: docs/arch/phase-8/spec-8.x-prep-finance-currency.md §4.3, §4.4
```

---

## FÁZE B — FE foundation (commit 1 v FE)

### Step B1 — Types rozšíření

**Soubor:** `src/features/world/pages/api/characters.types.ts`

- `FinanceTransaction` přidat `inGameDate?: FantasyDate | null`
- `CharacterAccount` přidat `allowPlayerSelfAdjust?: boolean`

Import `FantasyDate` z `@/shared/lib/calendarEngine`.

### Step B2 — API hooks

**Soubor:** `src/features/world/pages/api/useCharacterAccounts.ts`

- **Nový hook** `useAccountAdjust(worldId, accountId)`:
  ```ts
  return useMutation({
    mutationFn: (dto: { amount: number; reason: string; inGameDate?: FantasyDate | null }) =>
      api.post<CharacterAccount>(`/worlds/${worldId}/accounts/${accountId}/adjust`, dto),
    onSuccess: (account) => {
      qc.setQueryData(charactersQueryKey.accountDetail(worldId, accountId), account);
      void qc.invalidateQueries({ queryKey: ['characters', worldId] });
    },
  });
  ```
- **Edit:** `useAccountAddMonthly` — `mutationFn: (dto?: { inGameDate?: FantasyDate | null })` → POST body `dto ?? {}`
- **Edit:** `useAccountTransfer` (existující) — DTO rozšířit o `inGameDate?: FantasyDate | null`
- **Edit:** `useUpdateAccountSettings` (existující PATCH) — DTO rozšířit o `allowPlayerSelfAdjust?: boolean`

### Step B3 — `<InGameDateField>` sdílený komponent

**Nový soubor:** `src/features/world/pages/CharacterDetailPage/components/accounts/InGameDateField.tsx`

Props: `{ value: FantasyDate | null; onChange: (v: FantasyDate | null) => void; worldId: string; label?: string; allowReset?: boolean; }`

Interně:
1. `useWorldSettings(worldId)` → `currentInGameDate` (ISO string)
2. `useCalendarConfigs(worldId)` → `configs[]`
3. `getActiveCalendarConfig(configs, settings?.timelineCalendarSlug, world?.defaultCalendarConfigSlug)` → `config | null`
4. Render:
   - Pokud `config` → `<FantasyDatePicker config={config} value={value} onChange={onChange} allowHour={true} />`
   - Jinak → nativní `<input type="datetime-local">` s konverzí na/z FantasyDate (Gregorian wrapper)
5. Pokud `allowReset` → tlačítko „Dnes" → `setValue(parseToFantasyDate(currentInGameDate, config))`

**Nový soubor:** `InGameDateField.module.css` (jednoduchý wrapper styling).

**Nový soubor:** `InGameDateField.spec.tsx` (4-5 testů: default parse, reset tlačítko, fallback Gregorian, onChange propagation).

### Step B4 — Verifikace foundation

```powershell
npm run test:run -- src/features/world/pages/CharacterDetailPage/components/accounts/InGameDateField.spec.tsx
npx tsc --noEmit 2>&1 | grep "characters\.types\|useCharacterAccounts"
```

**Acceptance:** types compile clean, InGameDateField testy ✓.

**Commit FE 1:**
```
feat(finance-8.x-prep): foundation — types, hooks, InGameDateField

- characters.types.ts: FinanceTransaction.inGameDate, CharacterAccount.allowPlayerSelfAdjust
- useCharacterAccounts.ts: useAccountAdjust (novy), addMonthly/transfer/settings rozsireno o inGameDate + flag
- InGameDateField (novy sdileny): reuse FantasyDatePicker + currentInGameDate default + "Dnes" reset
- fallback Gregorian pro svety bez calendar configs
- 5 novych testu InGameDateField

Spec: §4.4 (B4)
```

---

## FÁZE C — Currency integrace + UX entries (commit 2 v FE)

### Step C1 — `<UnknownCurrencyChip>` komponent

**Nový soubor:** `src/features/world/currencies/shared/UnknownCurrencyChip.tsx`

Mini komponent: ⚠ s tooltipem „Měna '{code}' není ve světě". Exportovat z `shared/index.ts` barrelu.

**Nový soubor:** `UnknownCurrencyChip.spec.tsx` + stories.

### Step C2 — FinanceTab currency integrace

**Soubor:** `src/features/world/pages/CharacterDetailPage/components/FinanceTab.tsx`

Změny:
- Import `<CurrencyDisplay>`, `formatCurrency`, `convertAmount`, `useUserPreferredCurrency`, `<UnknownCurrencyChip>` ze `@/features/world/currencies/shared`
- Import `useWorldCurrencies` z `@/features/world/currencies/api`
- Hero balance (`{fmtAmount(account.balance)} {account.currency}`) → `<CurrencyDisplay amount={account.balance} currencyCode={account.currency} items={currencies} />` + `<UnknownCurrencyChip>` pokud neznámá
- Income sum, Expense sum řádky → stejně přes `<CurrencyDisplay>`
- Transaction history rows — částku přes `<CurrencyDisplay amount={t.delta} currencyCode={account.currency} items={currencies} convertTo={preferredCode} />` (tooltip ukáže originál)
- Summary nad účty (řádek 172) — místo per-currency accumulator přidat:
  - `const { resolvedCode } = useUserPreferredCurrency(worldId, currencies);`
  - `const totalInPreferred = accounts.reduce((sum, a) => sum + (convertAmount(a.balance, a.currency, resolvedCode, currencies) ?? 0), 0);`
  - Hlavní řádek: „Celkem: `<CurrencyDisplay amount={totalInPreferred} currencyCode={resolvedCode} items={currencies} />`"
  - Pod ním sbalitelný (collapse) detail per-currency breakdown (existující accumulator)
  - Pokud existuje účet s `currency` ne ve `currencies`, vedle totalu chip „⚠ N účtů s neznámou měnou"

### Step C3 — AccountSwitcher badge

**Soubor:** `src/features/world/pages/CharacterDetailPage/components/accounts/AccountSwitcher.tsx`

- Místo `{account.currency}` → `formatCurrency(account.balance, account.currency, currencies)` util z shared barrelu
- Pokud neznámá měna → fallback (formatCurrency už defensive)

### Step C4 — SettingsAccountSection `<CurrencySelect>`

**Soubor:** `src/features/world/pages/CharacterDetailPage/components/accounts/SettingsAccountSection.tsx`

- Současný `<select>` (řádky 176-193) → `<CurrencySelect value={currency} onChange={setCurrency} items={currencies} />` ze shared barrelu

### Step C5 — Entry rows refaktor (B2 UX)

**Soubor:** `FinanceTab.tsx`

**Extract `<EntryRow>`:**

Nový soubor: `src/features/world/pages/CharacterDetailPage/components/accounts/EntryRow.tsx`
```tsx
<EntryRow
  entry={e}
  currencySymbol={getCurrencySymbol(account.currency, currencies)}
  onChange={...}
  onDelete={...}
/>
```

Interně:
- 2 inputy s visible labels:
  - Levý: `<Input label="Popis" placeholder="např. Nájem, Plat, Daně…" value={e.label} />`
  - Pravý: `<Input label="Částka" type="number" min={0} step={1} value={e.amount} suffix={currencySymbol} />`
- Tlačítko 🗑 napravo

`Input` může potřebovat rozšíření o `suffix` prop. Pokud nemá, custom CSS wrap.

Existující FinanceTab vykreslení entries (sekce „Měsíční příjmy" / „Měsíční výdaje") → `<EntryRow>` x N.

**Helper util** `src/features/world/currencies/shared/getCurrencySymbol.ts`:
```ts
export function getCurrencySymbol(code: string, items: WorldCurrencyItem[]): string {
  return items.find(i => i.code === code)?.symbol?.trim() || code;
}
```
Exportovat z barrelu.

### Step C6 — FE testy commit 2

- `FinanceTab.spec.tsx` rozšíření — hero balance přes CurrencyDisplay, summary preferred, unknown currency chip
- `EntryRow.spec.tsx` (nový) — visible labels, amount type number, suffix render
- `AccountSwitcher.spec.tsx` — pokud existuje, ověřit formatCurrency badge
- `UnknownCurrencyChip.spec.tsx` (nový)
- `getCurrencySymbol.spec.ts` (rozšíření convertAmount.spec? nebo nový soubor)

**Acceptance:** `npm run test:run -- src/features/world/pages/CharacterDetailPage/ src/features/world/currencies/shared/` ✓

**Commit FE 2:**
```
feat(finance-8.x-prep): currency integration + UX entries

- FinanceTab: hero/sum/transaction history pres CurrencyDisplay, summary v preferred currency
- AccountSwitcher: formatCurrency util pro kompaktni badge
- SettingsAccountSection: CurrencySelect ze shared barrelu
- EntryRow extract (FinanceTab): visible labels Popis/Castka + suffix s menou + type=number
- UnknownCurrencyChip novy (warning pro meny ne ve world-currencies)
- getCurrencySymbol util ve shared/
- ~10 novych testu

Spec: §4.1 (B1) + §4.2 (B2 entries)
```

---

## FÁZE D — Modaly + Settings flag + historie (commit 3 v FE)

### Step D1 — `<ConfirmAddMonthlyModal>` (B2 + B4)

**Nový soubor:** `src/features/world/pages/CharacterDetailPage/components/accounts/ConfirmAddMonthlyModal.tsx`

Props: `{ worldId, account, currencies, onClose }`

Obsah:
- Preview delta: `income.sum − expense.sum` přes `<CurrencyDisplay>`
- `<InGameDateField worldId={worldId} value={inGameDate} onChange={setInGameDate} allowReset label="Herní datum" />`
- Pokud delta === 0 → varovná hláška „Není co účtovat. Income i expense jsou nulové."
- Footer: Zrušit / Zaúčtovat (Zaúčtovat disabled pouze pokud submit pending; pro delta=0 dovolí confirm po dialogu)
- Submit: `useAccountAddMonthly.mutate({ inGameDate })` → onSuccess: toast `"Zaúčtováno: {formatCurrency(delta, code, currencies)} ({label})"`

**FinanceTab.tsx změna:** `runAddMonthly()` — místo přímého mutate otevři tento modal.

### Step D2 — `<AdjustBalanceModal>` (B3 + B4)

**Nový soubor:** `src/features/world/pages/CharacterDetailPage/components/accounts/AdjustBalanceModal.tsx`

Props: `{ worldId, account, currencies, onClose }`

Pole:
- Toggle `<ToggleGroup>` Vklad / Výběr (default Vklad)
- `<Input type="number" min={0.01} step={0.01} label="Částka" suffix={currencySymbol} />`
- `<Textarea label="Důvod" maxLength={200} placeholder="např. Nálezeš poklad, Odměna od barona…" required />`
- `<InGameDateField worldId={worldId} value={inGameDate} onChange={setInGameDate} allowReset />`
- Footer: Zrušit / Potvrdit

Submit:
- `amount` × `(mode === 'withdraw' ? -1 : 1)` jako finální delta
- `useAccountAdjust.mutate({ amount: finalDelta, reason, inGameDate })`
- Optimistic update přes hook
- Error → toast s `error.response.data.message`

**Validation:** zod schema (analog 11.4 patternu).

### Step D3 — Settings flag UI

**Soubor:** `SettingsAccountSection.tsx`

Přidat checkbox:
- Label „Povolit hráči-vlastníkovi vlastní vklad/výběr"
- Helper text „Hráči-vlastníkovi povolíš samostatně přidávat nebo odebírat peníze s povinným důvodem. Historie zůstává auditovatelná."
- Visible jen pro PJ+ (existující gate)
- Bound na `account.allowPlayerSelfAdjust`
- Save přes `useUpdateAccountSettings`

### Step D4 — Tlačítko „Vklad/Výběr" v FinanceTab

**Soubor:** `FinanceTab.tsx`

V header (vedle existujícího „Poslat" tlačítka):
```tsx
{(isPJ || (isOwner && account.allowPlayerSelfAdjust)) && (
  <Button onClick={() => setAdjustOpen(true)} size="sm">
    💰 Vklad / Výběr
  </Button>
)}
```

State `const [adjustOpen, setAdjustOpen] = useState(false);` + render `{adjustOpen && <AdjustBalanceModal ... />}`.

### Step D5 — Historie display s in-game datem

**Soubor:** `FinanceTab.tsx` — sekce historie transakcí

Pro každou transakci `t`:
```tsx
<div className={s.txDate} title={`Zapsáno: ${formatDateTime(t.date)}`}>
  {t.inGameDate
    ? <>
        <span className={s.inGameChip}>📅</span>
        {formatFantasyDate(t.inGameDate, activeConfig)}
      </>
    : formatDate(t.date)}
</div>
```

`activeConfig` získán přes `getActiveCalendarConfig(configs, settings?.timelineCalendarSlug, world?.defaultCalendarConfigSlug)`.

### Step D6 — TransferModal in-game datum

**Soubor:** `TransferModal.tsx`

Přidat `<InGameDateField>` před confirm. Submit propaguje do `useAccountTransfer.mutate({ ..., inGameDate })`.

### Step D7 — Testy commit 3

- `ConfirmAddMonthlyModal.spec.tsx` (nový) — preview delta render, inGameDate default, cancel/confirm flow, delta=0 hláška
- `AdjustBalanceModal.spec.tsx` (nový) — vklad/výběr toggle, validace reason, submit volá hook
- `SettingsAccountSection.spec.tsx` rozšíření — flag checkbox PJ-only, save propaguje
- `FinanceTab.spec.tsx` rozšíření — tlačítko Vklad/Výběr visibility podle role+flag, historie s inGameDate render
- `TransferModal.spec.tsx` rozšíření — InGameDateField submit

**Commit FE 3:**
```
feat(finance-8.x-prep): adjust modal + addMonthly modal + history display

- ConfirmAddMonthlyModal: nahrazuje tichy addMonthly mutate, preview delta + InGameDateField
- AdjustBalanceModal: vklad/vyber toggle + povinny reason + InGameDateField
- TransferModal: pridan InGameDateField
- SettingsAccountSection: allowPlayerSelfAdjust checkbox (PJ-only)
- FinanceTab header: tlacitko Vklad/Vyber (visible podle role+flag matrix)
- FinanceTab historie: in-game datum primarne, real-world v tooltipu, chip 📅 marker
- toast s konkretni deltou ("Zauctovano: -15 000 EU (ubytek)")
- ~15 novych testu

Spec: §4.2 (B2 modal) + §4.3 (B3) + §4.4 (B4 propagace)
```

---

## FÁZE E — Verifikace + docs (commit 4 v FE)

### Step E1 — Verifikace FE

```powershell
npm run lint
npm run lint:colors
npm run test:run
npm run build
```

Acceptance: 0 errors (warnings pre-existing OK), build ✓.

### Step E2 — Verifikace BE (po fázi A)

```powershell
cd c:/Matrix/ProjektIkaros/Projekt-ikaros/backend
npx jest src/modules/character-subdocs/
```

### Step E3 — `mobil-desktop` audit

Statická analýza modal CSS — všechny 3 nové modaly (AdjustBalance / ConfirmAddMonthly / InGameDateField wrappery) musí škálovat na 375 px:
- AdjustBalanceModal: vertical stack, toggle Vklad/Výběr full-width na mobilu
- ConfirmAddMonthlyModal: preview + datum + 2 tlačítka
- TransferModal: existující + nový InGameDateField se zařadí

Pokud nález → fix v scope.

### Step E4 — `napoveda` update

**Soubor:** `src/features/ikaros/pages/HelpPage/sections/PagesSection.tsx`

Najít existující entry pro `/svet/:slug/postava/:postava` (Detail postavy) a rozšířit popis sekce Finance:
- Manuální vklad/výběr (PJ + opt-in hráč přes Settings flag)
- In-game datum u všech transakcí (Zaúčtovat měsíc, Poslat, Vklad/Výběr)
- Měna v převodníku (preferenci přebírá ze stránky převodníku 11.4)

**Soubor:** `HelpPage.tsx` lead datum aktualizovat na „11.4 + 8.x-prep" release.

**Soubor:** `src/features/ikaros/pages/HelpPage/sections/FaqSection.tsx` — nová Q&A:
- „Proč moje transakce ukazují herní datum, ne dnešní?" — odpověď

### Step E5 — Roadmap update

**Soubor:** `docs/roadmap-fe.md`

Najít fázi 8 a přidat poznámku k 8.x-prep:
```md
### - [x] 8.x-prep — Finance polish + currency + adjust + in-game datum ✅ (2026-05-26)

**Spec:** docs/arch/phase-8/spec-8.x-prep-finance-currency.md
**Plán:** docs/arch/phase-8/plan-8.x-prep-finance-currency.md

Mezikrok mezi 11.4 (currency platform) a 8.0 (character finance MVP). Cíl:
- (B1) FinanceTab konzumuje shared currency vrstvu z 11.4 jako první mimo-currency konzument
- (B2) UX fix Zaúčtovat měsíc: visible labels Popis/Částka, suffix symbolu měny, ConfirmDialog při delta=0, toast s konkrétní deltou
- (B3) Nový BE endpoint POST /accounts/:id/adjust + allowPlayerSelfAdjust flag (PJ+ vždy, hráč jen s flagem; povinný reason)
- (B4) In-game datum u všech transakcí (Zaúčtovat měsíc, Transfer, Adjust); reuse FantasyDatePicker + currentInGameDate default; legacy transakce fallback na real-world

…
```

### Step E6 — Případné dluhy do `dluhy.md`

Pokud něco vyskočí (např. ESLint pravidlo na hluboké importy do `currencies/shared`), zapsat jako D-XXX. Jinak skip.

**Commit FE 4:**
```
docs(finance-8.x-prep): roadmap + napoveda + faq update

- roadmap-fe.md: nova polozka 8.x-prep ✅ s plnym shrnutim 4 sub-cilu
- napoveda PagesSection: Detail postavy → Finance rozsireno o vklad/vyber + in-game datum
- napoveda HelpPage lead datum aktualizovan
- napoveda FaqSection: nove Q&A "Proc moje transakce ukazuji herni datum"

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

---

## Závěrečný checklist

- [ ] BE testy ✓ (existující + 7 nových)
- [ ] FE lint 0 errors
- [ ] FE lint:colors 0 nových hardcoded barvy v 8.x-prep souborech
- [ ] FE test:run ✓ (full suite + ~30 nových testů)
- [ ] FE build ✓
- [ ] Smoke 1: PJ klik Vklad/Výběr → modal → submit → balance += amount, historie obsahuje reason + in-game datum
- [ ] Smoke 2: Settings → checkbox flag → save → hráč-vlastník vidí tlačítko Vklad/Výběr
- [ ] Smoke 3: Hráč bez flag → tlačítko skryté
- [ ] Smoke 4: Zaúčtovat měsíc → modal → preview delta + datum → confirm → transakce s inGameDate
- [ ] Smoke 5: Měsíční entry řádek má labels „Popis" + „Částka", amount suffix se symbolem
- [ ] Smoke 6: Účet s currency='EU' (ne ve world-currencies) → ⚠ chip + tooltip
- [ ] Smoke 7: Změna preferred currency v 11.4 → summary financí v nové měně
- [ ] Smoke 8: Legacy transakce bez inGameDate → fallback na real-world datum
- [ ] Smoke 9: Mobil 375 px — všechny 3 modaly funkční, žádný horizontální scroll
- [ ] `mobil-desktop` audit (statický nebo screenshot)
- [ ] `napoveda` aktualizována
- [ ] `roadmap-fe.md` 8.x-prep zaškrtnuto
- [ ] BE restart po patchi proběhl před smoke testy

---

## Commit strategie — souhrn

| # | Repo | Po Step | Scope | ~LOC |
|---|------|---------|-------|------|
| 1 | BE | A8 | schema + interface + DTO + service + controller + 7 testů | ~250 |
| 2 | FE | B4 | types + hooks + `<InGameDateField>` + 5 testů | ~200 |
| 3 | FE | C6 | currency integrace + entry rows + chip + 10 testů | ~300 |
| 4 | FE | D7 | 2 nové modaly + Settings flag + historie + 15 testů | ~350 |
| 5 | FE | E6 | roadmap + nápověda + faq | ~50 |

**Celkem ~1150 LOC** (vs. odhad spec ~900 — větší kvůli testům).
**Odhad času:** ~5–6 h aktivního kódování.
