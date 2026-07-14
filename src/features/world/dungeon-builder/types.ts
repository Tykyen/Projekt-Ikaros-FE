/**
 * 21.3a — Tvorba podzemí: FE zrcadlo BE `dungeon-maps` modelu
 * (backend/src/modules/dungeon-maps/interfaces/dungeon-map.interface.ts).
 *
 * Buňkový model: `empty` = skalní masiv (černá), `floor` = podlaha; zdi jsou
 * implicitní hranice podlaha↔skála (donjon styl). `wallEdges` se v 21.3a
 * nepoužívají (BE je má volitelné) — FE je neposílá, šetří payload.
 */

/** Typy buňky. Dveřní typy odpovídají donjon legendě (Průchod…Padací mříž). */
export type DungeonCellType =
  | 'empty'
  | 'floor'
  | 'wall'
  | 'door'
  | 'door-locked'
  | 'archway'
  | 'door-secret'
  | 'door-trapped'
  | 'portcullis'
  | 'stairs-up'
  | 'stairs-down'
  | 'water'
  | 'lava'
  | 'pit';

/** Buňky, které fungují jako průchod ve zdi (renderují se s dveřním glyfem). */
export const DOOR_CELL_TYPES = [
  'archway',
  'door',
  'door-locked',
  'door-trapped',
  'door-secret',
  'portcullis',
] as const satisfies readonly DungeonCellType[];

export type DoorCellType = (typeof DOOR_CELL_TYPES)[number];

export function isDoorType(t: DungeonCellType): t is DoorCellType {
  return (DOOR_CELL_TYPES as readonly DungeonCellType[]).includes(t);
}

/** Buňky průchozí pro hráče (spojitost bludiště, orientace dveří). */
export function isWalkable(t: DungeonCellType): boolean {
  return t !== 'empty' && t !== 'wall';
}

export interface DungeonCell {
  type: DungeonCellType;
  floorVariant?: string;
}

/** Katalog dekorací 21.3a (top-down glyfy). `label` = textový popisek. */
export const DECORATION_TYPES = [
  'bedna',
  'sud',
  'truhla',
  'postel',
  'stul',
  'zidle',
  'lavice',
  'regal',
  'krb',
  'oltar',
  'sloup',
  'studna',
  'zebrik',
  'sut',
  'label',
] as const;

export type DungeonDecorationType = (typeof DECORATION_TYPES)[number];

export interface DungeonDecoration {
  id: string;
  type: DungeonDecorationType;
  cellX: number;
  cellY: number;
  rotation: 0 | 90 | 180 | 270;
  /** Text pro `type: 'label'` (čísla/názvy místností). */
  label?: string;
}

export interface DungeonMap {
  id: string;
  worldId: string;
  /** Tvůrce (server-enforced). Legacy dokumenty bez ownerId = PJ-owned. */
  ownerId?: string;
  name: string;
  gridType: 'square' | 'hex';
  gridWidth: number;
  gridHeight: number;
  cellSize: number;
  theme: 'dyson' | 'modern';
  cells: DungeonCell[][];
  decorations: DungeonDecoration[];
  lastModified?: string;
}

/** Payload create/update — ownerId + id + lastModified spravuje server. */
export type DungeonMapInput = Omit<
  DungeonMap,
  'id' | 'ownerId' | 'lastModified'
>;

/** České popisky dekorací (paleta, tooltips). */
export const DECORATION_LABELS: Record<DungeonDecorationType, string> = {
  bedna: 'Bedna',
  sud: 'Sud',
  truhla: 'Truhla',
  postel: 'Postel',
  stul: 'Stůl',
  zidle: 'Židle',
  lavice: 'Lavice',
  regal: 'Regál',
  krb: 'Krb',
  oltar: 'Oltář',
  sloup: 'Sloup',
  studna: 'Studna',
  zebrik: 'Žebřík',
  sut: 'Suť',
  label: 'Popisek',
};

/** BE limity (dto) — zrcadlo pro FE validaci formulářů. */
export const DUNGEON_LIMITS = {
  minGrid: 10,
  maxGrid: 100,
  minCellSize: 8,
  maxCellSize: 100,
  maxDecorations: 500,
  maxNameLength: 120,
} as const;
