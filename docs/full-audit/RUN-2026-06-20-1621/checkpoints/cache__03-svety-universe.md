# cache / 03-svety-universe — checkpoint RUN-2026-06-20-1621

> Auditor: claude-sonnet-4-6 · Datum: 2026-06-20 · Read-only.

## Pokrytí

Prošel jsem:
- `src/features/world/api/` — useWorlds, useWorldJoin, useWorldJoin.spec, useUpdateMember, useUpdateMember.spec, useUpdateMemberCharacter, useRemoveMember, useWorldMembers, useWorldSettings, useUpdateWorldSettings, useUpdateAkjTypes, useUpdateWorld, useTransferOwnership, useCreateWorld, useUpdateMyWorldTheme, useWorldNews + mutace, useWorldLifecycle (useDeleteWorld/useDeletedWorlds/useRestoreWorld), useMyAccessRequests, useWorldLifecycle.spec
- `src/features/world/hooks/` — useWorldSocket, useWorldSocket.spec, useWorldAccessSocket, useWorldAccessSocket.spec
- `src/features/world/universe/` — useUniverse, useUniverseSocket, useUniverseDraft
- `src/features/world/maps/api/` — useWorldMaps, useWorldMapFolders, useWorldMapMutations, useWorldMapFolderMutations (nová feature 13.4, post-sweep)
- BE: `backend/src/modules/world-maps/world-maps.service.ts` (EventEmitter2 — jen media.orphaned, žádný WS broadcast)
- git log pro dataci nových souborů

Celkem ~20 souborů, plná statická hloubka.

## Dosažená L vs cílová L

| Soubor / nález | Dosažená L | Cíl |
|---|---|---|
| C-01 fix (useWorldJoin → `['worlds']`) | L3 (test useWorldJoin.spec C-01) | L2+ |
| C-02 fix (approve → members) | L3 (test C-02 v useWorldJoin.spec) | L2+ |
| C-03 fix (useUpdateMember → `['worlds','my']`) | L3 (test C-03 v useUpdateMember.spec) | L2+ |
| C-04 fix (world:news:changed WS listener) | L2 (čteno; test worldNews.spec neověřuje invalidaci) | L2+ |
| K-C1 (by-design `['worlds']` prefix) | L2 (ověřeno element-by-element) | — |
| world-maps / world-map-folders (nové, 🆕) | L1 (čteno + BE potvrzeno bez WS) | — |
| useDeleteWorld DEL axis (latentní) | L1 (čteno + call-site flow) | — |
| useUniverseSocket (reconnect refetch) | L2 (čteno + S-RUN-03 komentář) | L2 |

Cíl L2+ pro fixnuté nálezy: **splněn** (L3 pro C-01/C-02/C-03, L2 pro C-04 WS handler).
Nové nálezy pod L2 → PROOF-REQUEST (M4 viz níže).

## Nálezy

### 🆕 C-RUN-01 · `WS`/`FO` · world-maps/world-map-folders: žádný WS push — cizí PJ vidí stale atlas

- **Kde:** `src/features/world/maps/api/useWorldMaps.ts:8` · `useWorldMapFolders.ts:8`
  + BE: `backend/src/modules/world-maps/world-maps.service.ts` (EventEmitter2 = jen `media.orphaned`)
- **Popis:** Feature 13.4 (přidána post-sweep; první commit `77568c2c`). Namespace `['world-maps', worldId]` a `['world-map-folders', worldId]` — 4 REST mutace na mapách + 3 na složkách, všechny s `onSuccess: invalidate(key(worldId))`. **Žádný WS gateway na BE ani žádný WS listener na FE.** Každý PJ/hráč vidí atlas v bublině — cizí přidání/smazání/změna viditelnosti mapy nebo složky se projeví až po 60s staleTime nebo F5.
- **Dopad:** PJ A přidá mapu → PJ B (otevřený atlas) ji 60s nevidí. PJ A změní viditelnost → hráč B drží stale (skrytá/viditelná mapa neodpovídá realitě). Při synchronní editaci dvou PJů = racing stale.
- **Trigger:** cizí CRUD (create/update/delete/reorder) mapa nebo složka.
- **Viditelnost:** tiše stale; uživatel neví, F5 opraví.
- **Workaround:** 60s / F5.
- **Závažnost:** 🟠 (analogický C-04 před opravou — REST invalidace mutátora funguje, pouze chybí real-time pro cizí změny; staleTime 60s tlumí; PJ-only feature).
- **Návrh:** vzor C-04 — BE `world-maps.service` emituje `world-maps.changed` → NestJS `@OnEvent` v novém/existujícím gateway → `world:maps:changed` do roomu `world:{worldId}` (signál bez dat); FE `useWorldSocket` (nebo dedikovaný hook v WorldMapsPage) přidá listener → `invalidate(['world-maps',worldId])` + `invalidate(['world-map-folders',worldId])`.
- **L1** · 🆕

