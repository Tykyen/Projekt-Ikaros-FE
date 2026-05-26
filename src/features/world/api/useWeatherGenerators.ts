/**
 * 9.4-I — Počasí (World Weather) — React Query hooks.
 *
 * Konzumuje BE `world-weather` modul (CRUD + generate + setCurrent + broadcast
 * + reorder). Všechny mutace invalidují `['weather-generators', worldId]`.
 *
 * `useReorderGenerators` má optimistic update — drag-to-reorder okamžitě
 * překreslí grid, při BE chybě se rollback (cache snapshot v `onMutate`).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import type {
  AdvanceDayResult,
  BroadcastWeatherInput,
  SetInGameDateInput,
  SetInGameDateResult,
  WeatherGenerator,
  WeatherGeneratorConfig,
  WeatherHistoryEntry,
  WeatherResult,
} from '@/shared/types';

/** Stabilní query key pro list generátorů světa. */
export const weatherGeneratorsKey = (worldId: string) =>
  ['weather-generators', worldId] as const;

export function useWeatherGenerators(worldId: string) {
  return useQuery({
    queryKey: weatherGeneratorsKey(worldId),
    queryFn: () =>
      api.get<WeatherGenerator[]>(`/worlds/${worldId}/weather-generators`),
    enabled: !!worldId,
    staleTime: 30_000,
  });
}

export function useWeatherGenerator(worldId: string, id: string) {
  return useQuery({
    queryKey: [...weatherGeneratorsKey(worldId), id] as const,
    queryFn: () =>
      api.get<WeatherGenerator>(`/worlds/${worldId}/weather-generators/${id}`),
    enabled: !!worldId && !!id,
  });
}

export interface CreateWeatherGeneratorInput {
  name: string;
  description?: string;
  config: WeatherGeneratorConfig;
}

export function useCreateWeatherGenerator(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateWeatherGeneratorInput) =>
      api.post<WeatherGenerator>(
        `/worlds/${worldId}/weather-generators`,
        input,
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: weatherGeneratorsKey(worldId) }),
  });
}

export interface UpdateWeatherGeneratorInput {
  id: string;
  name?: string;
  description?: string;
  config?: WeatherGeneratorConfig;
}

export function useUpdateWeatherGenerator(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...patch }: UpdateWeatherGeneratorInput) =>
      api.put<WeatherGenerator>(
        `/worlds/${worldId}/weather-generators/${id}`,
        patch,
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: weatherGeneratorsKey(worldId) }),
  });
}

export function useDeleteWeatherGenerator(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<void>(`/worlds/${worldId}/weather-generators/${id}`),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: weatherGeneratorsKey(worldId) }),
  });
}

export interface GenerateWeatherInput {
  id: string;
  /** Volitelný in-game měsíc (PJ explicit). Pokud chybí, BE odvodí z `worldSettings.currentInGameDate`. */
  monthIndex?: number;
  day?: number;
  seed?: number;
}

export function useGenerateWeather(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, monthIndex, day, seed }: GenerateWeatherInput) => {
      const params = new URLSearchParams();
      if (monthIndex !== undefined)
        params.append('monthIndex', String(monthIndex));
      if (day !== undefined) params.append('day', String(day));
      if (seed !== undefined) params.append('seed', String(seed));
      const qs = params.toString();
      const url = `/worlds/${worldId}/weather-generators/${id}/generate${qs ? `?${qs}` : ''}`;
      return api.post<WeatherGenerator>(url);
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: weatherGeneratorsKey(worldId) }),
  });
}

export interface SetCurrentWeatherInput {
  id: string;
  weather: Partial<WeatherResult>;
}

export function useSetCurrentWeather(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, weather }: SetCurrentWeatherInput) =>
      api.put<WeatherGenerator>(
        `/worlds/${worldId}/weather-generators/${id}/current`,
        weather,
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: weatherGeneratorsKey(worldId) }),
  });
}

export interface BroadcastWeatherMutationInput extends BroadcastWeatherInput {
  id: string;
}

export function useBroadcastWeather(worldId: string) {
  return useMutation({
    mutationFn: ({ id, ...payload }: BroadcastWeatherMutationInput) =>
      api.post<void>(
        `/worlds/${worldId}/weather-generators/${id}/broadcast`,
        payload,
      ),
  });
}

