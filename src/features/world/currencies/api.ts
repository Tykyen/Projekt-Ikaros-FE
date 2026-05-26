import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { api } from '@/shared/api/client';
import { accessTokenAtom } from '@/shared/store/authStore';
import type {
  ConvertCurrencyRequest,
  ConvertCurrencyResult,
  UpdateCurrenciesPayload,
  WorldCurrenciesPayload,
} from './types';

/**
 * Krok 11.4 — Měny a převodník.
 *
 * BE endpointy:
 *   GET  /worlds/:worldId/currencies            → členové světa
 *   PUT  /worlds/:worldId/currencies            → jen PJ + globální Admin/Super
 *   POST /worlds/:worldId/currencies/convert    → členové světa
 */

export const worldCurrenciesQueryKey = (worldId: string) =>
  ['world-currencies', worldId] as const;

export function useWorldCurrencies(worldId: string) {
  const token = useAtomValue(accessTokenAtom);
  return useQuery({
    queryKey: worldCurrenciesQueryKey(worldId),
    queryFn: () =>
      api.get<WorldCurrenciesPayload>(`/worlds/${worldId}/currencies`),
    enabled: !!token && !!worldId,
    staleTime: 5 * 60_000,
    placeholderData: { worldId, items: [] } as WorldCurrenciesPayload,
  });
}

export function useUpdateCurrencies(worldId: string) {
  const qc = useQueryClient();
  const key = worldCurrenciesQueryKey(worldId);
  return useMutation({
    mutationFn: (payload: UpdateCurrenciesPayload) =>
      api.put<WorldCurrenciesPayload>(`/worlds/${worldId}/currencies`, payload),
    onMutate: async (payload) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<WorldCurrenciesPayload>(key);
      qc.setQueryData<WorldCurrenciesPayload>(key, (current) => ({
        worldId,
        ...(current ?? {}),
        items: payload.items,
      }));
      return { prev };
    },
    onError: (_err, _payload, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: key });
    },
  });
}

export function useConvertMutation(worldId: string) {
  return useMutation({
    mutationFn: (req: ConvertCurrencyRequest) =>
      api.post<ConvertCurrencyResult>(
        `/worlds/${worldId}/currencies/convert`,
        req,
      ),
  });
}
