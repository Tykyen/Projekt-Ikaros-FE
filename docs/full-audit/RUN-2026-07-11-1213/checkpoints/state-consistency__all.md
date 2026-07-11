# checkpoint — state-consistency (styl S-), RUN 2026-07-11-1213

STATUS: DONE · READ-ONLY · FE=Projekt-ikaros-FE, BE=Projekt-ikaros/backend
Přečteno: plan/README + 00-cross-cutting + tla/README + registr state-consistency-audit.md
+ oba předchozí RUN checkpointy (06-20, 07-05).

## TL;DR
- **#🆕 = 2** nové S-nálezy (`S-RUN-07` systémová sirota listenerů po socket-swapu · `S-RUN-08` lost-update na mapě).
- **🔴/⭐ nejzávažnější:** `S-RUN-07` (⭐, instance N-TM-01) — po `reconnectSocket()` (toggle Neviditelný / guest→member login) osiří VŠECHNY raw `socket.on` listenery taktické mapy → mapa tiše umře do F5.
- Registr (S-01..06 + S-RUN-01..06) **drží, žádná regrese** — reconnect-refetch fixy (S-RUN-02/03) i S-06 `['worlds','my']` jsou v kódu.
- N-TM-03 potvrzen jako `S-RUN-08` (⭐): `onOperation` happy-path aplikuje op na closure `scene`, ne na čerstvou cache.

---

## S-RUN-07 ⭐ `EF`/`RJ` — systémová sirota listenerů po výměně socket instance (`reconnectSocket()`) 🆕

