// 10.1 — Universe mapa 3D. FE zrcadlo BE `universe` modulu
// (backend/src/modules/universe/interfaces/universe-map.interface.ts)
// + 2 volná pole navíc (pageSlug, hasRing) — BE schema je `MixedArray`,
// takže projdou full PUT bez migrace.

export type UniverseNodeType =
  | 'planet'
  | 'star'
  | 'nebula'
  | 'asteroid'
  | 'moon'
  | 'blackhole';

export interface UniverseNode {
  id: string;
  name: string;
  type?: UniverseNodeType;
  color: string;
  size: number;
  img?: string;
  alliance?: string;
  /** Force-layout pozice; PUT je persistuje (stabilní layout napříč session). */
  x?: number;
  y?: number;
  z?: number;
  isPublic: boolean;
  visibleToPlayerIds: string[];
  /** 10.1c — explicitní ref na wiki stránku světa (slug). Nahrazuje hádání ze jména. */
  pageSlug?: string;
  /** Render prsten kolem tělesa. Nahrazuje hardcode "Asgard"/"Svar" z Matrixu. */
  hasRing?: boolean;
}

export interface UniverseLink {
  source: string;
  target: string;
  isOrbit: boolean;
}

export interface UniverseMap {
  id: string;
  worldId: string;
  nodes: UniverseNode[];
  links: UniverseLink[];
}

/** Payload pro full PUT (BE bere jen nodes + links). */
export interface UpdateUniverseInput {
  nodes: UniverseNode[];
  links: UniverseLink[];
}

export interface UpdateNodeVisibilityInput {
  isPublic: boolean;
  visibleToPlayerIds: string[];
}

export const UNIVERSE_NODE_TYPES: { value: UniverseNodeType; label: string }[] =
  [
    { value: 'planet', label: 'Planeta' },
    { value: 'star', label: 'Hvězda (Slunce)' },
    { value: 'blackhole', label: 'Černá díra' },
    { value: 'moon', label: 'Měsíc' },
    { value: 'asteroid', label: 'Asteroidový pás' },
    { value: 'nebula', label: 'Vesmírná mlhovina' },
  ];

export function nodeTypeLabel(type?: UniverseNodeType): string {
  return (
    UNIVERSE_NODE_TYPES.find((t) => t.value === type)?.label ?? 'Planeta'
  );
}
