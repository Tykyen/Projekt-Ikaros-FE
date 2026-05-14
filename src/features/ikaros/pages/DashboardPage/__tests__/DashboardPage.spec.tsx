import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider as JotaiProvider, createStore } from 'jotai';
import type { PropsWithChildren } from 'react';
import DashboardPage from '../DashboardPage';
import {
  accessTokenAtom,
  currentUserAtom,
} from '@/shared/store/authStore';
import { UserRole, WorldRole } from '@/shared/types';
import { api } from '@/shared/api/client';

vi.mock('@/shared/api/client', () => ({
  api: { get: vi.fn(), post: vi.fn() },
}));

function renderAt(opts: { token: string | null }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const store = createStore();
  store.set(accessTokenAtom, opts.token);
  if (opts.token) {
    store.set(currentUserAtom, {
      id: 'u1',
      email: 'tyky@test.io',
      username: 'tyky',
      displayName: 'Tyky',
      role: UserRole.Superadmin,
      defaultAvatarType: 'male',
      chatColor: '#FFFFFF',
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
  return render(<DashboardPage />, { wrapper: Wrapper });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.get).mockImplementation((url: string) => {
    if (url === '/IkarosNews') {
      return Promise.resolve([
        {
          id: 'n1',
          title: 'Platforma žije',
          content: 'První novinka.',
          authorId: 'a1',
          authorName: 'Admin',
          createdAtUtc: new Date().toISOString(),
          isActive: true,
        },
      ]);
    }
    if (url === '/worlds/my') {
      return Promise.resolve([
        {
          world: {
            id: 'w1',
            name: 'Matrix',
            slug: 'matrix',
            description: 'Popis světa',
            genre: 'Sci-fi',
            playerCount: 3,
            ownerId: 'u1',
            isActive: true,
            accessMode: 'private',
            system: 'D&D 5e',
            favoritePageSlugs: [],
            createdAt: '',
            updatedAt: '',
          },
          membership: {
            id: 'm1',
            userId: 'u1',
            worldId: 'w1',
            role: WorldRole.PJ,
            joinedAt: '',
          },
        },
      ]);
    }
    if (url.startsWith('/game-events/upcoming/mine')) {
      return Promise.resolve([]);
    }
    return Promise.resolve([]);
  });
});

describe('DashboardPage', () => {
  it('anon: welcome + Novinky, žádné Akce', async () => {
    renderAt({ token: null });
    await waitFor(() => {
      expect(screen.getByText(/Vítej v/)).toBeInTheDocument();
    });
    expect(screen.getByText('Novinky')).toBeInTheDocument();
    expect(screen.queryByText('Akce')).toBeNull();
    expect(screen.queryByText('Moje světy')).toBeNull();
  });

  it('logged-in: welcome + Akce + Novinky (žádná sekce Moje světy)', async () => {
    renderAt({ token: 'token123' });
    await waitFor(() => {
      expect(screen.getByText(/Vítej v/)).toBeInTheDocument();
    });
    expect(screen.getByText('Akce')).toBeInTheDocument();
    expect(screen.getByText('Novinky')).toBeInTheDocument();
    expect(screen.queryByText('Moje světy')).toBeNull();

    const headings = screen.getAllByRole('heading', { level: 3 });
    const titles = headings.map((h) => h.textContent);
    const eventsIdx = titles.findIndex((t) => t?.includes('Akce'));
    const newsIdx = titles.findIndex((t) => t?.includes('Novinky'));
    expect(eventsIdx).toBeLessThan(newsIdx);
  });
});
