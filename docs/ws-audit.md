# WS audit — registr nálezů WebSocket kontraktu

> Centrální registr nálezů z [`ws-contract-plan/`](ws-contract-plan/README.md). ID `W-xx`.
> Sourozenec [`bug-audit.md`](bug-audit.md), ale výhradně pro real-time / Socket.IO vrstvu.
> Stav: zahájeno 2026-06-04 (zatím jen plán, zkoušky nezačaly).

---

## TL;DR (2026-06-04)

> **Stav: HOTOVO. Všech 11 nálezů opraveno + ověřeno (W-4 i W-5 dotaženy, bez dluhu).**
> Všech 9 oblastí projito (~185 bodů). `audit:ws` byl ✅, ale audit našel 2 vysoké věci, které parita názvů ze své podstaty minula — obě opraveny.
>
> | ID | Závažnost | Oblast | Podstata | Stav |
> |---|---|---|---|---|
> | **W-7** | 🔴 vysoká | 01/09 | reconnect: world chat / `useActiveScenes` se znovu nepřihlásí do roomů → oslepnou | ✅ opraveno (sdílený `useSocketReconnect`, world room → WorldLayout) |
> | **W-10** | 🔴 vysoká (bezpečnost) | 03 | global chat joinne `user:{id}` z payloadu → leak cizích privátních eventů | ✅ opraveno (userId z JWT) |
> | **W-3** | 🟠 střední | 02 | presence join bere identitu z payloadu, ne JWT (spoofing) | ✅ opraveno (userId z JWT) |
> | **W-9** | 🟠 střední | 06 | `world:updated/deleted/membership:*` nemá FE listenera → svět není real-time | ✅ opraveno (`useWorldSocket` ve WorldLayout) |
> | **W-1** | 🟡 nízká | 05 | `friendship.blocked` nemá WS most | ✅ opraveno (BE most + FE listener) |
> | **W-11** | 🟡 nízká | 04 | multi-tab: aktivní uživatel se jeví idle | ✅ opraveno (idle per-socket) |
> | **W-8** | 🟡 rozhodnutí | 09 | `transports: websocket`-only bez fallbacku | ✅ opraveno (+ `polling`) |
> | **W-2** | ⚪ kosmetika | 05 | FE typ `SimplePayload.by` se neemituje | ✅ opraveno (zúžen typ) |
> | **W-6** | ⚪ kosmetika | 07 | `useWeatherWsSubscribe` typuje non-null, BE posílá null | ✅ opraveno (nullable + guard) |
> | **W-4** | 🟡 nízká | 02 | `chat:channel:created` posílá metadata skrytého kanálu do `world:{id}` | ✅ opraveno (leak-safe signál `{ worldId }`) |
> | **W-5** | 🟡 dluh | 07 | 11 mapových legacy handlerů = mrtvý kód + relay surface | ✅ opraveno (smazány, FE je nepoužíval) |
>
> **Ověření oprav:** BE plný `jest` **1890/1890** (115 suites, +11 regresních: W-1/W-3/W-10/W-11), BE `tsc`+`eslint`+`prettier` čisté. FE `tsc`+`eslint` čisté, regresní sweep dotčených oblastí **657/657** + 3 nové `useSocketReconnect` testy + WorldLayout 5/5.
>
> **Kandidáti:** K-1 ❌ vyvráceno · K-3 ⚖️ by-design · K-4 ✅ OK · **K-2→W-7** · **K-5→W-10** · **K-6→W-9**.
>
> **Lekce:** inventura agenta 2× zaměnila **interní `@OnEvent` payload za odchozí Socket.IO emit** (friendships `requesterId`, ikaros `actionType`) → 2 falešní kandidáti. Vždy číst **obě strany** kontraktu. `audit:ws` zelený = nutné, ne postačující.

---

## Baseline — health checks

| Check | Repo | Výsledek | Pozn. |
|---|---|---|---|
| `npm run audit:ws` | FE | ⬜ ověřit | jen parita názvů eventů |
| `jest` gateway specs | BE | ⬜ ověřit | 6/12 gatewayů má test |
| FE socket hook testy | FE | 🔴 0 | žádný dedikovaný |

---

## Nejostřejší kandidáti (z přípravy plánu, k potvrzení)

> Tyto vyplynuly už z inventury při psaní plánu. **Nejsou potvrzené nálezy** — jsou to hypotézy s nejvyšší prioritou ověření. Potvrzené se přesunou níž jako `W-xx`.

