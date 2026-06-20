# ws / 06-worlds-universe — checkpoint RUN-2026-06-20-1621

Datum: 2026-06-20

## Pokrytí

Prošel jsem HEAD kód (ke dni auditu):

**BE:**
- `backend/src/modules/worlds/worlds.gateway.ts` — všechny handlery (8 @OnEvent)
- `backend/src/modules/worlds/worlds.gateway.spec.ts` — stávající testy (5)
- `backend/src/modules/universe/universe.gateway.ts` — 1 handler
- `backend/src/modules/worlds/worlds.service.ts` — všechna `eventEmitter.emit('world.*')` volání
- `backend/src/modules/world-news/world-news.service.ts` — emity `world-news.changed`
- `backend/src/modules/worlds/repositories/worlds.repository.ts` — `toEntity` whitelist
- `backend/src/modules/worlds/interfaces/world.interface.ts` + `world-membership.interface.ts`
- `backend/src/gateways/app.gateway.ts` — `room:join` / `room:leave` handler

**FE:**
- `src/features/world/hooks/useWorldSocket.ts` + `.spec.tsx`
- `src/features/world/hooks/useWorldAccessSocket.ts` + `.spec.tsx`
- `src/features/world/universe/hooks/useUniverseSocket.ts` + `.spec.tsx`
- `src/features/world/tactical-map/hooks/useMapWeather.ts` + test
- `src/app/layout/WorldLayout/WorldLayout.tsx` + `.spec.tsx`

**Ověřeny všechny body WRLD-01..18 z plánu oblasti.**

## Dosažená L vs cílová L

| Oblast | Cíl | Dosaženo | Pozn. |
|---|---|---|---|
| W-9 oprava (useWorldSocket) | L3 | **L3** | test existuje, handler ověřen |
| world:updated payload (World obj) | L2 | **L2** | toEntity whitelist + LK posouzeno |
| world:membership:changed payload leak | L2 | **L2** | nový nález W-RUN-01 |
| world:news:changed (C-04) | L2 | **L2** | leak-safe signál ověřen |
| universe:updated (WRLD-15) | L3 | **L3** | 6 vitest testů pokrývá handler + edit suspend |
| WRLD-13 (worldSlug u rejected) | L2 | **L2** | FE nečte worldSlug u rejected |
| WRLD-17 (edit suspend) | L3 | **L3** | suspended ref + 2 testy (S-RUN-03) |
| useUniverseSocket re-join | L3 | **L3** | socket.on('connect') + test |
| Room conflict (useUniverseSocket + useMapWeather leave) | L1 | **L1** | nový nález W-RUN-02 |
| universe.gateway.spec | L3 | **L1** | spec stále neexistuje |
| worlds.gateway.spec — membership/news | L3 | **L1** | chybí testy |

## Nálezy

### W-RUN-01 — [LK] `world:membership:changed` broadcastuje plný WorldMembership do `world:{id}` všem členům 🟡

- **Kde:** `worlds.gateway.ts:66-68` + `worlds.service.ts:620,795,1305`
- **Popis:** BE emituje plný `WorldMembership` objekt (s poli `chatColor`, `chatFont`, `themeAdjust`, `themeUserOverrides`, `chatGroupOrder`, `chatChannelOrder`, `chatPinnedOrder`, `chatLastActiveChannelId`, `jailedDiceSkins`, `currentSceneId`, `akj`) do `world:{id}` roomu. Dostanou ho VŠICHNI přihlášení členové světa. FE payload ignoruje (jen invaliduje query), ale data jsou viditelná v devtools / WS frame zachyceném nástrojem / MITM proxy.
- **Dopad:** Per-user soukromá nastavení (chat font, barva, pořadí kanálů, výtažky) jednoho člena jsou viditelná ostatním členům světa. Zejména `jailedDiceSkins` a `akj` (AKJ level) jsou interní data. Nízká závažnost (nelze zneužít bez devtools), ale porušuje principy nejmenšího přístupu.
- **Návrh:** Emitovat leak-safe signál `{ worldId, membershipId }` místo plného objektu (vzor universe:updated / chat:channel:created fix W-4). FE stejně jen invaliduje a refetchne filtrovaný `GET /worlds/:id/members`. Alternativa: strip privátních polí v gateway před emitem.
- **L1** 🆕

---

### W-RUN-02 — [RM LC] `useUniverseSocket` + `useMapWeather` emitují `room:leave world:{id}` při unmount → WorldLayout oslepne 🟠

