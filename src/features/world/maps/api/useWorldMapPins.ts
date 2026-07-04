import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import type { CreatePinInput, UpdatePinInput, WorldMapEntry } from '../types';

const key = (worldId: string) => ['world-maps', worldId];

/**
 * 16.5 — granulární CRUD vlaječek. Každá mutace vrací aktualizovanou mapu (PJ
 * pohled). Invaliduje atlas → viewer/list se překreslí. Přesun pinu (tažení)
 * volá `useUpdatePin` debounced z komponenty.
 */
export function useCreatePin(worldId: string, mapId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePinInput) =>
      api.post<WorldMapEntry>(
        `/world-maps/${worldId}/maps/${mapId}/pins`,
        input,
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: key(worldId) }),
  });
}

export function useUpdatePin(worldId: string, mapId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ pinId, patch }: { pinId: string; patch: UpdatePinInput }) =>
      api.patch<WorldMapEntry>(
        `/world-maps/${worldId}/maps/${mapId}/pins/${pinId}`,
        patch,
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: key(worldId) }),
  });
}

export function useDeletePin(worldId: string, mapId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (pinId: string) =>
      api.delete<WorldMapEntry>(
        `/world-maps/${worldId}/maps/${mapId}/pins/${pinId}`,
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: key(worldId) }),
  });
}
