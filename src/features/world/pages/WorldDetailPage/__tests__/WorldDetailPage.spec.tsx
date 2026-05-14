import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import WorldDetailPage from '../WorldDetailPage';

const mockUseWorld = vi.fn();
const mockUseMyWorlds = vi.fn();

vi.mock('@/features/world/api/useWorlds', () => ({
  useWorld: () => mockUseWorld(),
  useMyWorlds: () => mockUseMyWorlds(),
}));

vi.mock('jotai', async () => {
  const actual = await vi.importActual<typeof import('jotai')>('jotai');
  return {
    ...actual,
    useAtomValue: () => null, // accessTokenAtom → anon
  };
});

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function Wrapper({ children }: PropsWithChildren) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return (
    <MemoryRouter initialEntries={['/svet/w1/info']}>
      <QueryClientProvider client={qc}>
        <Routes>
          <Route path="/svet/:worldId/info" element={children} />
        </Routes>
      </QueryClientProvider>
    </MemoryRouter>
  );
}

describe('WorldDetailPage (Spec 2.4)', () => {
  beforeEach(() => {
    mockUseWorld.mockReset();
    mockUseMyWorlds.mockReset();
    mockUseMyWorlds.mockReturnValue({ data: undefined });
  });

  it('render world data — název, žánr, popis', () => {
    mockUseWorld.mockReturnValue({
      data: {
        id: 'w1',
        name: 'Šedý hrad',
        slug: 'sedy-hrad',
        accessMode: 'public',
        playerCount: 3,
        system: 'matrix',
        genre: 'Fantasy',
        description: 'Temný svět magie.',
        ownerId: 'u1',
        isActive: true,
        favoritePageSlugs: [],
        createdAt: '2026-05-14T00:00:00Z',
        updatedAt: '2026-05-14T00:00:00Z',
        owner: { id: 'u1', username: 'tomas' },
      },
      isLoading: false,
      isError: false,
    });
    render(<WorldDetailPage />, { wrapper: Wrapper });
    expect(
      screen.getByRole('heading', { name: 'Šedý hrad' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Temný svět magie.')).toBeInTheDocument();
    expect(screen.getByText('tomas')).toBeInTheDocument();
  });

  it('loading state → skeleton (aria-busy)', () => {
    mockUseWorld.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });
    render(<WorldDetailPage />, { wrapper: Wrapper });
    expect(screen.getByLabelText(/Načítám svět/i)).toHaveAttribute(
      'aria-busy',
      'true',
    );
  });

  it('error / not found → fallback message', () => {
    mockUseWorld.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });
    render(<WorldDetailPage />, { wrapper: Wrapper });
    expect(screen.getByText(/Bohužel jsme ho nenašli/i)).toBeInTheDocument();
  });

  it('empty description → empty state', () => {
    mockUseWorld.mockReturnValue({
      data: {
        id: 'w1',
        name: 'X',
        slug: 'x',
        accessMode: 'public',
        playerCount: 0,
        system: 'matrix',
        ownerId: 'u1',
        isActive: true,
        favoritePageSlugs: [],
        createdAt: '2026-05-14T00:00:00Z',
        updatedAt: '2026-05-14T00:00:00Z',
      },
      isLoading: false,
      isError: false,
    });
    render(<WorldDetailPage />, { wrapper: Wrapper });
    expect(
      screen.getByText(/PJ zatím nepřidal popis světa/i),
    ).toBeInTheDocument();
  });
});
