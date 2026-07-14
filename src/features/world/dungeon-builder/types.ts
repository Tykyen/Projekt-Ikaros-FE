/**
 * 21.3a — Tvorba podzemí: FE zrcadlo BE `dungeon-maps` modelu
 * (backend/src/modules/dungeon-maps/interfaces/dungeon-map.interface.ts).
 *
 * Buňkový model: `empty` = skalní masiv (černá), `floor` = podlaha; zdi jsou
 * implicitní hranice podlaha↔skála (donjon styl). `wallEdges` se v 21.3a
 * nepoužívají (BE je má volitelné) — FE je neposílá, šetří payload.
 */

/**
 * 21.3e — druh mapy: podzemí (negativ do skály, `empty` = masiv) / město
 * (pozitiv na terén, `empty` = volná zem). Volí se při založení, nekonvertuje.
 */
export type MapKind = 'dungeon' | 'city' | 'wilderness';

export const MAP_KIND_LABELS: Record<MapKind, string> = {
  dungeon: 'Podzemí',
  city: 'Město',
  wilderness: 'Krajina',
};

/** Normalizace neznámého/legacy druhu na validní MapKind. */
export function normalizeMapKind(kind: string | undefined | null): MapKind {
  return kind === 'city' || kind === 'wilderness' ? kind : 'dungeon';
}

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
  | 'pit'
  // 21.3e — město
  | 'street'
  | 'building'
  | 'city-wall'
  | 'gate'
  | 'bridge'
  // 21.3g — krajina (`street` se v krajině renderuje jako polní cesta)
  | 'forest'
  | 'mountain'
  | 'hill'
  | 'field'
  | 'swamp';

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

/** Buňky průchozí pro hráče (spojitost bludiště, orientace dveří) — DUNGEON. */
export function isWalkable(t: DungeonCellType): boolean {
  return t !== 'empty' && t !== 'wall' && !blocksSightCity(t);
}

/** 21.3e — město: pohled blokují budovy a hradby (zrcadlo BE walls util). */
export function blocksSightCity(t: DungeonCellType): boolean {
  return t === 'building' || t === 'city-wall';
}

/** 21.3g — krajina: hustý les, hory a budovy kryjí výhled (zrcadlo BE). */
export function blocksSightWilderness(t: DungeonCellType): boolean {
  return t === 'forest' || t === 'mountain' || t === 'building';
}

/** 21.3d — povrch podlahy (jemné šrafování, maluje se jen na `floor`). */
export const FLOOR_VARIANTS = [
  'dlazba',
  'drevo',
  'hlina',
  'pisek',
  'trava',
] as const;

export type FloorVariant = (typeof FLOOR_VARIANTS)[number];

export const FLOOR_VARIANT_LABELS: Record<FloorVariant, string> = {
  dlazba: 'Dlažba',
  drevo: 'Dřevo',
  hlina: 'Hlína',
  pisek: 'Písek',
  trava: 'Tráva',
};

export interface DungeonCell {
  type: DungeonCellType;
  floorVariant?: string;
}

/** Katalog dekorací 21.3a+d (top-down glyfy). `label` = textový popisek. */
export const DECORATION_TYPES = [
  // Nábytek
  'stul',
  'zidle',
  'kreslo',
  'trun',
  'lavice',
  'postel',
  'regal',
  'skrin',
  'stojan-zbrani',
  'koberec',
  // Kontejnery
  'bedna',
  'sud',
  'truhla',
  'kos',
  'pytel',
  'amfora',
  'klec',
  // Dungeon
  'sloup',
  'oltar',
  'studna',
  'krb',
  'svicen',
  'kostra',
  'retezy',
  'socha',
  'fontana',
  'ohnivy-kos',
  'kotel',
  'magicky-kruh',
  'nahrobek',
  // Jeskyně
  'sut',
  'stalagmit',
  'krystaly',
  'houby',
  'pavucina',
  'koreny',
  'jezirko',
  // Tábor
  'ohniste',
  'stan',
  'zasoby',
  'spaci-pytel',
  // Město (21.3e)
  'stanek',
  'vozik',
  'lucerna',
  'strom',
  'ker',
  'plot',
  // Markery
  'zebrik',
  'marker-klic',
  'marker-poklad',
  'marker-vykricnik',
  'marker-hvezda',
  'marker-otaznik',
  'label',
] as const;

export type DungeonDecorationType = (typeof DECORATION_TYPES)[number];

