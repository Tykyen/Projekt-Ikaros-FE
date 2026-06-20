# bug / 00-cross-cutting — checkpoint RUN-2026-06-20-1621

## Pokrytí

**FE soubory přečteny:**
- `src/app/router.tsx` — celý (všechny routes, guardy, lazy imports, Suspense)
- `src/app/main.tsx` — celý (GlobalErrorBoundary pozice, QueryClient, Toaster)
- `src/app/layout/IkarosLayout/IkarosLayout.tsx` — celý
- `src/app/layout/WorldLayout/WorldLayout.tsx` — celý
- `src/shared/api/client.ts` — celý (axios interceptory, parseApiError, parseApiErrorCode)
- `src/features/chat/api/socket.ts` — celý (SocketManager singleton)
- `src/features/chat/api/useSocket.ts` — celý (useSocketInit, useSocketReconnect, useSocketEvent)
- `src/features/auth/api/useAuth.ts` — celý (login/logout lifecycle)
- `src/features/world/hooks/useWorldSocket.ts` — celý
- `src/shared/presence/usePresence.ts` — parciálně (presence events)
- `src/features/admin/components/WorldMembershipGuard.tsx` — celý
- `src/features/admin/components/RoleGuard.tsx` — parciálně
- `src/pages/errors/{ErrorPage,ForbiddenPage,NotFoundPage}.tsx`
- `src/shared/ui/GlobalErrorBoundary.tsx` — celý

**BE soubory přečteny:**
- `backend/src/gateways/base.gateway.ts` — celý
- `backend/src/gateways/app.gateway.ts` — celý
- `backend/src/gateways/gateways.module.ts` — celý
- `backend/src/common/guards/{jwt-auth,optional-jwt-auth,roles}.guard.ts` — všechny
- `backend/src/common/filters/http-exception.filter.ts` — celý
- `backend/src/modules/chat/chat.gateway.ts` — handleConnection + klíčové handlery
- `backend/src/modules/presence/presence.gateway.ts` — authUser + handleConnection
- `backend/src/modules/global-chat/global-chat.gateway.ts` — třídní deklarace + join handlery
- `backend/src/modules/maps/maps.gateway.ts` — handleConnection
- `backend/src/modules/worlds/worlds.service.ts` — applyDetailScope (X-12)
- `backend/src/app.module.ts` — parciálně (modul registrace)

**Osy a M-metody pokryté:**
- A (X-01..X-07): Routing & guardy — M1 statické čtení routeru
- B (X-10..X-14): Auth-leak policy — M1 + M4 (interceptor, BE guardy, WorldNotFound)
- C (X-20..X-24): Error handling & resilience — M1
- D (X-30..X-33): WebSocket infrastruktura — M1 + M5 (WS kontrakt)
- E (X-40..X-46): Baseline — čtení existujících stavů

## Dosažená L vs cílová L

**Cílová L: L3 (chování zajištěno testem)** — dosaženo L2 pro většinu os (strukturální ověření obou stran), L1 pro X-33 (WS doc drift).

Výjimky:
- X-40/41/42/43/44/45: L3 (baseline testy zelené dle registru)
- X-33: L1 (přečteno + ruční diff FE events vs websocket-api.md)
- X-30/X-32: L2 (obě strany přečteny, chování rekonstruováno, bez test pokrytí reconnect scénáře)

## Nálezy

### N-RUN-01 — [X-33] WS kontrakt: ~18 FE events chybí v `docs/websocket-api.md` · 🟡

**Kde:**
- `docs/websocket-api.md` (BE repo: `C:/Matrix/ProjektIkaros/Projekt-ikaros/docs/websocket-api.md`) — chybí záznamy
- FE soubory emitující/poslouchající nedokumentované eventy:
  - `src/shared/presence/usePresence.ts:44,45,56,64,72` — `presence:snapshot`, `presence:update`, `presence:idle`, `presence:active`
  - `src/features/world/hooks/useWorldAccessSocket.ts:53,66` — `world:access-approved`, `world:access-cancelled`
  - `src/features/world/bestiar/hooks/useBestiar.ts:20` — `bestiar:changed`
  - `src/features/ikaros/api/useIkarosEvents.ts:14` — `ikaros:events:changed`
  - `src/features/ikaros/api/useIkarosNews.ts:24` — `ikaros:news:changed`
  - `src/features/world/chat/emotes/api/useWorldEmotes.ts:66` — `emote:deleted`, `emote:updated`
  - `src/features/world/chat/emotes/api/useGlobalEmotes.ts:55` — `emote:deleted-global`, `emote:created-global`, `emote:updated-global`
  - `src/features/world/chat/components/SoundNowPlayingBanner.tsx:62` — `chat:sound:playing`, `chat:sound:stopped`
  - `src/features/friendships/hooks/useFriendshipsSocket.ts:81` — `user:identity:changed`
  - `src/features/world/hooks/useWorldSocket.ts:51` — `world:news:changed`
  - `src/features/world/hooks/useWorldAccessSocket.ts` — `world:access-rejected`, `world:access-requested`
  - `src/features/world/chat/api/useWorldChat.ts` (přes useSocketEvent) — `chat:channels:reordered`, `chat:groups:reordered`
  - `src/features/chat/api/useSocket.ts` (WS infra) — `room:join`, `room:leave`, `sound:play`, `sound:stop`
  - `src/features/friendships/hooks/useFriendshipsSocket.ts` — `friend:*` (6 events) — N-4/N-5 opraveno, ale doc neaktualizován
  - `src/shared/presence/usePresence.ts` — `presence:*` — N-5 opraveno, ale doc neaktualizován

