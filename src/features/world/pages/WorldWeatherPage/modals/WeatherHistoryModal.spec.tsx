/**
 * 9.4 dluh #2 — WeatherHistoryModal tests.
 *
 * Pokrývá:
 *  - empty state (žádné záznamy)
 *  - render listu s teplotami + trigger labels
 *  - „Načíst další" tlačítko se zobrazí jen pokud items < total
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { WeatherHistoryModal } from './WeatherHistoryModal';
import { api } from '@/shared/api/client';
import type { WeatherGenerator } from '@/shared/types';

vi.mock('@/shared/api/client', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const Wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  return { Wrapper };
}

const MOCK_GEN: WeatherGenerator = {
  id: 'g1',
  worldId: 'w1',
  name: 'Praha',
  config: {
    tempMin: 0,
    tempMax: 25,
    tempUnit: 'C',
    weatherTypes: [],
    windMin: 0,
    windMax: 30,
    windGustMultiplier: 1.5,
    pressureMin: 990,
    pressureMax: 1030,
    humidityMin: 30,
    humidityMax: 90,
    customFields: [],
  },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  displayOrder: 0,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('WeatherHistoryModal', () => {
  it('empty state: žádné záznamy', async () => {
    vi.mocked(api.get).mockResolvedValue({ items: [], total: 0 });
    const { Wrapper } = makeWrapper();
    render(
      <Wrapper>
        <WeatherHistoryModal
          open
          onClose={() => {}}
          worldId="w1"
          generator={MOCK_GEN}
        />
      </Wrapper>,
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Pro tento generátor zatím není žádný záznam/i),
      ).toBeInTheDocument();
    });
  });

  it('zobrazí list snapshotů s teplotou + weatherType + trigger', async () => {
    vi.mocked(api.get).mockResolvedValue({
      items: [
        {
          id: 'h1',
          worldId: 'w1',
          generatorId: 'g1',
          weather: {
            generatedAt: '2026-05-26T10:00:00.000Z',
            isManual: false,
            temperature: 22,
            tempUnit: 'C',
            weatherType: 'Jasno',
            weatherIcon: 'clear',
            cloudiness: { value: '0/8', description: '' },
            precipitation: { value: 'Beze srážek', description: '' },
            wind: { speed: 5, gusts: 10, unit: 'kmh' },
            pressure: { value: 1015, trend: 'Stabilní' },
            humidity: 45,
            extras: [],
          },
          trigger: 'generate',
          inGameDate: null,
          recordedAt: '2026-05-26T10:00:00.000Z',
        },
        {
          id: 'h2',
          worldId: 'w1',
          generatorId: 'g1',
          weather: {
            generatedAt: '2026-05-25T10:00:00.000Z',
            isManual: true,
            temperature: 18,
            tempUnit: 'C',
            weatherType: 'Oblačno',
            weatherIcon: 'cloudy',
            cloudiness: { value: '5/8', description: '' },
            precipitation: { value: '', description: '' },
            wind: { speed: 3, gusts: 5, unit: 'kmh' },
            pressure: { value: 1010, trend: '' },
            humidity: 60,
            extras: [],
          },
          trigger: 'manual',
          inGameDate: null,
          recordedAt: '2026-05-25T10:00:00.000Z',
        },
      ],
      total: 2,
    });
    const { Wrapper } = makeWrapper();
    render(
      <Wrapper>
        <WeatherHistoryModal
          open
          onClose={() => {}}
          worldId="w1"
          generator={MOCK_GEN}
        />
      </Wrapper>,
    );

    await waitFor(() => {
      expect(screen.getByText('22°C')).toBeInTheDocument();
      expect(screen.getByText('18°C')).toBeInTheDocument();
      expect(screen.getByText('Jasno')).toBeInTheDocument();
      expect(screen.getByText('Oblačno')).toBeInTheDocument();
      expect(screen.getByText('Vygenerováno')).toBeInTheDocument();
      expect(screen.getByText('Ručně nastaveno')).toBeInTheDocument();
    });
    expect(screen.getByText(/Zobrazeno 2 z 2 záznamů/)).toBeInTheDocument();
  });

  it('„Načíst další" se zobrazí pokud items < total', async () => {
    vi.mocked(api.get).mockResolvedValue({
      items: [
        {
          id: 'h1',
          worldId: 'w1',
          generatorId: 'g1',
          weather: {
            generatedAt: '2026-05-26T10:00:00.000Z',
            isManual: false,
            temperature: 22,
            tempUnit: 'C',
            weatherType: 'Jasno',
            weatherIcon: 'clear',
            cloudiness: { value: '0/8', description: '' },
            precipitation: { value: '', description: '' },
            wind: { speed: 5, gusts: 10, unit: 'kmh' },
            pressure: { value: 1015, trend: '' },
            humidity: 45,
            extras: [],
          },
          trigger: 'generate',
          inGameDate: null,
          recordedAt: '2026-05-26T10:00:00.000Z',
        },
      ],
      total: 100,
    });
    const { Wrapper } = makeWrapper();
    render(
      <Wrapper>
        <WeatherHistoryModal
          open
          onClose={() => {}}
          worldId="w1"
          generator={MOCK_GEN}
        />
      </Wrapper>,
    );

    await waitFor(() => {
      expect(screen.getByText('Načíst další')).toBeInTheDocument();
    });
  });

  it('advance-day trigger se zobrazí s in-game datum', async () => {
    vi.mocked(api.get).mockResolvedValue({
      items: [
        {
          id: 'h1',
          worldId: 'w1',
          generatorId: 'g1',
          weather: {
            generatedAt: '2026-05-26T10:00:00.000Z',
            isManual: false,
            temperature: 15,
            tempUnit: 'C',
            weatherType: 'Déšť',
            weatherIcon: 'rain',
            cloudiness: { value: '7/8', description: '' },
            precipitation: { value: '5 mm', description: '' },
            wind: { speed: 8, gusts: 12, unit: 'kmh' },
            pressure: { value: 1005, trend: '' },
            humidity: 80,
            extras: [],
          },
          trigger: 'advance-day',
          inGameDate: '2027-06-15T00:00:00.000Z',
          recordedAt: '2026-05-26T10:00:00.000Z',
        },
      ],
      total: 1,
    });
    const { Wrapper } = makeWrapper();
    render(
      <Wrapper>
        <WeatherHistoryModal
          open
          onClose={() => {}}
          worldId="w1"
          generator={MOCK_GEN}
        />
      </Wrapper>,
    );

    await waitFor(() => {
      expect(screen.getByText('Posun dne')).toBeInTheDocument();
      expect(screen.getByText(/In-game:/i)).toBeInTheDocument();
    });
  });

  it('„Načíst další" zvedne pageCount → fetch s větším limit', async () => {
    let callCount = 0;
    vi.mocked(api.get).mockImplementation((_url: string, params?: unknown) => {
      callCount++;
      const p = params as { limit?: number; offset?: number } | undefined;
      // První fetch limit=50, druhý limit=100
      if (callCount === 1) {
        expect(p?.limit).toBe(50);
      } else if (callCount === 2) {
        expect(p?.limit).toBe(100);
      }
      return Promise.resolve({
        items: Array(p?.limit ?? 50)
          .fill(null)
          .map((_, i) => ({
            id: `h${i}`,
            worldId: 'w1',
            generatorId: 'g1',
            trigger: 'generate' as const,
            inGameDate: null,
            recordedAt: '2026-05-26T10:00:00.000Z',
            weather: {
              generatedAt: '2026-05-26T10:00:00.000Z',
              isManual: false,
              temperature: 20,
              tempUnit: 'C',
              weatherType: 'Jasno',
              weatherIcon: 'clear',
              cloudiness: { value: '0/8', description: '' },
              precipitation: { value: '', description: '' },
              wind: { speed: 5, gusts: 10, unit: 'kmh' },
              pressure: { value: 1015, trend: '' },
              humidity: 45,
              extras: [],
            },
          })),
        total: 200,
      });
    });

    const { Wrapper } = makeWrapper();
    render(
      <Wrapper>
        <WeatherHistoryModal
          open
          onClose={() => {}}
          worldId="w1"
          generator={MOCK_GEN}
        />
      </Wrapper>,
    );

    const loadMoreBtn = await waitFor(() => screen.getByText('Načíst další'));
    fireEvent.click(loadMoreBtn);

    await waitFor(() => {
      expect(callCount).toBeGreaterThanOrEqual(2);
    });
  });
});
