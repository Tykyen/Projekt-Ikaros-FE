import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { useResetPassword } from './useResetPassword';
import { api } from '@/shared/api/client';

// F-01 — kontraktový test: FE payload musí nést klíče, které BE DTO očekává.
// Reset hesla z emailu byl rozbitý, protože FE posílal `newPassword`, ale
// `auth/reset-password.dto` čeká `password` → whitelist drop → 400.

vi.mock('@/shared/api/client', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const Wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  return { Wrapper };
}

describe('useResetPassword — F-01 kontrakt FE↔DTO', () => {
  beforeEach(() => vi.clearAllMocks());

  it('posílá pole `password` (ne `newPassword`) na /auth/reset-password', async () => {
    vi.mocked(api.post).mockResolvedValue({ ok: true });
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useResetPassword(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        token: 'tok-123',
        newPassword: 'NoveHeslo8',
      });
    });

    expect(api.post).toHaveBeenCalledWith('/auth/reset-password', {
      token: 'tok-123',
      password: 'NoveHeslo8',
    });
    // pojistka proti regresi: `newPassword` se nesmí dostat do body (BE ho zahodí)
    const body = vi.mocked(api.post).mock.calls[0][1] as Record<string, unknown>;
    expect(body).not.toHaveProperty('newPassword');
  });
});