- **Kde:** `useUniverseSocket.ts:59` + `useMapWeather.ts:88` — `socket.emit('room:leave', room)` v cleanup
- **Popis:** `useWorldSocket` (WorldLayout) joinne `world:{id}` jednou při mountu a drží join po celou dobu existence světa. `useUniverseSocket` (Universe stránka) a `useMapWeather` (Taktická mapa) joinují tentýž room a **opouštějí ho při unmount** (navigate pryč ze stránky). Socket.IO `room:leave` je single call — odebere socket z roomu bez ohledu na počet joinů. Výsledek: po odchodu z Universe/Mapy socket opustí `world:{id}`, `useWorldSocket` to nedetekuje a `world:updated` / `world:membership:changed` / `world:news:changed` přestávají dorazit — dokud nenastane reconnect nebo přechod do jiného světa.
- **Dopad:** Dashboard a Members přestanou být real-time (opravený W-9) kdykoli uživatel předtím navštívil Universe nebo Taktickou mapu. Regrese opravy W-9.
- **Návrh (3 varianty):**
  1. `useUniverseSocket` + `useMapWeather` opustí `room:leave` — spolehnout se na `useWorldSocket` jako jediného vlastníka; cleanup roomu přebere WorldLayout unmount.
  2. Reference-counting wrapper pro `world:{id}` room (joinů+, leaveů—; leave jen při 0).
  3. `useWorldSocket` naslouchá vlastnímu `room:leave` eventu a ihned re-joinuje (kruchý).
  Doporučeno: varianta 1 — useUniverseSocket a useMapWeather smaží `room:leave world:` z cleanup (ale ponechají `room:leave` chat/map scena roomů kde jsou výlučnými vlastníky).
- **L1** 🆕

---

### W-RUN-03 — [EX] `universe.gateway.ts` nemá spec; `worlds.gateway.spec.ts` nepokrývá `world:membership:*` ani `world:news:changed` 🟡

- **Kde:** `backend/src/modules/universe/` (žádný `*.gateway.spec.ts`); `worlds.gateway.spec.ts` testuje jen `world:updated` + 4 access eventy
- **Popis:** Plán oblasti identifikoval tyto test-coverage gapy (test-coverage sekce). Stav kódu je shodný — `universe.gateway.spec.ts` stále neexistuje; spec `worlds.gateway` nepokrývá `handleMembershipChanged`, `handleMembershipRemoved`, `handleWorldNewsChanged`.
- **Dopad:** Leak-safe vlastnost `universe:updated` (WRLD-15 — signál `{ worldId }` bez map dat) není chráněna regresním testem. Kdokoli přidá do emitu data, test neodhalí. Membership a news emity taktéž nekryté.
- **Návrh:** Doplnit `universe.gateway.spec.ts` (ověřit, že emit nese jen `{ worldId }`, ne map data); rozšířit `worlds.gateway.spec.ts` o `handleMembershipChanged`, `handleMembershipRemoved`, `handleWorldNewsChanged`.
- **L1** 🆕

## Ověřené OK (bez nálezů)

| Bod | Status | L |
|---|---|---|
| W-9 oprava — useWorldSocket v WorldLayout, room join + reconnect | ✅ | L3 |
| WRLD-10 `world:access-requested` → owner room, payload parita | ✅ | L3 |
| WRLD-11 `world:access-approved/rejected` → requester room | ✅ | L3 |
| WRLD-12 `world:access-cancelled` → owner room | ✅ | L3 |
| WRLD-13 `world:access-rejected` nemá `worldSlug`, FE nečte | ✅ | L2 |
| WRLD-14 `useWorldAccessSocket` globálně v IkarosLayout, user:{id} nezávislé | ✅ | L3 |
| WRLD-15 `universe:updated` = leak-safe signál `{ worldId }` bez map dat | ✅ | L2 |
| WRLD-16 `useUniverseSocket` reconnect re-join (socket.on connect) | ✅ | L3 |
| WRLD-17 `useUniverseSocket` edit mód suspend — neinvaliduje, jen staleFromRemote | ✅ | L3 |
| WRLD-18 `universe:updated` do world:{id} bez membership gate = leak-safe (jen signál) | ✅ | L1 |
| `world:news:changed` = leak-safe signál `{ worldId }`, FE invaliduje world-news query | ✅ | L2 |
| `world:updated` payload (World interface) neobsahuje per-user citlivá pole | ✅ | L2 |
| `useWorldAccessSocket` reconnect refetch (S-RUN-01) — test existuje | ✅ | L3 |

## PROOF-REQUEST

**PR-06-A:** W-RUN-02 (room conflict) — vyžaduje živé ověření: otevřít svět, přejít na Universe, vrátit se na Dashboard, zkontrolovat v devtools WS frame zda `world:updated` stále chodí. Statická analýza L1; live test by doložil L3. Bez infry neověřitelné.

**PR-06-B:** W-RUN-01 (membership payload v devtools) — vyžaduje zachycení WS frame při změně role člena. Ověří, že `chatGroupOrder` apod. je viditelné ostatním členům. Statická analýza L1; pro L3 potřeba live WS trace.
