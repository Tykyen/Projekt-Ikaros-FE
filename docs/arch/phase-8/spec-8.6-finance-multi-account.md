# Spec 8.6 — Finance: multi-účet + transfers + měny + sdílené účty

**Stav:** 📝 návrh — čeká na schválení
**Datum:** 2026-05-24
**Závisí na:** 8.1c (single Finance), 8.1-FIR (Matrix redesign + lazy-create), 8.2 (CharacterDirectory pro picker)
**Předjímá:** 11.4 (Správa měn světa) — minimální subset (seznam měn bez převodníku) se vytahuje sem
**Typ:** velká rozšiřovací fáze nad existující Finance subdoc

---

## 1. Cíl

Posunout Finance postavy z jednoduchého „1 účet = 1 zůstatek" na realistický finanční modul:

1. **Více účtů na postavu** s vlastní bilancí, příjmy, výdaji, transakcemi.
2. **Měsíční výdaje** symetricky k příjmům (`expenseEntries[]`).
3. **Transfer** peněz mezi účty / postavami (peer-to-peer).
4. **Měny světa** ze seznamu (předjímka 11.4) — `currency` enum místo free textu.
5. **Vedeno u** = reference na postavu (default vlastník PC, lze měnit) — nahrazuje free text `accessLocation`.
6. **PJ-only nastavení** typu účtu (`accountType` enum) přesunuto do „Nastavení účtu" sekce dole.
7. **Sdílené účty** — účet může vlastnit více postav (společný měšec partyzánské skupiny, rodinný účet, atd.).

Mimo cíl:
- Plný převodník měn (krok 11.4 v plné podobě) — sem jen seznam měn.
- Šeky / dlužní úpisy / úvěry / fixed deposit.
- Multi-currency účty (jeden účet = jedna měna).
- Audit log na úrovni admin panelu (BE drží `transactions[]` jako lehký audit per účet).

---

## 2. Data model

### 2.1 Nový subdoc `CharacterAccount` (BE collection `character_accounts`)

```ts
interface CharacterAccount {
  id: string;
  worldId: string;
  label: string;             // „Osobní účet", „Společný měšec", „Tajný fond"
  ownerCharacterIds: string[]; // 1+ vlastníků; jeden z nich má isPrimary
  primaryOwnerId: string;      // pro UX default; v UI se zobrazí jako „Vedeno u"
  accountType: string;        // enum: 'Osobní' | 'Společný' | 'Tajný' | ... (PJ-řízený)
  accessLocation: {            // „Vedeno u" — referenceCharacterId (postava/lokace)
    type: 'character';
    characterId: string;       // typicky Lokace (banka) nebo NPC (správce)
  } | null;
  currency: string;            // enum z seznamu měn světa (kód)
  balance: number;             // derived ze sum transactions, ale cached pro rychlost
  incomeEntries: FinanceEntry[];   // měsíční pravidelné příjmy
  expenseEntries: FinanceEntry[];  // měsíční pravidelné výdaje
  transactions: FinanceTransaction[];
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

interface FinanceEntry {
  id: string;
  label: string;
  amount: number; // vždy kladné, sign odvozený z pole (income vs expense)
}

interface FinanceTransaction {
  id: string;
  date: Date;
  delta: number;               // +/− v měně účtu
  description: string;
  /** Pokud transakce vznikla transferem, drží druhou stranu. */
  transferRef?: {
    counterpartyAccountId: string;
    counterpartyCharacterId: string;
    direction: 'in' | 'out';
  };
  /** Kdo akci provedl (userId) — pro shared účty audit. */
  performedByUserId: string;
}
```

### 2.2 `CharacterFinance` → kontejner

```ts
interface CharacterFinance {
  id: string;
  characterId: string;
  isHidden: boolean;
  /** Účty, které postava vlastní nebo spoluvlastní. Resolved z accountsRepo. */
  accounts: CharacterAccount[];
  /** Sum balance přes všechny účty (pro hero karta — případně per-currency). */
  totalBalanceByCurrency: Record<string, number>;
  updatedAt?: Date;
}
```

Stará pole (`accountType`, `accessLocation`, `currency`, `balance`, `entries`, `transactions`, `notes`) se z `CharacterFinance` **odstraní** a přesunou do per-account modelu.

