/**
 * 21.3f — organické jeskyně (téma „jeskyně" generátoru podzemí).
 *
 * Cellular automata: náhodný zásev podlahy → 5 iterací vyhlazení (buňka je
 * skála, když má ≥5 skalních sousedů z 8) → ponechá se největší komponenta,
 * větší vedlejší bubliny se připojí tunelem (L-cesta mezi těžišti), drobné se
 * zasypou → jezírka + jeskynní dekorace dle zabydlenosti. Deterministické.
 */
import type { DungeonCell, DungeonDecoration } from '../types';
import { DUNGEON_LIMITS } from '../types';
import { createEmptyCells } from './model';
import type { GeneratedDungeon, GeneratorParams } from './generate';
import { mulberry32 } from './generate';

const clampOdd = (n: number, min: number, max: number): number => {
  const c = Math.max(min, Math.min(max, Math.round(n)));
  return c % 2 === 0 ? c - 1 : c;
};

export function generateCaves(params: GeneratorParams): GeneratedDungeon {
  const width = clampOdd(params.width, 11, 99);
  const height = clampOdd(params.height, 11, 99);
  const openness = Math.max(0, Math.min(1, params.roomDensity));
  const furnishing = Math.max(0, Math.min(1, params.furnishing ?? 0));
  const rng = mulberry32(params.seed);

  // ── 1) Zásev: podlaha s pravděpodobností dle „otevřenosti" ─────────────
  const fillP = 0.4 + openness * 0.15;
  let open: boolean[][] = Array.from({ length: height }, (_, y) =>
    Array.from({ length: width }, (_, x) =>
      x > 0 && x < width - 1 && y > 0 && y < height - 1 && rng() < fillP,
    ),
  );

  // ── 2) Vyhlazení (5 iterací CA) ─────────────────────────────────────────
  for (let iter = 0; iter < 5; iter++) {
    const next = open.map((row) => [...row]);
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let rock = 0;
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++)
            if (!(dx === 0 && dy === 0) && !open[y + dy][x + dx]) rock++;
        next[y][x] = rock < 5;
      }
    }
    open = next;
  }

  // ── 3) Komponenty: největší nech, velké připoj tunelem, malé zasyp ─────
  interface Blob {
    cells: [number, number][];
    cx: number;
    cy: number;
  }
  const seen = Array.from({ length: height }, () =>
    new Array<boolean>(width).fill(false),
  );
  const blobs: Blob[] = [];
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (!open[y][x] || seen[y][x]) continue;
      const cellsList: [number, number][] = [];
      const stack: [number, number][] = [[x, y]];
      seen[y][x] = true;
      while (stack.length) {
        const [cx, cy] = stack.pop() as [number, number];
        cellsList.push([cx, cy]);
        for (const [dx, dy] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ] as const) {
          const nx = cx + dx;
          const ny = cy + dy;
          if (
            nx > 0 &&
            nx < width - 1 &&
            ny > 0 &&
            ny < height - 1 &&
            open[ny][nx] &&
            !seen[ny][nx]
          ) {
            seen[ny][nx] = true;
            stack.push([nx, ny]);
          }
        }
      }
      const sum = cellsList.reduce(
        (acc, [bx, by]) => [acc[0] + bx, acc[1] + by],
        [0, 0],
      );
      blobs.push({
        cells: cellsList,
        cx: Math.round(sum[0] / cellsList.length),
        cy: Math.round(sum[1] / cellsList.length),
      });
    }
  }
  blobs.sort((a, b) => b.cells.length - a.cells.length);
  const main = blobs[0];
  if (!main) {
    // Degenerace (extrémně nízká otevřenost) — vyhrab aspoň komůrku.
    const cx = Math.floor(width / 2);
    const cy = Math.floor(height / 2);
    for (let dy = -2; dy <= 2; dy++)
      for (let dx = -3; dx <= 3; dx++) {
        open[cy + dy][cx + dx] = true;
      }
  } else {
    for (const blob of blobs.slice(1)) {
      if (blob.cells.length >= 6) {
        // Tunel L-cestou k těžišti hlavní komponenty.
        let x = blob.cx;
        let y = blob.cy;
        while (x !== main.cx) {
          open[y][x] = true;
          x += x < main.cx ? 1 : -1;
        }
        while (y !== main.cy) {
          open[y][x] = true;
          y += y < main.cy ? 1 : -1;
        }
      } else {
        for (const [bx, by] of blob.cells) open[by][bx] = false;
      }
    }
  }

  // ── 4) Do buněk + jezírka ───────────────────────────────────────────────
  const cells: DungeonCell[][] = createEmptyCells(width, height);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++)
      if (open[y][x]) cells[y][x] = { type: 'floor', floorVariant: 'hlina' };

  const floorList: [number, number][] = [];
  for (let y = 1; y < height - 1; y++)
    for (let x = 1; x < width - 1; x++)
      if (cells[y][x].type === 'floor') floorList.push([x, y]);

  // Jezírka: pár malých vodních ploch v nitru (buňka + sousedi na podlaze).
  const pools = Math.round((floorList.length / 220) * (0.5 + furnishing));
  for (let p = 0; p < pools && floorList.length; p++) {
    const [px, py] = floorList[Math.floor(rng() * floorList.length)];
    for (const [dx, dy] of [
      [0, 0],
      [1, 0],
      [0, 1],
    ] as const) {
      if (cells[py + dy]?.[px + dx]?.type === 'floor')
        cells[py + dy][px + dx] = { type: 'water' };
    }
  }

  // ── 5) Jeskynní dekorace dle zabydlenosti ───────────────────────────────
  const decorations: DungeonDecoration[] = [];
  const occupied = new Set<string>();
  let seq = 0;
  if (furnishing > 0) {
    for (const [x, y] of floorList) {
      if (decorations.length >= DUNGEON_LIMITS.maxDecorations) break;
      if (cells[y][x].type !== 'floor') continue;
      if (rng() >= furnishing * 0.05) continue;
      const key = `${x},${y}`;
      if (occupied.has(key)) continue;
      occupied.add(key);
      const r = rng();
      decorations.push({
        id: `cave-${seq++}`,
        type:
          r < 0.35
            ? 'stalagmit'
            : r < 0.55
              ? 'houby'
              : r < 0.72
                ? 'sut'
                : r < 0.88
                  ? 'krystaly'
                  : 'koreny',
        cellX: x,
        cellY: y,
        rotation: 0,
      });
    }
  }

  return { cells, decorations, rooms: [], seed: params.seed };
}
