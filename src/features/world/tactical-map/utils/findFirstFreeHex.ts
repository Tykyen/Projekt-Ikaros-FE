/**
 * 10.2d — najde první volný hex počínaje `start`, spirálovým BFS.
 *
 * Plán: docs/arch/phase-10/plan-10.2d.md C5.
 */
import { AXIAL_DIRECTIONS } from '../hexUtils';
import type { HexCoord, MapToken } from '../types';

const MAX_SEARCH = 500;

export function findFirstFreeHex(
  occupied: MapToken[],
  start: HexCoord = { q: 0, r: 0 },
): HexCoord {
  const taken = new Set(occupied.map((t) => `${t.q},${t.r}`));
  const visited = new Set<string>();
  const queue: HexCoord[] = [start];
  let i = 0;
  while (queue.length && i < MAX_SEARCH) {
    const cur = queue.shift()!;
    const key = `${cur.q},${cur.r}`;
    if (visited.has(key)) continue;
    visited.add(key);
    if (!taken.has(key)) return cur;
    for (const dir of AXIAL_DIRECTIONS) {
      queue.push({ q: cur.q + dir.q, r: cur.r + dir.r });
    }
    i++;
  }
  return start;
}
