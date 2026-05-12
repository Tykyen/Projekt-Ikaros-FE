import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import type {
  PendingActionType,
  PendingActionsCountResponse,
  PendingActionsListResponse,
} from '@/shared/types';

/**
 * Spec 1.4 — suma pending akcí pro current usera (Zpracovat tab badge,
 * pravý panel link badge).
 */
export function usePendingActionsCount(enabled = true) {
  return useQuery({
    queryKey: ['pending-actions', 'count'],
    queryFn: () =>
      api.get<PendingActionsCountResponse>('/pending-actions/count'),
    enabled,
    staleTime: 30_000,
  });
}

/**
 * Spec 1.4 — pending položky jednoho typu. Šape položek je discriminated
 * union podle `type` (volá registry rendereru na FE).
 */
export function usePendingActions<T = unknown>(
  type: PendingActionType,
  page = 1,
  limit = 20,
  enabled = true,
) {
  return useQuery({
    queryKey: ['pending-actions', type, page, limit],
    queryFn: () =>
      api.get<PendingActionsListResponse<T>>('/pending-actions', {
        type,
        page,
        limit,
      }),
    enabled,
    staleTime: 30_000,
  });
}
