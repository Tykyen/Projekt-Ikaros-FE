/**
 * 13.4 / 13.4b — Mapy (obrázkový atlas světa). Zrcadlí BE `WorldMapEntry` +
 * `WorldMapFolder`. Hráčská odpověď má `visibleToPlayerIds` prázdné (leak-safe;
 * jen PJ vidí komu je co viditelné).
 */
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
  createdAt: string;
  updatedAt: string;
}

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
