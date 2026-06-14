# 06 — WebSocket errors (`WS`)

> **Otázka:** mají WS chyby **jednotný tvar** napříč gateway, a **zpracuje je FE** socket vrstva, nebo se
> tiše ztratí?

## Povrch
- BE gateway (mimo HTTP filtr — jiný context):
  - `app.gateway.ts:28,41,54` — `return { error: 'string' }` (ack návratová hodnota).
  - `maps.gateway.ts:110` — `client.emit('error', { code, message })`.
  - další gateway: chat, presence, world-chat, universe — ověřit tvar.
  - **0× `WsException`** (recon) — žádný WS exception filtr.
- FE: `features/chat/api/socket.ts:33` — `connect_error` → status atom; **`error` event handler?** ověřit napříč FE socket konzumenty.

## Kontrolní body
- [ ] **Tvar parita** — `return {error:string}` (app) vs `emit('error',{code,message})` (maps) — 2 různé mechanismy (ack return vs server-push emit) i 2 různé tvary (string vs objekt). Sjednotit na `{error:{code,message}}`?
- [ ] **Timestamp** — WS chyby nemají `timestamp` (HTTP #1 má). Sjednotit?
- [ ] **FE zpracování ack** — když gateway `return {error}`, FE callback to čte? Grep FE `emit(... , (ack) =>)`. Pokud FE emituje bez ack callbacku → chyba se ztratí. **K-EC5.**
- [ ] **FE `error` event** — má FE `socket.on('error', …)` → toast? Recon: ne. Tichá ztráta server-push chyb.
- [ ] **WsException konvence** — zavést WS exception filtr (`@Catch(WsException)`) + jednotný emit? Doporučený fix. Cross-ref [ws-contract audit].

## Metoda
M1 (čtení gateway + FE socket) → L2. Cross-ref [ws-contract-plan] + paměť `project_ws_security_patterns`. WS e2e (socket.io-client) volitelně — `WS` na L2 + cross-ref stačí.

## Seed
`K-EC5` (2 tvary, FE neřeší 🟠).
