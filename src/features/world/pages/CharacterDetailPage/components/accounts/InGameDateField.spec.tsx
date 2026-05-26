import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { InGameDateField } from './InGameDateField';

vi.mock('@/features/world/api/useWorldSettings', () => ({
  useWorldSettings: vi.fn(() => ({
    data: { currentInGameDate: '2039-06-14T12:30:00.000Z' },
  })),
}));

vi.mock('@/features/world/api/useCalendarConfigs', () => ({
  useCalendarConfigs: vi.fn(() => ({ data: [] })),
}));

function wrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

describe('InGameDateField', () => {
  it('renderuje den/měsíc/rok + hodina/minuta', () => {
    render(
      <InGameDateField
        value={{ year: 2039, monthIndex: 5, day: 14, hour: 12, minute: 30 }}
        onChange={() => {}}
        worldId="w1"
      />,
      { wrapper: wrapper() },
    );
    expect(screen.getByTestId('igdf-day')).toBeInTheDocument();
    expect(screen.getByTestId('igdf-month')).toBeInTheDocument();
    expect(screen.getByTestId('igdf-year')).toBeInTheDocument();
    expect(screen.getByTestId('igdf-hour')).toBeInTheDocument();
    expect(screen.getByTestId('igdf-minute')).toBeInTheDocument();
  });

  it('Gregorian fallback měsíce když world nemá calendars', () => {
    render(
      <InGameDateField
        value={{ year: 2039, monthIndex: 5, day: 14 }}
        onChange={() => {}}
        worldId="w1"
      />,
      { wrapper: wrapper() },
    );
    const monthSelect = screen.getByTestId('igdf-month') as HTMLSelectElement;
    expect(monthSelect.value).toBe('5');
    expect(monthSelect.options.length).toBe(12); // Gregorian
    expect(monthSelect.options[5].text).toContain('Červen');
  });

  it('onChange při změně dne propaguje nový FantasyDate', () => {
    const onChange = vi.fn();
    render(
      <InGameDateField
        value={{ year: 2039, monthIndex: 5, day: 14 }}
        onChange={onChange}
        worldId="w1"
      />,
      { wrapper: wrapper() },
    );
    fireEvent.change(screen.getByTestId('igdf-day'), {
      target: { value: '20' },
    });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ day: 20, monthIndex: 5, year: 2039 }),
    );
  });

  it('clamp dne při změně měsíce na shorter (31. leden → 28. únor)', () => {
    const onChange = vi.fn();
    render(
      <InGameDateField
        value={{ year: 2039, monthIndex: 0, day: 31 }}
        onChange={onChange}
        worldId="w1"
      />,
      { wrapper: wrapper() },
    );
    // Únor (index 1) má jen 29 dnů v Gregorian fallback
    fireEvent.change(screen.getByTestId('igdf-month'), {
      target: { value: '1' },
    });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ monthIndex: 1, day: 29 }),
    );
  });

  it('tlačítko Dnes resetuje na currentInGameDate', () => {
    const onChange = vi.fn();
    render(
      <InGameDateField
        value={{ year: 1, monthIndex: 0, day: 1 }}
        onChange={onChange}
        worldId="w1"
      />,
      { wrapper: wrapper() },
    );
    fireEvent.click(screen.getByText('Dnes'));
    expect(onChange).toHaveBeenCalled();
    const arg = onChange.mock.calls[0][0];
    expect(arg.year).toBe(2039);
    expect(arg.monthIndex).toBe(5); // červen = index 5
    expect(arg.day).toBe(14);
  });

  it('allowHour=false skryje hodinu/minutu', () => {
    render(
      <InGameDateField
        value={{ year: 2039, monthIndex: 5, day: 14 }}
        onChange={() => {}}
        worldId="w1"
        allowHour={false}
      />,
      { wrapper: wrapper() },
    );
    expect(screen.queryByTestId('igdf-hour')).not.toBeInTheDocument();
    expect(screen.queryByTestId('igdf-minute')).not.toBeInTheDocument();
  });
});
