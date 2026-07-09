/**
 * 16.2b-2 — Komunitní bestiář API klient (přes shared api).
 */
import { api } from '@/shared/api/client';
import type { Bestie } from '@/features/world/bestiar/types';
import type {
  GlobalBestie,
  BestieComment,
  CreateCommunityBestiePayload,
  UpdateLorePayload,
  ProposeStatblockPayload,
  CloneCommunityPayload,
  CreateBestieCommentPayload,
  CommunityLibraryFilter,
} from '../types';

export function listCommunityBestie(
  filter: CommunityLibraryFilter,
): Promise<GlobalBestie[]> {
  const params: Record<string, unknown> = {};
  if (filter.status) params.status = filter.status;
  if (filter.kind) params.kind = filter.kind;
  if (filter.systemId) params.systemId = filter.systemId;
  return api.get<GlobalBestie[]>('/bestiae/community', params);
}

export function getCommunityBestie(id: string): Promise<GlobalBestie> {
  return api.get<GlobalBestie>(`/bestiae/community/${id}`);
}

export function createCommunityBestie(
  payload: CreateCommunityBestiePayload,
): Promise<GlobalBestie> {
  return api.post<GlobalBestie>('/bestiae/community', payload);
}

export function updateCommunityLore(
  id: string,
  patch: UpdateLorePayload,
): Promise<GlobalBestie> {
  return api.patch<GlobalBestie>(`/bestiae/community/${id}/lore`, patch);
}

export function proposeStatblock(
  id: string,
  payload: ProposeStatblockPayload,
): Promise<GlobalBestie> {
  return api.post<GlobalBestie>(`/bestiae/community/${id}/statblock`, payload);
}

export function approveStatblock(
  id: string,
  systemId: string,
): Promise<GlobalBestie> {
  return api.post<GlobalBestie>(
    `/bestiae/community/${id}/statblock/${systemId}/approve`,
  );
}

export function approveBeast(id: string): Promise<GlobalBestie> {
  return api.post<GlobalBestie>(`/bestiae/community/${id}/approve`);
}

/** „Vlož do mého bestiáře" — vrací nově vzniklou single-system bestii. */
export function cloneCommunityBestie(
  id: string,
  payload: CloneCommunityPayload,
): Promise<Bestie> {
  return api.post<Bestie>(`/bestiae/community/${id}/clone`, payload);
}

export function listBestieComments(
  id: string,
  targetType: 'beast' | 'statblock',
  systemId?: string,
): Promise<BestieComment[]> {
  const params: Record<string, unknown> = { targetType };
  if (systemId) params.systemId = systemId;
  return api.get<BestieComment[]>(`/bestiae/community/${id}/comments`, params);
}

export function addBestieComment(
  id: string,
  payload: CreateBestieCommentPayload,
): Promise<BestieComment> {
  return api.post<BestieComment>(`/bestiae/community/${id}/comments`, payload);
}
