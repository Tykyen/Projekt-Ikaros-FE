import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import FavoritesPage from './FavoritesPage';

// Hooky oblíbených — mock na prázdná data (testujeme taby + URL, ne fetch).
vi.mock('../api/useDiscussions', () => ({
  useMyFavoriteDiscussions: () => ({ data: [], isLoading: false }),
  useTogglePinDiscussion: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock('../api/useArticles', () => ({
  useMyFavoriteArticles: () => ({ data: [], isLoading: false }),
  useTogglePinArticle: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock('../api/useGallery', () => ({
  useMyFavoriteGallery: () => ({ data: [], isLoading: false }),
  useTogglePinGallery: () => ({ mutate: vi.fn(), isPending: false }),
}));

function LocationProbe() {
  const loc = useLocation();
  return <div data-testid="probe-search">{loc.search}</div>;
}

function renderPage(initialEntry = '/ikaros/oblibene') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route
          path="/ikaros/oblibene"
          element={
            <>
              <FavoritesPage />
              <LocationProbe />
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('FavoritesPage', () => {
  it('vykreslí 3 taby', () => {
    renderPage();
    expect(screen.getByRole('tab', { name: 'Diskuze' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Články' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Obrázky' })).toBeInTheDocument();
  });

  it('default (bez ?typ=) → aktivní tab Diskuze', () => {
    renderPage();
    expect(
      screen.getByRole('tab', { name: 'Diskuze' }),
    ).toHaveAttribute('aria-selected', 'true');
  });

  it('klik na Články → URL ?typ=clanky', () => {
    renderPage();
    fireEvent.click(screen.getByRole('tab', { name: 'Články' }));
    expect(screen.getByTestId('probe-search').textContent).toBe(
      '?typ=clanky',
    );
  });

  it('?typ=obrazky v URL → aktivní tab Obrázky rovnou', () => {
    renderPage('/ikaros/oblibene?typ=obrazky');
    expect(
      screen.getByRole('tab', { name: 'Obrázky' }),
    ).toHaveAttribute('aria-selected', 'true');
  });

  it('neznámý ?typ → fallback na Diskuze', () => {
    renderPage('/ikaros/oblibene?typ=xyz');
    expect(
      screen.getByRole('tab', { name: 'Diskuze' }),
    ).toHaveAttribute('aria-selected', 'true');
  });

  it('prázdný tab → hláška „V oblíbených zatím nic nemáš"', () => {
    renderPage();
    expect(
      screen.getByText('V oblíbených zatím nic nemáš.'),
    ).toBeInTheDocument();
  });
});
