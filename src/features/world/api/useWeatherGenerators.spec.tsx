import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import {
  useWeatherGenerators,
  useCreateWeatherGenerator,
  useUpdateWeatherGenerator,
  useDeleteWeatherGenerator,
  useGenerateWeather,
  useSetCurrentWeather,
  useBroadcastWeather,
  useReorderGenerators,
  useAdvanceDay,
  useWeatherHistory,
  weatherGeneratorsKey,
} from './useWeatherGenerators';
import { useWeatherWsSubscribe } from './useWeatherWsSubscribe';
import { api } from '@/shared/api/client';
import type {
  WeatherGenerator,
  WeatherGeneratorConfig,
  WeatherResult,
} from '@/shared/types';

// ── Mocks ──────────────────────────────────────────────────────────────

vi.mock('@/shared/api/client', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

// Socket mock — emit-driven test pro WS subscribe
type Handler = (data: unknown) => void;
const socketHandlers: Record<string, Handler[]> = {};

vi.mock('@/features/chat/api/useSocket', () => ({
  useSocketEvent: <T,>(event: string, handler: (data: T) => void) => {
    // Register handler do mock registry pro test trigger.
    // Pro jednoduchost ignorujeme cleanup (test recreate qc per case).
    const h: Handler = (d) => handler(d as T);
    if (!socketHandlers[event]) socketHandlers[event] = [];
    socketHandlers[event].push(h);
  },
}));

function emitSocket(event: string, data: unknown) {
  (socketHandlers[event] ?? []).forEach((h) => h(data));
}

// ── Test helpers ───────────────────────────────────────────────────────

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
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

function makeGenerator(
  id: string,
  overrides: Partial<WeatherGenerator> = {},
): WeatherGenerator {
  return {
    id,
    worldId: 'w1',
    name: `Generator ${id}`,
    config: DEFAULT_CONFIG,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    displayOrder: 0,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  for (const k of Object.keys(socketHandlers)) delete socketHandlers[k];
});

// ── Tests ──────────────────────────────────────────────────────────────

describe('useWeatherGenerators (list)', () => {
  it('zavolá GET /worlds/:worldId/weather-generators', async () => {
    vi.mocked(api.get).mockResolvedValue([makeGenerator('g1')]);
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useWeatherGenerators('w1'), {
      wrapper: Wrapper,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith('/worlds/w1/weather-generators');
    expect(result.current.data).toHaveLength(1);
  });

  it('nespustí query bez worldId', async () => {
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useWeatherGenerators(''), {
      wrapper: Wrapper,
    });
    await waitFor(() => expect(result.current.fetchStatus).toBe('idle'));
    expect(api.get).not.toHaveBeenCalled();
  });
});

describe('useCreateWeatherGenerator', () => {
  it('POST /worlds/:worldId/weather-generators + invalidace cache', async () => {
    vi.mocked(api.post).mockResolvedValue(makeGenerator('g1'));
    const { Wrapper, qc } = makeWrapper();
    const invalidate = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useCreateWeatherGenerator('w1'), {
      wrapper: Wrapper,
    });
    await act(async () => {
      await result.current.mutateAsync({
        name: 'Praha',
        config: DEFAULT_CONFIG,
      });
    });
    expect(api.post).toHaveBeenCalledWith('/worlds/w1/weather-generators', {
      name: 'Praha',
      config: DEFAULT_CONFIG,
    });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: weatherGeneratorsKey('w1'),
    });
  });
});

describe('useUpdateWeatherGenerator', () => {
  it('PUT /worlds/:worldId/weather-generators/:id', async () => {
    vi.mocked(api.put).mockResolvedValue(makeGenerator('g1', { name: 'X' }));
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useUpdateWeatherGenerator('w1'), {
      wrapper: Wrapper,
    });
    await act(async () => {
      await result.current.mutateAsync({ id: 'g1', name: 'X' });
    });
    expect(api.put).toHaveBeenCalledWith('/worlds/w1/weather-generators/g1', {
      name: 'X',
    });
  });
});

describe('useDeleteWeatherGenerator', () => {
  it('DELETE /worlds/:worldId/weather-generators/:id', async () => {
    vi.mocked(api.delete).mockResolvedValue(undefined);
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useDeleteWeatherGenerator('w1'), {
      wrapper: Wrapper,
    });
    await act(async () => {
      await result.current.mutateAsync('g1');
    });
    expect(api.delete).toHaveBeenCalledWith('/worlds/w1/weather-generators/g1');
  });
});

describe('useGenerateWeather', () => {
  it('POST /generate bez query params', async () => {
    vi.mocked(api.post).mockResolvedValue(makeGenerator('g1'));
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useGenerateWeather('w1'), {
      wrapper: Wrapper,
    });
    await act(async () => {
      await result.current.mutateAsync({ id: 'g1' });
    });
    expect(api.post).toHaveBeenCalledWith(
      '/worlds/w1/weather-generators/g1/generate',
    );
  });

  it('POST /generate s monthIndex+day+seed', async () => {
    vi.mocked(api.post).mockResolvedValue(makeGenerator('g1'));
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useGenerateWeather('w1'), {
      wrapper: Wrapper,
    });
    await act(async () => {
      await result.current.mutateAsync({
        id: 'g1',
        monthIndex: 6,
        day: 15,
        seed: 42,
      });
    });
    expect(api.post).toHaveBeenCalledWith(
      '/worlds/w1/weather-generators/g1/generate?monthIndex=6&day=15&seed=42',
    );
  });
});

