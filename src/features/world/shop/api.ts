import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { api } from '@/shared/api/client';
import { accessTokenAtom } from '@/shared/store/authStore';
import type {
  ShopItem,
  ShopGroup,
  CreateShopItemInput,
  CreateShopGroupInput,
  BulkCreateShopItemsInput,
  Purchase,
  PurchaseInput,
  PurchaseResult,
} from './types';

/**
 * Krok 11.3 — Obchod (FE data vrstva).
 *
 * BE: `/campaign/{shopitems,shopgroups}` — vše bere `?worldId=`. Scope řeší BE
 * dle role žadatele (PJ vidí vše; PomocnyPJ svoje+sdílené; hráč svoje+sdílené).
 * Vrstvy „moje / sdílené" dělí FE klientsky.
 */

const wq = (worldId: string) => ({ worldId });

export const shopKeys = {
  root: (worldId: string) => ['shop', worldId] as const,
  items: (worldId: string) => ['shop', worldId, 'items'] as const,
  groups: (worldId: string) => ['shop', worldId, 'groups'] as const,
  purchases: (worldId: string) => ['shop', worldId, 'purchases'] as const,
};

// ── Queries ──────────────────────────────────────────────────────────────────

export function useShopItems(worldId: string) {
  const token = useAtomValue(accessTokenAtom);
  return useQuery({
    queryKey: shopKeys.items(worldId),
    queryFn: () => api.get<ShopItem[]>('/campaign/shopitems', wq(worldId)),
    enabled: !!token && !!worldId,
    staleTime: 60_000,
  });
}

export function useShopGroups(worldId: string) {
  const token = useAtomValue(accessTokenAtom);
  return useQuery({
    queryKey: shopKeys.groups(worldId),
    queryFn: () => api.get<ShopGroup[]>('/campaign/shopgroups', wq(worldId)),
    enabled: !!token && !!worldId,
    staleTime: 60_000,
  });
}

// ── Mutace ───────────────────────────────────────────────────────────────────

function invalidateShop(qc: QueryClient, worldId: string) {
  return qc.invalidateQueries({ queryKey: shopKeys.root(worldId) });
}

export function useCreateShopItem(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateShopItemInput) =>
      api.post<ShopItem>(`/campaign/shopitems?worldId=${worldId}`, input),
    onSuccess: () => invalidateShop(qc, worldId),
  });
}

/**
 * 21.5a — hromadné založení položek (např. vklad rostlin z herbáře). BE
 * `POST /campaign/shopitems/bulk?worldId=` přijme `{ items }` (1–200), gate
 * PomocnyPJ+. Volající dělí na dávky ≤200.
 */
export function useBulkCreateShopItems(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: BulkCreateShopItemsInput) =>
      api.post<ShopItem[]>(`/campaign/shopitems/bulk?worldId=${worldId}`, input),
    onSuccess: () => invalidateShop(qc, worldId),
  });
}

export function useUpdateShopItem(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CreateShopItemInput }) =>
      api.put<ShopItem>(`/campaign/shopitems/${id}?worldId=${worldId}`, input),
    onSuccess: () => invalidateShop(qc, worldId),
  });
}

export function useDeleteShopItem(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<void>(`/campaign/shopitems/${id}?worldId=${worldId}`),
    onSuccess: () => invalidateShop(qc, worldId),
  });
}

export function useCreateShopGroup(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateShopGroupInput) =>
      api.post<ShopGroup>(`/campaign/shopgroups?worldId=${worldId}`, input),
    onSuccess: () => invalidateShop(qc, worldId),
  });
}

export function useUpdateShopGroup(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CreateShopGroupInput }) =>
      api.put<ShopGroup>(`/campaign/shopgroups/${id}?worldId=${worldId}`, input),
    onSuccess: () => invalidateShop(qc, worldId),
  });
}

export function useDeleteShopGroup(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<void>(`/campaign/shopgroups/${id}?worldId=${worldId}`),
    onSuccess: () => invalidateShop(qc, worldId),
  });
}

// ── Nákup / storno ────────────────────────────────────────────────────────

/** Po nákupu/stornu invaliduje účty+vybavení postav i historii nákupů. */
function invalidatePurchase(qc: QueryClient, worldId: string) {
  qc.invalidateQueries({ queryKey: ['characters', worldId] });
  qc.invalidateQueries({ queryKey: shopKeys.purchases(worldId) });
}

export function usePurchases(worldId: string, characterId?: string) {
  const token = useAtomValue(accessTokenAtom);
  return useQuery({
    queryKey: [...shopKeys.purchases(worldId), characterId ?? 'all'],
    queryFn: () =>
      api.get<Purchase[]>('/campaign/purchases', {
        worldId,
        ...(characterId ? { characterId } : {}),
      }),
    enabled: !!token && !!worldId,
    staleTime: 30_000,
  });
}

export function usePurchase(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, ...body }: PurchaseInput) =>
      api.post<PurchaseResult>(
        `/campaign/shopitems/${itemId}/purchase?worldId=${worldId}`,
        body,
      ),
    onSuccess: () => invalidatePurchase(qc, worldId),
  });
}

export function useRefund(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (purchaseId: string) =>
      api.post<PurchaseResult>(
        `/campaign/purchases/${purchaseId}/refund?worldId=${worldId}`,
        {},
      ),
    onSuccess: () => invalidatePurchase(qc, worldId),
  });
}
