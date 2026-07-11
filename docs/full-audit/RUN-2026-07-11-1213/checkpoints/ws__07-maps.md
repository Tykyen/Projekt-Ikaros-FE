# Checkpoint — ws / 07-maps (MapsGateway)

**Styl:** ws-contract-plan · **Oblast:** `docs/ws-contract-plan/07-maps.md` · **Registr:** `docs/ws-audit.md` (prefix `W-`)
**Datum:** 2026-07-11 · **READ-ONLY** hloubkový audit (L1–L3)

## Rozsah přečteného kódu
- BE: `backend/src/modules/maps/maps.gateway.ts` (celý, 364 ř.)
- BE: `operations/map-operations.service.ts`, `operations/world-operations.service.ts`, `repositories/map-operations.repository.ts`
- FE: `tactical-map/hooks/useMapSocket.ts`, `useActiveScenes.ts`, `useReassignmentListener.ts`, `useMapWeather.ts`, `api/useWeatherWsSubscribe.ts`, `tactical-map/types.ts`
- Grepy: legacy/member eventy ve FE (=0), `emit('error')` BE (jen MapsGateway), `on('error')` FE

## Závěr: BEZ NOVÝCH nálezů (W-). Úroveň **L2** (WS transport), L3 pro operation-logiku (service specs).

Maps WS kontrakt je od uzávěru ws-auditu (2026-06-04) dál zpevněný sesterskými audity
(W-RUN-07-02/03, R-13, S-01, N-28, RC-D6). Payload parita BE emit ↔ FE listener + FE typy
ověřena klíč po klíči, sedí. Reconnect re-join vzor přítomný ve všech 4 hoocích
(`useSocketReconnect` / `socket.on('connect')`).

---

## Ověřené kontrakty (parita OK)

| Event | BE emit (soubor:ř.) | FE listener | Payload |
|---|---|---|---|
| `map:operation` | `map-operations.service.ts:152` → `gateway.emitMapOperation` (`maps.gateway.ts:316` `server.to(sceneId)`) | `useMapSocket.ts:119` | `{sceneId,seqNumber,op,byUserId,appliedAt}` = `MapOperationBroadcast` (`types.ts:401`) ✅ |
| `world:operation` | `world-operations.service.ts:120` → `emitWorldOperation` (`maps.gateway.ts:331` `server.to('world-ops:{id}')`) | `useActiveScenes.ts:66` | `{worldId,seqNumber,op,byUserId,appliedAt,cascadeMapOpIds}` = `WorldOperationBroadcast` (`types.ts:420`) ✅ |
| `map:reassigned` | `maps.gateway.ts:342` `server.to('user:{id}')` | `useMapSocket.ts:131` + `useReassignmentListener.ts:49` | `{newSceneId: string\|null}` ✅ (K-4 komplementární, potvrzeno) |
| `map:spotlight` | `maps.gateway.ts:286` `client.to(sceneId)` | `useMapSocket.ts:143` | vstup `{sceneId,tokenId}` → výstup `{tokenId}` ✅ |
| `map:pinged` | `maps.gateway.ts:224` poziční `(x,y,userName)` | `useMapSocket.ts:155` `(x,y,userName)` ✅ |
| `map:rulered` (15.3) | `maps.gateway.ts:246` `{userId(z JWT),userName,line}` | `useMapSocket.ts:170` ✅ (userId z `client.data.user.id`, ne payload) |
| `weather:updated` | `maps.gateway.ts:298` `server.to('world:{id}')` | `useMapWeather.ts:110` (patch `worlds`) + `useWeatherWsSubscribe.ts:34` (patch `weatherGenerators`) | různé query, nebijí se ✅ |

