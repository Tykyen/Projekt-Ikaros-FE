/**
 * 10.2b — PixiJS Graphics renderer hex gridu (@pixi/react v8 idiom).
 *
 * Strategie:
 * - `pixiGraphics draw={callback}` — declarativní API v8. Callback se
 *   zavolá s instancí Graphics, kdykoliv React zjistí změnu callbacku.
 * - `draw` memoizovaný `useCallback([config, theme, mapBounds])` — re-draw
 *   jen při změně config, skinu, nebo rozměrů mapy.
 * - `showGrid: false` nebo chybějící `mapBounds` → komponenta vrátí `null`,
 *   žádné kreslení (mapa bez image = žádný hex pattern).
 *
 * 10.2c-edit-5 — bbox culling: hex pattern lemuje jen `HEX_PADDING` hexů
 * kolem mapy (image), ne přes celý viewport. Šířka lemu = 3 hexy × hex size.
 *
 * Spec: docs/arch/phase-10/spec-10.2b.md §3.3, §3.4.
 */
import type { Graphics } from 'pixi.js';
import { useCallback } from 'react';
import { getGridAdapter } from '../grid';
import type { HexConfig, MapThemeColors } from '../types';

// 10.2c-edit-5 — iteration range zůstává ±80 (25921 kandidátů), uvnitř
// culling drop na ~mapa+lem. Range stačí pro mapy ~6400 px × 6400 px;
// pro větší mapy 10.2m polishing přidá adaptive range z bbox.
const HEX_RANGE = 80;
// Šířka lemu kolem mapy v počtu hexů. 3 hexy × hex size.
const HEX_PADDING = 3;

export interface MapBounds {
  /** Top-left v map-space (px). */
  x: number;
  y: number;
  /** Rozměry sprite mapy v map-space (px, už × backgroundScale). */
  width: number;
  height: number;
}

interface Props {
  config: HexConfig;
  theme: MapThemeColors;
  /**
   * 10.2c-edit-5 — bbox mapy (z `MapBackground.onLoad`). Pokud `null`,
   * HexGrid nekreslí nic (žádná mapa = žádný hex pattern).
   */
  mapBounds: MapBounds | null;
}

// 10.2c-edit-9e — defaultní bbox pokud scéna nemá pozadí (`imageUrl` null).
// Bez tohoto user vidí černý viewport — `mapBounds=null` → HexGrid skipne
// render. Default bbox dá hex grid přes ±2000 px ze středu, dostatek pro
// boj bez mapy.
const FALLBACK_BOUNDS: MapBounds = {
  x: -2000,
  y: -2000,
  width: 4000,
  height: 4000,
};

export function HexGrid({
  config,
  theme,
  mapBounds,
}: Props): React.ReactElement | null {
  // Pokud scéna nemá pozadí (mapBounds null), použij fallback bbox aby
  // user viděl alespoň grid (nikoli prázdný černý viewport).
  const effectiveBounds = mapBounds ?? FALLBACK_BOUNDS;
  // 15.2 — typ mřížky řídí geometrii. `none` → drawsGrid:false (žádné čáry).
  const adapter = getGridAdapter(config.gridType);
  const visible = adapter.drawsGrid && config.showGrid;

  const draw = useCallback(
    (g: Graphics) => {
      g.clear();
      if (!visible) return;
      const originX = config.originX;
      const originY = config.originY;
      const padding = HEX_PADDING * config.size;
      const minX = effectiveBounds.x - padding;
      const maxX = effectiveBounds.x + effectiveBounds.width + padding;
      const minY = effectiveBounds.y - padding;
      const maxY = effectiveBounds.y + effectiveBounds.height + padding;

      for (let q = -HEX_RANGE; q <= HEX_RANGE; q++) {
        for (let r = -HEX_RANGE; r <= HEX_RANGE; r++) {
          const center = adapter.toPixel(q, r, config.size);
          center.x += originX;
          center.y += originY;
          if (
            center.x < minX ||
            center.x > maxX ||
            center.y < minY ||
            center.y > maxY
          ) {
            continue;
          }
          g.poly(adapter.cellPoly(center, config.size));
        }
      }
      // Single stroke call po loopu — všechny polygony obtažené stejnou linkou.
      g.stroke({
        color: theme.gridStroke,
        width: theme.gridStrokeWidth,
        alpha: 1,
      });
    },
    [config, theme, effectiveBounds, adapter, visible],
  );

  if (!visible) return null;

  return <pixiGraphics label="hex-grid" draw={draw} />;
}
