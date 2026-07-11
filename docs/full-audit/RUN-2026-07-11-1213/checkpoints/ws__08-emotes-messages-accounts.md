# Checkpoint — WS oblast 08 (Emoty, pošta, účty)

RUN: RUN-2026-07-11-1213 · styl: ws-contract-plan · oblast: `docs/ws-contract-plan/08-emotes-messages-accounts.md` · prefix `W-`
Datum: 2026-07-11 · režim: READ-ONLY, hloubka L1–L3 (dosaženo L2; round-trip testů 0 → L4 nedosažitelné bez gap-fill)

## Rozsah
Tři odchozí-only gatewaye: `EmotesGateway`, `IkarosMessagesGateway`, `CharacterAccountsGateway` + FE listenery
(`useWorldEmotes`, `useGlobalEmotes`, `useMail`/`useEvents`, `useAccountTransferNotifications`).
Baseline WS-auditu (2026-06-04, `ws-audit.md`) měl celou oblast projitou, žádný W-nález nebyl v oblasti 08.
Tento běh ověřuje shodu s AKTUÁLNÍM kódem a hledá drift/regrese/nové úpravy.

## Verdikt: BEZ NOVÝCH NÁLEZŮ (L2). Žádný W-xx.
Všechny baseline body sedí nebo se dořešily. Dvě dříve `⚠️` položky (EMA-05, EMA-15) tímto během **uzavřeny**.

---

## A. Emoty

### ♻️ EMA-01/02/03 — routing vzorný, potvrzeno L2
`emotes.gateway.ts:30-37` — `payload.worldId ? to(world:{id}).emit('emote:created') : server.emit('emote:created-global')`.
World emote NEjde broadcastem (žádný leak do cizí cache). FE filtr `emote.worldId !== worldId` v
[`useWorldEmotes.ts:37`](../../../../Projekt-ikaros-FE/src/features/world/chat/emotes/api/useWorldEmotes.ts) sedí; `deleted` = `{emoteId}` (`:48`), `created/updated` = emote objekt.

### ♻️🆕 NOVÁ ZMĚNA od baseline — leak-safe strip `createdBy` (FIX-B část 1, 2026-07)
`emotes.gateway.ts:14-17`:
```ts
function toLeakSafeEmote(emote: CustomEmote): Omit<CustomEmote, 'createdBy'> {
  const { createdBy: _createdBy, ...safe } = emote;
  return safe;
}
```
- **Klasifikace:** ♻️ (vyřešený leak, ne otevřený nález). Baseline „Výsledek A" psal „created/updated = celý emote" — od té doby přibyl strip `createdBy` (= userId autora), který by jinak tekl komukoli v `world:{id}` roomu (N-8 join bez membership).
- **Ověřeno bezpečné:** `Omit` odstraní JEN `createdBy`; `worldId` zůstává ([custom-emote.interface.ts:2](../../../../Projekt-ikaros/backend/src/modules/emotes/interfaces/custom-emote.interface.ts)) → FE filtr EMA-02 dál funguje; `imageUrl`/`tags` zůstávají (render). FE (`useWorldEmotes`/`useGlobalEmotes`) `createdBy` z WS nečte → zpětně kompatibilní. Bez nálezu.

### ♻️ EMA-05 (SC-75, admin room join) — UZAVŘENO (baseline `⚠️`)
Dříve podezření, že `WorldEmotesAdminPage` je mimo `WorldChatRoom` → emote eventy nedorazí.
**Vyřešeno na úrovni layoutu (W-9/W-7 fix):** [`useWorldSocket.ts:31-42`](../../../../Projekt-ikaros-FE/src/features/world/hooks/useWorldSocket.ts) mountnutý ve `WorldLayout` (obaluje VŠECHNY stránky světa) dělá `socket.emit('room:join', 'world:${worldId}')` + reconnect re-join přes `useSocketReconnect`. Komentář `:22-25` explicitně: „Dílčí komponenty (WorldChatRoom, emote admin) už room:join `world:` dělat nemusí." `WorldEmotesAdminPage.tsx:24` jen konzumuje `useWorldEmotes` (žádný vlastní join nepotřebuje) → eventy dorazí. **⚠️ → ✅.**

