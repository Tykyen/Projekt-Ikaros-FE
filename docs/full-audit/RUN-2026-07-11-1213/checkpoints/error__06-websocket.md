# error__06-websocket (WS) — checkpoint RUN-2026-07-11-1213

Oblast: `docs/error-contract-plan/06-websocket.md` · osa `WS` · registr `docs/error-contract-audit.md` (prefix EC-)
Hloubka dosažena: **L2** (statika gateway BE + FE socket vrstva). READ-ONLY. Cross-ref ws-contract audit, paměť `project_ws_security_patterns`.
Verdikt: **žádný 🔴, žádný ⭐**. EC-06 (2 tvary + tichá ztráta) je **částečně** opravený (F5 global listener), ale WS zůstává **jediná osa se dvěma reziduálními tvary** — hloubkové sjednocení je vědomě delegováno na ws-contract audit.

## Co ověřeno (L1/L2)
- **FE má globální `socket.on('error')`** (`chat/api/socket.ts:44`, F5) + druhý v taktické mapě (`useMapSocket.ts:107`). Server-push `error` eventy se už **tiše neztratí** na úrovni socketu.
- **maps.gateway** používá konzistentní tvar `client.emit('error', {code, message})` (8× — `maps.gateway.ts:69,80,93,113,138,176,277,356`), s doménovými kódy (`WS_UNAUTHORIZED`, `MAP_SCENE_NOT_FOUND`…). Mapa má vlastní toast handler.
- **0× `WsException`** v gateway — WS chyby mimo HTTP filtr (jiný context), řešeny ručně.

## Nálezy

### ♻️ EC-06 residual — dva WS tvary přetrvávají (ack `{error:string}` vs push `{code,message}`) — 🟠 L2
- `app.gateway.ts:28,41,51,64` → `return { error: 'string' }` (ack návratová hodnota, 4×) — CS text, **bez `code`, bez `timestamp`**.
- `maps.gateway.ts` (8×) → `emit('error',{code,message})` (server-push) — s kódem, bez `timestamp`.
Dva mechanismy (ack return vs emit) i dva tvary. Sjednocení na `{error:{code,message,timestamp}}` + WS exception konvence zůstává doporučený fix — **delegováno na ws-contract audit** (registr EC-06 to takto uzavřel; scan potvrzuje `emit('error')×8 · return{error}×4` beze změny). Neeskaluji nad registr.

### 🆕 WS/BD — globální FE `socket.on('error')` je jen `console.error`, žádný toast — 🟡 L1
`chat/api/socket.ts:44-46` server-push error jen zaloguje do konzole; **uživateli se nic neukáže** (kromě taktické mapy, která má vlastní toast). Tzn. F5 zabránil „tiché ztrátě" na úrovni odběru eventu, ale **ne** na úrovni UX — pro gateway mimo mapu je WS chyba pro uživatele stále neviditelná. Nízká priorita (WS chyby jsou vesměs edge/connect); observabilita, ne funkční průlom. Konzistentní s registrem („WS tvar hloubka → cross-ref ws-contract").

### ℹ️ app.gateway ack-error konzumace — FE musí emitovat s ack callbackem
`return {error}` z `room:join`/`room:leave` dorazí na FE jen když emit má ack callback (`socket.emit('room:join', room, (ack)=>…)`). Pokud FE volá bez callbacku, ack-chyba se zahodí (nezachytí ji ani globální `on('error')`, protože to není push event). Beze změny od registru (K-EC5); patří do ws-contract hloubky.

## Kontrolní body (06-websocket.md)
- [x] Tvar parita — stále 2 tvary (ack string vs push objekt) → ♻️ EC-06, delegováno ws-contract
- [x] Timestamp — WS chyby nemají `timestamp` (residual)
- [x] FE zpracování ack — app.gateway ack závisí na callbacku (ℹ️ výše)
- [x] FE `error` event — globální listener existuje (F5), ale console-only (🆕 🟡)
- [x] WsException konvence — 0× (doporučený fix, ws-contract)

Metoda: M1 (Read app/maps gateway + FE `socket.ts`/`useMapSocket.ts`) + grep WS tvarů, 2026-07-11. WS e2e (socket.io-client) nespuštěno (READ-ONLY, plán: L2+cross-ref stačí).
