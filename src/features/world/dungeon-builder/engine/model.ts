/**
 * 21.3a — čisté helpery nad buňkovým modelem podzemí (bez Reactu).
 */
import type { DungeonCell, DungeonCellType } from '../types';
import { isWalkable } from '../types';

export function createEmptyCells(
  width: number,
  height: number,
  type: DungeonCellType = 'empty',
): DungeonCell[][] {
  return Array.from({ length: height }, () =>
    Array.from({ length: width }, () => ({ type })),
  );
}

export function cloneCells(cells: DungeonCell[][]): DungeonCell[][] {
  return cells.map((row) => row.map((c) => ({ ...c })));
}

export function inBounds(
  cells: DungeonCell[][],
  x: number,
  y: number,
): boolean {
  return y >= 0 && y < cells.length && x >= 0 && x < (cells[0]?.length ?? 0);
}

/**
 * Počet souvislých průchozích oblastí (4-směrný flood fill).
 * 0 = žádná podlaha; 1 = celé podzemí propojené (invariant generátoru).
 */
export function countWalkableRegions(cells: DungeonCell[][]): number {
  const h = cells.length;
  const w = cells[0]?.length ?? 0;
  const seen: boolean[] = new Array(w * h).fill(false);
  let regions = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (seen[y * w + x] || !isWalkable(cells[y][x].type)) continue;
      regions++;
      // Iterativní DFS — rekurze by na 100×100 gridu hrozila stack overflow.
      const stack: number[] = [y * w + x];
      seen[y * w + x] = true;
      while (stack.length) {
        const idx = stack.pop() as number;
        const cx = idx % w;
        const cy = (idx - cx) / w;
        for (const [dx, dy] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ] as const) {
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
          const nIdx = ny * w + nx;
          if (seen[nIdx] || !isWalkable(cells[ny][nx].type)) continue;
          seen[nIdx] = true;
          stack.push(nIdx);
        }
      }
    }
  }
  return regions;
}

/**
 * Změna rozměrů gridu se zachováním obsahu (ořez zprava/zdola, dolití skálou).
 */
export function resizeCells(
  cells: DungeonCell[][],
  width: number,
  height: number,
): DungeonCell[][] {
  return Array.from({ length: height }, (_, y) =>
    Array.from({ length: width }, (_, x) =>
      cells[y]?.[x] ? { ...cells[y][x] } : { type: 'empty' as const },
    ),
  );
}
