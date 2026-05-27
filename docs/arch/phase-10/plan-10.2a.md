# Plan 10.2a — Rendering jádro + výkonová kostra

**Spec:** [spec-10.2a.md](spec-10.2a.md)
**Status:** ✅ **HOTOVO** — 6 implementačních + verify commitů na main (2026-05-27)
**Velikost:** **M** (8 nových souborů, 1 přepsaný stub, 1 npm dep, ~10 testů, žádné BE změny)
**Cíl:** PixiJS WebGL plátno + 6 vrstev (prázdné) + pan/zoom/persist + empty state v `TacticalMapPage`.

---

## 1 — Pořadí změn (commits přímo na `main` dle [[feedback_work_on_main]])

| Commit | Co | Soubory |
|---|---|---|
| **C1** | npm dependencies + types foundation | `package.json`, `tactical-map/types.ts` |
| **C2** | `useMapTheme` hook (CSS vars → PixiJS) | `hooks/useMapTheme.ts` + test |
| **C3** | `useViewportSize` + `useViewportPanZoom` hooks | `hooks/useViewportSize.ts`, `hooks/useViewportPanZoom.ts` + testy |
| **C4** | `MapZoomControls` + `MapEmptyState` komponenty | `components/MapZoomControls.tsx`, `components/MapEmptyState.tsx` |
| **C5** | `TacticalMapView` hlavní (Application + 6 vrstev) | `TacticalMapView.tsx`, `index.ts` |
| **C6** | `TacticalMapPage` přepsání + WorldLayout verify | `pages/TacticalMapPage.tsx`, ověřit `WorldLayout.module.css` |
| **C7** | Integrace tests + smoke verify | spec files + handy script |
| **C8** | Plan status DONE + roadmap odškrtnutí | doc updates |

---

## 2 — Pre-decisions z spec §9 Open questions

| # | Otázka | Rozhodnutí |
|---|---|---|
| 1 | Lazy load granularita | **Page-level** (`React.lazy(() => import('./TacticalMapPage'))` v routes; uvnitř komponent flat import) |
| 2 | WebGL contextLoss recovery | **Overlay zpráva** „Mapa odpojena — refresh"; plný recovery defer post-MVP |
| 3 | Default zoom při first visit | **`1.0`** hardcoded |
| 4 | Skin theme runtime reload | **Ano**, `MutationObserver` na `data-theme` na `<html>`; cost akceptovaný (theme se nemění často) |

---

## 3 — Detail změn

### C1 — npm deps + types foundation

**`package.json`** (FE) — add:
```json
"pixi.js": "^8.6.0",
"@pixi/react": "^8.0.5"
```

**Instalace:** zavoláme přes user-allowed `pnpm install` nebo ekvivalent.

**Nový soubor `src/features/world/tactical-map/types.ts`:**
```ts
/**
 * 10.2a — typy pro renderer jádro.
 */

/** Stub MapScene typ; plný interface přijde v 10.2c. */
export interface MapSceneStub {
  id: string;
  worldId: string;
  name: string;
}

/** Načtené barvy z CSS proměnných (--map-*); konzument PixiJS. */
export interface MapThemeColors {
  canvasBg: number;              // hex 0xrrggbb pro Application background
  gridStroke: string;            // PixiJS Graphics stroke color (rgba string OK)
  gridStrokeWidth: number;       // px
  tokenRingDefault: number;
  tokenRingSelected: number;
  tokenRingActiveTurn: number;
  tokenHpBarBg: string;
  fogPjFill: string;
  fogPlayerFill: string;
  effectColorDefault: string;
  effectBarrierFill: string;
  effectBarrierGlow: string;
  effectFireBase: number;
  effectGasBase: number;
  effectSmokeBase: number;
  pingColor: string;
  toolbarBg: string;
  toolbarText: string;
}

/** Pan + zoom stav viewportu (persist v localStorage). */
export interface ViewportState {
  zoom: number;     // clamp 0.2..3
  offsetX: number;  // root container x
  offsetY: number;  // root container y
}
```

**Acceptance:** `npm install` projde, `tsc --noEmit` nemá errors v novém souboru.

