# Plán 8.6 — Finance multi-účet + transfer + měny + shared

**Stav:** 📝 návrh — čeká na schválení
**Spec:** [spec-8.6-finance-multi-account.md](spec-8.6-finance-multi-account.md)
**Datum:** 2026-05-24

---

## Rozhodnutí z Q8.1–Q8.8 (potvrzeno autorem)

| # | Téma | Rozhodnutí |
|---|------|------------|
| Q8.1 | Měny — embed nebo collection | **Embed ve `WorldSettings.currencies[]`** (CRUD UI počká na 11.4) |
| Q8.2 | Smazání postavy se shared účtem | Primary přejde na dalšího co-owner; pokud zbyl jediný = mazaná → účet se smaže |
| Q8.3 | Transfer cizí postavě | **Instant doručení** (žádný akcept-flow); soft notifikace = dluh do dalšího kroku |
| Q8.4 | Currency picker prázdný | Disabled „Nový účet" + hláška „PJ musí nastavit měny ve WorldSettings" |
| Q8.5 | Spoluvlastníci napříč světy | NE — jen v rámci 1 světa |
| Q8.6 | Limit účtů per postava | **20** |
| Q8.7 | „Vedeno u" picker | Všechny typy postav (PC + NPC + Lokace) |
| Q8.8 | Měsíční bilance → mínus | **Povoleno** (dluh = hráčská situace, žádná blokace) |

---

## 1. Rozsah a pořadí

### Pořadí kroků (15 fází, ~10 h práce)

```
A) BE: WorldSettings.currencies[] embed + DTO + migrace defaultů          (30 min)
B) BE: CharacterAccountSchema + Repository + interfaces                   (40 min)
C) BE: CharacterAccountsService — CRUD + addMonthly + undo                (60 min)
D) BE: CharacterAccountsService — transfer (Mongo session atomic)         (45 min)
E) BE: CharacterAccountsService — addCoOwner / removeCoOwner              (30 min)
F) BE: Controller — 9 endpointů + permissions guard                       (60 min)
G) BE: Migrační skript `finance-multi-account.ts` + idempotent guard      (45 min)
H) BE: CharacterFinance zúžení na kontejner + lazy resolve accounts       (30 min)
I) BE: Convert + Delete event handlers (cleanup shared account)           (30 min)
J) BE: Testy — 30+ nových (CRUD, transfer, atomicita, permissions)        (90 min)

K) FE: typy + API hooky (`useCharacterAccounts`, mutations)               (45 min)
L) FE: FinanceTab refactor — account switcher + příjmy/výdaje split       (90 min)
M) FE: TransferModal + Picker postavy/účtu                                (75 min)
N) FE: SettingsAccountSection (PJ-only) + Co-owner picker                 (60 min)
O) FE: aktualizace testů (FinanceTab + nové specs pro Transfer + Settings)  (60 min)

P) mobil-desktop audit + lint + roadmap + nápověda                        (30 min)
```

### Rozdělení do commit dávek

Commity na `main` (per [feedback_work_on_main.md](.../memory/feedback_work_on_main.md)):

1. **BE foundation** (A+B+H) — schémata + kontejner, zatím nic neláme
2. **BE service core** (C+D+E) — CRUD + transfer + co-owners
3. **BE controller + permissions** (F)
4. **BE migrace + cleanup events** (G+I) — migrate-up runable
5. **BE testy** (J)
6. **FE typy + hooky** (K)
7. **FE FinanceTab refactor** (L)
8. **FE Transfer + Settings + Co-owner** (M+N)
9. **FE testy** (O)
10. **Audit + docs** (P)

---

## 2. BE detail

### 2.1 WorldSettings měny (Krok A)

Rozšířit `WorldSettingsSchemaClass`:

```ts
@Prop({ type: [Object], default: [] })
currencies: WorldCurrencyEmbed[];

interface WorldCurrencyEmbed {
  code: string;     // 'zl'
  name: string;     // 'Zlatý'
  symbol: string;   // '✦'
  isBase: boolean;
  rate: number;     // pro 11.4b převodník, zatím jen storage
  order: number;
}
```

