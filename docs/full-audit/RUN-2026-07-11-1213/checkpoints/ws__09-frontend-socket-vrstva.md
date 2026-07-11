# Checkpoint — ws styl / oblast 09 FE socket vrstva

Plán: `docs/ws-contract-plan/09-frontend-socket-vrstva.md` · Registr: `docs/ws-audit.md` (prefix `W-`)
READ-ONLY audit, HEAD `main`. Zaměřeno na ověření N-TM-01 (jiný agent) + celý FE socket L1-L3.

## TL;DR

- **#🆕: 1** (`W-12`, formalizuje FES-14) + 1 sekundární (heartbeat stale-socket).
- **🔴/⭐: žádné.** N-TM-01 je REÁLNÝ code-level gap, ale **LATENTNÍ (nízká)** — severity „mapa oslepne po neviditelnosti/loginu" je **nadhodnocená** (viz níže).
- Nejzávažnější: `useMapSocket` = poslední direct-`socket.on` hook, který se NEpřeregistruje po `reconnectSocket()` instance-swapu (na rozdíl od všech sourozenců migrovaných na status-watch).

---

## W-12 (♻️ formalizuje FES-14) — direct-`socket.on` listenery nepřežijí `reconnectSocket()` instance-swap ⚠️ (nízká / latentní robustnost)

### Podstata (ověření N-TM-01)
`reconnectSocket()` NEreconnectuje stávající socket — **zahodí instanci a vytvoří novou**:

```ts
// socket.ts:62-65
export function reconnectSocket(): void {
  disconnectSocket();   // socket?.disconnect(); socket = null; status='disconnected'
  getSocket();          // io(...) → NOVÁ instance; status 'connecting'→'connected'
}
```

`useMapSocket` registruje join i všechny listenery přes **přímý `socket.on`** v useEffektech, jejichž deps **NEobsahují `socketStatusAtom`**:

```ts
// useMapSocket.ts:72-81  map:join
useEffect(() => { if (!sceneId) return; const socket = getSocket();
  socket.emit("map:join", sceneId);
  return () => { socket.emit("map:leave", sceneId); };
}, [sceneId]);

// useMapSocket.ts:87-97  connect re-join (VLASTNÍ, ne useSocketReconnect)
useEffect(() => { const socket = getSocket();
  const handler = () => { if (sceneId) socket.emit("map:join", sceneId); onReconnect?.(); };
  socket.on("connect", handler);
  return () => { socket.off("connect", handler); };
}, [sceneId, onReconnect]);

// useMapSocket.ts:114-175  listenery map:operation/reassigned/spotlight/pinged/rulered
//   deps [onOperation] / [onReassigned] / … — status NENÍ v deps
// useMapSocket.ts:102-111  error — deps []
```

Po `reconnectSocket()` (status `connected`→`disconnected`→`connected`) se tyto effekty **NEspustí znovu** (jejich deps se nezměnily), takže `map:join`, `connect` handler i **všechny** listenery zůstanou navázané na **starém odpojeném** socketu. Nová instance nemá ani join do scene roomu, ani jediný listener → mapa je hluchá (operace, reassign, spotlight, ping, ruler, error).

### Kontrast — proč je to inconsistency, ne by-design
Všichni sourozenci byli VĚDOMĚ migrováni na status-watch (přesně kvůli tomuto):

