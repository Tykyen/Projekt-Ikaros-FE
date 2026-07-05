/**
 * 17.1 — vizualizace zdrojů světla (import UVTT `lights`) v temné scéně.
 *
 * Funkčně světla osvětlují buňky už v `computeVisionReveal` (LoS ořez). Tahle
 * vrstva jen dodá jejich *vzhled* — měkký radiální glow. Renderuje se jen když
 * `config.darkness` (v jasné scéně by světlo nebylo poznat).
 *
 * Jeden `<pixiGraphics>` s `blendMode='add'` (světla se sčítají) + `BlurFilter`
 * (měkký okraj, vzor `FogLayer`).
 *
 * Spec: docs/arch/phase-17/spec-17.1.md §4.
 */
import type { Graphics as PixiGraphics } from 'pixi.js';
import { BlurFilter } from 'pixi.js';
import { useCallback, useMemo } from 'react';
import { parseHexColor } from '../hooks/useMapTheme';
import type { MapLight } from '../types';

const LIGHT_ALPHA = 0.18;

interface Props {
  lights: MapLight[];
  /** Renderovat jen v temné scéně. */
  visible: boolean;
}

export function LightsLayer({
  lights,
  visible,
}: Props): React.ReactElement | null {
  const blur = useMemo(() => new BlurFilter({ strength: 12 }), []);

  const draw = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      if (!visible) return;
      for (const l of lights) {
        if (l.range <= 0) continue;
        g.circle(l.x, l.y, l.range);
        g.fill({
          color: parseHexColor(l.color),
          alpha: LIGHT_ALPHA * Math.min(1, Math.max(0.2, l.intensity)),
        });
      }
    },
    [lights, visible],
  );

  if (!visible || lights.length === 0) return null;

  return (
    <pixiGraphics label="lights" draw={draw} filters={[blur]} blendMode="add" />
  );
}
