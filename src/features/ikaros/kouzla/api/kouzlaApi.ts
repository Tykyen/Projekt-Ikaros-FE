/**
 * 21.5c — Komunitní katalog kouzel: API klient (přes shared api).
 */
import { api } from '@/shared/api/client';
import type {
  GlobalSpell,
  SpellComment,
  CreateCommunitySpellPayload,
  UpdateSpellLorePayload,
  ProposeSpellStatblockPayload,
  CreateSpellCommentPayload,
  SpellLibraryFilter,
} from '../types';

export function listCommunitySpells(
  filter: SpellLibraryFilter,
): Promise<GlobalSpell[]> {
  const params: Record<string, unknown> = {};
  if (filter.status) params.status = filter.status;
  if (filter.systemId) params.systemId = filter.systemId;
  if (filter.tag) params.tag = filter.tag;
  return api.get<GlobalSpell[]>('/spells/community', params);
}

export function getCommunitySpell(id: string): Promise<GlobalSpell> {
  return api.get<GlobalSpell>(`/spells/community/${id}`);
}

export function createCommunitySpell(
  payload: CreateCommunitySpellPayload,
): Promise<GlobalSpell> {
  return api.post<GlobalSpell>('/spells/community', payload);
}

export function updateSpellLore(
  id: string,
  patch: UpdateSpellLorePayload,
): Promise<GlobalSpell> {
  return api.patch<GlobalSpell>(`/spells/community/${id}/lore`, patch);
}

export function proposeSpellStatblock(
  id: string,
  payload: ProposeSpellStatblockPayload,
): Promise<GlobalSpell> {
  return api.post<GlobalSpell>(`/spells/community/${id}/statblock`, payload);
}

export function approveSpellStatblock(
  id: string,
  systemId: string,
): Promise<GlobalSpell> {
  return api.post<GlobalSpell>(
    `/spells/community/${id}/statblock/${systemId}/approve`,
  );
}

export function approveSpell(id: string): Promise<GlobalSpell> {
  return api.post<GlobalSpell>(`/spells/community/${id}/approve`);
}

/** Smaže kouzlo (autor svůj návrh; kurátor cokoli). */
export function deleteCommunitySpell(id: string): Promise<void> {
  return api.delete<void>(`/spells/community/${id}`);
}

export function listSpellComments(
  id: string,
  targetType: 'spell' | 'statblock',
  systemId?: string,
): Promise<SpellComment[]> {
  const params: Record<string, unknown> = { targetType };
  if (systemId) params.systemId = systemId;
  return api.get<SpellComment[]>(`/spells/community/${id}/comments`, params);
}

export function addSpellComment(
  id: string,
  payload: CreateSpellCommentPayload,
): Promise<SpellComment> {
  return api.post<SpellComment>(`/spells/community/${id}/comments`, payload);
}
