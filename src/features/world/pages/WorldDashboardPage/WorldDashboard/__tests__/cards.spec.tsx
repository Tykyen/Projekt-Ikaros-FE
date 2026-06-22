import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createStore, Provider as JotaiProvider } from 'jotai';
import type { GameEvent, WorldNewsItem } from '@/shared/types';
import { WorldEventCard } from '../components/WorldEventCard';
import { WorldNewsCard } from '../components/WorldNewsCard';
import { DashTile } from '../components/DashTile';

// 9.5 — WorldNewsCard volá usePagesDirectory; mockujem na prázdné pole.
vi.mock('@/features/world/pages/api/usePagesDirectory', () => ({
  usePagesDirectory: () => ({ data: [], isLoading: false }),
}));

function makeEvent(over: Partial<GameEvent> = {}): GameEvent {
  return {
    id: 'e1',
    worldId: 'w1',
    title: 'Sezení v hospodě',
    date: '2026-06-15T19:00:00.000Z',
    description: '',
    imageUrl: null,
    imageFocalX: null,
    imageFocalY: null,
    targetGroup: null,
    groupOnly: false,
    confirmable: true,
    confirmedBy: [
      { userId: 'u1', userName: 'A' },
      { userId: 'u2', userName: 'B' },
    ],
    reminderSent: false,
    createdAt: '',
    updatedAt: '',
    ...over,
  };
}

function makeNews(over: Partial<WorldNewsItem> = {}): WorldNewsItem {
  return {
    id: 'n1',
    worldId: 'w1',
    title: 'Vítejte ve světě',
    content: '<p>První <strong>oznámení</strong> světa.</p>',
    date: '2026-05-10T12:00:00.000Z',
    type: 'info',
    ...over,
  };
}

function wrapNewsCard(node: React.ReactNode) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const store = createStore();
  return render(
    <JotaiProvider store={store}>
      <QueryClientProvider client={qc}>
        <MemoryRouter>{node}</MemoryRouter>
      </QueryClientProvider>
    </JotaiProvider>,
  );
}

describe('WorldEventCard', () => {
  it('zobrazí název a počet potvrzených', () => {
    render(<WorldEventCard event={makeEvent()} />);
    expect(screen.getByText('Sezení v hospodě')).toBeInTheDocument();
    expect(screen.getByText(/2 potvrzeno/)).toBeInTheDocument();
  });

  it('nevalidní datum → „Termín neznámý"', () => {
    render(<WorldEventCard event={makeEvent({ date: 'xxx' })} />);
    expect(screen.getByText(/Termín neznámý/)).toBeInTheDocument();
  });
});

describe('WorldNewsCard (9.5 refactor)', () => {
  it('zobrazí titulek a HTML obsah jako plain text', () => {
    wrapNewsCard(
      <WorldNewsCard
        news={makeNews()}
        worldId="w1"
        worldSlug="matrix"
        canManage={false}
        onEdit={() => {}}
        onDelete={() => {}}
      />,
    );
    expect(screen.getByText('Vítejte ve světě')).toBeInTheDocument();
    expect(screen.getByText('První oznámení světa.')).toBeInTheDocument();
  });

  it('bez canManage neukazuje kebab akce', () => {
    wrapNewsCard(
      <WorldNewsCard
        news={makeNews()}
        worldId="w1"
        worldSlug="matrix"
        canManage={false}
        onEdit={() => {}}
        onDelete={() => {}}
      />,
    );
    expect(screen.queryByLabelText('Akce')).not.toBeInTheDocument();
  });

  it('s canManage zobrazí kebab', () => {
    wrapNewsCard(
      <WorldNewsCard
        news={makeNews()}
        worldId="w1"
        worldSlug="matrix"
        canManage
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByLabelText('Akce')).toBeInTheDocument();
  });

  it('archivovaná karta má data-archived="true"', () => {
    const { container } = wrapNewsCard(
      <WorldNewsCard
        news={makeNews({ archived: true })}
        worldId="w1"
        worldSlug="matrix"
        canManage={false}
        onEdit={() => {}}
        onDelete={() => {}}
      />,
    );
    expect(
      container.querySelector('article[data-archived="true"]'),
    ).toBeInTheDocument();
  });

  it('externí link (legacy) se v detailu vykreslí jako <a target=_blank>', () => {
    wrapNewsCard(
      <WorldNewsCard
        news={makeNews({ link: 'https://example.com' })}
        worldId="w1"
        worldSlug="matrix"
        canManage={false}
        onEdit={() => {}}
        onDelete={() => {}}
      />,
    );
    // Odkaz žije v detail-okně — nejdřív kartu rozkliknout.
    fireEvent.click(screen.getByRole('button', { name: /Otevřít novinku/ }));
    const link = screen.getByText(/Externí odkaz/);
    expect(link.closest('a')?.getAttribute('href')).toBe(
      'https://example.com',
    );
    expect(link.closest('a')?.getAttribute('target')).toBe('_blank');
  });

  it('typ alert → vykreslí TypeChip s labelem Důležité', () => {
    wrapNewsCard(
      <WorldNewsCard
        news={makeNews({ type: 'alert' })}
        worldId="w1"
        worldSlug="matrix"
        canManage={false}
        onEdit={() => {}}
        onDelete={() => {}}
      />,
    );
    expect(screen.getByText('Důležité')).toBeInTheDocument();
  });
});

describe('DashTile', () => {
  it('vykreslí label, value a je odkaz na `to`', () => {
    render(
      <MemoryRouter>
        <DashTile icon={null} label="Hráči" to="/svet/x/hraci" value={7} />
      </MemoryRouter>,
    );
    const link = screen.getByRole('link', { name: /Hráči/ });
    expect(link).toHaveAttribute('href', '/svet/x/hraci');
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('badge se zobrazí jen když > 0', () => {
    const { rerender } = render(
      <MemoryRouter>
        <DashTile icon={null} label="Chat" to="/svet/x/chat" badge={4} />
      </MemoryRouter>,
    );
    expect(screen.getByText('4')).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <DashTile icon={null} label="Chat" to="/svet/x/chat" badge={0} />
      </MemoryRouter>,
    );
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });
});