describe('useSetCurrentWeather', () => {
  it('PUT /current s weather payload', async () => {
    vi.mocked(api.put).mockResolvedValue(makeGenerator('g1'));
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useSetCurrentWeather('w1'), {
      wrapper: Wrapper,
    });
    const weather: Partial<WeatherResult> = { temperature: 20 };
    await act(async () => {
      await result.current.mutateAsync({ id: 'g1', weather });
    });
    expect(api.put).toHaveBeenCalledWith(
      '/worlds/w1/weather-generators/g1/current',
      weather,
    );
  });
});

describe('useBroadcastWeather', () => {
  it('POST /broadcast s chat target', async () => {
    vi.mocked(api.post).mockResolvedValue(undefined);
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useBroadcastWeather('w1'), {
      wrapper: Wrapper,
    });
    await act(async () => {
      await result.current.mutateAsync({
        id: 'g1',
        target: 'chat',
        channelId: 'c1',
        message: 'Hello',
      });
    });
    expect(api.post).toHaveBeenCalledWith(
      '/worlds/w1/weather-generators/g1/broadcast',
      { target: 'chat', channelId: 'c1', message: 'Hello' },
    );
  });
});

describe('useReorderGenerators', () => {
  it('PUT /reorder a optimistic update cache', async () => {
    const { Wrapper, qc } = makeWrapper();
    const initial = [
      makeGenerator('a', { displayOrder: 0 }),
      makeGenerator('b', { displayOrder: 1 }),
      makeGenerator('c', { displayOrder: 2 }),
    ];
    qc.setQueryData(weatherGeneratorsKey('w1'), initial);

    // BE vrátí canonical po reorder
    const reordered = [
      { ...initial[2], displayOrder: 0 },
      { ...initial[0], displayOrder: 1 },
      { ...initial[1], displayOrder: 2 },
    ];
    vi.mocked(api.put).mockResolvedValue(reordered);

    const { result } = renderHook(() => useReorderGenerators('w1'), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync(['c', 'a', 'b']);
    });

    expect(api.put).toHaveBeenCalledWith(
      '/worlds/w1/weather-generators/reorder',
      { orderedIds: ['c', 'a', 'b'] },
    );

    const cached = qc.getQueryData<WeatherGenerator[]>(
      weatherGeneratorsKey('w1'),
    );
    expect(cached?.map((g) => g.id)).toEqual(['c', 'a', 'b']);
  });

  it('rollback při BE chybě', async () => {
    const { Wrapper, qc } = makeWrapper();
    const initial = [
      makeGenerator('a', { displayOrder: 0 }),
      makeGenerator('b', { displayOrder: 1 }),
    ];
    qc.setQueryData(weatherGeneratorsKey('w1'), initial);

    vi.mocked(api.put).mockRejectedValue(new Error('BE fail'));

    const { result } = renderHook(() => useReorderGenerators('w1'), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync(['b', 'a']).catch(() => {});
    });

    const cached = qc.getQueryData<WeatherGenerator[]>(
      weatherGeneratorsKey('w1'),
    );
    // Rollback → původní pořadí
    expect(cached?.map((g) => g.id)).toEqual(['a', 'b']);
  });
});

describe('useAdvanceDay (9.4 dluh #1)', () => {
  it('POST /advance-day s default 1 a invaliduje weather-generators + settings', async () => {
    vi.mocked(api.post).mockResolvedValue({
      newInGameDate: '2026-05-27T00:00:00.000Z',
      monthIndex: 4,
      monthName: 'Květen',
      day: 27,
      year: 2026,
      updatedGenerators: [],
    });
    const { Wrapper, qc } = makeWrapper();
    const invalidate = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useAdvanceDay('w1'), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync(1);
    });

    expect(api.post).toHaveBeenCalledWith(
      '/worlds/w1/weather-generators/advance-day',
      { days: 1 },
    );
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: weatherGeneratorsKey('w1'),
    });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ['weather-history', 'w1'],
    });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ['worlds', 'w1', 'settings'],
    });
  });

  it('POST /advance-day s days=7', async () => {
    vi.mocked(api.post).mockResolvedValue({
      newInGameDate: '2026-06-02T00:00:00.000Z',
      monthIndex: 5,
      monthName: 'Červen',
      day: 2,
      year: 2026,
      updatedGenerators: [],
    });
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useAdvanceDay('w1'), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync(7);
    });

    expect(api.post).toHaveBeenCalledWith(
      '/worlds/w1/weather-generators/advance-day',
      { days: 7 },
    );
  });
});

