# Checkpoint — role / 09-ws-role-gating

RUN-2026-07-11-1213 · READ-ONLY · oblast `docs/role-plan/09-ws-role-gating.md` · registr `docs/role-audit.md` (prefix R-)

## Dosažená vs cílová L

- **Cíl (plán):** role body L2+, bezpečnostní (`BY`/`LK`/`PC`) L3+, kritické hranice (FE schová → BE drží) přes M8 na L4.
- **Dosaženo:** **L2** (statické čtení M1 + kontrakt M2 proti registru) na VŠECH 17 gatewayích + adapteru + FE socketu + chat access-gate. Kde existují cílené testy (`app.gateway` R-04 gate spec, `chat.gateway.spec`, `maps` scene-gate, `socket-io.adapter.spec`, `global-chat.gateway.spec`) → potenciál L3, ale READ-ONLY běh je nespouštěl. M8 red-team = mimo READ-ONLY rozsah (viz PROOF-REQUEST).

## Pokrytí — kód projitý do L1-L3 statiky

Přečteno CELÉ (každý `@SubscribeMessage` + `@OnEvent` emit + handshake):

| Soubor | Osa fokus | Verdikt |
|---|---|---|
| `gateways/app.gateway.ts` (`room:join`/`leave`) | `BY` `PC` `LK` | ✅ R-04 gate (`chat:` prefix → `canJoinChannelRoom`), FIX-1 (`user:` prefix → jen `user:${client.data.userId}`), identita z JWT |
| `gateways/base.gateway.ts` | — | ✅ jen join/leave/broadcast helpery |
| `socket-io.adapter.ts` (`wsAccountGate`) | `LK` `ST` | ✅ FIX-A: banned/deleted handshake reject; guest/invalid fail-open (per-gateway verify domáckne) |
| `chat/chat.gateway.ts` (channel:join/leave, typing, sound:play/stop, message/channel/group/unread emity) | `BY` `PC` `LK` | ✅ W-3 (userId z JWT), N-9 sound `>=PomocnyPJ` přes `resolveChannelPresenceRole`, W-4 leak-safe signály, FIX-44 revoke `socketsLeave` |
| `chat/chat.service.ts` `canJoinChannelRoom`/`hasChannelAccess`/`isWorldManagerByUserId` | `PC` `BY` | ✅ FIX-1B `!userId`→false PŘED world/glob větví; world kanál → `hasChannelAccess`; admin bypass přes DB elevaci (cross-user) |
| `global-chat/global-chat.gateway.ts` (hospoda/room/voice join, whisper, reaction) | `BY` `LK` | ✅ W-10 identita z `client.data.userId`; guest FIX-36 jen Hospoda; whisper→`user:{toUserId}` |
| `maps/maps.gateway.ts` (map:join/leave/join-world/ping/ruler/spotlight + emity) | `PC` `OW` `BY` `LK` | ✅ R-RUN-02 scene-assignment gate, R-13 `world-ops:{id}` PJ-only room, ping/ruler jen do `client.rooms`, spotlight `>=PomocnyPJ`, elevace z DB |
| `platform-chat/platform-chat.gateway.ts` | `PC` `LK` | ✅ join `canUserAccessChannel`, typing username ze service (ne payload) |
| `worlds/worlds.gateway.ts` | `LK` `RM` | ✅ R-RUN-01 leak-safe (`{worldId}` / `{worldId,membershipId}`); access-* → `user:{ownerId}`/`{requesterId}` |
| `universe/universe.gateway.ts` | `LK` | ✅ signál `{worldId}` |
| `bestiae/bestiae.gateway.ts` | `LK` `PC` | ✅ 3-scope routing, payload jen `{systemId}` |
| `emotes/emotes.gateway.ts` | `LK` | ✅ FIX-B `createdBy` strip |
| `character-subdocs/character-accounts.gateway.ts` | `LK` `OW` | ✅ transfer jen `user:{co-owner}` (PC s userId) |
| `presence/presence.gateway.ts` | `LK` | ✅ W-RUN-01 hiddenPresence, W-11 per-socket idle |
| `ikaros-messages/ikaros-messages.gateway.ts` | `LK` | ✅ `user:{recipientId}` |
| `ikaros-events` / `ikaros-news` gateway | `LK` | ✅ leak-safe broadcast `{}` (platform obsah) |
| `friendships/friendships.gateway.ts` | `LK` | ✅ jen `user:{id}` roomy |
| `admin/users-identity.gateway.ts` | `LK` `ST` | ✅ FIX-A part2: ban/deletion `disconnectSockets(true)` |
| FE `features/chat/api/socket.ts` (singleton) | `BY` | ✅ token z `accessTokenAtom` ?? guest; jediná instance; reconnect nuluje |

Matice persona × WS akce (plán sekce D) ověřena proti kódu — všechny buňky drží (guest bez user roomu, `chat:channel:join`/`map:join` odmítnou člena bez přístupu, `sound:play` jen PJ, whisper jen adresát).

## Nálezy

