/**
 * 21.5a — Komunitní herbář API klient (přes shared api).
 * Routy: `plants/community` (list/detail/create/update/approve/delete).
 */
import { api } from '@/shared/api/client';
import type {
  GlobalPlant,
  CreatePlantPayload,
  UpdatePlantPayload,
  HerbarLibraryFilter,
} from '../types';

export function listCommunityPlants(
  filter: HerbarLibraryFilter,
): Promise<GlobalPlant[]> {
  const params: Record<string, unknown> = {};
  if (filter.status) params.status = filter.status;
  if (filter.rarity) params.rarity = filter.rarity;
  if (filter.tag) params.tag = filter.tag;
  return api.get<GlobalPlant[]>('/plants/community', params);
}

export function getCommunityPlant(id: string): Promise<GlobalPlant> {
  return api.get<GlobalPlant>(`/plants/community/${id}`);
}

export function createPlant(payload: CreatePlantPayload): Promise<GlobalPlant> {
  return api.post<GlobalPlant>('/plants/community', payload);
}

export function updatePlant(
  id: string,
  patch: UpdatePlantPayload,
): Promise<GlobalPlant> {
  return api.patch<GlobalPlant>(`/plants/community/${id}`, patch);
}

export function approvePlant(id: string): Promise<GlobalPlant> {
  return api.post<GlobalPlant>(`/plants/community/${id}/approve`);
}

export function deletePlant(id: string): Promise<void> {
  return api.delete<void>(`/plants/community/${id}`);
}
