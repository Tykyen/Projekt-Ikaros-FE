import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider as JotaiProvider, createStore } from 'jotai';
import { MemoryRouter } from 'react-router-dom';
import type { PropsWithChildren } from 'react';
import { PlatformNewsSection } from '../PlatformNewsSection';
import { currentUserAtom } from '@/shared/store/authStore';
import { UserRole } from '@/shared/types';
import { api } from '@/shared/api/client';

vi.mock('@/shared/api/client', () => ({
  api: { get: vi.fn(), post: vi.fn() },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function renderAs(role: UserRole | null) {
  vi.mocked(api.get).mockResolvedValue([]);
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const store = createStore();
  if (role !== null) {
    store.set(currentUserAtom, {
      id: 'u1',
      email: 'x@y.z',
      username: 'tester',
      displayName: 'Tester',
      role,
      defaultAvatarType: 'male',
      chatColor: '#fff',
      emailVerified: true,
    } as never);
  }
  const Wrapper = ({ children }: PropsWithChildren) => (
    <MemoryRouter>
      <JotaiProvider store={store}>
        <QueryClientProvider client={qc}>{children}</QueryClientProvider>
      </JotaiProvider>
    </MemoryRouter>
  );
  return render(<PlatformNewsSection />, { wrapper: Wrapper });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PlatformNewsSection — tlačítko + dle role', () => {
  it('Anon (no currentUser) → bez tlačítka +', () => {
    renderAs(null);
    expect(screen.queryByLabelText('Nová novinka')).toBeNull();
  });

  it('Ikarus (base globální role) → bez tlačítka +', () => {
    renderAs(UserRole.Ikarus);
    expect(screen.queryByLabelText('Nová novinka')).toBeNull();
  });

  it('SpravceClanku → bez tlačítka + (jen Admin/Superadmin)', () => {
    renderAs(UserRole.SpravceClanku);
    expect(screen.queryByLabelText('Nová novinka')).toBeNull();
  });

  it('Admin → tlačítko + viditelné', () => {
    renderAs(UserRole.Admin);
    expect(screen.getByLabelText('Nová novinka')).toBeInTheDocument();
  });

  it('Superadmin → tlačítko + viditelné', () => {
    renderAs(UserRole.Superadmin);
    expect(screen.getByLabelText('Nová novinka')).toBeInTheDocument();
  });

  it('Admin klik na + → otevře modal "Nová novinka"', async () => {
    renderAs(UserRole.Admin);
    const user = userEvent.setup();
    await user.click(screen.getByLabelText('Nová novinka'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText('Nadpis')).toBeInTheDocument();
    expect(screen.getByLabelText('Obsah')).toBeInTheDocument();
  });
});
