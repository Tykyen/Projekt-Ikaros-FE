import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { WorldRole } from '@/shared/types';
import MyCharacterPage from '../MyCharacterPage';

// ── Mocks ────────────────────────────────────────────────────────
const mockCtx = vi.fn();
const mockStatus = vi.fn();
const mockDirectory = vi.fn();

vi.mock('@/features/world/context/WorldContext', () => ({
  useWorldContext: () => mockCtx(),
}));
vi.mock('@/features/world/api/useWorldStatus', () => ({
  useWorldStatus: () => mockStatus(),
}));
vi.mock('../api/useCharacterDirectory', () => ({
  useCharacterDirectory: () => mockDirectory(),
}));

// ── Helpers ──────────────────────────────────────────────────────
function renderPage() {
  // CharacterDetailPage je jen placeholder pro redirect target — vrátíme
  // sentinel text, abychom mohli ověřit, že redirect proběhl.
  const router = createMemoryRouter(
    [
      { path: '/svet/matrix/moje-postava', element: <MyCharacterPage /> },
      {
        path: '/svet/matrix/postava/:slug',
        element: <div>DETAIL_TARGET</div>,
      },
      { path: '/svet/matrix/postavy', element: <div>DIRECTORY_TARGET</div> },
    ],
    { initialEntries: ['/svet/matrix/moje-postava'] },
  );
  return render(<RouterProvider router={router} />);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('MyCharacterPage (8.3)', () => {
  it('character != null → redirect na detail postavy', () => {
    mockCtx.mockReturnValue({
      worldId: 'w1',
      worldSlug: 'matrix',
      character: {
        characterPath: 'frodo',
        name: 'Frodo',
        avatarUrl: undefined,
      },
      userRole: WorldRole.Hrac,
      loading: false,
    });
    mockStatus.mockReturnValue({ membership: { characterPath: 'frodo' } });
    mockDirectory.mockReturnValue({
      data: [{ id: 'c1', slug: 'frodo', name: 'Frodo' }],
      isLoading: false,
    });
    renderPage();
    expect(screen.getByText('DETAIL_TARGET')).toBeInTheDocument();
  });

  it('character == null, žádný characterPath → fallback "Zatím nemáš postavu"', () => {
    mockCtx.mockReturnValue({
      worldId: 'w1',
      worldSlug: 'matrix',
      character: null,
      userRole: WorldRole.Hrac,
      loading: false,
    });
    mockStatus.mockReturnValue({ membership: { characterPath: null } });
    mockDirectory.mockReturnValue({
      data: [{ id: 'c1', slug: 'frodo', name: 'Frodo' }],
      isLoading: false,
    });
    renderPage();
    expect(screen.getByText('Zatím nemáš postavu')).toBeInTheDocument();
    expect(screen.getByText(/Zobrazit adresář/)).toBeInTheDocument();
  });

  it('stale characterPath (entry chybí v directory) → fallback "Postava neexistuje"', () => {
    mockCtx.mockReturnValue({
      worldId: 'w1',
      worldSlug: 'matrix',
      character: null,
      userRole: WorldRole.Hrac,
      loading: false,
    });
    mockStatus.mockReturnValue({ membership: { characterPath: 'smazana' } });
    mockDirectory.mockReturnValue({
      data: [{ id: 'c1', slug: 'frodo', name: 'Frodo' }],
      isLoading: false,
    });
    renderPage();
    expect(screen.getByText('Postava neexistuje')).toBeInTheDocument();
    // Slug smazané postavy je v hlášce.
    expect(screen.getByText('smazana')).toBeInTheDocument();
  });

  it('loading shellu → spinner, žádný redirect ani fallback', () => {
    mockCtx.mockReturnValue({
      worldId: 'w1',
      worldSlug: 'matrix',
      character: null,
      userRole: null,
      loading: true,
    });
    mockStatus.mockReturnValue({ membership: null });
    mockDirectory.mockReturnValue({ data: undefined, isLoading: true });
    const { container } = renderPage();
    expect(screen.queryByText('Zatím nemáš postavu')).not.toBeInTheDocument();
    expect(screen.queryByText('DETAIL_TARGET')).not.toBeInTheDocument();
    // Spinner = nějaký dom node existuje
    expect(container.firstChild).toBeTruthy();
  });

  it('PJ role bez postavy → vidí "Vytvořit postavu" sekundární CTA', () => {
    mockCtx.mockReturnValue({
      worldId: 'w1',
      worldSlug: 'matrix',
      character: null,
      userRole: WorldRole.PJ,
      loading: false,
    });
    mockStatus.mockReturnValue({ membership: { characterPath: null } });
    mockDirectory.mockReturnValue({ data: [], isLoading: false });
    renderPage();
    expect(screen.getByText('Vytvořit postavu')).toBeInTheDocument();
  });

  it('běžný hráč bez postavy → "Vytvořit postavu" NENÍ', () => {
    mockCtx.mockReturnValue({
      worldId: 'w1',
      worldSlug: 'matrix',
      character: null,
      userRole: WorldRole.Hrac,
      loading: false,
    });
    mockStatus.mockReturnValue({ membership: { characterPath: null } });
    mockDirectory.mockReturnValue({ data: [], isLoading: false });
    renderPage();
    expect(screen.queryByText('Vytvořit postavu')).not.toBeInTheDocument();
  });
});
