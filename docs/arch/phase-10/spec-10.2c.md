# Spec 10.2c — Scény (MapScene fetch + WS + stavy)

**Status:** ✅ **HOTOVO** — 10 commitů na main (2026-05-27)
**Modul:** taktická mapa
**Velikost:** **M-L** (cca 14 nových souborů, 2 modifikace, ~30 testů)
**Závisí na:** 10.2-prep-1 (Operations API), 10.2-prep-3 (plugin registry, ne přímo použit ještě), 10.2a, 10.2b

---

## 1. Účel

První **funkční** verze taktické mapy s reálnými daty. Načte aktivní scénu pro current usera přes Operations API (per-player resolution), zobrazí pozadí, aplikuje `isHidden`/`isLocked` overlays, zapojí WS realtime pro live update.

Plus **PJ orchestrator** — list všech aktivních scén ve světě + per-user assignment dropdown (přesun hráče mezi scénami přes `member.assignToScene` ops).

Po 10.2c hráč otevře mapu → vidí svou přiřazenou scénu se backgroundem, PJ má panel pro orchestraci. Tokeny/efekty/fog ještě nerenderujeme — to je 10.2d–h.

## 2. Scope

### V scope

#### Scene load + state

- **`MapScene` typ** — plný interface (nahradí `MapSceneStub`); odpovídá BE `/api/maps/:id` response včetně `enrichTokens` (s `characterData` per token, ale ten je TBD v 10.2d)
- **`useMapScene(worldId)` hook** — load aktivní scény pro current usera:
  - Initial: `GET /maps/active?worldId=` (per-user resolve dle membership.currentSceneId)
  - 404 `MAP_NO_ACTIVE_SCENE` → empty state z 10.2a
  - Po úspěšném load: WS `map:join` na sceneId, subscribe na `map:operation` event
  - Operations apply: incoming `map:operation` → patch lokální scene podle `op.type` (tokens.push/update/remove, scene.image, scene.state, fog.brush, atd.)
  - **Catch-up** po reconnect: `GET /maps/:id/operations?since=lastSeqNumber` → replay missed ops
- **`useReassignmentListener()` hook** — naslouchá private `map:reassigned` event (cross-scene přesun hráče PJem); na fire: invalidate scene query, refetch (autoload nové scény)

#### Vizuál

- **`MapBackground`** komponenta — PixiJS Sprite v `layer-background`, src z `scene.imageUrl` přes `resolveImageUrl()` helper (existující)
- **`MapHiddenOverlay`** — full-bleed black overlay pro hráče když `scene.isHidden=true` (PJ scénu vidí; pro hráče black plachta + "🚫 MAPA SKRYTÁ" text). Nad PixiJS canvasem (HTML overlay z-index)
- **`MapLockedOverlay`** — transparentní pulse banner top center když `scene.isLocked=true && !isPJ` ("🔒 HRA ZASTAVENA"). Hráč pořád mapu vidí, ale UI signalizuje "PJ pauzuje pohyby". Mechanika zákazu tokenů je v 10.2d (assertCanDo gate).

#### PJ orchestrator panel

- **`MapPjPanel`** — sbalitelný floating panel right-side viewport, jen pro PJ/PomocnyPJ:
  - **Seznam aktivních scén** ve světě (`GET /maps?worldId=&isActive=true`), klik na řádek = `member.assignToScene` self-call → PJ přepne svůj `currentSceneId`
  - **Rozmístění hráčů** — pro každého membera světa: dropdown s aktivními scénami; klik na změnu → POST `member.assignToScene { userId, sceneId }`
  - **Skupinový bulk přesun** — pokud world má groups (`worldSettings.customGroups`), select group + select scéna → `member.bulkAssignToScene`
- **`useActiveScenes(worldId)` hook** — fetch aktivní scén pro PJ panel + cache invalidate na `world:operation` events s `op.type` v `member.*`
- **`useMemberAssignment(worldId)` hook** — wrapper kolem `POST /worlds/:worldId/operations` pro UI volání

### Mimo scope

- Token render (10.2d) — `MapScene.tokens` se sice loaduje, ale není vizualizován
- Effects/fog render (10.2g/h) — pole se loaduje, není vizualizováno
- Combat tracker render (10.2f) — `scene.combat` se loaduje, není vizualizován
- Dice events (10.2j) — `map:dice-rolled` se zatím neposlouchá
- Sound playlist (10.2k) — `scene.activeSoundIds` se loaduje, není přehráván

## 3. Klíčová rozhodnutí

### 3.1 Data fetching: TanStack Query (react-query)

