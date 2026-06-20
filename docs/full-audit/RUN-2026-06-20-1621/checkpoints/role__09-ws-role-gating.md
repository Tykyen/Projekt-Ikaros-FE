# role / 09-ws-role-gating — checkpoint RUN-2026-06-20-1621

## Pokrytí

Projito VEŠKERÝCH 16 gateway souborů (všechny `*.gateway.ts` v BE src):
- `app.gateway.ts` (room:join/leave)
- `base.gateway.ts` (abstraktní základ)
- `chat.gateway.ts` (chat:channel:join, sound:play, typing, OnEvent handlery)
- `maps.gateway.ts` (map:join, map:join-world, map:spotlight, map:ping, weather:updated)
- `worlds.gateway.ts` (world:updated, membership:changed/removed, access:requested/approved/rejected/cancelled)
- `global-chat.gateway.ts` (hospoda/rozcestí join, whisper, reaction)
- `ikaros-messages.gateway.ts` (ikaros:new-message)
- `ikaros-events.gateway.ts` (ikaros:events:changed)
- `ikaros-news.gateway.ts` (ikaros:news:changed)
- `universe.gateway.ts` (universe:updated)
- `emotes.gateway.ts` (emote:created/updated/deleted)
- `presence.gateway.ts` (presence:idle/active)
- `friendships.gateway.ts` (friend:request:*/friend:blocked)
- `bestiae.gateway.ts` (bestiar:changed)
- `users-identity.gateway.ts` (user:identity:changed)
- `character-accounts.gateway.ts` (account:transfer:received)

FE: `features/chat/api/socket.ts`, `useWorldSocket.ts`, `WorldLayout.tsx`

Všechny body WR-01..WR-12 + matice D + RW-1..RW-3 staticky ověřeny (M1/M5).

## Dosažená L vs cílová L

| Bod | Cílová L | Dosažená L | Poznámka |
|-----|----------|-----------|----------|
| WR-01 (identita JWT vs payload sweep) | L3 | L2 | Staticky ověřeno všech 12+ gateways |
| WR-02 (W-3 fix chat:channel:join) | L2 | L2 | `client.data.userId` z JWT ✅ |
| WR-03 (W-10 fix user:{id} join) | L2 | L2 | JWT v `handleConnection`, payload.userId ignorován ✅ |
| WR-04 (sound:play identita) | L2 | L2 | `client.data.userId` z JWT, ne payload ✅ |
| WR-05 (per-user room izolace) | L2 | L2 | `user:{sub}` z JWT vždy, tolerantní (no-room bez tokenu) ✅ |
| WR-06 (world:{id} jen počasí) | L2 | **L2🐛** | ESKALACE: teče víc než počasí — viz R-RUN-01 |
| WR-07 (chat:channel:join access gate) | L3 | L2 | R-04 ✅ opraveno; round-trip test chybí |
| WR-08 (map:join role check) | L2 | **L2🐛** | Zadatel(0) projde — viz R-RUN-02 |
| WR-09 (inventura world:{id}) | L2 | **L2🐛** | world:updated = plný objekt, emote = plný objekt — viz R-RUN-01 |
| WR-10 (leak-safe signály) | L2 | L2 (**partial 🐛**) | universe/chat:channel/group = OK; world:updated, emote = neleaksafe |
| WR-11 (access:requested/approved targetting) | L2 | L2 | per-user room ✅ |
| WR-12 (whisper izolace) | L2 | L2 | visibleTo guard + user:{id} ✅ |

**Cílová L celkově:** L2 pro security body, L3 pro PC/LK kritické.  
**Dosaženo:** L2 staticky pro většinu. L3 nedosaženo — chybí round-trip testy WR-07/08.  
**PROOF-REQUEST:** viz sekce níže.

---

## Nálezy