- `useSocketEvent` — `const status = useAtomValue(socketStatusAtom)` v deps `[event, status]` ([useSocket.ts:88,99](../../../src/features/chat/api/useSocket.ts#L88)).
- `useSocketReconnect` — `[status]` v deps, komentář **S-RUN-04** cituje `reconnectSocket()` jako důvod ([useSocket.ts:61-75](../../../src/features/chat/api/useSocket.ts#L61)) + test `useSocket.spec.ts:61-73` „přeregistruje connect handler při změně socket stavu".
- `usePresence` — **FIX-2** migrace na `useSocketEvent` + emit přes čerstvý `getSocket()` ([usePresence.ts:27-33,53-63](../../../src/shared/presence/usePresence.ts#L27)), komentář explicitně: „po `reconnectSocket()` (toggle Neviditelný) vznikla nová instance, staré listenery zůstaly viset na mrtvém socketu a presence zamrzla do reloadu".
- `useActiveScenes` / `useMapWeather` / `useWeatherWsSubscribe` — re-join přes `useSocketReconnect` (status-watch).

`useMapSocket` je **jediný**, kdo zůstal na direct-`socket.on` s vlastním `connect` handlerem BEZ status-watche → poslední holdout vzoru, který projekt jinde všude opravil. To potvrzuje N-TM-01 na úrovni kódu a odpovídá FES-14 (plán oblasti ho už označil `⚠️` „latentní křehkost, maskováno remountem").

### Proč přesto NÍZKÁ, ne 🔴 (korekce severity N-TM-01)
`reconnectSocket()` má **jen 2 spouštěče** a ani jeden nezasáhne mountnutou mapu:

1. **Login / TOTP / Register** — `useAuth.ts:58,85,112`. Uživatel je před tím neautentizovaný → world/mapa (auth-only routy) NEJSOU mountnuté.
2. **Toggle „Neviditelný mód"** — `PrivacySection.tsx:26-29`. Přepínač je **výhradně** na profilové stránce (grep `hiddenPresence`/`togglePresence` → jen `ProfilePage.tsx` + `PrivacySection.tsx`; žádný in-world quick-toggle). Profil je top-level routa → celý `WorldLayout` + mapa se **odmountují**, po návratu **remount na aktuální** socket.

→ V obou případech mapa v době swapu neexistuje a remountuje se čistá. **Aktuálně žádný reálný trigger.** Bije se to jen jako **booby-trap do budoucna**: kdokoli přidá `reconnectSocket()` trigger dosažitelný při mountnuté mapě (in-world rychlý toggle neviditelnosti, reconnect po refresh tokenu, account-switch bez změny routy) → mapa tiše ohluchne bez chyby.

### Osa / klasifikace
- Osa: `LC` (lifecycle / re-register po instance-swapu).
- Klasifikace: **♻️** — re-surface FES-14 (plán oblasti, `⚠️`) + nezávislé znovuobjevení N-TM-01. V registru `ws-audit.md` (TL;DR „HOTOVO, 11 nálezů") formálně NEbylo → doporučeno zapsat jako `W-12`.
- Úroveň jistoty: **L2** (staticky ověřen kontrakt deps napříč všemi 6 hooky; bez round-trip testu).

### Návrh (neopravovat tiše — čeká souhlas)
Sjednotit `useMapSocket` s projektovým vzorem — buď listenery přes `useSocketEvent`, nebo přidat `socketStatusAtom` do deps registračních effektů; `connect` re-join nahradit `useSocketReconnect`. Šířeji zvážit i sourozence, kteří mají re-join přes `useSocketReconnect`, ale LISTENER pořád jako direct `socket.on` bez status-watche (viz níže).

---

## Sekundární pozorování (v mezích oblasti, nižší než W-12)

### (a) Direct-listener orphan i u dalších hooků — stejná třída, částečně maskováno
Re-JOIN byl migrován na `useSocketReconnect` (status-watch), ale samotný **LISTENER** zůstal direct `socket.on` bez status v deps → po instance-swapu orphan:

- `useActiveScenes.ts:53-72` — `world:operation` listener deps `[worldId, enabled, queryClient]`. Re-join OK ([:76-78](../../../src/features/world/tactical-map/hooks/useActiveScenes.ts#L76)), ale listener na mrtvé instanci.
- `useUniverseSocket.ts:44-63,66-83` — `connect`-refetch i `universe:updated` listener deps `[worldId, queryClient]`. Room join drží `useWorldSocket`, ale listener orphan → universe mapa hluchá po swapu.
- `useMapWeather.ts:92-114` — `weather:updated` listener deps `[worldId, queryClient]`; maskováno `useSocketReconnect` refetchem ([:86-89](../../../src/features/world/tactical-map/hooks/useMapWeather.ts#L86)) — dorovná stav i s mrtvým listenerem.

Stejná reachability jako W-12 (world routy, swap = profil/login je unmountuje) → latentní. Patří do stejné opravy „direct listener → status-watch".

### (b) `usePresenceHeartbeat` emituje na zachycený (starý) socket — FES-17-adjacent
```ts
// usePresenceHeartbeat.ts:15-20
useEffect(() => { if (!enabled) return;
  const socket = getSocket();                         // zachyceno JEDNOU (deps [enabled])
  const id = setInterval(() => socket.emit('chat:heartbeat'), HEARTBEAT_MS);
  return () => clearInterval(id);                      // interval cleanup OK (FES-17 leak = OK)
}, [enabled]);
```
Interval se čistí korektně (FES-17 leak vyvrácen). ALE hook běží **globálně v layoutu**, který login **NEodmountuje** (mění se jen auth stav). Guest→member login → `reconnectSocket()` → heartbeat dál `emit` na **mrtvý guest socket**; členská chat-presence nedostane heartbeat → BE po 60 min odebere z místností. Fix = `getSocket().emit(...)` čerstvě při každém tiku (stejný důvod jako `usePresence.ts:53`). Nízká (60min grace + remount maskuje), ale reálnější reachability než W-12.

---

## Ověřeno OK (drží se registru)

- **W-8 vyřešeno:** `socket.ts:34` `transports: ['polling', 'websocket']` (polling-first, proxy-friendly) — odpovídá `ws-audit.md` W-8 ✅.
- **FES-01/05/06:** singleton `getSocket()` recykluje instanci, nová jen po `disconnectSocket()` (nuluje `socket`) → login/logout swap čistý ([socket.ts:11-56](../../../src/features/chat/api/socket.ts#L11)).
- **FES-07/08/10 (vzorné):** `useSocketEvent` — `cb=(d)=>handlerRef.current(d)` stabilní, cleanup `off(event, cb)` s konkrétní referencí, re-register na `[event, status]`.
- **FES-16:** toast-guard `wasConnected.current` — „Spojení obnoveno" se na úvodním connectu nezobrazí ([useSocket.ts:28-38](../../../src/features/chat/api/useSocket.ts#L28)).
- **W-7 (reg.) drží:** world chat / `useActiveScenes` re-join přes `useSocketReconnect` (status-watch), test `useSocket.spec.ts` zelený dle inventury.
- **Globální `error` záchyt** `socket.ts:44-46` (EC-06) — server-push error se neztratí.

## Test coverage gap (potvrzeno z plánu)
- `useMapSocket` re-register po instance-swapu **netestován** (na rozdíl od `useSocket.spec.ts` pro `useSocketReconnect`). Gap-fill při fázi oprav W-12: mock socket → status disconnected→connected → ověřit re-attach `map:join` + listenerů na novou instanci.