**Commit:**
```
feat(10.2a): pixi.js + @pixi/react deps + tactical-map/types

PixiJS v8 + @pixi/react v8 (stable, built for React 19).
Nový adresář src/features/world/tactical-map/ s types.ts (MapSceneStub,
MapThemeColors, ViewportState).

Spec: docs/arch/phase-10/spec-10.2a.md §3.1, §4, §5.
```

---

### C2 — `useMapTheme` hook

**`src/features/world/tactical-map/hooks/useMapTheme.ts`:**

Funkce:
- Read 17 `--map-*` proměnných z `getComputedStyle(document.documentElement)`
- Parse barvy:
  - `#rrggbb` → number `0xrrggbb` pro hex fields (`canvasBg`, ringy, fire/gas/smoke)
  - `rgba(...)` ponechat jako string pro stroke/fill (PixiJS Graphics akceptuje)
- `MutationObserver` na `<html>` `data-theme` attribute change → re-read + setState
- Re-read taky na custom `'skin-changed'` event (pojistka pro custom skin switcher)

```ts
import { useState, useEffect } from 'react';
import type { MapThemeColors } from '../types';

const VAR_NAMES = [
  '--map-canvas-bg', '--map-grid-stroke', '--map-grid-stroke-width',
  '--map-token-ring-default', '--map-token-ring-selected',
  '--map-token-ring-active-turn', '--map-token-hp-bar-bg',
  '--map-fog-pj-fill', '--map-fog-player-fill',
  '--map-effect-color-default', '--map-effect-barrier-fill',
  '--map-effect-barrier-glow',
  '--map-effect-fire-base', '--map-effect-gas-base', '--map-effect-smoke-base',
  '--map-ping-color', '--map-toolbar-bg', '--map-toolbar-text',
] as const;

function parseHexColor(s: string): number {
  const trimmed = s.trim();
  if (trimmed.startsWith('#')) {
    return parseInt(trimmed.slice(1), 16);
  }
  // Fallback pro rgba/named: extract rgb a return jako number
  const m = trimmed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (m) {
    return (parseInt(m[1]) << 16) | (parseInt(m[2]) << 8) | parseInt(m[3]);
  }
  return 0x000000;
}

function parsePxNumber(s: string): number {
  return parseFloat(s.replace('px', '').trim()) || 1;
}

function readThemeFromCSS(): MapThemeColors {
  const style = getComputedStyle(document.documentElement);
  const v = (name: string): string =>
    style.getPropertyValue(name).trim();
  return {
    canvasBg: parseHexColor(v('--map-canvas-bg')),
    gridStroke: v('--map-grid-stroke'),
    gridStrokeWidth: parsePxNumber(v('--map-grid-stroke-width')),
    tokenRingDefault: parseHexColor(v('--map-token-ring-default')),
    tokenRingSelected: parseHexColor(v('--map-token-ring-selected')),
    tokenRingActiveTurn: parseHexColor(v('--map-token-ring-active-turn')),
    tokenHpBarBg: v('--map-token-hp-bar-bg'),
    fogPjFill: v('--map-fog-pj-fill'),
    fogPlayerFill: v('--map-fog-player-fill'),
    effectColorDefault: v('--map-effect-color-default'),
    effectBarrierFill: v('--map-effect-barrier-fill'),
    effectBarrierGlow: v('--map-effect-barrier-glow'),
    effectFireBase: parseHexColor(v('--map-effect-fire-base')),
    effectGasBase: parseHexColor(v('--map-effect-gas-base')),
    effectSmokeBase: parseHexColor(v('--map-effect-smoke-base')),
    pingColor: v('--map-ping-color'),
    toolbarBg: v('--map-toolbar-bg'),
    toolbarText: v('--map-toolbar-text'),
  };
}

export function useMapTheme(): MapThemeColors {
  const [theme, setTheme] = useState(readThemeFromCSS);

  useEffect(() => {
    const reload = () => setTheme(readThemeFromCSS());

    // 1. Theme switch přes [data-theme] na <html>
    const observer = new MutationObserver(reload);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    // 2. Custom event (pojistka pro skin switcher)
    window.addEventListener('skin-changed', reload);

    return () => {
      observer.disconnect();
      window.removeEventListener('skin-changed', reload);
    };
  }, []);

  return theme;
}
```

