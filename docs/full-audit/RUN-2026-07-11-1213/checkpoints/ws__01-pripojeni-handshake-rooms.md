# ws — 01 Připojení, handshake, rooms · dosažená L2–L3 (statika obou stran)

Oblast: `docs/ws-contract-plan/01-pripojeni-handshake-rooms.md` · styl ws · registr `docs/ws-audit.md` (prefix W-).
Rozsah: handshake / room gating / identita napříč všemi gateway (BE) + FE socket vrstva (reconnect re-join).

## Verdikt: BEZ NOVÝCH NÁLEZŮ (L2–L3). Oblast výrazně zpevněna nad registr.

Registr `ws-audit.md` je HOTOVO (11× W). Re-audit proti HEAD potvrzuje, že **všech 5 nálezů oblasti 01/09 je fixnuto** a přibyla další obrana, kterou registr ještě nemá (R-04, FIX-1, FIX-44, R-13, FIX-A, W-RUN-01/07, FIX-B). Žádný 🆕 leak, žádná ♻️ regrese ve vlastní ws vrstvě.

### Potvrzené fixy (identita z JWT, ne z payloadu)
- **W-3** (presence spoofing) ✅ — `chat.gateway.ts:108` `const userId = (client.data ...).userId; if (!userId) return;` — `chat:channel:join` bere identitu z ověřeného JWT handshake, `payload.userId` se ignoruje.
- **W-10** (global chat user-room leak) ✅ — `global-chat.gateway.ts:315` `if (!data.userId) return;` + `:533` `void client.join(\`user:${userId}\`)` s userId z `client.data` (JWT), ne z payloadu. Host anti-spoof: `:317` jméno z `data.anonName`.
- **W-11** (multi-tab idle) ✅ — `presence.gateway.ts:29-30,138-155` idle per-socket (`idleSockets`), user idle ⟺ všechny sockety idle (`recomputeIdle`).
- **Auto-join `user:{id}` z JWT `payload.sub`** ✅ napříč: `chat.gateway.ts:64`, `worlds.gateway.ts:30`, `maps.gateway.ts:91`, `ikaros-messages.gateway.ts:23`. Friendships/accounts nemají vlastní handshake — emitují na sdílené `user:{id}` (friendships.gateway JSDoc:15-20).

### Room gating (nad registr — přibylo)
- **R-04** `app.gateway.ts:37-43` — `room:join chat:{id}` nově gatuje `chatService.canJoinChannelRoom(channelId, userId)`; dřív generický join pouštěl restricted world kanál → leak real-time zpráv. Identita z `client.data.userId`.
- **FIX-1** `app.gateway.ts:48-53` — `room:join user:{id}` odmítne cizí room (`room !== user:${userId}`); neautentizovaný (bez `client.data.userId`) nedosáhne na žádný user room.
- **Regex** `app.gateway.ts:16` `^[a-z]+:[a-zA-Z0-9]+$` — `../`/prázdné/víc dvojteček = no-op (CONN-12 ✅L1).
- **CONN-13 / N-8 (world:{id} bez membership) = stále přijaté, podmínka DRŽÍ.** Enumerace payloadů tekoucích do `world:{id}`: `weather:updated`, `universe:updated` (signál), `world:updated`/`deleted`/`news:changed`/`membership:*` (leak-safe `{worldId}`/ID — `worlds.gateway.ts:41-87`), `emote:*` (`createdBy` stripnut — `emotes.gateway.ts:14`), `chat:channel|group:created/updated/*reordered` (signál `{worldId}` — W-4/FIX-B, `chat.gateway.ts:307-420`). **Nic citlivějšího než ID/signál → eskalace není třeba.**
- **R-13** `maps.gateway.ts:188,201,319-332` — `world:operation` (kdo/kde/kdo změnil) přesunut do PJ-gated `world-ops:{id}` (pomlčka rozbije regex generického `room:join` → běžný člen tam nedosáhne). `map:join` má membership+currentScene gate (`:133-143`, W-RUN-07-02).

### FE reconnect re-join (W-7) — plošně vyřešeno
- `useSocketReconnect` (`useSocket.ts:55-76`) re-registruje `socket.on('connect')` na změnu `socketStatusAtom` (S-RUN-04) → drží i po `reconnectSocket()` swapu. Ověřeno ~14 call-sites: world room `useWorldSocket.ts:40` (přesunuto do WorldLayout, W-9), `ChannelView.tsx:296` (`room:join chat` + `chat:channel:join`), `useWorldChat.ts:282`, `useActiveScenes.ts:76` (`map:join-world`), mapy/weather/friendships/emotes/ikaros/accounts. Pokryto testem `useSocket.spec.ts`.

## Reziduum (♻️ — cross-cut ext-35 session, NENÍ nový ws nález)
- **`wsAccountGate` je connect-time only; ban/delete neodpojí živý socket + role se na WS nikdy nereviduje.** `socket-io.adapter.ts:34-51,84-90` server.use middleware ověří ban jen při handshake; **grep v `modules/users` = 0 `disconnectSockets`/`.disconnect()`** → zabanovaný uživatel s už otevřeným socketem používá WS akce (`ikaros:whisper`, `chat:reaction:toggle`, `sound:play`) dál, dokud se sám neodpojí (socket nepřežije re-verify tokenu — Socket.IO ho po connectu nekontroluje). Role z JWT (`maps.gateway.ts:88` `role: payload.role`) je stale-safe jen proto, že map access dorovnává DB (`membershipRepo`/`elevationService`) — samotný stale role tam není exploit.
  - Osa: `AU` `LC`. Závažnost ⭐ (medium-low). **Root cause = chybějící token/session invalidace (JWT_EXPIRES_IN 3d, žádný tokenVersion)** — vlastněno `ext-35__session.md` Verdikt 1 + `role_audit`. Fix (force-disconnect user socketů při banu / token re-validace na WS) patří do session/role plánu, ne do ws-audit jako nový W-.

## Otevřené ⚠️ z plánu (nezměněno, ne nález)
- **CONN-25** `base.gateway.ts:28` `setMaxListeners(32)` — orientačně dost (12 gatewayů); plán chce ověřit pod plnou zátěží (chat+mapa+presence naráz). Statikou neověřitelné → M-load, ne blocker.
- **Guest v presence:** `presence.gateway.authUser` propouští i guest sub (guest má `payload.sub`) → guest se broadcastuje jako online. Kosmetika, patří do oblasti 04 (presence), ne 01.

## Coverage
- BE: čteny handleConnection/room handlery všech gateway (base/app/chat/global-chat/presence/maps/worlds/ikaros-messages/friendships/universe/emotes/character-accounts) + `socket-io.adapter.ts`.
- FE: `socket.ts`, `useSocket.ts` (reconnect), call-sites `room:join`/`map:join-world`/`chat:channel:join`.
- Úroveň: L2 (kontrakt obou stran přečten), L3 kde existuje test (`useSocket.spec.ts`, gateway specs). Round-trip (M8) neproveden — pro tuto oblast není nový kandidát.
