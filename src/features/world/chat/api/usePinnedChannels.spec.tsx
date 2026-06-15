import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getDefaultStore } from 'jotai';
import type { PropsWithChildren } from 'react';
import { usePinnedChannels } from './usePinnedChannels';
import { currentUserAtom } from '@/shared/store/authStore';
import type { User } from '@/shared/types';

vi.mock('@/shared/api/client', () => ({ api: { patch: vi.fn() } }));

function makeWrapperWithQc() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  return { wrapper, qc };
}

const store = getDefaultStore();

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  store.set(currentUserAtom, {
    id: 'u1',
    chatPreferences: { pinnedChannelIds: [] },
  } as unknown as User);
});

afterEach(() => {
  vi.useRealTimers();
  store.set(currentUserAtom, null);
});

describe('usePinnedChannels', () => {
  // C-58 — togglePin musí držet ['users','me'] cache v sync s atomem (optimistic
  // setQueryData), jinak by refetch /users/me (hydration bridge) přepsal atom
  // zpět na stav bez pinu. Test ověří, že pin se promítne i do RQ cache.
  it('C-58 — togglePin propíše pin do users/me cache', async () => {
    const { wrapper, qc } = makeWrapperWithQc();
    // Seed cache jako po /users/me.
    qc.setQueryData<User>(['users', 'me'], {
      id: 'u1',
      chatPreferences: { pinnedChannelIds: [] },
    } as unknown as User);

    const { result } = renderHook(() => usePinnedChannels(), { wrapper });
    act(() => {
      result.current.togglePin('chan-1');
    });

    const cached = qc.getQueryData<User>(['users', 'me']);
    const pinned =
      (cached?.chatPreferences?.pinnedChannelIds as string[] | undefined) ?? [];
    expect(pinned).toContain('chan-1');
  });
});
