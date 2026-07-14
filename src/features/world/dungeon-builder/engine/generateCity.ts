/**
 * 21.3e — procedurální generátor města/vesnice (druhý generátor stavitele).
 *
 * Kroky: volitelná řeka (meandr) → hlavní ulice (kříž, přes řeku mosty) →
 * vedlejší uličky rekurzivním dělením bloků → náměstí u hlavní křižovatky →
 * parcely budov podél ulic → volitelné hradby s bránami a věžemi → zeleň →
 * číslování největších budov → zabydlení (kašna, stánky, lucerny, vozíky).
 *
 * Deterministický (mulberry32): stejný seed ⇒ stejné město. Čistá logika
 * bez Reactu — testy v __tests__/generateCity.spec.ts.
 */
import type { DungeonCell, DungeonDecoration } from '../types';
import { DUNGEON_LIMITS } from '../types';
import { createEmptyCells } from './model';
import { mulberry32 } from './generate';

export interface CityGeneratorParams {
  width: number;
  height: number;
  /** 0–1: hustota zástavby (kolik parcel se zaplní). */
  buildingDensity: number;
  /** 0–1: křivolakost ulic (jitter os a meandrování řeky). */
  windiness: number;
  walls: 'auto' | 'yes' | 'no';
  river: 'auto' | 'yes' | 'no';
  /** 0–1: zeleň (stromy/keře na volném terénu). */
  greenery: number;
  /** 0–1: zabydlení (stánky, vozíky, lucerny, kašna). */
  furnishing: number;
  seed: number;
}

export interface GeneratedBuilding {
  x: number;
  y: number;
  width: number;
  height: number;
  number?: number;
}

export interface GeneratedCity {
  cells: DungeonCell[][];
  decorations: DungeonDecoration[];
  buildings: GeneratedBuilding[];
  seed: number;
}

const clampDim = (n: number): number =>
  Math.max(12, Math.min(100, Math.round(n)));

