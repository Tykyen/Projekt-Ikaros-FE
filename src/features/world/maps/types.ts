/**
 * 13.4 — Mapy (obrázkový atlas světa). Zrcadlí BE `WorldMapEntry`.
 * Hráčská odpověď má `visibleToPlayerIds` prázdné (leak-safe; jen PJ vidí komu).
 */
export interface WorldMapEntry {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
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
}

export interface UpdateMapInput {
  title?: string;
  description?: string;
  imageUrl?: string;
  isPublic?: boolean;
  visibleToPlayerIds?: string[];
}