### ⚠️ EMA-06 — test gap trvá
Žádný ze tří gatewayů nemá test (potvrzeno). Round-trip (M8) pro world/global routing chybí → strop L2. Ne nález, dluh pokrytí (viz baseline „Test coverage gaps").

---

## B. Pošta & systémové zprávy — `ikaros:new-message`

### ♻️ EMA-07/08/10 — beze změny, L2
`ikaros-messages.gateway.ts:37-43` emit = `{ messageId, subject, senderName, system: payload.system ?? false }` do `user:{recipientId}`.
`system` (N-33) propagován → `useEvents` na něj filtruje, `useMail` ho ignoruje. Handshake tolerantní: `handleConnection` joinuje `user:{sub}` z JWT (`:17-27`), bez tokenu socket bez user-roomu (ne crash, ne leak) — na rozdíl od W-10 identitu bere z JWT, ne z payloadu. Parita sedí.

### ♻️ EMA-11 — `actionType` se NEEMITUJE (potvrzeno, žádný drift)
Baseline lekce potvrzena: emit nenese `actionType` (`:37-43` má jen 4 pole). FE ho nečte → bezpředmětné, žádný nález.

---

## C. Převody peněz — `account:transfer:received`

### ♻️ EMA-12 — payload parita SEDÍ; plán měl nepřesnou inventuru (stejná lekce jako K-1/EMA-11)
`character-accounts.gateway.ts:33-39` emituje:
```ts
{ fromAccountId, toAccountId, amount, currency, description }
```
FE [`useAccountTransferNotifications.ts:5-11`](../../../../Projekt-ikaros-FE/src/features/world/pages/api/useAccountTransferNotifications.ts) `TransferReceivedPayload` = **přesně stejných 5 polí**. → **parita L2 OK.**
- **Pozor na doc-drift:** plán EMA-12 tvrdí payload obsahuje i `recipientCharacterIds[]`. To je **interní `@OnEvent` payload** (`AccountTransferReceivedEvent`, [character-accounts.service.ts:29-30](../../../../Projekt-ikaros/backend/src/modules/character-subdocs/character-accounts.service.ts)), který gateway spotřebuje pro fan-out a do Socket.IO emitu ho NEpropustí. Stejná záměna „@OnEvent × odchozí emit" jako u friendships (K-1) a ikaros (`actionType`). Není to bug — jen nepřesnost v plánu. Klasifikace ♻️.

### ♻️ EMA-13 — co-owner fan-out per-user, potvrzeno L2
`gateway:27-40` iteruje `payload.recipientCharacterIds` → `charactersService.findById` → `character.userId` → `to(user:{userId}).emit(...)`. Zdroj = `to.ownerCharacterIds` (co-owners CÍLOVÉho účtu), [service.ts:620/663](../../../../Projekt-ikaros/backend/src/modules/character-subdocs/character-accounts.service.ts). Per-user room, žádný broadcast. NPC/Lokace bez `userId` přeskočeny (`if (!userId) continue`). Bez leaku.

### ⚠️→✅ EMA-15 (self-notifikace odesílatele) — UZAVŘENO jako by-design
Event cílí JEN na co-ownery `to` (cílového) účtu. Při běžném převodu jiné straně odesílatel NENÍ co-owner cíle → notifikaci nedostane (korektně). Jen u převodu mezi DVĚMA vlastními účty (odesílatel = co-owner cíle) dostane „Příjem" toast — což je legitimní příjmová notifikace na cílovém účtu. Žádný falešný push na cizí odchozí transakci, žádný leak. **⚠️ → přijato (by-design).**

### ⚠️ EMA-14 — currency/amount formát (kosmetika, trvá)
FE zobrazí syrově `${payload.amount} ${payload.currency}` ([hook:28-32](../../../../Projekt-ikaros-FE/src/features/world/pages/api/useAccountTransferNotifications.ts)). `currency` = `to.currency` (per-world měna) — správný zdroj. Bez formátování/lokalizace částky. Kosmetický dluh, ne nález; nezměněno od baseline.

---

## Souhrn klasifikace
| Bod | Klasifikace | Stav |
|---|---|---|
| EMA-01/02/03 emote routing | ♻️ | ✅ L2 |
| Emote `createdBy` strip (FIX-B) | 🆕♻️ | ✅ vyřešený leak, FE-kompat |
| EMA-05 admin room join (SC-75) | ♻️ | ✅ uzavřeno (WorldLayout/useWorldSocket) |
| EMA-06 test gap | — | ⚠️ dluh pokrytí (L2 strop) |
| EMA-07/08/10/11 pošta | ♻️ | ✅ L2, beze změny |
| EMA-12 accounts payload | ♻️ | ✅ L2 (doc plánu nepřesný, ne bug) |
| EMA-13 co-owner fan-out | ♻️ | ✅ L2 |
| EMA-14 currency formát | — | ⚠️ kosmetika |
| EMA-15 self-notifikace | ♻️ | ✅ uzavřeno by-design |

**Nové W-xx: 0.** Registr `ws-audit.md` neaktualizován (žádný nový nález).
Nejzávažnější zjištění tohoto běhu = pozitivní: leak `createdBy` v emote payloadu byl mezi běhy opraven (FIX-B) a EMA-05 uzavřeno layout-level room ownershipem.
