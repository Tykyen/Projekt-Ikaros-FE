/**
 * 17.1 — line-of-sight / dynamická viditelnost (klient-side raycasting).
 *
 * Čisté funkce (bez PIXI/DOM) → testovatelné. Výstup je množina viditelných
 * buněk `Set<"q,r">`, kterou konzumuje stávající `FogLayer` (žádný nový
 * render — LoS jen nahrazuje ruční štětec jako zdroj `revealedSet`).
 *
 * Algoritmus viditelnostního polygonu = angle-sweep (Red Blob Games):
 * na úhly endpointů zdí vrhneme paprsky (± ε pro obtečení rohů), najdeme
 * nejbližší průsečík a body seřadíme podle úhlu.
 *
 * Spec: docs/arch/phase-17/spec-17.1.md §2.
 */
import { getGridAdapter } from '../grid';
import type { MapBounds } from '../components/HexGrid';
import type { HexConfig, HexCoord, MapLight, MapToken, MapWall, Point } from '../types';

export interface Segment {
  ax: number;
  ay: number;
  bx: number;
  by: number;
}

/** Malé pootočení paprsku pro obtečení rohů (radiány). */
const EPS = 0.00001;
/** Dosvit tokenu v temné scéně, když `visionRange` není nastaven (buňky). */
const DEFAULT_DARK_VISION = 4;

/**
 * Zdi → úsečky blokující výhled. Otevřené dveře a `blocksSight === false`
 * se vynechají (neblokují).
 */
export function wallsToSegments(walls: MapWall[]): Segment[] {
  const segs: Segment[] = [];
  for (const w of walls) {
    if (w.blocksSight === false) continue;
    if (w.type === 'door' && w.door?.open === true) continue;
    const p = w.points;
    for (let i = 0; i + 3 < p.length; i += 2) {
      segs.push({ ax: p[i], ay: p[i + 1], bx: p[i + 2], by: p[i + 3] });
    }
  }
  return segs;
}

/** 4 okraje mapy jako segmenty — uzavře viditelnostní polygon. */
function boundsSegments(b: MapBounds): Segment[] {
  const { x, y, width: w, height: h } = b;
  return [
    { ax: x, ay: y, bx: x + w, by: y },
    { ax: x + w, ay: y, bx: x + w, by: y + h },
    { ax: x + w, ay: y + h, bx: x, by: y + h },
    { ax: x, ay: y + h, bx: x, by: y },
  ];
}

/**
 * Průsečík paprsku (origin + t·dir, t≥0, dir jednotkový) se segmentem.
 * Vrací vzdálenost `t` a bod, nebo `null` (paralelní / mimo segment / za zády).
 */
function raySegment(
  ox: number,
  oy: number,
  dx: number,
  dy: number,
  s: Segment,
): { x: number; y: number; t: number } | null {
  const sdx = s.bx - s.ax;
  const sdy = s.by - s.ay;
  const denom = dx * sdy - dy * sdx;
  if (Math.abs(denom) < 1e-12) return null; // paralelní
  const t = ((s.ax - ox) * sdy - (s.ay - oy) * sdx) / denom; // podél paprsku
  const u = ((s.ax - ox) * dy - (s.ay - oy) * dx) / denom; // podél segmentu
  if (t < 0 || u < 0 || u > 1) return null;
  return { x: ox + dx * t, y: oy + dy * t, t };
}

/**
 * Viditelnostní polygon z bodu `origin` mezi `segments` (uvnitř `bounds`).
 * Vrací vrcholy polygonu (map-space px) seřazené dle úhlu.
 */
export function computeVisibilityPolygon(
  origin: Point,
  segments: Segment[],
  bounds: MapBounds,
): Point[] {
  const all = [...segments, ...boundsSegments(bounds)];
  const ox = origin.x;
  const oy = origin.y;

  // Úhly na endpointy (± ε).
  const angles: number[] = [];
  for (const s of all) {
    const a1 = Math.atan2(s.ay - oy, s.ax - ox);
    const a2 = Math.atan2(s.by - oy, s.bx - ox);
    angles.push(a1 - EPS, a1, a1 + EPS, a2 - EPS, a2, a2 + EPS);
  }

  const hits: { angle: number; x: number; y: number }[] = [];
  for (const ang of angles) {
    const dx = Math.cos(ang);
    const dy = Math.sin(ang);
    let bestT = Infinity;
    let bx = 0;
    let by = 0;
    for (const s of all) {
      const hit = raySegment(ox, oy, dx, dy, s);
      if (hit && hit.t < bestT) {
        bestT = hit.t;
        bx = hit.x;
        by = hit.y;
      }
    }
    if (Number.isFinite(bestT)) hits.push({ angle: ang, x: bx, y: by });
  }

  hits.sort((a, b) => a.angle - b.angle);
  return hits.map((h) => ({ x: h.x, y: h.y }));
}

