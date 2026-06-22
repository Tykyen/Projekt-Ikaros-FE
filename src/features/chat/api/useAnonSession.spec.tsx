import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider as JotaiProvider, createStore } from 'jotai';
import type { PropsWithChildren } from 'react';
import { useAnonSession } from './useAnonSession';
import { anonSessionAtom } from '../store/anonSession';
import { api } from '@/shared/api/client';

vi.mock('@/shared/api/client', () => ({ api: { post: vi.fn() } }));

describe('useAnonSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('startSession → POST /auth/anon-session + uloží session do atomu', async () => {
    vi.mocked(api.post).mockResolvedValue({
      token: 'guest.jwt',
      anonName: 'anonym1234',
      anonId: 'anon_1',
    });
    const store = createStore();
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const Wrapper = ({ children }: PropsWithChildren) => (
      <JotaiProvider store={store}>
        <QueryClientProvider client={qc}>{children}</QueryClientProvider>
      </JotaiProvider>
    );
    const { result } = renderHook(() => useAnonSession(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.startSession('captcha-tok');
    });

    expect(api.post).toHaveBeenCalledWith('/auth/anon-session', {
      captchaToken: 'captcha-tok',
    });
    expect(store.get(anonSessionAtom)).toEqual({
      token: 'guest.jwt',
      anonName: 'anonym1234',
      anonId: 'anon_1',
    });
  });
});