**Kořen.** Kanonické helpery [`useSocketEvent`/`useSocketReconnect`](../../../src/features/chat/api/useSocket.ts#L55) sledují `socketStatusAtom` a **přeregistrují** listener na novou socket instanci po každém swapu (fix S-RUN-04 / FIX-2, dokumentováno i v [`usePresence.ts:27-33`](../../../src/shared/presence/usePresence.ts#L27)). **Ale 6 hooků tuto disciplínu obchází** — dělají raw `getSocket()` + `socket.on(...)` v `useEffect`, jehož deps se při socket-swapu NEZMĚNÍ (`[onOperation]`, `[worldId]`, `[]`, …). Efekt se tedy nespustí znovu → handler zůstane viset na **staré (odpojené, znulované) instanci** → real-time slepota do F5.

**Trigger swapu** = `reconnectSocket()` (`disconnectSocket()` → `socket=null` → nový `io()`):
- [`PrivacySection.tsx:28`](../../../src/features/profile/components/PrivacySection.tsx#L28) — toggle „Neviditelný" (hiddenPresence) — **hlavní mid-session trigger, může nastat s otevřenou mapou**
- [`useAuth.ts:58/85/112`](../../../src/features/auth/api/useAuth.ts#L58) — guest→member login / register / logout

### Postižené hooky (census raw `socket.on` bez `socketStatusAtom` deps)

| Hook:řádek | Event(y) | Efekt po swapu | Zmírnění | Záv. |
|---|---|---|---|---|
| [`useMapSocket.ts:93,107,119,131,143,155,171`](../../../src/features/world/tactical-map/hooks/useMapSocket.ts#L113) | `map:operation`/`reassigned`/`spotlight`/`pinged`/`rulered` + raw `connect` re-join + `error` | **VŠE osiří** — žádná op, žádný reassign, `connect` re-join handler taky osiří → **scéna room se nikdy nerejoinne** (mount effect deps=`[sceneId]` beze změny) → totální slepota mapy | **žádné** | **⭐ (N-TM-01)** |
| [`useActiveScenes.ts:66`](../../../src/features/world/tactical-map/hooks/useActiveScenes.ts#L66) | `world:operation` (member.*) | listener osiří → PJ orchestrátor (seznam aktivních scén) zamrzne; `useSocketReconnect` sice re-emitne `map:join-world` na novou instanci, ale handler visí na mrtvé → nová instance dostává eventy bez handleru; **navíc reconnect nedělá refetch** | částečné (re-join, ne listener) | 🟠 |
| [`useUniverseSocket.ts:59,79`](../../../src/features/world/universe/hooks/useUniverseSocket.ts#L59) | raw `connect` (S-RUN-03 refetch) + `universe:updated` | **i sám S-RUN-03 refetch handler osiří** (je raw `socket.on('connect')`, ne `useSocketReconnect`) → po swapu se nová instance nerejoinuje ani nerefetchuje → vesmírná mapa mrtvá | **žádné** | 🟠 |
| [`useMapWeather.ts:110`](../../../src/features/world/tactical-map/hooks/useMapWeather.ts#L110) | `weather:updated` | listener osiří; `useSocketReconnect` invaliduje `['worlds']` v momentě swapu (dorovná), ale **další** `weather:updated` po swapu je ztracen | částečné | 🟡 |
| [`useReassignmentListener.ts:49`](../../../src/features/world/tactical-map/hooks/useReassignmentListener.ts#L49) | `map:reassigned` | listener osiří; `useSocketReconnect` invaliduje scénu při swapu, ale další reassign po swapu ztracen (hráč uvázne na scéně) | částečné | 🟡 |
| [`usePresenceHeartbeat.ts:17`](../../../src/features/chat/api/usePresenceHeartbeat.ts#L17) | emit `chat:heartbeat` | zachytí `const socket = getSocket()` při mountu → interval po swapu tepe na **mrtvou** instanci (usePresence tenhle vzor schválně obchází freš `getSocket()` per-emit) → BE po 60 min odebere z chat rooms | nízké | ⚪ |

**Bezpečné (přes `useSocketEvent`/watch status):** `usePresence` (opraveno), `useWorldSocket`, `useVoicePresence`, `useGlobalChat` (room-presence), + všechny `useSocketEvent`-based (chat, emoty, friendships, ikaros, mail).

**Úryvek (kořen — chybí `status` v deps):** `useMapSocket.ts:114-123`
```ts
useEffect(() => {
  if (!onOperation) return;
  const socket = getSocket();
  const handler = (payload: MapOperationBroadcast): void => onOperation(payload);
  socket.on("map:operation", handler);
  return () => { socket.off("map:operation", handler); };
}, [onOperation]);   // ← žádný socketStatusAtom → po reconnectSocket() sirota
```

- **Trigger:** toggle „Neviditelný" v Soukromí (nebo guest→member login) s otevřenou mapou/vesmírem.
- **Viditelnost:** tichá — žádná chyba, UI drží předswapový stav; při swapu se ani nezobrazí toast „Operace se nezdařila" (S-02 error listener taky osiří).
- **Kdo:** postižený klient (i vlastní i cizí změny). **Workaround:** jen F5 (reconnect na stejné instanci NEpomůže — instance je znulovaná).
- **Návrh:** převést raw `socket.on` v těchto hoocích na `useSocketEvent` (a raw `connect` na `useSocketReconnect`), stejně jako fix S-RUN-04 pro `usePresence`. `usePresenceHeartbeat` volat `getSocket()` čerstvě per-emit. → jednotný vzor, ověřit L4 mock-socket-swap testem (vzor `useSocket.spec.ts:59`).
- **Klasifikace:** 🆕 — třída byla opravena u helperů + `usePresence` (S-RUN-04), ale raw-socket mapové/vesmírné hooky byly přehlédnuty; registr je neuvádí.

---

## S-RUN-08 ⭐ `CV` — `onOperation` lost-update: aplikace na closure `scene` místo čerstvé cache 🆕 (= N-TM-03)

**Kde:** [`useMapScene.ts:161-206`](../../../src/features/world/tactical-map/hooks/useMapScene.ts#L161), happy-path řádky 169-170.
```ts
const onOperation = useCallback(async (payload) => {
  if (!worldId || !scene) return;
  ...
  const expectedSeq = lastSeqRef.current + 1;
  if (payload.seqNumber === expectedSeq) {
    const next: MapScene = {
      ...applyOperationToScene(scene, payload.op),   // ← BASE = closure `scene` (stale!)
      lastSeqNumber: payload.seqNumber,
    };
    lastSeqRef.current = payload.seqNumber;
    queryClient.setQueryData(mapSceneQueryKey(worldId), next);
  }
  ...
}, [worldId, scene, queryClient, query, onLiveDiceRoll]);
```

**Podstata.** `scene` je snapshot z `query.data` v čase vytvoření callbacku. `lastSeqRef` (ref) se aktualizuje **synchronně**, ale `scene` (closure) až po re-renderu. Když přijdou **2+ ops v jednom render-ticku** (burst — PJ hýbe víc tokeny, AoE efekt + několik token updatů, reorder iniciativy):
- op1 (seq1): `next = apply(scene_v0, op1)` → cache=v1, ref=1 ✓
- op2 (seq2) přijde před re-renderem: `expectedSeq = ref+1 = 2 = seq2` → happy path, `next = apply(scene_v0, op2)` → **aplikuje op2 na v0, op1 zahozen!** cache=v0+op2, ref=2.

Sekvence sedí (seq byl souvislý) → **žádný gap se nedetekuje** → catch-up se nespustí → **trvalá tichá divergence** klientova stavu od serveru (do příštího reconnect/refetch).

**Důkaz, že fix-vzor existuje ve stejném souboru:** `diceMutation.onMutate` ([`:136-147`](../../../src/features/world/tactical-map/hooks/useMapScene.ts#L136)) čte **čerstvou** cache `queryClient.getQueryData(mapSceneQueryKey)` s komentářem *„Base = FRESH cache (`prev`), ne closure `scene` (staleness při rychlé sekvenci hodů)"*. Happy-path `onOperation` stejnou disciplínu nedodržel.

- **Trigger:** ≥2 `map:operation` v jednom ticku (aktivní multiplayer boj, dávkové operace PJ).
- **Viditelnost:** tichá — pohyb/efekt tokenu zmizí, stav se rozejde napříč klienty; nesrovná se sám (seq souvislý → gap logic se nechytí).
- **Kdo:** všichni na scéně; **férovost herního stavu** (SLO). **Workaround:** F5 / reassign / reconnect (spustí catch-up).
- **Návrh:** happy-path base číst z `queryClient.getQueryData(mapSceneQueryKey(worldId))` (jako dice mutace), ne z closure `scene`; L7 property test (protokol A) na sekvence bez gapu.
- **Klasifikace:** 🆕.

---

## Ověřeno OK / drží (bez akce)
- **S-06** ✅ — `useWorldSocket.invalidateMembers` invaliduje i `['worlds','my']` ([`:65`](../../../src/features/world/hooks/useWorldSocket.ts#L65)). Drží.
- **S-RUN-02** ✅ — `useReassignmentListener` má `useSocketReconnect` refetch scény ([`:30`](../../../src/features/world/tactical-map/hooks/useReassignmentListener.ts#L30)). (Orphan-on-swap je ODDĚLENÁ dimenze → S-RUN-07.)
- **S-RUN-03** ✅ — `useUniverseSocket` connect refetch existuje ([`:47-58`](../../../src/features/world/universe/hooks/useUniverseSocket.ts#L47)). (Ale sám osiří na swapu → S-RUN-07.)
- **K-S6** ✅ by-design — `weather:updated` 2 disjunktní cíle (`['worlds']` vs `['weather-generators']`). Drží.
- **K-S8** ✅ by-design — chat dedup (`id` + `clientNonce` swap) konverguje. Drží.
- **S-01/S-02** ✅ — `map:member-*` smazány; `socket.on('error')` v `useMapSocket:102-111` + globální v `socket.ts:44`.

## Poznámky k dopadu / metodika
- Server běží s reálnými uživateli. S-RUN-07/08 jsou **tiché** (žádná chyba), oprava bez souhlasu se nedělá (pravidlo projektu).
- Hloubka: L1 (čtení) + L2 (cross-ref helper disciplína / seq-tracking) pro oba nálezy. L4 mock-socket-swap a L7 burst-property testy jsou navržené pojistky, nespuštěny (READ-ONLY).
