# ws / 01-pripojeni-handshake-rooms — checkpoint RUN-2026-06-20-1621

## Pokrytí

Prošel jsem (HEAD, 2026-06-20):

### BE soubory
- `gateways/base.gateway.ts` — setMaxListeners(32), handleConnection/Disconnect
- `gateways/app.gateway.ts` — room:join regex, R-04 chat gate, room:leave
- `modules/chat/chat.gateway.ts` — handleConnection JWT, handleDisconnect, channel:join W-3 fix
- `modules/global-chat/global-chat.gateway.ts` — handleDisconnect, registerPresence W-10 fix
- `modules/worlds/worlds.gateway.ts` — handleConnection JWT user:{id}
- `modules/maps/maps.gateway.ts` — handleConnection JWT povinný, map:join-world → world-ops:{id} (R-13)
- `modules/presence/presence.gateway.ts` — W-11 per-socket idle, handleConnection/Disconnect
- `modules/ikaros-messages/ikaros-messages.gateway.ts` — handleConnection JWT
- `modules/friendships/friendships.gateway.ts` — sdílí user:{id} z ChatGateway
- **NOVÉ:** `modules/admin/users-identity.gateway.ts` — handleConnection JWT, user:identity:changed (C-31)
- **NOVÉ:** `modules/bestiae/bestiae.gateway.ts` — handleConnection JWT, bestiar:changed 3-scope (C-34)
- **NOVÉ:** `modules/ikaros-events/ikaros-events.gateway.ts` — server.emit broadcast, bez handleConnection
- **NOVÉ:** `modules/ikaros-news/ikaros-news.gateway.ts` — server.emit broadcast, bez handleConnection

### FE soubory
- `features/chat/api/socket.ts` — singleton, W-8 polling+ws, reconnect
- `features/chat/api/useSocket.ts` — useSocketReconnect (W-7), useSocketEvent, useSocketInit
- `features/world/chat/components/ChannelView.tsx` — room:join chat: + W-7 reconnect
- `features/world/chat/api/useWorldChat.ts` — W-7 unread reconnect
- `features/world/chat/components/WorldChatRoom.tsx` — deleguje world: join na WorldLayout
- `features/world/hooks/useWorldSocket.ts` — W-9 room:join world: + W-7 reconnect (WorldLayout)
- `features/world/tactical-map/hooks/useActiveScenes.ts` — map:join-world + W-7 reconnect
- `app/layout/WorldLayout/WorldLayout.tsx` — useWorldSocket mount (jediný vlastník world:{id})
- `features/world/bestiar/hooks/useBestiar.ts` — bestiar:changed listener
- `features/friendships/hooks/useFriendshipsSocket.ts` — user:identity:changed listener (C-31)
- `features/ikaros/api/useIkarosNews.ts` — ikaros:news:changed listener
- `features/ikaros/api/useIkarosEvents.ts` — ikaros:events:changed listener

## Dosažená L vs cílová L

Cílová hloubka oblasti: **L2** (kontrakt staticky ověřen).

- **CONN-01..11**: ✅ L1-L2 — beze změny; opravy W-7/W-10/W-11 potvrzeny v kódu.
- **CONN-12**: ✅ L1 — regex `^[a-z]+:[a-zA-Z0-9]+$` nezměněn, R-04 gate přidán nad chat: prefixem.
- **CONN-13 (N-8)**: ✅ L1 — `world:` room stále bez membership gate (přijaté riziko); obsah roomu zkontrolován (viz níže W-RUN-01 varianta podmínky).
- **CONN-14..15**: ✅ L1.
- **CONN-16..19**: ✅ L1-L2 — W-7 opravy potvrzeny (useSocketReconnect v WorldChatRoom/ChannelView/useActiveScenes/useWorldSocket/ChatRoom); useSocketEvent re-registruje na socket swap.
- **CONN-20**: ✅ L1 (wasConnected guard potvrzen).
- **CONN-21..24**: ✅ L1-L2 — disconnect handlery defenzivní; W-11 per-socket idle potvrzen.
- **CONN-25**: ⚠️ **STALE** — komentář říká „12 gatewayů", ve skutečnosti je 16 (+ 4 nové od původního auditu). Limit 32 je orientačně dostatečný, ale komentář lže.

Dosažená hloubka: **L2** — všechny body staticky ověřeny (M1/M4); živé proof-vrstvy (runtime MaxListeners, multi-tab) vyžadují PROOF-REQUEST.

## Nálezy

### W-RUN-01 — Inventura gatewayů zastaralá: 4 nové gateways mimo původní plán · ⚠️ (střední informační dluh) 🆕

- **Kde:** `ws-contract-plan/README.md` (inventura gatewayů, tabulka, sekce „12 gatewayů"), `gateways/base.gateway.ts:25` (komentář „12 gateways")
- **Detail:** Původní plán (2026-06-04) evidoval 12 gatewayů. HEAD má **16**:
  - `users-identity.gateway.ts` — C-31, joinne `user:{id}` z JWT, emituje `user:identity:changed`
  - `bestiae.gateway.ts` — C-34, joinne `user:{id}` z JWT, emituje `bestiar:changed` (3-scope: world/user/broadcast)
  - `ikaros-events.gateway.ts` — C-47, bez handleConnection, `server.emit('ikaros:events:changed', {})`
  - `ikaros-news.gateway.ts` — C-47, bez handleConnection, `server.emit('ikaros:news:changed', {})`
  - Všechny 4 mají FE listenery. Nové gateways s handleConnection (UsersIdentity + Bestiae) správně čtou JWT a joinují `user:{id}`.
