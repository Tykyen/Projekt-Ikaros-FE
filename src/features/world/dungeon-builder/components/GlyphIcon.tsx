/**
 * 21.3a — miniaturní canvas ikonky glyfů (dveře / dekorace) pro paletu a
 * legendu. Stejné kreslení jako mapa → ikonka je věrný náhled.
 */
import { useEffect, useRef } from 'react';
import type { DoorCellType, DungeonDecorationType } from '../types';
import {
  PAPER_COLORS,
  drawDoorGlyph,
  drawDecorationGlyph,
} from '../render/glyphs';

function useGlyphCanvas(
  draw: (ctx: CanvasRenderingContext2D, s: number) => void,
  size: number,
): React.RefObject<HTMLCanvasElement | null> {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = PAPER_COLORS.paper;
    ctx.fillRect(0, 0, size, size);
    draw(ctx, size);
  }, [draw, size]);
  return ref;
}

export function DoorGlyphIcon({
  type,
  size = 24,
}: {
  type: DoorCellType;
  size?: number;
}): React.ReactElement {
  const ref = useGlyphCanvas(
    (ctx, s) => drawDoorGlyph(ctx, type, s),
    size,
  );
  return (
    <canvas
      ref={ref}
      style={{ width: size, height: size, display: 'block' }}
      aria-hidden
    />
  );
}

export function DecorationGlyphIcon({
  type,
  size = 24,
}: {
  type: Exclude<DungeonDecorationType, 'label'>;
  size?: number;
}): React.ReactElement {
  const ref = useGlyphCanvas(
    (ctx, s) => drawDecorationGlyph(ctx, type, s),
    size,
  );
  return (
    <canvas
      ref={ref}
      style={{ width: size, height: size, display: 'block' }}
      aria-hidden
    />
  );
}
