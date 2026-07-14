/**
 * 21.3a — donjon renderer (canvas 2D). Jediný zdroj vzhledu pro editor,
 * miniatury v seznamu i PNG export (stejné kreslení, jiný cíl/rozlišení).
 *
 * Vzhled: bílý „papír" s jemnou mřížkou, černý skalní masiv, glyfy dveří dle
 * legendy, volitelný pergamenový rám + legenda (PNG export).
 */
import type {
  DungeonCell,
  DungeonDecoration,
  DoorCellType,
} from '../types';
import { isDoorType, isWalkable } from '../types';
import {
  PAPER_COLORS,
  drawDoorGlyph,
  drawStairsGlyph,
  drawTerrainGlyph,
  drawDecorationGlyph,
  type PassageAxis,
} from './glyphs';

/** Legenda dveřních glyfů (pořadí = reference od uživatele). */
export const LEGEND_ITEMS: readonly { type: DoorCellType; label: string }[] = [
  { type: 'archway', label: 'Průchod' },
  { type: 'door', label: 'Dveře' },
  { type: 'door-locked', label: 'Zamčené' },
  { type: 'door-trapped', label: 'S pastí' },
  { type: 'door-secret', label: 'Tajné dveře' },
  { type: 'portcullis', label: 'Padací mříž' },
];

export interface DrawableDungeon {
  gridWidth: number;
  gridHeight: number;
  cells: DungeonCell[][];
  decorations: DungeonDecoration[];
}

export interface DrawOptions {
  /** Velikost buňky v px (v transformovaném prostoru). */
  cellPx: number;
  /** Mřížka na podlaze (default true). */
  showGrid?: boolean;
  /** Pergamenový rám + legenda (PNG export / náhled „na papíře"). */
  frame?: boolean;
}

const FRAME_PAD_RATIO = 1.1;
const LEGEND_H_RATIO = 1.6;

export function frameMetrics(opts: DrawOptions): {
  pad: number;
  legendH: number;
} {
  if (!opts.frame) return { pad: 0, legendH: 0 };
  const pad = Math.max(16, Math.round(opts.cellPx * FRAME_PAD_RATIO));
  return { pad, legendH: Math.round(opts.cellPx * LEGEND_H_RATIO) };
}

/** Celkové rozměry kresby (mapa + případný rám a legenda). */
export function measureDungeon(
  dungeon: Pick<DrawableDungeon, 'gridWidth' | 'gridHeight'>,
  opts: DrawOptions,
): { width: number; height: number; pad: number } {
  const { pad, legendH } = frameMetrics(opts);
  return {
    width: dungeon.gridWidth * opts.cellPx + 2 * pad,
    height: dungeon.gridHeight * opts.cellPx + 2 * pad + legendH,
    pad,
  };
}

/** Osa průchodu pro dveře/schody podle průchozích sousedů. */
function passageAxis(
  cells: DungeonCell[][],
  x: number,
  y: number,
): PassageAxis {
  const at = (cx: number, cy: number): boolean =>
    cy >= 0 &&
    cy < cells.length &&
    cx >= 0 &&
    cx < (cells[0]?.length ?? 0) &&
    isWalkable(cells[cy][cx].type);
  if (at(x - 1, y) && at(x + 1, y)) return 'h';
  if (at(x, y - 1) && at(x, y + 1)) return 'v';
  // Fallback: aspoň jeden vodorovný soused → vodorovná chodba.
  return at(x - 1, y) || at(x + 1, y) ? 'h' : 'v';
}

/** Kreslí v rámu buňky (x,y) s normalizací osy — 'v' otočí o 90°. */
function inCell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  axis: PassageAxis,
  rotationDeg: number,
  draw: () => void,
): void {
  ctx.save();
  ctx.translate(x * s + s / 2, y * s + s / 2);
  const deg = rotationDeg + (axis === 'v' ? 90 : 0);
  if (deg) ctx.rotate((deg * Math.PI) / 180);
  ctx.translate(-s / 2, -s / 2);
  draw();
  ctx.restore();
}

/**
 * Vykreslí podzemí do ctx s počátkem (0,0). Volající si předem nastaví
 * transform (zoom/pan editoru, DPR škálování…).
 */
