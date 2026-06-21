import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider as JotaiProvider, createStore } from 'jotai';
import type { PropsWithChildren } from 'react';
import WorldsPage from '../WorldsPage';
import { accessTokenAtom } from '@/shared/store/authStore';
import { WorldRole } from '@/shared/types';
import { api } from '@/shared/api/client';

vi.mock('@/shared/api/client', () => ({
  api: { get: vi.fn() },
}));

function makeWorld(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    name: `World ${id}`,
    slug: `w-${id}`,
    description: 'desc',
    genre: 'Sci-fi',
    playerCount: 3,
    maxPlayers: null,
    ownerId: 'u1',
    isActive: true,
    accessMode: 'public',
    system: 'D&D',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    ...overrides,
  };
}

function renderAt(opts: {
  token: string | null;
  publicWorlds?: unknown[];
  myWorlds?: unknown[];
  initialUrl?: string;
}) {
  vi.mocked(api.get).mockImplementation((url: string) => {
    if (url === '/worlds') return Promise.resolve(opts.publicWorlds ?? []);
    if (url === '/worlds/my') return Promise.resolve(opts.myWorlds ?? []);
    return Promise.resolve([]);
  });
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const store = createStore();
  store.set(accessTokenAtom, opts.token);
  const Wrapper = ({ children }: PropsWithChildren) => (
    <MemoryRouter initialEntries={[opts.initialUrl ?? '/ikaros/vesmiry']}>
      <JotaiProvider store={store}>
        <QueryClientProvider client={qc}>{children}</QueryClientProvider>
      </JotaiProvider>
    </MemoryRouter>
  );
  return render(<WorldsPage />, { wrapper: Wrapper });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('WorldsPage', () => {
  it('anon: zobrazí veřejné světy bez Mé světy filtru', async () => {
    renderAt({
      token: null,
      publicWorlds: [makeWorld('1'), makeWorld('2')],
    });
    await waitFor(() => {
      expect(screen.getByText('World 1')).toBeInTheDocument();
    });
    expect(screen.getByText('World 2')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Mé světy' })).toBeNull();
  });

  it('logged-in: merge public + moje světy (vlastní svět dostane membership)', async () => {
    renderAt({
      token: 'token123',
      publicWorlds: [makeWorld('1')],
      myWorlds: [
        {
          world: makeWorld('2', { name: 'My PJ World' }),
          membership: {
            id: 'm1',
            userId: 'u1',
            worldId: '2',
            role: WorldRole.PJ,
            joinedAt: '',
          },
        },
      ],
    });
    await waitFor(() => {
      expect(screen.getByText('World 1')).toBeInTheDocument();
    });
    expect(screen.getByText('My PJ World')).toBeInTheDocument();
    // PJ role chip se zobrazí jen pro membership svět
    expect(screen.getByText('PJ')).toBeInTheDocument();
  });

  it('empty state pro 0 výsledků (po filter/search)', async () => {
    renderAt({
      token: null,
      publicWorlds: [makeWorld('1', { name: 'Alfa' })],
      initialUrl: '/ikaros/vesmiry?q=neexistuje',
    });
    await waitFor(() => {
      expect(
        screen.getByText(/Nic neodpovídá filtru/),
      ).toBeInTheDocument();
    });
  });

  it('maxPlayers formát "X / Y hráčů"', async () => {
    renderAt({
      token: null,
      publicWorlds: [makeWorld('1', { playerCount: 3, maxPlayers: 6 })],
    });
    await waitFor(() => {
      expect(screen.getByText('3 / 6 hráčů')).toBeInTheDocument();
    });
  });
});