**Žádný nový nález (🆕 = 0).** Statická hloubka L2 potvrdila, že celý WS role-povrch je konzistentní s REST gate a s již opravenými nálezy registru.

Zvážený a ZAMÍTNUTÝ kandidát (aby se nezaevidoval jako nový):
- ⚠️→♻️ **Display username/avatar z payloadu (`BY`)** — `chat:channel:join` ([chat.gateway.ts:118-120](../../../role-plan/../../Projekt-ikaros/backend/src/modules/chat/chat.gateway.ts#L118) `username: payload.username, avatarUrl: payload.avatarUrl`) i global-chat hospoda/room join ([global-chat.gateway.ts:317-319](../../../../Projekt-ikaros/backend/src/modules/global-chat/global-chat.gateway.ts#L317)) + `sendWhisper` (`from.username`) berou ZOBRAZOVANÉ jméno/avatar z klientského payloadu (userId a worldRole jsou autoritativní z JWT). Teoreticky display-name impersonace v presence/whisperu. **NENÍ nový** — `ws-audit.md` W-3 to vědomě akceptoval: „Payloadový `userId` smí sloužit max. k zobrazení jména v presence" + „Blast radius nízký (presence in-memory/vizuální)". Žádný privilege gain, žádný leak privátních dat. Ponecháno jako by-design (W-3 resolution).

## Známé (NEhlásím jako nové) — potvrzený stav oprav

- ✅ R-04 (chat `room:join` gate) — potvrzeno `app.gateway.ts:37-43` + `chat.service.canJoinChannelRoom`.
- ✅ R-13 (`world:operation` → PJ-only `world-ops:{id}`) — potvrzeno `maps.gateway.ts:188,331`.
- ✅ W-3 / W-10 (identita z JWT) — potvrzeno napříč gatewayi.
- ✅ FIX-A (banned/deleted handshake + live disconnect) — `socket-io.adapter.ts` + `users-identity.gateway.ts:46-48`.
- ⚖️ N-8 / WR-06 (`world:{id}` bez membership) — do roomu teče jen `{worldId}` signály + `weather:updated` (plný payload, kosmetika). Akceptované riziko drží; nic citlivějšího nepřibylo.

## Pozitivní drift registru (accepted-debt už NEPLATÍ — návrh na aktualizaci role-audit.md, ne nález)

- **WR-08** (role-audit „map:join jen membership, ne scene-assignment") — v kódu JIŽ VYŘEŠENO: `maps.gateway.ts:133-137` gatuje `membership.role < PomocnyPJ && membership.currentSceneId !== scene.id` (R-RUN-02). Registrová položka je zastaralá.
- **WR-09-B** (role-audit „worlds.gateway emituje plný `membership` objekt do `world:{id}`") — v kódu JIŽ VYŘEŠENO: `worlds.gateway.ts:76-79` emituje jen `{worldId, membershipId}` (R-RUN-01). Registrová položka je zastaralá.
- **Doc-count drift** — plán 09 uvádí „všech 12 gatewayů", reálně 17 `*.gateway.ts` (+`base`+`app`). Kosmetika plánu; pokrytí výše řeší všech 17.

## PROOF-REQUESTy (nad rámec READ-ONLY / L2)

- **+authz-runtime / M8 (L4):** červený round-trip — odebraný člen `members` kanálu s cache `channelId` emitne `room:join chat:{id}` → MUSÍ 403/„Nedostatečná oprávnění" a nedostat `chat:message`. (Existuje `app.gateway` gate spec; ověřit i live přes ovladač.)
- **+authz-runtime / M8 (L4):** hráč s nepřiřazenou scénou `map:join {sceneId}` → `MAP_FORBIDDEN`; NEobejde přes generický `room:join` (scene room = holé ObjectId, projde regexem!). **Ověřit:** `room:join <sceneId>` (bez prefixu `chat:`/`user:`/`world-ops:`) projde regexem `^[a-z]+:[a-zA-Z0-9]+$`? → NE (chybí `:`), ale scene room je čisté ObjectId → `room:join` ho odmítne (bez `:`). Potvrdit, že do scény vede JEN `map:join` (gated), ne generický `room:join`. ⇒ potenciální PROOF, viz níže.
- **M3 (L3):** spustit `chat.gateway.spec` + `maps` gateway spec + `socket-io.adapter.spec` + `global-chat.gateway.spec` a zaznamenat zelené (READ-ONLY nespouštěl).

## Reziduální otázka k doověření (ne nález, L2 hypotéza)

Scene room v `maps.gateway` = holé `sceneId` (ObjectId, bez prefixu `foo:`). Generický `AppGateway.room:join` vyžaduje `^[a-z]+:[a-zA-Z0-9]+$` (nutné dvojtečka) → holé ObjectId NEprojde → do scény nelze vstoupit generickým `room:join`, jen gated `map:join`. **Ověřeno staticky = drží** (žádný alternativní vstup do scény). Zapisuji jen jako explicitní potvrzení PC-inventury (dveře na scénu = pouze `map:join`).
