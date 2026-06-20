# ws / 09-frontend-socket-vrstva — checkpoint RUN-2026-06-20-1621

Datum: 2026-06-20. Oblast: FE socket vrstva (singleton, useSocketEvent, reconnect).

---

## Pokrytí

Prošly soubory:
- `src/features/chat/api/socket.ts` — singleton, transports, auth token
- `src/features/chat/api/useSocket.ts` — useSocketInit, useSocketEvent, useSocketReconnect
- `src/features/chat/api/usePresenceHeartbeat.ts` — heartbeat interval
- `src/features/chat/store/socketStore.ts` — socketStatusAtom
- `src/shared/presence/usePresence.ts` — usePresenceInit (direct socket.on, deps=[])
- `src/features/world/hooks/useWorldSocket.ts` — W-9 fix, useSocketReconnect
- `src/features/world/chat/components/WorldChatRoom.tsx` — room join přes WorldLayout
- `src/features/world/chat/components/ChannelView.tsx` — W-7 fix, chat room re-join
- `src/features/world/tactical-map/hooks/useActiveScenes.ts` — W-7 fix, map:join-world
- `src/features/world/tactical-map/hooks/useMapSocket.ts` — direct socket.on, connect handler
- `src/features/world/tactical-map/hooks/useMapWeather.ts` — weather room re-join
- `src/features/world/universe/hooks/useUniverseSocket.ts` — universe room re-join
- `src/features/world/tactical-map/hooks/useReassignmentListener.ts` — useSocketReconnect
- `src/features/profile/components/PrivacySection.tsx` — reconnectSocket() call site
- `src/features/chat/api/useSocket.spec.ts` — useSocketReconnect testy
- Grep přes všechny `socket.on(`, `useSocketReconnect`, `reconnectSocket`, `io(`, `socketStatusAtom`

---

## Dosažená L vs cílová L

| Sekce | Cílová | Dosažená | Poznámka |
|---|---|---|---|
| A. Singleton & inicializace | L3 | L2 | FES-01..06 ověřeny staticky; FES-03 (W-8) opraveno (polling-first potvrzeno v kódu) |
| B. useSocketEvent | L3 | L2 | FES-07..10 ověřeny; wrapper vzorný; žádný test useSocketEvent jako takového (gap) |
| C. Syrové socket.on | L2 | L2 | FES-11..13 OK; FES-14 ⚠️ potvrzen v kódu — viz W-RUN-01 níže |
| D. Status & UX | L2 | L1 | FES-15..18 staticky; FES-17/18 = nové konkrétnější nálezy W-RUN-02/03 |

Oproti původnímu plánu: všechny původní W-7/W-8/W-9 opravy potvrzeny v aktuálním kódu.
Tři nové nálezy specifičtější než ⚠️ v plánu.

---

## Nálezy

### W-RUN-01 — `reconnectSocket()` nespustí `useSocketReconnect` callbacky → room blind-spot ♻️
- **Kde:** `src/features/chat/api/useSocket.ts:57-64` (`useSocketReconnect`, deps `[]`) + `src/features/profile/components/PrivacySection.tsx:28` (`reconnectSocket()`)
- **Podstata:** `useSocketReconnect` registruje `socket.on('connect', handler)` na instanci z mountu (deps `[]`). `reconnectSocket()` (volaný při toggle hiddenPresence) provede `disconnectSocket()` → `socket = null` → `getSocket()` → nová instance. Nová instance je odlišný objekt → mount-time `connect` handler na ní není → re-join callbacky se nespustí. Postiženy všechny místa co volají `useSocketReconnect`: world chat, ChannelView, useActiveScenes, useWorldSocket, ChatRoom (hospoda), friendships, reassignmentListener, events, chatFeed, accountTransfer, ikarosNews, ikarosEvents — celkem ~12 hook volání. Efekt je totožný jako původní W-7 bug, ale spouštěný přes `reconnectSocket()` ne přes síťový výpadek.
- **Dopad:** Po přepnutí „Neviditelný mód" v nastavení soukromí — nový socket se připojí, ale nikdo nepošle `room:join world:{id}`, `room:join chat:{id}`, `chat:channel:join`, `map:join-world` atd. → real-time slepost v aktuálně otevřených stránkách do page reload.
- **Návrh:** `useSocketReconnect` přidat deps na `socketStatusAtom` nebo na `socketIdRef`, aby se při swapu instance re-registroval na nový socket. Alternativa: `reconnectSocket` emitovat vlastní event (jotai atom `reconnectCounterAtom` nebo `socketInstanceAtom`) místo spoléhání na `connect`.
- **Osa:** `LC`
- **L:** L2 (staticky ověřeno, chybí test)

