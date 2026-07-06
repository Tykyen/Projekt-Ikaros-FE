import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, parseApiError } from '@/shared/api/client';
import { useMyWorlds } from '@/features/world/api/useWorlds';
import type { MyWorldEntry } from '@/shared/types';

export interface ChatPrefsPatch {
  groupOrder?: string[];
  channelOrder?: Record<string, string[]>;
  expandedGroups?: string[];
  pinnedOrder?: string[];
  lastActiveChannelId?: string;
}

const MY_WORLDS_KEY = ['worlds', 'my'] as const;
const DEBOUNCE_MS = 400;

/**
 * 6.7b/c — osobní stav chat sidebaru (pořadí kanálů/konverzací + sbalení) per
 * hráč. Čte z `useMyWorlds` membershipu, zapisuje **optimisticky** do RQ cache
 * (instant UI) + **debounced** PATCH na BE (`…/chat/my-prefs`). Drag i toggle
 * collapse jsou časté → debounce drží počet requestů nízko.
 */
export function useChatPrefs(worldId: string) {
  const qc = useQueryClient();
  const myWorlds = useMyWorlds();
  const membership = useMemo(
    () =>
      myWorlds.data?.find((w) => w.world.id === worldId)?.membership ?? null,
    [myWorlds.data, worldId],
  );

  // useMemo — stabilní reference (jinak `?? []` mění deps useCallbacků každý render).
  const groupOrder = useMemo(
    () => membership?.chatGroupOrder ?? [],
    [membership],
  );
  const channelOrder = useMemo(
    () => membership?.chatChannelOrder ?? {},
    [membership],
  );
  const expandedGroups = useMemo(
    () => membership?.chatExpandedGroups ?? [],
    [membership],
  );
  const pinnedOrder = useMemo(
    () => membership?.chatPinnedOrder ?? [],
    [membership],
  );
  const lastActiveChannelId = useMemo(
    () => membership?.chatLastActiveChannelId ?? null,
    [membership],
  );

  const { mutate } = useMutation({
    mutationFn: (dto: ChatPrefsPatch) =>
      api.patch(`/worlds/${worldId}/chat/my-prefs`, dto),
  });

  const patchRef = useRef<ChatPrefsPatch>({});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // FIX-3d — snapshot cache PŘED první optimistic úpravou v aktuální debounce
  // dávce (`timerRef.current === null` = žádná dávka neběží). Když PATCH na
  // konci dávky selže, vrátíme cache na tento stav (vzor `useChannelMutations`
  // rollback), místo aby si klient nesynchronizovaně myslel, že se pořadí
  // uložilo.
  const snapshotRef = useRef<MyWorldEntry[] | undefined>(undefined);

  // Unmount — flush pending debounce, ať se poslední změna neztratí. Cache
  // (queryClient) přežívá unmount, takže rollback při chybě má pořád smysl.
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      const dto = patchRef.current;
      if (Object.keys(dto).length > 0) {
        const snapshot = snapshotRef.current;
        void api.patch(`/worlds/${worldId}/chat/my-prefs`, dto).catch(() => {
          if (snapshot) qc.setQueryData(MY_WORLDS_KEY, snapshot);
        });
        patchRef.current = {};
      }
    };
  }, [worldId, qc]);

  /** Optimistic zápis do `['worlds','my']` cache + naplánování debounced PATCH. */
  const apply = useCallback(
    (patch: ChatPrefsPatch) => {
      if (timerRef.current === null) {
        snapshotRef.current = qc.getQueryData<MyWorldEntry[]>(MY_WORLDS_KEY);
      }
      qc.setQueryData<MyWorldEntry[]>(MY_WORLDS_KEY, (old) =>
        (old ?? []).map((e) =>
          e.world.id !== worldId
            ? e
            : {
                ...e,
                membership: {
                  ...e.membership,
                  ...(patch.groupOrder !== undefined && {
                    chatGroupOrder: patch.groupOrder,
                  }),
                  ...(patch.channelOrder !== undefined && {
                    chatChannelOrder: patch.channelOrder,
                  }),
                  ...(patch.expandedGroups !== undefined && {
                    chatExpandedGroups: patch.expandedGroups,
                  }),
                  ...(patch.pinnedOrder !== undefined && {
                    chatPinnedOrder: patch.pinnedOrder,
                  }),
                  ...(patch.lastActiveChannelId !== undefined && {
                    chatLastActiveChannelId: patch.lastActiveChannelId,
                  }),
                },
              },
        ),
      );
      patchRef.current = { ...patchRef.current, ...patch };
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        const dto = patchRef.current;
        const snapshot = snapshotRef.current;
        patchRef.current = {};
        timerRef.current = null;
        mutate(dto, {
          onError: (err) => {
            if (snapshot) qc.setQueryData(MY_WORLDS_KEY, snapshot);
            toast.error(`Uložení nastavení chatu selhalo: ${parseApiError(err)}`);
          },
        });
      }, DEBOUNCE_MS);
    },
    [qc, worldId, mutate],
  );

  /** Nejnovější channelOrder z cache (ne ze stale render closure) — kvůli rychlým po sobě jdoucím reorderům. */
  const currentChannelOrder = useCallback((): Record<string, string[]> => {
    const m = qc
      .getQueryData<MyWorldEntry[]>(MY_WORLDS_KEY)
      ?.find((e) => e.world.id === worldId)?.membership;
    return m?.chatChannelOrder ?? {};
  }, [qc, worldId]);

  const setGroupOrder = useCallback(
    (order: string[]) => apply({ groupOrder: order }),
    [apply],
  );
  const setChannelOrder = useCallback(
    (groupId: string, order: string[]) =>
      apply({ channelOrder: { ...currentChannelOrder(), [groupId]: order } }),
    [apply, currentChannelOrder],
  );
  const toggleExpanded = useCallback(
    (groupId: string) => {
      const set = new Set(expandedGroups);
      if (set.has(groupId)) set.delete(groupId);
      else set.add(groupId);
      apply({ expandedGroups: [...set] });
    },
    [apply, expandedGroups],
  );
  const setPinnedOrder = useCallback(
    (order: string[]) => apply({ pinnedOrder: order }),
    [apply],
  );
  const setLastActiveChannel = useCallback(
    (channelId: string) => apply({ lastActiveChannelId: channelId }),
    [apply],
  );

  return {
    groupOrder,
    channelOrder,
    expandedGroups,
    pinnedOrder,
    lastActiveChannelId,
    // Settled (success i error) — gate pro „čekej na server seed, ať default
    // nepřebije cross-device poslední konverzaci" ve WorldChatRoom.
    prefsLoaded: !myWorlds.isLoading,
    setGroupOrder,
    setChannelOrder,
    toggleExpanded,
    setPinnedOrder,
    setLastActiveChannel,
  };
}
