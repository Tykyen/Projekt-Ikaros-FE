/**
 * 21.3a — procedurální generátor podzemí (donjon styl).
 *
 * Algoritmus „rooms and mazes" (Nystrom): 1) rozmísti nepřekrývající se
 * místnosti na lichých souřadnicích, 2) zbytek vyplň bludištěm (recursive
 * backtracker s nastavitelnou křivolakostí), 3) propoj oblasti konektory
 * (spanning + pár extra smyček) = dveře, 4) ořež slepé konce, 5) rozděl typy
 * dveří, 6) očísluj místnosti popiskovými dekoracemi.
 *
 * Deterministický: stejný seed ⇒ stejná mapa (žádné Math.random!).
 * Čistá logika bez Reactu — unit testy vedle v __tests__.
 */
import type {
  DungeonCell,
  DungeonDecoration,
  DoorCellType,
} from '../types';
import { isWalkable } from '../types';
import { createEmptyCells } from './model';

export interface GeneratorParams {
  /** Rozměry gridu (engine si vynutí lichost; rozsah 11–99). */
  width: number;
  height: number;
  /** 0–1: kolik plochy zaberou místnosti. */
  roomDensity: number;
  /** 0–1: křivolakost chodeb (0 = rovné, 1 = maximálně kroucené). */
  windiness: number;
  /** 0–1: podíl „zvláštních" dveří (zamčené/tajné/past/mříž/průchod). */
  specialDoorRatio: number;
  /** 0–1: míra ořezu slepých chodeb (1 ≈ žádné slepé konce). Default 0.8. */
  deadEndTrim?: number;
  seed: number;
}

export interface GeneratedRoom {
  x: number;
  y: number;
  width: number;
  height: number;
  number: number;
}

export interface GeneratedDungeon {
  cells: DungeonCell[][];
  decorations: DungeonDecoration[];
  rooms: GeneratedRoom[];
  seed: number;
}

/** Přednastavené velikosti (liché kvůli bludišti). */
export const SIZE_PRESETS = {
  S: { width: 25, height: 17, label: 'Malé (25×17)' },
  M: { width: 41, height: 29, label: 'Střední (41×29)' },
  L: { width: 63, height: 45, label: 'Velké (63×45)' },
} as const;

export type SizePresetKey = keyof typeof SIZE_PRESETS;

/** mulberry32 — malý deterministický PRNG (stejný seed ⇒ stejná sekvence). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Náhodný seed pro tlačítko „Přegenerovat" (jediné povolené Math.random). */
export function randomSeed(): number {
  return Math.floor(Math.random() * 0xffffffff);
}

type Dir = readonly [number, number];
const DIRS: readonly Dir[] = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
];

/** Distribuce zvláštních dveří (váhy). */
const SPECIAL_DOORS: readonly { type: DoorCellType; weight: number }[] = [
  { type: 'door-locked', weight: 30 },
  { type: 'door-secret', weight: 20 },
  { type: 'door-trapped', weight: 20 },
  { type: 'portcullis', weight: 15 },
  { type: 'archway', weight: 15 },
];

const clampOdd = (n: number, min: number, max: number): number => {
  const clamped = Math.max(min, Math.min(max, Math.round(n)));
  return clamped % 2 === 0 ? clamped - 1 : clamped;
};

