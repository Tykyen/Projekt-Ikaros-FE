# Spec 10.2b — Hex mřížka

**Status:** ⏳ DRAFT — čeká na souhlas
**Modul:** taktická mapa
**Velikost:** **S** (3 nové soubory, 1 modifikace `TacticalMapView`, ~15 testů)
**Závisí na:** 10.2a ✅, PixiJS v8 Graphics API

---

## 1. Účel

Vykreslit hex grid přes celé plátno taktické mapy. Math (axial souřadnice, sousedi, ring/radius helpery) převzato z Matrix `frontend/src/components/Map/HexUtils.ts` 1:1 (port). Render přes PixiJS `Graphics` v `layer-grid` containeru (single draw call, ne N polygonů).

**Žádný interaktivní hit-test** (klik na hex). Hit-test přijde v 10.2d (token placement) přes `pixelToAxial` inverse math.

## 2. Scope

### V scope

- **`hexUtils.ts`** — port Matrix math (10 funkcí + 2 typy):
  - `axialToPixel(q, r, size)` — axial → SVG/canvas px
  - `pixelToAxial(x, y, size)` — inverse s cube-round
  - `getHexCorner(center, size, i)` — i-tý roh (0–5)
  - `getHexPoints(center, size)` — pole 6 corners pro polygon draw
  - `getHexNeighbor(q, r, dir)` — soused (0–5)
  - `getHexRing(cq, cr, radius)` — hexy v jednom prstenci
  - `getHexesInRadius(cq, cr, radius)` — vyplněný disk
  - `hexDistance(a, b)` — axial distance (pro 10.2m measure)
  - Konstanty: `AXIAL_DIRECTIONS` (6 vektorů)
- **`HexGrid.tsx`** — PixiJS komponenta, renderuje grid do `layer-grid` containeru:
  - Single `Graphics` instance (re-draw jen při změně config / theme)
  - Stroke z `--map-grid-stroke` (via theme), width z `--map-grid-stroke-width`
  - Tile pattern: spočítá visible range hexů z viewport bounds + map transform, kreslí jen ty (jednoduché culling)
  - Respektuje `config.showGrid` (false → nic nekreslí)
- **Integrace v `TacticalMapView`**: `<HexGrid config={hexConfig} theme={theme} viewport={...}>` jako dítě `pixiContainer[label='layer-grid']`
- **Dočasný demo config** v `TacticalMapView`: `const hexConfig = { size: 40, originX: 0, originY: 0, showGrid: true }` — plný load z scene přijde v 10.2c

### Mimo scope

- Hit-test (klik na hex) — 10.2d (přes `pixelToAxial`)
- Grid config editor v PJ panelu — 10.2c
- Snap-to-grid při drag tokenů — 10.2d
- Hex highlighting (hover, selected) — 10.2d/g

## 3. Klíčová rozhodnutí

### 3.1 Hex orientace — flat-top

`getHexCorner` úhel `60*i - 30°` (per Matrix). Plochá strana nahoře/dole, vrcholy vlevo/vpravo. Konzistence s Matrix kódem (port 1:1) + většina VTT v RPG světě používá flat-top.

### 3.2 Axial souřadnice

`(q, r)` per Matrix. Sousedi: `[(1,0)(1,-1)(0,-1)(-1,0)(-1,1)(0,1)]`. Cube-round v `pixelToAxial` (s constraint `s = -q - r`).

### 3.3 Single draw vs. N polygonů

PixiJS v8 `Graphics` umožňuje vícero shape definic v jednom objektu — výkon na úrovni single draw call. Strategie:

```ts
const g = new Graphics();
for (const hex of visibleHexes) {
  const points = getHexPoints(center, size);
  g.poly(points).stroke({ color: gridStroke, width: gridStrokeWidth, alpha });
}
```

Re-draw trigger jen když:
- `config` se změní (size, origin, showGrid)
- `theme` se změní (skin reload)
- Viewport se posune mimo aktuální rendered range (lazy culling rebuild)

Tj. **ne při každém panu** — kreslíme jednou s dostatečným bufferem kolem viewportu, re-draw až když se uživatel dostane mimo cached range.

### 3.4 Culling strategy

```
hex grid se renderuje pro „rozšířený viewport":
  worldBounds = viewport-in-mapa-space (inverse transform)
  paddedBounds = worldBounds expanded o 2× viewport size
  visibleHexes = hexy v paddedBounds
```

Tj. zoom out → víc hexů (paddedBounds větší); pan v rámci range → žádný re-draw; pan ven z range → re-compute + re-draw.

Pro 10.2b stačí prostší implementace — vykreslit fixní 50×50 hexů kolem `(0,0)`. Pravé culling refactor je v 10.2a "viewport culling" závazku z roadmapy, ale grid je natolik lightweight (jen pár stovek polygonů), že lze v MVP odložit.

