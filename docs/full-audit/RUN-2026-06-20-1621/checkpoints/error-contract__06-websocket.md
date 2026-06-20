# error-contract / 06-websocket — checkpoint RUN-2026-06-20-1621

## Pokrytí

Prošel jsem **celý WS povrch** obou repo na HEAD (2026-06-20):
- BE: všech **15 gateway souborů** (app, base, maps, chat, presence, worlds, universe, ikaros-messages, ikaros-events, ikaros-news, emotes, friendships, bestiae, users-identity, character-accounts)
- FE: `socket.ts` (getSocket/globální listenery), `useMapSocket.ts`, `useWorldSocket.ts`, `useUniverseSocket.ts`, `ChatRoom.tsx`, `ChannelView.tsx`, `WorldChatRoom.tsx`, `useMapWeather.ts`
- Scanner errors.txt: `emit('error') ×8 · return{error} ×3` — ověřeno HEAD, čísla souhlasí
- Registr EC-06 + F5 oprava ověřeny v kódu

## Dosažená L vs cílová L

| Osa | Cíl | Dosaženo | Metoda |
|---|---|---|---|
| `WS` — emit('error') tvar | L2 | **L2** ✅ | M1 čtení (8 výskytů maps.gateway, tvar `{code,message}` konzistentní) |
| `WS` — return{error} tvar | L2 | **L2** ✅ | M1 čtení (3 výskyty app.gateway, tvar `{error:'string'}`) |
| `WS` — FE `error` listener | L2 | **L2** ✅ | M1 čtení (socket.ts:40 globální + useMapSocket:98 per-map) |
| `WS` — ack zpracování | L2 | **L2** | M1 čtení — FE nepoužívá ack callback → ztráta |
| `WS` — tvar sjednocení | L2 | **L2** | Stav: 2 tvary stále existují (ack `{error:string}` vs emit `{code,message}`) |
| `WS` — timestamp | L2 | **L2** | Žádný timestamp v žádném gateway |
| WS e2e | L4 | ❌ blokováno infrastrukturou | PROOF-REQUEST |

## Nálezy

### EC-RUN-01 `WS` — ack `{error:'string'}` z app.gateway FE nikdy nepřečte — zůstal po F5 · L2 · ♻️

`app.gateway.ts:28,41,54` vrací `return { error: 'Neplatný formát roomy' / 'Nedostatečná oprávnění' }` jako ack odpověď na `room:join` / `room:leave`. FE emituje všude bez ack callbacku:
- `useWorldSocket.ts:34` — `socket.emit('room:join', world:${worldId})`
- `ChatRoom.tsx:265,290` — `socket.emit('room:join', chat:${channelId})`
- `ChannelView.tsx:237,260` — `socket.emit('room:join', chat:${channelId})`
- `useUniverseSocket.ts:43,45` — `socket.emit('room:join', room)`
- `useMapWeather.ts:82,84` — `socket.emit('room:join', room)`

Kde: `backend/src/gateways/app.gateway.ts:28,41,54` · `src/features/world/hooks/useWorldSocket.ts:34`

F5 oprava (socket.ts:40) přidala globální `socket.on('error')` — ale to chytá **server-push `emit('error')`** (8× maps.gateway), nikoliv **ack return hodnoty**. Ack tvar z app.gateway (`{error:'string'}`) se ke klientovi dostane jen pokud FE předá callback, a to se neděje. Tichá ztráta přetrvává pro: neplatný formát roomy, nedostatečná oprávnění při chat:join.

Dopad: když BE odmítne `room:join` (neplatný formát nebo unauthorized chat kanál — R-04 gate), uživatel dostane prázdnou místnost bez chyby. Dosažitelnost: `chat:` prefix s nevalidním channelId spustí R-04 gate a vrátí ack error.

Návrh: přidat ack callback na místech kde FE emituje `room:join` a očekává BE gatování, nebo přepnout app.gateway na `client.emit('error', {code,message})` server-push stejně jako maps.gateway (F5 by pak pokryl i tuto cestu globálním listenerem). · L2 · ♻️ (EC-06 byl "opravena server-push strana, ack strana zůstala")