- **Dopad:** Inventura ws-contract-plan je stale → budoucí auditor přehlédne 4 gateways a jejich eventy; komentář v base.gateway.ts:25 je nepřesný.
- **Návrh:** Aktualizovat inventuru v README.md (tabulka gatewayů); opravit komentář v base.gateway.ts.
- **L1** (statické čtení); není kódový bug, jen dokumentační dluh.

### W-RUN-02 — `handleConnection` joinující `user:{id}` nyní 6× místo 4× — komentář base.gateway.ts stale · ⚠️ (nízká) ♻️

- **Kde:** `gateways/base.gateway.ts:24-25`
- **Detail:** Komentář u `setMaxListeners(32)` jmenuje „AppGateway + GlobalChatGateway + ChatGateway + WorldsGateway + IkarosMessagesGateway + presence/friendships" (7 položek). Ve skutečnosti `handleConnection` volá 8 gatewayů a `user:{id}` room joinuje 6 (ChatGateway, WorldsGateway, MapsGateway, IkarosMessagesGateway, UsersIdentityGateway, BestiaeGateway). Limit 32 je stále dostatečně vysoký pro N gastewayů × socketIO interní listenery, ale komentář je neaktuální.
- **Dopad:** Nízký (limit 32 >> počet listenerů), ale komentář může zmást příštího developera.
- **Návrh:** Aktualizovat komentář; zvažit zvýšení limitu na 48 s přehledem (`4 gateways × max ~4 listeners`). Pro přesné číslo potřeba runtime měření.
- **L1** (statické čtení).

### W-RUN-03 — `worldOpsApi.ts:22` stale komentář: `world:operation` → `world:{worldId}` (starý), ve skutečnosti `world-ops:{worldId}` (R-13) · ⚠️ (nízká) 🆕

- **Kde:** `src/features/world/tactical-map/api/worldOpsApi.ts:22`
- **Detail:** Komentář říká `world:operation` → room `world:{worldId}` (PJ orchestrator). R-13 (maps.gateway.ts:170, 280) přejmenoval room na `world-ops:{worldId}` (PJ-only, aby netekal všem členům ve world: room). FE `useActiveScenes` správně emituje `map:join-world` → joinuje `world-ops:` a poslouchá `world:operation` tam. Kód funguje správně, komentář lže.
- **Dopad:** Žádný runtime efekt; matoucí pro čtení kódu.
- **Návrh:** Opravit komentář v `worldOpsApi.ts:22`.
- **L1**.

### W-RUN-04 — `chat:channel:join` FE payload stále posílá `userId` — BE ho ignoruje (kosmetika) · ⚠️ (nízká) ♻️

- **Kde:** `src/features/world/chat/components/ChannelView.tsx:240` (initial join), `:262` (reconnect join)
- **Detail:** FE emituje `{ channelId, userId, username, avatarUrl }`. BE `chat.gateway.ts:93` čte `client.data.userId` (JWT), `payload.userId` ignoruje (W-3 fix). Pole jede po drátě ale nikdo ho nečte.
- **Dopad:** Žádný (bezpečnost OK — BE ho nepoužívá). Mírný zbytečný přenos v každém channel join (opakuje se i při reconnectu).
- **Návrh:** Odebrat `userId` z FE emitu — minimální zisk, ale čistší kontrakt.
- **L1** (payload drift kosmetika).

### W-RUN-05 — R-04 gate v `app.gateway.ts`: `room:join chat:{id}` nově vyžaduje membership — pozitivní nález, ale není v žádném registru · 🆕 ✅ (nový bezpečnostní fix bez záznamu)

- **Kde:** `gateways/app.gateway.ts:37-43`
- **Detail:** Původní audit (N-8) přijal „`room:join` bez membership checku" jako riziko pro `world:` i `chat:` prefixy. Od té doby byl přidán `canJoinChannelRoom` gate pro `chat:` prefix: neautentizovaný nebo neautorizovaný klient dostane `{ error: 'Nedostatečná oprávnění' }` a nespojí se s kanálem. Identita bere z `client.data.userId` (JWT). N-8 původní riziko platí dál jen pro `world:` (počasí, kosmetická data) — pro `chat:` bylo eliminováno.
- **Dopad:** Pozitivní. Ale ani ws-audit.md, ani N-8 záznam tuhle opravu nezachycují. Podmínka přehodnocení N-8 z CONN-13 („jakmile do world:{id} přibude citlivější payload") se netýká chat:{id} — chat:{id} je teď gated.
- **Návrh:** Zaznamenat do ws-audit.md jako ✅ opravu N-8/chat podmínky; aktualizovat CONN-13 status.
- **L2** (staticky ověřeno + app.gateway.spec.ts testuje gate).

## PROOF-REQUEST

**PR-01: Runtime MaxListeners** (CONN-25)  
Ověřit za runtime, že `client.listenerCount('*')` nepřekračuje 32 při plně připojeném klientovi (chat + mapa + presence). Bez přístupu k produkčnímu logu nelze potvrdit staticky. Doporučená metoda: přidat dočasný `console.log(client.listenerCount(...))` do BaseGateway.handleConnection při lokálním testování.

**PR-02: Multi-tab user:{id} duplicitní toast** (CONN-10)  
Manuální ověření: otevřít 2 taby se světem, z jiného uživatele triggerovat `world:access-approved` → ověřit, že oba taby zobrazí toast (očekávané) ale neprovedou duplicitní akci (FE pouze invaliduje, nepřičítá). Nelze ověřit staticky.
