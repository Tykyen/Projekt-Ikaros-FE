/**
 * 21.5f — Komunitní ceníky API klient (přes shared api).
 * Routy: `price-lists/community` (list/detail/create/update/approve/delete
 * + komentáře).
 */
import { api } from '@/shared/api/client';
import type {
  GlobalPriceList,
  PriceListComment,
  CreatePriceListPayload,
  UpdatePriceListPayload,
  CreatePriceListCommentPayload,
  CenikyLibraryFilter,
} from '../types';

export function listCommunityPriceLists(
  filter: CenikyLibraryFilter,
): Promise<GlobalPriceList[]> {
  const params: Record<string, unknown> = {};
  if (filter.status) params.status = filter.status;
  if (filter.tag) params.tag = filter.tag;
  return api.get<GlobalPriceList[]>('/price-lists/community', params);
}

export function getCommunityPriceList(id: string): Promise<GlobalPriceList> {
  return api.get<GlobalPriceList>(`/price-lists/community/${id}`);
}

export function createPriceList(
  payload: CreatePriceListPayload,
): Promise<GlobalPriceList> {
  return api.post<GlobalPriceList>('/price-lists/community', payload);
}

export function updatePriceList(
  id: string,
  patch: UpdatePriceListPayload,
): Promise<GlobalPriceList> {
  return api.patch<GlobalPriceList>(`/price-lists/community/${id}`, patch);
}

export function approvePriceList(id: string): Promise<GlobalPriceList> {
  return api.post<GlobalPriceList>(`/price-lists/community/${id}/approve`);
}

export function deletePriceList(id: string): Promise<void> {
  return api.delete<void>(`/price-lists/community/${id}`);
}

// ── Komentáře (jedna úroveň — celý ceník) ──

export function listPriceListComments(
  id: string,
): Promise<PriceListComment[]> {
  return api.get<PriceListComment[]>(`/price-lists/community/${id}/comments`);
}

export function createPriceListComment(
  id: string,
  payload: CreatePriceListCommentPayload,
): Promise<PriceListComment> {
  return api.post<PriceListComment>(
    `/price-lists/community/${id}/comments`,
    payload,
  );
}
