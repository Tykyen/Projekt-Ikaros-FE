import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import type {
  CreateReportInput,
  MyDecisionItem,
  MyReportItem,
  ResolveReportInput,
  ReviewAppealInput,
  SubmitAppealInput,
} from './types';

/**
 * Spec 20B (Fáze B2) — React Query hooky proti BE modulu `moderation`.
 * Base klient přidává prefix `/api`, takže cesty jsou bez něj.
 */

const PREFIX = '/moderation';
export const MODERATION_KEY = ['moderation'] as const;

/**
 * Vytvoří report (nahlásí obsah). Po úspěchu invaliduje frontu Zpracovat
 * (moderátorský badge) i „moje hlášení". `reporterId`/`reporterName` bere BE
 * z tokenu — v `input` se NEposílají.
 */
export function useCreateReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateReportInput) =>
      api.post<{ id: string }>(`${PREFIX}/reports`, input),
    onSuccess: () => {
      // Nahlášení se musí objevit v moderátorské frontě + badge (viz C-41).
      qc.invalidateQueries({ queryKey: ['pending-actions'] });
      qc.invalidateQueries({ queryKey: [...MODERATION_KEY, 'my-reports'] });
    },
  });
}

/** Stav mých hlášení (pohled oznamovatele). */
export function useMyReports(enabled = true) {
  return useQuery({
    queryKey: [...MODERATION_KEY, 'my-reports'],
    queryFn: () => api.get<MyReportItem[]>(`${PREFIX}/reports/mine`),
    enabled,
    staleTime: 30_000,
  });
}

/**
 * Rozhodnutí o mém obsahu (pohled autora postiženého obsahu) — statement of
 * reasons dle DSA čl. 17. Odvolání (`appealId`) je zatím jen read-only.
 */
export function useMyDecisions(enabled = true) {
  return useQuery({
    queryKey: [...MODERATION_KEY, 'my-decisions'],
    queryFn: () => api.get<MyDecisionItem[]>(`${PREFIX}/decisions/mine`),
    enabled,
    staleTime: 30_000,
  });
}

/**
 * Vyřídí report (zaznamená rozhodnutí). Reviewer-gated na BE; account-level
 * akce (M5–M7) a kategorie minor_safety povolí BE jen Adminovi (jinak 403).
 * Po úspěchu refetch fronty.
 */
export function useResolveReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      reportId,
      input,
    }: {
      reportId: string;
      input: ResolveReportInput;
    }) =>
      api.post<{ decisionId: string }>(
        `${PREFIX}/reports/${reportId}/resolve`,
        input,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pending-actions'] });
    },
  });
}

/**
 * B4 — autor postiženého obsahu se odvolá proti moderačnímu rozhodnutí
 * (`POST /moderation/decisions/:id/appeal`). Jedno odvolání na rozhodnutí
 * (BE 409 `APPEAL_ALREADY_EXISTS`). Po úspěchu se v „mých rozhodnutích"
 * objeví `appealId` → refetch přes invalidaci `my-decisions`.
 */
export function useSubmitAppeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      decisionId,
      input,
    }: {
      decisionId: string;
      input: SubmitAppealInput;
    }) =>
      api.post<{ appealId: string }>(
        `${PREFIX}/decisions/${decisionId}/appeal`,
        input,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...MODERATION_KEY, 'my-decisions'] });
    },
  });
}

/**
 * B4 — přezkum odvolání jiným moderátorem (`POST /moderation/appeals/:id/
 * review`). Vlastní rozhodnutí nelze přezkoumat (BE 403
 * `APPEAL_SELF_REVIEW_FORBIDDEN`). Po úspěchu refetch fronty odvolání.
 */
export function useReviewAppeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      appealId,
      input,
    }: {
      appealId: string;
      input: ReviewAppealInput;
    }) =>
      api.post<{ status: string }>(
        `${PREFIX}/appeals/${appealId}/review`,
        input,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pending-actions'] });
    },
  });
}
