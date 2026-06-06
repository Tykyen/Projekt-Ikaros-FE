import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import type { CreateMapInput, UpdateMapInput, WorldMapEntry } from '../types';

const key = (worldId: string) => ['world-maps', worldId];

export function useCreateWorldMap(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateMapInput) =>
      api.post<WorldMapEntry>(`/world-maps/${worldId}/maps`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: key(worldId) }),
  });
}

export function useUpdateWorldMap(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateMapInput }) =>
      api.patch<WorldMapEntry>(`/world-maps/${worldId}/maps/${id}`, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: key(worldId) }),
  });
}

export function useDeleteWorldMap(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<void>(`/world-maps/${worldId}/maps/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: key(worldId) }),
  });
}

export function useReorderWorldMaps(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderedIds: string[]) =>
      api.patch<WorldMapEntry[]>(`/world-maps/${worldId}/reorder`, {
        orderedIds,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: key(worldId) }),
  });
}
