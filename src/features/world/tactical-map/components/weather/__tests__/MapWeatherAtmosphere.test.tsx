import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MapWeatherAtmosphere } from '../MapWeatherAtmosphere';
import type { ActiveMapWeather } from '@/shared/types';

vi.mock(
  '@/features/world/pages/WorldWeatherPage/components/WeatherAtmosphere',
  () => ({
    WeatherAtmosphere: ({ weatherType }: { weatherType: string }) => (
      <div data-testid="atmo" data-type={weatherType} />
    ),
  }),
);

const mk = (weatherType: string): ActiveMapWeather => ({
  generatorId: 'g1',
  generatorName: 'X',
  setAt: '2026-05-30T00:00:00.000Z',
  weather: { weatherType } as ActiveMapWeather['weather'],
});

describe('MapWeatherAtmosphere (10.2i)', () => {
  it('null počasí → nic', () => {
    const { container } = render(
      <MapWeatherAtmosphere weather={null} fxEnabled />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('fxEnabled=false → nic (per-user vypnuto)', () => {
    const { container } = render(
      <MapWeatherAtmosphere weather={mk('rain')} fxEnabled={false} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('clear → nic (žádný rušivý efekt)', () => {
    const { container } = render(
      <MapWeatherAtmosphere weather={mk('clear')} fxEnabled />,
    );
    expect(container.firstChild).toBeNull();
  });

  it.each(['rain', 'snow', 'storm', 'fog', 'cloudy'])(
    '%s → renderuje atmosféru',
    (type) => {
      const { getByTestId } = render(
        <MapWeatherAtmosphere weather={mk(type)} fxEnabled />,
      );
      expect(getByTestId('atmo').getAttribute('data-type')).toBe(type);
    },
  );
});
