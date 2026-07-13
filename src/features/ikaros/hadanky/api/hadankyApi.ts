/**
 * 21.5d — Komunitní katalog hádanek: API klient (přes shared api).
 */
import { api } from '@/shared/api/client';
import type {
  GlobalRiddle,
  RiddleComment,
  CreateRiddlePayload,
  UpdateRiddlePayload,
  CreateRiddleCommentPayload,
  RiddleLibraryFilter,
} from '../types';

export function listCommunityRiddles(
  filter: RiddleLibraryFilter,
): Promise<GlobalRiddle[]> {
  const params: Record<string, unknown> = {};
  if (filter.status) params.status = filter.status;
  if (filter.difficulty) params.difficulty = filter.difficulty;
  if (filter.tag) params.tag = filter.tag;
  return api.get<GlobalRiddle[]>('/riddles/community', params);
}

export function getCommunityRiddle(id: string): Promise<GlobalRiddle> {
  return api.get<GlobalRiddle>(`/riddles/community/${id}`);
}

export function createCommunityRiddle(
  payload: CreateRiddlePayload,
): Promise<GlobalRiddle> {
  return api.post<GlobalRiddle>('/riddles/community', payload);
}

/** Úprava všech polí (autor/kurátor) — hádanka nemá lore/statblock split. */
export function updateCommunityRiddle(
  id: string,
  patch: UpdateRiddlePayload,
): Promise<GlobalRiddle> {
  return api.patch<GlobalRiddle>(`/riddles/community/${id}`, patch);
}

export function approveRiddle(id: string): Promise<GlobalRiddle> {
  return api.post<GlobalRiddle>(`/riddles/community/${id}/approve`);
}

/** Smaže hádanku (autor svůj návrh; kurátor cokoli). */
export function deleteCommunityRiddle(id: string): Promise<void> {
  return api.delete<void>(`/riddles/community/${id}`);
}

export function listRiddleComments(id: string): Promise<RiddleComment[]> {
  return api.get<RiddleComment[]>(`/riddles/community/${id}/comments`);
}

export function addRiddleComment(
  id: string,
  payload: CreateRiddleCommentPayload,
): Promise<RiddleComment> {
  return api.post<RiddleComment>(`/riddles/community/${id}/comments`, payload);
}
