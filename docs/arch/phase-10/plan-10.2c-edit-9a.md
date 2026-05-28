# Plan 10.2c-edit-9a — Spawn drag&drop + placement mode

**Spec:** rozšíření [`spec-10.2e.md`](spec-10.2e.md) §PC + NPC postava spawn UI (žádná separátní BE spec — nepřidává nové ops, jen UX kolem existující `token.add`)
**Status:** ✅ schváleno uživatelem 2026-05-28
**Velikost:** **S** (1 nový komponent, 3 utility, 3 modifikace palet, 1 modifikace TacticalMapView, ~5 test souborů)
**Žádná BE změna** — `token.add` op už existuje (10.2-prep-1), WS broadcast přes `useMapScene.onOperation` funguje (real-time pro všechny v scene room ověřeno).

---

## 1 — Motivace

Současný spawn z palety (PcPalette / NpcCharacterPalette / BestiePalette) volá:

```ts
const { q, r } = findFirstFreeHex(scene.tokens);  // start = {0, 0}
```

Důsledek: všechny spawnnuté tokeny spadnou do shluku kolem (0,0), bez ohledu na to, kde PJ chtěl. Pro PJ orchestraci boje = nepoužitelné.

Old Matrix (`C:/Matrix/Matrix/frontend/src/pages/MapPage.tsx:1473`) řeší kombinací **HTML5 drag & drop** + **placement mode** (klik v paletě → klik na hex). Tento plán portuje tuto UX.

---

## 2 — Pořadí commitů

| # | Co | Soubory |
|---|---|---|
| **C1** | Util `screenToHex(clientX, clientY, rect, panZoom, config)` — sjednocený výpočet hexu pod kurzorem z viewport-relative coords | `utils/screenToHex.ts` + `__tests__/screenToHex.test.ts` |
| **C2** | Util `spawnPayload.ts` — typed payload pro dataTransfer (PC / NPC / Bestie), serialize/deserialize, MIME `application/x-ikaros-token` | `utils/spawnPayload.ts` + test |
| **C3** | Util `buildSpawnToken.ts` — factory `PC/NPC/Bestie → MapToken` (extrakce duplicit z palet, `q/r` parametr) | `utils/buildSpawnToken.ts` + test |
| **C4** | Komponent `MapPlacementBanner` — fixed banner top-center s názvem entity + Zrušit tlačítkem; ESC handler | `components/MapPlacementBanner.tsx` + CSS |
| **C5** | Hook `usePlacementMode` — state machine `idle \| {kind, payload, multi}` + start/cancel/spawn metody + ESC keyboard binding | `hooks/usePlacementMode.ts` + test |
| **C6** | Update palet — palette item je `draggable` + `onDragStart` (`setData` s spawnPayload) + onClick volá `onStartPlacement` místo přímého spawn | `PcPalette.tsx`, `NpcCharacterPalette.tsx`, `BestiePalette.tsx` + `MapPjPanel.tsx` (propaguje `onStartPlacement`) |
| **C7** | Update `TacticalMapView` — integrace `usePlacementMode` + `onDragOver`/`onDrop` na `viewportRef` + PixiJS pointerdown handler na map-root container (active jen v placement mode) + render `MapPlacementBanner` | `TacticalMapView.tsx` |
| **C8** | Update `spec-10.2e.md` — doplnit §3.6 „Spawn placement UX" + checklist | `spec-10.2e.md` |
| **C9** | Memory update — nová `feedback_spawn_ux` (anti-pattern findFirstFreeHex jako primary) + `project_takticka_mapa_principy` doplnit princip 9 | memory |

**Strategie:** jeden commit na `main` (memory pravidlo, žádné feature větve). Commity C1–C9 jsou logické členění pro review, ale fyzicky jeden git commit.

---

## 3 — Klíčové detaily implementace

### 3.1 `screenToHex` util

```ts
// utils/screenToHex.ts
import { pixelToAxial } from '../hexUtils';
import type { HexCoord, HexConfig } from '../types';

interface ViewportTransform {
  offsetX: number;
  offsetY: number;
  zoom: number;
}

export function screenToHex(
  clientX: number,
  clientY: number,
  viewportRect: DOMRect,
  panZoom: ViewportTransform,
  config: HexConfig,
): HexCoord {
  const localX = clientX - viewportRect.left;
  const localY = clientY - viewportRect.top;
  const mapX = (localX - panZoom.offsetX) / panZoom.zoom - config.originX;
  const mapY = (localY - panZoom.offsetY) / panZoom.zoom - config.originY;
  return pixelToAxial(mapX, mapY, config.size);
}
```

💡 **Proč extrahovat:** Stejný výpočet potřebujeme ve 2 místech (HTML5 drop handler, PixiJS placement-mode pointer handler). Bez extrakce = drift risk. V budoucnu (10.2m measure tool, 10.2f combat range overlay) další konzumenti.

