import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import type { PropsWithChildren } from 'react';
import { api } from '@/shared/api/client';
import { FriendsTab } from '../FriendsTab';
import { UserRole } from '@/shared/types';

vi.mock('@/shared/api/client', async () => {
  const actual =
    await vi.importActual<typeof import('@/shared/api/client')>(
      '@/shared/api/client',
    );
  return {
    ...actual,
    api: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
  };
});
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const apiGet = vi.mocked(api.get);

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('FriendsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('empty state pokud nemáme přátele ani odeslané žádosti', async () => {
    apiGet.mockImplementation(() => Promise.resolve({ items: [], total: 0 }));
    render(<FriendsTab />, { wrapper: makeWrapper() });
    await waitFor(() =>
      expect(screen.getByText(/Zatím nemáš přátele/i)).toBeInTheDocument(),
    );
    expect(
      screen.getByRole('button', { name: /Otevřít adresář/ }),
    ).toBeInTheDocument();
  });

  it('zobrazí grid přátel a skryje sekci „Odeslané žádosti" pokud 0', async () => {
    apiGet.mockImplementation((url: string) => {
      if (url === '/friends') {
        return Promise.resolve({
          items: [
            {
              friendshipId: 'f1',
              acceptedAt: new Date().toISOString(),
              friend: {
                id: 'u1',
                username: 'bob',
                displayName: null,
                avatarUrl: null,
                defaultAvatarType: 'male',
                role: UserRole.Ikarus,
                city: null,
                deleted: false,
                pendingDeletion: false,
              },
            },
          ],
          total: 1,
        });
      }
      return Promise.resolve({ items: [], total: 0 });
    });
    render(<FriendsTab />, { wrapper: makeWrapper() });
    await waitFor(() => expect(screen.getByText('bob')).toBeInTheDocument());
    expect(screen.getByText(/Moji přátelé/)).toBeInTheDocument();
    expect(screen.queryByText(/Odeslané žádosti/)).not.toBeInTheDocument();
  });

  it('zobrazí sekci „Odeslané žádosti" pokud outgoing > 0', async () => {
    apiGet.mockImplementation((url: string) => {
      if (url === '/friends/requests/outgoing') {
        return Promise.resolve({
          items: [
            {
              friendshipId: 'f1',
              requestedAt: new Date().toISOString(),
              direction: 'outgoing',
              counterpart: {
                id: 'u2',
                username: 'alice',
                displayName: null,
                avatarUrl: null,
                defaultAvatarType: 'female',
                role: UserRole.Ikarus,
              },
            },
          ],
          total: 1,
        });
      }
      return Promise.resolve({ items: [], total: 0 });
    });
    render(<FriendsTab />, { wrapper: makeWrapper() });
    await waitFor(() =>
      expect(screen.getByText(/Odeslané žádosti/)).toBeInTheDocument(),
    );
    expect(screen.getByText('alice')).toBeInTheDocument();
  });

  it('CTA tlačítko v empty state má aria-label', async () => {
    apiGet.mockResolvedValue({ items: [], total: 0 });
    render(<FriendsTab />, { wrapper: makeWrapper() });
    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /Otevřít adresář/ });
      expect(btn).toBeInTheDocument();
    });
  });

  it('toggle „Odeslané žádosti" sbalí seznam', async () => {
    apiGet.mockImplementation((url: string) => {
      if (url === '/friends/requests/outgoing') {
        return Promise.resolve({
          items: [
            {
              friendshipId: 'f1',
              requestedAt: new Date().toISOString(),
              direction: 'outgoing',
              counterpart: {
                id: 'u2',
                username: 'alice',
                displayName: null,
                avatarUrl: null,
                defaultAvatarType: 'female',
                role: UserRole.Ikarus,
              },
            },
          ],
          total: 1,
        });
      }
      return Promise.resolve({ items: [], total: 0 });
    });
    render(<FriendsTab />, { wrapper: makeWrapper() });
    await waitFor(() => expect(screen.getByText('alice')).toBeInTheDocument());
    const toggle = screen.getByRole('button', { name: /Odeslané žádosti/ });
    await userEvent.click(toggle);
    expect(screen.queryByText('alice')).not.toBeInTheDocument();
  });
});
