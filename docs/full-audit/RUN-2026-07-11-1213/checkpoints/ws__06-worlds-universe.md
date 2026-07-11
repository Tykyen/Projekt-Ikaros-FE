# Checkpoint — WS oblast 06 Světy & univerzum (RUN-2026-07-11-1213)

READ-ONLY re-audit oblasti `docs/ws-contract-plan/06-worlds-universe.md` proti HEAD.
Prefix nálezů `W-`. Osy `RM` `LK` `PL` `EX` `LC`. Klasifikace 🆕/♻️/🔓.

## TL;DR

**Bez nových závažných nálezů. Oblast je ZDRAVĚJŠÍ než text oblasti 06** (ten je psaný před fixem).
Hloubka dosažena **L2** (kontrakt: názvy + payload klíče + room + leak-safety ověřeny staticky), kritické cesty mají i **L3** (`useWorldSocket.spec`, `WorldLayout.spec`, `useUniverseSocket.spec`).

- W-9 opraveno a potvrzeno na HEAD (viz níže) → text oblasti 06 (tabulky WRLD-01/02/03/05/06/07 se statusem 🐛 W-9) je zastaralý.
- Pozdější audit R-RUN-01 / W-RUN-01 (2026-06-20) už zeslabil broadcast payloady na leak-safe → **WRLD-08 (membership leak) vyřešeno, žádný 🔓**.
- 1 nový event `world:news:changed` (C-04) — v oblasti 06 vůbec není; obě strany OK.
- 1 drobný kandidát: `world.settings.updated` bez WS mostu (nízká).

## Ověřený stav proti kódu (HEAD)

### W-9 (WRLD-01/02/03/05/06/07) — ✅ OPRAVENO, potvrzeno
- FE listener EXISTUJE: `useWorldSocket.ts` poslouchá `world:updated`, `world:deleted`, `world:membership:changed`, `world:membership:removed` (+ `world:news:changed`).
  - `src/features/world/hooks/useWorldSocket.ts:45-76`
- Mount v jediném vlastníku roomu: `WorldLayout.tsx:292` `useWorldSocket(realWorldId || null)`; drží `room:join world:{id}` + reconnect re-join (`useWorldSocket.ts:31-42`).
- `world:deleted` vykopne: `useWorldSocket.ts:72-76` — toast + `navigate('/ikaros/vesmiry')` (guard `p.worldId !== worldId`). BE emit `{ worldId }` — `worlds.gateway.ts:47-49`. Parita OK.
- Konzistence room ownership: WorldChatRoom už vlastní `room:join/leave world:{id}` NEDĚLÁ (`WorldChatRoom.tsx:191-194`), universe hook taky ne (`useUniverseSocket.ts:44-63`, FIX-1) → žádný double-`room:leave` (nevykopne WorldLayout z roomu).

### Leak-safety (WRLD-08, WRLD-15) — 🔓 žádný, leak-safe napříč
Všechny broadcasty do `world:{id}` (room bez membership checku, N-8) nesou jen signál → i join bez membershipu nic citlivého nedostane:
- `world:updated` → `{ worldId }` (dřív celý `World`) — `worlds.gateway.ts:36-44` (komentář R-RUN-01/W-RUN-01, plný audit 2026-06-20).
- `world:membership:changed` → `{ worldId, membershipId }` (dřív celý `WorldMembership` s privátními poli chatColor/themeUserOverrides/jailedDiceSkins/akj/currentSceneId) — `worlds.gateway.ts:65-80`.
- `world:membership:removed` → holý `membershipId` string — `worlds.gateway.ts:82-87`. FE handler payload nečte (jen invaliduje) → WRLD-06 typový drift bezpředmětný.
- `world:news:changed` → `{ worldId }` — `worlds.gateway.ts:56-63`.
- `universe:updated` → `{ worldId }` (bez `map`) — `universe.gateway.ts:11-20`. Interní event nese `map`, emit ho zahazuje. Vzorné.

