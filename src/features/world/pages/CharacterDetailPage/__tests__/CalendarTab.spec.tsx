import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CalendarTab } from '../components/CalendarTab';
import type { CharacterCalendar } from '../../api/characters.types';

let mockData: CharacterCalendar | undefined;
const mutate = vi.fn();

vi.mock('@/features/world/context/WorldContext', () => ({
  useWorldContext: () => ({
    worldId: 'w1',
    world: { id: 'w1', defaultCalendarConfigSlug: 'gregorian' },
  }),
}));
vi.mock('../../api/useCharacterSubdocs', () => ({
  useCharacterCalendar: () => ({
    data: mockData,
    isLoading: false,
    isError: !mockData,
  }),
}));
vi.mock('../../api/useCharacterMutations', () => ({
  useUpdateCharacterCalendar: () => ({ mutate, isPending: false }),
}));
vi.mock('@/features/world/api/useCalendarConfigs', () => ({
  useCalendarConfigs: () => ({ data: [], isLoading: false }),
}));

const CALENDAR: CharacterCalendar = {
  id: 'cal1',
  characterId: 'c1',
  worldId: 'w1',
  color: '#3b82f6',
  displaySettings: { defaultView: 'month' },
  events: [
    { id: 'e1', title: 'Bitva u Helmova žlebu', start: { year: 3019, monthIndex: 2, day: 3 } },
  ],
};

const noop = () => {};

describe('CalendarTab (8.1f)', () => {
  beforeEach(() => {
    mockData = CALENDAR;
    mutate.mockClear();
  });

  it('view — zobrazí mřížku + událost jako chip', () => {
    render(
      <CalendarTab
        slug="aragorn"
        mode="view"
        onExitEdit={noop}
        onDirtyChange={noop}
      />,
    );
    // 9.2c — view je mřížka, event je chip s názvem jako title.
    expect(
      screen.getByRole('grid', { name: /Kalendář/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Bitva u Helmova žlebu/i }),
    ).toBeInTheDocument();
  });

  it('view — prázdný kalendář → mřížka bez chipů', () => {
    mockData = { ...CALENDAR, events: [] };
    render(
      <CalendarTab
        slug="aragorn"
        mode="view"
        onExitEdit={noop}
        onDirtyChange={noop}
      />,
    );
    // 9.2c — místo „Žádné události" se zobrazí prázdná měsíční mřížka.
    expect(
      screen.getByRole('grid', { name: /Kalendář/i }),
    ).toBeInTheDocument();
  });

  it('edit — banner + grid clickable', () => {
    render(
      <CalendarTab
        slug="aragorn"
        mode="edit"
        onExitEdit={noop}
        onDirtyChange={noop}
      />,
    );
    expect(screen.getByText(/Režim úprav/)).toBeInTheDocument();
    expect(screen.getByRole('grid', { name: /Kalendář/i })).toBeInTheDocument();
  });

  it('edit — klik na existující chip otevře editor s vyplněnými daty', () => {
    render(
      <CalendarTab
        slug="aragorn"
        mode="edit"
        onExitEdit={noop}
        onDirtyChange={noop}
      />,
    );
    fireEvent.click(
      screen.getByRole('button', { name: /Bitva u Helmova žlebu/i }),
    );
    expect(screen.getByText('Upravit událost')).toBeInTheDocument();
    expect(
      screen.getByDisplayValue('Bitva u Helmova žlebu'),
    ).toBeInTheDocument();
  });

  it('edit — uložení modalu volá mutaci a banner zmizí po save', () => {
    render(
      <CalendarTab
        slug="aragorn"
        mode="edit"
        onExitEdit={noop}
        onDirtyChange={noop}
      />,
    );
    fireEvent.click(
      screen.getByRole('button', { name: /Bitva u Helmova žlebu/i }),
    );
    fireEvent.change(screen.getByDisplayValue('Bitva u Helmova žlebu'), {
      target: { value: 'Obléhání' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Uložit' }));
    fireEvent.click(screen.getByText('Uložit změny'));
    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        events: expect.arrayContaining([
          expect.objectContaining({ title: 'Obléhání' }),
        ]),
      }),
      expect.anything(),
    );
  });

  it('edit — smazání z modalu odstraní event', () => {
    render(
      <CalendarTab
        slug="aragorn"
        mode="edit"
        onExitEdit={noop}
        onDirtyChange={noop}
      />,
    );
    fireEvent.click(
      screen.getByRole('button', { name: /Bitva u Helmova žlebu/i }),
    );
    // Modal otevřen → klik na „Smazat" uvnitř modalu.
    fireEvent.click(screen.getByRole('button', { name: /Smazat/i }));
    fireEvent.click(screen.getByText('Uložit změny'));
    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({ events: [] }),
      expect.anything(),
    );
  });
});
