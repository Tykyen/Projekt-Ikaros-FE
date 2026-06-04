# 08 — Emoty, pošta, účty (Emotes + IkarosMessages + CharacterAccounts)

Tři menší odchozí-only gateway sdružené dohromady. Společné téma: **world-scoped vs broadcast vs per-user směrování** a room závislost. Žádný z těchto tří gatewayů nemá test.

**BE:** `modules/emotes/emotes.gateway.ts`, `modules/ikaros-messages/ikaros-messages.gateway.ts`, `modules/character-subdocs/character-accounts.gateway.ts`
**FE:** `features/world/chat/emotes/api/useWorldEmotes.ts`, `useGlobalEmotes.ts`, `features/ikaros/api/useMail.ts`, `features/notifications/api/useEvents.ts`, `features/world/pages/api/useAccountTransferNotifications.ts`

---

## A. Emoty — world vs global směrování

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| EMA-01 | `emote.created` BE větví: world emote → `emote:created` do `world:{worldId}`; globální → `emote:created-global` **broadcast všem**. Ověřit, že world emote NEjde broadcastem (jinak cross-world leak do cizí cache) `[auto]` | `RM` `LK` | M3 | ✅L2 |
| EMA-02 | `useWorldEmotes:65` na `emote:created` **filtruje dle `emote.worldId === worldId`** (zabrání leaku do jiného světa). Ověřit, že payload `emote:created` nese `worldId` (jinak filtr selže a propustí vše) `[auto]` | `PL` `LK` | M2 | ✅L2 |
| EMA-03 | `emote:deleted` / `emote:updated` (world) payload: `deleted` = `{ emoteId }`, `updated` = celý `emote`. Parita s FE `useWorldEmotes:66/67` `[auto]` | `PL` | M2 | ✅L2 |
| EMA-04 | Global varianty `emote:created-global/deleted-global/updated-global` (`useGlobalEmotes:54–56`) — broadcast všem přihlášeným. Ověřit, že FE filtruje `worldId == null` (globální scope) a nepřepíše world cache `[auto]` | `PL` `RM` | M2 | ✅L1 |
| EMA-05 | **Room závislost (SC-75):** world emote eventy jdou do `world:{id}`. `WorldEmotesAdminPage` je **mimo** `WorldChatRoom`, který drží `room:join world:{id}`. Ověřit, že admin stránka **sama** dělá `room:join world:{id}`, jinak emote eventy nedorazí a UI je stale bez reloadu `[auto]` | `RM` | M5 | ⚠️ |
| EMA-06 | Emote eventy nemají test (gateway bez specu). Gap-fill M7: ověřit world vs global routing + `worldId` filtr `[auto]` | `RM` `LK` | M7 | ⚠️ gap |

