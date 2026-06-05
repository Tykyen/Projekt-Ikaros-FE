import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';

interface BulkResult {
  succeeded: string[];
  failed: { id: string; reason: string }[];
}

/**
 * D-NEW-bulk-pending-articles (2026-05-21) — Bulk approve/reject pending článků
 * pro SpravceClanku. BE endpoint `POST /ikaros-articles/bulk/approve` (+reject)
 * vrací summary `{succeeded, failed}` (per-ID partial failures).
 *
 * Použít v UI: SpravciClanku v tabu Pending mají multi-select checkboxy
 * + action bar „Schválit X / Zamítnout X". Tady jen hook; UI multi-select
 * komponenta je samostatný UX krok (zatím nehotová — feature schopná použít hook).
 */
export function useBulkApproveArticles() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) =>
      api.post<BulkResult>('/ikaros-articles/bulk/approve', { ids }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['articles'] });
      // C-37 — dead key ['articles','pending'] nahrazen review frontou + badge.
      void qc.invalidateQueries({ queryKey: ['pending-actions'] });
    },
  });
}

export function useBulkRejectArticles() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, reason }: { ids: string[]; reason?: string }) =>
      api.post<BulkResult>('/ikaros-articles/bulk/reject', { ids, reason }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['articles'] });
      // C-37 — dead key ['articles','pending'] nahrazen review frontou + badge.
      void qc.invalidateQueries({ queryKey: ['pending-actions'] });
    },
  });
}