### R-RUN-01 — `world:updated` emituje PLNÝ `World` objekt do negateované `world:{id}` místnosti 🐛🟠 (střední — LK PC)
- **Osy:** `LK` `PC` · M1 · 🆕
- **Kde:** `worlds.gateway.ts:38` (`this.server.to('world:${world.id}').emit('world:updated', world)`)  
  ↔ N-8 přijaté riziko: `world:{id}` room bez membership gate (jen regex v `room:join`)  
  ↔ `World` interface obsahuje: `ownerId`, `deletedAt`, `deletedBy`, `accessMode`, `themeOverrides`, `activeMapWeather`, `techLevelMin/Max`, `magicTraditions`, `previousSlugs`
- **Dopad:** Kohokoli (i anonymní socket bez JWT, per N-8 tolerance) kdo joinne `world:{foreignId}` dostane plný `World` objekt při každé PJ aktualizaci nastavení. Pro **private** svět (`accessMode='private'`) REST vrací 404 non-memberům, ale WS jim pošle plná metadata. Klient FE payload ignoruje (jen `invalidateQueries`), ale data jsou viditelná v síťovém frame WS. Eskaluje N-8 risk z „kosmetika = počasí" na „metadata privátního světa".
- **Escalace RW-3:** Plán varoval „pokud přidáte citlivější event, riziko se mění". Stav: `world.updated` tam byl od začátku, ale audit to dosud nepřesně popsal jako „teče jen počasí".
- **Návrh:** (a) Změnit `world:updated` na leak-safe signál `{ worldId }` (FE stejně jen invaliduje queries); (b) nebo přidat membership check v `room:join` pro `world:` prefix (ruší N-8 přijaté riziko pro ostatní `world:*` eventy). Varianta (a) je jednodušší a okamžitá.
- **Stav:** 🐛 nový nález — neopravovat bez souhlasu.

---

### R-RUN-02 — `map:join` akceptuje Zadatel(0) (pending člen bez přístupu) do scene roomu 🐛🟠 (střední — PC ES)
- **Osy:** `PC` `ES` `OW` · M1 · ♻️ (eskalace WR-08 debt)
- **Kde:** `maps.gateway.ts:101-131` — `handleJoin` kontroluje jen `membership !== null` (existence), **ne** `membership.role >= Ctenar/Hrac`.  
  ↔ REST `assertCanReadScene` (`operations-authorizer.service.ts:242-264`): Zadatel → nemá `currentSceneId` přiřazeno → 403 `MAP_FORBIDDEN_OTHER_SCENE`.
- **Dopad:** Uživatel s rolí `Zadatel(0)` (pending žádost o vstup, bez jakéhokoli přístupu) může WS `map:join <sceneId>` a vstoupit do scene roomu. Dostane všechny `map:operation` eventy — tokeny, HP, pozice, fog-reveal, kostky — přestože REST mu to zakazuje. Registr WR-08 to označil jako „marginální", ale:
  1. Zadatel = **bez přístupu** (REST `assertMember` = 403 PENDING_MEMBERSHIP pro Zadatele)
  2. Data mapy jsou citlivá (HP, skryté pozice NPC)
  3. Realistický scénář: hráč pošle žádost o vstup → sceneId uhodne nebo získá z leaku → `map:join` funguje
- **Původní WR-08 debt:** „join jen membership, ne scene-assignment" — ale chybí i **role check**. Toto je závažnější než popsáno.
- **Návrh:** V `maps.gateway.ts handleJoin` přidat role check: `membership.role === WorldRole.Zadatel → error MAP_FORBIDDEN`. Nebo: zkopírovat logiku `assertCanReadScene` (PomocnyPJ+ = volno, jinak kontrola `currentSceneId`).
- **Stav:** 🐛 eskalace WR-08 z dluhu → potvrzený nález střední závažnosti.

---

