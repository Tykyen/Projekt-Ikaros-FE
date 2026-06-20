# cache / 05-postavy-ekonomika — checkpoint RUN-2026-06-20-1621

## Pokrytí

Prošel jsem VEŠKERÝ kód oblasti (HEAD, read-only):

- `src/features/world/pages/api/useCharacterMutations.ts` — plné čtení (326 řádků)
- `src/features/world/pages/api/useCharacterAccounts.ts` — plné čtení (301 řádků)
- `src/features/world/pages/api/useCharacterSubdocs.ts` — plné čtení
- `src/features/world/pages/api/useCharacter.ts` — ověřeno via grep
- `src/features/world/pages/api/usePersonaDirectory.ts` — plné čtení
- `src/features/world/pages/api/usePage.ts` (pagesQueryKey factory) — plné čtení
- `src/features/world/pages/api/characters.types.ts` (charactersQueryKey + worldCurrenciesQueryKey) — čteno
- `src/features/world/pages/api/useAccountTransferNotifications.ts` — plné čtení + spec
- `src/features/world/pages/CharactersPage/hooks/useFavoriteCharacters.ts` — plné čtení
- `src/features/world/shop/api.ts` — plné čtení
- `src/features/world/shop/types.ts` — plné čtení (bez stock/limit pole)
- `src/features/world/currencies/api.ts` — plné čtení
- `src/features/world/pages/CharacterDetailPage/components/accounts/CreateAccountModal.tsx` — ověření co-owner scénáře
- `docs/cache-plan/05-postavy-ekonomika.md` — referenční plán
- `docs/cache-audit.md` — registr C-20..23 + stav oprav

Konzumenti cross-ověřeni: sidebar (useCharacterDirectory/pagesQueryKey), WorldLayout, ShopView, SubjectForm.

---

## Dosažená L vs cílová L

| Mutace / hook | Dosažená L | Cílová L |
|---|---|---|
| useUpdateCharacter, useDeleteCharacter, useConvertCharacter | **L2** (key-match simulace ověřena) | L2+ |
| useUpdateCharacterCalendar, useSetCalendarColor | **L2** | L2+ |
| useUpdateCharacterFinance / useFinanceAddMonthly / useFinanceUndo | **L2** (C-23 = dead code confirmed) | L2 |
| useCreateAccount, useUpdateAccount, useDeleteAccount | **L2** | L2+ |
| useAccountAdjust, useAccountTransfer, co-owner ops | **L2** | L2+ |
| useChangeAccountCurrency | **L2** (nová mutace vs. plán) | L2 |
| useAccountTransferNotifications (WS) + reconnect | **L3** (spec zelený) | L2+ |
| useFavoriteCharacters optimistic | **L2** | L2+ |
| useUpdateCurrencies optimistic | **L2** | L2+ |
| usePurchase / useRefund | **L2** | L2+ |

Průměr: **L2** (statická analýza + key-match). L3 pouze pro WS transfer notifications (existující spec).
Destruktivní akce (useDeleteCharacter, useDeleteAccount) — **L2**; cíl L3 (bez existujícího testu). → PROOF-REQUEST.

---

## Nálezy

### ✅ Potvrzené opravy (vs. původní sweep 2026-06-05)

- **C-20 ✅** — `useUpdateCharacter`/`useDeleteCharacter`/`useConvertCharacter` nyní invalidují `['pages', worldId, 'directory']` (řádky 115, 137, 165 v useCharacterMutations.ts). Persona grid (CharactersPage) se obnoví.
- **C-21 ✅** — Dead per-owner predikát (`slug ≠ ObjectId`) odstraněn; `useUpdateAccount` jede jen přes broad `invalidate(['characters', worldId])` (řádek 103).
- **C-22 ✅** — `useUpdateCharacterCalendar.onSuccess` invaliduje `['calendars-aggregate', worldId]` (řádek 209).
- **D-05-1 ✅** — `useDeleteAccount` nyní dělá `removeQueries(accountDetail)` + `invalidate(['characters', worldId])` (řádky 143–146); žádný 404-flash.
- **D-05-2 ✅** — `useUpdateCurrencies.onSettled` invaliduje OBOJE: `['world-currencies', worldId]` i `['worlds', worldId, 'currencies']` (currencies/api.ts:56–59).
- **D-05-3 ✅** — `useConvertCharacter` nyní invaliduje `accountsByCharacter(worldId, slug)` (řádek 167–169).
- **C-23 ✅** — Potvrzeno dead code: `useCharacterFinance`/`useUpdateCharacterFinance` etc. nejsou nikde volány; FinanceTab jede na 8.6 accounts.

