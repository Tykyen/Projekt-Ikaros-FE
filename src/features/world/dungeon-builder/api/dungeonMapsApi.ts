/**
 * 21.3a — API klient BE `dungeon-maps` controlleru.
 *
 * Gating (BE autorita): list/CRUD = člen Hrac+; create navíc Podporovatel ∨ PJ+
 * (`NOT_SUPPORTER`); edit/delete = owner ∨ PJ+ (`NOT_DUNGEON_OWNER`).
 * Pozn.: `api.*` helper vrací rovnou data; GET bere raw params objekt.
 */
import { api } from '@/shared/api/client';
import type { DungeonMap, DungeonMapInput } from '../types';

export const dungeonMapsApi = {
  list: (worldId: string) =>
    api.get<DungeonMap[]>('/dungeon-maps', { worldId }),

  get: (id: string) => api.get<DungeonMap>(`/dungeon-maps/${id}`),

  create: (dto: DungeonMapInput) =>
    api.post<DungeonMap>('/dungeon-maps', dto),

  replace: (id: string, dto: Omit<DungeonMapInput, 'worldId'>) =>
    api.put<DungeonMap>(`/dungeon-maps/${id}`, dto),

  remove: (id: string) => api.delete<void>(`/dungeon-maps/${id}`),
};