### R-RUN-03 — `emote:created/updated/deleted` do `world:{id}` nese plný `CustomEmote` objekt (plný `imageId` + `createdBy`) 🐛🟡 (nízká — LK)
- **Osy:** `LK` · M1 · 🆕
- **Kde:** `emotes.gateway.ts:12-19` (`emit('emote:created', payload.emote)`) — FE `useWorldEmotes.ts:65` ho **přímo vkládá do cache** (ne jen invalidate signal).  
  ↔ `CustomEmote.createdBy` = userId tvůrce; `imageId` = Cloudinary publicId
- **Dopad:** Emote objekt včetně `createdBy` userId a `imageId` (Cloudinary internal ID) teče přes WS frame do negateované `world:{id}` místnosti. `createdBy` není veřejně exponovaný skrze REST (endpoint vrací emoty bez autora). Kdo zná `cloudName` + `imageId` může přistoupit k obrázku přímo. V praxi nízká závažnost, ale porušuje leak-safe vzor (ostatní eventy posílají jen signál).
- **Poznámka:** Globální emoty (`server.emit(...)`) jsou ještě širší — broadcast všem socketům bez jakékoli autentizace.
- **Návrh:** Zvážit přechod na leak-safe signál `{ worldId, emoteId }` + FE refetch; nebo přijmout jako by-design (emoty jsou semi-public dekorace). Nízká, ale nesedí s W-4 vzorem.
- **Stav:** 🐛 nový nález nízké závažnosti — k rozhodnutí.

---

### ✅ WR-01 — sweep všech `@SubscribeMessage` handlerů: identita z JWT (L2)
Všechny handlery, které pracují s identitou uživatele, čtou `client.data.userId` (nastaveno z JWT v `handleConnection`) — **ne** z `payload.userId`:
- `chat.gateway.ts` — `chat:channel:join` (L93), `sound:play` (L199), `sound:stop` (L220)
- `global-chat.gateway.ts` — `chat:hospoda:join` (L199), `chat:room:join` (L218) — komentář W-10 explicitní
- `presence.gateway.ts` — `presence:idle/active` čtou `client.data.presenceUserId` nastaveného z JWT
- `maps.gateway.ts` — `map:join/join-world/spotlight/ping` čtou `client.data.user.id` z JWT
- **Jediná výjimka:** `global-chat.gateway.ts:ikaros:whisper` — sender identity z `connectedUsers.get(client.id)` (interní mapa, plněna ověřeným `userId` z JWT při join) ✅

### ✅ WR-02/03 — W-3/W-10 opravy potvrzeny (L2)
- `chat:channel:join`: `client.data.userId` z JWT (L93), komentář W-3 ✅
- `chat:hospoda:join` + `chat:room:join`: `client.data.userId`, komentář W-10 ✅
- `user:{id}` room join: vždy z `payload.sub` JWT (ne klientského `payload.userId`) ✅

### ✅ WR-04 — sound:play/stop identity (L2)
`chat.gateway.ts:199,220` — `userId = (client.data as {userId?}).userId` + `resolveChannelPresenceRole`, komentář N-9 ✅

### ✅ WR-05 — per-user room izolace (L2)
Všechny gateways s `handleConnection`: joinnou `user:{payload.sub}` z JWT handshake, tolerantní (bez tokenu = bez per-user roomu, ne pád). Ověřeno v:
- `chat.gateway.ts:48`, `worlds.gateway.ts:30`, `ikaros-messages.gateway.ts:23`, `bestiae.gateway.ts:36`, `users-identity.gateway.ts:30`, `maps.gateway.ts:88`, `presence.gateway.ts` (authUser metoda)

### ✅ WR-07 — R-04 fix potvrzeně funkční (L2)
`app.gateway.ts:37-43`: `chat:` prefix → `canJoinChannelRoom(channelId, userId?)` → world kanál vyžaduje `hasChannelAccess`, userId z JWT (`client.data.userId`), ne payload. `hasAccessGivenMembership` blokuje `Zadatel(0)` i non-member. ✅

