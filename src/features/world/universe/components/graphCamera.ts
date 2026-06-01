// 10.1c — pomocné funkce kamery (mimo komponentu kvůli fast-refresh).
import type { UniverseGraphHandle } from './UniverseGraph';
import type { UniverseNode } from '../types';

/** Plynulý přelet kamery k uzlu (klik / search). */
export function flyToNode(
  fg: UniverseGraphHandle | undefined,
  node: UniverseNode,
  durationMs = 1500,
): void {
  if (!fg || node.x == null || node.y == null || node.z == null) return;
  const distance = node.size * 2.5;
  const hyp = Math.hypot(node.x, node.y, node.z) || 1;
  const ratio = 1 + distance / hyp;
  fg.cameraPosition(
    { x: node.x * ratio, y: node.y * ratio, z: node.z * ratio },
    { x: node.x, y: node.y, z: node.z },
    durationMs,
  );
}
