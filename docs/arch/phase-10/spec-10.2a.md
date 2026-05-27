# Spec 10.2a — Rendering jádro + výkonová kostra

**Status:** ⏳ DRAFT — čeká na souhlas
**Modul:** taktická mapa (`/svet/:worldId/takticka-mapa`)
**Velikost:** **M** (cca 8 nových souborů, 2 modifikované, 1 npm dependency)
**Závisí na:** 10.2-prep-1..4 ✅, React 19, PixiJS v8

---

## 1. Účel

První funkční verze taktické mapy v Ikaros FE. **Renderer jádro** — PixiJS WebGL plátno s 6 prázdnými vrstvami, pan/zoom interakcí a persistencí. Žádný obsah ještě nevykresluje (token/grid/efekty/fog/ping přijdou v 10.2b–h). Cíl: **prokázat, že WebGL stack funguje** + položit foundation pro všechny další podkroky.

Nahrazuje stávající stub `TacticalMapPage.tsx` (1 řádek `<WorldStubPage area="tactical-map" />`).

## 2. Scope

### V scope

- **PixiJS Application mount** přes `@pixi/react` v8 `<Application>` komponent
- **6 Container vrstev** v určeném z-order: background → grid → effects → tokens → fog → pings (prázdné — placeholder pro 10.2b–h)
- **Viewport** (scrollable wrapper) + canvas dimensions reagující na resize
- **Pan**: middle-mouse drag, left-mouse drag (když není tool active), 2-finger touch drag
- **Zoom**: Ctrl+wheel (cursor anchored), pinch (2-finger touch)
- **Persistence**: zoom + scroll pozice v `localStorage.ikaros.map.*` (250ms debounce)
- **CSS vars načítání**: `getComputedStyle(document.documentElement)` extrahuje `--map-canvas-bg`, `--map-grid-stroke` (z prep-4), provoláno do PixiJS jako number/hex
- **Plugin resolve**: `getMapSystemPlugin(world.system)` z prep-3 — ready, ale nepoužitý v 10.2a (přijde v 10.2d/l)
- **WorldLayout integrace**: full-bleed (per memory `world_full_bleed_for_takticka_mapa` — `isMapPage` branching v `WorldLayout.module.css` už existuje, jen ověřit)
- **Empty state**: pokud `GET /maps/active` vrátí 404 (žádná aktivní scéna), zobrazit placeholder „PJ ti ještě nepřiřadil scénu"

### Mimo scope (10.2b+)

- Hex grid render (10.2b)
- Scéna load + isHidden/isLocked overlays (10.2c)
- Tokeny (10.2d)
- HP staty (10.2e)
- Iniciativa / combat tracker (10.2f)
- Efekty (10.2g)
- Fog of war (10.2h)
- WS realtime sync (10.2i)
- Kostky overlay (10.2j)
- Zvuky (10.2k stub do 13.3e)
- Deníky (10.2l)
- Měření + undo + a11y (10.2m)

## 3. Klíčová architektonická rozhodnutí

### 3.1 Tech stack (potvrzeno)

| Volba | Verze | Důvod |
|---|---|---|
| `pixi.js` | `^8.x` | Současný stabil; PixiJS v8 (2024) je doporučená verze |
| `@pixi/react` | `^8.x` | Stable (v8.0.5+), built for React 19, JSX pragma s `pixi*` prefix komponentami |
| React | 19.2.5 (existující) | Vyžaduje @pixi/react v8 |
| Lazy load | Yes | `React.lazy(() => import('./TacticalMapPage'))` v routes (per existující pattern) — bundle pixi.js se nahraje jen pro `/takticka-mapa` route |

