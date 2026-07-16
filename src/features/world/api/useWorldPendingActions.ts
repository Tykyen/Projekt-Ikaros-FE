import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/api/client';

/**
 * 15.10 — položka world-scoped fronty „ke zpracování".
 * Multi-typ, ať fronta unese víc druhů podnětů. Zatím `access-request`
 * (žádost o vstup); fáze C přidá `character-request` (návrh postavy).
 */
export interface WorldPendingActionItem {
  type: 'access-request';
  /** ID podkladové entity (accessRequestId). */
  id: string;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  /** ISO 8601. */
  createdAt: string;
  /**
   * 15.10 fáze C — jméno navržené postavy („chce hrát jako …"), když žadatel
   * zvolil „Chci hrát". Jinak prostá žádost o vstup.
   */
  characterName?: string;
}

/** Sdílený query key — používá stránka Hráči, drawer i zvoneček. */
export function worldPendingActionsKey(worldId: string) {
  return ['worlds', worldId, 'pending-actions'] as const;
}

/**
 * 15.10 — fronta „ke zpracování" pro daný svět (žádosti o vstup, …).
 * Jen pro PJ/co-PJ (BE gate); `enabled` drž na `isPJ`, ať ne-PJ nevolá 403.
 */
export function useWorldPendingActions(worldId: string, enabled = true) {
  return useQuery({
    queryKey: worldPendingActionsKey(worldId),
    queryFn: () =>
      api.get<WorldPendingActionItem[]>(`/worlds/${worldId}/pending-actions`),
    enabled: !!worldId && enabled,
    staleTime: 30_000,
  });
}
