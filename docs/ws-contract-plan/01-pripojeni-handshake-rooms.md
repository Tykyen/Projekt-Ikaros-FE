# 01 — Připojení, handshake, rooms

Páteř celé WS vrstvy. Jedna sdílená Socket.IO instance (namespace `/`), JWT v handshake, room model `user:` / `chat:` / `world:` / `{sceneId}`. Pokud selže tahle vrstva, **každý** event v ostatních oblastech tiše nedorazí.

**BE:** `gateways/base.gateway.ts`, `gateways/app.gateway.ts`, `handleConnection` všech gatewayů s JWT
**FE:** `features/chat/api/socket.ts` (singleton), `features/chat/api/useSocket.ts` (`useSocketInit`, `useSocketEvent`)

---

## A. Handshake & autentizace

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| CONN-01 | FE předává JWT v `auth: { token }` při `io()` (socket.ts) — token je čerstvý (po loginu/refreshi se socket re-inituje, ne drží starý token) `[auto]` | `AU` | M1 | ✅L1 |
| CONN-02 | `reconnectSocket()` (D-052, po změně hiddenPresence) force-disconnectne a vytvoří nový socket s aktuálním tokenem — starý socket se nerecykluje s neaktuální identitou `[auto]` | `LC` `AU` | M1 | ✅L1 |
| CONN-03 | **Handshake konzistence**: ChatGateway/WorldsGateway/IkarosGateway jsou **tolerantní** (bez tokenu socket projde, jen nedostane `user:{id}`). Ověřit, že tolerantní gateway nikdy neposlou per-user citlivá data socketu bez ověřené identity `[auto]` | `AU` `LK` | M4 | ✅L2 |
| CONN-04 | **MapsGateway povinný JWT** — bez tokenu emituje `error` event a nejoinne nic; ověřit, že neautentizovaný socket nedostane žádný `map:*` event `[auto]` | `AU` | M1 | ✅L1 |
| CONN-05 | **PresenceGateway povinný JWT** — bez tokenu connection ignorována (žádný snapshot, žádné zařazení do registry) `[auto]` | `AU` | M3 | ✅L1 |
| CONN-06 | JWT verify používá stejný secret/JwtService napříč gateway — token validní pro jeden gateway je validní pro všechny (jedna instance, jeden handshake) `[auto]` | `AU` | M1 | ✅L1 |
| CONN-07 | Expirovaný/neplatný token: `JwtService.verify` hodí → gateway to chytá (try/catch), socket nespadne, jen zůstane bez `user:{id}`. Ověřit že není unhandled rejection `[auto]` | `AU` `LC` | M1 | ✅L1 |

