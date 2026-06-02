/**
 * Krok 11.3 — Obchod (FE typy). Zrcadlo BE modulu `campaign`
 * (`CampaignShopItem`, `CampaignShopGroup`). Datumy = ISO stringy přes JSON.
 *
 * `groupId` ref na `ShopGroup` (prázdné = nezařazeno); `discountPercent` 0–100
 * na položce i skupině — položka přebíjí skupinu (viz `pricing.ts`).
 */

export interface ShopGroup {
  id: string;
  worldId: string;
  ownerId: string;
  isShared: boolean;
  name: string;
  /** undefined = top skupina; jinak id rodičovské skupiny (2 úrovně). */
  parentId?: string;
  order: number;
  discountPercent: number;
  createdAt: string;
  updatedAt: string;
}

export interface ShopItem {
  id: string;
  worldId: string;
  ownerId: string;
  isShared: boolean;
  name: string;
  description?: string;
  groupId: string;
  subgroupId?: string;
  price: number;
  currencyCode: string;
  discountPercent: number;
  linkedItemIds: string[];
  /** Slug stránky světa (wiki překlik), ne URL. */
  referenceLink?: string;
  isRecommended: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateShopItemInput {
  name: string;
  description?: string;
  groupId?: string;
  subgroupId?: string;
  price?: number;
  currencyCode?: string;
  discountPercent?: number;
  linkedItemIds?: string[];
  referenceLink?: string;
  isRecommended?: boolean;
  isShared?: boolean;
}

export interface CreateShopGroupInput {
  name: string;
  parentId?: string;
  order?: number;
  discountPercent?: number;
  isShared?: boolean;
}

// ── Nákup / storno (N1/N2) ────────────────────────────────────────────────

export interface PurchaseItemSnapshot {
  name: string;
  groupName?: string;
  subgroupName?: string;
  unitPrice: number;
  currencyCode: string;
  discountPercent: number;
  referenceLink?: string;
}

export interface Purchase {
  id: string;
  worldId: string;
  characterId: string;
  buyerUserId: string;
  shopItemId: string;
  itemSnapshot: PurchaseItemSnapshot;
  quantity: number;
  unitPriceOriginal: number;
  discountPercent: number;
  accountId: string;
  accountTransactionId: string;
  paidAmount: number;
  paidCurrency: string;
  inventorySectionId: string;
  inventoryItemId: string;
  status: 'active' | 'refunded';
  refundedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseInput {
  itemId: string;
  characterId: string;
  accountId: string;
  quantity?: number;
  sectionId?: string;
}

export interface PurchaseResult {
  purchase: Purchase;
  newBalance: number;
}
