# 00 — Cross-cutting: socket abstrakce, listener census, reconnect × refetch

Globální vrstva pod všemi oblastmi: jak funguje socket singleton, helpery, a **dvě mechanické perspektivy** (P1 listener census + P6 emit census), které chytají celé třídy systematicky. Tahle oblast drží **master inventuru** — ostatní oblasti z ní řežou své eventy.

**FE:** [`socket.ts`](../../src/features/chat/api/socket.ts), [`useSocket.ts`](../../src/features/chat/api/useSocket.ts)
**BE:** 12 gatewayů (viz [ws-contract-plan inventura](../ws-contract-plan/README.md))

---

## A. Socket abstrakce — lifecycle & helpery

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| XC-01 | **Singleton:** jedna `Socket` instance pro celou app (namespace `/`), `getSocket()` lazy, auth `{ token }` z `accessTokenAtom`. Ověřit, že disconnect/reconnect ovlivní **všechny** gateway naráz (sdílená instance) a že to nikde nevadí (žádný hook nepředpokládá vlastní socket) `[auto]` | `EF` | M1 | ⬜ |
| XC-02 | **`useSocketEvent(event, handler)`** — `socket.on`+cleanup, handler v ref (aktuální closure), re-registrace na `socketStatusAtom` změnu. Ověřit, že **re-registrace po výměně socketu** opravdu funguje (jinak listener po reconnectu mrtvý) `[auto]` | `EF` `RJ` | M1 | ⬜ |
| XC-03 | **`useSocketReconnect(cb)`** — callback na `'connect'`. Ověřit, že se volá při **každém** reconnectu (ne jen prvním connectu) a že cleanup neodregistruje předčasně `[auto]` | `RJ` | M1 | ⬜ |
| XC-04 | **Auth lifecycle** (`useSocketInit`) — bez tokenu `disconnectSocket()`, s tokenem `getSocket()`. Po logout/login se socket správně přepne (cross-ref cache C-29 logout cache čištění) `[auto]` | `EF` | M2 | ⬜ |

> **Výsledek A:** _(doplnit při sweepu)_

---

## B. Listener census (P1) — master inventura ~40 listenerů

> Zmapováno Explore sweepem 2026-06-13. Status sloupec se plní v oblastech 01–09; tady je **úplnost**
> (žádný `socket.on` nechybí) a **první triage** efektu. `efekt = NIC` → okamžitý `EF` kandidát.

