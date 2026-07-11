# ws / 04-presence-online — checkpoint RUN-2026-07-11-1213

Datum: 2026-07-11. Auditor: plný-audit READ-ONLY agent. Styl: WS contract (prefix `W-`).
Registr: `docs/ws-audit.md`. Plán: `docs/ws-contract-plan/04-presence-online.md`.

---

## Pokrytí (HEAD)

**BE:**
- `backend/src/modules/presence/presence.gateway.ts` — celý (nyní vč. W-11 per-socket idle + W-RUN-01 hiddenPresence)
- `backend/src/modules/presence/presence.gateway.spec.ts` — celý (11 testů: 7 base + W-11 + 4 hiddenPresence)
- `backend/src/modules/presence/presence.service.ts` — celý (REST lastSeen threshold, mimo WS)

**FE:**
- `src/shared/presence/usePresence.ts` — celý (nyní přes `useSocketEvent`, FIX-2)
- `src/shared/presence/store.ts`, `OnlineDot.tsx` — celé
- `src/features/chat/api/useSocket.ts` — `useSocketEvent`/`useSocketReconnect` (socketStatusAtom vzor)
- `src/features/chat/api/socket.ts` — `reconnectSocket`/`disconnectSocket`/`getSocket`
- `src/features/profile/components/PrivacySection.tsx` — hiddenPresence toggle → `reconnectSocket()`

---

## Verifikace předchozích nálezů (RUN-2026-06-20-1621) — vše dořešeno

| ID | Minulý stav | Stav na HEAD | Doklad |
|----|-------------|--------------|--------|
| **W-11** (multi-tab idle) | ✅ opraveno | ✅ potvrzeno + test | `presence.gateway.ts:29-32,138-155` per-socket idle; `spec:115-144` zelený test |
| **W-RUN-01** (hiddenPresence ignorován v gateway) | 🆕 🟠 | ✅ OPRAVENO + 4 testy | `presence.gateway.ts:38,57-64,72-73,82-83,104-106,144-145` (findById→hiddenUsers, snapshot filtr, no-broadcast); `spec:146-203` |
| **W-RUN-02** (usePresenceInit nesleduje socketStatusAtom) | 🆕 🟠 | ✅ OPRAVENO | `usePresence.ts:34-48` přešlo na `useSocketEvent` (FIX-2 komentář `:27-33`) |
| **W-RUN-04** (snapshot bez hiddenPresence filtru) | ♻️ 🟡 | ✅ hiddenPresence část opravena; zbytek by-design | `presence.gateway.ts:72-73` filtr `!this.hiddenUsers.has(uid)`; plošný online seznam = PRES-14 by-design |

## Známé, stále otevřené (NEhlásit jako nové)

| ID | Osa | Stav na HEAD | Pozn. |
|----|-----|--------------|-------|
| **W-RUN-03** | TEST | ♻️ přetrvává | Chybí test „předposlední socket disconnect → žádný offline". `spec` má „poslední socket → offline" (`:104`) a multi-tab idle (`:115`), ale ne guard `set.size===0` na disconnectu. Guard v kódu je (`gateway.ts:99`), jen bez regresní pojistky. |
| **W-RUN-05** | LC | ♻️ přetrvává (⚪) | Idle tracker `usePresence.ts:54-99` má `useEffect([])` bez socketStatusAtom → po `reconnectSocket()` nový socket nedostane `presence:idle`, i když byl user idle; BE ho vidí online do dalšího `tick()` (30 s) / aktivity. Kosmetika (idle tečka). |

---

## NOVÝ nález

### W-RUN-06 — [LK/LC] Zapnutí „Neviditelného módu" při 2+ tabech/zařízeních retroaktivně NEskryje už odvysílaný online 🆕