describe('useWeatherHistory (9.4 dluh #2)', () => {
  it('GET /history s default limit/offset', async () => {
    vi.mocked(api.get).mockResolvedValue({
      items: [],
      total: 0,
    });
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(
      () => useWeatherHistory('w1', 'g1'),
      { wrapper: Wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith(
      '/worlds/w1/weather-generators/g1/history',
      { limit: 50, offset: 0 },
    );
  });

  it('GET /history s custom limit + offset', async () => {
    vi.mocked(api.get).mockResolvedValue({ items: [], total: 0 });
    const { Wrapper } = makeWrapper();
    renderHook(
      () => useWeatherHistory('w1', 'g1', { limit: 100, offset: 50 }),
      { wrapper: Wrapper },
    );

    await waitFor(() =>
      expect(api.get).toHaveBeenCalledWith(
        '/worlds/w1/weather-generators/g1/history',
        { limit: 100, offset: 50 },
      ),
    );
  });

  it('disabled query (enabled=false) nespustí fetch', async () => {
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(
      () => useWeatherHistory('w1', 'g1', { enabled: false }),
      { wrapper: Wrapper },
    );

    await waitFor(() => expect(result.current.fetchStatus).toBe('idle'));
    expect(api.get).not.toHaveBeenCalled();
  });

  it('vrátí items + total ze serveru', async () => {
    vi.mocked(api.get).mockResolvedValue({
      items: [
        {
          id: 'h1',
          worldId: 'w1',
          generatorId: 'g1',
          trigger: 'generate',
          inGameDate: null,
          recordedAt: '2026-05-26T10:00:00.000Z',
          weather: { temperature: 22 },
        },
      ],
      total: 1,
    });
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useWeatherHistory('w1', 'g1'), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.items).toHaveLength(1);
    expect(result.current.data?.total).toBe(1);
  });
});

describe('useWeatherWsSubscribe', () => {
  it('patchne currentWeather při weather:updated eventu', async () => {
    const { Wrapper, qc } = makeWrapper();
    const initial = [
      makeGenerator('g1'),
      makeGenerator('g2', {
        currentWeather: {
          generatedAt: '2026-01-01T00:00:00.000Z',
          isManual: false,
          temperature: 10,
          tempUnit: 'C',
          weatherType: 'clear',
          weatherIcon: '☀️',
          cloudiness: { value: '0/8', description: 'jasno' },
          precipitation: { value: '0 mm', description: 'beze srážek' },
          wind: { speed: 5, gusts: 8, unit: 'kmh' },
          pressure: { value: 1015, trend: 'stoupá' },
          humidity: 50,
          extras: [],
        },
      }),
    ];
    qc.setQueryData(weatherGeneratorsKey('w1'), initial);

    renderHook(() => useWeatherWsSubscribe('w1'), { wrapper: Wrapper });

    const updatedWeather: WeatherResult = {
      generatedAt: '2026-06-01T12:00:00.000Z',
      isManual: false,
      temperature: 28,
      tempUnit: 'C',
      weatherType: 'storm',
      weatherIcon: '⛈',
      cloudiness: { value: '8/8', description: 'zataženo' },
      precipitation: { value: '15.0 mm', description: 'silné srážky' },
      wind: { speed: 25, gusts: 40, unit: 'kmh' },
      pressure: { value: 1002, trend: 'klesá' },
      humidity: 85,
      extras: [],
    };

    act(() => {
      emitSocket('weather:updated', {
        worldId: 'w1',
        generatorId: 'g1',
        weather: updatedWeather,
      });
    });

    const cached = qc.getQueryData<WeatherGenerator[]>(
      weatherGeneratorsKey('w1'),
    );
    expect(cached?.[0].currentWeather?.temperature).toBe(28);
    // g2 nezměněn
    expect(cached?.[1].currentWeather?.temperature).toBe(10);
  });

  it('ignoruje event pro jiný worldId', async () => {
    const { Wrapper, qc } = makeWrapper();
    const initial = [makeGenerator('g1')];
    qc.setQueryData(weatherGeneratorsKey('w1'), initial);

    renderHook(() => useWeatherWsSubscribe('w1'), { wrapper: Wrapper });

    act(() => {
      emitSocket('weather:updated', {
        worldId: 'OTHER_WORLD',
        generatorId: 'g1',
        weather: {
          generatedAt: '2026-06-01T12:00:00.000Z',
          isManual: false,
          temperature: 99,
          tempUnit: 'C',
          weatherType: 'storm',
          weatherIcon: '⛈',
          cloudiness: { value: '0/8', description: 'jasno' },
          precipitation: { value: '0 mm', description: 'beze srážek' },
          wind: { speed: 0, gusts: 0, unit: 'kmh' },
          pressure: { value: 1015, trend: 'stoupá' },
          humidity: 50,
          extras: [],
        },
      });
    });

    const cached = qc.getQueryData<WeatherGenerator[]>(
      weatherGeneratorsKey('w1'),
    );
    expect(cached?.[0].currentWeather).toBeUndefined();
  });
});
