import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import {
  charactersQueryKey,
  worldCurrenciesQueryKey,
  type CharacterAccount,
  type FantasyDateLike,
  type WorldCurrencies,
} from './characters.types';

/**
 * 8.6 — Per-postava list účtů (vrací i shared, kde je character co-owner).
 */
export function useCharacterAccounts(worldId: string, slug: string) {
  return useQuery({
    queryKey: charactersQueryKey.accountsByCharacter(worldId, slug),
    queryFn: () =>
      api.get<CharacterAccount[]>(
        `/worlds/${worldId}/characters/${slug}/accounts`,
      ),
    enabled: !!worldId && !!slug,
    staleTime: 30_000,
  });
}

/** 8.6 — Detail jednoho účtu (po vybrání ve switcheru, nebo cíl transferu). */
export function useAccount(worldId: string, accountId: string | null) {
  return useQuery({
    queryKey: charactersQueryKey.accountDetail(worldId, accountId ?? ''),
    queryFn: () =>
      api.get<CharacterAccount>(`/worlds/${worldId}/accounts/${accountId}`),
    enabled: !!worldId && !!accountId,
    staleTime: 30_000,
  });
}

/** 8.6 — Měny světa (přes existující world-currencies endpoint). */
export function useWorldCurrencies(worldId: string) {
  return useQuery({
    queryKey: worldCurrenciesQueryKey(worldId),
    queryFn: () =>
      api.get<WorldCurrencies>(`/worlds/${worldId}/currencies`),
    enabled: !!worldId,
    staleTime: 5 * 60_000,
  });
}

// ── Mutace ────────────────────────────────────────────────────────

export interface CreateAccountInput {
  label: string;
  ownerCharacterIds?: string[];
  currency: string;
  accountType?: string;
  accessLocationCharacterId?: string | null;
  notes?: string;
}

export function useCreateAccount(worldId: string, slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAccountInput) =>
      api.post<CharacterAccount>(
        `/worlds/${worldId}/characters/${slug}/accounts`,
        input,
      ),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: charactersQueryKey.accountsByCharacter(worldId, slug),
      });
    },
  });
}

export interface UpdateAccountInput {
  label?: string;
  notes?: string;
  incomeEntries?: { id: string; label: string; amount: number }[];
  expenseEntries?: { id: string; label: string; amount: number }[];
  accountType?: string;
  accessLocationCharacterId?: string | null;
  currency?: string;
  /** Spec 8.x-prep §4.3 (B3) — flag pro povolení hráčova self-adjust. */
  allowPlayerSelfAdjust?: boolean;
}

export function useUpdateAccount(worldId: string, accountId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateAccountInput) =>
      api.patch<CharacterAccount>(
        `/worlds/${worldId}/accounts/${accountId}`,
        input,
      ),
    onSuccess: (account) => {
      qc.setQueryData(
        charactersQueryKey.accountDetail(worldId, accountId),
        account,
      );
      // Invalidovat všechny owner-listy, kde se účet objeví (shared accounts).
      for (const ownerCharId of account.ownerCharacterIds) {
        void qc.invalidateQueries({
          queryKey: ['characters', worldId, 'detail'],
          predicate: (q) =>
            q.queryKey[3] === ownerCharId || q.queryKey.includes(ownerCharId),
        });
      }
      // Fallback — invalidovat celý character cluster.
      void qc.invalidateQueries({ queryKey: ['characters', worldId] });
    },
  });
}

