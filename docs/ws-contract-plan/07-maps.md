# 07 — Taktická mapa (MapsGateway)

Nejsložitější gateway a **bez jediného testu**. Operation-based model (10.2-prep-1+): herní mutace nejdou per-akci přes WS, ale přes REST Operations API → server broadcastne **jeden generický `map:operation`** se `seqNumber`. Klient drží `lastSeqNumber`, detekuje mezery, dotahuje catch-up REST. JWT **povinný** při handshake. Plus 11 deprecated legacy handlerů, které FE nesmí používat.

**BE:** `modules/maps/maps.gateway.ts`, `MapOperationsService`, `WorldOperationsService`, `OperationsAuthorizer`
**FE:** `features/world/tactical-map/hooks/useMapSocket.ts`, `useActiveScenes.ts`, `useMapWeather.ts`, `useReassignmentListener.ts`

> Doménová herní logika (combat, fog, A*, tokeny) je v [`bug-plan/11`](../bug-plan/11-svet-mapa.md). Tady jen **WS přenos operací, sekvenování, room, auth, reconnect catch-up**.

---

## A. Operation model — `map:operation` & sekvenování 🔴

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| MAP-01 | `emitMapOperation` → `map:operation { sceneId, seqNumber, op, byUserId, appliedAt }` do `{sceneId}` roomu. FE `useMapSocket:95` patchuje dle `seqNumber`. Payload parita všech 5 polí `[auto]` | `PL` | M2 | ✅L2 |
| MAP-02 | **Gap detection:** klient drží `lastSeqNumber`; přijde-li `seqNumber > last+1` → mezera → catch-up `GET /maps/:id/operations?since=N`. Ověřit, že FE mezeru detekuje a netiše nezahodí operace (rozbitý stav scény) `[auto]` | `LC` `PL` | M3 | ✅L1 |
| MAP-03 | **Reconnect catch-up:** po `connect` (`useMapSocket:83`) re-join `map:join` + dotažení operací od `lastSeqNumber`. Ověřit, že se po výpadku scéna dosynchronizuje (ne jen re-join bez catch-up → ztracené operace) `[auto]` | `LC` | M3 | ✅L2 |
| MAP-04 | Pořadí: `seqNumber` je append-only monotónní per scéna. Ověřit, že souběžné operace dvou PJ dostanou unikátní rostoucí `seqNumber` (atomicita na BE) — jinak race přepíše stav `[auto]` | `LC` | M3 | ⚠️ |
| MAP-05 | `map:operation` jde **všem** v `{sceneId}` včetně původce. FE musí buď aplikovat idempotentně, nebo přeskočit vlastní op dle `byUserId`. Ověřit, že vlastní operace se nezdvojí (optimistic + echo) `[auto]` | `PL` `LC` | M3 | ⚠️ |