### 🆕 Nové mutace (post-sweep, nyní přidány do kódu)

**C-RUN-01 · `FO` · `useSetCalendarColor` — nová mutace mimo sweep, OPT suboptimal**
- **Kde:** `useCharacterMutations.ts:219–235`
- **Nález:** Mutace existuje od 9.2 follow-up, nebyla v původním sweep plánu. Invalidace jsou KOREKTNÍ: invaliduje `['calendars-aggregate', worldId]` + `subdoc calendar`. ALE: BE vrátí čerstvý `CharacterCalendar` v `onSuccess` (`_calendar` parametr) — hook ho IGNORUJE a místo `setQueryData` volá `invalidateQueries` pro subdoc (zbytečný round-trip GET). Funkčně správně (jen méně efektivní).
- **Dopad:** Žádný cache-correctness problém; hráč uvidí správná data po refetchi. Mírně vyšší latence (invalidate→GET vs. okamžitý setQueryData). **L2 · 🟡 · 🆕**
- **Návrh:** Zvážit `setQueryData(subdoc calendar, _calendar)` místo invalidace (vzor `useUpdateCharacterCalendar`).

**C-RUN-02 · `FO` · `useChangeAccountCurrency` — nová mutace mimo sweep, správná**
- **Kde:** `useCharacterAccounts.ts:117–133`
- **Nález:** Nová mutace (8.x currency-conversion), nebyla v původním sweep. Správně: `setQueryData(accountDetail)` + `invalidate(['characters', worldId])` (broad pokryje accountsByCharacter). ✅ Vzor shodný s ostatními account mutacemi.
- **Dopad:** Žádný nález. **L2 · ✅ · 🆕**

### ♻️ Potvrzené nálezy z plánu (stav beze změny)

**D-05-4 · `SC` · `useAccountTransferNotifications` over-broad WS predikát (bez worldId scope)**
- **Kde:** `useAccountTransferNotifications.ts:36–44`
- **Stav:** Nezměněno od sweep. Invaliduje VŠECHNY účty ve VŠECH světech (predikát `q.queryKey[0] === 'accounts'`). WS payload (`fromAccountId`/`toAccountId`) neobsahuje `worldId` → nelze cílit. Cache-bezpečné (raději moc), latentní over-invalidation. ♻️ by-design dokud BE WS payload worldId neobsahuje.
- **L2 · 🟡 · ♻️**

### ✅ Vyvrácené kandidáty (post-ověření)

- **Shop stock/limit:** `ShopItem` typ nemá `stock`/`maxPurchases` → `usePurchase` nemusí invalidovat shop katalog. ⚖️ by-design.
- **`useCreateAccount` co-owner gap:** CreateAccountModal nikdy neposílá `ownerCharacterIds` → co-owner scénář při vytváření nenastane; co-ownery se přidávají přes `useAccountAddCoOwner` (který broad invaliduje). ⚖️ by-design.

---

## PROOF-REQUEST

| # | Co ověřit | Proč blokuje L3+ | Metoda |
|---|---|---|---|
| **PR-1** | `useDeleteCharacter` + navigace pryč z detailu → CharactersPage grid neobsahuje smazanou postavu BEZ F5 | Destruktivní akce — L3 (existující test nepotvrzuje grid-obnovu) | M4 (runtime) nebo M5 (vitest: spy na `invalidateQueries(['pages',…,'directory'])`) |
| **PR-2** | `useDeleteAccount` → AccountPanel smazaného účtu (pokud byl mountovaný) se přepne / zmizí bez 404 flash | DEL osa — D-05-1 oprava ověřena L2, ne L3+ | M4 (runtime) |
| **PR-3** | `useSetCalendarColor` → `useCharacterCalendar` v CalendarTab po barevné změně zobrazí čerstvá data (bez F5) | Nová mutace, bez testu | M3/M5 (zelený stav subdoc po invalidate) |

