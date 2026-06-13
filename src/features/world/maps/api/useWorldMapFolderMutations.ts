import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import type {
  CreateFolderInput,
  UpdateFolderInput,
  WorldMapFolder,
} from '../types';

const foldersKey = (worldId: string) => ['world-map-folders', worldId];
const mapsKey = (worldId: string) => ['world-maps', worldId];

/** Po mutaci složky invaliduj složky i mapy (mazání složky přesouvá mapy). */
function useFolderInvalidate(worldId: string) {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: foldersKey(worldId) });
    void qc.invalidateQueries({ queryKey: mapsKey(worldId) });
  };
}

export function useCreateWorldMapFolder(worldId: string) {
  const invalidate = useFolderInvalidate(worldId);
  return useMutation({
    mutationFn: (input: CreateFolderInput) =>
      api.post<WorldMapFolder>(`/world-maps/${worldId}/folders`, input),
    onSuccess: invalidate,
  });
}

export function useUpdateWorldMapFolder(worldId: string) {
  const invalidate = useFolderInvalidate(worldId);
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateFolderInput }) =>
      api.patch<WorldMapFolder>(`/world-maps/${worldId}/folders/${id}`, patch),
    onSuccess: invalidate,
  });
}

export function useDeleteWorldMapFolder(worldId: string) {
  const invalidate = useFolderInvalidate(worldId);
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<void>(`/world-maps/${worldId}/folders/${id}`),
    onSuccess: invalidate,
  });
}