DTO `UpdateWorldSettingsDto` přidá `currencies?: WorldCurrencyEmbed[]`. Plnohodnotný CRUD UI **v této fázi NE** — admin tab si můžou ručně setnout přes API (nebo přes generický `WorldSettingsEditor` v admin panelu pokud existuje).

⚠️ **Defaulty:** Při vzniku světa BE nasadí 1 default currency `{ code: 'zl', name: 'Zlatý', symbol: '✦', isBase: true, rate: 1, order: 0 }`. PJ může editovat ve `WorldSettings`.

→ Spustí se to v `WorldsService.create()` — doplnit. Nebo eventem `world.created`.

### 2.2 CharacterAccount schema (Krok B)

```ts
@Schema({ timestamps: true, collection: 'character_accounts' })
export class CharacterAccountSchemaClass {
  @Prop({ required: true }) worldId: string;
  @Prop({ required: true }) label: string;
  @Prop({ type: [String], required: true }) ownerCharacterIds: string[];
  @Prop({ required: true }) primaryOwnerId: string;
  @Prop({ default: 'Osobní' }) accountType: string;
  @Prop({ type: Object, default: null }) accessLocation: AccessLocationRef | null;
  @Prop({ required: true }) currency: string;
  @Prop({ default: 0 }) balance: number;
  @Prop({ type: [Object], default: [] }) incomeEntries: Record<string, unknown>[];
  @Prop({ type: [Object], default: [] }) expenseEntries: Record<string, unknown>[];
  @Prop({ type: [Object], default: [] }) transactions: Record<string, unknown>[];
  @Prop({ default: '' }) notes: string;
}

// Indexy
CharacterAccountSchema.index({ worldId: 1, ownerCharacterIds: 1 });
CharacterAccountSchema.index({ primaryOwnerId: 1 });
```

Repository `CharacterAccountRepository`:
- `findById(id, session?)`
- `findByOwnerCharacterId(characterId)` — vše kde character v `ownerCharacterIds`
- `findByWorldId(worldId)`
- `create(input)`
- `update(id, patch, session?)`
- `appendTransaction(id, tx, session?)` — atomický `$push transactions + $inc balance`
- `delete(id)`

### 2.3 CharacterAccountsService (Krok C+D+E)

Konstruktor: inject `accountsRepo`, `charactersRepo` (pro permission check), `worldSettingsRepo` (currency validation), `connection` (pro session).

**Transfer atomicita** (Krok D):

```ts
async transfer(input: TransferInput, performedByUserId: string) {
  const session = await this.connection.startSession();
  try {
    await session.withTransaction(async () => {
      const from = await this.accountsRepo.findById(input.fromAccountId, session);
      const to = await this.accountsRepo.findById(input.toAccountId, session);
      if (!from || !to) throw new NotFoundException({ code: 'ACCOUNT_NOT_FOUND' });
      if (from.currency !== to.currency)
        throw new BadRequestException({ code: 'CURRENCY_MISMATCH' });
      if (input.amount <= 0)
        throw new BadRequestException({ code: 'AMOUNT_INVALID' });
      // Q8.8 — povolujeme mínus, žádná insufficient-funds blokace.

      const now = new Date();
      const txOut = { id: randomUUID(), date: now, delta: -input.amount, description: input.description, transferRef: { counterpartyAccountId: to.id, counterpartyCharacterId: to.primaryOwnerId, direction: 'out' }, performedByUserId };
      const txIn = { id: randomUUID(), date: now, delta: input.amount, description: input.description, transferRef: { counterpartyAccountId: from.id, counterpartyCharacterId: from.primaryOwnerId, direction: 'in' }, performedByUserId };

      await Promise.all([
        this.accountsRepo.appendTransaction(from.id, txOut, session),
        this.accountsRepo.appendTransaction(to.id, txIn, session),
      ]);
    });
    return await Promise.all([
      this.accountsRepo.findById(input.fromAccountId),
      this.accountsRepo.findById(input.toAccountId),
    ]).then(([from, to]) => ({ from, to }));
  } finally {
    await session.endSession();
  }
}
```

📚 *`session.withTransaction(cb)` je Mongoose helper — buď celý callback projde a commit, nebo se vyhodí chyba a rollback. Žádný „peníze v cestě".*

