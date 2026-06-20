# state-consistency / 00-cross-cutting — checkpoint RUN-2026-06-20-1621

Datum: 2026-06-20. Auditor: Claude Sonnet 4.6.
FE commit: 96460577 · BE commit: HEAD (neměněno od oprav S-01..06).

---

## Pokrytí

- **A. Socket abstrakce** (XC-01..04): přečteno — `socket.ts`, `useSocket.ts`, `reconnectSocket`, `useSocketInit`. ✅L2
- **B. Listener census** (~40 listenerů): potvrzen grepem `socket.on`/`useSocketEvent` napříč `src/`. Všechny listenery z inventury ověřeny ve skutečném kódu. ✅L2
- **C. Reconnect × refetch matice**: ověřena, S-RUN-01..03 drží (opraveno). Odhalen nový systematický deficit. Viz nálezy. L2
- **D. Emit census (P6)**: klíčové BE gateways přečteny — 11 souborů. Žádný nový mrtvý emit. ✅L2
- **Předchozí opravy S-01..06 a S-RUN-01..03**: regrese nenalezena, kód odpovídá auditovaným opravám. ✅L2

Nesweepováno (za plán): L4 round-trip testy, L5 multi-klient E2E, L6 chaos, L7 property-based, L8 TLC (pouze `MapReconnect` model).

---

## Dosažená L vs cílová L

| Oblast | Cíl | Dosaženo |
|--------|-----|----------|
| 00 cross-cutting | L2 census + L8 traceability | **L2** (L8 model zůstává ověřen z 2026-06-13) |
| 01–09 per-oblast | L2–L8 dle tabulky | L2 statika; vyšší vrstvy: PROOF-REQUEST |

---

## Nálezy

### S-RUN-04 🟠 `RJ` — `useSocketReconnect` deps=[] + `reconnectSocket()` = stale listeners

- **Kde:** `src/features/chat/api/useSocket.ts:57-64` — `useSocketReconnect` registruje `socket.on('connect', handler)` v `useEffect` s **`deps=[]`**. Socket instance je zachycena jednou při mountu přes `getSocket()`.
- **Problém:** `reconnectSocket()` (`socket.ts:58-61`) volá `disconnectSocket()` → `socket = null` → `getSocket()` vytvoří **novou** instanci. Handlér je ale stále registrovaný na **staré** (odpojené) instanci. Nový socket nikdy nezafiruje `'connect'` pro tyhle handlery.
- **Kontrast:** `useSocketEvent` má `deps=[event, status]` kde `status = socketStatusAtom` → po `disconnectSocket()` (→`'disconnected'`) a `getSocket()` (→`'connecting'`) se znovu zaregistruje na nové instanci. ✅ Ale `useSocketReconnect` tuto logiku nemá. ❌
- **Rozsah postiženého kódu (všechny `useSocketReconnect` callsites):** `useWorldSocket`, `useWorldAccessSocket`, `useFriendshipsSocket`, `useAccountTransferNotifications`, `useIkarosNews`, `useIkarosEvents`, `useEvents` (notifications), `useChatFeed`, `useChatFeed`, `ChannelView`, `ChatRoom.tsx`, `useUnreadSync`, `useReassignmentListener`, `useActiveScenes` — celkem **~14 míst**.
- **Dodatečné postihy přímých `socket.on('connect')` hooks:** `useMapSocket.ts:78-88` (deps=[sceneId,onReconnect], ale `socket` je stale po reconnectSocket), `useMapWeather.ts:78-91` (deps=[worldId]), `useUniverseSocket.ts:39-62` (deps=[worldId,qc]), `usePresenceInit` (deps=[]).
- **Trigger:** uživatel zapne/vypne "Neviditelný mód" v Soukromí (`PrivacySection.tsx:28`) → `reconnectSocket()`. V praxi jen tento 1 call-site.
- **Viditelnost / kdo:** postižen každý uživatel, který přepne přepínač. Po reconnectu přestanou fungovat ALL `useSocketReconnect` re-join joiny → world room oslepne (ne `world:updated`, membership, news), active-scenes oslepne (PJ orchestrátor), chat nerejoinne, unread nesyncuje, notifikace nesyncují atd.
- **Workaround:** F5 (full reload) re-mountuje vše na nový socket.
- **Závažnost:** 🟠 střední — dotčený scénář je úzký (jen po toggle neviditelnosti), ale efekt je systémový (celý real-time stack oslepne do F5). Není crashem, ale uživatel neví proč zprávy a eventy přestaly chodit.
- **Návrh — opce A (minimální):** přidat `socketStatusAtom` jako dependency do `useSocketReconnect`'s vnitřního effectu:
  ```ts
  // v useSocketReconnect
  const status = useAtomValue(socketStatusAtom);
  useEffect(() => {
    const socket = getSocket();
    const handler = () => ref.current();
    socket.on('connect', handler);
    return () => { socket.off('connect', handler); };
  }, [status]); // re-subscribe při výměně socketu
  ```
  Totéž udělat pro raw `socket.on('connect')` efekty v useMapSocket, useMapWeather, useUniverseSocket, usePresenceInit.
- **Návrh — opce B (root-cause):** `reconnectSocket()` po vytvoření nové instance emituje signál (atom), na který `useSocketReconnect` reaguje. Méně invazivní na callsites.
- **L:** L2 (kód čten, architektura ověřena). L4 test by prokázal: `reconnectSocket()` → žádný re-join.
- **Třída:** 🆕

