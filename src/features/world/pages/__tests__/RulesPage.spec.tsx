import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { PropsWithChildren } from 'react';
import RulesPage from '../RulesPage';

const ctx = vi.hoisted(() => ({ role: 5 }));
const pageState = vi.hoisted(() => ({
  data: undefined as unknown,
  isLoading: false,
  error: undefined as unknown,
}));

vi.mock('@/features/world/context/WorldContext', () => ({
  useWorldContext: () => ({
    worldId: 'W1',
    worldSlug: 'svet',
    userRole: ctx.role,
  }),
}));
vi.mock('../api/usePage', () => ({
  usePage: () => pageState,
}));
vi.mock('../api/useCreatePage', () => ({
  useCreatePage: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));
vi.mock('../PageViewer/PageViewer', () => ({
  PageViewer: () => <div data-testid="viewer">viewer</div>,
}));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

function wrap({ children }: PropsWithChildren) {
  return <MemoryRouter>{children}</MemoryRouter>;
}

const notFound = { isAxiosError: true, response: { status: 404 } };

describe('RulesPage (12.3)', () => {
  beforeEach(() => {
    ctx.role = 5;
    pageState.data = undefined;
    pageState.isLoading = false;
    pageState.error = undefined;
  });

  it('existující stránka → render PageViewer', () => {
    pageState.data = { id: 'p', slug: 'pravidla', type: 'Ostatní' };
    render(<RulesPage />, { wrapper: wrap });
    expect(screen.getByTestId('viewer')).toBeInTheDocument();
  });

  it('404 + PomocnyPJ → tlačítko Vytvořit pravidla', () => {
    ctx.role = 4;
    pageState.error = notFound;
    render(<RulesPage />, { wrapper: wrap });
    expect(screen.getByText('Vytvořit pravidla')).toBeInTheDocument();
  });

  it('404 + Hráč → empty state bez tlačítka', () => {
    ctx.role = 2;
    pageState.error = notFound;
    render(<RulesPage />, { wrapper: wrap });
    expect(
      screen.getByText('Pravidla zatím nejsou nastavena.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Vytvořit pravidla')).not.toBeInTheDocument();
  });
});
