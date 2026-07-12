import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { toast } from 'sonner';
import { api, parseApiErrorCode } from '@/shared/api/client';
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

/**
 * 409 `CURRENCY_CONFLICT` z PUT currencies — souběžná editace (optimistic
 * lock `expectedUpdatedAt`). Hook hlášku + refetch řeší centrálně; call-site
 * onError s vlastním toastem má na conflict jen tiše skončit.
 */
export function isCurrencyConflict(err: unknown): boolean {
  return parseApiErrorCode(err) === 'CURRENCY_CONFLICT';
}

export function useUpdateCurrencies(worldId: string) {
  const qc = useQueryClient();
  const key = worldCurrenciesQueryKey(worldId);
  return useMutation({
    mutationFn: (payload: UpdateCurrenciesPayload) => {
      // Optimistic lock — `expectedUpdatedAt` z posledního GET (cache; onMutate
      // ho zachovává). Při souběžné změně vrátí BE 409 CURRENCY_CONFLICT
      // místo tichého přepisu cizí editace. Bez updatedAt (placeholder/legacy)
      // se token neposílá → BE spadne na prostý upsert.
      const cachedUpdatedAt = qc.getQueryData<WorldCurrenciesPayload>(key)?.updatedAt;
      const expectedUpdatedAt =
        payload.expectedUpdatedAt ??
        (cachedUpdatedAt ? new Date(cachedUpdatedAt).toISOString() : undefined);
      return api.put<WorldCurrenciesPayload>(`/worlds/${worldId}/currencies`, {
        items: payload.items,
        ...(expectedUpdatedAt ? { expectedUpdatedAt } : {}),
      });
    },
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
    onSuccess: (data) => {
      // PUT response nese čerstvý `updatedAt` → hned další edit má platný
      // lock i před dokončením refetche z invalidace.
      qc.setQueryData(key, data);
    },
    onError: (err, _payload, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
      if (isCurrencyConflict(err)) {
        toast.error(
          'Měny mezitím upravil někdo jiný — načítám aktuální stav.',
        );
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: key });
      // D-05-2 — account currency dropdown čte přes ['worlds',w,'currencies']
      // (worldCurrenciesQueryKey v characters.types) — jiný klíč, týž endpoint.
      qc.invalidateQueries({ queryKey: ['worlds', worldId, 'currencies'] });
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
