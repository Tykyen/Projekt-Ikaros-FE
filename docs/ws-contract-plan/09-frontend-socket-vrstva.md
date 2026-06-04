# 09 — FE socket vrstva (singleton, useSocketEvent, reconnect)

Cross-cutting infrastruktura, na které stojí **všech 8 předchozích oblastí**. Jedna singleton instance, generický `useSocketEvent` wrapper, status atom, reconnect/re-join. Chyba tady = plošný výpadek napříč celou app, ne jen jedna feature.

**FE:** `features/chat/api/socket.ts` (singleton + `reconnectSocket`/`disconnectSocket`), `features/chat/api/useSocket.ts` (`useSocketInit`, `useSocketEvent`), `features/chat/api/usePresenceHeartbeat.ts`

---

## A. Singleton & inicializace

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| FES-01 | `getSocket()` vrací jednu sdílenou instanci (dedup `let socket = null`). Ověřit, že žádná feature si nevytváří vlastní `io()` (grep na `io(` mimo socket.ts = 0) — jinak duplicitní spojení, duplicitní eventy `[auto]` | `EX` `LC` | M1 | ✅L1 |
| FES-02 | URL = `VITE_API_URL ?? localhost:3000`. Ověřit, že v produkci míří na správný BE (ne hardcoded localhost) a že `withCredentials: true` umožní cookie-auth fallback k `auth.token` `[auto]` | `AU` | M1 | ✅L1 |
| FES-03 | **`transports: ['websocket']` only 🔴** — žádný polling fallback. Za striktní proxy/firewallem bez WS upgrade se socket **nikdy** nepřipojí a celá real-time vrstva tiše nefunguje. Ověřit, zda je to vědomé rozhodnutí, nebo má být `['websocket', 'polling']` `[auto]` | `LC` | M1 | ⚠️ W-8 |
| FES-04 | JWT token freshness: po loginu / refresh tokenu se socket re-inituje s novým tokenem. Ověřit, že `useSocketInit` reaguje na změnu auth stavu (logout → `disconnectSocket`, login → nový socket) `[auto]` | `AU` `LC` | M3 | ✅L1 |
| FES-05 | `disconnectSocket()` na logout vynuluje instanci → další `getSocket()` vytvoří čistou. Ověřit, že po logoutu nezůstane zombie socket s předchozí identitou doručující eventy do `user:{starýId}` `[auto]` | `AU` `LC` | M3 | ✅L1 |
| FES-06 | `reconnectSocket()` (D-052) force-disconnect + nový socket po změně hidden-presence. Ověřit, že nevytvoří dva paralelní sockety (starý se reálně zavře před novým) `[auto]` | `LC` | M1 | ✅L1 |

