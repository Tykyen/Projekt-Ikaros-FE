/**
 * 10.2d-prep-B — Bestiar API klient (axios přes shared api).
 */
import { api } from '@/shared/api/client';
import type {
  Bestie,
  BestiarResponse,
  CreateBestiePayload,
  UpdateBestiePayload,
  CloneBestiePayload,
} from '../types';

export function listBestie(
  systemId: string,
  worldId?: string,
): Promise<BestiarResponse> {
  const params: Record<string, unknown> = { systemId };
  if (worldId) params.worldId = worldId;
  return api.get<BestiarResponse>('/bestiae', params);
}

export function getBestie(id: string): Promise<Bestie> {
  return api.get<Bestie>(`/bestiae/${id}`);
}

export function createBestie(payload: CreateBestiePayload): Promise<Bestie> {
  return api.post<Bestie>('/bestiae', payload);
}

export function updateBestie(
  id: string,
  patch: UpdateBestiePayload,
): Promise<Bestie> {
  return api.patch<Bestie>(`/bestiae/${id}`, patch);
}

export function deleteBestie(id: string): Promise<void> {
  return api.delete<void>(`/bestiae/${id}`);
}

export function restoreBestie(id: string): Promise<Bestie> {
  return api.post<Bestie>(`/bestiae/${id}/restore`);
}

export function cloneBestie(
  id: string,
  payload: CloneBestiePayload,
): Promise<Bestie> {
  return api.post<Bestie>(`/bestiae/${id}/clone`, payload);
}