Ikaros FE už používá TanStack Query (z `Projekt-ikaros-FE/package.json` viditelné `@tanstack/react-query`). Pojďme dodržet pattern — `useMapScene` + `useActiveScenes` jako `useQuery` calls; mutation pro `member.*` ops přes `useMutation`.

Cache key strategy:
- `['map', 'active', worldId, userId]` — current scena pro mě (per-user resolve)
- `['map', 'world-scenes', worldId, 'active']` — list aktivních scén (PJ panel)
- `['map', 'world-members', worldId]` — list members + jejich currentSceneId

WS události invalidují odpovídající keys.

### 3.2 WS integrace

Stávající `socket.io-client` v projektu (z chat). Pojďme reusovat socket connection — nepřipojovat se 2× (chat + map). Centrální `useMapSocket(sceneId)` hook:
- Při mount: emit `map:join` (existing socket)
- Při unmount: emit `map:leave`
- Listen `map:operation` → callback do query cache patcher
- Listen `map:reassigned` → trigger refetch active scene

### 3.3 Operation patcher

Centrální funkce `applyOperationToScene(scene, op): MapScene` — pure switch per `op.type` aplikuje na lokální state. Stejná logika jako BE atomic update, ale na in-memory `MapScene` objekt.

Důležité: server posílá `op` bez `inverse` (privacy — viz spec 10.2-prep-1 §api.md). Klient si svůj `inverse` (vrácený v 201 response při vlastní apply) drží jen lokálně pro undo (10.2m).

### 3.4 PJ vs. hráč branching

`isPJ = userRole >= WorldRole.PomocnyPJ` (zarovnané s BE OperationsAuthorizer práh).

UI rozdíl:
- PJ vidí `MapPjPanel` (orchestrator), nikdy `MapHiddenOverlay` (PJ vždy scénu vidí)
- Hráč vidí `MapEmptyState` když není přiřazený, `MapHiddenOverlay` když `isHidden`, `MapLockedOverlay` když `isLocked`

### 3.5 Mid-session reassignment UX

Když PJ přesune hráče: server emit private `map:reassigned { newSceneId }` → klient `useReassignmentListener` invaliduje query → autoload nové scény. Žádný confirm dialog (instant switch).

**Edge case:** hráč právě měl něco v overlay (např. otevřený deník) — overlay zavřít? V MVP **ne** — UI se osvěží jen `scene` data; overlay state žije nezávisle (user closes manually). Defer čistší UX post-MVP.

### 3.6 Scene image rendering

`scene.imageUrl` je relativní path z BE (file ID). `resolveImageUrl(imageUrl)` → absolute URL. PixiJS `Texture.from(url)` async load. V loading fázi: prázdné plátno (žádný blur skeleton). Když image error: console.warn + fallback prázdné pozadí.

### 3.7 Operations API klient

`postMapOperation(sceneId, op): Promise<ApplyResult>` a `postWorldOperation(worldId, op): Promise<ApplyResult>` — REST wrapper přes existující axios/fetch infra (existing pattern v `api/` adresářích). Vracejí `{seqNumber, op, inverse, cascadeMapOpIds?}` pro klient-side undo.

## 4. Datový model

```ts
// types.ts plné rozšíření
export interface MapScene {
  id: string;
  worldId: string;
  name: string;
  imageUrl: string;
  folder?: string;
  config: HexConfig;
  tokens: MapToken[];           // 10.2d render
  npcTemplates: MapSceneNpc[];  // 10.2d (NPC modaly)
  effects: MapEffect[];          // 10.2g render
  fogEnabled: boolean;
  revealedHexes: HexCoord[];     // 10.2h render
  templateId?: string;
  isActive: boolean;
  isHidden: boolean;
  isLocked: boolean;
  activeSoundIds: string[];      // 10.2k
  lastModified?: Date;
  lastSeqNumber: number;
  combat?: CombatState | null;   // 10.2f
}

export interface MapToken { /* full per BE schema */ }
export interface MapSceneNpc { /* full per BE schema */ }
export interface MapEffect { /* full per BE schema */ }
export interface CombatState { /* full per BE schema */ }

// Operation payload (matching BE MapOperationPayload union)
export type MapOperation =
  | { type: 'token.add'; token: MapToken }
  | { type: 'token.move'; tokenId: string; q: number; r: number }
  | { type: 'token.remove'; tokenId: string }
  // ... všechny typy z BE (23 per-scene + 3 world)

export type WorldOperation =
  | { type: 'member.assignToScene'; userId: string; sceneId: string }
  | { type: 'member.unassign'; userId: string }
  | { type: 'member.bulkAssignToScene'; userIds: string[]; sceneId: string };
```