### ✅ WR-10 — leak-safe signály ověřeny (L2, s výjimkami R-RUN-01/03)
- `universe:updated` → `{ worldId }` signál ✅
- `chat:channel:created/updated` → `{ worldId }` signál ✅
- `chat:group:created/updated` → `{ worldId }` signál ✅
- `chat:feed:bump` → `{ worldId }` per-user room ✅
- `world:news:changed` → `{ worldId }` signál ✅
- `bestiar:changed` → `{ systemId }` signál ✅
- `user:identity:changed` → `{ kind }` signál ✅
- **❌ `world:updated`** → plný `World` objekt (R-RUN-01)
- **❌ `emote:created/updated`** → plný `CustomEmote` (R-RUN-03)

### ✅ WR-11 — access:requested/approved targetting (L2)
`worlds.gateway.ts:82-141` — všechny 4 access eventy cílí na `user:{ownerId}` nebo `user:{requesterId}` per-user room (ne world broadcast). ✅

### ✅ WR-12 — whisper izolace (L2)
`chat.gateway.ts:239-247`: `visibleTo` guard → whisper jde do `user:{userId}` per-user roomu, ne do `chat:{channelId}`. Global chat whisper (`global-chat.gateway.ts`) přes `GlobalChatService.sendWhisper` → `visibleTo` array → per-user emit ✅

### ✅ Matice D — ověřeno staticky
| WS akce | guest | Zadatel | Ctenar+ | PomocnyPJ+ | PJ |
|---|---|---|---|---|---|
| connect + `user:{id}` | ❌ no room | ✅ | ✅ | ✅ | ✅ |
| `room:join world:{id}` | ✅* | ✅* | ✅ | ✅ | ✅ |
| `chat:channel:join` presence | ❌ | ⛔ | ✅ | ✅ | ✅ |
| `room:join chat:{id}` (zprávy) | ❌ | ⛔ | ✅ˢ | ✅ | ✅ |
| `map:join scene` | ❌ | **✅🐛** | ✅ᵒ | ✅ | ✅ |
| `map:join-world` | ❌ | ❌ | ❌ | ❌ | ✅ |
| `sound:play` | ❌ | ❌ | ❌ | ✅ | ✅ |
| whisper | ❌ | adresát | adresát | adresát | adresát |

`*` N-8 přijaté riziko — ale WR-09 eskalace: teče víc než počasí (R-RUN-01).  
`**🐛** Zadatel` — WS pustí, REST zakáže (R-RUN-02).

---

## PROOF-REQUEST

### PR-01 — WR-07 round-trip: hráč bez přístupu join chat kanálu → nedostane eventy
**Co spustit:**
```bash
cd C:/Matrix/ProjektIkaros/Projekt-ikaros
npx jest --testPathPattern=app.gateway --maxWorkers=2
```
**Existující testy:** `app.gateway.spec.ts` má 5 gate testů (R-04 commit). Ověřit, že test „non-member world channel → canJoinChannelRoom=false → error" je zelený.  
**Co dokazuje:** WR-07 R-04 fix na L3 (ne jen statické čtení).

### PR-02 — WR-08 eskalace: Zadatel `map:join` → přijme do roomu
**Co spustit:** Ruční request (M8) nebo unit test v `maps.gateway.spec.ts` (pokud existuje) s membership `role=0` (Zadatel).  
```bash
cd C:/Matrix/ProjektIkaros/Projekt-ikaros
npx jest --testPathPattern=maps.gateway --maxWorkers=2
```
**Co dokazuje:** Potvrdí/vyvrátí R-RUN-02 na L3. Pokud Zadatel projde → potvrzení eskalace.

### PR-03 — R-RUN-01: world:updated payload sniff
**Co spustit:** Při lokálním BE (`nest start`) připojit bare Socket.IO klient bez JWT → `room:join world:{existingId}` → triggerovat `PATCH /worlds/:id` → pozorovat `world:updated` event v console klienta.  
**Co dokazuje:** Potvrdí, že non-member dostane plný World objekt přes WS (R-RUN-01).