> **Výsledek A:** Emote routing **vzorný** — `payload.worldId ? to(world:{id}) : server.emit(*-global)` ([emotes.gateway.ts:17-23](../../../Projekt-ikaros/backend/src/modules/emotes/emotes.gateway.ts#L17)), world emote nejde broadcastem. `deleted` = `{emoteId}`, `created/updated` = celý emote (nese `worldId` pro FE filtr). EMA-05 (admin stránka room join, SC-75) `⚠️` + EMA-06 test gap → fáze oprav.

---

## B. Pošta & systémové zprávy — `ikaros:new-message` (dva listenery)

> **Dva FE listenery na stejný event** (`ikaros:new-message`): `useMail:31` (pošta) a `useEvents:26` (systémové notifikace). Rozlišují se payloadem `{ system?: boolean }` (N-33). Oba mountované globálně.

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| EMA-07 | `ikaros.message.created` → `ikaros:new-message { messageId, subject, senderName, actionType, system? }` do `user:{recipientId}`. **Payload parita:** ověřit, že emit nese `system` flag (N-33), na kterém `useEvents` filtruje `[auto]` | `PL` | M2 | ✅L2 |
| EMA-08 | `useMail:31` na `ikaros:new-message` invaliduje unread + inbox **bez** ohledu na `system`. `useEvents:26` reaguje **jen** na `system: true`. Ověřit, že běžná pošta nezpůsobí falešnou events invalidaci a systémová zpráva nespadne do inboxu, kam nepatří `[auto]` | `PL` `EX` | M2 | ✅L2 |
| EMA-09 | Oba listenery na jednom socketu na stejný event — ověřit, že `useSocketEvent` dovolí **dva** handlery téhož eventu (ne že druhý přepíše prvního). To je předpoklad, na kterém celé rozdělení stojí `[auto]` | `EX` `LC` | M3 | ✅L2 |
| EMA-10 | `ikaros:new-message` jde do `user:{recipientId}` (IkarosGateway joinuje `user:{id}` z JWT, tolerantní). Ověřit, že příjemce bez platného JWT (tolerantní handshake) prostě nedostane poštu (ne crash, ne leak jinému) `[auto]` | `AU` `RM` | M1 | ✅L1 |
| EMA-11 | `actionType` payload — FE ho používá k routování notifikace (typ akce). Ověřit enum paritu BE ↔ FE (neznámý `actionType` → fallback, ne crash) `[auto]` | `PL` | M2 | ✅ |

> **Výsledek B:** `ikaros:new-message` emit = `{ messageId, subject, senderName, system }` ([ikaros-messages.gateway.ts:38-44](../../../Projekt-ikaros/backend/src/modules/ikaros-messages/ikaros-messages.gateway.ts#L38)) — `system` (N-33) propagován, `useEvents` na něj filtruje, `useMail` ho ignoruje. **`actionType` se NEemituje** (inventura agenta byla nepřesná, jako u friendships) — FE ho nečte → žádný drift (EMA-11 bezpředmětné). IkarosGateway joinuje `user:{sub}` z JWT (tolerantní, ne payload — na rozdíl od W-10). Dvojí handler funguje (oblast 09 FES-09).

---

## C. Převody peněz — `account:transfer:received`

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| EMA-12 | `account.transfer.received` → `account:transfer:received` do `user:{userId}` **pro každého co-ownera** cílového účtu (s userId). Payload `{ fromAccountId, toAccountId, amount, currency, description, recipientCharacterIds[] }`. Parita s FE `useAccountTransferNotifications:24` `[auto]` | `PL` `RM` | M2 | ✅L1 |
| EMA-13 | Co-owner fan-out: účet s víc vlastníky → každý dostane event do svého `user:{id}`. Ověřit, že se odvíjí od `recipientCharacterIds[]` → userIds (ne broadcast) `[auto]` | `RM` `LK` | M3 | ✅L1 |
| EMA-14 | FE toast + invalidace účtů. Ověřit, že `amount`/`currency` payloadu sedí na FE zobrazení (formát částky, symbol měny — per-world měna) `[auto]` | `PL` | M2 | ⚠️ |
| EMA-15 | Odesílatel transferu: dostane vlastní event do `user:{id}`? Ověřit, zda se odesílateli neukáže „přišel ti převod" na vlastní odchozí transakci (mělo by jít jen příjemcům) `[auto]` | `RM` | M1 | ⚠️ |

> **Výsledek C:** `account:transfer:received` per-co-owner fan-out do `user:{id}` (z inventury). Payload parita L1, `amount`/`currency` formát (EMA-14) a self-notifikace odesílatele (EMA-15) `⚠️` — k doložení čtením `character-accounts.gateway.ts` při fázi oprav (gateway bez testu).

---

## Test coverage gaps

- **Žádný ze tří gatewayů nemá test** (emotes, ikaros-messages, character-accounts). Kritické: world/global emote routing (EMA-01), `system` flag směrování pošty (EMA-07/08), co-owner fan-out (EMA-13).
- FE: `useWorldEmotes`/`useGlobalEmotes` filtry (EMA-02/04), dvojí `ikaros:new-message` handler (EMA-09) — netestováno.
- Gap-fill M7/M8 prioritně na EMA-08 (pošta vs events rozlišení) — tichý mismatch by poslal systémovou zprávu do inboxu nebo naopak.

## Známá rizika (předběžná)

- **EMA-05 (admin emotes room join):** `WorldEmotesAdminPage` mimo `WorldChatRoom` — pokud sama nejoinne `world:{id}`, emote CRUD se neprojeví live (stale UI). Křehké při refaktoru routingu.
- **EMA-08/09 (dvojí listener):** rozdělení pošta/events stojí na tom, že (a) emit nese `system` flag a (b) `useSocketEvent` připustí dva handlery téhož eventu. Když jedno selže, buď pošta nenotifikuje, nebo systémová zpráva spadne do inboxu.
- **EMA-02 (emote worldId filtr):** pokud emit nenese `worldId`, FE filtr `emote.worldId === worldId` propustí vše → cross-world emote leak do cache.
