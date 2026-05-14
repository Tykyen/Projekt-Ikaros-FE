import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import WorldDashboardPage from '../WorldDashboardPage';
import { WorldContext } from '@/features/world/context/WorldContext';
import type { World } from '@/shared/types';

function makeWorld(): World {
  return {
    id: 'w1',
    name: 'Šedý hrad',
    slug: 'sedy-hrad',
    accessMode: 'public',
    playerCount: 3,
    system: 'matrix',
    ownerId: 'u1',
    isActive: true,
    favoritePageSlugs: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

describe('WorldDashboardPage welcome view (Spec 2.4)', () => {
  it('render hero + 4 dlaždice + placeholder', () => {
    render(
      <MemoryRouter>
        <WorldContext.Provider
          value={{
            worldId: 'w1',
            world: makeWorld(),
            isPJ: false,
            userRole: null,
            loading: false,
          }}
        >
          <WorldDashboardPage />
        </WorldContext.Provider>
      </MemoryRouter>,
    );

    expect(screen.getByText(/Vítej zpět/i)).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Šedý hrad' }),
    ).toBeInTheDocument();

    // 4 dlaždice
    expect(screen.getByRole('link', { name: /Chat/i })).toHaveAttribute(
      'href',
      '/svet/w1/chat',
    );
    expect(screen.getByRole('link', { name: /Stránky/i })).toHaveAttribute(
      'href',
      '/svet/w1/stranky',
    );
    expect(screen.getByRole('link', { name: /Mapa/i })).toHaveAttribute(
      'href',
      '/svet/w1/mapa',
    );
    expect(screen.getByRole('link', { name: /Postavy/i })).toHaveAttribute(
      'href',
      '/svet/w1/postavy',
    );

    // placeholder
    expect(screen.getByText(/Aktivita ve světě/i)).toBeInTheDocument();
  });
});
