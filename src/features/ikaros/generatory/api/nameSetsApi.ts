/**
 * 21.2a — Jmenné sady API klient. Routy: `name-sets/community` — list vrací
 * SOUHRN s počty (bez jmenných polí), plné seznamy dává detail.
 */
import { api } from '@/shared/api/client';
import type {
  GlobalNameSet,
  NameSetSummary,
  CreateNameSetPayload,
  UpdateNameSetPayload,
  NameSetsFilter,
} from '../types';

export function listNameSets(
  filter: NameSetsFilter,
): Promise<NameSetSummary[]> {
  const params: Record<string, unknown> = {};
  if (filter.status) params.status = filter.status;
  if (filter.category) params.category = filter.category;
  if (filter.tag) params.tag = filter.tag;
  return api.get<NameSetSummary[]>('/name-sets/community', params);
}

export function getNameSet(id: string): Promise<GlobalNameSet> {
  return api.get<GlobalNameSet>(`/name-sets/community/${id}`);
}

export function createNameSet(
  payload: CreateNameSetPayload,
): Promise<GlobalNameSet> {
  return api.post<GlobalNameSet>('/name-sets/community', payload);
}

export function updateNameSet(
  id: string,
  patch: UpdateNameSetPayload,
): Promise<GlobalNameSet> {
  return api.patch<GlobalNameSet>(`/name-sets/community/${id}`, patch);
}

export function approveNameSet(id: string): Promise<GlobalNameSet> {
  return api.post<GlobalNameSet>(`/name-sets/community/${id}/approve`);
}

export function deleteNameSet(id: string): Promise<void> {
  return api.delete<void>(`/name-sets/community/${id}`);
}
