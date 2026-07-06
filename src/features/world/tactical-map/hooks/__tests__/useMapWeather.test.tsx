import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMapWeather } from '../useMapWeather';

const mockSocket = { emit: vi.fn(), on: vi.fn(), off: vi.fn() };
vi.mock('@/features/chat/api/socket', () => ({ getSocket: () => mockSocket }));

const broadcastMutate = vi.fn();
const clearMutate = vi.fn();
vi.mock('@/features/world/api/useWeatherGenerators', () => ({
  useBroadcastWeather: () => ({ mutate: broadcastMutate, isPending: false }),
  useClearMapWeather: () => ({ mutate: clearMutate, isPending: false }),
}));

let mockWorld: { id: string; activeMapWeather?: unknown } | null = {
  id: 'w1',
  activeMapWeather: null,
};
vi.mock('@/features/world/context/WorldContext', () => ({
  useWorldContext: () => ({ worldId: 'w1', world: mockWorld }),
}));

const setQueriesData = vi.fn();
const invalidateQueries = vi.fn();
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ setQueriesData, invalidateQueries }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  mockWorld = { id: 'w1', activeMapWeather: null };
});

describe('useMapWeather (10.2i)', () => {
  it('fxEnabled default true, toggle persistuje do localStorage', () => {
    const { result } = renderHook(() => useMapWeather());
    expect(result.current.fxEnabled).toBe(true);

    act(() => result.current.toggleFx());
    expect(result.current.fxEnabled).toBe(false);
    expect(JSON.parse(localStorage.getItem('ikr-map-weather-fx')!)).toBe(false);
  });

  it('načte fxEnabled z localStorage při mountu', () => {
    localStorage.setItem('ikr-map-weather-fx', 'false');
    const { result } = renderHook(() => useMapWeather());
    expect(result.current.fxEnabled).toBe(false);
  });

  it('setWeather vyšle broadcast target:map s generatorId', () => {
    const { result } = renderHook(() => useMapWeather());
    act(() => result.current.setWeather('gen-9'));
    expect(broadcastMutate).toHaveBeenCalledWith({ id: 'gen-9', target: 'map' });
  });

  it('clearWeather volá clear mutaci', () => {
    const { result } = renderHook(() => useMapWeather());
    act(() => result.current.clearWeather());
    expect(clearMutate).toHaveBeenCalledTimes(1);
  });

  // FIX-1 — `world:{id}` room join/leave drží výhradně `useWorldSocket`
  // (WorldLayout, jediný vlastník); tenhle hook už `room:join`/`room:leave`
  // sám nedělá (jinak by odchod z mapy `room:leave`-oval i za WorldLayout a
  // vykopl dashboard z roomu).
  it('registruje weather:updated listener (room drží useWorldSocket)', () => {
    renderHook(() => useMapWeather());
    expect(mockSocket.emit).not.toHaveBeenCalledWith('room:join', expect.anything());
    expect(mockSocket.on).toHaveBeenCalledWith(
      'weather:updated',
      expect.any(Function),
    );
  });

  // FIX-5 — reconnect fallback: `weather:updated` zmeškaný během výpadku je
  // pryč (žádný replay) → po reconnectu refetch World query.
  it('reconnect (connect) → invaliduje ["worlds"]', () => {
    renderHook(() => useMapWeather());
    const onConnect = mockSocket.on.mock.calls.find((c) => c[0] === 'connect')?.[1] as
      | (() => void)
      | undefined;
    expect(onConnect).toBeDefined();
    invalidateQueries.mockClear();
    act(() => onConnect!());
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['worlds'] });
  });

  it('weather:updated patchne World cache; weather:null → activeMapWeather null', () => {
    renderHook(() => useMapWeather());
    const call = mockSocket.on.mock.calls.find((c) => c[0] === 'weather:updated');
    const handler = call![1] as (p: unknown) => void;

    // set
    act(() =>
      handler({
        worldId: 'w1',
        generatorId: 'g1',
        generatorName: 'Mordor',
        weather: { weatherType: 'rain' },
      }),
    );
    expect(setQueriesData).toHaveBeenCalled();
    const updater = setQueriesData.mock.calls.at(-1)![1] as (
      o: { id: string; activeMapWeather: unknown } | undefined,
    ) => unknown;
    const out = updater({ id: 'w1', activeMapWeather: null }) as {
      activeMapWeather: { generatorId: string };
    };
    expect(out.activeMapWeather.generatorId).toBe('g1');

    // clear
    act(() =>
      handler({
        worldId: 'w1',
        generatorId: null,
        generatorName: null,
        weather: null,
      }),
    );
    const clearUpdater = setQueriesData.mock.calls.at(-1)![1] as (
      o: { id: string; activeMapWeather: unknown } | undefined,
    ) => unknown;
    const cleared = clearUpdater({ id: 'w1', activeMapWeather: { x: 1 } }) as {
      activeMapWeather: unknown;
    };
    expect(cleared.activeMapWeather).toBeNull();
  });

  it('ignoruje weather:updated pro jiný worldId', () => {
    renderHook(() => useMapWeather());
    const call = mockSocket.on.mock.calls.find((c) => c[0] === 'weather:updated');
    const handler = call![1] as (p: unknown) => void;
    act(() =>
      handler({
        worldId: 'OTHER',
        generatorId: 'g1',
        generatorName: 'X',
        weather: { weatherType: 'snow' },
      }),
    );
    expect(setQueriesData).not.toHaveBeenCalled();
  });
});
