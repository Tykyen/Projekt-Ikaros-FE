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

  // 21.3c — moje osobní knihovna (cross-world).
  listLibrary: () => api.get<DungeonMap[]>('/dungeon-maps/library'),

  get: (id: string) => api.get<DungeonMap>(`/dungeon-maps/${id}`),

  create: (dto: DungeonMapInput) =>
    api.post<DungeonMap>('/dungeon-maps', dto),

  replace: (id: string, dto: Omit<DungeonMapInput, 'worldId'>) =>
    api.put<DungeonMap>(`/dungeon-maps/${id}`, dto),

  remove: (id: string) => api.delete<void>(`/dungeon-maps/${id}`),

  // 21.3c — kopie: bez targetWorldId do knihovny, s ním do světa.
  copy: (id: string, targetWorldId?: string) =>
    api.post<DungeonMap>(`/dungeon-maps/${id}/copy`, { targetWorldId }),

  // 21.3b — nová scéna taktické mapy z dungeonu (PJ+; imageUrl z uploadu).
  exportScene: (id: string, imageUrl: string) =>
    api.post<{ sceneId: string }>(`/dungeon-maps/${id}/export-scene`, {
      imageUrl,
    }),
};
