import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { GameEvent } from '@/shared/types';
import CalendarPage from './CalendarPage';

const eventsData = vi.hoisted(() => ({ items: [] as GameEvent[] }));

vi.mock('@/features/world/context/WorldContext', () => ({
  useWorldContext: () => ({ worldId: 'w1', loading: false }),
}));
vi.mock('@/features/world/api/useGameEvents', () => ({
  useAllWorldGameEvents: () => ({
    data: eventsData.items,
    isLoading: false,
    isError: false,
  }),
}));

describe('CalendarPage', () => {
  it('vykreslí titulek a měsíční mřížku se jmény dnů', () => {
    eventsData.items = [];
    render(<CalendarPage />);
    expect(
      screen.getByRole('heading', { name: 'Kalendář akcí' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Po')).toBeInTheDocument();
    expect(screen.getByText('Ne')).toBeInTheDocument();
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });

  it('navigace měsíců změní popisek měsíce', async () => {
    eventsData.items = [];
    render(<CalendarPage />);
    const current = new Date().toLocaleDateString('cs-CZ', {
      month: 'long',
      year: 'numeric',
    });
    expect(screen.getByText(current)).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('button', { name: 'Další měsíc' }),
    );
    expect(screen.queryByText(current)).not.toBeInTheDocument();
  });
});