| Kandidát | Oblast | Podstata | Proč `audit:ws` nechytil |
|---|---|---|---|
| ~~**K-1**~~ ❌ VYVRÁCENA | [05](ws-contract-plan/05-friendships.md) FRND-01..05 | ~~BE emituje `friend:*` s `{ requesterId, recipientId }`, FE čte `{ from, by }`~~ → ve skutečnosti gateway resolvuje username a emituje `{ from/by: { username } }` = parita SEDÍ, pokryto testy. Inventura zaměnila interní `@OnEvent` payload za odchozí emit. | — |
| **K-2** ✅→**W-7** | [01](ws-contract-plan/01-pripojeni-handshake-rooms.md) CONN-17 | POTVRZENO: world chat nemá reconnect re-join → oslepne. Viz W-7. | statická analýza nevidí lifecycle |
| **K-3** ⚖️ by-design | [02](ws-contract-plan/02-world-chat-gateway.md) WCH-06 | `mentionCount` se přes WS neposílá **záměrně** (D-NEW-chat-mention-sidebar-dot), FE drží `prevMention`. Mention dot není plně live — akceptováno. | payload shape |
| **K-4** ✅ OK | [07](ws-contract-plan/07-maps.md) MAP-12/19 | dvojí listenery komplementární (různé queries / opt-in callback), React Query dedupuje. Nebijí se. | dva handlery, statika nevidí běh |
| **K-5** 🔴→**W-10** | [03](ws-contract-plan/03-global-chat-gateway.md) GCH-01 | POTVRZENO: `user:{id}` join z payloadu → leak. Viz W-10. | auth logika |
| **K-6** ✅→**W-9** | [06](ws-contract-plan/06-worlds-universe.md) WRLD-01/02 | POTVRZENO: `world:updated`/membership bez FE listenera (grep = 0). Viz W-9. | room targeting |

---

## Potvrzené nálezy

