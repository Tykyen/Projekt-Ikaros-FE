# Plan 10.2b — Hex mřížka

**Spec:** [spec-10.2b.md](spec-10.2b.md)
**Status:** ✅ **HOTOVO** — 3 commity na main (2026-05-27)
**Velikost:** **S** (3 commity, ~1 h)

---

## Pořadí commitů (přímo na `main`)

| Commit | Co | Soubory |
|---|---|---|
| **C1** | `hexUtils.ts` math + types extension + unit testy | `hexUtils.ts`, `types.ts` mod, `__tests__/hexUtils.test.ts` |
| **C2** | `HexGrid` komponenta + integrace v `TacticalMapView` | `components/HexGrid.tsx`, `TacticalMapView.tsx` mod |
| **C3** | Plan DONE + roadmap odškrtnutí | doc updates |

---

## Pre-decisions z spec §8

| # | Otázka | Rozhodnutí |
|---|---|---|
| 1 | Cube-round přesnost | Port 1:1 z Matrix, žádná modifikace |
| 2 | Re-draw trigger | V MVP: `useEffect` deps `[config, theme]` (žádný viewport culling) |
| 3 | Grid mimo viewport | Fixní 50×50 hex range (±25 v obou osách) kolem origin |

---

## Detail

### C1 — hexUtils + types + testy

**`src/features/world/tactical-map/types.ts`** — přidat:
```ts
export interface HexConfig {
  size: number;
  originX: number;
  originY: number;
  showGrid: boolean;
}
export interface HexCoord { q: number; r: number }
export interface Point { x: number; y: number }
```

**`src/features/world/tactical-map/hexUtils.ts`** — port z Matrix `frontend/src/components/Map/HexUtils.ts`. 10 funkcí + `AXIAL_DIRECTIONS` konstanta. Plus nový `hexDistance` pro 10.2m.

**`__tests__/hexUtils.test.ts`** — pokrytí per spec §7 (15+ scénářů).

**Acceptance:** `vitest run hexUtils` → 15+ tests zelené. TS clean.

**Commit:**
```
feat(10.2b): hexUtils math (port z Matrixu) + 15 unit testů

Port Matrix frontend/src/components/Map/HexUtils.ts 1:1:
- axialToPixel / pixelToAxial (s cube-round)
- getHexCorner / getHexPoints
- getHexNeighbor / getHexRing / getHexesInRadius
- AXIAL_DIRECTIONS konstanta

Nové oproti Matrixu:
- hexDistance(a, b) — axial distance pro 10.2m measure tool

Types extension: HexConfig + HexCoord + Point.

Spec: docs/arch/phase-10/spec-10.2b.md §3, §4.
```

---

### C2 — HexGrid + integrace

**`src/features/world/tactical-map/components/HexGrid.tsx`:**

```tsx
import { useEffect, useRef } from 'react';
import { Graphics } from 'pixi.js';
import { extend } from '@pixi/react';
import { axialToPixel, getHexPoints } from '../hexUtils';
import type { HexConfig, MapThemeColors } from '../types';

extend({ Graphics });

interface Props {
  config: HexConfig;
  theme: MapThemeColors;
}

const HEX_RANGE = 25; // ±25 hexů v obou osách = 51×51 = 2601 hexů

export function HexGrid({ config, theme }: Props) {
  const gRef = useRef<Graphics | null>(null);

  useEffect(() => {
    if (!gRef.current || !config.showGrid) return;
    const g = gRef.current;
    g.clear();
    const origin = { x: config.originX, y: config.originY };

    for (let q = -HEX_RANGE; q <= HEX_RANGE; q++) {
      for (let r = -HEX_RANGE; r <= HEX_RANGE; r++) {
        const center = axialToPixel(q, r, config.size);
        center.x += origin.x;
        center.y += origin.y;
        const pts = getHexPoints(center, config.size);
        // pts je flat array [x0,y0,x1,y1,...x5,y5] — PixiJS Graphics poly chce
        g.poly(pts);
      }
    }
    g.stroke({ color: theme.gridStroke, width: theme.gridStrokeWidth, alpha: 1 });
  }, [config, theme]);

  if (!config.showGrid) return null;

  return <pixiGraphics ref={gRef} label="hex-grid" />;
}
```

**Pozor:** `getHexPoints` ve spec vrací string `"x0,y0 x1,y1 ..."`  (SVG format z Matrixu). Pro PixiJS chceme number array. Buď přepsat `getHexPoints` aby vracelo `number[]`, nebo přidat alternativní `getHexPolyPoints` co vrací `[x,y,x,y,...]`.

**Rozhodnutí:** Přidat **`getHexPolyPoints` (number[])** vedle stávajícího `getHexPoints` (string). PixiJS konzument bere number[], Matrix vzor bral string pro SVG `points` attribute. Oba zachované — různé render targety mají různé typy.

**`TacticalMapView.tsx`** — integrace:
```tsx
// Demo config — plný load v 10.2c
const demoHexConfig: HexConfig = useMemo(
  () => ({ size: 40, originX: 0, originY: 0, showGrid: true }),
  [],
);

// V <pixiContainer label="layer-grid">:
<HexGrid config={demoHexConfig} theme={theme} />
```

**Test `HexGrid.test.tsx`:** integration test s mock PixiJS (snadnější) — verify `clear()` + `poly()` × N count + `stroke()` call.

**Acceptance:**
- Build pass, TS clean
- Manual smoke: hex grid viditelný na taktické mapě (fialové linky)
- Zoom + pan posouvá grid hladce
- Refresh persists scroll + zoom + grid stále viditelný

**Commit:**
```
feat(10.2b): HexGrid PixiJS komponenta + integrace v TacticalMapView

HexGrid.tsx:
- pixiGraphics single instance (useRef), re-draw v useEffect [config, theme]
- Loop přes ±25 hexů v obou osách (2601 hexů, fixed range MVP)
- axialToPixel pro každý hex → getHexPolyPoints (number[]) → Graphics.poly()
- Single stroke() call po loopu (1 PixiJS render fáze)
- early-return null když showGrid=false

hexUtils.ts: bonus getHexPolyPoints (number[] pro PixiJS) vedle původního
getHexPoints (string pro SVG) — různé render targety.

TacticalMapView.tsx:
- useMemo demo config { size:40, origin:0/0, showGrid:true }
- <HexGrid config={demoHexConfig} theme={theme} /> v layer-grid container

Plný config (per scena) přijde v 10.2c po scene load integration.
```

---

### C3 — Plan DONE + roadmap

- `plan-10.2b.md` status DRAFT → ✅ HOTOVO
- `roadmap-fe.md` 10.2b odškrtnout + popis commitů

---

## Závěrečný checklist

- [ ] `npm run build` pass
- [ ] `vitest run hexUtils` zelený (15+ tests)
- [ ] `vitest run` celé suite zelená (no regression)
- [ ] Manual smoke: hex grid viditelný na `/svet/<id>/takticka-mapa`
- [ ] Pan + zoom posouvá grid spolu s mapou
- [ ] Refresh + nová sezení zachová zoom/offset

---

## Open risks

- **PixiJS v8 `Graphics.poly()` argument shape** — některé v8 API změny. Pokud `poly()` chce object místo array, refactor `getHexPolyPoints` na `Point[]` formát. Verify v C2 manuální smoke.