---

### EC-RUN-02 `WS` — 2 tvary stále existují — `{error:string}` vs `{code,message}` — zůstal po F5 · L2 · ♻️

Registr EC-06 uvádí, že F5 "sjednocuje WS tvar hloubka → cross-ref ws-contract". HEAD ale ukazuje:
- `app.gateway.ts` — ack return: `{ error: 'string literal' }` (prostý string, žádný code)
- `maps.gateway.ts` — emit: `{ code: 'ENUM_CODE', message: 'CS text' }` (strukturovaný)

Tvar `{error:'string'}` neobsahuje doménový `code` (přestanou fungovat budoucí FE switche na konkrétní kódy), nemá `timestamp` (na rozdíl od HTTP tvarů), a je sémanticky odlišný od maps.gateway tvaru.

Kde: `backend/src/gateways/app.gateway.ts:28,41,54` vs `backend/src/modules/maps/maps.gateway.ts:66,77,90,...`

Dopad: FE by musel rozlišovat dva tvary u `socket.on('error')` handlerů — pokud přečte `payload.code`, u ack tvaru dostane `undefined`. U mapy to nevadí (maps vždy posílá `{code,message}`), ale při budoucím přidání `socket.on('error')` handleru pro `room:join` chyby by se muselo pamatovat na odlišný tvar. · L2 · ♻️ (dílčí regrese/nedokonalost F5)

---

### EC-RUN-03 `WS` — chat.gateway nemá žádné `emit('error')` ani ack error na `chat:channel:join` · L2 · 🆕

`chat.gateway.ts:94` handleChannelJoin: když `userId === undefined` (neautentizovaný socket), funkce jen `return` — bez jakéhokoli error signálu klientovi. Klient (ChatRoom.tsx) posílá `chat:channel:join` a neví, že selhal. Presence se nenastaví, ale žádná zpětná vazba.

Kde: `backend/src/modules/chat/chat.gateway.ts:94`

Dopad: nízký (neautentizovaný socket v chatu = edge case; selžou i REST dotazy na zprávy). Bez UX dopadu pro normálního uživatele. · L2 · 🆕 · 🟡

---

## Pozitiva (ověřeno HEAD)

- ✅ **F5 globální listener** `socket.ts:40` — `socket.on('error')` chytí všech 8 `emit('error')` z maps.gateway; `console.error` loguje, useMapSocket navíc toast
- ✅ **maps.gateway tvar konzistentní** — všech 8 `emit('error')` = `{code:string, message:string}`, žádný outlier
- ✅ **maps.gateway CS texty** — všechny chybové hlášky česky
- ✅ **žádný nový gateway od 2026-06-14** — 15 gateway souborů, žádný přibyl mimo plán
- ✅ **chat.gateway bez error emitů** — tolerantní design (neautentizovaný = tiché odmítnutí bez server-push error), konzistentní vzor s ws-security (N-9/W-3)
- ✅ **presence/worlds/universe/ikaros-*/emotes/friendships/bestiae/accounts gateways** — žádné error emity (jen `@OnEvent` relay), bez problémů

## PROOF-REQUEST

`PR-WS-01` — **WS e2e tvar probe (L4)**: socket.io-client test emitující `room:join` s neplatným channelId → ověřit, že ack payload je `{error:'string'}` (ne `{code,message}`) a že FE ack callback chybí → měří dosažitelnost EC-RUN-01. Infrastruktura: socket.io-client je v devDeps, seed-scenario harness existuje (`npm run test:e2e`), ale socket.io-client integrační test pro app.gateway zatím není. Blokováno živou WS infrastrukturou.

`PR-WS-02` — **FE ack callback absence** (L5): vitest/jsdom mock socket.io — ověřit, že `socket.emit('room:join', ...)` volání v useWorldSocket/ChatRoom/ChannelView **neobsahují třetí argument** (ack callback). Staticky ověřeno L2 (grep nenašel nic), ale formální L5 důkaz = instrumentovaný test.
