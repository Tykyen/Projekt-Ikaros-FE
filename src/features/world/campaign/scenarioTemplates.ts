/**
 * 11.2-ext E — Knihovna scén (šablony). Per-PJ, cross-world.
 * BE `/scenario-templates` (campaign modul). Žádný worldId — šablony jsou
 * přenositelné mezi světy.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { api } from '@/shared/api/client';
import { accessTokenAtom } from '@/shared/store/authStore';

export interface ScenarioTemplate {
  id: string;
  ownerId: string;
  name: string;
  scenarioTitle: string;
  contentData: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateScenarioTemplateInput {
  name: string;
  scenarioTitle: string;
  contentData: Record<string, unknown>;
}

const KEY = ['scenario-templates'] as const;

export function useScenarioTemplates() {
  const token = useAtomValue(accessTokenAtom);
  return useQuery({
    queryKey: KEY,
    queryFn: () => api.get<ScenarioTemplate[]>('/scenario-templates'),
    enabled: !!token,
    staleTime: 60_000,
  });
}

export function useSaveScenarioTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateScenarioTemplateInput) =>
      api.post<ScenarioTemplate>('/scenario-templates', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteScenarioTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<void>(`/scenario-templates/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/**
 * Očistí `contentData` scénáře na přenositelný snapshot — odstraní per-svět
 * runtime odkazy (subjekty/bestie/mapy/stránky a stromovou pozici).
 */
export function toTemplateContentData(
  contentData: Record<string, unknown> | undefined,
): Record<string, unknown> {
  const tree =
    contentData && typeof contentData.storyTree === 'object'
      ? (contentData.storyTree as Record<string, unknown>)
      : {};
  return {
    storyTree: {
      kind: tree.kind === 'folder' ? 'folder' : 'scene',
      status: 'draft',
      body: tree.body,
      gmNotes: tree.gmNotes,
      objective: tree.objective,
      outcome: tree.outcome,
      mapPrep: tree.mapPrep,
      // ZÁMĚRNĚ vynecháno: parentId, order, branchLabel, subjectIds,
      // bestieIds, mapSceneIds, pageSlugs — vázané na konkrétní svět/strom.
      mapSceneIds: [],
      pageSlugs: [],
      bestieIds: [],
    },
  };
}
