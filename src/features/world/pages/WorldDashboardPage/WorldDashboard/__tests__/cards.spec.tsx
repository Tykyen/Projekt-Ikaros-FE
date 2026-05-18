import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import type { GameEvent, WorldNewsItem } from '@/shared/types';
import { WorldEventCard } from '../components/WorldEventCard';
import { WorldNewsCard } from '../components/WorldNewsCard';
import { StatBar } from '../components/StatBar';

function makeEvent(over: Partial<GameEvent> = {}): GameEvent {
  return {
    id: 'e1',
    worldId: 'w1',
    title: 'Sezení v hospodě',
    date: '2026-06-15T19:00:00.000Z',
    description: '',
    imageUrl: null,
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

describe('WorldNewsCard', () => {
  it('zobrazí titulek a HTML obsah jako plain text', () => {
    render(
      <WorldNewsCard
        news={makeNews()}
        canManage={false}
        onEdit={() => {}}
        onDelete={() => {}}
      />,
    );
    expect(screen.getByText('Vítejte ve světě')).toBeInTheDocument();
    expect(
      screen.getByText('První oznámení světa.'),
    ).toBeInTheDocument();
  });

  it('bez canManage neukazuje akce', () => {
    render(
      <WorldNewsCard
        news={makeNews()}
        canManage={false}
        onEdit={() => {}}
        onDelete={() => {}}
      />,
    );
    expect(
      screen.queryByTitle('Upravit oznámení'),
    ).not.toBeInTheDocument();
  });

  it('canManage → akce volají handlery', async () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(
      <WorldNewsCard
        news={makeNews()}
        canManage
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );
    await userEvent.click(screen.getByTitle('Upravit oznámení'));
    await userEvent.click(screen.getByTitle('Smazat oznámení'));
    expect(onEdit).toHaveBeenCalled();
    expect(onDelete).toHaveBeenCalled();
  });
});

describe('StatBar', () => {
  it('vykreslí všechny statistiky', () => {
    render(
      <StatBar
        stats={[
          { icon: null, value: 7, label: 'Hráčů' },
          { icon: null, value: 3, label: 'Akcí' },
          { icon: null, value: 12, label: 'Novinek' },
        ]}
      />,
    );
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('Hráčů')).toBeInTheDocument();
    expect(screen.getByText('Novinek')).toBeInTheDocument();
  });

  it('dlaždice s `to` je odkaz, bez `to` není (5.6)', () => {
    render(
      <MemoryRouter>
        <StatBar
          stats={[
            { icon: null, value: 7, label: 'Hráčů', to: '/svet/x/hraci' },
            { icon: null, value: 3, label: 'Akcí' },
          ]}
        />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: /Hráčů/ })).toHaveAttribute(
      'href',
      '/svet/x/hraci',
    );
    expect(
      screen.queryByRole('link', { name: /Akcí/ }),
    ).not.toBeInTheDocument();
  });
});