### Access eventy (WRLD-10..14) — ✅ L1/L2, směrování OK
- `useWorldAccessSocket.ts` (IkarosLayout, `user:{id}`) poslouchá 4 access eventy + reconnect refetch (S-RUN-01, `:74-79`).
- Směrování: requested→owner (`gateway:102-104`), approved/rejected→requester (`:119-121`/`:135-137`), cancelled→owner (`:150-152`). OK.
- **WRLD-13 (`worldSlug` u rejected) — VYŘEŠENO/doloženo:** BE `world.access.rejected` payload NEmá `worldSlug` (`gateway:129-134`); FE `AccessRejectedPayload` ho taky nedeklaruje ani nečte (`useWorldAccessSocket.ts:22-27,61-64`). Žádný `undefined`.

### Universe (WRLD-16/17/18) — ✅ L2
- WRLD-17 (edit-mode suspend) — **VYŘEŠENO** (v oblasti 06 byl ⚠️): `suspendedRef` → v edit módu jen `setStaleFromRemote(true)`, žádný refetch (`useUniverseSocket.ts:69-78`). Reconnect chování stejné (`:47-58`, S-RUN-03).
- WRLD-16 reconnect — refetch po reconnectu i mimo room ownership (room drží WorldLayout). OK.

## Nové (🆕)

### 🆕 `world:news:changed` (C-04) — zdravý pár, jen chybí v textu oblasti 06
- BE: `world-news.service.ts` emituje `world-news.changed` (6× create/update/delete/…), gateway most `worlds.gateway.ts:56-63` → `world:news:changed { worldId }` do `world:{id}`.
- FE: `useWorldSocket.ts:51-55` → invaliduje `['world-news', worldId]`.
- Parita názvu + payloadu OK, leak-safe. Globální novinka (`worldId === null`) se do žádného world roomu neemituje (`gateway:57-58`). **Bez nálezu**, jen doporučení doplnit do plánu oblasti 06.

### 🆕 kandidát W-RUN(06)-a — `world.settings.updated` bez WS mostu (nízká, `EX`/`RM`)
- `worlds.service.ts:1243` a `:1319` emitují `world.settings.updated { worldId, settings }`.
- WS most NEEXISTUJE — jediný `@OnEvent('world.settings.updated')` je interní `chat.service.ts:1993` (sync chat nastavení). Žádný gateway emit, FE nemá listener (`world:settings*` grep = 0).
- Důsledek: PJ změní nastavení světa (WorldSettings — theme override, viditelnost záložek…) → jiný PJ/člen to nevidí live, dokud nevyprší staleTime / manuální refetch. Stejná třída jako původní W-9, ale pro settings.
- Závažnost: **nízká** — nastavení nejsou akutní real-time; `world.updated` (dashboard) se emituje jen z updateWorld/rename (`:716/:760/:2184`), settings jdou mimo. Kandidát k rozhodnutí, ne blocker.

### `world.elevation.changed` — NENÍ gap
- `worlds.service.ts:385/403` (platform Admin self-elevace do světa). Handler `admin.service.ts:114` (interní audit). Je to vlastní akce elevujícího s REST odpovědí → žádná real-time potřeba, žádný WS pár nechybí.

## Regrese (♻️) — žádná
Registr (`ws-audit.md`) značí W-1..W-11 opraveno; HEAD potvrzuje fixy přítomné (useWorldSocket, leak-safe payloady, reconnect re-join, FIX-1 room ownership). Nic se nevrátilo.

## Závěr
Bez nových závažných nálezů; L2 (+L3 na kritických cestách). Jediný nový kandidát = nízká `world.settings.updated` bez WS. Text oblasti 06 doporučeno aktualizovat (W-9 hotovo, WRLD-08/13/17 vyřešeny, doplnit `world:news:changed`).