/**
 * 9.4 — Set in-game date mutation. PJ explicit vyplní rok/měsíc/den →
 * `PUT /weather-generators/set-in-game-date`. Pokud `regenerateAll: true`,
 * BE vygeneruje weather pro všechny generátory s novým datem.
 */
export function useSetInGameDate(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SetInGameDateInput) =>
      api.put<SetInGameDateResult>(
        `/worlds/${worldId}/weather-generators/set-in-game-date`,
        input,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: weatherGeneratorsKey(worldId) });
      qc.invalidateQueries({ queryKey: ['worlds', worldId, 'settings'] });
    },
  });
}

/**
 * 9.4 dluh #1 — Advance-day mutation. PJ klikne „Posunout o den" → BE posune
 * `worldSettings.currentInGameDate` o N dní + vygeneruje počasí pro všechny
 * generátory s odpovídajícím monthIndex/day.
 *
 * Po úspěchu invaliduje weather-generators list (BE vrátil updated array).
 */
export function useAdvanceDay(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (days: number = 1) =>
      api.post<AdvanceDayResult>(
        `/worlds/${worldId}/weather-generators/advance-day`,
        { days },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: weatherGeneratorsKey(worldId) });
      // Také invaliduj all history queries světa
      qc.invalidateQueries({ queryKey: ['weather-history', worldId] });
      // World settings (currentInGameDate) by mělo refreshnout pro header display
      qc.invalidateQueries({ queryKey: ['worlds', worldId, 'settings'] });
    },
  });
}

/** 9.4 dluh #2 — Stabilní query key pro historii. */
export const weatherHistoryKey = (
  worldId: string,
  generatorId: string,
  options: { limit?: number; offset?: number } = {},
) =>
  [
    'weather-history',
    worldId,
    generatorId,
    options.limit ?? 50,
    options.offset ?? 0,
  ] as const;

export interface WeatherHistoryResponse {
  items: WeatherHistoryEntry[];
  total: number;
}

/**
 * 9.4 dluh #2 — Historie snapshotů počasí (paginated, sort desc).
 *
 * Member read access (BE assertMember). FE volá s `enabled: !!worldId && !!generatorId`
 * pro modal lazy load.
 */
export function useWeatherHistory(
  worldId: string,
  generatorId: string,
  options: { limit?: number; offset?: number; enabled?: boolean } = {},
) {
  const { limit = 50, offset = 0, enabled } = options;
  return useQuery({
    queryKey: weatherHistoryKey(worldId, generatorId, { limit, offset }),
    queryFn: () =>
      api.get<WeatherHistoryResponse>(
        `/worlds/${worldId}/weather-generators/${generatorId}/history`,
        { limit, offset },
      ),
    enabled: enabled !== false && !!worldId && !!generatorId,
    staleTime: 30_000,
  });
}

/**
 * 9.4-I — drag-to-reorder. Optimistic cache update + rollback při chybě.
 * BE endpoint: `PUT /worlds/:worldId/weather-generators/reorder` body `{ orderedIds }`.
 */
export function useReorderGenerators(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderedIds: string[]) =>
      api.put<WeatherGenerator[]>(
        `/worlds/${worldId}/weather-generators/reorder`,
        { orderedIds },
      ),
    onMutate: async (orderedIds) => {
      await qc.cancelQueries({ queryKey: weatherGeneratorsKey(worldId) });
      const previous = qc.getQueryData<WeatherGenerator[]>(
        weatherGeneratorsKey(worldId),
      );
      if (previous) {
        const byId = new Map(previous.map((g) => [g.id, g]));
        const reordered: WeatherGenerator[] = [];
        orderedIds.forEach((id, idx) => {
          const g = byId.get(id);
          if (g) reordered.push({ ...g, displayOrder: idx });
        });
        // Případné neznámé id (race) — drop tiše, BE odpoví canonical listem.
        qc.setQueryData(weatherGeneratorsKey(worldId), reordered);
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        qc.setQueryData(weatherGeneratorsKey(worldId), context.previous);
      }
    },
    onSuccess: (data) => {
      // BE vrátí canonical seřazený list — přepiš cache (efficient než invalidate)
      qc.setQueryData(weatherGeneratorsKey(worldId), data);
    },
  });
}