**Reference:** [Introducing PixiJS React v8](https://pixijs.com/blog/pixi-react-v8-live), [PixiJS v8 launch](https://pixijs.com/blog/pixi-v8-launches).

### 3.2 Vrstvy

```tsx
<Application background={canvasBg} resizeTo={viewportRef}>
  <pixiContainer label="map-root" scale={zoom} x={offsetX} y={offsetY}>
    <pixiContainer label="layer-background" />  {/* 10.2c — pozadí scény */}
    <pixiContainer label="layer-grid" />        {/* 10.2b — hex grid */}
    <pixiContainer label="layer-effects" />     {/* 10.2g — color/barrier/explosion */}
    <pixiContainer label="layer-tokens" />      {/* 10.2d — PC/NPC žetony */}
    <pixiContainer label="layer-fog" />         {/* 10.2h — mlha války */}
    <pixiContainer label="layer-pings" />       {/* dvouklik ping animace */}
  </pixiContainer>
</Application>
```

`scale` + `x/y` na root containeru = single transform pro celou mapu (pan + zoom). Vrstvy mají own children koordináty v "mapa-space".

### 3.3 Viewport mechanika

**Scrollable wrapper** (HTML `<div>`) obklopuje `<Application>` canvas. PixiJS canvas je velikosti viewportu (resize). Pan = úprava `root.x/y`; zoom = úprava `root.scale` se zachováním screen-anchor bodu.

Důvod proti HTML scroll: PixiJS canvas má fixní rozměr (= viewport size). Pan posouvá obsah uvnitř, ne canvas. Viewport culling pak je „co je v rozsahu screen po inverse transform" — jednoduchá math.

### 3.4 Pan + zoom math

**Pan handler** (pointer events, ne native scroll):
```ts
onPointerDown: zapsat startX/Y + startOffsetX/Y
onPointerMove: pokud panning → root.x = startOffsetX + (e.clientX - startX); analog y
onPointerUp: ukončit panning, persist
```

**Zoom toward cursor:**
```ts
onWheel (ctrl/meta): 
  const newZoom = clamp(zoom * (e.deltaY < 0 ? 1.1 : 0.9), 0.2, 3);
  // cursor pozice v mapa-space PŘED zoom
  const mapX = (e.clientX - root.x) / zoom;
  const mapY = (e.clientY - root.y) / zoom;
  // adjust offset tak aby cursor zůstal nad stejným mapa-bodem
  root.x = e.clientX - mapX * newZoom;
  root.y = e.clientY - mapY * newZoom;
  setZoom(newZoom);
```

**Pinch zoom** (touch): track 2 pointers, distance ratio = zoom delta, anchor = midpoint.

### 3.5 LocalStorage persist

Per memory `project_takticka_mapa_principy` § theming — namespace `ikaros.map.*`:

| Klíč | Hodnota | Debounce |
|---|---|---|
| `ikaros.map.zoom` | float 0.2..3 | 250ms |
| `ikaros.map.offsetX` | float | 250ms |
| `ikaros.map.offsetY` | float | 250ms |

Hydrate při mount, save při změně. Reset tlačítkem (100% zoom, offset 0,0).

### 3.6 CSS vars načítání

Helper `loadMapTheme()` přečte všech 17 `--map-*` proměnných přes `getComputedStyle(document.documentElement)`, převede color strings na PixiJS-kompatibilní formát (hex number 0xrrggbb pro `background`, kept string pro stroke). Returns typed `MapThemeColors` object.

Re-load při změně theme (MutationObserver na `data-theme` attribute na root nebo custom event).

### 3.7 Empty state vs. content

V 10.2a žádné token/grid render. Layout:

```
┌─ Viewport (full-bleed) ────────────────────────┐
│                                                │
│        <Application> — prázdné plátno          │
│        (canvas bg color z --map-canvas-bg)     │
│                                                │
│  Floating UI overlay (bottom-right):           │
│    [Zoom +] [Zoom -] [100%] [Fullscreen]       │
│                                                │
│  Pokud 404 → empty state:                      │
│    "PJ ti ještě nepřiřadil scénu"              │
└────────────────────────────────────────────────┘
```

10.2a renderuje **pouze prázdné plátno + zoom controls + empty state**. Žádné scena fetch zatím (přijde v 10.2c) — pro testování stačí, že canvas reaguje na pan/zoom.

## 4. Datový model

10.2a nemá vlastní DB schema (žádná persistence kromě localStorage). Konzumuje `MapScene` interface ze sourozeneckého BE repo (pro 10.2c) — v této fázi placeholder typ:

```ts
// V src/features/world/tactical-map/types.ts:
export interface MapSceneStub {
  id: string;
  worldId: string;
  name: string;
}
```

Plný interface přijde v 10.2c.

## 5. UI komponenty (nové soubory)

```
src/features/world/tactical-map/
├─ TacticalMapView.tsx        # Hlavní component — Application + layers + zoom controls
├─ hooks/
│  ├─ useMapTheme.ts          # CSS vars → typed colors object
│  ├─ useViewportPanZoom.ts   # Pan + zoom handlers + persist
│  └─ useViewportSize.ts      # ResizeObserver
├─ components/
│  ├─ MapZoomControls.tsx     # Floating buttons (+, -, 100%, fullscreen)
│  └─ MapEmptyState.tsx       # "PJ ti ještě nepřiřadil scénu"
├─ types.ts                   # MapThemeColors + MapSceneStub
└─ index.ts                   # Public API export
```

`TacticalMapPage.tsx` (existující stub) se přepíše na:
```tsx
import { TacticalMapView } from './tactical-map/TacticalMapView';
export default function TacticalMapPage() {
  return <TacticalMapView />;
}
```

## 6. API & vstupní data

10.2a v scope **nevolá BE** (žádný `GET /maps/active`). Jen čte `world.system` z `WorldContext` pro plugin resolve (placeholder pro 10.2d).

V 10.2c spec přijde scene fetch — zde jen empty state když `world` není načtený.

## 7. Bezpečnost

- N/A — bez BE calls
- Žádná citlivá data v localStorage (jen UI preferences)

## 8. Testovací scénáře

### Unit (Vitest)

- `useMapTheme` — getComputedStyle mock vrátí konkrétní hodnoty → typed object
- `useMapTheme` — color parse: `#0a0814` → `0x0a0814`, `rgba(...)` → 0xrrggbb (alpha drop)
- `useViewportPanZoom` — pan handler updatuje offset; persist po 250ms debounce
- `useViewportPanZoom` — zoom toward cursor — math: cursor zůstává stable po zoom

### Integration (Vitest + Testing Library)

- `TacticalMapView` render — `<Application>` mountuje (mock pixi), 6 vrstvy přítomné v DOM/tree
- Zoom controls — klik na "+" zvětší zoom, klik na "100%" reset
- LocalStorage hydrate — `ikaros.map.zoom = "1.5"` → initial state 1.5

### Manual smoke

- `npm run dev` → naviguj na `/svet/<id>/takticka-mapa` → vidíš prázdné plátno s canvas-bg barvou
- Ctrl+wheel zooming → reaktivní, plynulé
- Refresh stránky → zoom + offset persistují
- Resize okna → canvas se přizpůsobí

## 9. Open questions

1. **Lazy load granularita** — `React.lazy` jen na celý `TacticalMapView` nebo i hooks? Doporučení: jen page-level lazy (route).
2. **Fallback při WebGL contextLoss** — když GPU driver crashne / dlouhá idle pauza, PixiJS app může ztratit context. V MVP: zobrazit overlay „Mapa byla odpojena — refresh stránky". Plnohodnotný recovery defer.
3. **Default zoom při first visit** — `1.0` (100%) nebo auto-fit (zatím nemáme co fitnout). Doporučení: `1.0` hardcoded.
4. **Skin theme switch reload** — když PJ změní `data-theme` runtime, mají se PixiJS barvy re-load? Ano (`MutationObserver` na `[data-theme]`), ale costly. V MVP: dělat to.

## 10. Akceptační kritéria

- [ ] `npm install` projde (přidání pixi.js + @pixi/react do deps)
- [ ] `npm run build` projde bez TS errors
- [ ] `npm run lint` 0 warnings v nových souborech
- [ ] `npm run test` všechny nové testy zelené
- [ ] Manual smoke: stránka `/svet/<id>/takticka-mapa` zobrazí prázdné PixiJS plátno
- [ ] Pan funkční myší (drag) i touch (1-finger)
- [ ] Zoom funkční Ctrl+wheel (cursor-anchored) i pinch (touch)
- [ ] LocalStorage persist přežije refresh
- [ ] Empty state když `WorldContext` není ready
- [ ] Zoom controls reagují (+/-/100%/fullscreen)
- [ ] `world_full_bleed_for_takticka_mapa` layout funguje (no padding, hidden overflow — `WorldLayout` `isMapPage` branch)