### W-1 — Blokace (`friendship.blocked`) nemá WS most 🐛 (gap, nízká priorita)
- **Oblast / bod:** [05](ws-contract-plan/05-friendships.md) FRND-09
- **Soubor:** [friendships.service.ts:313](../Projekt-ikaros/backend/src/modules/friendships/friendships.service.ts#L313) emituje `friendship.blocked { blockerId, blockedId }` ↔ `friendships.gateway.ts` **bez** `@OnEvent('friendship.blocked')` ↔ FE `useFriendshipsSocket.ts` **bez** `friend:blocked` listeneru
- **Symptom:** Blokace / odblokování uživatele nemá real-time reflexi. Seznam přátel / friendship-status se po blokaci neaktualizuje živě (ani ve vlastních dalších tabech) — nutný ruční refresh.
- **Root cause:** Most EventEmitter2→Socket.IO (N-4) pokryl requested/accepted/rejected/removed, ale `blocked` vynechal. FE konzistentně listener nemá.
- **Osa:** `EX`
- **Návrh:** (a) **By-design** pro *blokovaného* (nechceme mu pushovat „byl jsi zablokován"). (b) Pro *blokujícího* doplnit invalidaci — buď `@OnEvent('friendship.blocked')` → `friend:blocked` do `user:{blockerId}`, nebo přijmout jako dluh. Rozhodnout při fázi oprav.
- **Stav:** ⬜ navrženo

### W-2 — FE typ `SimplePayload` deklaruje `by`, který se neemituje ⚠️ (typový dluh, neškodný)
- **Oblast / bod:** [05](ws-contract-plan/05-friendships.md) FRND-03
- **Soubor:** [useFriendshipsSocket.ts:17-20](../Projekt-ikaros-FE/src/features/friendships/hooks/useFriendshipsSocket.ts#L17) (`SimplePayload { friendshipId, by }`) ↔ `friendships.gateway.ts:69,75` emituje jen `{ friendshipId }`
- **Symptom:** Žádný (handlery `declined`/`canceled`/`removed` payload nečtou). Riziko jen do budoucna — kdyby někdo přidal toast se jménem, `by` bude `undefined`.
- **Osa:** `PL`
- **Návrh:** Zúžit typ na `{ friendshipId }` pro canceled/removed, nebo doplnit `by` i do emitu. Kosmetické.
- **Stav:** ⬜ navrženo

### W-3 — Presence join (`chat:channel:join`) bere identitu z payloadu, ne z JWT 🐛 (spoofing, střední)
- **Oblast / bod:** [02](ws-contract-plan/02-world-chat-gateway.md) WCH-14/15
- **Soubor:** [chat.gateway.ts:92-94](../Projekt-ikaros/backend/src/modules/chat/chat.gateway.ts#L92)
- **Symptom:** `resolveChannelPresenceRole(payload.channelId, payload.userId)` — roli i identitu odvozuje z **klientského `payload.userId`**. Hráč pošle cizí `userId` → vyrobí falešnou presence (cizí jméno + role) v PJ panelu přítomných.
- **Root cause:** Presence join zůstal na předN-9 payload-modelu. N-9 opravil jen `sound:play/stop` (ve stejném souboru) na `client.data.userId` z JWT; `chat:channel:join` minul. Komentář „klientu se nevěří" je fakticky nepravdivý.
- **Osa:** `AU`
- **Návrh:** Použít `client.data.userId` (JWT handshake) místo `payload.userId` — stejně jako sound handlery [:194](../Projekt-ikaros/backend/src/modules/chat/chat.gateway.ts#L194). FE už userId posílá zbytečně (lze ignorovat). Blast radius nízký (presence je in-memory/vizuální), ale je to integrita identity.
- **Stav:** ⬜ navrženo

### W-4 — `chat:channel:created` posílá metadata skrytého kanálu do `world:{id}` všem ⚠️ (payload leak, nízká)
- **Oblast / bod:** [02](ws-contract-plan/02-world-chat-gateway.md) WCH-13
- **Soubor:** [chat.service.ts:335](../Projekt-ikaros/backend/src/modules/chat/chat.service.ts#L335) → `chat.gateway.ts:283` (emit do `world:{worldId}`)
- **Symptom:** Vytvoření `accessMode:'roles'` kanálu pošle **celý `channel` objekt** všem v `world:{id}` roomu, i hráčům bez role. UI je nezobrazí (FE jen invaliduje → refetch je filtrovaný), ale metadata (název/ikona) jsou ve WS frame viditelná v dev tools.
- **Root cause:** Event nese data místo signálu (na rozdíl od leak-safe `chat:feed:bump`/`universe:updated`).
- **Osa:** `LK` `RM`
- **Návrh:** Emitovat leak-safe signál `{ worldId }` (jako feed bump) a nechat FE refetchnout filtrovaný `GET groups`.
- **Stav:** ✅ **OPRAVENO** (fáze oprav) — `chat:channel:created/updated` + `chat:group:created/updated` emitují jen `{ worldId }` ([chat.gateway.ts:288-334](../Projekt-ikaros/backend/src/modules/chat/chat.gateway.ts#L288)); FE jen invaliduje → refetch je server-filtrovaný. (`deleted`/`reordered` nesou jen IDs/pořadí, ne metadata — ponechány.)

### W-10 — Globální chat: klient joinne cizí `user:{id}` room přes payloadové `userId` 🐛🔴 (VYSOKÁ — leak privátních zpráv)
- **Oblast / bod:** [03](ws-contract-plan/03-global-chat-gateway.md) GCH-01
- **Soubor:** [global-chat.gateway.ts:190-221, 262](../Projekt-ikaros/backend/src/modules/global-chat/global-chat.gateway.ts#L190) (`registerPresence` → `client.join(\`user:${userId}\`)`, `userId` z payloadu)
- **Symptom:** `chat:hospoda:join` / `chat:room:join` berou `userId` z **klientského payloadu** a joinnou socket do `user:{userId}` roomu **bez ověření proti JWT**. Útočník pošle `{ username:'x', userId:'<cizí userId>' }` → vstoupí do cizího per-user roomu a začne dostávat **všechny** privátní eventy oběti: whispery (`chat:message` → `user:{toUserId}`), `ikaros:new-message`, `friend:*`, `chat:unread`, `account:transfer:received`, `world:access-*`.
- **Root cause:** GlobalChatGateway nemá vlastní JWT handshake; presence model (krok 4.1) přebírá identitu z payloadu. Při joinu user roomu to z kosmetické důvěry (jako N-8) dělá únik důvěrnosti. userId protistrany lze získat z veřejných profilů.
- **Osa:** `AU` `LK`
- **Návrh:** Joinnout `user:{client.data.userId}` z JWT (ChatGateway ho nastavuje na sdíleném socketu, [chat.gateway.ts:49](../Projekt-ikaros/backend/src/modules/chat/chat.gateway.ts#L49)), NE z payloadu. Pokud `client.data.userId` chybí (neautentizovaný), user room nejoinnovat. Payloadový `userId` smí sloužit max. k zobrazení jména v presence, ne k room joinu. **Souvisí s W-3** (stejná třída, presence join).
- **Stav:** ⬜ navrženo — **bezpečnostní priorita**

### W-9 — WorldsGateway broadcast eventy (`world:updated/deleted/membership:*`) nemají FE listenera 🐛 (střední — žádná real-time aktualizace světa)
- **Oblast / bod:** [06](ws-contract-plan/06-worlds-universe.md) WRLD-01/02/03/05/06/07
- **Soubor:** `worlds.gateway.ts` (emit `world:updated`, `world:deleted`, `world:membership:changed`, `world:membership:removed` do `world:{worldId}`) ↔ FE grep na tyto 4 stringy = **0 výskytů**
- **Symptom:** FE **vůbec neposlouchá** žádný ze 4 broadcast world eventů. Dashboard/Settings/Members se po změně světa od jiného PJ neaktualizují live (stale do refreshe). `world:deleted` → uživatel zůstane na mrtvé stránce smazaného světa. Membership změny (nová role, přidání/odebrání člena) nejsou real-time.
- **Root cause:** Gateway emituje, ale FE listener nikdy nevznikl. **Navíc N-15** (bug-audit) se opřel o tvrzení „`world:updated` pokryje refetch" — to je neplatné, protože nikdo `world:updated` nekonzumuje.
- **Osa:** `EX` `RM`
- **Návrh:** Doplnit FE hook (vzor `useWorldAccessSocket`) — `room:join world:{id}` (drží WorldChatRoom, ale dashboard/members mimo chat ne → souvisí s W-7 a room targetingem) + `useSocketEvent('world:updated'/'world:deleted'/'world:membership:*')` → invalidace world/members query. Pozor na N-15: membership payload musí být kompletní.
- **Stav:** ⬜ navrženo

### W-11 — Multi-tab presence: aktivní uživatel se jeví idle 🐛 (nízká, kosmetická)
- **Oblast / bod:** [04](ws-contract-plan/04-presence-online.md) PRES-06/07
- **Soubor:** [presence.gateway.ts:67-81](../Projekt-ikaros/backend/src/modules/presence/presence.gateway.ts#L67) (`idle` je per-userId flag) + [usePresence.ts:52-58](../Projekt-ikaros-FE/src/shared/presence/usePresence.ts#L52) (`presence:active` jen při přechodu z idle)
- **Symptom:** Tab A zahálí → pošle `presence:idle` → BE označí celého uživatele idle. Tab B aktivně pracuje, ale `isIdle=false` (nikdy nebyl idle) → `markActive` `presence:active` **nepošle** → uživatel zůstane vidět jako idle, dokud tab B sám neprojde idle cyklem.
- **Root cause:** BE idle je globální per-user flag přepsaný posledním eventem, ne agregace „všechny sockety idle". FE posílá `active` jen z lokálního idle přechodu.
- **Osa:** `LC`
- **Návrh:** BE: trackovat idle per-socket, uživatel idle jen když idle **všechny** jeho sockety. (Nebo FE posílat `active` při aktivitě i bez předchozího idle — slabší.) Nízká priorita (presence tečka kosmetická).
- **Stav:** ⬜ navrženo

### W-7 — World chat & PJ orchestrátor se po reconnectu znovu nepřihlásí do roomů 🐛🔴 (VYSOKÁ)
- **Oblast / bod:** [01](ws-contract-plan/01-pripojeni-handshake-rooms.md) CONN-17/18, [09](ws-contract-plan/09-frontend-socket-vrstva.md) FES-12
- **Soubor:** [WorldChatRoom.tsx:115-122](../Projekt-ikaros-FE/src/features/world/chat/components/WorldChatRoom.tsx#L115), [ChannelView.tsx:194-213](../Projekt-ikaros-FE/src/features/world/chat/components/ChannelView.tsx#L194), [useActiveScenes.ts:54-56](../Projekt-ikaros-FE/src/features/world/tactical-map/hooks/useActiveScenes.ts#L54)
- **Symptom:** Po reconnectu (výpadek sítě, uspaná záložka, restart BE) Socket.IO zahodí všechny room membership. `useSocketEvent` listenery se obnoví (re-register na `socketStatusAtom`), ale **`room:join world:{id}` / `room:join chat:{id}` / `chat:channel:join` / `map:join-world` se znovu neemitují** (useEffect deps `[worldId]`/`[channelId]`, bez `socket.on('connect')`). Klient není v roomu → server mu nic neposílá. **World chat oslepne** (zprávy, kanály, unread, presence), PJ orchestrátor scén přestane dostávat member operace. Stav vypadá „připojeno", ale je hluchý — dokud uživatel nepřepne kanál (remount) nebo nereloadne.
- **Root cause:** Reconnect re-join vzor (`socket.on('connect')`) zaveden jen v `useMapSocket`, `useUniverseSocket`, `useMapWeather`. World chat (2 hooky) a `useActiveScenes` ho **nemají**.
- **Osa:** `LC` `RM`
- **Návrh:** Přidat `socket.on('connect')` re-join do WorldChatRoom (`room:join world:{id}`), ChannelView (`room:join chat:{id}` + `chat:channel:join`) a useActiveScenes (`map:join-world`) — stejný vzor jako [useMapSocket.ts:77-87](../Projekt-ikaros-FE/src/features/world/tactical-map/hooks/useMapSocket.ts#L77). Zvážit sdílený `useRoomJoin(room)` helper, ať se vzor nezapomene.
- **Stav:** ⬜ navrženo — **nejvyšší priorita oprav**

### W-8 — Socket `transports: ['websocket']` bez polling fallbacku ⚠️ (nízká / k rozhodnutí)
- **Oblast / bod:** [09](ws-contract-plan/09-frontend-socket-vrstva.md) FES-03
- **Soubor:** `src/features/chat/api/socket.ts` (`transports: ['websocket']`)
- **Symptom:** Za striktní proxy/firewallem bez WS upgrade se socket nikdy nepřipojí → celá real-time vrstva tiše nefunguje, bez chyby v UI.
- **Osa:** `LC`
- **Návrh:** Buď potvrdit jako vědomé (moderní/mobilní cíl), nebo přidat `'polling'` fallback. Rozhodnutí.
- **Stav:** ⬜ navrženo

### W-5 — Mapové legacy WS handlery = mrtvý kód + relay surface ⚠️ (dluh, nízká)
- **Oblast / bod:** [07](ws-contract-plan/07-maps.md) MAP-23/24
- **Soubor:** [maps.gateway.ts:277-336](../Projekt-ikaros/backend/src/modules/maps/maps.gateway.ts#L277) (`map:effect-*`, `map:fog-updated`, `map:dice-rolled`, `map:scene-state-changed`, `map:sound-changed`, `map:token-*`, `map:config-updated`)
- **Symptom:** 11 deprecated relay handlerů žije v gateway, jen s `requireAuth` (ne role gate), relayuje klientský vstup ostatním na scéně. FE je **neposlouchá** (operation model je nahradil) → emit jde do prázdna. Latentní: kdyby FE někdy začal poslouchat, hráč by mohl broadcastnout falešný stav scény mimo operation log.
- **Osa:** `LK` `EX`
- **Návrh:** Odstranit legacy handlery (BC už není potřeba — 10.2+ FE migrovaný).
- **Stav:** ✅ **OPRAVENO** (fáze oprav) — 11 legacy handlerů smazáno z [maps.gateway.ts:182](../Projekt-ikaros/backend/src/modules/maps/maps.gateway.ts#L182) (token-moved/config-updated/token-removed/reload-scene/scene-cleared/effect-*/fog-updated/dice-rolled/scene-state-changed/sound-changed). FE je nepoužíval (grep = 0). `map:ping`/`spotlight` (živé) zachovány. BE jest 1890/1890.

### W-6 — `useWeatherWsSubscribe` typuje `weather`/`generatorId` non-null, BE posílá null ⚠️ (typový dluh, neškodný)
- **Oblast / bod:** [07](ws-contract-plan/07-maps.md) MAP-19
- **Soubor:** [useWeatherWsSubscribe.ts:15-20](../Projekt-ikaros-FE/src/features/world/api/useWeatherWsSubscribe.ts#L15) ↔ [maps.gateway.ts:342-344](../Projekt-ikaros/backend/src/modules/maps/maps.gateway.ts#L342)
- **Symptom:** Žádný (runtime: `g.id === null` nematchne → no-op). Typ ale neodpovídá realitě (clear posílá `null`).
- **Osa:** `PL`
- **Návrh:** `generatorId: string | null`, `weather: WeatherResult | null`. Kosmetické.
- **Stav:** ⬜ navrženo

---

## Vypořádané / by-design / přijaté riziko

- **K-1** (friendships payload drift) — ❌ vyvráceno, parita sedí (gateway resolvuje username).
- **K-4** (mapa dvojí `map:reassigned` / `weather:updated`) — ✅ OK, komplementární/různé queries, nebijí se.
- **K-3 / WCH-06** (`chat:unread` mentionCount) — ⚖️ **by-design**: `mentionCount` se přes WS neposílá záměrně (`D-NEW-chat-mention-sidebar-dot`), FE drží `prevMention`, dožene refetchem. Mention dot není plně real-time — akceptováno, dokumentováno, testováno.
