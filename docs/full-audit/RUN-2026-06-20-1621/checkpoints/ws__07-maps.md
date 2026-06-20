# ws / 07-maps — checkpoint RUN-2026-06-20-1621

## Pokrytí

Prošel jsem kompletně:
- `maps.gateway.ts` — všechny handlery, auth flow, emit helpery
- `useMapSocket.ts` — join/leave, reconnect, všechny listenery
- `useActiveScenes.ts` — world:operation listener, W-7 fix ověřen
- `useReassignmentListener.ts` — map:reassigned dual listener ověřen
- `useMapWeather.ts` — weather:updated listener, room join
- `useWeatherWsSubscribe.ts` — druhý weather listener, W-6 fix ověřen
- `applyOperationToScene.ts` — idempotentní dedup pro optimistic+echo
- `useMapScene.ts` — seqNumber gap detection, reconnect catch-up
- `types.ts` — FE typy WS payloadů (MapOperationBroadcast, MapReassignedBroadcast, WorldOperationBroadcast)
- `world-operations.service.ts` — emitMemberSideEvents (reassigned flow)
- `interfaces/map-operations-repository.interface.ts` — allocateSeqNumber atomicita
- `WorldMembership.interface.ts` + `WorldRole` enum

## Dosažená L vs cílová L

| Bod | Cílová L | Dosažená L | Stav |
|-----|---------|-----------|------|
| MAP-01 payload parita | L2 | L2 | ✅ |
| MAP-02 gap detection | L2 | L2 | ✅ |
| MAP-03 reconnect catch-up | L2 | L2 | ✅ W-7 fix ověřen |
| MAP-04 seqNumber atomicita | L2 | L2 | ✅ $inc v repo interface |
| MAP-05 self-echo dedup | L2 | L2 | ⚠️ — viz W-RUN-07-01 |
| MAP-06 map:join auth/role | L2 | L2 | 🔴 W-RUN-07-02 NOVÝ NÁLEZ |
| MAP-07 map:join-world PJ gate | L2 | L2 | ✅ |
| MAP-08 handleConnection bez JWT | L2 | L2 | ✅ |
| MAP-09 map:leave cleanup | L1 | L1 | ✅ |
| MAP-10 world:operation PL | L1 | L1 | ✅ — room přejmenován na world-ops:{id} |
| MAP-11 map:member-joined/left | L1 | L1 | ✅ — S-01 zrušeny, jen map:reassigned |
| MAP-12 dual map:reassigned | L1 | L1 | ✅ komplementární |
| MAP-13 map:reassigned null | L2 | L2 | ✅ |
| MAP-14 map:member-left při reassign | L2 | L1 | ⚠️ S-01 poznámka |
| MAP-15 spotlight PL+AU | L2 | L2 | ✅ |
| MAP-16 spotlight client.to | L1 | L1 | ✅ |
| MAP-17 map:ping PL | L2 | L2 | 🟠 W-RUN-07-03 NOVÝ NÁLEZ |
| MAP-18 ping/spotlight ephemeral | L1 | L1 | ✅ |
| MAP-19 weather dual listeners | L2 | L2 | ✅ W-6 fix ověřen (nullable) |
| MAP-20 weather:null | L2 | L2 | ✅ |
| MAP-21 weather room join | L2 | L2 | ✅ |
| MAP-22 legacy FE grep | L1 | L1 | ✅ |
| MAP-23/24 legacy handlery | L1 | L1 | ✅ W-5 opraveno (smazány) |

## Nálezy

### W-RUN-07-01 — [LC/PL] MAP-05: token.add optimistic+echo dedup chybí · ⚠️ nízká · ♻️

- **Kde:** `applyOperationToScene.ts:39-40` (token.add case) vs. `TacticalMapView.tsx:539-540` (spawn komentář)
- **Popis:** `token.add` case v patcheru nemá idempotentní dedup na `token.id` (na rozdíl od `effect.add:72-84` a `dice.roll:383-386`). Pokud by klient odeslal `token.add` s optimistic apply, WS echo by přidal token podruhé. Komentář v TacticalMapView říká "žádný optimistic" pro spawn — to je ochranné by-design rozhodnutí, ale není typově ani testovací pojistkou vynuceno.
- **Dopad:** Aktuálně nulový (spawn není optimistic). Riziko do budoucna, pokud někdo přidá optimistic pro `token.add`. Latentní tech dluh.
- **Návrh:** Buď přidat dedup `if (scene.tokens.some(t => t.id === op.token.id)) return { ...scene, tokens: scene.tokens.map(...) }` pro konzistenci se `effect.add`; nebo přidat komentář u `token.add` proč dedup chybí (záměrně bez optimistic). Nízká priorita.
- **L1 · ⚠️ nízká · ♻️**

---

### W-RUN-07-02 — [AU/RM] MAP-06: map:join neověřuje WorldRole ≥ Hrac — Zadatel může číst live ops · 🔴 střední-vysoká · 🆕

