import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MapWeatherPanel } from '../MapWeatherPanel';
import type { ActiveMapWeather } from '@/shared/types';

vi.mock('@/features/world/context/WorldContext', () => ({
  useWorldContext: () => ({ worldId: 'w1' }),
}));
vi.mock('@/features/world/api/useWeatherGenerators', () => ({
  useWeatherGenerators: () => ({
    data: [
      { id: 'g1', name: 'Mordor', currentWeather: { weatherType: 'rain' } },
      { id: 'g2', name: 'Shire', currentWeather: undefined },
    ],
  }),
}));

const weather: ActiveMapWeather = {
  generatorId: 'g1',
  generatorName: 'Mordor',
  setAt: '2026-05-30T00:00:00.000Z',
  weather: {
    generatedAt: '2026-05-30T00:00:00.000Z',
    isManual: false,
    temperature: 12.6,
    tempUnit: 'C',
    weatherType: 'rain',
    weatherIcon: 'rain',
    cloudiness: { value: '6/8', description: '' },
    precipitation: { value: '4 mm', description: '' },
    wind: { speed: 15, gusts: 25, unit: 'kmh' },
    pressure: { value: 1008, trend: 'klesá' },
    humidity: 78,
    extras: [],
    narrativeText: 'Těžké mraky valí se od hor.',
  },
};

const baseProps = {
  fxEnabled: true,
  toggleFx: vi.fn(),
  setWeather: vi.fn(),
  clearWeather: vi.fn(),
  isMutating: false,
};

beforeEach(() => vi.clearAllMocks());

describe('MapWeatherPanel (10.2i)', () => {
  it('hráč bez počasí → nic nerenderuje', () => {
    const { container } = render(
      <MapWeatherPanel {...baseProps} weather={null} isPJ={false} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('hráč s počasím → pecka s teplotou, žádné PJ ovládání', () => {
    render(<MapWeatherPanel {...baseProps} weather={weather} isPJ={false} />);
    expect(screen.getByText('13°C')).toBeInTheDocument(); // round(12.6)
    fireEvent.click(screen.getByRole('button', { expanded: false }));
    expect(screen.queryByText('Vyslat na mapu')).not.toBeInTheDocument();
    expect(screen.getByText(/Těžké mraky/)).toBeInTheDocument();
  });

  it('PJ → po rozbalení vidí výběr generátoru + Vyslat na mapu + Vypnout', () => {
    render(<MapWeatherPanel {...baseProps} weather={weather} isPJ />);
    fireEvent.click(screen.getByRole('button', { expanded: false }));
    expect(screen.getByText('Vyslat na mapu')).toBeInTheDocument();
    expect(screen.getByText('Vypnout počasí')).toBeInTheDocument();
  });

  it('PJ vyšle vybraný generátor', () => {
    const setWeather = vi.fn();
    render(
      <MapWeatherPanel
        {...baseProps}
        setWeather={setWeather}
        weather={weather}
        isPJ
      />,
    );
    fireEvent.click(screen.getByRole('button', { expanded: false }));
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'g1' } });
    fireEvent.click(screen.getByText('Vyslat na mapu'));
    expect(setWeather).toHaveBeenCalledWith('g1');
  });

  it('FX toggle volá toggleFx', () => {
    const toggleFx = vi.fn();
    render(
      <MapWeatherPanel
        {...baseProps}
        toggleFx={toggleFx}
        weather={weather}
        isPJ={false}
      />,
    );
    fireEvent.click(screen.getByRole('button', { expanded: false }));
    fireEvent.click(screen.getByRole('checkbox'));
    expect(toggleFx).toHaveBeenCalledTimes(1);
  });
});
