/**
 * 9.4-dluh — Custom weather preset (per-world scoped) — React Query hooks.
 *
 * BE endpointy: `/worlds/:worldId/custom-presets` (CRUD + /use increment).
 * Config je immutable — update PUT přijímá jen name/description/emoji.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import type {
  CustomWeatherPreset,
  WeatherGeneratorConfig,
} from '@/shared/types';

export const customPresetsKey = (worldId: string) =>
  ['custom-weather-presets', worldId] as const;

export function useCustomPresets(worldId: string) {
  return useQuery({
    queryKey: customPresetsKey(worldId),
    queryFn: () =>
      api.get<CustomWeatherPreset[]>(
        `/worlds/${worldId}/custom-presets`,
      ),
    enabled: !!worldId,
    staleTime: 60_000,
  });
}

export interface CreateCustomPresetInput {
  name: string;
  description?: string;
  emoji?: string;
  config: WeatherGeneratorConfig;
}

export function useCreateCustomPreset(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCustomPresetInput) =>
      api.post<CustomWeatherPreset>(
        `/worlds/${worldId}/custom-presets`,
        input,
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: customPresetsKey(worldId) }),
  });
}

export interface UpdateCustomPresetInput {
  id: string;
  name?: string;
  description?: string;
  emoji?: string;
}

export function useUpdateCustomPreset(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...patch }: UpdateCustomPresetInput) =>
      api.put<CustomWeatherPreset>(
        `/worlds/${worldId}/custom-presets/${id}`,
        patch,
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: customPresetsKey(worldId) }),
  });
}

export function useDeleteCustomPreset(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<void>(`/worlds/${worldId}/custom-presets/${id}`),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: customPresetsKey(worldId) }),
  });
}

/**
 * Increment usageCount — FE volá při klik „Použít" v wizardu.
 * Vrací updated entity (s novým usageCount).
 */
export function useUseCustomPreset(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post<CustomWeatherPreset>(
        `/worlds/${worldId}/custom-presets/${id}/use`,
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: customPresetsKey(worldId) }),
  });
}