- **Kde:** `maps.gateway.ts:116-130` (handleJoin)
- **Popis:** `map:join` ověřuje jen existenci membership (`if (!membership)`), ale NE minimální roli. `WorldRole.Zadatel = 0` je role žadatele o přístup — má platný membership dokument, ale nemá být ve světě. Po úspěšném `map:join` vstoupí žadatel do `{sceneId}` roomu a dostává **všechny `map:operation` broadcasty** (tokeny, HP, mlha, kostky, pozice postav).
- **Srovnání:** REST endpoint `maps.service.ts:findActiveForUser` (HTTP GET scene) taktéž neověřuje roli — kontroluje jen `currentSceneId`. REST `findByWorld/findActiveScenes` ověřuje `>= PomocnyPJ`. Takže i REST má potenciální mezeru pro Zadatel+currentSceneId.
- **Dopad:** Žadatel, kterého PJ odmítne, si přesto může přečíst live state scény (HP, mlha, pozice) přes WS — obejde REST gate. V praxi pravděpodobný jen u worldů s `accessMode:'public'` kde se Zadatel může rychle přihlásit a pak čekat na schválení/odmítnutí.
- **Návrh:** V `map:join` přidat check `membership.role < WorldRole.Hrac` → emit `error { code: 'MAP_FORBIDDEN' }`. Analogicky opravit `findActiveForUser` v maps.service (REST).
- **L2 · 🔴 střední-vysoká · 🆕**

---

### W-RUN-07-03 — [AU/LK] map:ping bez membership gate — libovolný autentizovaný user broadcastuje do cizí scény · 🟠 střední · 🆕

- **Kde:** `maps.gateway.ts:193-203` (handlePing)
- **Popis:** `map:ping` má pouze `requireAuth(client)` — ověřuje JWT existenci, ale NEověřuje, zda odesílatel je členem světa nebo dokonce v dané scéně. `payload.sceneId` pochází z klientského payloadu beze změny. Útočník (libovolný přihlášený uživatel platformy) může poslat `map:ping` s `sceneId` libovolné scény a broadcastovat `map:pinged { x, y, userName }` všem účastníkům téže scény — i bez přístupu k dané scéně.
- **Kontrast:** `map:spotlight` (stejný pattern, stejná scéna) ověřuje jak auth tak PomocnyPJ+ roli ve světě. `map:ping` neověřuje nic.
- **Dopad:** (1) Obtěžování: útočník může spamovat piny do aktivních herních scén. (2) Únos userName: `userName` přijde z klientského payloadu — útočník pošle `{ userName: 'PJ', sceneId: '...' }` → UI ukáže `PJ` pingoval na libovolnou souřadnici.
- **Návrh:** Přidat membership check (alespoň `WorldRole.Hrac`) a/nebo ověřit, že `client` je v `{sceneId}` roomu (`client.rooms.has(sceneId)`). `userName` brát z `client.data.user.id` přes lookup, ne z payloadu (jako u presencí po W-3 opravě).
- **L2 · 🟠 střední · 🆕**

---

### W-RUN-07-04 — [RM] MAP-10: emitWorldOperation jde do world-ops:{id}, ne world:{id} — plan uvádí jinak · ⚪ kosmetika/dokumentace · 🆕

- **Kde:** `maps.gateway.ts:269-281` (emitWorldOperation), `07-maps.md:43` (MAP-10 status ✅L1)
- **Popis:** Oblast plan v MAP-10 říká `world:operation` jde do `world:{worldId}` (PJ orchestrátor log). Ve skutečnosti (R-13 komentář v kódu) jde do `world-ops:{worldId}` (PJ-only room, joinovaný přes `map:join-world` → `client.join('world-ops:${worldId}')`). `world:{id}` room slouží pro počasí/universe — oddělení je záměrné a správné (leak-safe), ale plan to nedokumentuje.
- **Dopad:** Nulový funkcionální; dokumentační nesrovnalost. `useActiveScenes` naslouchá `world:operation` na sdíleném socketu — event přijde přes `world-ops:` room, listener je na správném eventu → vše funguje.
- **Návrh:** Aktualizovat `07-maps.md` MAP-10 — opravit room name na `world-ops:{worldId}` a přidat odkaz na R-13.
- **L1 · ⚪ kosmetika · 🆕**

---

### W-RUN-07-05 — [LC] useActiveScenes: useEffect emit map:join-world vs useSocketReconnect — potenciální race · ⚪ nízká · ♻️

- **Kde:** `useActiveScenes.ts:53-72` (useEffect) + `useActiveScenes.ts:76-78` (useSocketReconnect)
- **Popis:** `useEffect` emituje `map:join-world` na mount; `useSocketReconnect` emituje totéž po reconnectu. Po reconnectu Socket.IO zahodí rooms → `useSocketReconnect` re-join je nezbytný (W-7 oprava). Ale `socket.join` v Socket.IO je idempotentní → double-join je neškodný. Funguje správně.
- **Dopad:** Nulový. Double emit je zbytečný, ale harmless. Není to chyba.
- **Návrh:** Zvážit konsolidaci do `useSocketReconnect` patternu (jako useMapSocket:78-88), aby byl join na jednom místě. Nízká priorita refaktoring.
- **L1 · ⚪ nízká · ♻️**

## PROOF-REQUEST

| ID | Co ověřit | Proč nestačí statika |
|----|-----------|---------------------|
| PR-07-A | Ověřit runtime behavior MAP-06: připojit socket jako Zadatel (role=0), emitovat `map:join`, potvrdit zda obdrží `map:operation`. | Statika ukazuje mezeru (no role check), ale runtime by mohl existovat jiný gate (middleware?) |
| PR-07-B | Ověřit W-RUN-07-03: ověřit, že autentizovaný user bez world membership může broadcastovat `map:ping` do scény. | Gateway ping handler nemá membership check — runtime to potvrdí, ale test gateway (bez testu) neexistuje. |
| PR-07-C | `maps.gateway.ts` NEMÁ ani jeden test (maps.gateway.spec.ts neexistuje). Kritické cesty MAP-06, MAP-07, MAP-08, MAP-01 bez pojistky. Gap-fill testy (M7) na: join Zadatel → error; join validní member → OK; join-world ne-PJ → error; ping bez membership → broadcast dorazí. | Bez testů je statická L2 jediná jistota; M7 dá L3/L4. |
