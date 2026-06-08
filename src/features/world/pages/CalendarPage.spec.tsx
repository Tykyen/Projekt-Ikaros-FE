import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { GameEvent } from '@/shared/types';
import CalendarPage from './CalendarPage';

const eventsData = vi.hoisted(() => ({ items: [] as GameEvent[] }));

vi.mock('@/features/world/context/WorldContext', () => ({
  useWorldContext: () => ({
    worldId: 'w1',
    world: { id: 'w1', defaultCalendarConfigSlug: 'gregorian' },
    loading: false,
  }),
}));
vi.mock('@/features/world/api/useGameEvents', () => ({
  useAllWorldGameEvents: () => ({
    data: eventsData.items,
    isLoading: false,
    isError: false,
  }),
}));
vi.mock('@/features/world/api/useCalendarConfigs', () => ({
  useCalendarConfigs: () => ({ data: [], isLoading: false }),
}));
vi.mock('@/features/world/api/useCalendarsAggregate', () => ({
  useCalendarsAggregate: () => ({
    data: { characters: [], events: [] },
    isLoading: false,
  }),
}));
vi.mock('@/features/world/pages/api/useCharacterMutations', () => ({
  useSetCalendarColor: () => ({ mutate: vi.fn(), isPending: false }),
}));

describe('CalendarPage (9.2d aggregate)', () => {
  beforeEach(() => {
    eventsData.items = [];
  });

  it('vykreslí PJ titulek a měsíční mřížku', () => {
    render(<CalendarPage />);
    expect(
      screen.getByRole('heading', { name: /Kalendář světa/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('grid')).toBeInTheDocument();
    // Default Gregorian config — Po..Ne weekday headers.
    expect(screen.getByText('Po')).toBeInTheDocument();
    expect(screen.getByText('Ne')).toBeInTheDocument();
  });

  it('navigace měsíců změní zobrazený měsíc', async () => {
    render(<CalendarPage />);
    const monthHeader = screen.getByRole('grid');
    const initialLabel = monthHeader.getAttribute('aria-label');
    await userEvent.click(
      screen.getByRole('button', { name: 'Další měsíc' }),
    );
    const newLabel = screen.getByRole('grid').getAttribute('aria-label');
    expect(newLabel).not.toBe(initialLabel);
  });

  it('sidebar má sekci "Filtr entit" — empty state když žádné eventy', () => {
    render(<CalendarPage />);
    expect(screen.getByText('Filtr entit')).toBeInTheDocument();
    expect(
      screen.getByText(/Žádné události v aktuálním měsíci/i),
    ).toBeInTheDocument();
  });
});
