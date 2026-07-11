# Checkpoint — ws / 02-world-chat-gateway (ChatGateway)

Datum: 2026-07-11 · Auditor: READ-ONLY · Styl: ws (prefix W-) · Registr: docs/ws-audit.md
Záběr (BE): `backend/src/modules/chat/chat.gateway.ts` (celý, 435 ř.), `chat.service.ts` (relevantní:
whisper emit, unread emit, presence role, reorder, combat, member-revoke), `chat.service.spec.ts` (combat/revoke).
Záběr (FE): `features/world/chat/components/ChannelView.tsx`, `WorldChatRoom.tsx`,
`api/useWorldChat.ts` (applyUnreadEvent/useUnreadSync), `api/useChannelCombat.ts`, `lib/types.ts`.

## Verdikt
**Bez nových závažných nálezů. L2–L3 napříč oblastí.** Registrové W-3 i W-4 stále opravené a drží.
Dvě nové odchozí cesty od data plánu (`chat:combat:updated` 16.1e, `chat.channel.member.revoked` FIX-44)
mají čistý kontrakt/room targeting. Jediné reziduum = 1 přetrvávající ⚪ kosmetika (raw-string payload
`chat:group:deleted`, nese se z RUN-2026-06-20 jako W-RUN-01, dosud neopraveno). 1 nízký kandidát (stale
sidebar u revokovaného člena) — spíš by-design, needit.

---

## Stav registrových nálezů (♻️/🔓 kontrola regrese)