## Auth / room gating (potvrzeno)
- `handleConnection` JWT **povinný** → `data.user` + join `user:{id}`; bez tokenu `error WS_UNAUTHORIZED` (`maps.gateway.ts:64`).
- `map:join` — scéna existuje + `assertCanReadScene` parita: `PomocnyPJ+` všechny scény, ostatní jen vlastní `currentSceneId` (`:133`, W-RUN-07-02). Elevace Sa/Admin přes `elevationService`.
- `map:join-world` — `PJ+` only, joinne **`world-ops:{worldId}`** (R-13, pomlčka rozbije generický `room:join` regex → běžný člen sem nedosáhne, i když je ve `world:{id}` kvůli počasí) (`:160`).
- `map:ping`/`map:ruler` — `client.rooms.has(sceneId)` guard proti cross-scene spoofu (`:221`,`:244`, W-RUN-07-03).
- `map:spotlight` — `PomocnyPJ+` role gate (`:276`).

## Známé nálezy (♻️ / 🔓 — NEhlásím jako nové)
- **W-5 ✅ potvrzeno vyřešeno:** 11 legacy relay handlerů smazáno (`maps.gateway.ts:204-209` komentář). FE grep na všech 11 stringů + member eventy = **0 výskytů**.
- **W-6 ✅ potvrzeno vyřešeno:** `useWeatherWsSubscribe.ts:15-21` typuje `generatorId: string|null`, `weather: WeatherResult|null` + guard `if (!event.generatorId || !event.weather) return` (`:38`).
- **K-4 ✅ OK:** dva `map:reassigned` (opt-in callback vs. invalidace) + dva `weather:updated` (různé queries) — nebijí se.

## Doc-drift (♻️ známé jinde — 07-maps.md je zastaralý, kód předběhl; NENÍ to nový bug)
- **MAP-10:** doc píše `emitWorldOperation → world:{worldId}`; realita **`world-ops:{worldId}`** (R-13 role-audit, PJ-only room). Zpřísnění, ne regrese.
- **MAP-11 / MAP-14:** doc popisuje `map:member-joined`/`map:member-left` do `{sceneId}` a „reassign emituje map:member-left". Realita: **oba eventy ODSTRANĚNY** (`world-operations.service.ts:171` S-01 state-consistency — mrtvé emity bez FE listeneru). Member stav teče výhradně přes `world:operation` log + privátní `map:reassigned`. FE grep = 0. Doc entry obsolete.
- Doporučení (mimo tento audit): srovnat 07-maps.md MAP-10/11/14 s realitou.

## Známá otevřená ⚠️ (v plánu, NE nová)
- **MAP-04 (seqNumber atomicita):** `allocateSeqNumber` = atomic `$inc` na `MapScene.lastSeqNumber` (unique) ✅, ALE alokace probíhá **AŽ PO** `applyAtomic` (`map-operations.service.ts:113→135`). Pořadí DB-mutace a pořadí seqNumber se pod konkurencí může rozejít (op A aplikuje dřív, seq alokuje později než B). Kód to vědomě akceptuje (komentář `:132-134` „gap v sekvenci... akceptujeme"). Zůstává ⚠️ pro M8 round-trip.
- **MAP-05 (self-echo):** `emitMapOperation` používá `server.to(sceneId)` → op jde i původci; FE musí dedup/idempotence. ⚠️ aplikační logika, mimo WS vrstvu.

## Test coverage
- `maps.gateway.ts` stále **bez dedikovaného gateway testu** (WS emit/room vrstva = L2, ne L3). Operation-logika pokryta `map-operations.service.spec.ts`, `operations-authorizer.service.spec.ts`, `operation-payload-validator.service.spec.ts` (L3 pro apply/authorize).
- Gap-fill kandidát (M7/M8): round-trip test `map:join` read-access + `map:operation` broadcast + `map:reassigned null`.

## Metoda / úroveň
M1 (čtení obou stran) + M2 (kontrakt payload klíč-po-klíči, FE typy). **L2** pro WS transport,
L3 pro operation apply/authorize (existující service specs zelené dle registru). Bez nových `W-`.
