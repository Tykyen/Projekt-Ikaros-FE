# 04 — Presence & OnlineDot (PresenceGateway)

Globální online/idle/offline tečka (header avatar, UserCard, profil). N-5 doplnil `PresenceGateway` (in-memory registry, JWT povinný). Tady ověřujeme **správnost** — hlavně snapshot payload, multi-tab agregaci a reconnect obnovu. Pozor: dřív byla tahle vrstva **mrtvá** (tečka nikdy nesvítila online), takže „funguje" musí být doloženo na L3+, ne odhadem.

**BE:** `modules/presence/presence.gateway.ts`, `presence.service.ts`
**FE:** `shared/presence/usePresence.ts` (`usePresenceInit`), `OnlineDot.tsx`

---

## A. Snapshot & update — payload parita

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| PRES-01 | `handleConnection` (JWT povinný) → emit `presence:snapshot` **jen tomu klientovi** (ne broadcast) se seznamem online uživatelů. Ověřit payload tvar: FE `usePresence:44` čeká `{ entries: { userId, status }[] }` — sedí to s tím, co BE posílá? `[auto]` | `PL` | M2 | ✅L2 |
| PRES-02 | `presence:update { userId, status }` broadcast při změně. **Status hodnoty:** ověřit shodu enumu mezi BE (`'online'`/`'idle'`/`'offline'`) a FE konzumací (`usePresence:45`) — žádná hodnota, kterou FE nezná → tečka v neznámém stavu `[auto]` | `PL` | M2 | ✅L2 |
| PRES-03 | `presence:snapshot` obsahuje **jen online/idle** uživatele (offline se neposílají — absence = offline). Ověřit, že FE interpretuje chybějícího uživatele jako offline (default), ne jako „neznámý" `[auto]` | `PL` | M1 | ✅L1 |
| PRES-04 | Snapshot vs update konzistence: uživatel v snapshotu jako `online`, pak `presence:update idle` — FE Map správně přepíše (ne přidá duplicitní záznam) `[auto]` | `PL` `LC` | M3 | ✅L1 |