---

### ♻️ C-RUN-02 · `DEL` · `useDeleteWorld`: `invalidate(['worlds'])` před navigate — potenciální 404 flash na world detailu

- **Kde:** `src/features/world/api/useWorldLifecycle.ts:18` (onSuccess) · `src/features/world/pages/WorldSettingsPage/tabs/DeleteWorldTab.tsx:55-59` (call-site: `mutateAsync` + `navigate`)
- **Popis:** `onSuccess` volá `invalidate(['worlds'])`, která prefix-matchuje aktivní `['worlds','id',worldId]` / `['worlds','slug',key]` detail query. Pokud je world detail query ještě mountovaná (např. tato stránka Settings je v layoutu světa), TanStack refetchne detail → BE vrátí 404 (svět soft-smazán) → error boundary / flash. `navigate('/')` probíhá v call-site, ale `onSuccess` se vykoná dřív — race (invalidate → refetch → 404 vs unmount z navigate).
- **Dopad:** pravděpodobně nezpůsobí viditelný crash (navigate unmountuje komponentu před HTTP odpovědí v 99%), ale edge-case za pomalé sítě může ukázat error boundary na zlomek vteřiny. WS `world:deleted` event poté také naviguje (duplicate navigate — harmless).
- **Trigger:** PJ vlastník smaže svůj svět.
- **Viditelnost:** téměř vždy skrytá (rychlý unmount), edge-case za pomalé sítě.
- **Workaround:** F5 nepotřeba — uživatel je navigován pryč.
- **Závažnost:** 🟡 (latentní; edge race; DEL best-practice by bylo `removeQueries(['worlds','id',worldId])` před navigate, ale real impact je minimální).
- **Návrh:** `qc.removeQueries({ queryKey: ['worlds', worldId] })` + `qc.removeQueries({ queryKey: ['worlds', 'id', worldId] })` + invalidate lists; alternativně navigate předem.
- **L1** · ♻️ (vzor P5 DEL axis z README; neinventarizováno v původním sweepu)

---

### ✅ Potvrzené opravy (Z-03-xx — ověřeno HEAD)

| Původní nález | Fix v kódu | Test L3 |
|---|---|---|
| C-01 join/approve netrefí world detail | `useWorldJoin.ts:17` `invalidate(['worlds'])` (broad) | `useWorldJoin.spec.tsx:26-36` ✅ |
| C-02 approve → jen pending-actions | `useWorldJoin.ts:70` přidán `invalidate(['worlds',worldId,'members'])` | `useWorldJoin.spec.tsx:42-52` ✅ |
| C-03 updateMember neobnoví my | `useUpdateMember.ts:38` přidán `invalidate(['worlds','my'])` | `useUpdateMember.spec.tsx:28-41` ✅ |
| C-04 world news bez WS push | `useWorldSocket.ts:51-55` listener `world:news:changed` → `invalidate(['world-news',worldId])` | L2 (bez dedikovaného invalidace-testu) |
| WS access reconnect (S-RUN-01) | `useWorldAccessSocket.ts:74-79` `useSocketReconnect` block | `useWorldAccessSocket.spec.tsx:46-59` ✅ |
| S-06 membership:changed → my | `useWorldSocket.ts:65` + spec S-06 | `useWorldSocket.spec.tsx:48-71` ✅ |

### ✅ Potvrzeno by-design

| | Verdikt |
|---|---|
| K-C1: `['worlds']` prefix — invaliduje vše | ✅ by-design; komentář v kódu i spec |
| useUniverseSocket edit-mód suspend → staleFromRemote badge | ✅ by-design; S-RUN-03 komentář |

## PROOF-REQUEST

| ID | Metoda | Co ověřit | Blokátor |
|---|---|---|---|
| PR-01 | M4 (runtime) | C-04 WS: po přidání novinky jiným PJ (druhá session) se dashboard widget obnoví BEZ F5 | vyžaduje livé BE + 2 sessions |
| PR-02 | M4 (runtime) | C-RUN-01: PJ A přidá mapu, PJ B vidí ji za < 60s BEZ F5 | vyžaduje BE WS fix (zatím neexistuje); bez fixu PR se ověří absence obnovy |
| PR-03 | M5 (vitest) | C-04: přidat spec do `useWorldSocket.spec` — `world:news:changed` → `invalidate(['world-news',worldId])` | nestačí L2 pro real-time nález |
