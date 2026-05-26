import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WeatherGeneratorCard } from './WeatherGeneratorCard';
import type { WeatherGenerator } from '@/shared/types';

function makeGenerator(
  overrides: Partial<WeatherGenerator> = {},
): WeatherGenerator {
  return {
    id: 'g1',
    worldId: 'w1',
    name: 'Praha',
    description: 'Hlavní město',
    displayOrder: 0,
    createdAt: '2026-05-26T10:00:00.000Z',
    updatedAt: '2026-05-26T10:00:00.000Z',
    config: {
      tempMin: -5,
      tempMax: 30,
      tempUnit: 'C',
      weatherTypes: [],
      windMin: 0,
      windMax: 40,
      windGustMultiplier: 1.6,
      pressureMin: 990,
      pressureMax: 1030,
      humidityMin: 30,
      humidityMax: 95,
      customFields: [],
    },
    currentWeather: {
      generatedAt: '2026-05-26T10:00:00.000Z',
      isManual: false,
      temperature: 22,
      tempUnit: 'C',
      weatherType: 'clear',
      weatherIcon: '☀',
      cloudiness: { value: '2', description: 'Slunečno' },
      precipitation: { value: '0', description: 'Sucho' },
      wind: { speed: 8, gusts: 12, unit: 'kmh' },
      pressure: { value: 1018, trend: 'stoupá' },
      humidity: 45,
      extras: [],
    },
    ...overrides,
  };
}

const handlers = () => ({
  onGenerate: vi.fn(),
  onBroadcast: vi.fn(),
  onEdit: vi.fn(),
  onManual: vi.fn(),
  onDelete: vi.fn(),
});

beforeEach(() => vi.clearAllMocks());

describe('WeatherGeneratorCard', () => {
  it('vykreslí název, lokaci, teplotu a vlhkost', () => {
    const h = handlers();
    render(
      <WeatherGeneratorCard
        generator={makeGenerator()}
        canManage
        canDelete
        {...h}
      />,
    );
    expect(screen.getByText('Praha')).toBeInTheDocument();
    expect(screen.getByText('Hlavní město')).toBeInTheDocument();
    expect(screen.getAllByText('22°').length).toBeGreaterThan(0);
    expect(screen.getByText('45%')).toBeInTheDocument();
  });

  it('Hrac (canManage=false) nevidí kebab ani akce', () => {
    const h = handlers();
    render(
      <WeatherGeneratorCard
        generator={makeGenerator()}
        canManage={false}
        canDelete={false}
        {...h}
      />,
    );
    expect(
      screen.queryByRole('button', { name: /Více akcí/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Vygenerovat/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Broadcast/i }),
    ).not.toBeInTheDocument();
  });

  it('canManage zobrazí Vygenerovat + Broadcast tlačítka', () => {
    const h = handlers();
    render(
      <WeatherGeneratorCard
        generator={makeGenerator()}
        canManage
        canDelete={false}
        {...h}
      />,
    );
    expect(
      screen.getByRole('button', { name: /Vygenerovat/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Broadcast/i }),
    ).toBeInTheDocument();
  });

  it('klik na Vygenerovat zavolá onGenerate', () => {
    const h = handlers();
    render(
      <WeatherGeneratorCard
        generator={makeGenerator()}
        canManage
        canDelete
        {...h}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Vygenerovat/i }));
    expect(h.onGenerate).toHaveBeenCalledTimes(1);
  });

  it('klik na Broadcast zavolá onBroadcast', () => {
    const h = handlers();
    render(
      <WeatherGeneratorCard
        generator={makeGenerator()}
        canManage
        canDelete
        {...h}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Broadcast/i }));
    expect(h.onBroadcast).toHaveBeenCalledTimes(1);
  });

  it('empty state (žádný currentWeather) — render placeholder + jen Vygenerovat první', () => {
    const h = handlers();
    render(
      <WeatherGeneratorCard
        generator={makeGenerator({ currentWeather: undefined })}
        canManage
        canDelete
        {...h}
      />,
    );
    expect(screen.getByText(/Zatím nevygenerováno/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Vygenerovat první/i }),
    ).toBeInTheDocument();
    // Bez weather → bez broadcast tlačítka
    expect(
      screen.queryByRole('button', { name: /Broadcast/i }),
    ).not.toBeInTheDocument();
  });

  it('anomaly chip „Vlna veder" se renderuje při heat_wave', () => {
    const h = handlers();
    const gen = makeGenerator();
    gen.currentWeather!.isAnomaly = true;
    gen.currentWeather!.anomalyType = 'heat_wave';
    render(
      <WeatherGeneratorCard
        generator={gen}
        canManage
        canDelete={false}
        {...h}
      />,
    );
    expect(screen.getByText(/Vlna veder/i)).toBeInTheDocument();
  });

  it('canDelete=false skryje Smazat v kebab menu (PomocnyPJ)', () => {
    const h = handlers();
    render(
      <WeatherGeneratorCard
        generator={makeGenerator()}
        canManage
        canDelete={false}
        {...h}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Více akcí/i }));
    expect(
      screen.queryByRole('menuitem', { name: /Smazat/i }),
    ).not.toBeInTheDocument();
  });

  it('canDelete=true zobrazí Smazat v kebab menu (PJ+)', () => {
    const h = handlers();
    render(
      <WeatherGeneratorCard
        generator={makeGenerator()}
        canManage
        canDelete
        {...h}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Více akcí/i }));
    expect(screen.getByRole('menuitem', { name: /Smazat/i })).toBeInTheDocument();
  });

  it('star button — favorited stav vykreslí aria-label „Odebrat z oblíbených"', () => {
    const h = handlers();
    const onToggleFavorite = vi.fn();
    render(
      <WeatherGeneratorCard
        generator={makeGenerator()}
        canManage={false}
        canDelete={false}
        isFavorite
        onToggleFavorite={onToggleFavorite}
        {...h}
      />,
    );
    const star = screen.getByRole('button', { name: /Odebrat z oblíbených/i });
    expect(star).toBeInTheDocument();
    expect(star).toHaveAttribute('aria-pressed', 'true');
  });

  it('star button — klik zavolá onToggleFavorite', () => {
    const h = handlers();
    const onToggleFavorite = vi.fn();
    render(
      <WeatherGeneratorCard
        generator={makeGenerator()}
        canManage={false}
        canDelete={false}
        isFavorite={false}
        onToggleFavorite={onToggleFavorite}
        {...h}
      />,
    );
    fireEvent.click(
      screen.getByRole('button', { name: /Přidat do oblíbených/i }),
    );
    expect(onToggleFavorite).toHaveBeenCalledTimes(1);
  });

  it('star button se nerenderuje bez onToggleFavorite handleru', () => {
    const h = handlers();
    render(
      <WeatherGeneratorCard
        generator={makeGenerator()}
        canManage
        canDelete
        {...h}
      />,
    );
    expect(
      screen.queryByRole('button', { name: /oblíbených/i }),
    ).not.toBeInTheDocument();
  });

  it('drag handle se renderuje jen pro canManage', () => {
    const h = handlers();
    const { rerender } = render(
      <WeatherGeneratorCard
        generator={makeGenerator()}
        canManage={false}
        canDelete={false}
        {...h}
      />,
    );
    expect(
      screen.queryByRole('button', { name: /Přesunout generátor/i }),
    ).not.toBeInTheDocument();

    rerender(
      <WeatherGeneratorCard
        generator={makeGenerator()}
        canManage
        canDelete
        {...h}
      />,
    );
    expect(
      screen.getByRole('button', { name: /Přesunout generátor/i }),
    ).toBeInTheDocument();
  });
});
