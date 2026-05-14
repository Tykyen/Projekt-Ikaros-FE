import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import {
  WorldRole,
  type World,
  type WorldMembership,
} from '@/shared/types';
import { WorldCard } from '../components/WorldCard';

function makeWorld(overrides: Partial<World> = {}): World {
  return {
    id: 'w1',
    name: 'Matrix',
    slug: 'matrix',
    description: 'Kyberpunk svět plný hackerů a agentů.',
    imageUrl: undefined,
    genre: 'Sci-fi',
    tones: [],
    system: 'D&D 5e',
    ownerId: 'u1',
    isActive: true,
    accessMode: 'private',
    playerCount: 5,
    favoritePageSlugs: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeMembership(role: WorldRole): WorldMembership {
  return {
    id: 'm1',
    userId: 'u1',
    worldId: 'w1',
    role,
    joinedAt: new Date().toISOString(),
  };
}

function renderCard(world: World, role: WorldRole | null = WorldRole.Hrac) {
  return render(
    <MemoryRouter>
      <WorldCard
        world={world}
        membership={role === null ? undefined : makeMembership(role)}
      />
    </MemoryRouter>,
  );
}

describe('WorldCard', () => {
  it('vykreslí název, žánr, počet hráčů, popis', () => {
    renderCard(makeWorld());
    expect(screen.getByText('Matrix')).toBeInTheDocument();
    expect(screen.getByText('Sci-fi')).toBeInTheDocument();
    expect(screen.getByText('5 hráčů')).toBeInTheDocument();
    expect(
      screen.getByText('Kyberpunk svět plný hackerů a agentů.'),
    ).toBeInTheDocument();
  });

  it('1 hráč → singulár', () => {
    renderCard(makeWorld({ playerCount: 1 }));
    expect(screen.getByText('1 hráč')).toBeInTheDocument();
  });

  it('2 hráči → "hráči" (paukal)', () => {
    renderCard(makeWorld({ playerCount: 3 }));
    expect(screen.getByText('3 hráči')).toBeInTheDocument();
  });

  it('PJ role → chip "PJ"', () => {
    renderCard(makeWorld(), WorldRole.PJ);
    expect(screen.getByText('PJ')).toBeInTheDocument();
  });

  it('imageUrl není → fallback gradient + Globe ikona', () => {
    const { container } = renderCard(makeWorld({ imageUrl: undefined }));
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('imageUrl je → img elementu', () => {
    const { container } = renderCard(
      makeWorld({ imageUrl: 'https://example.com/cover.png' }),
    );
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img?.getAttribute('src')).toBe('https://example.com/cover.png');
  });

  it('odkaz vede na /svet/:id', () => {
    renderCard(makeWorld());
    const link = screen.getByRole('link', { name: /Matrix/i });
    expect(link.getAttribute('href')).toBe('/svet/w1');
  });

  it('CTA tlačítko obsahuje "Vstoupit do světa" pokud je člen', () => {
    renderCard(makeWorld());
    expect(screen.getByText(/Vstoupit do světa/)).toBeInTheDocument();
  });

  it('anon (bez membership): CTA "Detail světa", žádný role chip', () => {
    renderCard(makeWorld(), null);
    expect(screen.getByText(/Detail světa/)).toBeInTheDocument();
    expect(screen.queryByText(/Vstoupit do/)).toBeNull();
    expect(screen.queryByText(/Hráč/)).toBeNull();
  });

  it('maxPlayers: zobrazuje "X / Y hráčů"', () => {
    renderCard(makeWorld({ playerCount: 3, maxPlayers: 6 }));
    expect(screen.getByText('3 / 6 hráčů')).toBeInTheDocument();
  });
});
