import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import PagesListPage from '../PagesListPage';
import { WorldRole } from '@/shared/types';
import type { PageDirectoryEntry } from '../../api/pages.types';

const DIRECTORY: PageDirectoryEntry[] = [
  { id: 'p1', slug: 'aralion', title: 'Aralion', type: 'Lokace', order: 0, updatedAt: '2026-05-01T00:00:00.000Z' },
  { id: 'p2', slug: 'noviny-1', title: 'Denní zprávy', type: 'Noviny', order: 1, updatedAt: '2026-05-01T00:00:00.000Z' },
  { id: 'p3', slug: 'rod-king', title: 'Rod králů', type: 'Rodokmen', order: 2, updatedAt: '2026-05-01T00:00:00.000Z' },
];

let mockDirectory: PageDirectoryEntry[] = [];
let mockRole: WorldRole = WorldRole.Hrac;
let mockFavorites: string[] = [];
const favoriteMutate = vi.fn();

vi.mock('../../api/usePagesDirectory', () => ({
  usePagesDirectory: () => ({ data: mockDirectory, isLoading: false }),
}));
vi.mock('../../api/useFavoritePage', () => ({
  useFavoritePage: () => ({ mutate: favoriteMutate }),
  isPageFavorite: (slugs: string[] | undefined, slug: string) =>
    (slugs ?? []).includes(slug),
}));
vi.mock('@/features/world/context/WorldContext', () => ({
  useWorldContext: () => ({
    world: { id: 'w1', favoritePageSlugs: mockFavorites },
    worldId: 'w1',
    worldSlug: 'matrix',
    userRole: mockRole,
    loading: false,
  }),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <PagesListPage />
    </MemoryRouter>,
  );
}

describe('PagesListPage', () => {
  beforeEach(() => {
    mockDirectory = DIRECTORY;
    mockRole = WorldRole.Hrac;
    mockFavorites = [];
    favoriteMutate.mockClear();
  });

  it('vykreslí seznam stránek', () => {
    renderPage();
    expect(screen.getByText('Aralion')).toBeInTheDocument();
    expect(screen.getByText('Denní zprávy')).toBeInTheDocument();
    expect(screen.getByText('Rod králů')).toBeInTheDocument();
  });

  it('prázdný svět ukáže prázdný stav', () => {
    mockDirectory = [];
    renderPage();
    expect(
      screen.getByText(/nemá žádné stránky/),
    ).toBeInTheDocument();
  });

  it('hledání filtruje podle názvu', async () => {
    renderPage();
    await userEvent.type(
      screen.getByPlaceholderText('Najít stránku…'),
      'aral',
    );
    expect(screen.getByText('Aralion')).toBeInTheDocument();
    expect(screen.queryByText('Denní zprávy')).not.toBeInTheDocument();
  });

  it('filtr typu zobrazí jen daný typ', async () => {
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: 'Noviny' }));
    expect(screen.getByText('Denní zprávy')).toBeInTheDocument();
    expect(screen.queryByText('Aralion')).not.toBeInTheDocument();
  });

  it('hráč nevidí tlačítko Nová stránka, PomocnyPJ ano', () => {
    renderPage();
    expect(
      screen.queryByRole('link', { name: /Nová stránka/ }),
    ).not.toBeInTheDocument();
  });

  it('PomocnyPJ vidí tlačítko Nová stránka', () => {
    mockRole = WorldRole.PomocnyPJ;
    renderPage();
    expect(
      screen.getByRole('link', { name: /Nová stránka/ }),
    ).toBeInTheDocument();
  });

  it('oblíbené stránky se zobrazí v samostatné sekci', () => {
    mockFavorites = ['aralion'];
    renderPage();
    expect(screen.getByText('Oblíbené')).toBeInTheDocument();
    expect(screen.getByText('Všechny stránky')).toBeInTheDocument();
  });

  it('klik na hvězdičku přepne oblíbené', async () => {
    renderPage();
    const stars = screen.getAllByRole('button', {
      name: 'Přidat do oblíbených',
    });
    await userEvent.click(stars[0]);
    expect(favoriteMutate).toHaveBeenCalledWith({
      slug: 'aralion',
      nextState: true,
    });
  });
});