- **Kde:** `presence.gateway.ts:66-88` (handleConnection větev `wasOffline=false`) + `:91-111` (handleDisconnect větev `set.size>0`) ; trigger `PrivacySection.tsx:26-29` → `socket.ts:62-65` `reconnectSocket()` (per-tab).
- **Trasování (user má tab A + tab B, oba viditelní online):**
  1. Tab A přepne `hiddenPresence=ON` → `reconnectSocket()` **jen v tabu A**.
  2. `disconnectSocket()` → BE `handleDisconnect(tabA)`: `set.delete(tabA.id)`, `set.size===1` (tab B žije) → **else větev, žádný `presence:update offline`** (`gateway.ts:107-110`).
  3. Tab A reconnect → `handleConnection`: `hidden=true` → `hiddenUsers.add(userId)` (`:63`), ale `wasOffline=!sockets.has(userId)=false` (tab B v mapě) → **else větev `recomputeIdle`, žádný online ani offline broadcast** (`:84-88`).
  - **Výsledek:** ostatní klienti drží PŮVODNÍ zelenou tečku (z prvního online broadcastu). `hiddenUsers` sice potlačí BUDOUCÍ idle/online přechody, ale AKTUÁLNÍ „online" u ostatních zůstane, dokud user nezavře VŠECHNY taby/zařízení. Deklarovaná privacy funkce („Skryje tvůj online stav") v multi-tab tiše selže.
  - **Zrcadlo:** vypnutí neviditelnosti při druhém otevřeném tabu → taky žádný `online` broadcast → ostatní tě uvidí online až po reconnectu/dalším přechodu.
- **Root cause:** hiddenPresence se aplikuje jen změnou broadcast-flagu na příštích přechodech, ne jednorázovým offline/online pushem v okamžiku toggle. Single-tab funguje jen náhodou (tam disconnect = poslední socket → offline broadcast `:105-106`).
- **Osa:** `LK` (privacy leak) `LC` (lifecycle/toggle).
- **Dopad:** 🟡 nízká — vyžaduje 2 souběžné session; jde o kosmetickou tečku, ALE je to celý účel privacy přepínače (popis v `PrivacySection.tsx:59-63` slibuje funkčnost). Ne WS-drift, korektnostní mezera zavedená opravou W-RUN-01.
- **Návrh:** v `handleConnection` když `hidden && !wasOffline` → `client.broadcast.emit('presence:update', {userId, status:'offline'})`; symetricky když `!hidden && !wasOffline && byl skrytý` → broadcast `online`. (Nebo dedikovaný `presence:visibility` event z FE místo plného reconnectu.)
- **Úroveň:** L2 (statické trasování obou stran kontraktu, cesta jasná; bez testu = ne L3).
- 🆕

---

## Drobná pozorování (ne-W, k uvážení)

- **Per-connection DB `findById`** (`gateway.ts:58`): handleConnection presence teď dělá awaited DB read na KAŽDÉ (re)connect socketu (sdílený single-socket → fires u všech klientů). Při reconnect-storm (restart BE, 50 hráčů v jeskyni) = burst N indexovaných findById. Levné, ale nová DB závislost ve WS hot-path — hlídat proti SLO. Fail-safe try/catch OK (`:57-62`).
- **Payload parita:** BE `presence:snapshot {entries:[{userId,status}]}` / `presence:update {userId,status}` ↔ FE `usePresence.ts:7-12,34-48` sedí; enum `online|idle|offline` konzistentní. Bez driftu.

---

## Dosažená L vs cíl

| Oblast | Cíl plánu | Dosaženo HEAD |
|--------|-----------|---------------|
| A. Snapshot/update parita | ✅L2 | L2 ✅ |
| B. Idle/active multi-tab (W-11) | ✅ (opraveno) | L3 ✅ (test) |
| C. Disconnect/offline | ✅L2 | L2 ✅ (negativní case untested → W-RUN-03) |
| D. Reconnect & OnlineDot + hiddenPresence | ⚠️ smíšené | L2 + W-RUN-06 🆕 |

## PROOF-REQUEST (nedosažené L3+)

- **PR-04-1:** `npx jest --testPathPattern presence.gateway --maxWorkers=2` → čekáno 11/11 zelených (7 base + W-11 + 4 hiddenPresence).
- **PR-04-2:** round-trip test pro W-RUN-06 — 2 sockety téhož usera, toggle hidden na jednom (re-handleConnection s hiddenPresence=true, wasOffline=false) → ověřit, že ostatní dostanou offline (červený na HEAD, zelený po fixu).
