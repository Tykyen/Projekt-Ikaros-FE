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
  DungeonNote,
  DoorCellType,
  MapKind,
} from '../types';
import { blocksSightCity, isDoorType, isWalkable } from '../types';
import {
  PAPER_COLORS,
  drawDoorGlyph,
  drawStairsGlyph,
  drawTerrainGlyph,
  drawDecorationGlyph,
  drawCityCellGlyph,
  drawWildernessCellGlyph,
  drawFloorVariant,
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

/** 21.3e — kind-aware legenda (LegendBar i PNG export kreslí přes `draw`). */
export interface LegendItem {
  key: string;
  label: string;
  draw: (ctx: CanvasRenderingContext2D, s: number) => void;
}

export function legendItemsFor(kind: MapKind): LegendItem[] {
  if (kind === 'wilderness') {
    return (
      [
        ['forest', 'Les'],
        ['mountain', 'Hory'],
        ['hill', 'Kopce'],
        ['field', 'Pole'],
        ['swamp', 'Mokřad'],
        ['path', 'Cesta'],
      ] as const
    )
      .map(
        ([type, label]): LegendItem => ({
          key: type,
          label,
          draw: (ctx, s) => drawWildernessCellGlyph(ctx, type, s),
        }),
      )
      .concat([
        {
          key: 'building',
          label: 'Stavení',
          draw: (ctx, s) => drawCityCellGlyph(ctx, 'building', s),
        },
      ]);
  }
  if (kind === 'city') {
    return (
      [
        ['building', 'Budova'],
        ['street', 'Ulice'],
        ['city-wall', 'Hradby'],
        ['gate', 'Brána'],
        ['bridge', 'Most'],
      ] as const
    ).map(([type, label]) => ({
      key: type,
      label,
      draw: (ctx, s) => drawCityCellGlyph(ctx, type, s),
    }));
  }
  return LEGEND_ITEMS.map((i) => ({
    key: i.type,
    label: i.label,
    draw: (ctx, s) => drawDoorGlyph(ctx, i.type, s),
  }));
}

export interface DrawableDungeon {
  gridWidth: number;
  gridHeight: number;
  cells: DungeonCell[][];
  decorations: DungeonDecoration[];
  /** 21.3e — druh mapy; bez pole = dungeon. */
  mapKind?: MapKind;
  /** 21.3f — klíč mapy; s `frame` se tiskne pod legendu. */
  notes?: DungeonNote[];
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

/**
 * 21.3f — zalomené řádky klíče mapy pro PNG (aproximace šířky znaku;
 * cap 40 položek × 300 znaků, ať se rám nezvrhne v knihu).
 */
function noteLines(
  dungeon: Pick<DrawableDungeon, 'gridWidth' | 'notes'>,
  opts: DrawOptions,
): { text: string; bold: boolean }[] {
  const notes = (dungeon.notes ?? []).filter(
    (n) => n.title.trim() || n.text.trim(),
  );
  if (!opts.frame || notes.length === 0) return [];
  const fontSize = Math.max(10, Math.round(opts.cellPx * 0.45));
  const innerW = dungeon.gridWidth * opts.cellPx;
  const charsPerLine = Math.max(20, Math.floor(innerW / (fontSize * 0.52)));
  const lines: { text: string; bold: boolean }[] = [];
  for (const n of notes.slice(0, 40)) {
    lines.push({
      text: `${n.label}. ${n.title.trim() || '—'}`,
      bold: true,
    });
    const words = n.text.trim().slice(0, 300).split(/\s+/).filter(Boolean);
    let line = '';
    for (const word of words) {
      if ((line + ' ' + word).trim().length > charsPerLine) {
        lines.push({ text: line.trim(), bold: false });
        line = word;
      } else {
        line = `${line} ${word}`;
      }
    }
    if (line.trim()) lines.push({ text: line.trim(), bold: false });
  }
  return lines;
}

const noteLineH = (opts: DrawOptions): number =>
  Math.round(Math.max(10, Math.round(opts.cellPx * 0.45)) * 1.4);

/** Celkové rozměry kresby (mapa + případný rám, legenda a klíč mapy). */
export function measureDungeon(
  dungeon: Pick<DrawableDungeon, 'gridWidth' | 'gridHeight' | 'notes'>,
  opts: DrawOptions,
): { width: number; height: number; pad: number } {
  const { pad, legendH } = frameMetrics(opts);
  const lines = noteLines(dungeon, opts);
  const keyH = lines.length
    ? lines.length * noteLineH(opts) + noteLineH(opts)
    : 0;
  return {
    width: dungeon.gridWidth * opts.cellPx + 2 * pad,
    height: dungeon.gridHeight * opts.cellPx + 2 * pad + legendH + keyH,
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

/** 21.3e — osa městské buňky (hradba běží podél sousedních hradeb apod.). */
function cityAxis(
  cells: DungeonCell[][],
  x: number,
  y: number,
  type: DungeonCell['type'],
): PassageAxis {
  const typeAt = (cx: number, cy: number): DungeonCell['type'] | undefined =>
    cy >= 0 && cy < cells.length && cx >= 0 && cx < (cells[0]?.length ?? 0)
      ? cells[cy][cx]?.type
      : undefined;
  if (type === 'city-wall') {
    // Zeď se kreslí PODÉL svého běhu.
    const along = (t: DungeonCell['type'] | undefined): boolean =>
      t === 'city-wall' || t === 'gate';
    return along(typeAt(x - 1, y)) || along(typeAt(x + 1, y)) ? 'h' : 'v';
  }
  if (type === 'bridge') {
    // Most podél směru cesty (sousední most/ulice/brána).
    const road = (t: DungeonCell['type'] | undefined): boolean =>
      t === 'bridge' || t === 'street' || t === 'gate';
    return road(typeAt(x - 1, y)) || road(typeAt(x + 1, y)) ? 'h' : 'v';
  }
  // Brána: průchod vede tam, kde NEjsou blokující sousedé; mimo grid = volno.
  const open = (cx: number, cy: number): boolean => {
    const t = typeAt(cx, cy);
    return t === undefined ? true : !blocksSightCity(t);
  };
  if (open(x - 1, y) && open(x + 1, y)) return 'h';
  if (open(x, y - 1) && open(x, y + 1)) return 'v';
  return 'h';
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

  // ── Rám (pergamen) ── výška zahrnuje i klíč mapy (21.3f).
  const keyLines = noteLines(dungeon, opts);
  const keyH = keyLines.length
    ? keyLines.length * noteLineH(opts) + noteLineH(opts)
    : 0;
  if (opts.frame) {
    ctx.fillStyle = PAPER_COLORS.parchment;
    ctx.fillRect(0, 0, w * s + 2 * pad, h * s + 2 * pad + legendH + keyH);
    ctx.strokeStyle = PAPER_COLORS.parchmentEdge;
    ctx.lineWidth = Math.max(2, s * 0.12);
    ctx.strokeRect(
      ctx.lineWidth / 2,
      ctx.lineWidth / 2,
      w * s + 2 * pad - ctx.lineWidth,
      h * s + 2 * pad + legendH + keyH - ctx.lineWidth,
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
  const kind: MapKind =
    dungeon.mapKind === 'city' || dungeon.mapKind === 'wilderness'
      ? dungeon.mapKind
      : 'dungeon';
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const cell = dungeon.cells[y]?.[x];
      const type = cell?.type ?? 'empty';
      // 21.3e — město: `empty` = volný terén (papír), případně s povrchem.
      if (kind === 'city' && (type === 'empty' || type === 'street')) {
        inCell(ctx, x, y, s, 'h', 0, () => {
          if (type === 'street') drawCityCellGlyph(ctx, 'street', s);
          if (cell?.floorVariant)
            drawFloorVariant(ctx, cell.floorVariant as string, s);
        });
        continue;
      }
      // 21.3g — krajina: `empty` = louka; `street` = polní cesta; terény
      // mají vlastní glyfy (variant = parita buňky → střídání vzoru orby).
      if (kind === 'wilderness') {
        if (type === 'empty' || type === 'street') {
          inCell(
            ctx,
            x,
            y,
            s,
            type === 'street' ? cityAxis(dungeon.cells, x, y, 'bridge') : 'h',
            0,
            () => {
              if (cell?.floorVariant)
                drawFloorVariant(ctx, cell.floorVariant as string, s);
              if (type === 'street') drawWildernessCellGlyph(ctx, 'path', s);
            },
          );
          continue;
        }
        if (
          type === 'forest' ||
          type === 'mountain' ||
          type === 'hill' ||
          type === 'field' ||
          type === 'swamp'
        ) {
          inCell(ctx, x, y, s, 'h', 0, () =>
            drawWildernessCellGlyph(ctx, type, s, x + y * 31),
          );
          continue;
        }
      }
      switch (type) {
        case 'empty':
        case 'wall':
          ctx.fillStyle = PAPER_COLORS.rock;
          ctx.fillRect(x * s, y * s, s, s);
          break;
        case 'floor':
          // 21.3d — jemné šrafování povrchu (dlažba/dřevo/hlína/…).
          if (cell?.floorVariant) {
            inCell(ctx, x, y, s, 'h', 0, () =>
              drawFloorVariant(ctx, cell.floorVariant as string, s),
            );
          }
          break;
        case 'building':
        case 'city-wall':
        case 'gate':
        case 'bridge':
          inCell(ctx, x, y, s, cityAxis(dungeon.cells, x, y, type), 0, () =>
            drawCityCellGlyph(ctx, type, s),
          );
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
    for (const item of legendItemsFor(kind)) {
      ctx.save();
      ctx.translate(cx, 0);
      item.draw(ctx, glyphS);
      ctx.restore();
      ctx.fillStyle = PAPER_COLORS.parchmentInk;
      ctx.fillText(item.label, cx + glyphS * 1.25, glyphS / 2);
      cx += glyphS * 1.6 + ctx.measureText(item.label).width + glyphS * 0.9;
    }
    ctx.restore();
  }

  // ── Klíč mapy (21.3f) — pod legendou ──
  if (opts.frame && keyLines.length > 0) {
    const fontSize = Math.max(10, Math.round(s * 0.45));
    const lineH = noteLineH(opts);
    let ly = h * s + 2 * pad + legendH + lineH * 0.8;
    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = PAPER_COLORS.parchmentInk;
    for (const line of keyLines) {
      ctx.font = `${line.bold ? 'bold ' : ''}${fontSize}px system-ui, sans-serif`;
      ctx.fillText(line.text, pad, ly);
      ly += lineH;
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
