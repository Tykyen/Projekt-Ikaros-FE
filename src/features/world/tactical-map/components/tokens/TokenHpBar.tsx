/**
 * 10.2e C2 / 10.2g — HP bar v PixiJS přes spodní hranu tokenu.
 *
 * Render-only: dostane už vyřešené `current/max` + `size` (== tokenSize).
 * Resolve HP (schéma → fallback na currentHp/maxHp) i visibility řeší volající
 * (`HpBarForToken` v TokenSprite). Tier barva přes `hpTierHex`.
 *
 * Geometrie proporcionální k `size` (roste se zoomem mapy):
 *   šířka  = size * 1.5
 *   výška  = max(3, size * 0.18)
 *   y      = size * 0.72  (sedí přes spodní hranu tokenu, ne plovoucí pod ním)
 *
 * Plán: docs/arch/phase-10/plan-10.2g (estetika tokenu).
 */
import { useCallback } from 'react';
import type { Graphics as PixiGraphics } from 'pixi.js';
import { hpTierHex } from '../../utils/hpTier';

interface Props {
  current: number;
  max: number;
  /** Poloměr tokenu (== tokenSize z TokenSprite). Řídí proporce baru. */
  size: number;
}

export function TokenHpBar({
  current,
  max,
  size,
}: Props): React.ReactElement | null {
  const width = size * 1.5;
  const height = Math.max(3, Math.round(size * 0.18));
  const radius = height * 0.4;
  const y = Math.round(size * 0.72);
  const percent = max > 0 ? Math.max(0, Math.min(1, current / max)) : 0;
  const fillColor = hpTierHex(percent, current);

  const drawTrack = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      g.roundRect(-width / 2, 0, width, height, radius);
      g.fill({ color: 0x000000, alpha: 0.6 });
      g.stroke({ color: 0x222222, width: 1, alpha: 0.8 });
    },
    [width, height, radius],
  );

  const drawFill = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      if (percent <= 0) return;
      g.roundRect(
        -width / 2 + 1,
        1,
        (width - 2) * percent,
        height - 2,
        Math.max(0, radius - 1),
      );
      g.fill({ color: fillColor, alpha: 0.95 });
    },
    [percent, fillColor, width, height, radius],
  );

  return (
    <pixiContainer label="token-hpbar" y={y}>
      <pixiGraphics draw={drawTrack} />
      <pixiGraphics draw={drawFill} />
    </pixiContainer>
  );
}
