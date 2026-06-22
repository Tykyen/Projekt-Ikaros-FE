/**
 * 15B.7 — zrcadlo BE `AnalyticsSummary`
 * (`backend/src/modules/analytics/dto/analytics-summary.dto.ts`).
 * Agregovaná návštěvnost platformy pro admin Přehled.
 */
export type ReferrerCategory =
  | 'search'
  | 'social'
  | 'referral'
  | 'internal'
  | 'direct';

export interface AnalyticsSummary {
  range: { days: number; from: string; to: string };
  totals: {
    views: number;
    visitors: number;
    anonShare: number; // 0..1
  };
  daily: { date: string; views: number; visitors: number }[];
  topPaths: { path: string; views: number }[];
  sources: { category: ReferrerCategory; views: number }[];
  generatedAt: string;
}

export type AnalyticsDays = 7 | 30 | 90;
