# Checkpoint — cache / 05-postavy-ekonomika

> RUN-2026-07-11-1213 · styl cache (TanStack invalidace) · registr `docs/cache-audit.md` (prefix C-)
> READ-ONLY re-audit oblasti proti HEAD. Předchozí sweep 2026-06-05 (C-20/21/22/23 + D-05-1..4).
> Oblastní plán: `docs/cache-plan/05-postavy-ekonomika.md`.

## Dosažená vs cílová L

- **Cílová (README):** běžné mutace L2+; destruktivní (`DEL`) / optimistické (`OPT`) L3+; kritické L4.
- **Dosažená:** **L2** plošně (statický key-match / prefix-match element-po-elementu, M1+M2) +
  **L3 test-locked** pro C-20 / C-21 / C-22 (existující vitest specy, viz níže; nespuštěno v tomto běhu).
- **Gap:** `DEL` (`useDeleteAccount` removeQueries) a `OPT` (currency + favorites round-trip) drží jen **L2**
  (staticky korektní, bez dedikovaného spy-testu) → PROOF-REQUEST FE-1/FE-2.

## Verdikt regrese známých nálezů (♻️ — NEhlásit jako nové)

Všechny fixy z 2026-06-05 jsou **přítomné v HEAD** (čtení + komentáře + testy):