> **Výsledek A:** Singleton OK — `useSocketInit` ([useSocket.ts:10-21](../../src/features/chat/api/useSocket.ts#L10)) řídí lifecycle dle `accessTokenAtom` (logout → `disconnectSocket`). **W-8 (nízká):** `transports: ['websocket']` bez polling fallbacku — za striktní proxy/firewallem se socket nepřipojí a real-time tiše nefunguje (žádná chyba v UI). Buď vědomé (moderní/mobilní cíl), nebo doplnit `'polling'`.

---

## B. `useSocketEvent` — generický wrapper

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| FES-07 | `useSocketEvent(event, cb)` registruje `socket.on`, cleanup `socket.off(event, cb)` na unmount. Ověřit, že předává **přesně tu samou** referenci cb do on i off (jinak off neodregistruje → leak listenerů) `[auto]` | `LC` `EX` | M1 | ✅L2 |
| FES-08 | **Re-register na socket swap:** `useSocketEvent` re-registruje na změnu `socketStatusAtom`. Po reconnectu (nový socket objekt) se listenery musí navázat na **nový** socket, ne zůstat na starém (zombie). Ověřit dependency na atom v useEffect `[auto]` | `LC` | M3 | ✅L2 |
| FES-09 | **Dva handlery téhož eventu:** `ikaros:new-message` (useMail + useEvents), `map:reassigned` (useMapSocket + useReassignmentListener), `weather:updated` (2×). Ověřit, že `useSocketEvent` **nepřepisuje** předchozí handler stejného eventu — Socket.IO `.on` je aditivní, ale ověřit, že wrapper nedělá `.off(event)` bez cb (což by shodil i cizí handler) `[auto]` | `EX` `LC` | M3 | ✅L2 |
| FES-10 | Cleanup při re-renderu: změna cb reference (nestabilní closure) → re-register každý render? Ověřit memoizaci cb / dependency, aby se listenery nezdvojovaly při běžném renderu `[auto]` | `LC` | M1 | ✅L2 |

> **Výsledek B (vzorné):** `useSocketEvent` ([useSocket.ts:43-64](../../src/features/chat/api/useSocket.ts#L43)) je správně navržený — `cb = (data) => handlerRef.current(data)` je **stabilní** (deps `[event, status]`, ne `handler`), cleanup `socket.off(event, cb)` s **konkrétní** referencí (ne plošný `off(event)`). → dvojí handler téhož eventu funguje (aditivní `.on`, každý cleanup odebere jen svůj), re-render nezdvojuje (handler se mění přes `handlerRef`), re-register na socket swap obnoví na nový socket.

---

## C. Syrové `socket.on` mimo wrapper (map hooky)

> 6 míst používá **přímý `socket.on`** místo `useSocketEvent` (performance-sensitive map hooky): `useMapSocket` (map:operation/reassigned/spotlight/pinged/connect), `useActiveScenes` (world:operation), `useUniverseSocket` (universe:updated), `useMapWeather` (weather:updated). Ty **obcházejí** automatický re-register.

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| FES-11 | Každý syrový `socket.on` má odpovídající `socket.off` v cleanup useEffectu (se stejnou cb referencí). Projít všech 6 souborů — chybějící off = leak listenerů přes navigace `[auto]` | `LC` | M1 | ✅L1 |
| FES-12 | Syrové `socket.on` re-register po reconnectu: `useMapSocket`, `useUniverseSocket`, `useMapWeather` mají vlastní `socket.on('connect')` re-join. **Ale `useActiveScenes` (world:operation) re-join NEMÁ v inventuře** → po reconnectu PJ orchestrátor přestane dostávat member operace? Doložit `[auto]` | `LC` `RM` | M1 | 🐛 W-7 |
| FES-13 | `socket.on('connect')` registrovaný ve více hoocích (useMapSocket:83, useMapWeather:86, useUniverseSocket:47) + globálně (socket.ts:28). Ověřit, že se navzájem nepřepisují (aditivní `.on`) a každý re-joinne svůj room `[auto]` | `LC` | M1 | ✅L1 |
| FES-14 | Direct `socket.on` listenery se NEpřeregistrují na `socketStatusAtom` (to dělá jen `useSocketEvent`). Po `disconnectSocket()` + nový socket (login/D-052) zůstanou navázané na **starém** socketu → mrtvé. Ověřit, zda map hooky tento případ řeší (remount při změně scény to možná maskuje) `[auto]` | `LC` | M3 | ⚠️ |

> **Výsledek C:** Potvrzeno: `useActiveScenes` ([:56](../../src/features/world/tactical-map/hooks/useActiveScenes.ts#L56)) emituje `map:join-world` **bez** `socket.on('connect')` re-join → **třetí oběť W-7** (PJ orchestrátor scén po reconnectu oslepne). `useUniverseSocket` re-join **má** ([:44-47](../../src/features/world/universe/hooks/useUniverseSocket.ts#L44)). FES-14: direct listenery se po `disconnectSocket()` swapu nepřeváží — map hooky to maskují remountem při změně scény, ale je to latentní křehkost (`⚠️`).

---

## D. Status & UX

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| FES-15 | `socketStatusAtom`: `connect`→`connected`, `disconnect`→`disconnected`, `connect_error`→`error` (socket.ts:28–30). Ověřit, že atom je single source of truth a UI indikátor spojení z něj čte `[auto]` | `EX` | M1 | ✅L1 |
| FES-16 | `useSocketInit` toasty „Ztratilo se spojení" / „Spojení obnoveno" — neukazovat „obnoveno" při úvodním connectu (jen po reálném disconnect→connect cyklu). Ověřit guard na předchozí stav `[human]` | `LC` | M1 | ✅L1 |
| FES-17 | `usePresenceHeartbeat` (á 5 min `chat:heartbeat`) — interval se čistí na unmount (žádný leaknutý `setInterval` po odhlášení) `[auto]` | `LC` | M1 | ⚠️ |
| FES-18 | `connect_error` (např. neplatný token, BE down) — ověřit, že FE neretrymuje donekonečna agresivně (DoS na vlastní BE) a že error stav je viditelný, ne tichý `[auto]` | `LC` | M1 | ⚠️ |

> **Výsledek D:** `useSocketInit` toast guard přes `wasConnected.current` ([useSocket.ts:24-34](../../src/features/chat/api/useSocket.ts#L24)) — „obnoveno" se na úvodním connectu nezobrazí (ref se nastaví až po kontrole). FES-17/18 (`heartbeat` interval cleanup, `connect_error` reconnection-backoff) = `⚠️` neověřeno do hloubky, spoléhá na Socket.IO default reconnection — k potvrzení při fázi oprav.

---

## Test coverage gaps

- **`useSocketEvent` nemá test** — přitom je to nejkritičtější FE WS primitiv (re-register, dvojí handler, cleanup). Gap-fill M7: mock socket → mount/unmount → ověřit on/off symetrii a re-register na status změnu.
- Reconnect re-join (FES-12/13/14) napříč hooky netestováno — nejrizikovější třída (oslepnutí po výpadku).
- `disconnectSocket` na logout (FES-05) — zombie socket s předchozí identitou netestován.

## Známá rizika (předběžná)

- **FES-03 (websocket-only transport):** bez polling fallbacku je real-time za některými sítěmi nefunkční bez jakékoli chyby v UI. Buď vědomé (mobilní/moderní cíl), nebo skrytá nedostupnost pro část uživatelů.
- **FES-12/14 (direct socket.on + reconnect):** map hooky obcházejí re-register wrapperu. `useActiveScenes` možná nemá reconnect re-join → PJ orchestrátor oslepne po výpadku. A žádný direct listener se nepřeváže po `disconnectSocket()` swapu, pokud se hook neremountuje.
- **FES-09 (dvojí handler):** tři eventy mají po dvou handlerech. Celá tahle architektura stojí na aditivitě `.on` a na tom, že wrapper nikdy nedělá `.off(event)` bez konkrétní cb. Jediné porušení shodí cizí feature.
- **CONN-17 souvislost:** world chat (`room:join world/chat`) re-join po reconnectu chybí — to je FE-vrstva problém, finálně se řeší tady i v oblasti 01.
