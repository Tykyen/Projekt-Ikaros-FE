/**
 * 9.4 — Weather Generator Sets (per-world saved kolekce) — React Query hooks.
 *
 * BE endpointy: `/worlds/:worldId/weather-sets` (CRUD + /apply).
 *
 * Apply mutace volá BE s `resolvedItems` (rozresolvované přes
 * `resolveSetItems(set.items, customPresets)`) — BE batch-vytvoří N generátorů
 * a inkrementuje appliedCount. Onsuccess invaliduje weather-sets +
 * weather-generators klíče.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import type {
  ResolvedSetItem,
  WeatherGenerator,
  WeatherGeneratorSet,
  WeatherGeneratorSetItem,
} from '@/shared/types';
import { weatherGeneratorsKey } from './useWeatherGenerators';

export const generatorSetsKey = (worldId: string) =>
  ['weather-sets', worldId] as const;

export function useGeneratorSets(worldId: string) {
  return useQuery({
    queryKey: generatorSetsKey(worldId),
    queryFn: () =>
      api.get<WeatherGeneratorSet[]>(`/worlds/${worldId}/weather-sets`),
    enabled: !!worldId,
    staleTime: 60_000,
  });
}

export function useGeneratorSet(worldId: string, id: string) {
  return useQuery({
    queryKey: [...generatorSetsKey(worldId), id] as const,
    queryFn: () =>
      api.get<WeatherGeneratorSet>(`/worlds/${worldId}/weather-sets/${id}`),
    enabled: !!worldId && !!id,
    staleTime: 60_000,
  });
}

export interface CreateGeneratorSetInput {
  name: string;
  description?: string;
  emoji?: string;
  items: WeatherGeneratorSetItem[];
}

export function useCreateGeneratorSet(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateGeneratorSetInput) =>
      api.post<WeatherGeneratorSet>(
        `/worlds/${worldId}/weather-sets`,
        input,
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: generatorSetsKey(worldId) }),
  });
}

export interface UpdateGeneratorSetInput {
  id: string;
  name?: string;
  description?: string;
  emoji?: string;
  items?: WeatherGeneratorSetItem[];
}

export function useUpdateGeneratorSet(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...patch }: UpdateGeneratorSetInput) =>
      api.put<WeatherGeneratorSet>(
        `/worlds/${worldId}/weather-sets/${id}`,
        patch,
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: generatorSetsKey(worldId) }),
  });
}

export function useDeleteGeneratorSet(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<void>(`/worlds/${worldId}/weather-sets/${id}`),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: generatorSetsKey(worldId) }),
  });
}

export interface ApplyGeneratorSetInput {
  id: string;
  resolvedItems: ResolvedSetItem[];
}

/**
 * Apply set → batch create N generátorů. BE inkrementuje appliedCount.
 * Onsuccess invaliduje weather-sets (kvůli appliedCount) i weather-generators
 * (nové entity v gridu).
 */
export function useApplyGeneratorSet(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, resolvedItems }: ApplyGeneratorSetInput) =>
      api.post<WeatherGenerator[]>(
        `/worlds/${worldId}/weather-sets/${id}/apply`,
        { resolvedItems },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: generatorSetsKey(worldId) });
      qc.invalidateQueries({ queryKey: weatherGeneratorsKey(worldId) });
    },
  });
}
