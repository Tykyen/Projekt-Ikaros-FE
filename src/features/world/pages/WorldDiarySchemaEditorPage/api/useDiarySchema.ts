import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { api } from '@/shared/api';
import { accessTokenAtom } from '@/shared/store/authStore';
import type {
  CreateDiarySchemaVersionInput,
  DiarySchemaVersion,
  DiarySchemaVersionMeta,
  RemapDiaryKeysInput,
} from '../../api/diarySchema.types';
import { diarySchemaQueryKey } from '../../api/diarySchema.types';
import { charactersQueryKey } from '../../api/characters.types';

/* ============================================================
 * Queries
 * ============================================================ */

/** Seznam verzí (meta = bez `schema[]`). */
export function useDiarySchemaVersions(worldId: string) {
  const token = useAtomValue(accessTokenAtom);
  return useQuery({
    queryKey: diarySchemaQueryKey.list(worldId),
    queryFn: () =>
      api.get<DiarySchemaVersionMeta[]>(
        `/worlds/${worldId}/diary-schema-versions`,
      ),
    enabled: !!token && !!worldId,
    placeholderData: [],
  });
}

/** Detail konkrétní verze. `version === undefined` → query disabled. */
export function useDiarySchemaVersion(
  worldId: string,
  version: number | undefined,
) {
  const token = useAtomValue(accessTokenAtom);
  return useQuery({
    queryKey:
      version != null
        ? diarySchemaQueryKey.detail(worldId, version)
        : ['diary-schema', worldId, 'pending'],
    queryFn: () =>
      api.get<DiarySchemaVersion>(
        `/worlds/${worldId}/diary-schema-versions/${version}`,
      ),
    enabled: !!token && !!worldId && version != null,
  });
}

/**
 * Aktivní verze (computed nad list + plný fetch detailu).
 * Pravidlo „aktivní" = nejvyšší `version` s `archivedAt === null`.
 * Pokud žádná aktivní (svět nikdy nedostal verzi 1 — pre-seed-fix světy),
 * vrátí `activeMeta: undefined`.
 */
export function useActiveDiarySchema(worldId: string) {
  const versionsQ = useDiarySchemaVersions(worldId);
  const activeMeta = useMemo(() => {
    if (!versionsQ.data) return undefined;
    return [...versionsQ.data]
      .sort((a, b) => b.version - a.version)
      .find((v) => v.archivedAt === null);
  }, [versionsQ.data]);
  const versionQ = useDiarySchemaVersion(worldId, activeMeta?.version);
  return {
    activeMeta,
    data: versionQ.data,
    isLoading: versionsQ.isLoading || versionQ.isLoading,
    isError: versionsQ.isError || versionQ.isError,
    error: versionsQ.error ?? versionQ.error,
  };
}

/* ============================================================
 * Mutace
 * ============================================================ */

/** POST .../diary-schema-versions (PJ+). Archivuje předchozí, vytvoří novou aktivní. */
export function useCreateDiarySchemaVersion(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateDiarySchemaVersionInput) =>
      api.post<DiarySchemaVersion>(
        `/worlds/${worldId}/diary-schema-versions`,
        input,
      ),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['diary-schema', worldId] });
      // Postavy bez override teď ukazují nové schéma — invalidate jejich deníky.
      void qc.invalidateQueries({ queryKey: ['characters', worldId] });
    },
  });
}

/** PATCH .../characters/:slug/diary — uloží `personalDiarySchema`. */
export function useUpdatePersonalDiarySchema(worldId: string, slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      personalDiarySchema:
        | import('../../api/characters.types').CustomDiaryBlock[]
        | null,
    ) =>
      api.patch<unknown>(
        `/worlds/${worldId}/characters/${slug}/diary`,
        { personalDiarySchema },
      ),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: charactersQueryKey.subdoc(worldId, slug, 'diary'),
      });
    },
  });
}

/** PATCH .../characters/:slug/diary s `personalDiarySchema: null` — reset overridu. */
export function useResetPersonalDiarySchema(worldId: string, slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.patch<unknown>(`/worlds/${worldId}/characters/${slug}/diary`, {
        personalDiarySchema: null,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: charactersQueryKey.subdoc(worldId, slug, 'diary'),
      });
    },
  });
}

/** 8.5 D-DIARY-1 — přejmenování keys v customData postavy po rename bloku. */
export function useRemapDiaryKeys(worldId: string, slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: RemapDiaryKeysInput) =>
      api.post<unknown>(
        `/worlds/${worldId}/characters/${slug}/diary/remap`,
        input,
      ),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: charactersQueryKey.subdoc(worldId, slug, 'diary'),
      });
    },
  });
}

/** 8.5 D-DIARY-2 — bulk reset personalDiarySchema u všech postav světa. */
export function useResetAllPersonalDiarySchemas(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.post<{ count: number }>(
        `/worlds/${worldId}/diary-overrides/reset-all`,
      ),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['characters', worldId] });
    },
  });
}

/**
 * 8.5 D-DIARY-5 — bulk remap keys customData přes všechny postavy světa.
 * Volá se po save schématu, pokud admin přejmenoval `key` bloku (FE detekuje
 * rename přes stabilní `id` v `detectRenamedKeys`).
 */
export function useRemapAllDiaryKeys(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (mapping: Record<string, string>) =>
      api.post<{ count: number }>(
        `/worlds/${worldId}/diary-overrides/remap`,
        { mapping },
      ),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['characters', worldId] });
    },
  });
}