### 3.2 `spawnPayload` typed payload

```ts
// utils/spawnPayload.ts
export const SPAWN_PAYLOAD_MIME = 'application/x-ikaros-token';

export type SpawnPayload =
  | { kind: 'pc'; characterId: string; characterSlug: string; name: string; imageUrl?: string }
  | { kind: 'npc'; characterId: string; characterSlug: string; name: string; imageUrl?: string }
  | { kind: 'bestie'; bestieId: string; name: string };

export function serializeSpawnPayload(p: SpawnPayload): string {
  return JSON.stringify(p);
}

export function parseSpawnPayload(raw: string): SpawnPayload | null {
  try {
    const obj = JSON.parse(raw) as SpawnPayload;
    if (!obj || typeof obj !== 'object' || !('kind' in obj)) return null;
    if (obj.kind !== 'pc' && obj.kind !== 'npc' && obj.kind !== 'bestie') return null;
    return obj;
  } catch {
    return null;
  }
}
```

⚠️ **Pozor — custom MIME type:** Firefox respektuje custom MIME types v `dataTransfer`. Chrome/Edge taky. Safari historicky strip non-`text/*` types — proto **fallback** taky `setData('text/plain', JSON.stringify(p))` a v `onDrop` zkusit obě.

### 3.3 `buildSpawnToken` factory

```ts
// utils/buildSpawnToken.ts
import type { MapToken } from '../types';
import type { SpawnPayload } from './spawnPayload';
import type { Bestie } from '@/features/world/bestiar/types';

function pendingId(prefix: string): string {
  return `_pending_${Date.now()}_${prefix}`;
}

export function buildPcToken(
  payload: Extract<SpawnPayload, { kind: 'pc' }>,
  q: number,
  r: number,
): MapToken { /* … existing code from PcPalette.handleSpawn … */ }

export function buildNpcToken(
  payload: Extract<SpawnPayload, { kind: 'npc' }>,
  q: number,
  r: number,
): MapToken { /* … */ }

export function buildBestieToken(
  bestie: Bestie,
  q: number,
  r: number,
): MapToken { /* … */ }
```

📚 **Co to je:** Factory pattern — extrakce duplicitního „naplňování objektu" do jedné jasné funkce per typ. Tři palety teď duplikovaně staví `MapToken` s 14+ poly, factory je sjednotí.

### 3.4 `usePlacementMode` hook

```ts
// hooks/usePlacementMode.ts
type PlacementState =
  | { active: false }
  | { active: true; payload: SpawnPayload; multi: boolean };

export function usePlacementMode(): {
  state: PlacementState;
  start: (payload: SpawnPayload, multi: boolean) => void;
  cancel: () => void;
  /** Vrací true pokud byl spawn schopný (placement active). Multi mode neresetuje. */
  consume: () => SpawnPayload | null;
} {
  const [state, setState] = useState<PlacementState>({ active: false });
  
  // ESC binding
  useEffect(() => {
    if (!state.active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setState({ active: false });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state.active]);

  // ... start/cancel/consume
}
```

Multi vs single:
- **PC** → `multi: false` (jeden PC, jednou umístíme → reset)
- **NPC + Bestie** → `multi: true` (PJ často spawn 3× banditu po sobě)

### 3.5 Drop handler v `TacticalMapView`

```tsx
// uvnitř TacticalMapView
const handleViewportDragOver = (e: React.DragEvent) => {
  if (e.dataTransfer.types.includes(SPAWN_PAYLOAD_MIME) ||
      e.dataTransfer.types.includes('text/plain')) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }
};

const handleViewportDrop = (e: React.DragEvent) => {
  e.preventDefault();
  if (!scene || !viewportRef.current) return;
  
  const raw = e.dataTransfer.getData(SPAWN_PAYLOAD_MIME) 
           || e.dataTransfer.getData('text/plain');
  const payload = parseSpawnPayload(raw);
  if (!payload) return;
  
  const rect = viewportRef.current.getBoundingClientRect();
  const target = screenToHex(e.clientX, e.clientY, rect, panZoom, scene.config);
  
  // Pokud target obsazený, fallback na BFS od targetu (ne od 0,0!)
  const taken = scene.tokens.some(t => t.q === target.q && t.r === target.r);
  const { q, r } = taken ? findFirstFreeHex(scene.tokens, target) : target;
  
  spawnTokenAt(payload, q, r);
};
```

### 3.6 PixiJS pointerdown pro placement mode

Banner aktivní → klik kdekoli na map-root → spawn na ten hex. Bind v `<pixiContainer label="map-root" eventMode="static" onPointerDown={…}>`:

