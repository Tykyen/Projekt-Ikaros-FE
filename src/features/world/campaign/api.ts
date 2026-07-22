import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import { vypravecEmit } from '@/shared/vypravec/engine/events';
import { useAtomValue } from 'jotai';
import { api } from '@/shared/api/client';
import { accessTokenAtom } from '@/shared/store/authStore';
import type {
  CampaignDashboard,
  CampaignPlayer,
  CampaignRelationship,
  CampaignScenario,
  CampaignStoryline,
  CampaignSubject,
  CreateRelationshipInput,
  CreateScenarioInput,
  CreateStorylineInput,
  CreateSubjectInput,
} from './types';

/**
 * Krok 11.1 — Pavučina (FE data vrstva).
 *
 * BE: `/campaign/{subjects,relationships,storylines,dashboard,players}` —
 * vše bere `?worldId=`. Scope řeší BE dle role žadatele (PJ vidí vše od všech
 * vlastníků; vrstvy rozdělí FE přes `partitionByOwner`).
 */

const wq = (worldId: string) => ({ worldId });

export const campaignKeys = {
  root: (worldId: string) => ['campaign', worldId] as const,
  subjects: (worldId: string) => ['campaign', worldId, 'subjects'] as const,
  relationships: (worldId: string) =>
    ['campaign', worldId, 'relationships'] as const,
  storylines: (worldId: string) => ['campaign', worldId, 'storylines'] as const,
  scenarios: (worldId: string) => ['campaign', worldId, 'scenarios'] as const,
  dashboard: (worldId: string) => ['campaign', worldId, 'dashboard'] as const,
  players: (worldId: string) => ['campaign', worldId, 'players'] as const,
};

// ── Queries ──────────────────────────────────────────────────────────────────

export function useCampaignSubjects(worldId: string) {
  const token = useAtomValue(accessTokenAtom);
  return useQuery({
    queryKey: campaignKeys.subjects(worldId),
    queryFn: () => api.get<CampaignSubject[]>('/campaign/subjects', wq(worldId)),
    enabled: !!token && !!worldId,
    staleTime: 60_000,
  });
}

export function useCampaignRelationships(worldId: string) {
  const token = useAtomValue(accessTokenAtom);
  return useQuery({
    queryKey: campaignKeys.relationships(worldId),
    queryFn: () =>
      api.get<CampaignRelationship[]>('/campaign/relationships', wq(worldId)),
    enabled: !!token && !!worldId,
    staleTime: 60_000,
  });
}

export function useCampaignStorylines(worldId: string) {
  const token = useAtomValue(accessTokenAtom);
  return useQuery({
    queryKey: campaignKeys.storylines(worldId),
    queryFn: () =>
      api.get<CampaignStoryline[]>('/campaign/storylines', wq(worldId)),
    enabled: !!token && !!worldId,
    staleTime: 60_000,
  });
}

export function useCampaignScenarios(worldId: string) {
  const token = useAtomValue(accessTokenAtom);
  return useQuery({
    queryKey: campaignKeys.scenarios(worldId),
    queryFn: () =>
      api.get<CampaignScenario[]>('/campaign/scenarios', wq(worldId)),
    enabled: !!token && !!worldId,
    staleTime: 60_000,
  });
}

export function useCampaignDashboard(worldId: string) {
  const token = useAtomValue(accessTokenAtom);
  return useQuery({
    queryKey: campaignKeys.dashboard(worldId),
    queryFn: () =>
      api.get<CampaignDashboard>('/campaign/dashboard', wq(worldId)),
    enabled: !!token && !!worldId,
    staleTime: 30_000,
  });
}

export function useCampaignPlayers(worldId: string, enabled = true) {
  const token = useAtomValue(accessTokenAtom);
  return useQuery({
    queryKey: campaignKeys.players(worldId),
    queryFn: () => api.get<CampaignPlayer[]>('/campaign/players', wq(worldId)),
    enabled: !!token && !!worldId && enabled,
    staleTime: 5 * 60_000,
  });
}

// ── Mutace ───────────────────────────────────────────────────────────────────

/** Po zápisu invaliduje dotčené listy + dashboard (změna se promítne do „Dnes"). */
function invalidateCampaign(qc: QueryClient, worldId: string) {
  return qc.invalidateQueries({ queryKey: campaignKeys.root(worldId) });
}

export function useCreateSubject(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSubjectInput) =>
      api.post<CampaignSubject>(
        `/campaign/subjects?worldId=${worldId}`,
        input,
      ),
    onSuccess: () => {
      invalidateCampaign(qc, worldId);
      // Vypravěč (spec 26.7): krok „První vztah v Pavučině" cesty tvůrce.
      vypravecEmit('subject.created', { worldId });
    },
  });
}

