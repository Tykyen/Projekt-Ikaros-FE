/**
 * 21.5e — Komunitní katalog předmětů: API klient (přes shared api).
 */
import { api } from '@/shared/api/client';
import type {
  GlobalItem,
  ItemComment,
  CreateCommunityItemPayload,
  UpdateItemLorePayload,
  ProposeItemStatblockPayload,
  CreateItemCommentPayload,
  ItemLibraryFilter,
} from '../types';

export function listCommunityItems(
  filter: ItemLibraryFilter,
): Promise<GlobalItem[]> {
  const params: Record<string, unknown> = {};
  if (filter.status) params.status = filter.status;
  if (filter.systemId) params.systemId = filter.systemId;
  if (filter.kind) params.kind = filter.kind;
  if (filter.tag) params.tag = filter.tag;
  return api.get<GlobalItem[]>('/items/community', params);
}

export function getCommunityItem(id: string): Promise<GlobalItem> {
  return api.get<GlobalItem>(`/items/community/${id}`);
}

export function createCommunityItem(
  payload: CreateCommunityItemPayload,
): Promise<GlobalItem> {
  return api.post<GlobalItem>('/items/community', payload);
}

export function updateItemLore(
  id: string,
  patch: UpdateItemLorePayload,
): Promise<GlobalItem> {
  return api.patch<GlobalItem>(`/items/community/${id}/lore`, patch);
}

export function proposeItemStatblock(
  id: string,
  payload: ProposeItemStatblockPayload,
): Promise<GlobalItem> {
  return api.post<GlobalItem>(`/items/community/${id}/statblock`, payload);
}

export function approveItemStatblock(
  id: string,
  systemId: string,
): Promise<GlobalItem> {
  return api.post<GlobalItem>(
    `/items/community/${id}/statblock/${systemId}/approve`,
  );
}

export function approveItem(id: string): Promise<GlobalItem> {
  return api.post<GlobalItem>(`/items/community/${id}/approve`);
}

/** Smaže předmět (autor svůj návrh; kurátor cokoli). */
export function deleteCommunityItem(id: string): Promise<void> {
  return api.delete<void>(`/items/community/${id}`);
}

export function listItemComments(
  id: string,
  targetType: 'item' | 'statblock',
  systemId?: string,
): Promise<ItemComment[]> {
  const params: Record<string, unknown> = { targetType };
  if (systemId) params.systemId = systemId;
  return api.get<ItemComment[]>(`/items/community/${id}/comments`, params);
}

export function addItemComment(
  id: string,
  payload: CreateItemCommentPayload,
): Promise<ItemComment> {
  return api.post<ItemComment>(`/items/community/${id}/comments`, payload);
}