export function generateDungeon(params: GeneratorParams): GeneratedDungeon {
  const width = clampOdd(params.width, 11, 99);
  const height = clampOdd(params.height, 11, 99);
  const roomDensity = Math.max(0, Math.min(1, params.roomDensity));
  const windiness = Math.max(0, Math.min(1, params.windiness));
  const specialDoorRatio = Math.max(0, Math.min(1, params.specialDoorRatio));
  const deadEndTrim = Math.max(0, Math.min(1, params.deadEndTrim ?? 0.8));
  const rng = mulberry32(params.seed);

  const cells = createEmptyCells(width, height);
  // Region id per buňka (-1 = skála). Místnosti a jednotlivá bludiště =
  // samostatné regiony; konektory je pak sešijí do jednoho celku.
  const region: number[][] = Array.from({ length: height }, () =>
    new Array<number>(width).fill(-1),
  );
  let regionCount = 0;
  const isRoomCell: boolean[][] = Array.from({ length: height }, () =>
    new Array<boolean>(width).fill(false),
  );

  const carve = (x: number, y: number, r: number): void => {
    cells[y][x] = { type: 'floor' };
    region[y][x] = r;
  };

  // ── 1) Místnosti ────────────────────────────────────────────────────────
  const rooms: GeneratedRoom[] = [];
  const area = width * height;
  const targetRooms = Math.max(
    1,
    Math.round((area / 180) * (0.4 + 1.6 * roomDensity)),
  );
  const attempts = targetRooms * 12;
  for (let i = 0; i < attempts && rooms.length < targetRooms; i++) {
    const rw = 3 + 2 * Math.floor(rng() * 4); // 3/5/7/9
    const rh = 3 + 2 * Math.floor(rng() * 3); // 3/5/7
    if (rw >= width - 2 || rh >= height - 2) continue;
    const rx = 1 + 2 * Math.floor((rng() * (width - rw - 1)) / 2);
    const ry = 1 + 2 * Math.floor((rng() * (height - rh - 1)) / 2);
    // Kolize s rezervou 1 buňky (zeď mezi místnostmi zůstane).
    let collides = false;
    for (const r of rooms) {
      if (
        rx <= r.x + r.width &&
        r.x <= rx + rw &&
        ry <= r.y + r.height &&
        r.y <= ry + rh
      ) {
        collides = true;
        break;
      }
    }
    if (collides) continue;
    const roomRegion = regionCount++;
    for (let y = ry; y < ry + rh; y++)
      for (let x = rx; x < rx + rw; x++) {
        carve(x, y, roomRegion);
        isRoomCell[y][x] = true;
      }
    rooms.push({ x: rx, y: ry, width: rw, height: rh, number: rooms.length + 1 });
  }

  // ── 2) Bludiště v mezerách (recursive backtracker, iterativně) ─────────
  for (let sy = 1; sy < height; sy += 2) {
    for (let sx = 1; sx < width; sx += 2) {
      if (cells[sy][sx].type !== 'empty') continue;
      const mazeRegion = regionCount++;
      carve(sx, sy, mazeRegion);
      const stack: [number, number][] = [[sx, sy]];
      let lastDir: Dir | null = null;
      while (stack.length) {
        const [cx, cy] = stack[stack.length - 1];
        const open = DIRS.filter(([dx, dy]) => {
          const nx = cx + dx * 2;
          const ny = cy + dy * 2;
          return (
            nx > 0 &&
            nx < width - 1 &&
            ny > 0 &&
            ny < height - 1 &&
            cells[ny][nx].type === 'empty'
          );
        });
        if (!open.length) {
          stack.pop();
          lastDir = null;
          continue;
        }
        // Křivolakost: nízká = drž směr, vysoká = zatáčej náhodně.
        let dir: Dir;
        if (
          lastDir &&
          open.some((d) => d[0] === lastDir![0] && d[1] === lastDir![1]) &&
          rng() > windiness
        ) {
          dir = lastDir;
        } else {
          dir = open[Math.floor(rng() * open.length)];
        }
        carve(cx + dir[0], cy + dir[1], mazeRegion);
        carve(cx + dir[0] * 2, cy + dir[1] * 2, mazeRegion);
        stack.push([cx + dir[0] * 2, cy + dir[1] * 2]);
        lastDir = dir;
      }
    }
  }

  // ── 3) Konektory: skalní buňky mezi dvěma různými regiony ──────────────
  interface Connector {
    x: number;
    y: number;
    a: number;
    b: number;
  }
  const connectors: Connector[] = [];
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (cells[y][x].type !== 'empty') continue;
      const pairs: [number, number][] = [
        [region[y][x - 1], region[y][x + 1]],
        [region[y - 1][x], region[y + 1][x]],
      ];
      for (const [a, b] of pairs) {
        if (a >= 0 && b >= 0 && a !== b) {
          connectors.push({ x, y, a, b });
          break;
        }
      }
    }
  }
  // Union-find nad regiony.
  const parent = Array.from({ length: regionCount }, (_, i) => i);
  const find = (i: number): number => {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]];
      i = parent[i];
    }
    return i;
  };
  // Zamíchej deterministicky (Fisher–Yates s rng).
  for (let i = connectors.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [connectors[i], connectors[j]] = [connectors[j], connectors[i]];
  }
  const doorCells: { x: number; y: number; touchesRoom: boolean }[] = [];
  const EXTRA_LOOP_CHANCE = 0.06;
  const hasAdjacentDoor = (x: number, y: number): boolean =>
    doorCells.some((d) => Math.abs(d.x - x) + Math.abs(d.y - y) === 1);
  for (const c of connectors) {
    const ra = find(c.a);
    const rb = find(c.b);
    const merges = ra !== rb;
    // Spojovací konektor NIKDY nezahazovat (jinak hrozí nepropojené podzemí);
    // adjacency filtr platí jen pro kosmetické extra smyčky.
    if (!merges && (rng() >= EXTRA_LOOP_CHANCE || hasAdjacentDoor(c.x, c.y)))
      continue;
    if (merges) parent[ra] = rb;
    carve(c.x, c.y, rb);
    const touchesRoom =
      isRoomCell[c.y][c.x - 1] ||
      isRoomCell[c.y][c.x + 1] ||
      isRoomCell[c.y - 1][c.x] ||
      isRoomCell[c.y + 1][c.x];
    doorCells.push({ x: c.x, y: c.y, touchesRoom });
  }

  // ── 4) Ořez slepých konců ───────────────────────────────────────────────
  const walkableNeighbors = (x: number, y: number): number =>
    DIRS.reduce((n, [dx, dy]) => {
      const nx = x + dx;
      const ny = y + dy;
      return n +
        (nx >= 0 &&
        nx < width &&
        ny >= 0 &&
        ny < height &&
        isWalkable(cells[ny][nx].type)
          ? 1
          : 0);
    }, 0);
  const trimPasses = Math.round(deadEndTrim * 40);
  for (let pass = 0; pass < trimPasses; pass++) {
    let removed = 0;
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        if (isRoomCell[y][x] || !isWalkable(cells[y][x].type)) continue;
        if (walkableNeighbors(x, y) <= 1) {
          cells[y][x] = { type: 'empty' };
          region[y][x] = -1;
          removed++;
        }
      }
    }
    if (!removed) break;
  }
  // Dveře, kterým ořez vzal chodbu, zmizely v trim smyčce (deg ≤ 1);
  // zbylé osiřelé záznamy vyhoď.
  const liveDoors = doorCells.filter((d) => isWalkable(cells[d.y][d.x].type));

  // ── 5) Typy dveří ───────────────────────────────────────────────────────
  const totalWeight = SPECIAL_DOORS.reduce((s, d) => s + d.weight, 0);
  const pickSpecial = (): DoorCellType => {
    let roll = rng() * totalWeight;
    for (const d of SPECIAL_DOORS) {
      roll -= d.weight;
      if (roll <= 0) return d.type;
    }
    return 'door';
  };
  for (const d of liveDoors) {
    if (!d.touchesRoom) {
      // Chodba–chodba: většinou volný průchod, občas padací mříž.
      cells[d.y][d.x] = { type: rng() < 0.15 ? 'portcullis' : 'archway' };
    } else {
      cells[d.y][d.x] = {
        type: rng() < specialDoorRatio ? pickSpecial() : 'door',
      };
    }
  }

  // ── 6) Číslování místností ──────────────────────────────────────────────
  const decorations: DungeonDecoration[] = rooms.map((r) => ({
    id: `room-label-${r.number}`,
    type: 'label',
    cellX: r.x + Math.floor(r.width / 2),
    cellY: r.y + Math.floor(r.height / 2),
    rotation: 0,
    label: String(r.number),
  }));

  return { cells, decorations, rooms, seed: params.seed };
}
