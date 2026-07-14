/**
 * 21.3a — miniatura podzemí (canvas render bez mřížky, malé buňky).
 */
import { useEffect, useRef } from 'react';
import type { DungeonMap } from '../types';
import { drawDungeon } from '../render/drawDungeon';

export function DungeonThumb({
  dungeon,
}: {
  dungeon: DungeonMap;
}): React.ReactElement {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const cellPx = Math.max(2, Math.floor(240 / dungeon.gridWidth));
    canvas.width = dungeon.gridWidth * cellPx;
    canvas.height = dungeon.gridHeight * cellPx;
    drawDungeon(ctx, dungeon, { cellPx, showGrid: cellPx >= 5 });
  }, [dungeon]);
  return (
    <canvas
      ref={ref}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      aria-hidden
    />
  );
}