export function useUpdateSubject(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CreateSubjectInput }) =>
      api.put<CampaignSubject>(
        `/campaign/subjects/${id}?worldId=${worldId}`,
        input,
      ),
    onSuccess: () => invalidateCampaign(qc, worldId),
  });
}

export function useDeleteSubject(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<void>(`/campaign/subjects/${id}?worldId=${worldId}`),
    onSuccess: () => invalidateCampaign(qc, worldId),
  });
}

export function useCreateRelationship(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateRelationshipInput) =>
      api.post<CampaignRelationship>(
        `/campaign/relationships?worldId=${worldId}`,
        input,
      ),
    onSuccess: () => invalidateCampaign(qc, worldId),
  });
}

export function useUpdateRelationship(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: CreateRelationshipInput;
    }) =>
      api.put<CampaignRelationship>(
        `/campaign/relationships/${id}?worldId=${worldId}`,
        input,
      ),
    onSuccess: () => invalidateCampaign(qc, worldId),
  });
}

export function useDeleteRelationship(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<void>(`/campaign/relationships/${id}?worldId=${worldId}`),
    onSuccess: () => invalidateCampaign(qc, worldId),
  });
}

export function useCreateStoryline(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateStorylineInput) =>
      api.post<CampaignStoryline>(
        `/campaign/storylines?worldId=${worldId}`,
        input,
      ),
    onSuccess: () => invalidateCampaign(qc, worldId),
  });
}

export function useUpdateStoryline(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CreateStorylineInput }) =>
      api.put<CampaignStoryline>(
        `/campaign/storylines/${id}?worldId=${worldId}`,
        input,
      ),
    onSuccess: () => invalidateCampaign(qc, worldId),
  });
}

export function useDeleteStoryline(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<void>(`/campaign/storylines/${id}?worldId=${worldId}`),
    onSuccess: () => invalidateCampaign(qc, worldId),
  });
}

// ── Scénáře / Storyboard (11.2) ──────────────────────────────────────────────

export function useCreateScenario(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateScenarioInput) =>
      api.post<CampaignScenario>(
        `/campaign/scenarios?worldId=${worldId}`,
        input,
      ),
    onSuccess: () => invalidateCampaign(qc, worldId),
  });
}

export function useUpdateScenario(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CreateScenarioInput }) =>
      api.put<CampaignScenario>(
        `/campaign/scenarios/${id}?worldId=${worldId}`,
        input,
      ),
    onSuccess: () => invalidateCampaign(qc, worldId),
  });
}

export function useDeleteScenario(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<void>(`/campaign/scenarios/${id}?worldId=${worldId}`),
    onSuccess: () => invalidateCampaign(qc, worldId),
  });
}

/**
 * Batch update více scénářů (drag-reorder / re-parent / osiření).
 * Sekvenčně (objem malý, vyhneme se závodění o `$set` contentData),
 * invalidace až po dokončení všech.
 */
export function useReorderScenarios(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      updates: Array<{ id: string; input: CreateScenarioInput }>,
    ) => {
      for (const u of updates) {
        await api.put<CampaignScenario>(
          `/campaign/scenarios/${u.id}?worldId=${worldId}`,
          u.input,
        );
      }
    },
    onSuccess: () => invalidateCampaign(qc, worldId),
  });
}

// ── Vrstvy — partitioning dle ownerId ────────────────────────────────────────

export interface OwnerPartition<T> {
  /** Položky vlastněné aktuálním uživatelem („Moje vrstva"). */
  mine: T[];
  /** Položky ostatních vlastníků (hráčů) → klíč = ownerId. */
  byOwner: Map<string, T[]>;
}

/**
 * Rozdělí plochý seznam (PJ vidí vše od všech) na „moje" + per-vlastník.
 * Pure — testovatelné, použité pro layer switcher i per-hráč dashboard dopočet.
 */
export function partitionByOwner<T extends { ownerId: string }>(
  items: T[],
  myUserId: string,
): OwnerPartition<T> {
  const mine: T[] = [];
  const byOwner = new Map<string, T[]>();
  for (const item of items) {
    if (item.ownerId === myUserId) {
      mine.push(item);
    } else {
      const arr = byOwner.get(item.ownerId);
      if (arr) arr.push(item);
      else byOwner.set(item.ownerId, [item]);
    }
  }
  return { mine, byOwner };
}
