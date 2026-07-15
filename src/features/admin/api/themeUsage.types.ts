/**
 * 20.6 — zrcadlo BE `ThemeUsageStats`
 * (`backend/src/modules/admin/dto/theme-usage.dto.ts`).
 * Využití motivů a skinů pro admin Přehled — podklad pro osekání
 * málo využívaných. Vše čistá agregace stavu DB (žádný nový tracking).
 */

export interface DimensionUsage {
  /** Celkem entit v dimenzi (users / worlds / memberships). */
  total: number;
  /**
   * Z toho bez explicitní volby (`field == null` → dědí default).
   * ⚠️ NENÍ „nevyužité" — jedou na děděném defaultu (spec 20.6 §4).
   */
  noChoice: number;
  /**
   * `themeId`/`skinId` → počet ENTIT s explicitní volbou. Klíče = jen ID
   * skutečně v DB (i legacy/neznámá — FE je klasifikuje přes theme registry).
   */
  counts: Record<string, number>;
}

export interface ThemeUsageStats {
  generatedAt: string; // ISO
  platformTheme: DimensionUsage; // User.themeId
  worldTheme: DimensionUsage; // World.themeId
  memberTheme: DimensionUsage; // WorldMembership.themeId (5.9b)
  diarySkin: DimensionUsage; // WorldMembership.diarySkin (16.2c)
  chatSkin: DimensionUsage; // WorldMembership.chatSkin (16.1d)
}

/** Klíče dimenzí (bez `generatedAt`). */
export type ThemeUsageDimensionKey = Exclude<
  keyof ThemeUsageStats,
  'generatedAt'
>;
