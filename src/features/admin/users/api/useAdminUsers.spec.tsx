import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import {
  useAdminUpdateRole,
  useAdminBanUser,
  useAdminBulkBan,
  useAdminApproveUsernameRequest,
  useAdminRejectUsernameRequest,
} from './useAdminUsers';
import { adminKeys } from '../../api/adminKeys';
import { UserRole } from '@/shared/types';
import { api } from '@/shared/api/client';

vi.mock('@/shared/api/client', () => ({
  api: { patch: vi.fn(), put: vi.fn(), post: vi.fn() },
}));

function makeWrapperWithQc() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  return { wrapper, qc };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.patch).mockResolvedValue({} as never);
  vi.mocked(api.put).mockResolvedValue({} as never);
  vi.mocked(api.post).mockResolvedValue({} as never);
});

describe('useAdminUpdateRole', () => {
  // C-12 — změna role (a ban/deletion) se promítá i na VEŘEJNÝ profil/adresář,
  // ne jen do admin seznamu. Bez té invalidace public-users/profile zůstal stale.
  it('C-12 — updateRole invaliduje veřejný profil i adresář', async () => {
    const { wrapper, qc } = makeWrapperWithQc();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useAdminUpdateRole(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ userId: 'u1', role: UserRole.Admin });
    });
    const keys = spy.mock.calls.map((c) => c[0]?.queryKey);
    expect(keys).toContainEqual(['public-users']);
    expect(keys).toContainEqual(['public-user-profile']);
  });

  it('C-51 — updateRole invaliduje admin dashboard stats', async () => {
    const { wrapper, qc } = makeWrapperWithQc();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useAdminUpdateRole(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ userId: 'u1', role: UserRole.Admin });
    });
    const keys = spy.mock.calls.map((c) => c[0]?.queryKey);
    expect(keys).toContainEqual(['admin', 'stats']);
  });

  it('C-52 — updateRole invaliduje admin audit-log', async () => {
    const { wrapper, qc } = makeWrapperWithQc();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useAdminUpdateRole(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ userId: 'u1', role: UserRole.Admin });
    });
    const keys = spy.mock.calls.map((c) => c[0]?.queryKey);
    expect(keys).toContainEqual(['admin', 'audit-log']);
  });

  // C-54 — admin klíče tečou z centrální `adminKeys` factory (jeden zdroj pravdy),
  // ne z inline literálů. Ověř, že invalidační klíče se shodují s factory výstupem
  // → kdyby se tvar klíče ve factory změnil, refetch i invalidace zůstanou v sync.
  it('C-54 — updateRole invaliduje přesně klíče z adminKeys factory', async () => {
    const { wrapper, qc } = makeWrapperWithQc();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useAdminUpdateRole(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ userId: 'u1', role: UserRole.Admin });
    });
    const keys = spy.mock.calls.map((c) => c[0]?.queryKey);
    expect(keys).toContainEqual(adminKeys.users);
    expect(keys).toContainEqual(adminKeys.stats);
    expect(keys).toContainEqual(adminKeys.auditLog);
  });
});

describe('useAdminBanUser', () => {
  it('C-51 — ban invaliduje admin dashboard stats', async () => {
    const { wrapper, qc } = makeWrapperWithQc();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useAdminBanUser(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ userId: 'u1' });
    });
    const keys = spy.mock.calls.map((c) => c[0]?.queryKey);
    expect(keys).toContainEqual(['admin', 'stats']);
  });

  it('C-52 — ban invaliduje admin audit-log', async () => {
    const { wrapper, qc } = makeWrapperWithQc();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useAdminBanUser(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ userId: 'u1' });
    });
    const keys = spy.mock.calls.map((c) => c[0]?.queryKey);
    expect(keys).toContainEqual(['admin', 'audit-log']);
  });
});

describe('useAdminBulkBan', () => {
  it('C-51 — bulk ban invaliduje admin dashboard stats', async () => {
    vi.mocked(api.post).mockResolvedValue({ successful: ['u1'], failed: [] } as never);
    const { wrapper, qc } = makeWrapperWithQc();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useAdminBulkBan(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ userIds: ['u1'] });
    });
    const keys = spy.mock.calls.map((c) => c[0]?.queryKey);
    expect(keys).toContainEqual(['admin', 'stats']);
  });

  it('C-52 — bulk ban invaliduje admin audit-log', async () => {
    vi.mocked(api.post).mockResolvedValue({ successful: ['u1'], failed: [] } as never);
    const { wrapper, qc } = makeWrapperWithQc();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useAdminBulkBan(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ userIds: ['u1'] });
    });
    const keys = spy.mock.calls.map((c) => c[0]?.queryKey);
    expect(keys).toContainEqual(['admin', 'audit-log']);
  });
});

describe('useAdminApproveUsernameRequest', () => {
  it('C-45 — approve invaliduje pending-actions (bell/nav badge)', async () => {
    const { wrapper, qc } = makeWrapperWithQc();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useAdminApproveUsernameRequest(), {
      wrapper,
    });
    await act(async () => {
      await result.current.mutateAsync('req1');
    });
    const keys = spy.mock.calls.map((c) => c[0]?.queryKey);
    expect(keys).toContainEqual(['pending-actions']);
  });

  it('C-14 — approve invaliduje admin audit-log', async () => {
    const { wrapper, qc } = makeWrapperWithQc();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useAdminApproveUsernameRequest(), {
      wrapper,
    });
    await act(async () => {
      await result.current.mutateAsync('req1');
    });
    const keys = spy.mock.calls.map((c) => c[0]?.queryKey);
    expect(keys).toContainEqual(['admin', 'audit-log']);
  });
});

describe('useAdminRejectUsernameRequest', () => {
  it('C-45 — reject invaliduje pending-actions (bell/nav badge)', async () => {
    const { wrapper, qc } = makeWrapperWithQc();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useAdminRejectUsernameRequest(), {
      wrapper,
    });
    await act(async () => {
      await result.current.mutateAsync({ requestId: 'req1' });
    });
    const keys = spy.mock.calls.map((c) => c[0]?.queryKey);
    expect(keys).toContainEqual(['pending-actions']);
  });

  it('C-14 — reject invaliduje audit-log i admin users seznam', async () => {
    const { wrapper, qc } = makeWrapperWithQc();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useAdminRejectUsernameRequest(), {
      wrapper,
    });
    await act(async () => {
      await result.current.mutateAsync({ requestId: 'req1' });
    });
    const keys = spy.mock.calls.map((c) => c[0]?.queryKey);
    expect(keys).toContainEqual(['admin', 'audit-log']);
    expect(keys).toContainEqual(['admin', 'users']);
  });
});
