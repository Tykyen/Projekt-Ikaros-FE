import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { useRequestUsernameChange } from './useAdminUsers';
import { api } from '@/shared/api/client';

// F-27 — kontraktový test: FE payload musí nést klíč, který BE DTO očekává.
// Žádost o změnu username byla rozbitá — FE posílal `requestedUsername`, ale
// `RequestUsernameChangeDto` čeká `newUsername` → whitelist drop → 400.

vi.mock('@/shared/api/client', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), patch: vi.fn() },
  parseApiError: vi.fn(() => 'err'),
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const Wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  return { Wrapper };
}

describe('useRequestUsernameChange — F-27 kontrakt FE↔DTO', () => {
  beforeEach(() => vi.clearAllMocks());

  it('posílá pole `newUsername` (ne `requestedUsername`) na /users/me/username-request', async () => {
    vi.mocked(api.post).mockResolvedValue({ request: {} });
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useRequestUsernameChange(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync('novy-username');
    });

    expect(api.post).toHaveBeenCalledWith('/users/me/username-request', {
      newUsername: 'novy-username',
    });
    const body = vi.mocked(api.post).mock.calls[0][1] as Record<string, unknown>;
    expect(body).not.toHaveProperty('requestedUsername');
  });
});