**MVP rozhodnutí:** Pokrýt **±25 hexů od origin v obou osách = 50×50 = 2500 hexů**. PixiJS toto zvládne triviálně. Refactor na true viewport culling defer post-MVP.

### 3.5 Tile texture (RenderTexture) — defer

Roadmap zmiňuje „grid jako jeden draw (dlaždicová textura), ne N polygonů" jako výkonový princip. PixiJS `Graphics` v8 už je interně optimalizovaný — pro 2500 hex grid není potřeba pre-renderovat do texture. Pokud profile ukáže problém, lze přepnout v post-MVP.

## 4. Datový model

```ts
// src/features/world/tactical-map/types.ts — doplnění
export interface HexConfig {
  size: number;      // délka hrany v px (default 40)
  originX: number;   // pixel offset gridu od (0,0) v mapa-space
  originY: number;
  showGrid: boolean;
}

export interface HexCoord {
  q: number;
  r: number;
}

export interface Point {
  x: number;
  y: number;
}
```

`HexConfig` plně match BE `MapScene.config` schema (krok 10.2-prep-1).

## 5. Soubory (nové)

```
src/features/world/tactical-map/
├─ hexUtils.ts                    # math (port z Matrix HexUtils.ts)
├─ components/HexGrid.tsx          # PixiJS Graphics renderer
└─ __tests__/hexUtils.test.ts      # unit testy math
```

Modifikace:
- `types.ts` — přidání `HexConfig`, `HexCoord`, `Point`
- `TacticalMapView.tsx` — render `<HexGrid>` v `layer-grid`, dočasný demo config

## 6. UI / interakce

V 10.2b žádná interakce s gridem. Jen vizuální render. Pan/zoom z 10.2a posouvá grid spolu s mapou (root transform).

## 7. Testovací scénáře

### Unit testy `hexUtils`

- `axialToPixel(0, 0, 40)` → `(0, 0)` (origin)
- `axialToPixel(1, 0, 40)` → `(40·√3, 0)`
- `axialToPixel(0, 1, 40)` → `(40·√3/2, 60)`
- `pixelToAxial(0, 0, 40)` → `{q:0, r:0}`
- `pixelToAxial(axialToPixel(5, 3, 40), 40)` round-trip → `(5, 3)`
- `getHexCorner({0,0}, 40, 0)` → `(40·cos(-30°), 40·sin(-30°))` ≈ `(34.64, -20)`
- `getHexPoints` returns 6 corners (12 floats)
- `getHexNeighbor(0, 0, 0)` → `{q:1, r:0}`; pro všech 6 dirs
- `getHexRing(0, 0, 0)` → 1 hex (center)
- `getHexRing(0, 0, 1)` → 6 hexů (immediate neighbors)
- `getHexRing(0, 0, 2)` → 12 hexů
- `getHexesInRadius(0, 0, 0)` → 1
- `getHexesInRadius(0, 0, 1)` → 7 (1 + 6)
- `getHexesInRadius(0, 0, 2)` → 19 (1 + 6 + 12)
- `hexDistance({0,0}, {3,0})` → 3
- `hexDistance({0,0}, {2,-1})` → 2

### Integration `HexGrid`

- Render s `showGrid: false` → žádné `Graphics` instances (early return)
- Render s `showGrid: true` → Graphics má `poly` calls (mock pixi-js, count assertions)
- Theme change → re-draw (Graphics .clear() + nové polygons)

## 8. Open questions

1. **Cube-round přesnost** — Matrix `roundToHex` má klasický 3-rounding trick. Port 1:1, žádné edge cases v testech (existují stable mathematic implementace, neměl by být problém).
2. **Re-draw na pan** — v MVP triggerujeme re-draw při každém změně `viewport offset` *jen pokud výjde z cached range*. Implementačně držíme `lastRenderedCenter` a porovnáváme s aktuálním centrem mapy.
3. **Grid mimo viewport** — kreslí se i hexy mimo viewport (paddedBounds expand). To je level featura; v MVP fixní 50×50.

## 9. Akceptační kritéria

- [ ] `hexUtils.ts` exportuje 10 funkcí + 2 konstanty
- [ ] 15+ unit testů zelených (round-trip, neighbors, rings, distance)
- [ ] `<HexGrid>` renderuje viditelný hex grid s linkami `--map-grid-stroke`
- [ ] Pan + zoom z 10.2a posouvá grid hladce (single root transform)
- [ ] `showGrid: false` → žádné kreslení
- [ ] Build + lint + test pass
- [ ] Manual smoke: stránka `/svet/<id>/takticka-mapa` zobrazí fialový hex grid přes plátno