### 2.3 Migrace existujících financí

BE migrační skript `2026-05-24-finance-multi-account.ts`:
1. Pro každý `CharacterFinance` doc vytvoř 1 `CharacterAccount` s `label: 'Hlavní účet'`, `primaryOwnerId = characterId`, `ownerCharacterIds: [characterId]`, ostatní pole zkopíruj.
2. `entries[]` rozděl: `amount > 0` → `incomeEntries`, `amount < 0` → `expenseEntries` (abs hodnota).
3. `CharacterFinance` dokument vyčisti (jen kontejner fields).

📚 *Migrace běží jednorázově při startu (idempotentní guard). Bez dopadu na existující data — jen restructure.*

### 2.4 Nová `WorldCurrency` (předjímka 11.4)

Minimální subset BE `world_currencies` collection:

```ts
interface WorldCurrency {
  id: string;
  worldId: string;
  code: string;     // 'zl', 'kr', 'gp', ...
  name: string;     // „Zlatý", „Stříbrná krejcar"
  symbol: string;   // '✦', 'gp'
  isBase: boolean;  // první měna = základ (rate 1.0)
  rate: number;     // 1.0 pro base; ostatní relativně. Pole připraveno pro 11.4b převodník, zatím jen storage.
  order: number;
}
```

**11.4a (CRUD měn)** se předjímá v rámci 8.6 jako BE-only subset:
- Endpointy: `GET .../currencies`, `POST/PATCH/DELETE` (jen PJ+).
- FE: jen vyhledávání v selectu při založení účtu, **bez UI pro CRUD** (to zůstává plně v 11.4).
- Genre-seed při vzniku světa (`worldGenre → defaultCurrencies`) — odsunuto na 11.4.

⚠️ Doporučuju 8.6 nepředjet CRUD UI — to natáhne fázi. Místo toho **vytvořit „base currency" world-settings field** (string `baseCurrencyCode + symbol + name`) jako lightweight stub. PJ ho nastaví ve `WorldSettings`. Plný CRUD příjde v 11.4.

→ **Otevřená otázka 8.1.**

---

## 3. BE změny

### 3.1 Schémata + interfaces + repos

- Nová schema `CharacterAccountSchemaClass` + `CharacterAccountRepository`.
- `CharacterFinanceSchema` zúžit na kontejner; staré pole odstranit po migraci.
- `WorldCurrencySchemaClass` + repo (nebo lightweight world-settings field — viz Q8.1).

### 3.2 Service `CharacterAccountsService`

```ts
class CharacterAccountsService {
  // Per-postava list účtů (kde je vlastník nebo spoluvlastník).
  async listAccountsForCharacter(characterId: string): Promise<CharacterAccount[]>;

  async createAccount(input: CreateAccountInput): Promise<CharacterAccount>;
  async updateAccount(accountId: string, input: UpdateAccountInput): Promise<CharacterAccount>;
  async deleteAccount(accountId: string): Promise<void>;

  // Měsíční zaúčtování — sum(incomeEntries) - sum(expenseEntries), zapíše 1 transakci.
  async addMonthly(accountId: string): Promise<CharacterAccount>;
  async undoLast(accountId: string): Promise<CharacterAccount>;

  // Transfer mezi účty (vlastní postavy nebo cizí).
  async transfer(input: TransferInput): Promise<{ from: CharacterAccount; to: CharacterAccount }>;

  // Sdílení účtu — přidání/odebrání spoluvlastníka.
  async addCoOwner(accountId: string, characterId: string): Promise<CharacterAccount>;
  async removeCoOwner(accountId: string, characterId: string): Promise<CharacterAccount>;
}
```

### 3.3 Transfer atomicita

Transfer mezi 2 účty musí být atomický — buď oba updates projdou, nebo žádný. Mongoose nemá nativní transakce bez replica set, ale Ikaros má MongoDB s replica set (BE infra). Použít `session.startTransaction()`:

```ts
async transfer({ fromAccountId, toAccountId, amount, description, performedByUserId }: TransferInput) {
  const session = await this.connection.startSession();
  try {
    session.startTransaction();
    const [from, to] = await Promise.all([
      this.accountsRepo.findById(fromAccountId, session),
      this.accountsRepo.findById(toAccountId, session),
    ]);
    if (!from || !to) throw NotFoundException();
    if (from.currency !== to.currency) throw BadRequestException('CURRENCY_MISMATCH');
    if (from.balance < amount) throw BadRequestException('INSUFFICIENT_FUNDS');

    const txId1 = randomUUID();
    const txId2 = randomUUID();
    const now = new Date();

    await Promise.all([
      this.accountsRepo.appendTransaction(fromAccountId, {
        id: txId1, date: now, delta: -amount, description,
        transferRef: { counterpartyAccountId: toAccountId, counterpartyCharacterId: to.primaryOwnerId, direction: 'out' },
        performedByUserId,
      }, session),
      this.accountsRepo.appendTransaction(toAccountId, {
        id: txId2, date: now, delta: +amount, description,
        transferRef: { counterpartyAccountId: fromAccountId, counterpartyCharacterId: from.primaryOwnerId, direction: 'in' },
        performedByUserId,
      }, session),
    ]);
    await session.commitTransaction();
    return { from: { ...from, balance: from.balance - amount }, to: { ...to, balance: to.balance + amount } };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  }
}
```

📚 *„Atomicita" = buď všechno (oba účty se aktualizují), nebo nic (oba zůstanou nedotčené). Žádná situace „peníze zmizely z A ale neobjevily se na B".*

### 3.4 Permission (kdo má přístup)

| Akce | Kdo |
|------|-----|
| List účtů postavy | PJ, PomocnyPJ, vlastník postavy, **spoluvlastník účtu** (přes member-of) |
| Vytvořit účet | PJ, vlastník postavy |
| Upravit `label`, `notes`, `entries` | Vlastníci účtu (`ownerCharacterIds`), PJ |
| Upravit `accountType`, `accessLocation`, `currency` | **Jen PJ** (per F4) |
| Smazat účet | PJ, primary owner (s confirm pokud má transakce) |
| Transfer | Vlastníci zdrojového účtu, PJ |
| Add/remove co-owner | PJ, primary owner |

⚠️ Sdílený účet — pokud uživatel je vlastník postavy A, která je spoluvlastník účtu X (primary owner je postava B), pak A vidí účet X v listu A's účtů a může s ním provádět akce dle své role.

### 3.5 Controller endpointy

```
GET    /worlds/:worldId/characters/:slug/accounts             — list účtů postavy
POST   /worlds/:worldId/characters/:slug/accounts             — vytvořit nový účet
GET    /worlds/:worldId/accounts/:accountId                   — detail účtu
PATCH  /worlds/:worldId/accounts/:accountId                   — update (label, notes, entries, ...)
DELETE /worlds/:worldId/accounts/:accountId                   — smazat účet
POST   /worlds/:worldId/accounts/:accountId/add-monthly       — zaúčtovat měsíc
POST   /worlds/:worldId/accounts/:accountId/undo              — vrátit poslední transakci
POST   /worlds/:worldId/accounts/:accountId/transfer          — { toAccountId, amount, description }
POST   /worlds/:worldId/accounts/:accountId/co-owners         — { characterId } — přidat spoluvlastníka
DELETE /worlds/:worldId/accounts/:accountId/co-owners/:cid    — odebrat spoluvlastníka

GET    /worlds/:worldId/currencies                            — list měn světa (8.6 = read-only, CRUD v 11.4)
```

Existující `GET /worlds/:worldId/characters/:slug/finance` zůstane backward-compatible — vrátí kontejner s nested `accounts[]`, ne staré pole. FE-only změna.

---

## 4. FE změny

### 4.1 FinanceTab redesign 2.0

**Account switcher v hero karta:**

```
┌─ Hero karta ─────────────────────────────────────────────┐
│ [Účet ▾] [+ Nový účet]                                   │
│  ━━━ Osobní účet ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━           │
│  Aktuální zůstatek                                       │
│  12 450 ✦                                                │
│                                                          │
│  ┌─ Příjmy ───────────┐  ┌─ Výdaje ─────────────┐       │
│  │  + 3 200 ✦         │  │  − 1 800 ✦           │       │
│  └────────────────────┘  └──────────────────────┘       │
│                                                          │
│  [💸 Poslat] [📅 Zaúčtovat měsíc] [↶ Vrátit transakci]  │
└──────────────────────────────────────────────────────────┘
```