> **Výsledek A:** Snapshot payload **sedí** — BE `client.emit('presence:snapshot', { entries: [{userId, status}] })` ([presence.gateway.ts:41-45](../../../Projekt-ikaros/backend/src/modules/presence/presence.gateway.ts#L41)) ↔ FE `usePresence:44` čte `{ entries }`. Snapshot jen tomu klientovi (ne broadcast), status enum `'online'/'idle'/'offline'` konzistentní. FE Map `.set(userId, status)` přepisuje.

---

## B. Idle / active

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| PRES-05 | FE `usePresence` emituje `presence:idle` po 5 min nečinnosti (`:64`) a při skryté kartě (`:72`); `presence:active` při návratu (`:56`). BE `presence:idle` → `presence:update {status:'idle'}` broadcast. Round-trip parita `[auto]` | `PL` | M3 | ✅L2 |
| PRES-06 | **Multi-tab idle agregace 🔴:** uživatel má 2 taby, jeden jde idle, druhý je aktivní. Ověřit, že BE NEvyhlásí uživatele idle, dokud nejsou **všechny** jeho sockety idle (jinak aktivní uživatel bliká offline/idle). Doložit logiku `idle` setu + multi-socket mapy `[auto]` | `LC` | M3 | 🐛 W-11 |
| PRES-07 | `presence:active` z jednoho tabu musí přebít idle stav uživatele globálně (návrat k aktivitě v kterémkoli tabu = online) `[auto]` | `LC` | M3 | ⚠️ W-11 |
| PRES-08 | Idle timer na FE — ověřit, že se resetuje na reálnou aktivitu (mousemove/keydown/visibility), ne jen na timer; a že se nehromadí víc timerů (memory leak při re-renderu hooku) `[auto]` | `LC` | M1 | ✅L1 |

> **Výsledek B — NÁLEZ W-11 (nízká):** BE `idle` je **per-userId flag** ([presence.gateway.ts:24,71](../../../Projekt-ikaros/backend/src/modules/presence/presence.gateway.ts#L24)), ne agregace socketů. FE `markActive` pošle `presence:active` **jen při přechodu z idle** ([usePresence.ts:52-58](../../src/shared/presence/usePresence.ts#L52)). → Tab A zahálí → označí celého usera idle; tab B (aktivní, nikdy idle) `active` nepošle → uživatel se jeví idle při práci v B. Kosmetické (presence tečka). FE idle timer reset na mousemove/visibility ✅, cleanup OK.

---

## C. Disconnect / offline

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| PRES-09 | `handleDisconnect` odebere socket; broadcast `presence:update offline` **jen pokud to byl poslední socket** uživatele. Předposlední socket → žádný offline (multi-tab). Pokrytí N-5 testem (7×) — ověřit, že tenhle case je mezi nimi `[auto]` | `LC` | M3 | ✅L2 |
| PRES-10 | Po offline broadcastu FE odebere uživatele z Map → `OnlineDot` zšedne. Ověřit, že FE na `offline` status reaguje (ne jen na absenci v snapshotu) `[auto]` | `PL` | M1 | ✅L1 |

> **Výsledek C:** Disconnect ✅ — `set.size === 0` guard ([presence.gateway.ts:60-64](../../../Projekt-ikaros/backend/src/modules/presence/presence.gateway.ts#L60)) broadcastne offline jen u posledního socketu (multi-tab safe). FE `onUpdate` `offline` → `next.delete(userId)`.

---

## D. Reconnect & OnlineDot konzumace

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| PRES-11 | Po reconnectu `handleConnection` znovu pošle `presence:snapshot` → FE re-naplní Map. Ověřit, že FE snapshot **nahradí** (ne mergne se stale daty z minulého spojení) `[auto]` | `LC` `PL` | M3 | ✅L2 |
| PRES-12 | `OnlineDot` (header, UserCard, profil) čte výhradně z presence atomu (Map). **Žádný REST fallback** (N-5). Ověřit, že když WS spadne, tečka degraduje rozumně (zšedne/zmizí), ne zamrzne na stale „online" `[auto]` | `LC` | M1 | ⚠️ |
| PRES-13 | Hidden-presence (D-052) — uživatel s vypnutou viditelností: ověřit, že se **neobjeví** v `presence:snapshot` ostatním a `reconnectSocket()` po toggle korektně přepne stav `[auto]` | `LK` | M2 | ⚠️ |
| PRES-14 | `presence:snapshot` velikost: posílá **všechny** online uživatele platformy každému klientovi. Ověřit, zda to není leak (vidím, kdo je online, i bez vztahu) — porovnat se záměrem (D-052 hidden presence to částečně řeší) `[auto]` | `LK` | M4 | ⚠️ |

> **Výsledek D:** Reconnect snapshot ✅ (handleConnection běží znovu, FE re-naplní Map). PRES-12 (degradace OnlineDot při WS výpadku — žádný offline broadcast nedorazí, Map drží stale „online"), PRES-13 (hidden-presence ve snapshotu), PRES-14 (plošný seznam online = privacy úvaha) = `⚠️` k doložení při fázi oprav — žádné z nich není WS-vrstvový drift, jsou to návrhové/privacy otázky.

---

## Test coverage gaps

- `presence.gateway.spec.ts` (7 testů, N-5) — ověřit, zda pokrývá **multi-tab idle agregaci** (PRES-06) a **předposlední socket** (PRES-09). To jsou nejtrickier cesty.
- **FE `usePresence` nemá žádný test** — idle tracker, snapshot merge, reconnect re-naplnění. Gap-fill M7: mock socket → snapshot → update → ověřit Map stav.

## Známá rizika (předběžná)

- **PRES-06 (multi-tab idle):** klasický presence bug — pokud BE vyhlásí idle při idle jednoho socketu, aktivní uživatel se ostatním jeví jako nepřítomný. Ověřit agregaci napříč sockety, ne per-socket.
- **PRES-12 (žádný REST fallback):** OnlineDot je čistě WS. Při ztrátě spojení (než doběhne reconnect) může tečka držet stale stav. N-5 řešil „nikdy nesvítí"; teď hlídáme opačný extrém „svítí, i když nemá".
- **PRES-14 (snapshot leak):** plošný seznam online — potenciální privacy úvaha, ne nutně bug. Doložit záměr vs D-052.