export function generateCity(params: CityGeneratorParams): GeneratedCity {
  const w = clampDim(params.width);
  const h = clampDim(params.height);
  const density = Math.max(0, Math.min(1, params.buildingDensity));
  const windiness = Math.max(0, Math.min(1, params.windiness));
  const greenery = Math.max(0, Math.min(1, params.greenery));
  const furnishing = Math.max(0, Math.min(1, params.furnishing));
  const rng = mulberry32(params.seed);

  const cells = createEmptyCells(w, h);
  const at = (x: number, y: number): DungeonCell | undefined =>
    y >= 0 && y < h && x >= 0 && x < w ? cells[y][x] : undefined;
  const set = (x: number, y: number, type: DungeonCell['type']): void => {
    if (at(x, y)) cells[y][x] = { type };
  };
  const is = (x: number, y: number, type: DungeonCell['type']): boolean =>
    at(x, y)?.type === type;

  // ── Rozhodnutí prvků ────────────────────────────────────────────────────
  const hasWalls =
    params.walls === 'yes' ||
    (params.walls === 'auto' && Math.min(w, h) >= 24 && rng() < 0.55);
  const hasRiver =
    params.river === 'yes' || (params.river === 'auto' && rng() < 0.35);

  // ── 1) Řeka (meandr napříč kratší osou) ─────────────────────────────────
  if (hasRiver) {
    const vertical = rng() < 0.5;
    const span = vertical ? h : w;
    const across = vertical ? w : h;
    let pos = Math.round(across * (0.3 + rng() * 0.4));
    const riverW = 2 + (rng() < 0.35 ? 1 : 0);
    for (let t = 0; t < span; t++) {
      for (let k = 0; k < riverW; k++) {
        if (vertical) set(pos + k, t, 'water');
        else set(t, pos + k, 'water');
      }
      // Meandr: šance zatočit roste s křivolakostí.
      if (rng() < 0.25 + windiness * 0.35) {
        pos += rng() < 0.5 ? -1 : 1;
        pos = Math.max(1, Math.min(across - riverW - 1, pos));
      }
    }
  }

  // ── 2) Hlavní ulice (kříž se zajitrovanými osami, šířka 2) ─────────────
  const jitter = (base: number, range: number): number =>
    Math.round(base + (rng() * 2 - 1) * range * windiness);
  const mainX = Math.max(
    3,
    Math.min(w - 5, jitter(Math.floor(w / 2) - 1, w * 0.15)),
  );
  const mainY = Math.max(
    3,
    Math.min(h - 5, jitter(Math.floor(h / 2) - 1, h * 0.15)),
  );
  const paveRoad = (x: number, y: number): void => {
    const cell = at(x, y);
    if (!cell) return;
    // Přes vodu vede most, jinak ulice.
    set(x, y, cell.type === 'water' ? 'bridge' : 'street');
  };
  for (let x = 0; x < w; x++) {
    paveRoad(x, mainY);
    paveRoad(x, mainY + 1);
  }
  for (let y = 0; y < h; y++) {
    paveRoad(mainX, y);
    paveRoad(mainX + 1, y);
  }

  // ── 3) Hradby (obdélníkový prstenec s branami a věžemi) ────────────────
  // Ring dřív než vedlejší uličky — ty se dělí jen UVNITŘ hradeb.
  const ring = { x1: 1, y1: 1, x2: w - 2, y2: h - 2 };
  if (hasWalls) {
    const onRing = (x: number, y: number): boolean =>
      ((x === ring.x1 || x === ring.x2) && y >= ring.y1 && y <= ring.y2) ||
      ((y === ring.y1 || y === ring.y2) && x >= ring.x1 && x <= ring.x2);
    for (let y = ring.y1; y <= ring.y2; y++) {
      for (let x = ring.x1; x <= ring.x2; x++) {
        if (!onRing(x, y)) continue;
        const type = at(x, y)?.type;
        if (type === 'street' || type === 'bridge') set(x, y, 'gate');
        else if (type === 'empty') set(x, y, 'city-wall');
        // vodu nechat — vodní brána
      }
    }
    // Věže 2×2 v rozích.
    for (const [cx, cy] of [
      [ring.x1, ring.y1],
      [ring.x2 - 1, ring.y1],
      [ring.x1, ring.y2 - 1],
      [ring.x2 - 1, ring.y2 - 1],
    ] as const) {
      for (let dy = 0; dy < 2; dy++)
        for (let dx = 0; dx < 2; dx++)
          if (is(cx + dx, cy + dy, 'empty') || is(cx + dx, cy + dy, 'city-wall'))
            set(cx + dx, cy + dy, 'city-wall');
    }
  }

  // ── 4) Vedlejší uličky (rekurzivní dělení bloků, šířka 1) ──────────────
  const inner = hasWalls
    ? { x1: ring.x1 + 2, y1: ring.y1 + 2, x2: ring.x2 - 2, y2: ring.y2 - 2 }
    : { x1: 1, y1: 1, x2: w - 2, y2: h - 2 };
  const carveStreetCell = (x: number, y: number): void => {
    if (is(x, y, 'empty')) set(x, y, 'street');
  };
  const MIN_BLOCK = 6;
  const subdivide = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    depth: number,
  ): void => {
    if (depth > 6) return;
    const bw = x2 - x1 + 1;
    const bh = y2 - y1 + 1;
    if (bw >= MIN_BLOCK * 2 + 1 && (bw >= bh || bh < MIN_BLOCK * 2 + 1)) {
      const sx = x1 + MIN_BLOCK + Math.floor(rng() * (bw - 2 * MIN_BLOCK));
      for (let y = y1; y <= y2; y++) carveStreetCell(sx, y);
      subdivide(x1, y1, sx - 1, y2, depth + 1);
      subdivide(sx + 1, y1, x2, y2, depth + 1);
    } else if (bh >= MIN_BLOCK * 2 + 1) {
      const sy = y1 + MIN_BLOCK + Math.floor(rng() * (bh - 2 * MIN_BLOCK));
      for (let x = x1; x <= x2; x++) carveStreetCell(x, sy);
      subdivide(x1, y1, x2, sy - 1, depth + 1);
      subdivide(x1, sy + 1, x2, y2, depth + 1);
    }
  };
  // Čtyři kvadranty kolem hlavního kříže.
  subdivide(inner.x1, inner.y1, mainX - 1, mainY - 1, 0);
  subdivide(mainX + 2, inner.y1, inner.x2, mainY - 1, 0);
  subdivide(inner.x1, mainY + 2, mainX - 1, inner.y2, 0);
  subdivide(mainX + 2, mainY + 2, inner.x2, inner.y2, 0);

  // ── 5) Náměstí u hlavní křižovatky ──────────────────────────────────────
  const plazaR = Math.min(w, h) >= 30 ? 3 : 2;
  const plaza = {
    x1: Math.max(inner.x1, mainX - plazaR + 1),
    y1: Math.max(inner.y1, mainY - plazaR + 1),
    x2: Math.min(inner.x2, mainX + plazaR),
    y2: Math.min(inner.y2, mainY + plazaR),
  };
  for (let y = plaza.y1; y <= plaza.y2; y++)
    for (let x = plaza.x1; x <= plaza.x2; x++)
      if (is(x, y, 'empty') || is(x, y, 'street')) set(x, y, 'street');

  // ── 5b) Garance souvislosti: uliční komponenty nepřipojené k hlavní
  // křižovatce (typicky pahýly uříznuté řekou) se vrátí na terén.
  {
    const passable = (x: number, y: number): boolean => {
      const t = at(x, y)?.type;
      return t === 'street' || t === 'bridge' || t === 'gate';
    };
    const connected = new Set<string>();
    const stack: [number, number][] = [[mainX, mainY]];
    connected.add(`${mainX},${mainY}`);
    while (stack.length) {
      const [cx, cy] = stack.pop() as [number, number];
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ] as const) {
        const nx = cx + dx;
        const ny = cy + dy;
        const key = `${nx},${ny}`;
        if (connected.has(key) || !passable(nx, ny)) continue;
        connected.add(key);
        stack.push([nx, ny]);
      }
    }
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (!passable(x, y) || connected.has(`${x},${y}`)) continue;
        const t = at(x, y)?.type;
        // Most zpět na vodu, brána zpět na hradbu, ulice na terén.
        set(x, y, t === 'bridge' ? 'water' : t === 'gate' ? 'city-wall' : 'empty');
      }
    }
  }

  // ── 6) Parcely budov podél ulic ──────────────────────────────────────────
  const buildings: GeneratedBuilding[] = [];
  const insideBuildable = (x: number, y: number): boolean =>
    x >= inner.x1 && x <= inner.x2 && y >= inner.y1 && y <= inner.y2;
  const nextToStreet = (x: number, y: number): boolean =>
    is(x - 1, y, 'street') ||
    is(x + 1, y, 'street') ||
    is(x, y - 1, 'street') ||
    is(x, y + 1, 'street');
  const rectFree = (x: number, y: number, bw: number, bh: number): boolean => {
    for (let dy = 0; dy < bh; dy++)
      for (let dx = 0; dx < bw; dx++) {
        if (!insideBuildable(x + dx, y + dy)) return false;
        if (!is(x + dx, y + dy, 'empty')) return false;
      }
    return true;
  };
  for (let y = inner.y1; y <= inner.y2; y++) {
    for (let x = inner.x1; x <= inner.x2; x++) {
      if (!is(x, y, 'empty') || !nextToStreet(x, y)) continue;
      if (rng() > density * 0.85 + 0.05) continue;
      // Zkus pár velikostí od větší k menší (2×2 až 4×4).
      const bw = 2 + Math.floor(rng() * 3);
      const bh = 2 + Math.floor(rng() * 3);
      let placed: GeneratedBuilding | null = null;
      for (const [tw, th] of [
        [bw, bh],
        [3, 2],
        [2, 3],
        [2, 2],
      ] as const) {
        if (rectFree(x, y, tw, th)) {
          placed = { x, y, width: tw, height: th };
          break;
        }
      }
      if (!placed) continue;
      for (let dy = 0; dy < placed.height; dy++)
        for (let dx = 0; dx < placed.width; dx++)
          set(placed.x + dx, placed.y + dy, 'building');
      buildings.push(placed);
    }
  }

  // ── 7) Dekorace: číslování budov + zeleň + zabydlení ────────────────────
  const decorations: DungeonDecoration[] = [];
  let decSeq = 0;
  const occupied = new Set<string>();
  const addDec = (
    type: DungeonDecoration['type'],
    x: number,
    y: number,
    label?: string,
  ): boolean => {
    if (decorations.length >= DUNGEON_LIMITS.maxDecorations) return false;
    const key = `${x},${y}`;
    if (occupied.has(key)) return false;
    occupied.add(key);
    decorations.push({
      id: `city-${decSeq++}`,
      type,
      cellX: x,
      cellY: y,
      rotation: 0,
      ...(label !== undefined ? { label } : {}),
    });
    return true;
  };

  // Čísla max 12 největších budov (klíč pro popisy PJ).
  const numbered = [...buildings]
    .sort((a, b) => b.width * b.height - a.width * a.height)
    .slice(0, 12);
  numbered.forEach((b, i) => {
    b.number = i + 1;
    addDec(
      'label',
      b.x + Math.floor(b.width / 2),
      b.y + Math.floor(b.height / 2),
      String(i + 1),
    );
  });

  // Zabydlení: kašna uprostřed náměstí, stánky okolo, lucerny podél hlavních
  // ulic, vozíky, sudy/bedny u budov.
  if (furnishing > 0) {
    const pcx = Math.floor((plaza.x1 + plaza.x2) / 2);
    const pcy = Math.floor((plaza.y1 + plaza.y2) / 2);
    if (is(pcx, pcy, 'street')) addDec('fontana', pcx, pcy);
    // Stánky na obvodu náměstí.
    const stallSpots: [number, number][] = [];
    for (let x = plaza.x1; x <= plaza.x2; x++)
      stallSpots.push([x, plaza.y1], [x, plaza.y2]);
    for (let y = plaza.y1 + 1; y < plaza.y2; y++)
      stallSpots.push([plaza.x1, y], [plaza.x2, y]);
    const stallCount = Math.round(furnishing * Math.min(8, stallSpots.length));
    for (let i = 0; i < stallCount && stallSpots.length; i++) {
      const idx = Math.floor(rng() * stallSpots.length);
      const [sx, sy] = stallSpots.splice(idx, 1)[0];
      if (is(sx, sy, 'street') && !(sx === pcx && sy === pcy))
        addDec('stanek', sx, sy);
    }
    // Lucerny podél hlavních os (interval dle zabydlenosti).
    const lampStep = Math.max(5, Math.round(12 - furnishing * 6));
    for (let x = inner.x1; x <= inner.x2; x += lampStep)
      if (is(x, mainY, 'street')) addDec('lucerna', x, mainY);
    for (let y = inner.y1; y <= inner.y2; y += lampStep)
      if (is(mainX + 1, y, 'street')) addDec('lucerna', mainX + 1, y);
    // Vozíky a sudy/bedny u budov.
    const propCount = Math.round(furnishing * buildings.length * 0.25);
    for (let i = 0; i < propCount; i++) {
      const b = buildings[Math.floor(rng() * buildings.length)];
      if (!b) break;
      const spots: [number, number][] = [
        [b.x - 1, b.y],
        [b.x + b.width, b.y + b.height - 1],
        [b.x, b.y - 1],
        [b.x + b.width - 1, b.y + b.height],
      ];
      const [px, py] = spots[Math.floor(rng() * spots.length)];
      if (is(px, py, 'empty') || is(px, py, 'street')) {
        const roll = rng();
        addDec(roll < 0.4 ? 'vozik' : roll < 0.7 ? 'sud' : 'bedna', px, py);
      }
    }
  }

  // Zeleň na volném terénu (uvnitř i vně hradeb).
  if (greenery > 0) {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (!is(x, y, 'empty')) continue;
        if (rng() < greenery * 0.07) {
          addDec(rng() < 0.65 ? 'strom' : 'ker', x, y);
        }
      }
    }
  }

  return { cells, decorations, buildings, seed: params.seed };
}