/** 21.3d — kategorie palety dekorací (pořadí = pořadí sekcí v UI). */
export const DECORATION_CATEGORIES: readonly {
  key: string;
  label: string;
  types: readonly Exclude<DungeonDecorationType, 'label'>[];
}[] = [
  {
    key: 'nabytek',
    label: 'Nábytek',
    types: ['stul', 'zidle', 'kreslo', 'trun', 'lavice', 'postel', 'regal', 'skrin', 'stojan-zbrani', 'koberec'],
  },
  {
    key: 'kontejnery',
    label: 'Kontejnery',
    types: ['bedna', 'sud', 'truhla', 'kos', 'pytel', 'amfora', 'klec'],
  },
  {
    key: 'dungeon',
    label: 'Dungeon',
    types: ['sloup', 'oltar', 'studna', 'krb', 'svicen', 'kostra', 'retezy', 'socha', 'fontana', 'ohnivy-kos', 'kotel', 'magicky-kruh', 'nahrobek'],
  },
  {
    key: 'jeskyne',
    label: 'Jeskyně',
    types: ['sut', 'stalagmit', 'krystaly', 'houby', 'pavucina', 'koreny', 'jezirko'],
  },
  {
    key: 'tabor',
    label: 'Tábor',
    types: ['ohniste', 'stan', 'zasoby', 'spaci-pytel'],
  },
  {
    key: 'mesto',
    label: 'Město',
    types: ['stanek', 'vozik', 'lucerna', 'strom', 'ker', 'plot', 'fontana', 'studna', 'socha'],
  },
  {
    key: 'markery',
    label: 'Markery (PJ)',
    types: ['zebrik', 'marker-klic', 'marker-poklad', 'marker-vykricnik', 'marker-hvezda', 'marker-otaznik'],
  },
];

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
  /** 21.3c — null = položka osobní knihovny (cross-world). */
  worldId: string | null;
  /** Tvůrce (server-enforced). Legacy dokumenty bez ownerId = PJ-owned. */
  ownerId?: string;
  name: string;
  /** 21.3e — druh mapy; legacy bez pole = dungeon (BE normalizuje). */
  mapKind?: MapKind;
  gridType: 'square' | 'hex';
  gridWidth: number;
  gridHeight: number;
  cellSize: number;
  theme: 'dyson' | 'modern';
  cells: DungeonCell[][];
  decorations: DungeonDecoration[];
  /** 21.3f — klíč mapy: popisy k popiskům (číslo → text pro PJ). */
  notes?: DungeonNote[];
  lastModified?: string;
}

/** 21.3f — položka klíče mapy; `label` = text popisku na mapě (typicky číslo). */
export interface DungeonNote {
  label: string;
  title: string;
  text: string;
}

/** Payload create/update — ownerId + id + lastModified spravuje server. */
export type DungeonMapInput = Omit<
  DungeonMap,
  'id' | 'ownerId' | 'lastModified'
>;

/** České popisky dekorací (paleta, tooltips). */
export const DECORATION_LABELS: Record<DungeonDecorationType, string> = {
  stul: 'Stůl',
  zidle: 'Židle',
  kreslo: 'Křeslo',
  trun: 'Trůn',
  lavice: 'Lavice',
  postel: 'Postel',
  regal: 'Regál',
  skrin: 'Skříň',
  'stojan-zbrani': 'Stojan zbraní',
  koberec: 'Koberec',
  bedna: 'Bedna',
  sud: 'Sud',
  truhla: 'Truhla',
  kos: 'Koš',
  pytel: 'Pytel',
  amfora: 'Amfora',
  klec: 'Klec',
  sloup: 'Sloup',
  oltar: 'Oltář',
  studna: 'Studna',
  krb: 'Krb',
  svicen: 'Svícen',
  kostra: 'Kostra',
  retezy: 'Řetězy',
  socha: 'Socha',
  fontana: 'Fontána',
  'ohnivy-kos': 'Koš s ohněm',
  kotel: 'Kotel',
  'magicky-kruh': 'Magický kruh',
  nahrobek: 'Náhrobek',
  sut: 'Suť',
  stalagmit: 'Stalagmit',
  krystaly: 'Krystaly',
  houby: 'Houby',
  pavucina: 'Pavučina',
  koreny: 'Kořeny',
  jezirko: 'Jezírko',
  ohniste: 'Ohniště',
  stan: 'Stan',
  zasoby: 'Zásoby',
  'spaci-pytel': 'Spací pytel',
  stanek: 'Stánek',
  vozik: 'Vozík',
  lucerna: 'Lucerna',
  strom: 'Strom',
  ker: 'Keř',
  plot: 'Plot',
  zebrik: 'Žebřík',
  'marker-klic': 'Klíč (marker)',
  'marker-poklad': 'Poklad ✕',
  'marker-vykricnik': 'Vykřičník',
  'marker-hvezda': 'Hvězda',
  'marker-otaznik': 'Otazník',
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
