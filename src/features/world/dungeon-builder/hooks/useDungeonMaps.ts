/**
 * 21.3a — TanStack Query hooks pro podzemí světa.
 * Klíč `['dungeon-maps', worldId]`; detail `['dungeon-maps', 'detail', id]`.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { dungeonMapsApi } from '../api/dungeonMapsApi';
import type { DungeonMapInput } from '../types';

export function useDungeonMaps(worldId: string | null) {
  return useQuery({
    queryKey: ['dungeon-maps', worldId],
    queryFn: () => dungeonMapsApi.list(worldId as string),
    enabled: !!worldId,
  });
}

export function useDungeonMap(id: string | null) {
  return useQuery({
    queryKey: ['dungeon-maps', 'detail', id],
    queryFn: () => dungeonMapsApi.get(id as string),
    enabled: !!id,
  });
}

export function useDungeonMapMutations(worldId: string | null) {
  const qc = useQueryClient();
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['dungeon-maps', worldId] });
  };

  const createDungeon = useMutation({
    mutationFn: (dto: DungeonMapInput) => dungeonMapsApi.create(dto),
    onSuccess: invalidate,
  });

  const replaceDungeon = useMutation({
    mutationFn: (vars: { id: string; dto: Omit<DungeonMapInput, 'worldId'> }) =>
      dungeonMapsApi.replace(vars.id, vars.dto),
    onSuccess: (data) => {
      invalidate();
      qc.setQueryData(['dungeon-maps', 'detail', data.id], data);
    },
  });

  const removeDungeon = useMutation({
    mutationFn: (id: string) => dungeonMapsApi.remove(id),
    onSuccess: invalidate,
  });

  return { createDungeon, replaceDungeon, removeDungeon };
}
