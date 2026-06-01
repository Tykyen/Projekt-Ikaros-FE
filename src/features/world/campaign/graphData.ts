/**
 * Krok 11.1 — pure transformace dat pro force graph (oddělené od canvasu kvůli
 * testovatelnosti; canvas se v jsdom plně nekreslí).
 */

import type { CampaignRelationship, CampaignSubject } from './types';

export interface GraphNode {
  id: string;
  name: string;
  type: CampaignSubject['type'];
  /** Force-graph dopisuje za běhu pozice. */
  x?: number;
  y?: number;
}

export interface GraphLink {
  relId: string;
  source: string;
  target: string;
  /** Valence strany u zdroje (jak source cítí k target). */
  valenceA: number;
  /** Valence strany u cíle (jak target cítí k source). */
  valenceB: number;
  strength: number;
  status: CampaignRelationship['status'];
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export function buildGraphData(
  subjects: CampaignSubject[],
  relationships: CampaignRelationship[],
): GraphData {
  const ids = new Set(subjects.map((x) => x.id));
  return {
    nodes: subjects.map((x) => ({ id: x.id, name: x.name, type: x.type })),
    links: relationships
      .filter((r) => ids.has(r.subjectAId) && ids.has(r.subjectBId))
      .map((r) => ({
        relId: r.id,
        source: r.subjectAId,
        target: r.subjectBId,
        valenceA: r.sideA.valence ?? 0,
        valenceB: r.sideB.valence ?? 0,
        strength: Math.max(r.sideA.strength ?? 5, r.sideB.strength ?? 5),
        status: r.status,
      })),
  };
}

/** ID uzlu z link endpointu (force-graph ho po layoutu nahradí objektem). */
function endId(end: string | { id: string }): string {
  return typeof end === 'string' ? end : end.id;
}

/** Fokusovaný uzel + jeho přímí sousedé (ego-síť). */
export function neighborIds(
  focusId: string,
  links: Pick<GraphLink, 'source' | 'target'>[],
): Set<string> {
  const set = new Set<string>([focusId]);
  for (const l of links) {
    const sid = endId(l.source as string);
    const tid = endId(l.target as string);
    if (sid === focusId) set.add(tid);
    else if (tid === focusId) set.add(sid);
  }
  return set;
}

export type ValenceFilter = 'all' | 'crisis' | 'positive' | 'negative';

export function linkPassesFilter(
  link: Pick<GraphLink, 'valenceA' | 'valenceB' | 'status'>,
  filter: ValenceFilter,
): boolean {
  switch (filter) {
    case 'crisis':
      return link.status === 'crisis';
    case 'positive':
      return link.valenceA > 0 || link.valenceB > 0;
    case 'negative':
      return link.valenceA < 0 || link.valenceB < 0;
    default:
      return true;
  }
}
