/**
 * 10.2h — PixiJS renderer mlhy války (do `layer-fog` containeru).
 *
 * Render strategie (varianta B z plánu — spike ukázal, že RenderTexture by u
 * celoplošného fogu narazila na paměťový strop a vyžadovala imperativní
 * lifecycle cizí téhle deklarativní codebase):
 *
 *   - JEDEN `Graphics` (jeden GPU batch, ne tisíce DOM elementů jako Matrix SVG)
 *     iteruje hexy v bbox mapy (stejný rozsah + culling jako `HexGrid`).
 *   - Fog poly se kreslí jen na hexech, které NEJSOU efektivně odhalené.
 *   - `BlurFilter` dává měkké („péřové") okraje mezi mlhou a odhaleným.
 *
 * Barva + průhlednost dle role: PJ vidí skrz (alpha ~0.16), hráč ne (~0.94) —
 * `--map-fog-pj-fill` / `--map-fog-player-fill`. Renderuje se jen když
 * `scene.fogEnabled` (gate v `TacticalMapView`).
 *
 * Spec: docs/arch/phase-10/spec-10.2h.md.
 */
import type { Graphics as PixiGraphics } from 'pixi.js';
import { BlurFilter } from 'pixi.js';
import { useCallback, useMemo } from 'react';
import { getGridAdapter } from '../../grid';
import { parseHexColor } from '../../hooks/useMapTheme';
import { hexKey, parseAlpha } from './fogUtils';
import type { MapBounds } from '../HexGrid';
import type { HexConfig, MapThemeColors } from '../../types';

// Stejný iterační rozsah + lem jako HexGrid (fog pokrývá přesně grid pattern).
const HEX_RANGE = 80;
const HEX_PADDING = 3;

const FALLBACK_BOUNDS: MapBounds = {
  x: -2000,
  y: -2000,
  width: 4000,
  height: 4000,
};

interface Props {
  /** Efektivně odhalené hexy (`revealedHexes` ∪ PC tokeny) — klíče `"q,r"`. */
  revealedSet: Set<string>;
  config: HexConfig;
  mapBounds: MapBounds | null;
  theme: MapThemeColors;
  /** PJ vidí poloprůsvitnou mlhu (ví, kde hráč nevidí); hráč téměř opaque. */
  isPJ: boolean;
}

export function FogLayer({
  revealedSet,
  config,
  mapBounds,
  theme,
  isPJ,
}: Props): React.ReactElement {
  const fill = isPJ ? theme.fogPjFill : theme.fogPlayerFill;
  const color = parseHexColor(fill);
  const alpha = parseAlpha(fill);
  const bounds = mapBounds ?? FALLBACK_BOUNDS;
  // 15.2 — geometrie fog buněk dle typu mřížky scény.
  const adapter = getGridAdapter(config.gridType);

  // Blur = měkké okraje. Strength v map-space px (Matrix feather ≈ size*0.18).
  const blur = useMemo(
    () => new BlurFilter({ strength: Math.max(2, config.size * 0.18) }),
    [config.size],
  );

  const draw = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      const padding = HEX_PADDING * config.size;
      const minX = bounds.x - padding;
      const maxX = bounds.x + bounds.width + padding;
      const minY = bounds.y - padding;
      const maxY = bounds.y + bounds.height + padding;

      for (let q = -HEX_RANGE; q <= HEX_RANGE; q++) {
        for (let r = -HEX_RANGE; r <= HEX_RANGE; r++) {
          const center = adapter.toPixel(q, r, config.size);
          center.x += config.originX;
          center.y += config.originY;
          if (
            center.x < minX ||
            center.x > maxX ||
            center.y < minY ||
            center.y > maxY
          ) {
            continue;
          }
          if (revealedSet.has(hexKey(q, r))) continue; // odhalený → bez mlhy
          // Mírné překrytí (×1.05), ať mezi sousedy nevzniká neostrá mezera.
          g.poly(adapter.cellPoly(center, config.size * 1.05));
        }
      }
      // Single fill po loopu — všechny zamlžené buňky jednou barvou.
      g.fill({ color, alpha });
    },
    [revealedSet, config, bounds, color, alpha, adapter],
  );

  return <pixiGraphics label="fog" draw={draw} filters={[blur]} />;
}