> **Výsledek A:** Handshake konzistentní — per-user `user:{id}` joinuje server z **JWT `payload.sub`** ([chat.gateway.ts:45-50](../../../Projekt-ikaros/backend/src/modules/chat/chat.gateway.ts#L45)), ne z payloadu. Tolerantní gateway bez tokenu jen `return` (try/catch, žádný throw). Citlivé per-user eventy proto nemohou dorazit neověřenému socketu (není v `user:{id}`). **Výjimka: GlobalChat joinuje `user:{id}` z payloadu** — viz oblast 03 (W-9).

---

## B. `user:{id}` auto-join (per-user room)

> **Kritické:** všechny privátní eventy (whisper, unread, friend, access, mail, transfer, reassign) jdou do `user:{userId}`. Do tohoto roomu klient **sám nejoinuje** — joinne ho **server** v `handleConnection` několika gatewayů z JWT. Pokud auto-join selže, celá privátní vrstva oslepne bez chyby.

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| CONN-08 | `user:{id}` joinne ChatGateway, WorldsGateway, MapsGateway, IkarosGateway — **každý nezávisle**. Ověřit, že `client.join('user:'+id)` je idempotentní (vícenásobný join stejného roomu = no-op, ne duplicitní doručení) `[auto]` | `RM` `LC` | M1 | ✅L1 |
| CONN-09 | Pokud uživatel není přihlášen na žádné stránce, která mountuje Chat/Worlds/Maps gateway connection… ověřit, že `user:{id}` přesto vznikne (gateway connection je global, ne per-page) — jinak friend/mail eventy nedorazí na stránkách mimo svět `[auto]` | `RM` `LC` | M1 | ✅L1 |
| CONN-10 | **Multi-tab**: dva taby = dva sockety = dva členové `user:{id}` roomu. Event do `user:{id}` dorazí oběma. Ověřit, že to nevede k duplicitním toastům/akcím (FE idempotence na úrovni invalidace, ne přičítání) `[auto]` | `LC` | M1 | ⏭️ |
| CONN-11 | Disconnect jednoho z více tabů **neodebere** `user:{id}` doručování ostatním tabům (room drží dokud existuje ≥1 socket) `[auto]` | `LC` | M1 | ✅L1 |

> **Výsledek B:** `user:{id}` join je idempotentní (Socket.IO `join` na existující room = no-op). Connection je global (jeden sdílený socket z `useSocketInit` v root layoutu), ne per-page → friend/mail eventy fungují kdekoli. Multi-tab duplicitní toast = `[human]` (FE invaliduje, nepřičítá → většinou neškodné).

---

## C. AppGateway — generický `room:join` / `room:leave`

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| CONN-12 | `room:join` validuje formát regexem `^[a-z]+:[a-zA-Z0-9]+$` — odmítne (no-op) cokoliv mimo (`../`, prázdné, víc dvojteček). Ověřit že nevaliduje příliš volně `[auto]` | `AU` | M3 | ✅L1 |
| CONN-13 | `room:join` po validaci joinne **bez kontroly přístupu** — `world:{cizíId}` projde. **N-8 = přijaté riziko** (počasí kosmetické). Ověřit, že do `world:{id}` roomu neteče nic citlivějšího než počasí/membership-signál; pokud ano → eskalovat (N-8 podmínka přehodnocení) `[auto]` | `AU` `LK` | M4 | ⚠️ W-4 |
| CONN-14 | `room:join` vrací klientovi ACK `room:joined`; `room:leave` → `room:left`. FE na ACK nečeká (fire-and-forget) — ověřit, že absence ACK handlingu nevadí (žádný await/timeout) `[auto]` | `EX` | M1 | ✅L1 |
| CONN-15 | `room:leave` reálně opustí room — po leave klient nedostává broadcast daného roomu (důležité u přepínání kanálů/scén, aby nepřišly zprávy z opuštěné konverzace) `[auto]` | `RM` `LC` | M3 | ✅L1 |

> **Výsledek C:** `room:join` regex `^[a-z]+:[a-zA-Z0-9]+$` ([app.gateway.ts:10,17](../../../Projekt-ikaros/backend/src/gateways/app.gateway.ts#L10)) — `world:{hex}`/`chat:{id}` projde, `../`/prázdné/víc dvojteček ne. ACK `{event,data}`/`{error}`, FE nečeká (fire-and-forget). **CONN-13 = N-8 přijaté riziko**, ale W-4 (channel:created metadata do `world:{id}`) je přesně ta podmínka „přibyl citlivější payload" → přehodnotit společně.

---

## D. Reconnect & re-join

> **Nejnebezpečnější třída WS bugů.** Socket.IO po reconnectu **ztrácí všechny roomy** — server o klientovi „zapomene" room membership. Klient se MUSÍ po `connect` znovu přihlásit do všech roomů, jinak vypadá připojený, ale nedostává nic.

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| CONN-16 | `user:{id}` se po reconnectu obnoví **automaticky** (server `handleConnection` běží znovu) — re-join řešit nemusí FE. Ověřit, že `handleConnection` skutečně běží i na reconnect (ne jen první connect) `[auto]` | `LC` | M1 | ✅L1 |
| CONN-17 | **`world:{id}` / `chat:{id}` / `{sceneId}` se po reconnectu NEobnoví automaticky** (klient joinl ručně). Ověřit, kdo má `socket.on('connect')` re-join: ✅ useMapSocket, ✅ useUniverseSocket, ✅ useMapWeather. **Podezření: WorldChatRoom `room:join world:{id}` a ChannelView `room:join chat:{id}` re-join NEMAJÍ** → po reconnectu world chat oslepne `[auto]` | `LC` `RM` | M1 | 🐛 W-7 |
| CONN-18 | ChannelView `chat:channel:join` (presence) po reconnectu — re-emit? Jinak hráč po reconnectu „zmizí" z presence panelu PJ, dokud nepřepne kanál `[auto]` | `LC` | M1 | 🐛 W-7 |
| CONN-19 | `useSocketEvent` re-registruje listenery na změnu `socketStatusAtom` (socket swap). Ověřit, že po reconnectu nezůstanou listenery na starém (zombie) socketu ani se nezdvojí na novém `[auto]` | `LC` `EX` | M3 | ✅L2 |
| CONN-20 | Reconnect toast: `useSocketInit` ukazuje „Ztratilo se spojení" / „Spojení obnoveno". Ověřit, že se neukazuje při úvodním connectu (false „obnoveno" na startu) `[human]` | `LC` | M1 | ✅L1 |

> **Výsledek D — NÁLEZ W-7 (reconnect oslepnutí, VYSOKÁ):** `useSocketEvent` re-registruje **listenery** na socket swap ([useSocket.ts:58-63](../../src/features/chat/api/useSocket.ts#L58)) — FE po reconnectu zase poslouchá. **Ale `room:join` NE:** [WorldChatRoom.tsx:115-122](../../src/features/world/chat/components/WorldChatRoom.tsx#L115) a [ChannelView.tsx:194-213](../../src/features/world/chat/components/ChannelView.tsx#L194) emitují `room:join`/`chat:channel:join` v useEffectu s deps `[worldId]`/`[channelId]` — **bez `socket.on('connect')`, bez vazby na status**. Socket.IO po reconnectu zahodí rooms → klient není v `world:{id}`/`chat:{id}` → server mu nic neposílá. **World chat oslepne** (zprávy/kanály/unread/presence) až do přepnutí kanálu nebo reloadu. Kontrast: mapa/universe/weather re-join **mají**. (Třetí oběť: `useActiveScenes` — viz oblast 09 FES-12.)

---

## E. Disconnect cleanup

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| CONN-21 | Sdílená instance: **jeden** disconnect ovlivní všechny gateway naráz. Ověřit, že `handleDisconnect` každého gatewaye je defenzivní (socket už nemusí mít `data.userId`, mapy mohou být prázdné) — žádný throw v disconnectu `[auto]` | `LC` | M1 | ✅L1 |
| CONN-22 | ChatGateway disconnect: clear typing timeoutů + `presence.leaveAll(socketId)` → emit `chat:presence leave` jen pokud uživateli nezůstal jiný socket (multi-tab safe) `[auto]` | `LC` | M3 | ✅L2 |
| CONN-23 | GlobalChatGateway disconnect: odebere socket ze všech místností + `chat:presence leave reason:'disconnect'` + přepočítá `chat:rooms:presence` `[auto]` | `LC` `PL` | M3 | ✅L1 |
| CONN-24 | PresenceGateway disconnect: odebere socket; jen pokud **poslední** socket uživatele → broadcast `presence:update offline`. Předposlední socket = žádný offline event `[auto]` | `LC` | M3 | ✅L2 |
| CONN-25 | `setMaxListeners(32)` (D-070, base.gateway) — dost na počet gatewayů × listenerů na jednom socketu? Ověřit, že se nepřekračuje (MaxListenersExceededWarning) při plné app (chat+mapa+presence+...) `[auto]` | `LC` | M1 | ⚠️ |

> **Výsledek E:** Disconnect handlery defenzivní — ChatGateway čistí typing timeouty dle `client.id` prefixu + `presence.leaveAll` s multi-tab guardem (`stillPresent`) ([chat.gateway.ts:57-75](../../../Projekt-ikaros/backend/src/modules/chat/chat.gateway.ts#L57)). `setMaxListeners(32)` = orientačně dost (12 gatewayů), ale `⚠️` k ověření pod plnou zátěží (chat+mapa+presence naráz na jednom socketu).

---

## Test coverage gaps

- `app.gateway.spec.ts` má jen basic test — **chybí** test regex validace `room:join` (CONN-12) a no-op na nevalidní room.
- **Reconnect re-join není pokrytý žádným testem** (CONN-17/18) — přitom je to nejrizikovější třída. Kandidát na M7 FE test: mock socket → emit `connect` → ověřit re-emit `room:join`.
- Multi-tab `user:{id}` chování (CONN-10/11) netestováno cross-gateway.

## Známá rizika (předběžná, k potvrzení)

- **CONN-17 (reconnect world chat):** silné podezření, že `WorldChatRoom` a `ChannelView` nemají `socket.on('connect')` re-join (na rozdíl od map/universe/weather hooků). Po výpadku sítě by world chat přestal dostávat zprávy/presence bez viditelné chyby — uživatel vidí „připojeno", ale je hluchý. **Priorita ověření = nejvyšší.**
- **CONN-13 (N-8):** přijaté riziko join bez membership. Plán ho nezpochybňuje, ale **hlídá podmínku** — jakmile do `world:{id}` přibude citlivější payload (membership detail, soukromé novinky), riziko se mění z kosmetického na leak.
- **CONN-03 (tolerantní handshake):** tolerantní gateway + per-user room — pokud by se někde `user:{id}` joinl z **payloadu** místo z JWT (jako GlobalChat `chat:hospoda:join { userId }`), je to spoofing vektor. Ověřit, že per-user **citlivé** eventy jdou jen do JWT-ověřených `user:{id}`, ne do payloadem-deklarovaných.