**Test `__tests__/useMapTheme.test.tsx`:**
- Mock `getComputedStyle` vrátí konkrétní hodnoty → `useMapTheme()` returns parsed object
- `parseHexColor('#ff00aa')` → `0xff00aa`
- `parseHexColor('rgba(255,0,170,0.5)')` → `0xff00aa`
- MutationObserver fire → setTheme volán znovu

**Acceptance:** Test zelený, build pass.

**Commit:**
```
feat(10.2a): useMapTheme hook (CSS vars → PixiJS colors)

Čte 17 --map-* proměnných přes getComputedStyle, parsuje barvy
(#rrggbb → 0xrrggbb hex pro Application.background a Graphics fills;
rgba/named ponecháno jako string pro PixiJS Graphics stroke).

Re-load triggery:
- MutationObserver na document.documentElement [data-theme] attr
- Custom 'skin-changed' window event (pojistka)
```

---

### C3 — `useViewportSize` + `useViewportPanZoom`

**`hooks/useViewportSize.ts`:**

```ts
import { useState, useEffect, RefObject } from 'react';

export function useViewportSize(
  ref: RefObject<HTMLElement>,
): { width: number; height: number } {
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () =>
      setSize({ width: el.clientWidth, height: el.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return size;
}
```

**`hooks/useViewportPanZoom.ts`:**

Hlavní hook:
- Drží `ViewportState` (zoom, offsetX, offsetY)
- Hydrate z localStorage (`ikaros.map.*`) při mount
- Pointer event handlers: pan (drag), pinch zoom, wheel zoom
- `applyZoom(newZoom, anchorX, anchorY)` — math z spec §3.4
- Debounce persist (250ms)
- Returns `{ zoom, offsetX, offsetY, onWheel, onPointerDown, onPointerMove, onPointerUp, resetZoom, setZoom }`