### 2.4 Permission guards (Krok F)

Nový helper `CharacterAccountsService.assertAccess(accountId, requesterId, action)`:
- `read` — owner, co-owner, PomocnyPJ+
- `write-content` (label, notes, entries) — owner, co-owner, PomocnyPJ+
- `write-settings` (accountType, accessLocation, currency, co-owners) — **PomocnyPJ+ only** (Q8.4)
- `delete` — primary owner, PomocnyPJ+
- `transfer-from` — owner, co-owner, PomocnyPJ+

Controller endpointy v `AccountsController` (separátní od `CharacterSubdocsController`):
```
@Controller('worlds/:worldId')
```

S routami dle specu §3.5.

### 2.5 Convert + Delete handlers (Krok I)

**`character.deleted` event handler** — pokud postava byla:
- **primary owner** účtu → transfer primary na dalšího co-owner (next v poli); pokud zbyl jen mazaná → smazat účet
- **co-owner** účtu → remove z `ownerCharacterIds`

**`character.converted` event handler (PC↔NPC)** — beze změny vlastnictví (NPC i Lokace mohou mít účty per 8.1-FIR).

### 2.6 Migrace (Krok G)

`backend/src/migrations/2026-05-24-finance-multi-account.ts`:

```ts
export async function up(connection: Connection) {
  const finances = await FinanceModel.find({}).lean();
  for (const fin of finances) {
    // Idempotent guard
    const existing = await AccountModel.findOne({ primaryOwnerId: fin.characterId });
    if (existing) continue;

    const character = await CharacterModel.findById(fin.characterId);
    if (!character) continue;

    const incomeEntries = fin.entries.filter(e => e.amount >= 0);
    const expenseEntries = fin.entries.filter(e => e.amount < 0).map(e => ({ ...e, amount: Math.abs(e.amount) }));

    await AccountModel.create({
      worldId: character.worldId,
      label: 'Hlavní účet',
      ownerCharacterIds: [fin.characterId],
      primaryOwnerId: fin.characterId,
      accountType: fin.accountType || 'Osobní',
      accessLocation: null,  // free text se nemigruje na characterRef; PJ doplní
      currency: fin.currency || 'zl',
      balance: fin.balance,
      incomeEntries,
      expenseEntries,
      transactions: fin.transactions,
      notes: fin.notes || '',
    });

    // Vyčistit staré fields na CharacterFinance (zachovat doc jako kontejner).
    await FinanceModel.updateOne(
      { _id: fin._id },
      { $unset: { accountType: '', accessLocation: '', currency: '', balance: '', entries: '', transactions: '', notes: '' } },
    );
  }
}
```

Spustit `npm run migrate:up` ručně. Backup v migration README.

---

## 3. FE detail

### 3.1 Typy + hooky (Krok K)

`characters.types.ts`:
- `CharacterAccount` — viz spec §2.1
- `AccountTransferInput`, `CreateAccountInput`, `UpdateAccountInput`
- `CharacterFinance` zúžit: `{ id, characterId, isHidden, accounts: CharacterAccount[], totalBalanceByCurrency, updatedAt }`

`useCharacterAccounts(worldId, slug)` — query: `GET /characters/:slug/accounts`
`useAccount(worldId, accountId)` — query: `GET /accounts/:id`
Mutations:
- `useCreateAccount(worldId, slug)`
- `useUpdateAccount(worldId, accountId)`
- `useDeleteAccount(worldId, accountId)`
- `useAccountAddMonthly(worldId, accountId)`
- `useAccountUndo(worldId, accountId)`
- `useAccountTransfer(worldId, accountId)` — invaliduje cache obou účtů + invalidate finance summary
- `useAccountAddCoOwner` / `useAccountRemoveCoOwner`

`useWorldCurrencies(worldId)` — query čte `WorldSettings.currencies[]`.

### 3.2 FinanceTab refactor (Krok L)

