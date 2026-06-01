// 10.1c — čisté selektory nad mapou (testovatelné bez UI).
import type { UniverseNode, UniverseLink } from './types';

export interface Connection {
  node: UniverseNode;
  isOrbit: boolean;
}

/** Uzly napojené na `nodeId`, seřazené dle jména. */
export function connectionsOf(
  nodeId: string,
  links: UniverseLink[],
  nodes: UniverseNode[],
): Connection[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const out: Connection[] = [];
  for (const l of links) {
    if (l.source !== nodeId && l.target !== nodeId) continue;
    const otherId = l.source === nodeId ? l.target : l.source;
    const node = byId.get(otherId);
    if (node) out.push({ node, isOrbit: l.isOrbit });
  }
  return out.sort((a, b) => a.node.name.localeCompare(b.node.name));
}

/** Uzly seřazené dle jména (pro search / selecty). */
export function sortedByName(nodes: UniverseNode[]): UniverseNode[] {
  return [...nodes].sort((a, b) => a.name.localeCompare(b.name));
}
