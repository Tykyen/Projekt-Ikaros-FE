import { useEffect } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { api } from '@/shared/api/client';
import { accessTokenAtom } from '@/shared/store/authStore';
import { useSocketEvent, useSocketReconnect } from '@/features/chat';
import { mailKeys } from '@/features/ikaros/api/useMail';
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
  // N-33 — invaliduj jen při SYSTÉMOVÉ poště; běžná pošta od přátel záložku
  // „Události" (filtr `system=true`) neovlivní → žádné zbytečné refetchy/blikání.
  useSocketEvent<{ system?: boolean }>('ikaros:new-message', (p) => {
    if (p?.system) void qc.invalidateQueries({ queryKey: eventsKeys.all });
  });
  // C-46 — po reconnectu refetch (WS mohl během výpadku zmeškat systémové zprávy).
  useSocketReconnect(() => {
    void qc.invalidateQueries({ queryKey: eventsKeys.all });
  });

  const query = useInfiniteQuery({
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

  // FIX-1 — BE nemá bulk „mark all read"; `GET /ikaros-messages/:id` označí
  // JEDNU zprávu přečtenou (vzor `useMessageDetail` v Poště). Bez tohohle
  // badge „Události" (unread-count.systemUnread) nikdy nespadne na 0 — záložka
  // zprávy jen zobrazovala, nikdy je neotevřela jednotlivě.
  //
  // `query.data` je react-query InfiniteData — stabilní reference, dokud se
  // obsah fakticky nezmění (structuralSharing) → efekt neběží na každý
  // re-render, jen když přibude nová/jiná stránka.
  const data = query.data;
  useEffect(() => {
    if (!enabled || !token || !data) return;
    const unreadIds = data.pages
      .flat()
      .filter((m) => !m.isRead)
      .map((m) => m.id);
    if (unreadIds.length === 0) return;

    let cancelled = false;
    void Promise.allSettled(
      unreadIds.map((id) => api.get<IkarosMessage>(`/ikaros-messages/${id}`)),
    ).then(() => {
      if (cancelled) return;
      // Refetch feedu (isRead:true → zmizí tečka) + badge zvonku/Pošty.
      void qc.invalidateQueries({ queryKey: eventsKeys.all });
      void qc.invalidateQueries({ queryKey: mailKeys.unread });
    });
    return () => {
      cancelled = true;
    };
  }, [data, enabled, token, qc]);

  return query;
}