| Hook:řádek | Event | Efekt | Cíl | Reconnect | Oblast |
|---|---|---|---|---|---|
| [`socket.ts:31-33`](../../src/features/chat/api/socket.ts#L31) | `connect`/`disconnect`/`connect_error` | jotai set | `socketStatusAtom` | — | 00 |
| [`usePresence.ts:44`](../../src/shared/presence/usePresence.ts#L44) | `presence:snapshot` | jotai set | `presenceStatusMapAtom` | snapshot on connect | 01 |
| [`usePresence.ts:45`](../../src/shared/presence/usePresence.ts#L45) | `presence:update` | jotai update | `presenceStatusMapAtom` | — | 01 |
| [`ChatRoom.tsx:235`](../../src/features/chat/components/ChatRoom.tsx#L235) | `chat:message` | setQueryData append+dedup | `['global-chat',room,'messages']` | ✅ rejoin | 02 |
| [`ChatRoom.tsx:236`](../../src/features/chat/components/ChatRoom.tsx#L236) | `chat:message:deleted` | setQueryData mark | `['global-chat',…]` | ✅ | 02 |
| [`ChatRoom.tsx:237`](../../src/features/chat/components/ChatRoom.tsx#L237) | `chat:message:reaction` | setQueryData update | `['global-chat',…]` | ✅ | 02 |
| [`ChatRoom.tsx:238`](../../src/features/chat/components/ChatRoom.tsx#L238) | `chat:presence` | setQueryData users + `setKicked` | `['global-chat',room,'room-info']` | ✅ | 02 |
| [`ChatRoom.tsx:239`](../../src/features/chat/components/ChatRoom.tsx#L239) | `chat:typing` | useState | typingNames (lokál) | — | 02 |
| [`useGlobalChat.ts:71`](../../src/features/chat/api/useGlobalChat.ts#L71) | `chat:rooms:presence` | setQueryData | `['global-chat','room-presence-counts']` | ? | 02 |
| [`ChannelView.tsx:354`](../../src/features/world/chat/components/ChannelView.tsx#L354) | `chat:message` | setQueryData append+dedup(nonce) | `['world-chat',w,'messages',ch]` | ✅ rejoin | 03 |
| [`ChannelView.tsx:355`](../../src/features/world/chat/components/ChannelView.tsx#L355) | `chat:message:updated` | setQueryData map | `['world-chat',…]` | ✅ | 03 |
| [`ChannelView.tsx:356`](../../src/features/world/chat/components/ChannelView.tsx#L356) | `chat:message:deleted` | setQueryData mark | `['world-chat',…]` | ✅ | 03 |
| [`ChannelView.tsx:357`](../../src/features/world/chat/components/ChannelView.tsx#L357) | `chat:typing` | useState | typingNames | — | 03 |
| [`useWorldChat.ts:208`](../../src/features/world/chat/api/useWorldChat.ts#L208) | `chat:unread` | setQueryData apply | `['world-chat',w,'unread']` | ? | 03 |
| [`WorldChatRoom.tsx:173-183`](../../src/features/world/chat/components/WorldChatRoom.tsx#L173) | `chat:channel/group:created/updated/deleted` + reordered | invalidate | `['world-chat',w,'groups']` | ✅ rejoin | 03 |
| [`useChannelPresence.ts:32`](../../src/features/world/chat/api/useChannelPresence.ts#L32) | `chat:presence` | setQueryData add/remove | `['world-chat',w,'presence',ch]` | ? | 03 |
| `SoundBroadcastButton.tsx:33,45` (emit only) | `sound:play`/`sound:stop` | **emit, listener?** | — | — | 03 🚩K-S1 |
| [`useWorldEmotes.ts:65-67`](../../src/features/world/chat/emotes/api/useWorldEmotes.ts#L65) | `emote:created/deleted/updated` | setQueryData dedup | `['world-emotes',w]` | ? | 04 |
| [`useGlobalEmotes.ts:54-56`](../../src/features/world/chat/emotes/api/useGlobalEmotes.ts#L54) | `emote:*-global` | setQueryData | `['global-emotes']` | ? | 04 |
| [`useWorldSocket.ts:45`](../../src/features/world/hooks/useWorldSocket.ts#L45) | `world:updated` | invalidate | `['worlds']` (broad) | ✅ rejoin | 05 |
| [`useWorldSocket.ts:51`](../../src/features/world/hooks/useWorldSocket.ts#L51) | `world:news:changed` | invalidate | `['world-news',w]` | ✅ | 05 |
| [`useWorldSocket.ts:65-66`](../../src/features/world/hooks/useWorldSocket.ts#L65) | `world:membership:changed/removed` | invalidate | `['worlds',w,'members']` | ✅ | 05 🚩K-S7 |
| [`useWorldSocket.ts:69`](../../src/features/world/hooks/useWorldSocket.ts#L69) | `world:deleted` | toast + navigate | — | ✅ | 05 |
| [`useWorldAccessSocket.ts:48-66`](../../src/features/world/hooks/useWorldAccessSocket.ts#L48) | `world:access-requested/approved/rejected/cancelled` | invalidate + toast | `['pending-actions']`/`['worlds',…]` | ❌ (user room) | 05 |
| [`useUniverseSocket.ts:68`](../../src/features/world/universe/hooks/useUniverseSocket.ts#L68) | `universe:updated` | invalidate / `setStaleFromRemote` | `universeQueryKey` | ✅ rejoin | 05 |
| [`useMapSocket.ts:95`](../../src/features/world/tactical-map/hooks/useMapSocket.ts#L95) | `map:operation` | callback | komponenta | ✅ rejoin | 06 |
| [`useMapSocket.ts:107`](../../src/features/world/tactical-map/hooks/useMapSocket.ts#L107) | `map:reassigned` | callback | komponenta | ✅ | 06 🚩K-S2 |
| [`useMapSocket.ts:119`](../../src/features/world/tactical-map/hooks/useMapSocket.ts#L119) | `map:spotlight` | callback (ephemeral) | komponenta | ✅ | 06 |
| [`useMapSocket.ts:131`](../../src/features/world/tactical-map/hooks/useMapSocket.ts#L131) | `map:pinged` | callback (ephemeral) | komponenta | ✅ | 06 |
| [`useMapWeather.ts:112`](../../src/features/world/tactical-map/hooks/useMapWeather.ts#L112) | `weather:updated` | setQueryData patch | `['worlds']` | ✅ rejoin | 06 🚩K-S6 |
| [`useActiveScenes.ts:66`](../../src/features/world/tactical-map/hooks/useActiveScenes.ts#L66) | `world:operation` (member.*) | invalidate | `['map','world-active-scenes',w]` | ✅ join-world | 06 🚩K-S5 |
| [`useReassignmentListener.ts:40`](../../src/features/world/tactical-map/hooks/useReassignmentListener.ts#L40) | `map:reassigned` | invalidate | `['map','world-active-scenes',w]` | ❌ (user room) | 06 🚩K-S2 |
| [`useIkarosNews.ts:24`](../../src/features/ikaros/api/useIkarosNews.ts#L24) | `ikaros:news:changed` | invalidate | `['ikaros-news']` | ❌ broadcast | 07 🚩K-S3 |
| [`useIkarosEvents.ts:14`](../../src/features/ikaros/api/useIkarosEvents.ts#L14) | `ikaros:events:changed` | invalidate | `['ikaros-events']` | ❌ broadcast | 07 🚩K-S3 |
| [`useMail.ts:32`](../../src/features/ikaros/api/useMail.ts#L32) | `ikaros:new-message` | invalidate | `['mail','unread'/'inbox']` | ❌ (60s poll fallback) | 07 |
| [`useEvents.ts:26`](../../src/features/notifications/api/useEvents.ts#L26) | `ikaros:new-message` (system) | invalidate | `['notification-events']` | ✅ reconnect | 07 |
| [`useChatFeed.ts:47`](../../src/features/notifications/api/useChatFeed.ts#L47) | `chat:feed:bump` | invalidate + `setUnseen` | `['chat-feed']` | ✅ reconnect | 07 |
| [`useFriendshipsSocket.ts:42-81`](../../src/features/friendships/hooks/useFriendshipsSocket.ts#L42) | `friend:request:*`/`removed`/`blocked`/`user:identity:changed` | invalidate (+toast) | `['friends'/'friendship-status'/'pending-actions'/'users','me']` | ❌ (user room) | 08 🚩K-S9 |
| [`useBestiar.ts:20`](../../src/features/world/bestiar/hooks/useBestiar.ts#L20) | `bestiar:changed` | invalidate | `['bestiar',*,systemId]` | ❌ scope room | 09 |
| [`useWeatherWsSubscribe.ts:26`](../../src/features/world/api/useWeatherWsSubscribe.ts#L26) | `weather:updated` (ne null) | setQueryData patch | `['weather-generators',w]` | ? | 09 🚩K-S6 |
| [`useAccountTransferNotifications.ts:24`](../../src/features/world/pages/api/useAccountTransferNotifications.ts#L24) | `account:transfer:received` | invalidate + toast | `['accounts','characters']` | ❌ (user room) | 09 🚩K-S4 |

> **Výsledek B:** _(doplnit — potvrdit úplnost gerpem `socket.on`/`useSocketEvent`, vyřešit `?` reconnecty, povýšit 🚩 na S-xx / ✅)_

---

## C. Reconnect × refetch matice (P3) — jádro `RJ` osy

> Dvě nezávislé otázky po výpadku: **(1) re-joinne klient room?** (jinak budoucí eventy nechodí)
> **(2) doženе zmeškané eventy?** (jinak stav zamrzne na předvýpadkovém). Private `user:{id}` roomy
> server re-joinne sám (1=✅ automaticky), ale (2) platí pro všechny. Broadcast `/` nepotřebuje (1),
> ale (2) ano. **Ideál = oba ✅ pro kritické cesty.**

| Hook | Room typ | (1) Re-join | (2) Refetch zmeškaného | Verdikt |
|---|---|---|---|---|
| useWorldSocket | `world:{id}` | ✅ useSocketReconnect | ⚠️ ověřit (invalidate jen na event) | ⬜ |
| useMapSocket | `{sceneId}` | ✅ on connect | ⚠️ operace jdou jen forward — gap = drift | ⬜ `RJ` |
| useMapWeather | `world:{id}` | ✅ on connect | ⚠️ ověřit | ⬜ |
| useActiveScenes | `world:{id}` (join-world) | ✅ useSocketReconnect | ✅ invalidate list | ⬜ |
| useUniverseSocket | `world:{id}` | ✅ on connect | ✅ invalidate | ⬜ |
| ChannelView (world chat) | `chat:{ch}` | ✅ useSocketReconnect | ⚠️ rejoin ano, ale dožene zmeškané zprávy? | ⬜ |
| ChatRoom (global) | `chat:{ch}` | ✅ useSocketReconnect | ⚠️ ditto | ⬜ |
| useChatFeed / useEvents | broadcast | n/a | ✅ useSocketReconnect+invalidate | ✅ |
| useMail | `user:{id}` | ✅ server auto | ✅ 60s poll fallback | ✅ |
| **useIkarosNews/Events** | broadcast | n/a | ❌ **žádný reconnect** | 🚩K-S3 |
| **useFriendshipsSocket** | `user:{id}` | ✅ server auto | ❌ **žádný refetch** | 🚩K-S9 |
| **useWorldAccessSocket** | `user:{id}` | ✅ server auto | ❌ žádný refetch | ⬜ ověřit dopad |
| **useAccountTransferNotifications** | `user:{id}` | ✅ server auto | ❌ žádný refetch | 🚩K-S4 |
| **useReassignmentListener** | `user:{id}` | ✅ server auto | ❌ (invalidate jen na event) | ⬜ |
| **useBestiar** | scope room | ⚠️ ověřit join | ❌ | ⬜ |

> **Výsledek C:** _(doplnit — pravidlo: private/broadcast room s kritickým efektem BEZ refetch fallbacku = `RJ` nález; ephemerální/kosmetický = přijatý dluh)_

---

## D. Emit census (P6) — mrtvé emity (`EM`)

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| XC-05 | Vyextrahovat **všechny** BE emit stringy z 12 gatewayů (`server.to().emit`, `client.emit`, `@OnEvent`→emit) → spárovat s FE `socket.on`. Seznam **BE emit bez FE listeneru** `[auto]` | `EM` | M-EMIT | ⬜ |
| XC-06 | **`chat:sound:*` echo** — FE emituje `sound:play/stop`, BE ChatGateway přijímá (`@SubscribeMessage sound:play/stop`). Co BE **re-emituje** ostatním a má to FE listener? Pokud BE broadcastne `sound:playing`/`sound:stopped` a FE nemá `socket.on` → zvuk slyší jen iniciátor (K-S1) `[auto]` | `EM` `EF` | M-EMIT | ⬜ 🚩K-S1 |
| XC-07 | Opačný směr (FE `socket.on` bez BE emitu = mrtvý listener) je už pokrytý `audit:ws` — jen převzít jeho výstup, neopakovat `[auto]` | `EM` | M6 | ⬜ |

> **Výsledek D — census hotový 2026-06-13 (M-EMIT):** BE **114** emits ↔ FE **60** listens. Rozdíl
> NENÍ díra — tvoří ho `-global` varianty (`emote:*-global`), **room-cílení téhož eventu** (např.
> `chat:message` jde do `user:{id}` i `chat:{ch}`), lifecycle (`connect`/`disconnect`/`connect_error`)
> a imperativní emity (`presence:update`, `chat:presence`) v `handleConnection`/`handleDisconnect`.
> **Reálně mrtvé 2:** `map:member-joined`/`-left` ([maps.gateway.ts:285-298](../../../Projekt-ikaros/backend/src/modules/maps/maps.gateway.ts#L285)) → **S-01**; `error` 8×
> ([maps.gateway.ts](../../../Projekt-ikaros/backend/src/modules/maps/maps.gateway.ts), :67/78/91/111/124/159/227/322) → **S-02**. **K-S1 sound echo VYVRÁCENO** —
> listener [`SoundNowPlayingBanner.tsx:62-63`](../../../Projekt-ikaros-FE/src/features/world/chat/components/SoundNowPlayingBanner.tsx#L62). → [auditu](../state-consistency-audit.md) `S-01`/`S-02`.

---

## Test coverage gaps

- **FE socket hooky nemají dedikované testy** (dle ws-plan baseline ~0). Gap-fill M5: mock socket → `emit(event, payload)` → assert `invalidateQueries` klíč / `setQueryData` výsledek. Priorita: chat dedup (CV), reconnect refetch (RJ).
- Round-trip 2 klienti (M4) na: chat zpráva, token operace, friend request, account transfer.

## Známá rizika (předběžná)

- **Reconnect gap je systematický** — 8 hooků bez refetch fallbacku (matice C). Ne všechny jsou kritické (ephemerální spotlight/ping ne), ale finanční (transfer) a sociální (friend request) ano.
- **`map:join-world` ≠ `room:join`** (K-S5) — pokud custom emit reálně nejoinne `world:{id}`, celý active-scenes orchestrátor oslepne. Ověřit v MapsGateway BE jako první (blokuje verdikt 06).
- **Duplicitní `map:reassigned`/`weather:updated`** — ne nutně bug, ale dva efekty na jeden event = závod/redundance. Doložit záměr.
