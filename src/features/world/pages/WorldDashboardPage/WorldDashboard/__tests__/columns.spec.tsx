import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { World, WorldNewsItem, GameEvent } from '@/shared/types';
import { FavoritePagesColumn } from '../columns/FavoritePagesColumn';
import { NewsColumn } from '../columns/NewsColumn';
import { EventsColumn } from '../columns/EventsColumn';

// ── Sdílené mocky ─────────────────────────────────────────────────
const ctx = vi.hoisted(() => ({ role: 2 as number })); // WorldRole.Hrac
const newsData = vi.hoisted(() => ({ items: [] as WorldNewsItem[] }));
const eventsData = vi.hoisted(() => ({ items: [] as GameEvent[] }));

vi.mock('@/features/world/context/WorldContext', () => ({
  useWorldContext: () => ({ userRole: ctx.role, worldSlug: 'svet' }),
}));
vi.mock('../../../api/usePagesDirectory', () => ({
  usePagesDirectory: () => ({ data: [], isLoading: false }),
}));
vi.mock('@/features/world/api/useWorldNews', () => ({
  useWorldNews: () => ({ data: newsData.items, isLoading: false }),
  useDeleteWorldNews: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));
vi.mock('@/features/world/api/useGameEvents', () => ({
  useWorldGameEvents: () => ({ data: eventsData.items, isLoading: false }),
  useToggleRsvp: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteGameEvent: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));
vi.mock('@/features/world/api/useWorldSettings', () => ({
  useWorldSettings: () => ({
    data: { customGroups: [], groupColors: {} },
    isLoading: false,
  }),
}));
vi.mock('@/features/world/api/useCalendarConfigs', () => ({
  useCalendarConfigs: () => ({ data: [], isLoading: false }),
}));

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

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

function makeNews(id: string): WorldNewsItem {
  return {
    id,
    worldId: 'w1',
    title: `Novinka ${id}`,
    content: 'obsah',
    date: '2026-05-10T12:00:00.000Z',
    type: 'info',
  };
}

function makeEvent(id: string): GameEvent {
  return {
    id,
    worldId: 'w1',
    title: `Akce ${id}`,
    date: '2026-06-15T19:00:00.000Z',
    description: '',
    imageUrl: null,
    imageFocalX: null,
    imageFocalY: null,
    targetGroup: null,
    groupOnly: false,
    confirmable: true,
    confirmedBy: [],
    reminderSent: false,
    createdAt: '',
    updatedAt: '',
  };
}

describe('FavoritePagesColumn', () => {
  it('prázdné favoritePageSlugs → empty stav', () => {
    renderWithRouter(<FavoritePagesColumn world={makeWorld()} />);
    expect(
      screen.getByText(/Zatím žádné oblíbené stránky/),
    ).toBeInTheDocument();
  });

  it('limit 10 — z 12 slugů zobrazí 10 (fallback na slug bez titulu)', () => {
    const slugs = Array.from({ length: 12 }, (_, i) => `str-${i}`);
    renderWithRouter(
      <FavoritePagesColumn world={makeWorld({ favoritePageSlugs: slugs })} />,
    );
    expect(screen.getByText('str-0')).toBeInTheDocument();
    expect(screen.getByText('str-9')).toBeInTheDocument();
    expect(screen.queryByText('str-10')).not.toBeInTheDocument();
  });

  it('tlačítko „Všechny stránky" odkazuje na /svet/svet/stranky', () => {
    renderWithRouter(<FavoritePagesColumn world={makeWorld()} />);
    expect(
      screen.getByRole('link', { name: /Všechny stránky/ }),
    ).toHaveAttribute('href', '/svet/svet/stranky');
  });
});

describe('NewsColumn', () => {
  it('Hráč nevidí „Nové oznámení"', () => {
    ctx.role = 2;
    newsData.items = [];
    renderWithRouter(<NewsColumn worldId="w1" />);
    expect(
      screen.queryByRole('button', { name: /Nové oznámení/ }),
    ).not.toBeInTheDocument();
  });

  it('PomocnyPJ vidí „Nové oznámení"', () => {
    ctx.role = 4;
    renderWithRouter(<NewsColumn worldId="w1" />);
    expect(
      screen.getByRole('button', { name: /Nové oznámení/ }),
    ).toBeInTheDocument();
  });

  it('limit 3 — z 5 novinek zobrazí 3', () => {
    ctx.role = 2;
    newsData.items = ['1', '2', '3', '4', '5'].map(makeNews);
    renderWithRouter(<NewsColumn worldId="w1" />);
    expect(screen.getByText('Novinka 1')).toBeInTheDocument();
    expect(screen.getByText('Novinka 3')).toBeInTheDocument();
    expect(screen.queryByText('Novinka 4')).not.toBeInTheDocument();
  });

  it('tlačítko „Všechny novinky" odkazuje na /svet/svet/novinky', () => {
    ctx.role = 2;
    newsData.items = [];
    renderWithRouter(<NewsColumn worldId="w1" />);
    expect(
      screen.getByRole('link', { name: /Všechny novinky/ }),
    ).toHaveAttribute('href', '/svet/svet/novinky');
  });
});

describe('EventsColumn', () => {
  it('prázdná data → empty stav', () => {
    eventsData.items = [];
    renderWithRouter(<EventsColumn worldId="w1" />);
    expect(screen.getByText('Žádné nadcházející akce.')).toBeInTheDocument();
  });

  it('vykreslí akce a tlačítko „Všechny akce" → /svet/svet/akce (9.1 follow-up)', () => {
    eventsData.items = ['1', '2', '3'].map(makeEvent);
    renderWithRouter(<EventsColumn worldId="w1" />);
    expect(screen.getByText('Akce 1')).toBeInTheDocument();
    // PJ vidí „Všechny akce a archiv →" (ctx.role = 2 = Hrac fallback default
    // — měníme níže), zde Hrac vidí „Všechny akce →".
    expect(
      screen.getByRole('link', { name: /Všechny akce/ }),
    ).toHaveAttribute('href', '/svet/svet/akce');
  });
});