- **W-3 (presence spoofing) — OPRAVENO drží ✅.** `handleChannelJoin` bere identitu z
  `client.data.userId` (ověřený JWT handshake), payloadové `userId` v signatuře je, ale **nečte se**
  ([chat.gateway.ts:108-114](../../../../Projekt-ikaros/backend/src/modules/chat/chat.gateway.ts#L108)):
  ```ts
  const userId = (client.data as { userId?: string }).userId;
  if (!userId) return;
  const worldRole = await this.chatService.resolveChannelPresenceRole(payload.channelId, userId);
  ```
  Žádná regrese.
- **W-4 (channel:created metadata leak) — OPRAVENO drží ✅.** `chat.channel.created/updated` +
  `chat.group.created/updated` emitují jen `{ worldId }` ([chat.gateway.ts:307-383](../../../../Projekt-ikaros/backend/src/modules/chat/chat.gateway.ts#L307)).
  **Navíc rozšířeno (FIX-B část 2):** i reorder eventy `chat:groups:reordered`/`chat:channels:reordered`
  teď emitují jen `{ worldId }` místo dřívějšího `items:[{id,order}]` ([:401-420](../../../../Projekt-ikaros/backend/src/modules/chat/chat.gateway.ts#L401)) → zavřená další leak-cesta,
  kterou plán (WCH-12) ještě popisuje jako „round-trip parita items[]" (doc drift, ne kód bug).
- **K-3 / WCH-06 (`chat:unread` mentionCount) — by-design drží ✅.** BE emit jen `{ channelId, count }`
  ([:430-433](../../../../Projekt-ikaros/backend/src/modules/chat/chat.gateway.ts#L430)); FE
  `applyUnreadEvent` u `-1` zachová `prevMention`, jinak `event.mentionCount ?? 0`
  ([useWorldChat.ts:248-253](../../../src/features/world/chat/api/useWorldChat.ts#L248)). Nezměněno.
- **W-7 (reconnect re-join) — drží ✅** pro tuto oblast: `useChannelCombatSync` má i
  `useSocketReconnect` fallback ([useChannelCombat.ts:239-242](../../../src/features/world/chat/api/useChannelCombat.ts#L239)); unread sync taktéž
  ([useWorldChat.ts:282-284](../../../src/features/world/chat/api/useWorldChat.ts#L282)).

---

## Nové odchozí cesty (od data plánu 2026-06-04) — kontrakt L2/L3 OK

Gateway vzrostl z 12 na 15 `@OnEvent` mostů. Dvě nové vůči plánu:

1. **`chat:combat:updated` (16.1e).** BE
   [chat.gateway.ts:361-366](../../../../Projekt-ikaros/backend/src/modules/chat/chat.gateway.ts#L361):
   emit `{ channelId }` do `chat:{channelId}` (leak-safe signál). Trigger
   [chat.service.ts:919](../../../../Projekt-ikaros/backend/src/modules/chat/chat.service.ts#L919).
   FE listener [useChannelCombat.ts:235-238](../../../src/features/world/chat/api/useChannelCombat.ts#L235):
   `useSocketEvent<{ channelId: string }>('chat:combat:updated', …)`, filtr `e.channelId !== channelId`,
   → `invalidateQueries(combatKey)`. **Payload parita sedí, leak-safe** (refetch `GET combatants` je
   server-filtrovaný přes `isManager`, [chat.service.ts:719-724](../../../../Projekt-ikaros/backend/src/modules/chat/chat.service.ts#L719) — hráč nedostane skryté combatanty). `RM`: signál jde všem
   v `chat:{channelId}`, kde ChannelView sedí přes `chat:channel:join`/`room:join`. **✅L2.**
2. **`chat.channel.member.revoked` (FIX-44).** BE
   [chat.gateway.ts:348-356](../../../../Projekt-ikaros/backend/src/modules/chat/chat.gateway.ts#L348):
   `server.in(user:{userId}).socketsLeave(chat:{channelId})` — **server-side room leave, žádný Socket.IO
   emit** → správně **nemá** FE listenera. Trigger při odebrání z `allowedMemberIds`
   ([chat.service.ts:2237](../../../../Projekt-ikaros/backend/src/modules/chat/chat.service.ts#L2237)),
   pokryto testem `chat.service.spec.ts:288`. Řeší, že revokovaný uživatel dál neposlouchá živé zprávy
   přes už otevřený WS room (join přeživší DB změnu). **✅L3** (test) — čistá anti-leak cesta.

Ostatní zprávové/typing/sound/feed cesty beze změny vůči registrovanému stavu; payload parita
(`overrideName`/`senderIsDeleted`/`clientNonce`/`diceSkin` v emitovaném `ChatMessage`) drží
([chat.service.ts:1074,1396,1416,1420](../../../../Projekt-ikaros/backend/src/modules/chat/chat.service.ts#L1074)),
FE swap/delete filtruje dle `channelId` a klíčuje `id` ([ChannelView.tsx:355-375](../../../src/features/world/chat/components/ChannelView.tsx#L355)).

---

## 🆕 (přetrvává z RUN-2026-06-20) — `chat:group:deleted` emituje holý string · osa `PL` · ⚪ kosmetika

**Kde:** [chat.gateway.ts:385-390](../../../../Projekt-ikaros/backend/src/modules/chat/chat.gateway.ts#L385):
```ts
@OnEvent('chat.group.deleted')
handleGroupDeleted(payload: { worldId: string; groupId: string }): void {
  this.server.to(`world:${payload.worldId}`).emit('chat:group:deleted', payload.groupId);
}
```
Posílá **raw string** `groupId`, zatímco sousední `chat:channel:deleted` posílá objekt
`{ channelId, groupId }` ([:333-336](../../../../Projekt-ikaros/backend/src/modules/chat/chat.gateway.ts#L333))
a created/updated/reordered posílají `{ worldId }`. **FE dopad: žádný** — `WorldChatRoom.tsx:204`
`useSocketEvent('chat:group:deleted', invalidateGroups)` payload ignoruje (jen invaliduje cache).
Typová nekonzistence + doc drift (plán WCH-11 slibuje objekt). Bylo zapsáno jako **W-RUN-01** v
RUN-2026-06-20-1621, do `ws-audit.md` registru nepromováno, dosud neopraveno. **L1.** Návrh: zabalit do
`{ worldId, groupId }` pro konzistenci — čistě kosmetické, bez funkčního dopadu.

## Nízký kandidát (needit, spíš by-design) — revokovaný člen: stale sidebar

`chat.channel.member.revoked` udělá `socketsLeave` (živé zprávy ustanou), ale revokovanému uživateli
**neposílá žádný signál k invalidaci groups cache** → kanál mu zůstane viset v sidebaru z posledního
`GET groups`, dokud sám nerefetchne. **Bez leaku** — REST `getMessages` po revokaci vrátí 403, metadata
už dřív legitimně měl. Jen vizuální staleness. Nízká priorita, needit; případný fix = doplnit
`chat:channel:deleted`-like signál do `user:{revokedId}` nebo se spolehnout na membership-change invalidaci.

---

## Test coverage (pozn.)
- `chat.service.spec.ts` pokrývá `chat.channel.member.revoked` emit (`:288-331`) a combat toEntity filtr.
- `chat.gateway.spec.ts` (~30 t.) — presence W-3 regrese + sound N-9 (dle registru). **Gap trvá (WCH-23):**
  sound role-gate `< PomocnyPJ` → tiché ignorování bez explicitního testu; nově i **combat/member-revoke
  gateway most bez round-trip testu** (jen service-level). Nízká priorita.

## PROOF-REQUEST
Žádný — statické L1–L3 dostačují. Živá WS infra (L4 round-trip) nedostupná, neznačím hotové.