```tsx
<pixiContainer
  label="map-root"
  eventMode={placement.state.active ? 'static' : 'auto'}
  onPointerDown={placement.state.active ? handlePlacementClick : undefined}
  x={panZoom.offsetX} y={panZoom.offsetY} scale={panZoom.zoom}
>
```

```tsx
const handlePlacementClick = (e: FederatedPointerEvent) => {
  if (!placement.state.active || !scene) return;
  // e.global je viewport-relative; map-root má pan+zoom transform, takže pro hex
  // potřebuju local coords — ty jsou `e.getLocalPosition(mapRootContainer)`.
  // Praktičtější je počítat přes screenToHex (viewport rect + panZoom).
  const rect = viewportRef.current!.getBoundingClientRect();
  const target = screenToHex(e.global.x + rect.left, e.global.y + rect.top, rect, panZoom, scene.config);
  
  const taken = scene.tokens.some(t => t.q === target.q && t.r === target.r);
  const { q, r } = taken ? findFirstFreeHex(scene.tokens, target) : target;
  
  spawnTokenAt(placement.state.payload, q, r);
  if (!placement.state.multi) placement.cancel();
};
```

⚠️ **Pozor — `e.global` u PixiJS:** `FederatedPointerEvent.global` je v **canvas screen-space** (pixel souřadnice canvasu, ne window). Pixi canvas je uvnitř `viewportRef`, takže pro window-relative coords pro `screenToHex` musíme přičíst `rect.left/top`.

### 3.7 Spawn token funkce — sjednocená

```tsx
const spawnTokenAt = (payload: SpawnPayload, q: number, r: number): void => {
  if (!scene) return;
  let token: MapToken;
  if (payload.kind === 'pc') token = buildPcToken(payload, q, r);
  else if (payload.kind === 'npc') token = buildNpcToken(payload, q, r);
  else {
    const bestie = findBestieById(payload.bestieId);  // lookup v query cache
    if (!bestie) { console.error('Bestie not found', payload.bestieId); return; }
    token = buildBestieToken(bestie, q, r);
  }
  moveMutation_or_dedicatedSpawnMutation.mutate({
    sceneId: scene.id,
    op: { type: 'token.add', token },
  });
};
```

🔀 **Alternativa zvažovaná:** zachovat per-palette `useMutation`. **Zamítnuto** — duplikace 3× stejného setupu; `TacticalMapView` už má `moveMutation` pattern, přidat `spawnMutation` se stejným on-success je triviální.

---

## 4 — Real-time chování (potvrzení)

PJ-A spawne token přes drag → `POST /maps/:id/operations` → BE atomic commit + WS broadcast `map:operation` → PJ-B a všichni hráči v scene room dostanou v [useMapScene.ts:79](../../../src/features/world/tactical-map/hooks/useMapScene.ts#L79) `onOperation` → `applyOperationToScene` → `setQueryData` → token se objeví u všech v real-time bez refresh.

Token.move (drag existujícího tokenu) už takto funguje od 10.2d-B. Spawn jen přidává další vstup do stejné pipeline.

---

## 5 — Risk, rollback, migrace

**Risk:** Nízký.
- Žádná BE změna, žádná migrace DB
- `findFirstFreeHex` zůstává jako fallback (obsazený target hex)
- Pokud drag&drop selže (Safari MIME issue?) — placement mode jako fallback (klik-klik)

**Rollback:** Revert commit. `handleSpawn` v paletách se vrátí na `findFirstFreeHex(scene.tokens)`.

**Migrace:** žádná. Existing tokens nezasaženy, jen UX kolem spawn.

---

## 6 — Testy

| Soubor | Co pokrývá |
|---|---|
| `__tests__/screenToHex.test.ts` | Identity (offset 0, zoom 1) → axial. Posun viewportu. Zoom 2× / 0.5×. Negative coords. |
| `__tests__/spawnPayload.test.ts` | serialize/parse round-trip pro všechny 3 kinds. parseSpawnPayload (null) na invalid JSON, neznámý kind, missing fields. |
| `__tests__/buildSpawnToken.test.ts` | PC token má `isNpc: false`. NPC token `isNpc: true`. Bestie token `templateId` set + `characterId === 'bestie:<id>'`. systemStats z bestie přejdou do tokenu. |
| `__tests__/usePlacementMode.test.tsx` | start → active. consume v single mode → cancel. consume v multi mode → zůstává. ESC → cancel. |
| `__tests__/TacticalMapView.spawn.test.tsx` | (integration) Drop event s payloadem → token.add mutation volání s correct `{q, r}`. Drop na obsazený hex → fallback `findFirstFreeHex(scene.tokens, target)`. |

---

## 7 — Out of scope (následující subkroky)

- **10.2c-edit-9b** — Token modal redesign s editovatelným deníkem inline pro PC/NPC + per-hráč view restrictions
- **10.2c-edit-9c** — Bestie modal varianta + statblok per-system + per-hráč view
