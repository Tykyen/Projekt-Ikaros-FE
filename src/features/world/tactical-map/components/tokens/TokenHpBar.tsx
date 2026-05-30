/**
 * 10.2e C2 — HP bar v PixiJS pod tokenem (z TokenSprite).
 *
 * Hledá v systemStats damageable pole + matching .max. Tier color:
 *   > 60% → green, > 30% → yellow, ≤ 30% → red.
 *
 * Pokud chybí damageable field nebo current/max → null (no render).
 *
 * Plán: docs/arch/phase-10/plan-10.2e.md C2.
 */
import { useCallback } from 'react';
import type { Graphics as PixiGraphics } from 'pixi.js';
import type { SystemEntitySchema } from '../../schemas/types';
import { resolveHp, hpTierHex } from '../../utils/hpTier';

interface Props {
  schema: SystemEntitySchema | null;
  systemStats: Record<string, unknown>;
  /** Y offset od centrum tokenu (pod label). */
  y: number;
}

const BAR_WIDTH = 36;
const BAR_HEIGHT = 4;

export function TokenHpBar({
  schema,
  systemStats,
  y,
}: Props): React.ReactElement | null {
  // Hooky musí být před early-returnem (rules-of-hooks). Fallback hodnoty,
  // když HP nelze vyřešit — komponenta stejně vrátí null níže.
  const hp = resolveHp(schema, systemStats);
  const percent = hp?.percent ?? 0;
  const current = hp?.current ?? 0;
  const fillColor = hpTierHex(percent, current);

  const drawTrack = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      g.roundRect(-BAR_WIDTH / 2, 0, BAR_WIDTH, BAR_HEIGHT, 2);
      g.fill({ color: 0x000000, alpha: 0.6 });
      g.stroke({ color: 0x222222, width: 1, alpha: 0.8 });
    },
    [],
  );

  const drawFill = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      if (percent <= 0) return;
      g.roundRect(
        -BAR_WIDTH / 2 + 1,
        1,
        (BAR_WIDTH - 2) * percent,
        BAR_HEIGHT - 2,
        1,
      );
      g.fill({ color: fillColor, alpha: 0.95 });
    },
    [percent, fillColor],
  );

  if (!hp) return null;

  return (
    <pixiContainer label="token-hpbar" y={y}>
      <pixiGraphics draw={drawTrack} />
      <pixiGraphics draw={drawFill} />
    </pixiContainer>
  );
}