Struktura:
```tsx
function FinanceTabView({ page, data }) {
  const [activeAccountId, setActiveAccountId] = useState(data.accounts[0]?.id);
  const activeAccount = data.accounts.find(a => a.id === activeAccountId);

  return (
    <div className={s.financeShell}>
      <div className={s.financeMain}>
        {data.accounts.length > 1 && <SummaryBanner totals={data.totalBalanceByCurrency} />}
        <AccountSwitcher
          accounts={data.accounts}
          activeId={activeAccountId}
          onChange={setActiveAccountId}
          onCreate={...} // open create modal
        />
        {activeAccount && <AccountView account={activeAccount} page={page} />}
      </div>
      <FinanceAside page={page} account={activeAccount} />
    </div>
  );
}

function AccountView({ account, page }) {
  return (
    <>
      <HeroCard account={account} />          {/* badges + balance + split */}
      <ActionBar account={account} />          {/* Poslat / Zaúčtovat měsíc / Vrátit */}
      <IncomeExpenseSection account={account} />
      <TransactionsSection account={account} />
      {account.notes?.trim() && <NotesCard notes={account.notes} />}
      <SettingsAccountSection account={account} />  {/* PJ-only edit, dole */}
    </>
  );
}
```

**HeroCard:** badges + `account.balance` + split příjmy (`Σ incomeEntries`) / výdaje (`Σ expenseEntries`).

**AccountSwitcher:**
- `accounts.length <= 4` → horizontální tabs s `account.label`
- `accounts.length > 4` → dropdown
- `[+ Nový účet]` button → CreateAccountModal

**ActionBar:** 3 tlačítka — `Poslat` (otevře TransferModal), `Zaúčtovat měsíc`, `Vrátit transakci`.

### 3.3 TransferModal (Krok M)

```tsx
function TransferModal({ fromAccount, onClose }) {
  const [targetSlug, setTargetSlug] = useState<string>();
  const [targetAccountId, setTargetAccountId] = useState<string>();
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState('');

  const characters = useCharacterDirectory(worldId);
  const targetAccounts = useCharacterAccounts(worldId, targetSlug, { enabled: !!targetSlug });

  const canSubmit =
    targetAccountId && amount > 0
    && targetAccounts.data?.find(a => a.id === targetAccountId)?.currency === fromAccount.currency;

  return <Modal>
    <CharacterPicker characters={characters.data} onSelect={setTargetSlug} />
    {targetSlug && <AccountPicker accounts={targetAccounts.data} onSelect={setTargetAccountId} />}
    <input type="number" value={amount} onChange={...} />
    <input placeholder="Popis" value={description} onChange={...} />
    {!canSubmit && targetAccountId && <p className={s.warn}>Účty musí mít stejnou měnu.</p>}
    <button disabled={!canSubmit} onClick={runTransfer}>Poslat</button>
  </Modal>;
}
```

### 3.4 SettingsAccountSection (Krok N)

PJ-only (read-only pro vlastníky, edit-only pro PomocnyPJ+):

```tsx
function SettingsAccountSection({ account, page }) {
  const { userRole } = useWorldContext();
  const isPJ = (userRole ?? -1) >= WorldRole.PomocnyPJ;

  if (!isPJ) {
    // Read-only view
    return <SettingsView account={account} />;
  }

  return (
    <section className={s.settingsCard}>
      <h3>Nastavení účtu (jen PJ)</h3>
      <AccountTypeSelect ... />
      <AccessLocationPicker characters={characters.data} value={account.accessLocation?.characterId} ... />
      <CurrencySelect currencies={worldCurrencies.data} value={account.currency} ... />
      <CoOwnerList accountId={account.id} owners={account.ownerCharacterIds} primaryId={account.primaryOwnerId} />
      <DangerButton onClick={openDeleteConfirm}>Smazat účet</DangerButton>
    </section>
  );
}
```

---

## 4. Testy

**BE — minimum 30 nových testů:**

| Téma | Počet |
|------|-------|
| AccountsRepo CRUD | 5 |
| AccountsService createAccount | 3 |
| AccountsService updateAccount permissions | 4 |
| AccountsService transfer (happy + atomicita + currency mismatch + amount invalid + permissions) | 6 |
| AccountsService addMonthly (income−expense bilance) | 3 |
| AccountsService addCoOwner / remove | 4 |
| Migrace — 3 fixture characters | 1 |
| Convert + Delete handlers cleanup | 3 |
| Permission gating per endpoint | 5 |