```ts
import { useState, useEffect, useRef, useCallback, RefObject } from 'react';
import type { ViewportState } from '../types';

const LS_KEYS = {
  zoom: 'ikaros.map.zoom',
  offsetX: 'ikaros.map.offsetX',
  offsetY: 'ikaros.map.offsetY',
} as const;

const ZOOM_MIN = 0.2;
const ZOOM_MAX = 3;
const PERSIST_DEBOUNCE = 250;

function hydrateInitial(): ViewportState {
  try {
    return {
      zoom: parseFloat(localStorage.getItem(LS_KEYS.zoom) ?? '1') || 1,
      offsetX: parseFloat(localStorage.getItem(LS_KEYS.offsetX) ?? '0') || 0,
      offsetY: parseFloat(localStorage.getItem(LS_KEYS.offsetY) ?? '0') || 0,
    };
  } catch {
    return { zoom: 1, offsetX: 0, offsetY: 0 };
  }
}

export function useViewportPanZoom(viewportRef: RefObject<HTMLElement>) {
  const [state, setState] = useState<ViewportState>(hydrateInitial);
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  // Persist debounced
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(LS_KEYS.zoom, String(state.zoom));
        localStorage.setItem(LS_KEYS.offsetX, String(state.offsetX));
        localStorage.setItem(LS_KEYS.offsetY, String(state.offsetY));
      } catch { /* ignore quota errors */ }
    }, PERSIST_DEBOUNCE);
    return () => clearTimeout(t);
  }, [state]);

  // Wheel zoom (cursor-anchored)
  const onWheel = useCallback((e: WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    const ratio = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.min(Math.max(stateRef.current.zoom * ratio, ZOOM_MIN), ZOOM_MAX);
    if (newZoom === stateRef.current.zoom) return;
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return;
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const mapX = (screenX - stateRef.current.offsetX) / stateRef.current.zoom;
    const mapY = (screenY - stateRef.current.offsetY) / stateRef.current.zoom;
    setState({
      zoom: newZoom,
      offsetX: screenX - mapX * newZoom,
      offsetY: screenY - mapY * newZoom,
    });
  }, [viewportRef]);

  // Pan (pointer drag) + pinch (2-finger touch)
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });
  const activePointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStart = useRef<{ dist: number; zoom: number; cx: number; cy: number } | null>(null);

  const onPointerDown = useCallback((e: PointerEvent) => {
    if (e.pointerType === 'touch' || e.pointerType === 'pen') {
      activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (activePointers.current.size === 2) {
        const [a, b] = Array.from(activePointers.current.values());
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (dist > 0) {
          pinchStart.current = {
            dist,
            zoom: stateRef.current.zoom,
            cx: (a.x + b.x) / 2,
            cy: (a.y + b.y) / 2,
          };
        }
        isPanning.current = false;
        return;
      }
    }
    if (pinchStart.current) return;
    // Middle (1) always; left (0) když není modifier
    if (e.button === 1 || e.button === 0) {
      isPanning.current = true;
      panStart.current = {
        x: e.clientX, y: e.clientY,
        offsetX: stateRef.current.offsetX,
        offsetY: stateRef.current.offsetY,
      };
      if (e.button === 1) e.preventDefault();
    }
  }, []);

  const onPointerMove = useCallback((e: PointerEvent) => {
    if (activePointers.current.has(e.pointerId)) {
      activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }
    // Pinch
    if (pinchStart.current && activePointers.current.size >= 2) {
      const pts = Array.from(activePointers.current.values()).slice(0, 2);
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      if (dist <= 0) return;
      const ratio = dist / pinchStart.current.dist;
      const newZoom = Math.min(Math.max(pinchStart.current.zoom * ratio, ZOOM_MIN), ZOOM_MAX);
      const rect = viewportRef.current?.getBoundingClientRect();
      if (!rect) return;
      const screenX = pinchStart.current.cx - rect.left;
      const screenY = pinchStart.current.cy - rect.top;
      const mapX = (screenX - stateRef.current.offsetX) / stateRef.current.zoom;
      const mapY = (screenY - stateRef.current.offsetY) / stateRef.current.zoom;
      setState({
        zoom: newZoom,
        offsetX: screenX - mapX * newZoom,
        offsetY: screenY - mapY * newZoom,
      });
      return;
    }
    // Pan
    if (!isPanning.current) return;
    setState((s) => ({
      ...s,
      offsetX: panStart.current.offsetX + (e.clientX - panStart.current.x),
      offsetY: panStart.current.offsetY + (e.clientY - panStart.current.y),
    }));
  }, [viewportRef]);

  const onPointerUp = useCallback((e: PointerEvent) => {
    activePointers.current.delete(e.pointerId);
    if (activePointers.current.size < 2) pinchStart.current = null;
    isPanning.current = false;
  }, []);

  const setZoom = useCallback((newZoom: number) => {
    const clamped = Math.min(Math.max(newZoom, ZOOM_MIN), ZOOM_MAX);
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) {
      setState((s) => ({ ...s, zoom: clamped }));
      return;
    }
    // Center anchor pro zoom přes UI tlačítka
    const screenX = rect.width / 2;
    const screenY = rect.height / 2;
    const mapX = (screenX - stateRef.current.offsetX) / stateRef.current.zoom;
    const mapY = (screenY - stateRef.current.offsetY) / stateRef.current.zoom;
    setState({
      zoom: clamped,
      offsetX: screenX - mapX * clamped,
      offsetY: screenY - mapY * clamped,
    });
  }, [viewportRef]);

  const resetZoom = useCallback(() => {
    setState({ zoom: 1, offsetX: 0, offsetY: 0 });
  }, []);

  return {
    ...state,
    onWheel,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    setZoom,
    resetZoom,
  };
}
```

**Testy:**
- `useViewportSize` — ResizeObserver mock, size update fire
- `useViewportPanZoom` — hydrate z localStorage, persist po debounce, zoom math (cursor zůstává stable)

