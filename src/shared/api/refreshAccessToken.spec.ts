// 23.5 — single-flight refresh: souběžné 401 nesmí vystřelit víc /auth/refresh
// requestů (race → BE reuse-detection → revoke rodiny → odhlášení).
import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { getDefaultStore } from 'jotai';
import { toast } from 'sonner';
import { router } from '@/app/router';
import { accessTokenAtom } from '@/shared/store/authStore';
import { refreshAccessToken } from './client';

vi.mock('@/app/router', () => ({
  router: { navigate: vi.fn().mockResolvedValue(undefined) },
}));

vi.mock('sonner', () => ({
  toast: { info: vi.fn(), error: vi.fn() },
}));

vi.mock('axios', () => {
  // client.ts při importu volá axios.create → instance s interceptory.
  const instance = Object.assign(vi.fn(), {
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  });
  const mockAxios = {
    create: vi.fn(() => instance),
    post: vi.fn(),
    isAxiosError: vi.fn(() => false),
  };
  return { default: mockAxios, ...mockAxios };
});

describe('refreshAccessToken — single-flight (23.5)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getDefaultStore().set(accessTokenAtom, 'stale');
  });

  it('souběžná volání sdílí JEDEN request a všechna dostanou nový token', async () => {
    let resolveFlight!: (v: unknown) => void;
    vi.mocked(axios.post).mockReturnValue(
      new Promise((r) => {
        resolveFlight = r;
      }) as never,
    );

    const flights = [
      refreshAccessToken(),
      refreshAccessToken(),
      refreshAccessToken(),
    ];
    resolveFlight({ data: { accessToken: 'fresh' } });

    await expect(Promise.all(flights)).resolves.toEqual([
      'fresh',
      'fresh',
      'fresh',
    ]);
    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(getDefaultStore().get(accessTokenAtom)).toBe('fresh');
  });

  it('po doletu se flight resetne — další volání = nový request', async () => {
    vi.mocked(axios.post).mockResolvedValue({
      data: { accessToken: 'a1' },
    } as never);

    await refreshAccessToken();
    await refreshAccessToken();

    expect(axios.post).toHaveBeenCalledTimes(2);
  });

  it('fail → toast + redirect právě 1×, všichni čekající dostanou reject', async () => {
    vi.mocked(axios.post).mockRejectedValue(new Error('401'));

    const p1 = refreshAccessToken();
    const p2 = refreshAccessToken();

    await expect(p1).rejects.toThrow('401');
    await expect(p2).rejects.toThrow('401');
    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(toast.info).toHaveBeenCalledTimes(1);
    expect(router.navigate).toHaveBeenCalledTimes(1);
    expect(getDefaultStore().get(accessTokenAtom)).toBeNull();
  });
});