### W-RUN-02 — `usePresenceHeartbeat` drží starý socket po `reconnectSocket()` → heartbeat mrtvý ♻️
- **Kde:** `src/features/chat/api/usePresenceHeartbeat.ts:14-21` (deps `[enabled]`) + `PrivacySection.tsx:28`
- **Podstata:** Effect závislý jen na `enabled`. Po `reconnectSocket()` se `enabled` nemění (token stále platný). Interval běží dál, ale `socket` v closure je stará odpojená instance → `socket.emit('chat:heartbeat')` je no-op. Heartbeat tiše umírá na novém socketu.
- **Dopad:** Server po 60 min označí uživatele jako „offline" z chat rooms, i když je aktivní — po přepnutí hiddenPresence a návratu do chatu. Nepřímý dopad: absence heartbeatu může urychlit chat presence expiry.
- **Návrh:** Přidat deps `socketStatusAtom` nebo při každém emit volat `getSocket().emit(...)` místo uzavřít `socket` v closure při mountu.
- **Osa:** `LC`
- **L:** L2 (staticky ověřeno)

### W-RUN-03 — `connect_error` nastaví `socketStatusAtom = 'error'`, ale UX mimo mapu je tichý ♻️
- **Kde:** `src/features/chat/api/socket.ts:36` + `src/features/chat/api/useSocket.ts:24-34` (toast jen na `'disconnected'`, ne na `'error'`) + `src/features/world/tactical-map/components/MapConnectionBadge.tsx` (jediný UI konzument `socketStatusAtom` mimo toasty)
- **Podstata:** `connect_error` (BE down, token odmítnut, proxy blokuje) → status `'error'`. Toast v `useSocketInit` reaguje jen na `'disconnected'` a `'connected'`. `MapConnectionBadge` reaguje na `error` ("odpojeno"), ale jen na taktické mapě. Na všech ostatních stránkách (chat, dashboard, profil…) `'error'` stav = tiché selhání bez vizuální zpětné vazby.
- **Dopad:** Pokud se socket nepodaří připojit (BE restart, token expirace po dlouhé neaktivitě, proxy), uživatel mimo mapu neví, že real-time nefunguje. Socket.IO default backoff (exponenciální) retryuje, ale UI nevykazuje žádný indikátor.
- **Návrh:** V `useSocketInit` přidat toast i pro `'error'` (stejný vzor, `wasConnected.current` guard nebo separátní `hasFailedConnect` flag). Nebo sdílet `MapConnectionBadge` do globálního layoutu.
- **Osa:** `LC` `EX`
- **L:** L2 (staticky ověřeno)

---

## Potvrzené OK (z původního plánu)

| Bod | Stav | Důkaz |
|---|---|---|
| FES-01 singleton + jen jedno `io(` | ✅L1 | grep `io(` = 1 výskyt (socket.ts:20) |
| FES-02 URL=VITE_API_URL, withCredentials | ✅L1 | socket.ts:6,22 |
| FES-03 W-8 transport fix | ✅L1 | socket.ts:30 `['polling', 'websocket']` + komentář |
| FES-04 JWT freshness (useSocketInit na [token]) | ✅L1 | useSocket.ts:15-21 |
| FES-05 disconnectSocket na logout | ✅L1 | useSocket.ts:16-19 |
| FES-06 reconnectSocket() paralelní socket | ✅L1 | socket.ts:58-61 |
| FES-07..10 useSocketEvent správný cb lifecycle | ✅L2 | useSocket.ts:68-88 |
| FES-11 syrové on/off symetrie | ✅L1 | všechny useEffect mají cleanup |
| FES-12 W-7 useActiveScenes re-join | ✅L2 | useActiveScenes.ts:76-78 |
| FES-13 vícenásobné socket.on('connect') aditivní | ✅L1 | Socket.IO aditivní |
| FES-15 socketStatusAtom single source | ✅L1 | socket.ts:34-36 |
| FES-16 toast guard wasConnected | ✅L1 | useSocket.ts:24-34 |

---

## PROOF-REQUEST

**PR-09-1:** Spustit browser test (nebo ruční proměření): načíst svět → přejít Profil → Soukromí → přepnout Neviditelný mód → vrátit do chatu světa → ověřit, že zprávy v reálném čase stále chodí. Bez opravy by chatroom byl po `reconnectSocket()` hluchý.

**PR-09-2:** Ruční test heartbeatu po `reconnectSocket()`: otevřít DevTools Network → WS frame → přepnout Neviditelný mód → čekat 5 min → ověřit, že nový socket odesílá `chat:heartbeat` (ne jen starý, který je disconnected).

**PR-09-3:** Simulovat `connect_error` (zastavit BE) → ověřit, že uživatel mimo taktickou mapu (např. na dashboardu) dostane vizuální feedback.

---

## Závěr

Oblast 09 prošla hloubkovou statickou kontrolou (L1-L2). Původní nálezy W-7/W-8/W-9 jsou v kódu opraveny. Tři nové nálezy (W-RUN-01/02/03) — všechny ♻️ (dřívější ⚠️ v plánu, nyní konkrétněji doloženy staticky). Nejzávažnější je W-RUN-01 (`reconnectSocket` nespustí re-join callbacky) — plošný dopad na ~12 useSocketReconnect call sites, funkčně ekvivalentní původnímu W-7 v úzkém scénáři (hiddenPresence toggle).