/** Bod uvnitř polygonu (ray-cast even-odd). */
export function pointInPolygon(px: number, py: number, poly: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x;
    const yi = poly[i].y;
    const xj = poly[j].x;
    const yj = poly[j].y;
    const intersect =
      yi > py !== yj > py &&
      px < ((xj - xi) * (py - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/** Střed buňky (q,r) v map-space px (s originem configu). */
function cellCenter(
  q: number,
  r: number,
  config: HexConfig,
  adapter = getGridAdapter(config.gridType),
): Point {
  const c = adapter.toPixel(q, r, config.size);
  return { x: c.x + config.originX, y: c.y + config.originY };
}

const CELL_RANGE = 80;
const CELL_PADDING = 3;

/**
 * Buňky, jejichž střed leží uvnitř viditelnostního polygonu (bbox culling
 * dle `bounds`, stejný rozsah jako `FogLayer`).
 */
export function cellsInPolygon(
  polygon: Point[],
  config: HexConfig,
  bounds: MapBounds,
): HexCoord[] {
  if (polygon.length < 3) return [];
  const adapter = getGridAdapter(config.gridType);
  const pad = CELL_PADDING * config.size;
  const minX = bounds.x - pad;
  const maxX = bounds.x + bounds.width + pad;
  const minY = bounds.y - pad;
  const maxY = bounds.y + bounds.height + pad;

  const out: HexCoord[] = [];
  for (let q = -CELL_RANGE; q <= CELL_RANGE; q++) {
    for (let r = -CELL_RANGE; r <= CELL_RANGE; r++) {
      const c = cellCenter(q, r, config, adapter);
      if (c.x < minX || c.x > maxX || c.y < minY || c.y > maxY) continue;
      if (pointInPolygon(c.x, c.y, polygon)) out.push({ q, r });
    }
  }
  return out;
}

/** Je buňka osvětlená pro daný token (temný režim)? */
function litForToken(
  cell: HexCoord,
  token: MapToken,
  lights: MapLight[],
  config: HexConfig,
  adapter = getGridAdapter(config.gridType),
): boolean {
  const range = config.visionRange ?? DEFAULT_DARK_VISION;
  if (adapter.distance({ q: token.q, r: token.r }, cell) <= range) return true;
  if (lights.length > 0) {
    const cp = cellCenter(cell.q, cell.r, config, adapter);
    for (const l of lights) {
      if (Math.hypot(cp.x - l.x, cp.y - l.y) <= l.range) return true;
    }
  }
  return false;
}

/**
 * Množina viditelných buněk `Set<"q,r">` = sjednocení LoS všech PC tokenů.
 * V temném režimu (`config.darkness`) oříznuto dosvitem tokenu / světly.
 */
export function computeVisionReveal(
  pcTokens: MapToken[],
  walls: MapWall[],
  lights: MapLight[],
  config: HexConfig,
  bounds: MapBounds,
): Set<string> {
  const set = new Set<string>();
  const segments = wallsToSegments(walls);
  const adapter = getGridAdapter(config.gridType);

  for (const t of pcTokens) {
    if (t.isNpc) continue;
    const origin = cellCenter(t.q, t.r, config, adapter);
    const poly = computeVisibilityPolygon(origin, segments, bounds);
    for (const cell of cellsInPolygon(poly, config, bounds)) {
      if (config.darkness && !litForToken(cell, t, lights, config, adapter)) {
        continue;
      }
      set.add(`${cell.q},${cell.r}`);
    }
    set.add(`${t.q},${t.r}`); // vlastní buňka vždy
  }
  return set;
}
