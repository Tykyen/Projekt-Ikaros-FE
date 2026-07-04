/**
 * 13.4 / 13.4b — Mapy (obrázkový atlas světa). Zrcadlí BE `WorldMapEntry` +
 * `WorldMapFolder`. Hráčská odpověď má `visibleToPlayerIds` prázdné (leak-safe;
 * jen PJ vidí komu je co viditelné).
 */
/** 16.5 — cíl vlaječky po kliknutí. */
export type WorldMapPinTargetType = 'page' | 'map' | 'none';

/**
 * 16.5 — vlaječka (pin) nad obrázkem mapy. `x/y` v 0..1 (podíl šířky/výšky) →
 * responzivní, přežije výměnu obrázku. Vzhled (`icon`/`color`) volí PJ;
 * `targetType` nese roli. Tajný pin = `!isPublic` + `visibleToPlayerIds`
 * (hráčská odpověď má prázdné `visibleToPlayerIds`, tajné piny vůbec nechodí).
 */
export interface WorldMapPin {
  id: string;
  x: number;
  y: number;
  label: string;
  info: string;
  targetType: WorldMapPinTargetType;
  targetSlug: string | null;
  targetMapId: string | null;
  icon: string;
  color: string;
  isPublic: boolean;
  visibleToPlayerIds: string[];
}

export interface WorldMapEntry {
  id: string;
  /** Složka, do které mapa patří; `null` = kořen atlasu (13.4b). */
  folderId: string | null;
  title: string;
  description: string;
  imageUrl: string;
  order: number;
  isPublic: boolean;
  visibleToPlayerIds: string[];
  /** 16.5 — klikací vlaječky nad obrázkem. */
  pins: WorldMapPin[];
  /** 16.5b — id propojené taktické scény (1:1); `null` = nepropojeno. */
  linkedSceneId: string | null;
  createdAt: string;
  updatedAt: string;
}

/** 16.5 — vstup pro vytvoření/úpravu vlaječky (mirror BE Create/UpdatePinDto). */
export interface CreatePinInput {
  x: number;
  y: number;
  label?: string;
  info?: string;
  targetType?: WorldMapPinTargetType;
  targetSlug?: string | null;
  targetMapId?: string | null;
  icon?: string;
  color?: string;
  isPublic?: boolean;
  visibleToPlayerIds?: string[];
}

export type UpdatePinInput = Partial<CreatePinInput>;

export interface WorldMapFolder {
  id: string;
  /** Rodičovská složka; `null` = kořen (vnořený strom). */
  parentId: string | null;
  name: string;
  order: number;
  isPublic: boolean;
  visibleToPlayerIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateMapInput {
  title: string;
  description?: string;
  imageUrl: string;
  isPublic?: boolean;
  visibleToPlayerIds?: string[];
  folderId?: string | null;
}

export interface UpdateMapInput {
  title?: string;
  description?: string;
  imageUrl?: string;
  isPublic?: boolean;
  visibleToPlayerIds?: string[];
  folderId?: string | null;
  /** 16.5b — propojení s taktickou scénou (1:1); `null` = odpojit. */
  linkedSceneId?: string | null;
}

export interface CreateFolderInput {
  name: string;
  parentId?: string | null;
  isPublic?: boolean;
  visibleToPlayerIds?: string[];
}

export interface UpdateFolderInput {
  name?: string;
  parentId?: string | null;
  isPublic?: boolean;
  visibleToPlayerIds?: string[];
}
