import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import type {
  Nabor,
  NaborStrana,
  NaborMotiv,
  NaborMode,
  NaborStatus,
} from '@/shared/types';

/**
 * 19.3 — React Query hooky nástěnky náborů (LFG). Vlastní entita (NE nadstavba
 * nad Diskuze); vzor hooků dle `useDiscussions`. Kontaktní smyčka = „Ozvat se"
 * (přímá zpráva autorovi), moderace post (nahlásit → fronta správcům).
 */

const PREFIX = '/nabory';
export const NABORY_KEY = ['nabory'] as const;

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: NABORY_KEY });
  qc.invalidateQueries({ queryKey: ['pending-actions'] });
}

// ─── Čtení ─────────────────────────────────────────────────────────────────

/** Seznam náborů (BE vrací `status !== 'expired'`; filtrace klient-side v libu). */
export function useNabory() {
  return useQuery({
    queryKey: [...NABORY_KEY, 'all'],
    queryFn: () => api.get<Nabor[]>(PREFIX),
    staleTime: 20_000,
  });
}

export function useNabor(id: string | undefined) {
  return useQuery({
    queryKey: [...NABORY_KEY, 'detail', id],
    queryFn: () => api.get<Nabor>(`${PREFIX}/${id}`),
    enabled: !!id,
  });
}

// ─── CRUD ──────────────────────────────────────────────────────────────────

export interface CreateNaborDto {
  strana: NaborStrana;
  /** Hráč vybírá z 12; PJ dědí z `world.themeId` (viz spec 19.3 R3). */
  motiv: NaborMotiv;
  /** Povinné u `hledam-hrace`. */
  worldId?: string;
  title: string;
  body: string;
  imageUrl?: string;
  system?: string;
  mode: NaborMode;
  place?: string;
  seatsTotal?: number;
}

export function useCreateNabor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateNaborDto) => api.post<Nabor>(PREFIX, dto),
    onSuccess: () => invalidate(qc),
  });
}

export interface PatchNaborDto {
  title?: string;
  body?: string;
  motiv?: NaborMotiv;
  system?: string;
  mode?: NaborMode;
  place?: string;
  imageUrl?: string;
  seatsTotal?: number;
  seatsTaken?: number;
  /** Autor smí „Zavřít / obsazeno" (`closed`). */
  status?: NaborStatus;
}

export function usePatchNabor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: PatchNaborDto }) =>
      api.patch<Nabor>(`${PREFIX}/${id}`, dto),
    onSuccess: () => invalidate(qc),
  });
}

/** Smaže nábor — autor + Správce diskuzí + Admin + Superadmin (BE gating). */
export function useDeleteNabor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`${PREFIX}/${id}`),
    onSuccess: () => invalidate(qc),
  });
}

// ─── Kontaktní smyčka + moderace ───────────────────────────────────────────

/** „Ozvat se" — pošle autorovi zprávu (reuse messaging na BE). */
export function useOzvatSe() {
  return useMutation({
    mutationFn: ({ id, message }: { id: string; message: string }) =>
      api.post<{ ok: true }>(`${PREFIX}/${id}/ozvat-se`, { message }),
  });
}

/** Nahlásí nábor — post-moderace, objeví se ve frontě správců (badge). */
export function useReportNabor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.post(`${PREFIX}/${id}/report`, { reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pending-actions'] }),
  });
}