export function useDeleteAccount(worldId: string, accountId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.delete<{ ok: true }>(`/worlds/${worldId}/accounts/${accountId}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['characters', worldId] });
    },
  });
}

/** Spec 8.x-prep §4.4 (B4) — addMonthly nyní přijímá optional inGameDate. */
export interface AddMonthlyInput {
  inGameDate?: FantasyDateLike | null;
}

export function useAccountAddMonthly(worldId: string, accountId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input?: AddMonthlyInput) =>
      api.post<CharacterAccount>(
        `/worlds/${worldId}/accounts/${accountId}/add-monthly`,
        input ?? {},
      ),
    onSuccess: (account) => {
      qc.setQueryData(
        charactersQueryKey.accountDetail(worldId, accountId),
        account,
      );
      void qc.invalidateQueries({ queryKey: ['characters', worldId] });
    },
  });
}

/**
 * Spec 8.x-prep §4.3 (B3) — manuální vklad / výběr s povinným důvodem.
 * Permission rozhoduje BE (PJ+ vždy, hráč jen pokud allowPlayerSelfAdjust=true).
 * Pozitivní amount = vklad, záporné = výběr.
 */
export interface AdjustBalanceInput {
  amount: number;
  reason: string;
  inGameDate?: FantasyDateLike | null;
}

export function useAccountAdjust(worldId: string, accountId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AdjustBalanceInput) =>
      api.post<CharacterAccount>(
        `/worlds/${worldId}/accounts/${accountId}/adjust`,
        input,
      ),
    onSuccess: (account) => {
      qc.setQueryData(
        charactersQueryKey.accountDetail(worldId, accountId),
        account,
      );
      void qc.invalidateQueries({ queryKey: ['characters', worldId] });
    },
  });
}

export function useAccountUndo(worldId: string, accountId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.post<CharacterAccount>(`/worlds/${worldId}/accounts/${accountId}/undo`),
    onSuccess: (account) => {
      qc.setQueryData(
        charactersQueryKey.accountDetail(worldId, accountId),
        account,
      );
      void qc.invalidateQueries({ queryKey: ['characters', worldId] });
    },
  });
}

export interface TransferInput {
  toAccountId: string;
  amount: number;
  description: string;
  /** Spec 8.x-prep §4.4 (B4) — herní datum. */
  inGameDate?: FantasyDateLike | null;
}

export function useAccountTransfer(worldId: string, fromAccountId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: TransferInput) =>
      api.post<{ from: CharacterAccount; to: CharacterAccount }>(
        `/worlds/${worldId}/accounts/${fromAccountId}/transfer`,
        input,
      ),
    onSuccess: ({ from, to }) => {
      qc.setQueryData(
        charactersQueryKey.accountDetail(worldId, from.id),
        from,
      );
      qc.setQueryData(charactersQueryKey.accountDetail(worldId, to.id), to);
      // Oba dotčené postavy (i shared) — invalidate jejich list účtů.
      void qc.invalidateQueries({ queryKey: ['characters', worldId] });
    },
  });
}

export function useAccountAddCoOwner(worldId: string, accountId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (characterId: string) =>
      api.post<CharacterAccount>(
        `/worlds/${worldId}/accounts/${accountId}/co-owners`,
        { characterId },
      ),
    onSuccess: (account) => {
      qc.setQueryData(
        charactersQueryKey.accountDetail(worldId, accountId),
        account,
      );
      void qc.invalidateQueries({ queryKey: ['characters', worldId] });
    },
  });
}

export function useAccountRemoveCoOwner(worldId: string, accountId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (characterId: string) =>
      api.delete<CharacterAccount>(
        `/worlds/${worldId}/accounts/${accountId}/co-owners/${characterId}`,
      ),
    onSuccess: (account) => {
      qc.setQueryData(
        charactersQueryKey.accountDetail(worldId, accountId),
        account,
      );
      void qc.invalidateQueries({ queryKey: ['characters', worldId] });
    },
  });
}

/**
 * D-8.6-transferPrimary — převod primary ownership na jiného co-owner.
 * Pokud nový primary není v owners, BE ho atomicky přidá.
 */
export function useAccountTransferPrimary(worldId: string, accountId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (characterId: string) =>
      api.post<CharacterAccount>(
        `/worlds/${worldId}/accounts/${accountId}/transfer-primary`,
        { characterId },
      ),
    onSuccess: (account) => {
      qc.setQueryData(
        charactersQueryKey.accountDetail(worldId, accountId),
        account,
      );
      void qc.invalidateQueries({ queryKey: ['characters', worldId] });
    },
  });
}