Single source of truth pro typy: pojďme generovat z BE interfaces nebo držet manuální mirror. **MVP: manuální mirror** v `types.ts` — jednoduché, type-safe. Když BE schema změní, FE TS catch chybu při kompilaci.

## 5. UI komponenty (nové soubory)

```
src/features/world/tactical-map/
├─ api/
│  ├─ mapApi.ts                  # postMapOperation, getMapActive, getMapById, listActiveScenes
│  └─ worldOpsApi.ts             # postWorldOperation, getWorldMembers
├─ hooks/
│  ├─ useMapScene.ts             # useQuery + WS subscribe + operation patcher
│  ├─ useActiveScenes.ts         # PJ panel list
│  ├─ useReassignmentListener.ts # private map:reassigned hook
│  └─ useMapSocket.ts            # reusuje socket.io-client, map:join/leave
├─ utils/
│  └─ applyOperationToScene.ts   # pure operation → scene patcher
├─ components/
│  ├─ MapBackground.tsx          # PixiJS Sprite
│  ├─ MapHiddenOverlay.tsx       # full black plachta pro hráče
│  ├─ MapLockedOverlay.tsx       # pulse banner top center
│  └─ pj-panel/
│     ├─ MapPjPanel.tsx          # main floating panel
│     ├─ ActiveScenesList.tsx    # list scén pro switch
│     └─ MemberAssignmentTable.tsx # per-user dropdown
└─ types.ts                      # rozšíření (plný MapScene)
```

Modifikace:
- `TacticalMapView.tsx` — odstranit demo hex config, použít `scene.config`; render `<MapBackground>` v layer-background; conditional overlays; conditional PJ panel
- `WorldContext` — žádné změny (už má `userRole`)

## 6. Bezpečnost

- Všechny REST calls jdou přes existující auth interceptor (JWT v headers)
- WS connect používá existing `socket.io-client` instance (auth.token v handshake nastavený jinde v projektu)
- `MapPjPanel` se rendere jen pokud `userRole >= WorldRole.PomocnyPJ` (klient check, BE má taky gate)

## 7. Testovací scénáře

### Unit

- `applyOperationToScene` — per typ apply (~15 op typů, testují že lokální state matchne BE atomic update logiku)
- `useMapScene` — successful load → returns scene; 404 → null; WS event → patches state
- `useReassignmentListener` — `map:reassigned` event → React Query invalidate
- `mapApi` — query/mutation calls (mock fetch)

### Integration

- Load aktivní scény v `TacticalMapView` → `MapBackground` vidí imageUrl
- `scene.isHidden=true, !isPJ` → `MapHiddenOverlay` rendered
- `scene.isLocked=true, !isPJ` → `MapLockedOverlay` rendered
- PJ otevře `MapPjPanel` → vidí list aktivních scén
- PJ klikne na scénu v listu → POST member.assignToScene self-call, query invalidate, switch view

## 8. Open questions

1. **Operation patcher edge cases** — co když přijde `token.move` na neznámý tokenId (např. client missed token.add earlier kvůli pre-WS catch-up race)? MVP: silent skip (warning v console). Catch-up by měl `lastSeqNumber` gap detekovat a refetch full scene.
2. **Optimistic updates pro PJ akce** — klient PJ klikne "assign Lo3 na mapa2" → UI hned ukáže změnu, REST volá paralelně? Doporučení: **ano**, optimistic; rollback při error.
3. **Background image cache** — Texture.from per scena reload. Při switch mezi scénami se loaduje znovu. V MVP OK; sprite atlas v 10.2-prep-3-d cache může pomoct (defer).
4. **PJ panel scrolling** — pro velký svět s 20+ hráči dropdown selector může být dlouhý. Virtualizace? V MVP: native HTML `<select>` (browser-virtualized).

## 9. Akceptační kritéria

- [ ] `useMapScene(worldId)` načte aktivní scénu pro mě (per-user resolve)
- [ ] WS `map:operation` event → lokální patch (test pro token.move + scene.image)
- [ ] WS `map:reassigned` event → autoload nové scény
- [ ] Catch-up po reconnect: missed ops se aplikují
- [ ] `MapBackground` zobrazí scene.imageUrl
- [ ] `isHidden=true && !isPJ` → black overlay
- [ ] `isLocked=true && !isPJ` → pulse banner
- [ ] PJ vidí `MapPjPanel` s listem aktivních scén
- [ ] PJ klikne na scénu → switch self
- [ ] PJ assign hráče → hráč dostane `map:reassigned` (v test mock socket)
- [ ] 30+ testů zelených
- [ ] Manual smoke: 2 browser session (PJ + hráč), PJ přesune hráče, hráč hned vidí novou scénu
