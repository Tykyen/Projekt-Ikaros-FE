// 10.1c — čisté selektory nad mapou (testovatelné bez UI).
import type {
  UniverseNode,
  UniverseLink,
  UniverseMap,
  UpdateUniverseInput,
} from './types';

/**
 * 10.1 — očistí mapu před uložením (PUT). `react-force-graph-3d` mutuje
 * node/link objekty in-place: přidává simulační pole (`vx/vy/vz/fx/fy/fz`,
 * `index`) a `__threeObj` (reference na celý THREE.Group vč. textury obrázku),
 * a přepisuje `link.source/target` ze stringu na node objekt. Bez očištění by
 * `JSON.stringify` v PUT poslal celý THREE strom → 413 Payload Too Large.
 * Posíláme jen vlastní schema pole.
 */
export function sanitizeForSave(map: UniverseMap): UpdateUniverseInput {
  return {
    nodes: map.nodes.map((n) => ({
      id: n.id,
      name: n.name,
      type: n.type,
      color: n.color,
      size: n.size,
      img: n.img,
      alliance: n.alliance,
      x: n.x,
      y: n.y,
      z: n.z,
      isPublic: n.isPublic,
      visibleToPlayerIds: n.visibleToPlayerIds,
      pageSlug: n.pageSlug,
      hasRing: n.hasRing,
    })),
    links: map.links.map((l) => ({
      source: linkEndId(l.source),
      target: linkEndId(l.target),
      isOrbit: l.isOrbit,
    })),
  };
}

/**
 * Konec hrany může být string id (čisté) nebo node objekt — `react-force-graph`
 * přepisuje `link.source/target` ze stringu na referenci na node. Tento helper
 * sjednotí obojí na id string; používej ho VŠUDE, kde se source/target porovnává
 * nebo renderuje.
 */
export function linkEndId(end: unknown): string {
  if (typeof end === 'string') return end;
  if (end && typeof end === 'object' && 'id' in end) {
    const id = (end as { id?: unknown }).id;
    return typeof id === 'string' ? id : '';
  }
  return '';
}

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
    const sourceId = linkEndId(l.source);
    const targetId = linkEndId(l.target);
    if (sourceId !== nodeId && targetId !== nodeId) continue;
    const otherId = sourceId === nodeId ? targetId : sourceId;
    const node = byId.get(otherId);
    if (node) out.push({ node, isOrbit: l.isOrbit });
  }
  return out.sort((a, b) => a.node.name.localeCompare(b.node.name));
}

/** Uzly seřazené dle jména (pro search / selecty). */
export function sortedByName(nodes: UniverseNode[]): UniverseNode[] {
  return [...nodes].sort((a, b) => a.name.localeCompare(b.name));
}