**Commit:**
```
feat(10.2a): useViewportSize + useViewportPanZoom hooks

useViewportSize — ResizeObserver wrapper pro PixiJS Application.resizeTo.

useViewportPanZoom:
- Pan: middle/left mouse drag, 2-finger touch drag
- Zoom: Ctrl/Cmd+wheel (cursor-anchored), pinch (touch anchored)
- LocalStorage persist (ikaros.map.zoom/.offsetX/.offsetY, 250ms debounce)
- setZoom (centered anchor) + resetZoom (1.0 + 0,0)

Math: zoom toward cursor zachovává screen point nad stejným map-space bodem.
```

---

### C4 — `MapZoomControls` + `MapEmptyState`

**`components/MapZoomControls.tsx`:**

Floating panel bottom-right s tlačítky:
- `+` — `setZoom(zoom + 0.1)`
- `-` — `setZoom(zoom - 0.1)`
- `100%` — `resetZoom()`
- `⛶` — fullscreen toggle (přes `requestFullscreen` API)

CSS modul, scoped na map UI.

**`components/MapEmptyState.tsx`:**

Center-aligned message když není scéna. Z `--map-toolbar-text` color. Ikonka 🪹 + text „PJ ti ještě nepřiřadil scénu" + sub „Vyčkej, až tě někam přiřadí."

**Commit:**
```
feat(10.2a): MapZoomControls + MapEmptyState komponenty
```

---

### C5 — `TacticalMapView` (hlavní)

**`tactical-map/TacticalMapView.tsx`:**

```tsx
import { Application, extend } from '@pixi/react';
import { Container } from 'pixi.js';
import { useRef } from 'react';
import { useMapTheme } from './hooks/useMapTheme';
import { useViewportSize } from './hooks/useViewportSize';
import { useViewportPanZoom } from './hooks/useViewportPanZoom';
import { MapZoomControls } from './components/MapZoomControls';
import { MapEmptyState } from './components/MapEmptyState';
import { useWorldContext } from '...'; // import existující
import styles from './TacticalMapView.module.css';

extend({ Container }); // PixiJS v8 @pixi/react extend pattern

export function TacticalMapView() {
  const world = useWorldContext();
  const viewportRef = useRef<HTMLDivElement>(null);
  const theme = useMapTheme();
  const { width, height } = useViewportSize(viewportRef);
  const panZoom = useViewportPanZoom(viewportRef);

  // Connect pointer events
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    el.addEventListener('wheel', panZoom.onWheel, { passive: false });
    el.addEventListener('pointerdown', panZoom.onPointerDown);
    window.addEventListener('pointermove', panZoom.onPointerMove);
    window.addEventListener('pointerup', panZoom.onPointerUp);
    window.addEventListener('pointercancel', panZoom.onPointerUp);
    return () => {
      el.removeEventListener('wheel', panZoom.onWheel);
      el.removeEventListener('pointerdown', panZoom.onPointerDown);
      window.removeEventListener('pointermove', panZoom.onPointerMove);
      window.removeEventListener('pointerup', panZoom.onPointerUp);
      window.removeEventListener('pointercancel', panZoom.onPointerUp);
    };
  }, [panZoom]);

  if (!world) {
    return <MapEmptyState />;
  }

  return (
    <div ref={viewportRef} className={styles.viewport}>
      <Application
        background={theme.canvasBg}
        resizeTo={viewportRef}
        width={width}
        height={height}
      >
        <pixiContainer
          label="map-root"
          x={panZoom.offsetX}
          y={panZoom.offsetY}
          scale={panZoom.zoom}
        >
          <pixiContainer label="layer-background" />
          <pixiContainer label="layer-grid" />
          <pixiContainer label="layer-effects" />
          <pixiContainer label="layer-tokens" />
          <pixiContainer label="layer-fog" />
          <pixiContainer label="layer-pings" />
        </pixiContainer>
      </Application>
      <MapZoomControls
        zoom={panZoom.zoom}
        onZoomIn={() => panZoom.setZoom(panZoom.zoom + 0.1)}
        onZoomOut={() => panZoom.setZoom(panZoom.zoom - 0.1)}
        onReset={panZoom.resetZoom}
        viewportRef={viewportRef}
      />
    </div>
  );
}
```

**CSS:** `TacticalMapView.module.css` — viewport full-bleed (100% width/height, position relative, overflow hidden, touch-action none).

