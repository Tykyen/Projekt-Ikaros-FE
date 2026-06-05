# 05 — Postavy & ekonomika

> **Sweep 2026-06-05.** Cache-invalidation inventura (TanStack Query v5). Read-only.
> Osy: `FO` `SC` `KM` `OPT` · perspektivy P1 (konzumentská inventura) + P2 (prefix-match / predikát).
> Soubory: `src/features/world/pages/api/` (character mutations + subdocs + accounts), `…/shop/`, `…/currencies/`, `CharactersPage/hooks/useFavoriteCharacters.ts`. Nálezy → [`../cache-audit.md`](../cache-audit.md) (`C-20…`).
> **Stav: ✅ hotovo — 4 nálezy (C-20 🟠 directory split, C-21 🟠 dead predikát, C-22 🟡 calendars-aggregate druhá strana = C-11 confirm, C-23 🟡 finance/inventory directory split). Currency optimistic = ✅ vzor. Shop purchase = ✅.**

## 1. Konzumentská inventura (P1)

### Postava — directory / detail / subdoc

| Zdroj / entita | `queryKey` | role / konzument | staleTime / enabled | soubor:řádek |
|---|---|---|---|---|
| **Persona directory** (PRIMÁRNÍ grid postav) | `['pages', worldId, 'directory', 'persona']` | **CharactersPage grid** + ShopView (výběr postavy) + SubjectForm | 60s; `!!worldId` | [usePersonaDirectory.ts:17](../../src/features/world/pages/api/usePersonaDirectory.ts#L17) |
| **Character directory** (legacy `/characters/directory`) | `['characters', worldId, 'directory']` (factory) | WorldLayout sidebar (slot postavy člena), MyCharacterPage, GroupMembersPage, MembersTab, mapa MapEmptyState (spawn z postav), TransferModal (cíl), SettingsAccountSection | 30s; `!!worldId` | [useCharacterDirectory.ts:15](../../src/features/world/pages/api/useCharacterDirectory.ts#L15) |
| Character **detail** | `['characters', worldId, 'detail', slug]` (factory) | CharacterDetailPage hlavička/bio | 30s; `!!worldId&&!!slug` | [useCharacter.ts:11](../../src/features/world/pages/api/useCharacter.ts#L11) |
| Subdoc **diary** | `['characters', worldId, 'detail', slug, 'diary']` | DiaryTab + token deník | 30s | [useCharacterSubdocs.ts:28](../../src/features/world/pages/api/useCharacterSubdocs.ts#L28) |
| Subdoc **calendar** | `…detail, slug, 'calendar'` | CalendarTab postavy | 30s | [useCharacterSubdocs.ts:39](../../src/features/world/pages/api/useCharacterSubdocs.ts#L39) |
| Subdoc **finance** | `…detail, slug, 'finance'` | FinanceTab (legacy single-account) | 30s | [useCharacterSubdocs.ts:50](../../src/features/world/pages/api/useCharacterSubdocs.ts#L50) |
| Subdoc **inventory** | `…detail, slug, 'inventory'` | InventoryTab | 30s | [useCharacterSubdocs.ts:61](../../src/features/world/pages/api/useCharacterSubdocs.ts#L61) |
| Subdoc **notes** | `…detail, slug, 'notes'` | NotesTab | 30s | [useCharacterSubdocs.ts:72](../../src/features/world/pages/api/useCharacterSubdocs.ts#L72) |

> **Pozn. directory split:** `charactersQueryKey.directory` (factory) = `['characters', worldId, 'directory']`; `usePersonaDirectory` = `['pages', worldId, 'directory', 'persona']`. **Dva nepřekrývající se namespaces** pro „adresář postav". `pagesQueryKey.directory(worldId)` = `['pages', worldId, 'directory']` prefix-matchuje persona klíč → **page mutace** (`useCreatePage`/`useUpdatePage`/`useDeletePage`) persona grid obnoví; **character mutace ne** (viz C-20).

### Ekonomika — multi-account (8.6) / currencies / shop

| Zdroj / entita | `queryKey` | role / konzument | staleTime | soubor:řádek |
|---|---|---|---|---|
| **Účty postavy** (list) | `['characters', worldId, 'detail', slug, 'accounts']` (factory `accountsByCharacter`) — `[3]=slug` | AccountsTab list, TransferModal cíl | 30s | [useCharacterAccounts.ts:16](../../src/features/world/pages/api/useCharacterAccounts.ts#L16) |
| **Účet detail** | `['accounts', worldId, accountId]` (factory `accountDetail`) — `[0]='accounts'` | account switcher, AccountPanel | 30s | [useCharacterAccounts.ts:29](../../src/features/world/pages/api/useCharacterAccounts.ts#L29) |
| Měny světa (z accounts modulu) | `['worlds', worldId, 'currencies']` (`worldCurrenciesQueryKey` v characters.types) | account currency dropdown | 5 min | [useCharacterAccounts.ts:42](../../src/features/world/pages/api/useCharacterAccounts.ts#L42) |
| **Měny světa** (currencies feature) | `['world-currencies', worldId]` (jiný factory!) | CurrenciesPage editor + převodník | 5 min | [currencies/api.ts:21](../../src/features/world/currencies/api.ts#L21) |
| Shop items | `['shop', worldId, 'items']` | ShopView katalog | 60s | [shop/api.ts:39](../../src/features/world/shop/api.ts#L39) |
| Shop groups | `['shop', worldId, 'groups']` | ShopView skupiny | 60s | [shop/api.ts:49](../../src/features/world/shop/api.ts#L49) |
| Shop purchases | `['shop', worldId, 'purchases', characterId?]` | historie nákupů | 30s | [shop/api.ts:130](../../src/features/world/shop/api.ts#L130) |
| Oblíbené postavy | **bez vlastního klíče** — derivace z `['users','me']` `.favoriteCharacters[worldId]` | hvězdička v CharactersPage gridu | (profil cache) | [useFavoriteCharacters.ts:63](../../src/features/world/pages/CharactersPage/hooks/useFavoriteCharacters.ts#L63) |

> ⚠️ **Dva `worldCurrenciesQueryKey`** se stejným názvem, jiným klíčem: `characters.types.ts:256` = `['worlds', worldId, 'currencies']` vs `currencies/api.ts:21` = `['world-currencies', worldId]`. Account currency dropdown a CurrenciesPage čtou **různý cache záznam ze stejného endpointu** `/worlds/:worldId/currencies`. `useUpdateCurrencies` invaliduje jen `['world-currencies',…]` → account dropdown drží starý seznam měn (viz D-05-2).

> **Cross-feature konzumenti postavy ověřeni:** **mapa** (tactical-map) **nečte** žádný `charactersQueryKey` — tokeny drží vlastní snapshot/diary-ref, ne directory/detail (žádný fan-out požadavek). **World dashboard „Oblíbené"** = `FavoritePagesColumn` (oblíbené **stránky**, ne postavy) → mimo tuto oblast. **Members sidebar** (WorldLayout:269) čte `useCharacterDirectory` (legacy klíč — invalidován je). **Presence panel** nečte character cache. **Oblíbené postavy** žijí v profilu (`['users','me']`), ne v character namespace.

## 2. Mutace × konzument matice

### Postava — directory / detail / subdoc

| Mutace (soubor:řádek) | persona-dir `['pages',…,'persona']` | char-dir `['characters',…,'directory']` | detail | subdoc(s) | members | placement |
|---|---|---|---|---|---|---|
| useUpdateCharacter [:103](../../src/features/world/pages/api/useCharacterMutations.ts#L103) | **❌** | ✅ inval | ✅ `setQueryData` | — | — | config → **C-20** |
| useDeleteCharacter [:119](../../src/features/world/pages/api/useCharacterMutations.ts#L119) | **❌** | ✅ inval | ✅ `removeQueries` | (BE kaskáda) | ✅ | config → **C-20** |
| useConvertCharacter [:138](../../src/features/world/pages/api/useCharacterMutations.ts#L138) | **❌** | ✅ inval | ✅ `setQueryData` | ✅ všech 5 (diary/calendar/finance/inventory/notes) | ✅ | config → **C-20** |
| useUpdateCharacterDiary [:163](../../src/features/world/pages/api/useCharacterMutations.ts#L163) | — | — | — | ✅ diary `setQueryData` | — | config |
| useUpdateCharacterCalendar [:180](../../src/features/world/pages/api/useCharacterMutations.ts#L180) | — | — | — | ✅ calendar `setQueryData` · **❌ `calendars-aggregate`** | — | config → **C-22** |
| useUpdateCharacterFinance [:197](../../src/features/world/pages/api/useCharacterMutations.ts#L197) | — | — | — | ✅ finance `setQueryData` · **❌ accounts list** | — | config → **C-23** |
| useFinanceAddMonthly [:215](../../src/features/world/pages/api/useCharacterMutations.ts#L215) | — | — | — | ✅ finance `setQueryData` | — | config |
| useFinanceUndo [:232](../../src/features/world/pages/api/useCharacterMutations.ts#L232) | — | — | — | ✅ finance `setQueryData` | — | config |
| useUpdateCharacterInventory [:248](../../src/features/world/pages/api/useCharacterMutations.ts#L248) | — | — | — | ✅ inventory `setQueryData` | — | config |
| useUpdateCharacterNotes [:265](../../src/features/world/pages/api/useCharacterMutations.ts#L265) | — | — | — | ✅ notes `setQueryData` | — | config |

> **`subdoc` fan-out u convertu (ověřeno):** `useConvertCharacter` iteruje `SUBDOC_KINDS = ['diary','calendar','finance','inventory','notes']` ([:24](../../src/features/world/pages/api/useCharacterMutations.ts#L24), [:148](../../src/features/world/pages/api/useCharacterMutations.ts#L148)) → invaliduje **všech 5 subdocs**. PC↔NPC mění viditelnost finance/inventory (`isHidden`) → po convertu se finance/inventory korektně refetchnou s novou visibility. ✅ **Subdoc fan-out u convertu je úplný.** Účty (`accountsByCharacter`) ale `SUBDOC_KINDS` neobsahuje — viz D-05-3.

### Ekonomika — accounts (8.6)

| Mutace (soubor:řádek) | accountDetail | accountsByChar list | broad `['characters',worldId]` | placement |
|---|---|---|---|---|
| useCreateAccount [:59](../../src/features/world/pages/api/useCharacterAccounts.ts#L59) | — | ✅ inval | — | config |
| useUpdateAccount [:87](../../src/features/world/pages/api/useCharacterAccounts.ts#L87) | ✅ `setQueryData` | ⚠️ přes **dead predikát** + ✅ broad fallback | ✅ | config → **C-21** |
| useDeleteAccount [:114](../../src/features/world/pages/api/useCharacterAccounts.ts#L114) | **❌ removeQueries** | — | ✅ broad | config (DEL: viz D-05-1) |
| useAccountAddMonthly [:130](../../src/features/world/pages/api/useCharacterAccounts.ts#L130) | ✅ `setQueryData` | — | ✅ broad | config |
| useAccountAdjust [:159](../../src/features/world/pages/api/useCharacterAccounts.ts#L159) | ✅ `setQueryData` | — | ✅ broad | config |
| useAccountUndo [:177](../../src/features/world/pages/api/useCharacterAccounts.ts#L177) | ✅ `setQueryData` | — | ✅ broad | config |
| useAccountTransfer [:200](../../src/features/world/pages/api/useCharacterAccounts.ts#L200) | ✅ from+to `setQueryData` | — | ✅ broad | config |
| useAccountAddCoOwner [:220](../../src/features/world/pages/api/useCharacterAccounts.ts#L220) | ✅ `setQueryData` | — | ✅ broad | config |
| useAccountRemoveCoOwner [:238](../../src/features/world/pages/api/useCharacterAccounts.ts#L238) | ✅ `setQueryData` | — | ✅ broad | config |
| useAccountTransferPrimary [:259](../../src/features/world/pages/api/useCharacterAccounts.ts#L259) | ✅ `setQueryData` | — | ✅ broad | config |

> Broad `invalidate(['characters', worldId])` ([:109,120,143,172,187,215,…](../../src/features/world/pages/api/useCharacterAccounts.ts#L109)) prefix-matchuje **vše** pod `['characters', worldId, …]` → directory(legacy) + detail + všechny subdocs + **accountsByCharacter list** (`[3]=slug` segment je dál, prefix sedí). Takže account list se obnoví **i u shared účtů (oba co-ownery)** přes broad invalidaci. ✅ Korektní (raději široko). **Netrefí** ale `['accounts', worldId, …]` accountDetail jiných účtů ani persona grid (`['pages',…]`).

### WS — `account:transfer:received` ([useAccountTransferNotifications.ts](../../src/features/world/pages/api/useAccountTransferNotifications.ts))

| Predikát | trefí | placement |
|---|---|---|
| `q.queryKey[0] === 'accounts'` [:37](../../src/features/world/pages/api/useAccountTransferNotifications.ts#L37) | ✅ `accountDetail` (`['accounts',worldId,id]`) **všechny účty napříč všemi světy** | global subscriber |
| `includes('accounts') && [0]==='characters'` [:40](../../src/features/world/pages/api/useAccountTransferNotifications.ts#L40) | ✅ `accountsByCharacter` (`['characters',w,'detail',slug,'accounts']`) **všechny postavy napříč světy** | global subscriber |

## 3. Predikát korektnost (P2 — explicitní ověření)

### 3a. `useAccountTransferNotifications` (WS) — ✅ FUNGUJE, ale 🟡 over-broad (chybí scope)

**Predikáty (přesně, [:36-44](../../src/features/world/pages/api/useAccountTransferNotifications.ts#L36)):**
```ts
qc.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'accounts' });
qc.invalidateQueries({ predicate: (q) =>
  Array.isArray(q.queryKey) && q.queryKey.includes('accounts') && q.queryKey[0] === 'characters' });
```

**Všechny existující `accounts`/`account*` queryKey v repu:**
- `['accounts', worldId, accountId]` (`accountDetail`) — `[0]='accounts'` ✅ trefí predikátem #1.
- `['characters', worldId, 'detail', slug, 'accounts']` (`accountsByCharacter`) — `[0]='characters'` + `includes('accounts')` ✅ trefí predikátem #2.
- Žádný jiný `accounts` namespace (grep `queryKey:[ 'accounts'` = 0 mimo factory; jediné dva výše).

**Verdikt indexu `queryKey[0]`:** index **správný** — oba cílové klíče mají rozlišovací segment na `[0]` (`'accounts'` resp. `'characters'`). Trefí **správnou množinu** (oba typy account-cache).

**🟡 Scope (`SC`): predikát je over-broad — chybí `worldId` i `accountId`/`characterId`.** Komentář to přiznává ([:33-35](../../src/features/world/pages/api/useAccountTransferNotifications.ts#L33): „worldId v query klíči poznáme jen z URL path… invalidate všech `accounts` klíčů projistotu"). Payload (`fromAccountId`/`toAccountId`) by umožnil cílený `accountDetail(worldId, toAccountId)`, ale worldId v payloadu chybí. Důsledek: příjem převodu invaliduje **všechny účty ve všech světech**, kde má uživatel cache. Pro cache bezpečné (raději moc), latentní over-invalidation. **Není „moc úzce" (nehrozí stale).** → D-05-4.

### 3b. `useUpdateAccount` (REST) — 🔴-by-effect dead predikát, zachráněn fallbackem → **C-21 🟠**

**Predikát (přesně, [:101-107](../../src/features/world/pages/api/useCharacterAccounts.ts#L101)):**
```ts
for (const ownerCharId of account.ownerCharacterIds) {
  qc.invalidateQueries({
    queryKey: ['characters', worldId, 'detail'],
    predicate: (q) => q.queryKey[3] === ownerCharId || q.queryKey.includes(ownerCharId),
  });
}
```

**Rozpor (`KM`/P2):** `accountsByCharacter` = `['characters', worldId, 'detail', slug, 'accounts']` → `queryKey[3]` je **slug** (ověřeno [TransferModal.tsx:52](../../src/features/world/pages/CharacterDetailPage/components/accounts/TransferModal.tsx#L52) — `accountsByCharacter(worldId, targetSlug)`). Ale `ownerCharacterIds` jsou **character ObjectId** (`CharacterAccount.ownerCharacterIds: string[]`, [characters.types.ts:186](../../src/features/world/pages/api/characters.types.ts#L186)). **slug ≠ ObjectId** → `queryKey[3] === ownerCharId` **nikdy nematchne**. Záložní `queryKey.includes(ownerCharId)` taky ne (žádný character klíč nenese ObjectId — všechny jedou na slug). To je přímo past `project_directory_id_vs_character_id`.

**Záchrana:** o 2 řádky níž ([:109](../../src/features/world/pages/api/useCharacterAccounts.ts#L109)) `invalidate(['characters', worldId])` (broad) → obnoví **všechny** account-listy včetně shared → výsledná invalidace **korektní**. Per-owner smyčka je tedy **dead code** (invaliduje do prázdna), broad fallback dělá celou práci.

- **Trigger:** PJ upraví účet (label/income/expense/currency). **Viditelnost:** žádná (broad fallback obnoví) — proto 🟠, ne 🔴. **Workaround:** netřeba.
- **Návrh:** smazat dead per-owner smyčku (drift-trap: budí dojem cílené invalidace + svádí budoucí refactor k odstranění „redundantního" broad fallbacku → tehdy se díra otevře jako 🔴), nebo ji opravit na porovnání proti `ownerCharId` v hodnotě listu / mapovat ID→slug. Ponechat **broad** jako jediný zdroj pravdy je nejjednodušší.

## 4. Nálezy

### 🟠 C-20 · `FO` · character mutace neobnoví PRIMÁRNÍ grid postav (`usePersonaDirectory`)
- **Mutace:** [useUpdateCharacter:110](../../src/features/world/pages/api/useCharacterMutations.ts#L110), [useDeleteCharacter:128](../../src/features/world/pages/api/useCharacterMutations.ts#L128), [useConvertCharacter:153](../../src/features/world/pages/api/useCharacterMutations.ts#L153) — všechny invalidují jen `charactersQueryKey.directory` = `['characters', worldId, 'directory']`.
- **Konzument:** **CharactersPage grid** čte `usePersonaDirectory` = `['pages', worldId, 'directory', 'persona']` ([CharacterDirectory.tsx:118](../../src/features/world/pages/CharactersPage/CharacterDirectory.tsx#L118)). Namespace `'pages'` ≠ `'characters'` → **`['characters',…,'directory']` ho neprefixuje** → hlavní grid se neobnoví. Stejně postižen ShopView (výběr postavy) a SubjectForm.
- **Rozpor:** po sjednocení 9.1 je primární adresář postav servírovaný z Page projection (`usePersonaDirectory`), ale character mutace zůstaly na legacy klíči. Legacy `useCharacterDirectory` (sidebar, MyCharacterPage, MembersTab, mapa) invalidovaný **je** → past je per-konzument.
- **Trigger:** PJ přejmenuje postavu / smaže / convert PC↔NPC → **CharactersPage grid drží starý stav** (smazaná postava stále v gridu, přejmenovaná se starým jménem, NPC/PC filtr po convertu nesedí). **Viditelnost:** tiše starý stav; smazaná postava v gridu je stale po destruktivní akci. **Maskováno** jen tím, že persona grid má často primární data z Page — pokud editaci postavy předchází page-mutace, ta `['pages',…,'directory']` invaliduje. Čistá character-only mutace (convert, delete přes character endpoint) ale grid míjí. **Workaround:** F5 / 60s staleTime.
- **Návrh:** přidat do všech tří character mutací `invalidate(['pages', worldId, 'directory'])` vedle `charactersQueryKey.directory` (prefix-matchuje persona variantu i ostatní directory pages). Cílově sjednotit na jediný directory klíč.

### 🟠 C-21 · `KM`/P2 · `useUpdateAccount` per-owner predikát je dead (slug vs characterId)
- **Mutace:** [useCharacterAccounts.ts:101-107](../../src/features/world/pages/api/useCharacterAccounts.ts#L101) — `predicate: q => q.queryKey[3] === ownerCharId || q.queryKey.includes(ownerCharId)`.
- **Rozpor:** `queryKey[3]` = **slug** (struktura `accountsByCharacter`), `ownerCharId` = **ObjectId** (`ownerCharacterIds`) → predikát nikdy nematchne (detail v 3a). Dead invalidace.
- **Trigger/Viditelnost:** žádná — broad `invalidate(['characters', worldId])` o řádek níž ([:109](../../src/features/world/pages/api/useCharacterAccounts.ts#L109)) obnovu zachrání. Proto 🟠 (latentní/drift-trap), ne 🔴.
- **Návrh:** smazat dead smyčku (a ponechat broad), nebo opravit ID↔slug mapping. **Drift-trap:** dokud tam smyčka je, vypadá invalidace cíleně → budoucí „cleanup" broadu otevře díru jako 🔴.

### 🟡 C-22 · `FO`/orphan · character calendar-event mutace neobnoví `calendars-aggregate` (C-11 confirm z druhé strany)
- **Mutace:** [useUpdateCharacterCalendar:188](../../src/features/world/pages/api/useCharacterMutations.ts#L188) — jen `setQueryData(subdoc 'calendar')`. Žádná `invalidate(['calendars-aggregate', worldId])`.
- **Konzument:** [useCalendarsAggregate.ts:43](../../src/features/world/api/useCalendarsAggregate.ts#L43) `['calendars-aggregate', worldId]` (PJ agregát kalendář, CalendarPage). Namespace `'calendars-aggregate'` ≠ `'characters'` → subdoc `setQueryData` ho nezasáhne.
- **Rozpor:** **potvrzuje [C-11](09-udalosti-kalendar-timeline.md#L54) z druhé strany** — díra je oboustranná: ani calendar-config mutace, ani character-calendar mutace agregát neinvalidují. PJ upraví event postavy → vlastní CalendarTab postavy aktuální (`setQueryData`), ale PJ agregát view (všechny postavy/NPC/Lokace) drží starý event do staleTime 30s / refetchOnMount.
- **Trigger:** PJ edituje calendar event postavy a má otevřený agregát. **Viditelnost:** tiše starý event v agregátu. **Workaround:** 30s / F5. **Závažnost:** 🟡 (krátký staleTime, nepřímá data).
- **Návrh:** doplnit do `useUpdateCharacterCalendar.onSuccess` `invalidate(['calendars-aggregate', worldId])` (společně s opravou C-11 na config straně).

### 🟡 C-23 · `FO` · `useUpdateCharacterFinance` neobnoví account list (8.6 split finance↔accounts)
- **Mutace:** [useUpdateCharacterFinance:205](../../src/features/world/pages/api/useCharacterMutations.ts#L205), [useFinanceAddMonthly:222](../../src/features/world/pages/api/useCharacterMutations.ts#L222), [useFinanceUndo:239](../../src/features/world/pages/api/useCharacterMutations.ts#L239) — jen `setQueryData(subdoc 'finance')`.
- **Konzument:** legacy single-account FinanceTab čte `subdoc 'finance'` (✅ obnoven). 8.6 multi-account `accountsByCharacter`/`accountDetail` **se nedotknou** — finance subdoc a accounts jsou paralelní zdroje.
- **Rozpor:** mírný — legacy `CharacterFinance` subdoc a 8.6 `CharacterAccount` jsou oddělené modely (subdoc = legacy single balance, accounts = multi-account 8.6). Mutace finance subdocu account list **záměrně** neobnovuje (různá data). **Není pravý fan-out gap**, pokud FinanceTab a AccountsTab ukazují různé entity. **VERIFY (M4):** zda FinanceTab a AccountsTab nesdílejí zobrazený balance — pokud ano, finance-subdoc edit nechá AccountsTab stale.
- **Trigger/Viditelnost:** VERIFY. **Závažnost:** 🟡 (architektonicky pravděpodobně by-design split, ne broken invalidace).
- **Návrh:** pokud sdílejí balance → přidat `invalidate(accountsByCharacter)` do finance mutací; jinak ⚖️ by-design.

## 5. Ověřené vzory (✅ — ne nálezy)

### ✅ Currency optimistic (`useUpdateCurrencies`) — kompletní round-trip (P3 vzor, false-orphan vyvrácen)
[currencies/api.ts:36-59](../../src/features/world/currencies/api.ts#L36) má **plný optimistic cyklus**:
- `onMutate` [:42-51](../../src/features/world/currencies/api.ts#L42): `cancelQueries` → snapshot `prev` → `setQueryData` optimistic (merge `worldId` + `items`).
- `onError` [:52-54](../../src/features/world/currencies/api.ts#L52): rollback `setQueryData(key, ctx.prev)`.
- `onSettled` [:55-57](../../src/features/world/currencies/api.ts#L55): `invalidate(key)` resync.

Klíč `['world-currencies', worldId]` shodný query↔mutace (factory). ✅ **Vzorová optimistická mutace** — `OPT` osa čistá. (Není orphan — `useConvertMutation` je read-only POST bez cache efektu, správně.)

### ✅ Shop purchase / refund — obnoví finance + inventory + historii
[shop/api.ts:122-125](../../src/features/world/shop/api.ts#L122) `invalidatePurchase` volá:
- `invalidate(['characters', worldId])` → broad prefix obnoví **detail + finance subdoc + inventory subdoc + accountsByCharacter** (nákup mění balance i výbavu kupce). ✅
- `invalidate(shopKeys.purchases(worldId))` = `['shop', worldId, 'purchases']` → prefix-matchuje `[...purchases, characterId]` variantu ([:130](../../src/features/world/shop/api.ts#L130)) → historie nákupů obnovena u všech filtrů. ✅

Použito v `usePurchase` ([:149](../../src/features/world/shop/api.ts#L149)) i `useRefund` ([:161](../../src/features/world/shop/api.ts#L161)). **Shop list (`items`/`groups`) se po nákupu NEobnoví** — záměr (nákup nemění katalog, jen stav/limit). ⚠️ **VERIFY:** pokud má shopItem `stock`/limit počet, katalog by se měl po nákupu obnovit → `invalidate(shopKeys.root)`. Jinak ✅ by-design.

### ✅ Oblíbené postavy — optimistic round-trip přes profil
[useFavoriteCharacters.ts:71-97](../../src/features/world/pages/CharactersPage/hooks/useFavoriteCharacters.ts#L71): `onMutate` snapshot + optimistic `setQueryData(['users','me'])` → `onError` rollback → `onSettled` invalidate `['users','me']`. ✅ Plný cyklus. Hvězdička v gridu derivuje z profil cache (`favoriteCharacters[worldId]`) → optimistic toggle okamžitý.
- **P7 dual-cache note:** oblíbené žijí jen v `['users','me']` (RQ), žádný jotai mirror → bez cross-store driftu. ✅

## 6. Latentní / VERIFY (neeskalováno na C-xx)

- **D-05-1 `DEL` 🟡** — `useDeleteAccount` [:114-122](../../src/features/world/pages/api/useCharacterAccounts.ts#L114) jen `invalidate(['characters', worldId])`, **bez `removeQueries(accountDetail)`**. Smazaný účet drží `['accounts', worldId, accountId]` v cache → pokud je AccountPanel toho účtu mountovaný, `invalidate` ho **refetchne → 404 flash** místo čistého odchodu. Navíc `['accounts',…]` broad `['characters',…]` invalidace **neprefixuje** (jiný namespace) → detail smazaného účtu zůstane stale, dokud staleTime/refetch. **VERIFY (M4):** chová se UI po delete účtu (přepne switcher na jiný účet → unmount panelu?). **Návrh:** `removeQueries({ queryKey: accountDetail(worldId, accountId) })` + invalidate `accountsByCharacter`.
- **D-05-2 `SC`/dual-cache 🟡** — dva `worldCurrenciesQueryKey`: `['worlds', worldId, 'currencies']` ([characters.types.ts:256](../../src/features/world/pages/api/characters.types.ts#L256), čte account currency dropdown) vs `['world-currencies', worldId]` ([currencies/api.ts:21](../../src/features/world/currencies/api.ts#L21), čte CurrenciesPage). **Stejný endpoint, dva cache záznamy.** `useUpdateCurrencies` invaliduje jen `['world-currencies',…]` → po editaci měn zůstane **account currency dropdown stale** (jiný klíč). **Trigger:** PJ upraví měny, pak otevře účet → dropdown bez nové měny. **Workaround:** 5 min / F5. **Návrh:** sjednotit na jeden klíč, nebo `useUpdateCurrencies` invalidovat oba.
- **D-05-3 `FO` 🟡** — `useConvertCharacter` `SUBDOC_KINDS` ([:24](../../src/features/world/pages/api/useCharacterMutations.ts#L24)) **neobsahuje `accounts`** (8.6 multi-account). Convert PC→NPC mění viditelnost finance/inventory — pokud mění i přístup k účtům, `accountsByCharacter` se po convertu neobnoví. Broad zachrání jen pokud něco jiného invaliduje `['characters',w]` — convert to **nedělá** (jen subdoc + directory + members). **VERIFY (M4):** mění convert visibility účtů? Pokud ano → přidat `'accounts'` do invalidovaných nebo broad `invalidate(['characters', worldId])`.
- **D-05-4 `SC` 🟡** — `useAccountTransferNotifications` predikát over-broad (bez worldId/accountId scope, [:33-35](../../src/features/world/pages/api/useAccountTransferNotifications.ts#L33) komentář to přiznává). Invaliduje všechny účty napříč světy. Cache-bezpečné (raději moc), latentní over-invalidation. Cílení blokuje chybějící worldId v WS payloadu (ws-contract EMA-12 payload nemá worldId). **Návrh:** přidat `worldId` do WS payloadu → cílený `invalidate(accountDetail(worldId, toAccountId))`.

**Census (M-CEN):** `useConvertMutation` ([currencies/api.ts:61](../../src/features/world/currencies/api.ts#L61)) je jediná mutace v oblasti **bez** cache efektu — **správně** (read-only POST převodník, nic nepersistuje). Ostatní mutace mají ≥1 efekt. ✅
