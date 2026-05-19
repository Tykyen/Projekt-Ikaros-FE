import { useCallback, useMemo, useRef } from 'react';
import { useAtomValue, getDefaultStore } from 'jotai';
import { api } from '@/shared/api/client';
import { currentUserAtom } from '@/shared/store/authStore';

/**
 * Připnuté konverzace (krok 6.1c) — per-user, uložené v
 * `User.chatPreferences.pinnedChannelIds` (jako starý Matrix). Optimistická
 * aktualizace atomu je okamžitá; PATCH `/users/me` je debouncovaný (600 ms),
 * ať rychlé klikání negeneruje zbytečné requesty.
 */
export function usePinnedChannels(): {
  pinned: string[];
  isPinned: (channelId: string) => boolean;
  togglePin: (channelId: string) => void;
} {
  const user = useAtomValue(currentUserAtom);
  const pinned = useMemo<string[]>(
    () =>
      (user?.chatPreferences?.pinnedChannelIds as string[] | undefined) ?? [],
    [user?.chatPreferences],
  );
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const togglePin = useCallback((channelId: string) => {
    const store = getDefaultStore();
    const cur = store.get(currentUserAtom);
    if (!cur) return;
    const curPinned =
      (cur.chatPreferences?.pinnedChannelIds as string[] | undefined) ?? [];
    const next = curPinned.includes(channelId)
      ? curPinned.filter((id) => id !== channelId)
      : [...curPinned, channelId];
    const chatPreferences = {
      ...cur.chatPreferences,
      pinnedChannelIds: next,
    };
    // Optimisticky hned — UI reaguje okamžitě.
    store.set(currentUserAtom, { ...cur, chatPreferences });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      void api.patch('/users/me', { chatPreferences });
    }, 600);
  }, []);

  return {
    pinned,
    isPinned: (id: string) => pinned.includes(id),
    togglePin,
  };
}
