/**
 * 13.3 — Sounds API klient.
 *
 * Mapuje BE `sounds` + `world-sounds` controllery. World write ops gated
 * `>=PomocnyPJ` na BE; global approve/reject gated Admin+.
 * Pozn.: `api.*` helper vrací rovnou data (ne axios response).
 */
import { api } from '@/shared/api/client';
import type { Sound, CreateSoundDto, UpdateSoundDto } from '../types';

export const soundsApi = {
  // ── Per-svět ──────────────────────────────────────────────
  listWorld: (worldId: string) => api.get<Sound[]>(`/worlds/${worldId}/sounds`),

  create: (worldId: string, dto: CreateSoundDto) =>
    api.post<Sound>(`/worlds/${worldId}/sounds`, dto),

  update: (worldId: string, id: string, dto: UpdateSoundDto) =>
    api.put<Sound>(`/worlds/${worldId}/sounds/${id}`, dto),

  remove: (worldId: string, id: string) =>
    api.delete<void>(`/worlds/${worldId}/sounds/${id}`),

  importGlobal: (worldId: string, globalId: string) =>
    api.post<Sound>(`/worlds/${worldId}/sounds/import/${globalId}`),

  nominate: (worldId: string, id: string) =>
    api.post<Sound>(`/worlds/${worldId}/sounds/${id}/nominate`),

  // ── Globální ──────────────────────────────────────────────
  listGlobal: () => api.get<Sound[]>('/sounds'),

  listPending: () => api.get<Sound[]>('/sounds/pending'),

  approve: (id: string) => api.post<Sound>(`/sounds/${id}/approve`),

  reject: (id: string, reason: string) =>
    api.post<Sound>(`/sounds/${id}/reject`, { reason }),
};
