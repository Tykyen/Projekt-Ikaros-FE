import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { World, WorldNewsItem } from '@/shared/types';
import { FavoritePagesColumn } from '../columns/FavoritePagesColumn';
import { NewsColumn } from '../columns/NewsColumn';

// ── NewsColumn mocky ──────────────────────────────────────────────
const ctx = vi.hoisted(() => ({ role: 2 as number })); // WorldRole.Hrac
const newsData = vi.hoisted(() => ({ items: [] as WorldNewsItem[] }));

vi.mock('@/features/world/context/WorldContext', () => ({
  useWorldContext: () => ({ userRole: ctx.role }),
}));
vi.mock('@/features/world/api/useWorldNews', () => ({
  useWorldNews: () => ({ data: newsData.items, isLoading: false }),
  useDeleteWorldNews: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

function makeWorld(over: Partial<World> = {}): World {
  return {
    id: 'w1',
    name: 'Svět',
    slug: 'svet',
    system: 'matrix',
    ownerId: 'o1',
    isActive: true,
    accessMode: 'private',
    playerCount: 0,
    favoritePageSlugs: [],
    createdAt: '',
    updatedAt: '',
    ...over,
  };
}

describe('FavoritePagesColumn', () => {
  it('prázdné favoritePageSlugs → empty stav + poznámka o kroku 7', () => {
    render(<FavoritePagesColumn world={makeWorld()} />);
    expect(
      screen.getByText(/Zatím žádné oblíbené stránky/),
    ).toBeInTheDocument();
    expect(screen.getByText(/krokem 7/)).toBeInTheDocument();
  });

  it('se slugy → vypíše je', () => {
    render(
      <FavoritePagesColumn
        world={makeWorld({ favoritePageSlugs: ['mesto-x', 'rod-y'] })}
      />,
    );
    expect(screen.getByText('mesto-x')).toBeInTheDocument();
    expect(screen.getByText('rod-y')).toBeInTheDocument();
  });
});

describe('NewsColumn — gating tvorby', () => {
  it('Hráč nevidí „Nové oznámení"', () => {
    ctx.role = 2; // Hrac
    render(<NewsColumn worldId="w1" />);
    expect(
      screen.queryByRole('button', { name: /Nové oznámení/ }),
    ).not.toBeInTheDocument();
  });

  it('PomocnyPJ vidí „Nové oznámení"', () => {
    ctx.role = 4; // PomocnyPJ
    render(<NewsColumn worldId="w1" />);
    expect(
      screen.getByRole('button', { name: /Nové oznámení/ }),
    ).toBeInTheDocument();
  });

  it('prázdná data → „Zatím žádná oznámení"', () => {
    ctx.role = 2;
    newsData.items = [];
    render(<NewsColumn worldId="w1" />);
    expect(screen.getByText('Zatím žádná oznámení.')).toBeInTheDocument();
  });
});
