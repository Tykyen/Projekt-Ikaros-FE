import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { api } from '@/shared/api/client';
import { accessTokenAtom } from '@/shared/store/authStore';
import { useSocketEvent } from '@/features/chat';
import type { IkarosMessage } from '@/shared/types';

const PAGE_SIZE = 30;

export const eventsKeys = {
  all: ['notification-events'] as const,
};

/**
 * Spec 13.2b — záložka „Události": systémová oznámení z Pošty
 * (`senderId='system'`) = co mi schválili / přiřazení postavy. Sdílí data
 * s Poštou (jen filtr `?system=true`), žádné druhé úložiště.
 */
export function useEvents(enabled = true) {
  const token = useAtomValue(accessTokenAtom);
  const qc = useQueryClient();

  // Nová systémová zpráva (schválení, přiřazení) přijde stejným WS jako pošta.
  useSocketEvent('ikaros:new-message', () => {
    void qc.invalidateQueries({ queryKey: eventsKeys.all });
  });

  return useInfiniteQuery({
    queryKey: eventsKeys.all,
    queryFn: ({ pageParam }) =>
      api.get<IkarosMessage[]>('/ikaros-messages/inbox', {
        system: true,
        limit: PAGE_SIZE,
        ...(pageParam ? { before: pageParam } : {}),
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) =>
      last.length === PAGE_SIZE ? last[last.length - 1]?.id : undefined,
    enabled: !!token && enabled,
    staleTime: 30_000,
  });
}