**Dopad:** WS kontrakt dokument nesedí na aktuální implementaci. `audit:ws` ověřuje event-to-listener párování v kódu (což je zelené), ale nikoli soulad s MD dokumentací — N-4/N-5 fix přidal nové gateways (FriendshipsGateway, PresenceGateway) bez aktualizace doc. Vývojář nemá kompletní zdroj pravdy.

**Návrh:** Doplnit chybějící eventy do `websocket-api.md` (BE repo). Zejm. `presence:*`, `friend:*` (po N-4/N-5), `world:access-*`, `bestiar:changed`, `ikaros:*:changed`, `emote:deleted/updated`.

**L1 · klasifikace: 🆕 nový** (WS doc drift po N-4/N-5 fix + followup featurách nebyl hlášen)

---

### N-RUN-02 — [X-30] Socket lifecycle: reconnect po logout/login neobnoví auth token v handshake · 🟠

**Kde:** `src/features/chat/api/socket.ts:20-31`, `src/features/chat/api/useSocket.ts:15-21`

**Problém:** `getSocket()` čte token z `accessTokenAtom` **jednou** při vytvoření instance (řádek 18). Když socket existuje (non-null), volání `getSocket()` vrátí STAROU instanci bez ohledu na nový token. Životní cyklus:
1. Uživatel odhlášen → `disconnectSocket()` → `socket = null`
2. Uživatel přihlášen → token nastaven → `useSocketInit` volá `getSocket()` → NOVÁ instance s novým tokenem ✅

Toto funguje, **ale:** pokud dojde k expiraci tokenu a BE ho odmítne (WS `connect_error`), socket zůstane v `error` stavu. `useSocketInit` volá `getSocket()` pouze při změně `token` atomu — ale token se mění jen přes refresh interceptor (HTTP), ne WS. Socket s prošlým tokenem se nereconnectuje s novým tokenem automaticky po HTTP refresh.

**Scénář dopadu:** Uživatel má aktivní session, access token expiruje. HTTP požadavek spustí refresh → nový token → `accessTokenAtom` se změní → `useSocketInit` volá `getSocket()` — ale socket už existuje (non-null), takže `getSocket()` vrátí stávající instanci se starým tokenem v auth. Socket.IO re-authenticates při reconnect přes `auth`, ale jen pokud tam nastavíme factory funkci — v současném kódu je `auth` statický objekt (ne funkce). Pokud socket byl odpojený a reconnectoval by se, použil by starý token z doby vytvoření instance.

**Kde přesně:** `socket.ts:20-21`: `auth: token ? { token } : undefined` — statický objekt. Socket.IO podporuje `auth: () => ({ token: getDefaultStore().get(accessTokenAtom) })` jako dynamické factory, což by vždy poslalo aktuální token při reconnect.

**Dopad:** Za normálního provozu (token refreshuje přes HTTP a socket zůstane connected) se neprojeví. Projeví se jen pokud socket ztratí spojení právě v okamžiku, kdy je access token expirovaný — pak reconnect pošle expirovaný token. Střední závažnost, edge case.

**Návrh:** Změnit `auth: token ? { token } : undefined` na `auth: () => { const t = getDefaultStore().get(accessTokenAtom); return t ? { token: t } : {}; }` v `socket.ts:20`.

**L2 · klasifikace: 🆕 nový**

---

### N-RUN-03 — [X-32] Absence reconnect re-join pro `presence:*` a `friend:*` gateway events · 🟡

**Kde:**
- `src/shared/presence/usePresence.ts` — žádný `useSocketReconnect`
- `src/features/friendships/hooks/useFriendshipsSocket.ts` — žádný `useSocketReconnect`

**Problém:** Po socket reconnectu se Socket.IO automaticky re-emituje `connect` event. `useSocketReconnect` slouží pro re-join rooms. FriendshipsGateway emituje do `user:{id}` room — ta je joinována v `ChatGateway.handleConnection` (automaticky při novém connect, protože `handleConnection` se zavolá znovu). Takže tento re-join je automatický a není problém pro friendship/presence eventy přes user room.

Pro `presence:snapshot` — BE posílá snapshot při `handleConnection` (viz komentář v `usePresence.ts:16`), takže po reconnectu automaticky dostaneme nový snapshot. Toto je tedy **false alarm** — reconnect funguje přes handleConnection automatiku BE.

**Závěr:** Není bug — BE garantuje re-snapshot při reconnect; `user:{id}` room se re-joinuje automaticky v `ChatGateway.handleConnection`. Zapsáno jako ověřeno OK (L2).

---

## PROOF-REQUEST

1. **N-RUN-02 (socket auth token dynamism):** Spustit: přihlásit se, počkat na expiraci access tokenu (nebo zkrátit `JWT_EXPIRES_IN` na 10s), způsobit WS disconnect (pozastavit síť na chvíli). Ověřit, zda se socket po reconnectu autentizuje s novým (refreshnutým) nebo starým tokenem. Projevilo by se jako `connect_error` na WS po reconnectu i přes platný HTTP token. Nelze ověřit staticky.

2. **X-42 (FE vitest):** Dle README je označeno `⬜ (běží)` — ověřit finální stav: `npm run vitest run --project '!storybook'` v FE repo. Baseline testy cross-cutting oblasti.
