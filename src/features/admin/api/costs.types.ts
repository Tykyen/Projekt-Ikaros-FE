/**
 * 19.2 — zrcadlo BE `CostStats`
 * (`backend/src/modules/admin/dto/cost-stats.dto.ts`).
 * Počítadla nákladů (jen měřit) pro admin Přehled — tři vrstvy:
 * A počty blobů (odvozené z DB), B přesné byty kde je známe,
 * C skutečný provoz Cloudinary (volitelné). Viz spec 19.2.
 */

export interface CostBlobType {
  /** klíč typu blobu, např. `gallery`, `worldMaps`, `scenes`… */
  type: string;
  count: number;
}

export interface CostTopWorld {
  worldId: string;
  worldName: string;
  count: number;
}

export interface CostStats {
  generatedAt: string;
  /** Vrstva A — počty blobů (ne velikost). */
  blobs: {
    total: number;
    byType: CostBlobType[];
    topWorlds: CostTopWorld[];
  };
  /** Vrstva B — přesné byty, jen kde je DB má (chat přílohy + admin PDF). */
  measuredBytes: {
    chatAttachments: number;
    adminDocuments: number;
  };
  /** Vrstva C — skutečný provoz Cloudinary; `available:false` když chybí creds. */
  cloudinary: {
    available: boolean;
    storageBytes?: number;
    bandwidthBytes?: number;
    transformations?: number;
    credits?: { used: number; limit: number };
    plan?: string;
  };
  /** Fáze 18 zatím neexistuje → placeholder. */
  ai: { available: false };
}
