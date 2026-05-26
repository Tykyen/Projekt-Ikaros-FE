/**
 * 9.4-dluh — Custom weather preset hooks tests.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import {
  useCustomPresets,
  useCreateCustomPreset,
  useUpdateCustomPreset,
  useDeleteCustomPreset,
  useUseCustomPreset,
  customPresetsKey,
} from './useCustomPresets';
import { api } from '@/shared/api/client';
import type {
  CustomWeatherPreset,
  WeatherGeneratorConfig,
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

function makePreset(
  id: string,
  overrides: Partial<CustomWeatherPreset> = {},
): CustomWeatherPreset {
  return {
    id,
    worldId: 'w1',
    name: `Preset ${id}`,
    description: undefined,
    emoji: undefined,
    config: DEFAULT_CONFIG,
    createdBy: 'u1',
    usageCount: 0,
    createdAt: '2026-05-26T00:00:00Z',
    updatedAt: '2026-05-26T00:00:00Z',
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useCustomPresets', () => {
  it('GET /worlds/:worldId/custom-presets — vrátí list', async () => {
    vi.mocked(api.get).mockResolvedValue([makePreset('p1'), makePreset('p2')]);
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useCustomPresets('w1'), {
      wrapper: Wrapper,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
    expect(api.get).toHaveBeenCalledWith('/worlds/w1/custom-presets');
  });

  it('useCreateCustomPreset — POST + invalidate', async () => {
    vi.mocked(api.post).mockResolvedValue(
      makePreset('new', { name: 'Můj preset' }),
    );
    const { Wrapper, qc } = makeWrapper();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useCreateCustomPreset('w1'), {
      wrapper: Wrapper,
    });
    await act(async () => {
      await result.current.mutateAsync({
        name: 'Můj preset',
        config: DEFAULT_CONFIG,
      });
    });
    expect(api.post).toHaveBeenCalledWith(
      '/worlds/w1/custom-presets',
      expect.objectContaining({ name: 'Můj preset' }),
    );
    expect(spy).toHaveBeenCalledWith({ queryKey: customPresetsKey('w1') });
  });

  it('useUpdateCustomPreset — PUT jen metadata, ne config', async () => {
    vi.mocked(api.put).mockResolvedValue(
      makePreset('p1', { name: 'Renamed' }),
    );
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useUpdateCustomPreset('w1'), {
      wrapper: Wrapper,
    });
    await act(async () => {
      await result.current.mutateAsync({
        id: 'p1',
        name: 'Renamed',
        description: 'nový popis',
      });
    });
    const [url, body] = vi.mocked(api.put).mock.calls[0];
    expect(url).toBe('/worlds/w1/custom-presets/p1');
    expect(body).toEqual({ name: 'Renamed', description: 'nový popis' });
    // Sanity check — body NESMÍ obsahovat config (immutability invariant).
    expect(body as Record<string, unknown>).not.toHaveProperty('config');
  });

  it('useDeleteCustomPreset — DELETE + invalidate', async () => {
    vi.mocked(api.delete).mockResolvedValue(undefined);
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useDeleteCustomPreset('w1'), {
      wrapper: Wrapper,
    });
    await act(async () => {
      await result.current.mutateAsync('p1');
    });
    expect(api.delete).toHaveBeenCalledWith('/worlds/w1/custom-presets/p1');
  });

  it('useUseCustomPreset — POST /use s incrementem usageCount', async () => {
    vi.mocked(api.post).mockResolvedValue(
      makePreset('p1', { usageCount: 4 }),
    );
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useUseCustomPreset('w1'), {
      wrapper: Wrapper,
    });
    await act(async () => {
      const updated = await result.current.mutateAsync('p1');
      expect(updated.usageCount).toBe(4);
    });
    expect(api.post).toHaveBeenCalledWith('/worlds/w1/custom-presets/p1/use');
  });
});
