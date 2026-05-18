import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider as JotaiProvider, createStore } from 'jotai';
import type { PropsWithChildren } from 'react';
import WorldNewsPage from './WorldNewsPage';
import { currentUserAtom } from '@/shared/store/authStore';

const ctx = vi.hoisted(() => ({ role: 2 as number })); // WorldRole.Hrac

vi.mock('@/features/world/context/WorldContext', () => ({
  useWorldContext: () => ({
    worldId: 'w1',
    worldSlug: 'svet',
    userRole: ctx.role,
    loading: false,
  }),
}));
vi.mock('@/features/world/api/useWorldNews', () => ({
  useWorldNewsList: () => ({ data: [], isLoading: false, isError: false }),
  useWorldNewsCount: () => ({ data: { total: 0 } }),
  useDeleteWorldNews: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useArchiveWorldNews: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUnarchiveWorldNews: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCreateWorldNews: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateWorldNews: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

function wrapper({ children }: PropsWithChildren) {
  const store = createStore();
  store.set(currentUserAtom, null);
  return (
    <JotaiProvider store={store}>
      <MemoryRouter>{children}</MemoryRouter>
    </JotaiProvider>
  );
}

beforeEach(() => vi.clearAllMocks());

describe('WorldNewsPage', () => {
  it('vykreslí titulek Novinky', () => {
    ctx.role = 2;
    render(<WorldNewsPage />, { wrapper });
    expect(
      screen.getByRole('heading', { name: 'Novinky' }),
    ).toBeInTheDocument();
  });

  it('běžný hráč nevidí tabs ani „Nové oznámení"', () => {
    ctx.role = 2; // Hrac
    render(<WorldNewsPage />, { wrapper });
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Nové oznámení/ }),
    ).not.toBeInTheDocument();
  });

  it('PomocnyPJ vidí tabs Aktivní/Archiv + „Nové oznámení"', () => {
    ctx.role = 4; // PomocnyPJ
    render(<WorldNewsPage />, { wrapper });
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Aktivní/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Archiv/ })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Nové oznámení/ }),
    ).toBeInTheDocument();
  });
});