**FE — minimum 15 nových:**

| Téma | Počet |
|------|-------|
| FinanceTab account switcher | 3 |
| Summary banner per-currency | 2 |
| HeroCard balance + split příjmy/výdaje | 2 |
| TransferModal flow (picker → submit) | 4 |
| Currency mismatch validace | 1 |
| SettingsAccountSection PJ-only gating | 2 |
| Co-owner picker add/remove | 1 |

---

## 5. Risk register

| # | Riziko | Mitigace |
|---|--------|----------|
| R1 | Mongo replica set chybí v dev → transakce padají | Ověřit ve `docker-compose.yml`. Pokud single-node, doplnit `--replSet` + `rs.initiate()`. |
| R2 | Migrace na velkém setu pomalá | Loop přes `find().lean()` je OK pro <10k dokumentů. Pro větší v batchích. |
| R3 | UI s 20 účty zahlcené | Limit 20 (Q8.6) + switcher = dropdown nad 4. |
| R4 | Currency picker prázdný při migraci | Default `'zl'` v migraci + auto-vytvoření default `WorldCurrency` při migraci (idempotent). |
| R5 | Shared účet — co když primary převede vlastnictví dalšímu, ale chce sám zůstat co-owner | Endpoint `transferPrimaryOwnership(accountId, newPrimaryId)` — out-of-scope 8.6, dluh. |
| R6 | Audit kdo přidal transakci ve shared účtu | `performedByUserId` v transakci řeší. UI: malý text „Provedl: @username" pod transakcí. |
| R7 | FE invalidace cache po transferu | TanStack Query `invalidate` na obě query keys (oba účty + finance summary). |

---

## 6. Akceptační kritéria

1. **Migrace** — existující postavy s Finance subdocem dostanou 1 účet „Hlavní účet" s odpovídajícími daty (entries rozdělené income/expense, balance/transactions/notes zachované).
2. **Multi-účet** — postava může mít 1–20 účtů, přepínání v UI, summary banner pro multi-currency.
3. **Příjmy + výdaje** symetricky, „Zaúčtovat měsíc" = `Σ income − Σ expense`.
4. **Transfer** mezi 2 účty atomicky, currency mismatch blok, popis v transakci, audit `performedByUserId`.
5. **Měny** — `WorldSettings.currencies[]` field; default 'zl' Zlatý při vzniku světa; CRUD UI = TBD v 11.4.
6. **PJ-only settings** — accountType / accessLocation / currency / co-owners jen pro PomocnyPJ+.
7. **„Vedeno u"** — picker postavy (vše PC/NPC/Lokace), default = primary owner.
8. **Sdílené účty** — `ownerCharacterIds[]` ≥ 1, co-owner picker, smazání postavy = primary přejde dál.
9. **Mobile audit** prošel.
10. **BE 1401 testů + 30 nových = 1431+ zelených. FE 1018 + 15 = 1033+ zelených.**

---

## 7. Po dokončení

- Roadmap-fe.md — nová fáze 8.6 zaškrtnutá; v 11.4 poznámka „11.4a CRUD UI nad existujícím embed field" + 11.4b převodník.
- HelpPage (`napoveda`) — Detail postavy aktualizovat: multi-účet, transfer, shared accounts.
- `docs/dluhy.md` (pokud existuje) — zapsat:
  - **D-8.6-1** — transferPrimaryOwnership endpoint (R5)
  - **D-8.6-2** — Notifikace příjemce transferu (Q8.3 dluh)
  - **D-8.6-3** — Migrace `accessLocation` z free textu na characterRef (PJ ručně doplní; nebo skript s heuristikou)
- Měn CRUD UI (11.4) zůstává nedořešen — read-side se vytahuje v 8.6.

---

## 8. Otevřené body k potvrzení před začátkem kódování

Q8.1–Q8.8 už zodpovězeny (sekce 1 nahoře). **Žádné nové otevřené body** — plán pojede dle specu 8.6 v plné podobě.

Pokud autor potvrdí, jedu na to. Start: krok A (BE WorldSettings.currencies + defaulty).