- **Account switcher** = dropdown nebo horizontální tab list (max 5+ účtů → dropdown).
- **Summary banner** nad switcherem: `Celkem ✦ 18 450` (sum přes všechny účty v base měně) — jen pokud `accounts.length > 1`.

**Seznam příjmů + výdajů paralelně:**

```
┌─ Měsíční příjmy ────────────┐  ┌─ Měsíční výdaje ──────────┐
│  Plat        + 2 500 ✦      │  │  Bydlení    − 800 ✦       │
│  Renty       +   700 ✦      │  │  Strava     − 600 ✦       │
│  [+ Přidat příjem]          │  │  Pojištění  − 400 ✦       │
└─────────────────────────────┘  │  [+ Přidat výdaj]         │
                                 └───────────────────────────┘
```

**„Poslat" modal:**

```
┌─ Poslat peníze ─────────────────────┐
│ Z účtu:    Osobní účet (12 450 ✦)   │
│ Komu:      [Picker postavy ▾]       │
│ Na účet:   [Picker účtu příjemce ▾] │
│ Částka:    [_______] ✦               │
│ Popis:     [_______________]        │
│                                     │
│ [Zrušit]            [Poslat ✦]     │
└─────────────────────────────────────┘
```

- Picker postavy = adresář postav (filtr typu, exclude self pro „cizí transfer").
- Picker účtu příjemce = až po výběru postavy → fetch `/characters/:slug/accounts` → ukáže veřejně viditelné účty (= ty kde primary owner = vybraná postava, navíc co-owned účty kam má přístup); pro privacy: jen účty se stejnou měnou.
- Currency mismatch = disabled „Poslat" + hláška „Účty musí mít stejnou měnu".

### 4.2 „Nastavení účtu" sekce (PJ-only) — dole

V edit režimu, pod „Účtování":

```
┌─ Nastavení účtu (jen PJ) ───────────┐
│ Typ účtu:    [Osobní ▾]              │
│ Vedeno u:    [Picker postavy ▾]      │
│   default = primary owner            │
│ Měna:        [zl Zlatý (✦) ▾]        │
│ Spoluvlastníci:                      │
│   • Aragorn       [✕]                │
│   • Legolas       [✕]                │
│   [+ Přidat spoluvlastníka]          │
│                                      │
│ [🗑️ Smazat účet]                     │
└──────────────────────────────────────┘
```

Hráč (vlastník postavy) tuhle sekci vidí ale **read-only** (jen čte hodnoty). Edit jen PJ.

### 4.3 Aside karta

Beze změny od 8.1-FIR vizuálu. Metadata se ale berou z **aktivního účtu** (account switcher), ne z postavy. Co se mění:
- „Stav přístupu" → odvozeno z `accessLocation` účtu (Aktivní pokud reference existuje, Nenastaveno pokud null)
- „Měna" → `account.currency` resolved přes `world.currencies[code].symbol`
- „Poslední synchronizace" → `account.updatedAt`

### 4.4 Multi-currency summary

Pokud má postava účty v různých měnách:
- Summary banner: `Celkem: 12 450 ✦ Zlatých · 230 kr Krejcarů` (per-currency).
- Hero ukazuje balance aktivního účtu.

Bez konverze — to čeká na 11.4b. Záměr.

---

## 5. Roadmapa aktualizace

- **8.6** se přidá jako nová fáze. Pořadí: 8.1–8.5 zůstávají, 8.6 přijde po 8.5.
- **11.4** se zúží: 11.4a (CRUD měn — UI) zůstává; **read-side se předjímá v 8.6** (PJ ve `WorldSettings` zatím nastaví seznam měn světa přes lightweight admin tab nebo defaulty).
- **8.1-FIR** zůstává uzavřený jako hotový (Matrix redesign + lazy-create + access policy). 8.6 staví nad ním.

---

## 6. Migrace existujících dat

- Skript `2026-05-24-finance-multi-account.ts` v `backend/migrations/`.
- Idempotentní (skip pokud `accounts` collection má dokument s `characterId == X`).
- Spustí se při `npm run migrate:up` ručně (ne auto). PJ světa rozhodne kdy.
- Backup doporučení v migration docu.

---

## 7. Testy (rámcově, detaily v plánu)

**BE:**
- CharacterAccountsService — všechny CRUD + transfer + addMonthly + undo + co-owner ops.
- Transfer atomicita — fail v půlce → revert obou stran (mock session).
- Currency mismatch transfer → BadRequest.
- Insufficient funds transfer → BadRequest.
- Permission gating per role pro každý endpoint.

**FE:**
- FinanceTab — account switcher, summary banner, příjmy/výdaje split.
- TransferModal — postava picker → account picker → validace currency match → potvrzení.
- Settings sekce (PJ-only) — readonly pro non-PJ, edit pro PJ.
- Co-owner picker — add/remove.

**Migrační test:**
- Test fixture s 3 starými `CharacterFinance` dokumenty → spustit migraci → ověřit že každý má 1 `Account` s odpovídajícími daty + entries rozdělené.

---

## 8. Otevřené otázky pro autora

1. **Měny: WorldSettings field vs nová collection** — pro 8.6 lightweight stačí `WorldSettings.currencies: WorldCurrency[]` (embed), bez vlastních endpointů. Plný CRUD UI v 11.4 pak refactoruje na vlastní collection. **Doporučuju embed v WorldSettings.** Méně BE změn, čistá hranice s 11.4.
2. **Co se stane se shared účtem při smazání postavy** — pokud postava byla `primaryOwnerId`: a) účet se smaže (i pro ostatní spoluvlastníky), b) primary přejde na dalšího co-owner, c) účet se převede na PJ-only správu. **Doporučuju b)** s fallback na c) pokud zbyl jediný co-owner = mazaná postava.
3. **Transfer mezi cizími postavami** — A pošle B. Co s tím:
   - Notifikace pro B (toast po přihlášení, nebo BE event)?
   - Akcept B? (transfer čeká na potvrzení, dokud B neklikne „Přijmout")
   - Nebo instant doručení (jako bankovní převod)?
   **Doporučuju instant** + soft-notifikace přes toast v chatu/nahoru (out-of-scope 8.6, dluh do dalšího kroku).
4. **Currency picker při založení účtu** — když svět nemá nastavené měny (defaultně prázdné), co dělat? Disabled „Nový účet" + hláška „PJ musí nastavit měny ve WorldSettings"? **Doporučuju to.**
5. **Spoluvlastníci napříč světy** — explicitně NE. Shared account je v rámci 1 světa. Picker filtruje na characters daného worldId.
6. **Limit na počet účtů** — 0 = nelimitováno, 1 = jako dnes, „velký" = 50/postava. **Doporučuju 20** (rozumný hard cap pro UX bez stránkování).
7. **„Vedeno u" picker** — jen NPC a Lokace, nebo i PC? Tj. lze mít účet vedený u jiné PC postavy (pokladník party)? **Doporučuju všechny typy** — flexibilita pro RP situace.
8. **Měsíční bilance per účet** — = `sum(incomeEntries) - sum(expenseEntries)` zaúčtovaná jako 1 transakce. Co když je negativní (víc výdajů než příjmů) — povolit i pro účet, který by přešel do mínusu? **Doporučuju povolit** (`balance` může jít do mínusu = dluh, hráčská situace). Žádná silová blokáda.

---

## 9. Co se rozhodlo z předchozího kola (F1–F7)

| Bod | Rozhodnutí |
|-----|------------|
| F1 — měsíční výdaje | Ano, `expenseEntries[]` symetricky k `incomeEntries[]` |
| F2 — poslat jiným | Ano, transfer endpoint + modal |
| F3 — měna podle převodníku | Ano, **minimální subset 11.4** (seznam měn světa, bez převodníku) |
| F4 — typ účtu PJ-only + dole | Ano, „Nastavení účtu" sekce dole, PJ-only edit |
| F5 — Vedeno u = postava ref | Ano, picker postavy (default = sám), lze měnit |
| F6 — multi-účet | Ano, **full refactor** CharacterFinance → kontejner accounts[] |
| F7 — sdílené účty | Ano, `ownerCharacterIds[]` per účet |
| Pořadí | Vše najednou jako 8.6, ne dělit |