- **♻️ C-20** — `useUpdateCharacter`/`useDeleteCharacter`/`useConvertCharacter` invalidují navíc
  `['pages', worldId, 'directory']` (persona grid). Kde: [useCharacterMutations.ts:115](../../../../src/features/world/pages/api/useCharacterMutations.ts#L115), [:137](../../../../src/features/world/pages/api/useCharacterMutations.ts#L137), [:165](../../../../src/features/world/pages/api/useCharacterMutations.ts#L165). Test-locked [useCharacterMutations.spec.tsx:42](../../../../src/features/world/pages/api/useCharacterMutations.spec.tsx#L42). **Opraveno = L3.**
- **♻️ C-21** — dead per-owner predikát smazán, zůstal jen broad `['characters', worldId]`. Kde: [useCharacterAccounts.ts:100-104](../../../../src/features/world/pages/api/useCharacterAccounts.ts#L100). Test-locked [useCharacterAccounts.spec.tsx:41](../../../../src/features/world/pages/api/useCharacterAccounts.spec.tsx#L41). **Opraveno = L3.**
- **♻️ C-22** — `useUpdateCharacterCalendar` invaliduje `['calendars-aggregate', worldId]`. Kde: [useCharacterMutations.ts:209](../../../../src/features/world/pages/api/useCharacterMutations.ts#L209). Test-locked [useCharacterMutations.spec.tsx:62](../../../../src/features/world/pages/api/useCharacterMutations.spec.tsx#L62). Protistrana C-11 (config) taky invaliduje agregát ([useCalendarConfigs.ts:52,84,99,121](../../../../src/features/world/api/useCalendarConfigs.ts#L52)). **Oboustranně opraveno.**
- **♻️ C-23** — verdikt „dead code" **stále platí**: finance-subdoc hooky (`useUpdateCharacterFinance`/`useFinanceAddMonthly`/`useFinanceUndo`/`useCharacterFinance`) grep přes celý `src` = **jen definiční soubory** (`useCharacterMutations.ts`, `useCharacterSubdocs.ts`), žádný komponentní call-site. FinanceTab jede plně na 8.6 účtech. **Žádná invalidace netřeba = beze změny.**
- **♻️ D-05-1** — `useDeleteAccount` má `removeQueries(accountDetail)` + broad invalidate. [useCharacterAccounts.ts:143-146](../../../../src/features/world/pages/api/useCharacterAccounts.ts#L143). **Přítomno** (L2, bez testu).
- **♻️ D-05-2** — `useUpdateCurrencies.onSettled` invaliduje **oba** klíče: `['world-currencies',w]` i `['worlds',w,'currencies']` (account dropdown). [currencies/api.ts:55-60](../../../../src/features/world/currencies/api.ts#L55). **Přítomno.**
- **♻️ D-05-3** — `useConvertCharacter` invaliduje i `accountsByCharacter`. [useCharacterMutations.ts:167-169](../../../../src/features/world/pages/api/useCharacterMutations.ts#L167). **Přítomno.**
- **♻️ D-05-4** — `useAccountTransferNotifications` predikát over-broad (bez worldId scope) + reconnect refetch. [useAccountTransferNotifications.ts:36-54](../../../../src/features/world/pages/api/useAccountTransferNotifications.ts#L36). Přiznaný by-design (chybí worldId ve WS payloadu). Přidán `useSocketReconnect` (S-03). **Beze změny, latentní.**
- **♻️ C-19** — `usePersonaDirectory` používá factory `pagesQueryKey.personaDirectory`. [usePersonaDirectory.ts:18](../../../../src/features/world/pages/api/usePersonaDirectory.ts#L18). **Opraveno.**
- **♻️ ✅ vzory** — Currency optimistic ([currencies/api.ts:42-60](../../../../src/features/world/currencies/api.ts#L42)) + Favorites optimistic ([useFavoriteCharacters.ts:77-97](../../../../src/features/world/pages/CharactersPage/hooks/useFavoriteCharacters.ts#L77)) + Shop purchase broad ([shop/api.ts:137-140](../../../../src/features/world/shop/api.ts#L137)) drží plný round-trip / správný prefix. **Beze změny.**

## Nové mutace (přidané po sweepu 2026-06-05) — verdikt ✅

Tři mutace v záběru **nejsou** v oblastním plánu (přidané později); prověřeny do L2, invalidace **korektní**:

- **✅ `useChangeAccountCurrency`** (8.x currency-conversion) — [useCharacterAccounts.ts:117-133](../../../../src/features/world/pages/api/useCharacterAccounts.ts#L117). `setQueryData(accountDetail)` + broad `['characters', worldId]`. Konverze mění zůstatek/historii/šablony → vše v accountDetail (setQueryData čerstvým accountem) + accountsByCharacter (broad prefix). Konzument WalletBadge ([WalletBadge.tsx:20](../../../../src/features/world/shop/components/WalletBadge.tsx#L20), čte accountsByCharacter) pokryt broadem. Vzor identický s `useUpdateAccount`. **✅ shoda.** Test-exists [ChangeCurrencyDialog.spec.tsx](../../../../src/features/world/pages/CharacterDetailPage/components/accounts/ChangeCurrencyDialog.spec.tsx) (komponentní, ne cache-spy).
- **✅ `useSetCalendarColor`** (9.2 follow-up, PJ swatch v agregaci) — [useCharacterMutations.ts:219-235](../../../../src/features/world/pages/api/useCharacterMutations.ts#L219). Invaliduje `['calendars-aggregate', worldId]` + `subdoc('calendar', slug)`. Přesně dva konzumenti barvy (agregát + CalendarTab postavy). Použito [CalendarPage.tsx:85](../../../../src/features/world/pages/CalendarPage.tsx#L85). **✅ shoda** (C-22 vzor aplikovaný správně).
- **✅ `useBulkCreateShopItems`** (21.5a herbář → vklad do obchodu) — [shop/api.ts:80-87](../../../../src/features/world/shop/api.ts#L80). `invalidateShop` → `shopKeys.root(worldId)` = `['shop', worldId]` prefixuje items+groups+purchases. Použito [InsertToShopModal.tsx:108](../../../../src/features/ikaros/herbar/components/InsertToShopModal.tsx#L108). **✅ shoda.**

## Nové nálezy (🆕)

**Žádné.** Oblast čistá — všech 8 předchozích nálezů/deltů remediováno (C-20/21/22 test-locked, zbytek staticky), tři nové mutace korektně zapojeny. Cross-feature konzumenti (chat/TM) prověřeni: `grep` přes `features/world/chat` = **žádný** čtenář account/finance/inventory/calendar cache (embed subdocs zatím tyto RQ klíče nekonzumují); TokenCardPopoutPage nečte žádný character/account klíč.

## Latentní / VERIFY (neeskalováno na C-RUN)

- **D-05-4 přetrvává (latentní 🟡, ne nový).** WS `account:transfer:received` predikát invaliduje **všechny** `accounts`/account-listy napříč světy (chybí worldId ve WS payloadu, [:33-44](../../../../src/features/world/pages/api/useAccountTransferNotifications.ts#L33)). Cache-bezpečné (raději moc). Odblokuje až přidání `worldId` do WS payloadu (ws-contract). Beze změny od 2026-06-05.
- **Account-edit mutace bez WS push k co-ownerům (systemický, by-design).** Jen `transfer` má WS notifikaci; `adjust`/`addMonthly`/`changeCurrency`/`addCoOwner`/… se ke druhému co-ownerovi sdíleného účtu nedostanou jinak než refetchem (staleTime 30s / F5). Nová `useChangeAccountCurrency` sdílí tuto vlastnost. **Není nový nález** — konzistentní s existujícím scope (audit account WS řeší úzce jen u transferu); PJ-driven editace, tolerovatelné zpoždění. Případně budoucí D-level.

## PROOF-REQUESTy

- **FE-1 (+teeth, `DEL`):** doplnit vitest na `useDeleteAccount` → spy potvrdí `removeQueries(accountDetail)` **i** `invalidate(['characters',w])` (D-05-1 dnes jen L2 static; DEL cíl = L3+).
- **FE-2 (+teeth, `OPT`):** vitest na `useUpdateCurrencies` a `useFavoriteCharacters` — onError rollback ze snapshotu (`setQueryData(key, prev)`) + onSettled resync. Round-trip je staticky kompletní, ale OPT cíl = L3+.
- **FE-3 (volitelné):** cache-spy test na `useChangeAccountCurrency` (broad `['characters',w]`) a `useSetCalendarColor` (`calendars-aggregate` + subdoc) → nové mutace na L3.

## Pokrytí

- **Query hooky (konzumenti, přečteny):** usePersonaDirectory, useCharacterDirectory, useCharacter (detail), 5× subdoc (useCharacterSubdocs: diary/calendar/finance/inventory/notes), useCharacterAccounts, useAccount (detail), useWorldCurrencies (2 varianty: characters.types ['worlds',w,'currencies'] + currencies/api ['world-currencies',w]), useShopItems/Groups/Purchases, useCalendarsAggregate, useFavoriteCharacters (derivace z ['users','me']), WalletBadge.
- **Mutace (writers, přečteny do plné hloubky):** 3× character (update/delete/convert), 7× subdoc (diary/calendar/**setCalendarColor**/finance×3/inventory/notes), 11× account (create/update/**changeCurrency**/delete/addMonthly/adjust/undo/transfer/addCoOwner/removeCoOwner/transferPrimary), 2× currencies (updateCurrencies opt + convert read-only), 8× shop (create/**bulkCreate**/update/delete items+groups + purchase/refund), 1× favorites, WS `useAccountTransferNotifications`.
- **M-CEN:** `useConvertMutation` (currencies/api.ts:64) jediná mutace bez cache efektu — správně (read-only převodník). Ostatní ≥1 efekt.
- **Orphan/dead sken (M2):** `['characters',w]` broad prefixuje directory(legacy)+detail+subdocy+accountsByCharacter; `['accounts',…]` (accountDetail) je vlastní namespace řešený setQueryData/removeQueries; `['pages',w,'directory']` řeší persona grid (C-20); `['calendars-aggregate',w]` řešen (C-22/setCalendarColor). Žádný nový orphan/dead klíč.
- **Cross-feature (grep `features/world/chat`):** 0 čtenářů account/finance/inventory/calendar RQ cache → embed subdocs zatím mimo tuto cache plochu.

## Shrnutí

- **🆕 0** nových nálezů. Oblast **čistá** na L2 (C-20/21/22 = L3 test-locked).
- **♻️ 8** známých (C-19/20/21/22/23 + D-05-1/2/3/4) potvrzeno remediováno/latentně beze změny — NEhlásit jako nové.
- **✅ 3** nové mutace (changeCurrency / setCalendarColor / bulkCreateShopItems) korektně zapojené.
- **3 PROOF-REQUESTy** (FE teeth-testy: DEL removeQueries, OPT rollback, nové mutace).