**`tactical-map/index.ts`** — export public API:
```ts
export { TacticalMapView } from './TacticalMapView';
```

**Commit:**
```
feat(10.2a): TacticalMapView — Application + 6 vrstev + pan/zoom integrace
```

---

### C6 — `TacticalMapPage` přepsání + WorldLayout verify

**`src/features/world/pages/TacticalMapPage.tsx`** — přepsat:
```tsx
import { TacticalMapView } from '../tactical-map';

export default function TacticalMapPage() {
  return <TacticalMapView />;
}
```

**Ověřit `WorldLayout.module.css`** — full-bleed branching pro `isMapPage` (per memory `world_full_bleed_for_takticka_mapa`). Pokud chybí, doplnit.

**Commit:**
```
feat(10.2a): TacticalMapPage rendering přes TacticalMapView
```

---

### C7 — Testy + smoke verify

**Vitest specs** (per pre-spec rozhodnutí):
- `hooks/__tests__/useMapTheme.test.tsx`
- `hooks/__tests__/useViewportSize.test.tsx`
- `hooks/__tests__/useViewportPanZoom.test.tsx`

Pokrytí per spec §8.

**Manual smoke test sequence (povinný před commit):**

1. `pnpm dev` (nebo ekvivalent)
2. Login jako PJ, naviguj na svět → `/svet/<id>/takticka-mapa`
3. Verify: prázdné plátno s `--map-canvas-bg` barvou (fialová ikaros default)
4. Ctrl+wheel → zoom plynulý, cursor-anchored
5. Drag left mouse → pan funguje
6. Klik na +/-/100% → zoom buttons reagují
7. Refresh stránky → zoom + offset persistují
8. Resize okna → plátno respond

**Commit:**
```
test(10.2a): unit testy pro hooks (useMapTheme + useViewportSize + useViewportPanZoom)
```

---

### C8 — Plan status + roadmap odškrtnutí

- `plan-10.2a.md` status DRAFT → ✅ HOTOVO
- `roadmap-fe.md` 10.2a checkbox `[ ]` → `[x]` s datumem + commit refs

**Commit:**
```
docs(10.2a): plan status DONE + roadmap odškrtnutí
```

---

## 4 — Závěrečný checklist

- [ ] `pnpm install` projde s novými deps
- [ ] `pnpm build` (TS + Vite) projde bez warnings
- [ ] `pnpm lint` 0 errors, 0 warnings v nových souborech
- [ ] `pnpm test` — všechny nové testy zelené (~10 testů)
- [ ] **Smoke 1**: `/svet/<id>/takticka-mapa` zobrazí prázdné PixiJS plátno
- [ ] **Smoke 2**: Pan (drag) + zoom (Ctrl+wheel) funguje a je plynulý
- [ ] **Smoke 3**: Refresh → zoom/offset persistují
- [ ] **Smoke 4**: Empty state když není world context
- [ ] **Smoke 5**: Mobile (DevTools touch emulation) — 1-finger pan + 2-finger pinch zoom
- [ ] `WorldLayout` full-bleed funguje (no padding, hidden overflow)

---

## 5 — Commit strategie

8 commitů sekvenčně přímo na main:
- C1 → C2 → C3 → C4 → C5 → C6 → C7 → C8
- Per commit: build + lint + test musí projít před push

Velikost: realisticky **3-5 h**. Pokud něco nečekaného (např. `@pixi/react` v8 má neočekávané quirk), zastavím a požádám o nový pohled.

---

## 6 — Open risks

1. **`@pixi/react` v8 + Vite 6 compatibility** — pokud bundler dělá problémy s pixi.js ESM, fallback je vanilla PixiJS s `useRef` mount (refactor C5 jen, ostatní zůstává). Verifikuju v C1 pnpm install + build.
2. **PixiJS canvas resize race** — `resizeTo` může mít timing issue při first paint. Fallback: explicit `width`/`height` props z `useViewportSize`.
3. **Touch events na desktop browser** — některé browser settings preferují gestures jako gesture events místo pointer. PointerEvents API by mělo unified ošetřit oba.

Žádný open risk nemění scope spec — řešitelné v rámci implementace.