### S-RUN-05 🟡 `RJ` — `useBestiar` bez `useSocketReconnect` (scope room, 30s staleTime)

- **Kde:** `src/features/world/bestiar/hooks/useBestiar.ts:20-25` — `bestiar:changed` listener bez reconnect. BE emituje do `world:{worldId}` nebo `user:{ownerUserId}` nebo broadcast.
- **Stav:** nenalezena ani `useSocketReconnect` ani `staleTime` pod 30s. `staleTime: 30_000` = po 30s se query sama obnoví při focus/visit — gap pokryt passively.
- **Trigger:** `bestiar:changed` vyslán během WS výpadku → bestiar zůstane stale maximálně 30s (pak staleTime).
- **Verdikt:** ⚖️ přijatý dluh (nízký dopad: bestiář je pomocný katalog, 30s passivní refetch krátí gap). Nemění stav cache ani UI kriticky.
- **L:** L2.
- **Třída:** ♻️ (K-S9 varianta, jiná entita)

### S-RUN-06 🟡 `TG`/`DUP` — `chat:message:reaction` chybí v listenerové tabulce (nový event)

- **Kde:** `src/features/chat/components/ChatRoom.tsx:256` + `src/features/chat/api/socket.ts` — FE poslouchá `chat:message:reaction`. BE emituje `chat:message:reaction` v `global-chat.gateway.ts:444` (do `user:{userId}` private roomů členů kanálu).
- **Stav:** Event EXISTUJE v listener inventuře (byl v původním 00-cross-cutting plánu jako `ChatRoom.tsx:237`), ale chybí v **world chatu** (ChannelView) — tam je jen `chat:message:updated` a `chat:message:deleted`, ne reaction.
- **Ověření:** `ChannelView.tsx:361-364` — `chat:message`, `chat:message:updated`, `chat:message:deleted`, `chat:typing`. **Žádný** `chat:message:reaction`.
- **BE emituje reaction world chatu?** Grep `chat.gateway.ts:379` emituje `chat:unread` do `user:{userId}`. Reaction listener je v global-chat, ne world-chat. World-chat reactions: přes `GlobalChatGateway` nebo `ChatGateway`?

  `chat.gateway.ts` (world chat) — grep emituje `chat:message:deleted`, `chat:channel:deleted`, `chat:unread`, `chat:presence`, `chat:sound:playing/stopped`, `chat:feed:bump`. **Žádný** `chat:message:reaction` v `chat.gateway.ts`.

  `global-chat.gateway.ts:444` — emituje `chat:message:reaction` jen pro globální chat. World chat reakce: chybí BE emit nebo nejsou implementovány.

- **Verdikt:** World chat nemá reakce (ani BE ani FE). Není to EM/EF bug — je to chybějící feature nebo záměr. ⚖️ by-design nebo nevysmluvená feature. Nespadá do state-consistency — spíš ws-contract / bug-audit.
- **L:** L2.
- **Třída:** 🆕 (k zaznamenání, ne S-RUN nález)

---

## Průřezová analýza `reconnectSocket()` dopadu (rozšíření S-RUN-04)

`reconnectSocket()` volá `disconnectSocket()` + `getSocket()`. Jen z `PrivacySection.tsx:28` (toggle neviditelnosti). Po volání:

| Hook | Mechanismus reconnect | Po reconnectSocket() |
|------|-----------------------|---------------------|
| useSocketReconnect (všechny) | deps=[] → old socket | ❌ stale, žádný re-join |
| useSocketEvent (všechny) | deps=[event, socketStatusAtom] | ✅ re-registruje se |
| useMapSocket connect-effect | deps=[sceneId, onReconnect], old socket | ❌ stale |
| useMapWeather connect-effect | deps=[worldId], old socket | ❌ stale |
| useUniverseSocket connect-effect | deps=[worldId, qc], old socket | ❌ stale |
| usePresenceInit | deps=[], old socket | ❌ stale (server auto-snapshot, no listener) |

Výsledek: **všechny re-join callbacks selžou** po `reconnectSocket()`. Listeners (useSocketEvent) přežijí, ale nevědí o room re-join → budoucí roomy neprobíhají. World room ztracen → world eventy přestanou chodit celé session do F5.

---

## PROOF-REQUEST

| # | Oblast | Co ověřit | Metoda | Blokuje |
|---|--------|-----------|--------|---------|
| PR-01 | S-RUN-04 | `reconnectSocket()` → `useSocketReconnect` handler opravdu NEVOLÁ re-join (L4 mock-socket test) | M5 vitest | L4 |
| PR-02 | 02/03 chat | Chat optimistic dedup (K-S8) → L4 round-trip mock test (emit echo → assert 1 zpráva v cache) | M5 vitest | L4 |
| PR-03 | 06 mapa | `useMapSocket` reconnect efekt → stale socket po `reconnectSocket()` (L4) | M5 vitest | L4 |
| PR-04 | 06 mapa | `map:operation` gap po výpadku (L6 chaos — disconnect → BE emit → reconnect → assert catch-up) | M4/L6 | L6 |
| PR-05 | ALL | MapReconnect TLA+ → L7 property-based smyčka (invariant „∀ reconnect: clientState = serverState po ustálení") | fast-check | L7 |
| PR-06 | ALL | Multi-klient E2E: A změní roli → B vidí bez F5 (S-06 fix); A pošle zprávu → B vidí | Playwright L5 | L5 |