> **Výsledek A:** `useMapSocket` má **vzorný reconnect** — `socket.on('connect')` → re-join `map:join` + `onReconnect()` catch-up ([useMapSocket.ts:77-87](../../src/features/world/tactical-map/hooks/useMapSocket.ts#L77)). To je etalon, který world chatu (CONN-17) chybí. MAP-04 (seqNumber atomicita) a MAP-05 (self-echo dedup) = BE/aplikační logika mimo přímý WS kontrakt → `⚠️` k ověření při fázi oprav (M8 round-trip), žádné WS-vrstvové podezření.

---

## B. Join / leave / auth

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| MAP-06 | `map:join sceneId` ověří **read-access** k scéně (WorldRole check) → joinne `{sceneId}` nebo emituje `error`. Ověřit, že hráč bez přístupu k scéně se nedostane do roomu (a nedostane `map:operation`) `[auto]` | `AU` `RM` | M3 | ✅L1 |
| MAP-07 | `map:join-world worldId` je **PJ+ only** (orchestrátor cross-scene). Hráč emit → `error`, nejoinne `world:{id}`. Ověřit role gate `[auto]` | `AU` | M3 | ✅L1 |
| MAP-08 | `handleConnection` bez JWT → `error` event, žádný `user:{id}`. Ověřit, že neautentizovaný socket nedostane `map:reassigned` (jde do `user:{id}`) `[auto]` | `AU` | M3 | ✅L1 |
| MAP-09 | `map:leave` / `map:leave-world` reálně opustí room — po přepnutí scény hráč nedostává operace ze staré scény (jinak duch tokenů z jiné mapy) `[auto]` | `RM` `LC` | M3 | ✅L1 |

> **Výsledek B:** Auth gating přítomné — `requireAuth(client)` u všech handlerů, `map:spotlight`/`map:join-world` navíc role check (membership `< PomocnyPJ` → `error MAP_FORBIDDEN`, [maps.gateway.ts:257-270](../../../Projekt-ikaros/backend/src/modules/maps/maps.gateway.ts#L257)). Detailní role matice netestovaná (gateway bez specu) → L1, gap-fill M7 kandidát.

---

## C. Cross-scene operace & member assignment

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| MAP-10 | `emitWorldOperation` → `world:operation { worldId, seqNumber, op, byUserId, appliedAt }` do `world:{worldId}` (PJ orchestrátor log). FE `useActiveScenes:65` filtruje `op.type.startsWith('member.')`. Ověřit, že BE skutečně posílá `member.*` typy `[auto]` | `PL` | M2 | ✅L1 |
| MAP-11 | `map:member-joined` / `map:member-left` do `{sceneId}` (cascade z world op). Payload parita (`{ sceneId, userId, … }`). Ověřit, že PJ panel přítomných na scéně live reaguje `[auto]` | `PL` `RM` | M2 | ✅L1 |
| MAP-12 | **`map:reassigned` — DVA FE listenery 🔴:** `useMapSocket:107` **i** `useReassignmentListener:40` poslouchají stejný event. Ověřit, zda nejde o dvojité zpracování (dvě navigace / dva toasty) nebo o záměrné rozdělení (jeden naviguje, druhý invaliduje). Doložit `[auto]` | `LC` `EX` | M1 | ✅L1 |
| MAP-13 | `map:reassigned { newSceneId: string\|null }` → `user:{userId}` (privát: PJ mě přesunul; `null` = unassign). Ověřit, že `null` FE zpracuje jako odpojení ze scény (ne crash na `null.sceneId`) `[auto]` | `PL` | M2 | ✅L2 |
| MAP-14 | Token auto-mizí při přechodu (per-player scene assignment přes `currentSceneId`). Ověřit, že reassign emituje i `map:member-left` na staré scéně `[auto]` | `LC` `RM` | M3 | ⚠️ |

> **Výsledek C (K-4 = OK):** `map:reassigned` dva listenery jsou **komplementární, ne konflikt** — `useReassignmentListener` vždy invaliduje `mapSceneQueryKey` ([:35](../../src/features/world/tactical-map/hooks/useReassignmentListener.ts#L35)), `useMapSocket.onReassigned` je **opt-in** UI callback ([:102](../../src/features/world/tactical-map/hooks/useMapSocket.ts#L102)). React Query dvojí invalidaci dedupuje. `null` (unassign) ošetřen: invalidace → `GET /maps/active` 404 → `MapEmptyState` (ne crash).

---

## D. Ephemeral — spotlight & ping

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| MAP-15 | `map:spotlight { sceneId, tokenId }` — PJ+ only; relay do `{sceneId}` jako `map:spotlight { tokenId }` (BE přemapuje payload — vstup má `sceneId`, výstup ne). Ověřit payload transformaci a že FE `useMapSocket:119` čte `tokenId` `[auto]` | `PL` `AU` | M2 | ✅L2 |
| MAP-16 | Spotlight relay přes `client.to` (bez odesílatele) — PJ sám spotlight nevidí jako event (vidí ho lokálně). Ověřit, že to nezpůsobí desync (PJ token bliká jen ostatním) `[auto]` | `RM` | M1 | ✅L1 |
| MAP-17 | `map:ping { sceneId, x, y, userName }` → `map:pinged` do `{sceneId}`. **Payload tvar k ověření:** FE `useMapSocket:131` čte `(x, y, userName)` — jde o objekt nebo poziční argumenty? Doložit shodu BE emit ↔ FE handler signatura `[auto]` | `PL` | M2 | ✅L2 |
| MAP-18 | Ping/spotlight jsou ephemeral (žádná persistence, žádný `seqNumber`) — ověřit, že se nepletou do operation logu / catch-up (po reconnectu se neopakují) `[auto]` | `LC` | M1 | ✅L1 |
| MAP-19 | **15.3** `map:ruler { sceneId, line\|null, userName }` → `map:rulered { userId, userName, line }` do `{sceneId}` (vzor ping; ephemeral, all-roles, room-gated `client.rooms.has`). **`userId` z `client.data.user.id` (authenticated, NE z payloadu)** — klíč per-uživatel proti spoofu cizího měření. `line=null` = konec měření. FE `useMapSocket` `emitRuler`/`onRuler`, `MapRulerLayer`. | `PL` `AU` | M2 | ✅ |

> **Výsledek D:** `map:pinged` používá **poziční argumenty** na obou stranách — BE `emit('map:pinged', x, y, userName)` ([maps.gateway.ts:241](../../../Projekt-ikaros/backend/src/modules/maps/maps.gateway.ts#L241)) ↔ FE handler `(x, y, userName)`. Neobvyklý vzor (jinde objekty), ale konzistentní. Spotlight payload transform `{sceneId,tokenId}` → `{tokenId}` sedí, PJ gate + `client.to` (bez odesílatele) korektní.

---

## E. Počasí — `weather:updated` (dva listenery) 🔴

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| MAP-19 | **`weather:updated` — DVA FE listenery s různým payload očekáváním:** `useMapWeather:112` čte `{ worldId, generatorId, weather }`; `useWeatherWsSubscribe:25` čte `{ worldId, generatorId, generatorName, weather }`. BE emituje `{ worldId, generatorId, generatorName, weather, activeMapWeather? }`. Ověřit, že **oba** listenery zvládnou plný payload a nepřepisují si stav navzájem `[auto]` | `PL` | M2 | ⚠️ W-6 |
| MAP-20 | `weather:null` = PJ vypnul počasí na mapě (10.2i). Ověřit, že oba listenery `weather === null` zpracují (vyčistí, ne crash). **N-39** byl k tomu false-positive — potvrdit, že `clearMapWeather` (mapová atmosféra) a generator karty jsou opravdu oddělené cesty `[auto]` | `PL` | M2 | ✅L2 |
| MAP-21 | `weather:updated` jde do `world:{worldId}`; `useMapWeather` joinuje přes `room:join world:{id}` + re-join po reconnectu (`:82/:84/:86`). **N-27** (room:join bez map gateway odpovědi) byl by-design — počasí dorazí přes AppGateway room join. Ověřit, že počasí reálně teče i bez `map:join-world` `[auto]` | `RM` `LC` | M3 | ✅L2 |

> **Výsledek E:** Dva `weather:updated` listenery se **nebijí** — patchují **různé queries** (`worlds.activeMapWeather` vs `weatherGenerators[].currentWeather`), na různých stránkách (taktická mapa vs WorldWeatherPage). `useMapWeather` `weather===null` ošetřuje (`? {...} : null`). **W-6 (nízká):** `useWeatherWsSubscribe` ([:15-20](../../src/features/world/api/useWeatherWsSubscribe.ts#L15)) typuje `weather: WeatherResult` a `generatorId: string` jako **non-null**, ale BE u clear posílá `null` — typový optimismus (runtime OK: `g.id===null` nematchne, ale typ lže).

---

## F. Legacy / deprecated handlery

> 11 handlerů (`map:token-moved`, `map:config-updated`, `map:token-removed`, `map:reload-scene`, `map:scene-cleared`, `map:effect-added/removed`, `map:fog-updated`, `map:dice-rolled`, `map:scene-state-changed`, `map:sound-changed`) zůstává v gateway pro BC, ale **10.2+ FE je nesmí používat** — nahrazeny operation modelem.

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| MAP-22 | Ověřit, že FE **reálně neemituje ani neposlouchá** žádný z 11 legacy eventů (grep FE na každý string = 0 výskytů mimo komentář). Pokud nějaký žije → buď nedokončená migrace, nebo mrtvý handler k odstranění `[auto]` | `EX` | M1 | ✅L1 |
| MAP-23 | Legacy handlery jsou stále registrované a auth-gated (`requires auth`) — ověřit, že nejsou **otevřený** relay vektor (klient by jimi mohl broadcastnout falešný stav scény mimo operation log) `[auto]` | `AU` `LK` | M4 | ⚠️ W-5 |
| MAP-24 | Rozhodnout: legacy handlery odstranit (dluh `D-xx`) nebo ponechat BC. Pokud žádný klient (web/mobil/starý cache) je nevolá, jsou to mrtvý kód + attack surface `[auto]` | `LK` | M1 | ⚠️ W-5 |

> **Výsledek F (W-5):** FE legacy eventy (`map:token-moved`, `map:fog-updated`, `map:dice-rolled`, `map:scene-state-changed`, `map:sound-changed`, `map:effect-*`) **neposlouchá** — operation model je nahradil. Handlery v gateway ale stále žijí, jen s `requireAuth` (NE role gate), a relayují klientský vstup `client.to(sceneId).emit(...)` ([maps.gateway.ts:277-336](../../../Projekt-ikaros/backend/src/modules/maps/maps.gateway.ts#L277)). Fakticky relay **do prázdna** (nikdo neposlouchá) → neškodné, ale = mrtvý kód + latentní relay surface. **Doporučení: odstranit** (dluh). Drobnost: `map:dice-rolled` používá `server.to` (i odesílateli), ostatní `client.to` — nekonzistence v mrtvém kódu.

---

## Test coverage gaps

- **`maps.gateway.ts` nemá ŽÁDNÝ test** — největší díra auditu. Kritické cesty bez pojistky: `map:join` read-access (MAP-06), `map:join-world` PJ gate (MAP-07), operation broadcast + seqNumber (MAP-01/04), reassign null (MAP-13). **Gap-fill M7/M8 = priorita.**
- Reconnect catch-up (MAP-03) — netestováno; přitom je to jádro operation modelu.
- Dva `map:reassigned` listenery (MAP-12) a dva `weather:updated` (MAP-19) — žádný test ověřující, že se nebijí.

## Známá rizika (předběžná)

- **MAP-12 (dvojitý map:reassigned):** dva nezávislé listenery na stejný `user:{id}` event = potenciální dvojí navigace/toast nebo race. Buď záměrné rozdělení rolí, nebo duplicita. Vysoká priorita doložení.
- **MAP-19 (dvojitý weather:updated):** dvě cache cesty pro počasí s nestejným payload očekáváním. Riziko, že jedna přepíše druhou nebo jedna čte `generatorName: undefined`.
- **MAP-22/24 (legacy):** 11 deprecated handlerů = attack surface (relay falešného stavu) + mrtvý kód. Pravděpodobně dluh k vyčištění.
- **MAP-06 (read-access bez testu):** join scény je jediná auth bariéra mezi hráčem a cizí mapou — a není testovaná.
