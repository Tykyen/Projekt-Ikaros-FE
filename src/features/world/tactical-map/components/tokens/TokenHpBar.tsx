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

interface Props {
  schema: SystemEntitySchema | null;
  systemStats: Record<string, unknown>;
  /** Y offset od centrum tokenu (pod label). */
  y: number;
}

const BAR_WIDTH = 36;
const BAR_HEIGHT = 4;

function findDamageableField(
  schema: SystemEntitySchema | null,
): string | null {
  if (!schema) return null;
  for (const section of schema.sections) {
    for (const field of section.fields) {
      if (field.combatBehavior === 'damageable') return field.key;
    }
  }
  return null;
}

export function TokenHpBar({
  schema,
  systemStats,
  y,
}: Props): React.ReactElement | null {
  const damageableKey = findDamageableField(schema);
  if (!damageableKey) return null;

  const current =
    typeof systemStats[damageableKey] === 'number'
      ? (systemStats[damageableKey] as number)
      : 0;

  // Najdi matching .max key (např. health.current → health.max).
  const maxKey = damageableKey.includes('.current')
    ? damageableKey.replace('.current', '.max')
    : `${damageableKey}.max`;
  const max =
    typeof systemStats[maxKey] === 'number'
      ? (systemStats[maxKey] as number)
      : current > 0
        ? current
        : 10;
  if (max <= 0) return null;

  const percent = Math.max(0, Math.min(1, current / max));
  const fillColor =
    percent > 0.6 ? 0x44dd66 : percent > 0.3 ? 0xffaa30 : 0xff4060;

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

  return (
    <pixiContainer label="token-hpbar" y={y}>
      <pixiGraphics draw={drawTrack} />
      <pixiGraphics draw={drawFill} />
    </pixiContainer>
  );
}
