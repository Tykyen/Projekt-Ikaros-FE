/**
 * 9.4 — SetInGameDateModal tests.
 *
 * Pokrývá:
 *  - render initial values (current settings.currentInGameDate fallback)
 *  - submit posílá payload do useSetInGameDate
 *  - regenerateAll default = true
 *  - custom calendar → měsíční select má custom names + counts
 *  - toast.success po úspěchu + onClose() called
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { SetInGameDateModal } from './SetInGameDateModal';

// Hoisted mocks
const mocks = vi.hoisted(() => ({
  setInGameDateMut: {
    mutateAsync: vi.fn(),
    isPending: false,
  },
  settings: null as
    | {
        currentInGameDate?: string | null;
        timelineCalendarSlug?: string | null;
      }
    | null,
  calendars: [] as Array<{
    slug: string;
    name: string;
    months: { name: string; daysCount: number }[];
  }>,
}));

vi.mock('@/features/world/api/useWeatherGenerators', () => ({
  useSetInGameDate: () => mocks.setInGameDateMut,
}));

vi.mock('@/features/world/api/useWorldSettings', () => ({
  useWorldSettings: () => ({ data: mocks.settings }),
}));

vi.mock('@/features/world/api/useCalendarConfigs', () => ({
  useCalendarConfigs: () => ({ data: mocks.calendars }),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.settings = null;
  mocks.calendars = [];
  mocks.setInGameDateMut.mutateAsync = vi.fn().mockResolvedValue({
    settings: {},
    regenerated: [],
  });
  mocks.setInGameDateMut.isPending = false;
});

describe('SetInGameDateModal', () => {
  it('inicializuje hodnoty z persisted currentInGameDate', () => {
    mocks.settings = {
      currentInGameDate: '2026-04-15T00:00:00.000Z',
      timelineCalendarSlug: null,
    };
    const Wrapper = makeWrapper();
    render(
      <Wrapper>
        <SetInGameDateModal open onClose={() => {}} worldId="w1" />
      </Wrapper>,
    );
    const yearInput = screen.getByTestId('sigd-year-input') as HTMLInputElement;
    expect(Number(yearInput.value)).toBe(2026);
    const monthSelect = screen.getByTestId(
      'sigd-month-select',
    ) as HTMLSelectElement;
    expect(Number(monthSelect.value)).toBe(3); // 0-based: duben = index 3
    const dayInput = screen.getByTestId('sigd-day-input') as HTMLInputElement;
    expect(Number(dayInput.value)).toBe(15);
  });

  it('regenerateAll checkbox je default ZAPNUTÝ', () => {
    const Wrapper = makeWrapper();
    render(
      <Wrapper>
        <SetInGameDateModal open onClose={() => {}} worldId="w1" />
      </Wrapper>,
    );
    const checkbox = screen.getByTestId(
      'sigd-regenerate-all',
    ) as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  it('submit posílá { year, monthIndex, day, regenerateAll } do mutace', async () => {
    const onClose = vi.fn();
    const Wrapper = makeWrapper();
    render(
      <Wrapper>
        <SetInGameDateModal open onClose={onClose} worldId="w1" />
      </Wrapper>,
    );

    fireEvent.change(screen.getByTestId('sigd-year-input'), {
      target: { value: '1180' },
    });
    fireEvent.change(screen.getByTestId('sigd-month-select'), {
      target: { value: '6' },
    });
    fireEvent.change(screen.getByTestId('sigd-day-input'), {
      target: { value: '20' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Nastavit datum/i }));

    await waitFor(() => {
      expect(mocks.setInGameDateMut.mutateAsync).toHaveBeenCalledWith({
        year: 1180,
        monthIndex: 6,
        day: 20,
        hour: 12, // default poledne pro fresh init bez persistedDate
        minute: 0,
        regenerateAll: true,
      });
    });
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('custom kalendář — měsíční select obsahuje custom názvy', () => {
    mocks.settings = {
      currentInGameDate: null,
      timelineCalendarSlug: 'aelos',
    };
    mocks.calendars = [
      {
        slug: 'aelos',
        name: 'Aeloský kalendář',
        months: [
          { name: 'Praimul', daysCount: 30 },
          { name: 'Septimul', daysCount: 30 },
          { name: 'Hexul', daysCount: 30 },
        ],
      },
    ];
    const Wrapper = makeWrapper();
    render(
      <Wrapper>
        <SetInGameDateModal open onClose={() => {}} worldId="w1" />
      </Wrapper>,
    );

    const monthSelect = screen.getByTestId(
      'sigd-month-select',
    ) as HTMLSelectElement;
    const options = Array.from(monthSelect.options).map((o) => o.textContent);
    expect(options[0]).toMatch(/Praimul/);
    expect(options[1]).toMatch(/Septimul/);
    expect(options[2]).toMatch(/Hexul/);
    expect(monthSelect.options).toHaveLength(3);

    // Calendar note se renderuje s názvem kalendáře
    expect(screen.getByTestId('sigd-calendar-note')).toHaveTextContent(
      /Aeloský kalendář/,
    );
    expect(screen.getByTestId('sigd-calendar-note')).toHaveTextContent(
      /3 měsíců/,
    );
  });

  it('regenerateAll checkbox lze vypnout', () => {
    const Wrapper = makeWrapper();
    render(
      <Wrapper>
        <SetInGameDateModal open onClose={() => {}} worldId="w1" />
      </Wrapper>,
    );
    const checkbox = screen.getByTestId(
      'sigd-regenerate-all',
    ) as HTMLInputElement;
    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(false);
  });

  it('negativní rok (BCE) je povolen', async () => {
    const Wrapper = makeWrapper();
    render(
      <Wrapper>
        <SetInGameDateModal open onClose={() => {}} worldId="w1" />
      </Wrapper>,
    );
    fireEvent.change(screen.getByTestId('sigd-year-input'), {
      target: { value: '-500' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Nastavit datum/i }));

    await waitFor(() => {
      const call = mocks.setInGameDateMut.mutateAsync.mock.calls[0][0];
      expect(call.year).toBe(-500);
    });
  });
});
