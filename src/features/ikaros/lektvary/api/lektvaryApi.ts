/**
 * 21.5b — Komunitní katalog lektvarů: API klient (přes shared api).
 */
import { api } from '@/shared/api/client';
import type {
  GlobalPotion,
  PotionComment,
  CreateCommunityPotionPayload,
  UpdatePotionLorePayload,
  ProposePotionStatblockPayload,
  CreatePotionCommentPayload,
  PotionLibraryFilter,
} from '../types';

export function listCommunityPotions(
  filter: PotionLibraryFilter,
): Promise<GlobalPotion[]> {
  const params: Record<string, unknown> = {};
  if (filter.status) params.status = filter.status;
  if (filter.systemId) params.systemId = filter.systemId;
  if (filter.kind) params.kind = filter.kind;
  if (filter.tag) params.tag = filter.tag;
  return api.get<GlobalPotion[]>('/potions/community', params);
}

export function getCommunityPotion(id: string): Promise<GlobalPotion> {
  return api.get<GlobalPotion>(`/potions/community/${id}`);
}

export function createCommunityPotion(
  payload: CreateCommunityPotionPayload,
): Promise<GlobalPotion> {
  return api.post<GlobalPotion>('/potions/community', payload);
}

export function updatePotionLore(
  id: string,
  patch: UpdatePotionLorePayload,
): Promise<GlobalPotion> {
  return api.patch<GlobalPotion>(`/potions/community/${id}/lore`, patch);
}

export function proposePotionStatblock(
  id: string,
  payload: ProposePotionStatblockPayload,
): Promise<GlobalPotion> {
  return api.post<GlobalPotion>(`/potions/community/${id}/statblock`, payload);
}

export function approvePotionStatblock(
  id: string,
  systemId: string,
): Promise<GlobalPotion> {
  return api.post<GlobalPotion>(
    `/potions/community/${id}/statblock/${systemId}/approve`,
  );
}

export function approvePotion(id: string): Promise<GlobalPotion> {
  return api.post<GlobalPotion>(`/potions/community/${id}/approve`);
}

/** Smaže lektvar (autor svůj návrh; kurátor cokoli). */
export function deleteCommunityPotion(id: string): Promise<void> {
  return api.delete<void>(`/potions/community/${id}`);
}

export function listPotionComments(
  id: string,
  targetType: 'potion' | 'statblock',
  systemId?: string,
): Promise<PotionComment[]> {
  const params: Record<string, unknown> = { targetType };
  if (systemId) params.systemId = systemId;
  return api.get<PotionComment[]>(`/potions/community/${id}/comments`, params);
}

export function addPotionComment(
  id: string,
  payload: CreatePotionCommentPayload,
): Promise<PotionComment> {
  return api.post<PotionComment>(`/potions/community/${id}/comments`, payload);
}
