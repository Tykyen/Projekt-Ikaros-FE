/**
 * 9.4 — Generator Sets hooks tests.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import {
  useGeneratorSets,
  useGeneratorSet,
  useCreateGeneratorSet,
  useUpdateGeneratorSet,
  useDeleteGeneratorSet,
  useApplyGeneratorSet,
  generatorSetsKey,
} from './useGeneratorSets';
import { weatherGeneratorsKey } from './useWeatherGenerators';
import { api } from '@/shared/api/client';
import type {
  WeatherGeneratorConfig,
  WeatherGeneratorSet,
} from '@/shared/types';

vi.mock('@/shared/api/client', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const Wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  return { Wrapper, qc };
}

const DEFAULT_CONFIG: WeatherGeneratorConfig = {
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
};

function makeSet(
  id: string,
  overrides: Partial<WeatherGeneratorSet> = {},
): WeatherGeneratorSet {
  return {
    id,
    worldId: 'w1',
    name: `Set ${id}`,
    description: undefined,
    emoji: undefined,
    items: [
      {
        presetId: 'city:Evropa:Česká republika:Praha',
        generatorName: 'Praha',
      },
    ],
    createdBy: 'u1',
    appliedCount: 0,
    createdAt: '2026-05-26T00:00:00Z',
    updatedAt: '2026-05-26T00:00:00Z',
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useGeneratorSets', () => {
  it('GET /worlds/:worldId/weather-sets — vrátí list', async () => {
    vi.mocked(api.get).mockResolvedValue([makeSet('s1'), makeSet('s2')]);
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useGeneratorSets('w1'), {
      wrapper: Wrapper,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
    expect(api.get).toHaveBeenCalledWith('/worlds/w1/weather-sets');
  });

  it('useGeneratorSet — GET detail by id', async () => {
    vi.mocked(api.get).mockResolvedValue(makeSet('s1'));
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useGeneratorSet('w1', 's1'), {
      wrapper: Wrapper,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith('/worlds/w1/weather-sets/s1');
  });

  it('useCreateGeneratorSet — POST + invalidate', async () => {
    vi.mocked(api.post).mockResolvedValue(makeSet('new', { name: 'Můj set' }));
    const { Wrapper, qc } = makeWrapper();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useCreateGeneratorSet('w1'), {
      wrapper: Wrapper,
    });
    await act(async () => {
      await result.current.mutateAsync({
        name: 'Můj set',
        items: [
          {
            presetId: 'city:Evropa:Česká republika:Praha',
            generatorName: 'Praha',
          },
        ],
      });
    });
    expect(api.post).toHaveBeenCalledWith(
      '/worlds/w1/weather-sets',
      expect.objectContaining({ name: 'Můj set' }),
    );
    expect(spy).toHaveBeenCalledWith({ queryKey: generatorSetsKey('w1') });
  });

  it('useUpdateGeneratorSet — PUT bez id v body', async () => {
    vi.mocked(api.put).mockResolvedValue(makeSet('s1', { name: 'Renamed' }));
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useUpdateGeneratorSet('w1'), {
      wrapper: Wrapper,
    });
    await act(async () => {
      await result.current.mutateAsync({ id: 's1', name: 'Renamed' });
    });
    const [url, body] = vi.mocked(api.put).mock.calls[0];
    expect(url).toBe('/worlds/w1/weather-sets/s1');
    expect(body).toEqual({ name: 'Renamed' });
    expect(body as Record<string, unknown>).not.toHaveProperty('id');
  });

  it('useDeleteGeneratorSet — DELETE + invalidate', async () => {
    vi.mocked(api.delete).mockResolvedValue(undefined);
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useDeleteGeneratorSet('w1'), {
      wrapper: Wrapper,
    });
    await act(async () => {
      await result.current.mutateAsync('s1');
    });
    expect(api.delete).toHaveBeenCalledWith('/worlds/w1/weather-sets/s1');
  });

  it('useApplyGeneratorSet — POST /apply s resolvedItems + invalidate weather-generators', async () => {
    vi.mocked(api.post).mockResolvedValue([
      {
        id: 'gen-1',
        worldId: 'w1',
        name: 'Praha',
        config: DEFAULT_CONFIG,
        createdAt: '2026-05-26T00:00:00Z',
        updatedAt: '2026-05-26T00:00:00Z',
        displayOrder: 0,
      },
    ]);
    const { Wrapper, qc } = makeWrapper();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useApplyGeneratorSet('w1'), {
      wrapper: Wrapper,
    });
    await act(async () => {
      await result.current.mutateAsync({
        id: 's1',
        resolvedItems: [
          { name: 'Praha', config: DEFAULT_CONFIG },
        ],
      });
    });
    expect(api.post).toHaveBeenCalledWith(
      '/worlds/w1/weather-sets/s1/apply',
      { resolvedItems: [{ name: 'Praha', config: DEFAULT_CONFIG }] },
    );
    // Invaliduje OBA klíče (set kvůli appliedCount, generators kvůli novým).
    expect(spy).toHaveBeenCalledWith({ queryKey: generatorSetsKey('w1') });
    expect(spy).toHaveBeenCalledWith({
      queryKey: weatherGeneratorsKey('w1'),
    });
  });
});
