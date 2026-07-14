/**
 * 21.3a+c — TanStack Query hooks pro podzemí světa a osobní knihovnu.
 * Klíče: `['dungeon-maps', worldId]` · `['dungeon-maps', 'library']` ·
 * detail `['dungeon-maps', 'detail', id]`. Mutace invalidují prefixem
 * `['dungeon-maps']` — kopie se dotýkají světa i knihovny najednou.
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

/** 21.3c — moje osobní knihovna (cross-world). */
export function useDungeonLibrary(enabled = true) {
  return useQuery({
    queryKey: ['dungeon-maps', 'library'],
    queryFn: () => dungeonMapsApi.listLibrary(),
    enabled,
  });
}

export function useDungeonMap(id: string | null) {
  return useQuery({
    queryKey: ['dungeon-maps', 'detail', id],
    queryFn: () => dungeonMapsApi.get(id as string),
    enabled: !!id,
  });
}

export function useDungeonMapMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['dungeon-maps'] });
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

  // 21.3c — kopie do knihovny / do světa.
  const copyDungeon = useMutation({
    mutationFn: (vars: { id: string; targetWorldId?: string }) =>
      dungeonMapsApi.copy(vars.id, vars.targetWorldId),
    onSuccess: invalidate,
  });

  // 21.3b — export na taktickou mapu (scéna vzniká na BE).
  const exportScene = useMutation({
    mutationFn: (vars: { id: string; imageUrl: string }) =>
      dungeonMapsApi.exportScene(vars.id, vars.imageUrl),
  });

  return {
    createDungeon,
    replaceDungeon,
    removeDungeon,
    copyDungeon,
    exportScene,
  };
}
