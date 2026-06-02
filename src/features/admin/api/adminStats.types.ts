/**
 * 12.1 — zrcadlo BE `AdminStatsOverview`
 * (`backend/src/modules/admin/dto/admin-stats-overview.dto.ts`).
 * Snapshot platformových statistik pro admin dashboard.
 */
export interface AdminStatsOverview {
  users: {
    total: number;
    online: number;
    newLast7Days: number;
    pendingDeletion: number;
  };
  worlds: {
    total: number;
  };
  content: {
    articles: number;
    galleryImages: number;
    discussions: number;
  };
  queue: {
    pendingUsernameRequests: number;
  };
  generatedAt: string;
}