export function drawDungeon(
  ctx: CanvasRenderingContext2D,
  dungeon: DrawableDungeon,
  opts: DrawOptions,
): void {
  const s = opts.cellPx;
  const w = dungeon.gridWidth;
  const h = dungeon.gridHeight;
  const { pad, legendH } = frameMetrics(opts);
  const showGrid = opts.showGrid !== false;

  // ── Rám (pergamen) ──
  if (opts.frame) {
    ctx.fillStyle = PAPER_COLORS.parchment;
    ctx.fillRect(0, 0, w * s + 2 * pad, h * s + 2 * pad + legendH);
    ctx.strokeStyle = PAPER_COLORS.parchmentEdge;
    ctx.lineWidth = Math.max(2, s * 0.12);
    ctx.strokeRect(
      ctx.lineWidth / 2,
      ctx.lineWidth / 2,
      w * s + 2 * pad - ctx.lineWidth,
      h * s + 2 * pad + legendH - ctx.lineWidth,
    );
  }

  ctx.save();
  ctx.translate(pad, pad);

  // ── Papír + mřížka ──
  ctx.fillStyle = PAPER_COLORS.paper;
  ctx.fillRect(0, 0, w * s, h * s);
  if (showGrid) {
    ctx.strokeStyle = PAPER_COLORS.grid;
    ctx.lineWidth = Math.max(0.5, s * 0.03);
    ctx.beginPath();
    for (let x = 0; x <= w; x++) {
      ctx.moveTo(x * s, 0);
      ctx.lineTo(x * s, h * s);
    }
    for (let y = 0; y <= h; y++) {
      ctx.moveTo(0, y * s);
      ctx.lineTo(w * s, y * s);
    }
    ctx.stroke();
  }

  // ── Buňky ──
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const type = dungeon.cells[y]?.[x]?.type ?? 'empty';
      switch (type) {
        case 'empty':
        case 'wall':
          ctx.fillStyle = PAPER_COLORS.rock;
          ctx.fillRect(x * s, y * s, s, s);
          break;
        case 'floor':
          break;
        case 'water':
        case 'lava':
        case 'pit':
          inCell(ctx, x, y, s, 'h', 0, () => drawTerrainGlyph(ctx, type, s));
          break;
        case 'stairs-up':
        case 'stairs-down':
          inCell(
            ctx,
            x,
            y,
            s,
            passageAxis(dungeon.cells, x, y),
            0,
            () =>
              drawStairsGlyph(ctx, type === 'stairs-up' ? 'up' : 'down', s),
          );
          break;
        default:
          if (isDoorType(type)) {
            inCell(ctx, x, y, s, passageAxis(dungeon.cells, x, y), 0, () =>
              drawDoorGlyph(ctx, type, s),
            );
          }
      }
    }
  }

  // ── Dekorace ──
  for (const dec of dungeon.decorations) {
    if (dec.cellX < 0 || dec.cellX >= w || dec.cellY < 0 || dec.cellY >= h)
      continue;
    // `const` kvůli narrowingu do closure níže (property se v closure nezúží).
    const decType = dec.type;
    if (decType === 'label') {
      ctx.fillStyle = PAPER_COLORS.inkSoft;
      ctx.font = `${Math.round(s * 0.5)}px ui-monospace, monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        dec.label ?? '',
        dec.cellX * s + s / 2,
        dec.cellY * s + s / 2,
      );
      continue;
    }
    inCell(ctx, dec.cellX, dec.cellY, s, 'h', dec.rotation, () =>
      drawDecorationGlyph(ctx, decType, s),
    );
  }

  ctx.restore();

  // ── Legenda ──
  if (opts.frame && legendH > 0) {
    const ly = h * s + 2 * pad;
    const glyphS = Math.round(legendH * 0.55);
    ctx.save();
    ctx.translate(pad, ly + (legendH - glyphS) / 2 - pad * 0.1);
    ctx.font = `${Math.max(9, Math.round(glyphS * 0.55))}px system-ui, sans-serif`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    let cx = 0;
    for (const item of LEGEND_ITEMS) {
      ctx.save();
      ctx.translate(cx, 0);
      drawDoorGlyph(ctx, item.type, glyphS);
      ctx.restore();
      ctx.fillStyle = PAPER_COLORS.parchmentInk;
      ctx.fillText(item.label, cx + glyphS * 1.25, glyphS / 2);
      cx += glyphS * 1.6 + ctx.measureText(item.label).width + glyphS * 0.9;
    }
    ctx.restore();
  }
}

/** Vyrenderuje podzemí do nového canvasu (miniatury, PNG export). */
export function renderDungeonToCanvas(
  dungeon: DrawableDungeon,
  opts: DrawOptions,
): HTMLCanvasElement {
  const { width, height } = measureDungeon(dungeon, opts);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) drawDungeon(ctx, dungeon, opts);
  return canvas;
}

/** PNG export (plné rozlišení, rám + legenda). */
export async function dungeonToPngBlob(
  dungeon: DrawableDungeon,
  cellPx = 28,
): Promise<Blob | null> {
  const canvas = renderDungeonToCanvas(dungeon, { cellPx, frame: true });
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}
