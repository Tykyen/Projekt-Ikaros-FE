/**
 * 16.2g F2 — hooky pro per-svět schéma entit (bestie/token) „Vlastního Systému".
 *
 * `useResolvedEntitySchema` je klíč: pro dedikované systémy vrátí statický
 * registry (assets), pro `vlastni`/`generic` vezme world verzi z BE. Token
 * fallbackuje na world `bestie` schéma (jeden statblok slouží katalogu i mapě).
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { api } from '@/shared/api';
import { accessTokenAtom } from '@/shared/store/authStore';
import { resolveSystemId } from '@/features/world/systemId';
import { systemEntitySchemaRegistry } from './registry';
import type { SystemEntitySchema, SystemEntityType } from './types';
import type {
  EntitySchemaVersion,
  EntitySchemaVersionMeta,
  CreateEntitySchemaVersionInput,
} from './entitySchemaVersions.types';
import { entitySchemaQueryKey } from './entitySchemaVersions.types';

/** Seznam verzí (meta) pro daný entityType. */
export function useEntitySchemaVersions(
  worldId: string,
  entityType: SystemEntityType,
) {
  const token = useAtomValue(accessTokenAtom);
  return useQuery({
    queryKey: entitySchemaQueryKey.list(worldId, entityType),
    queryFn: () =>
      api.get<EntitySchemaVersionMeta[]>(
        `/worlds/${worldId}/entity-schema-versions`,
        { entityType },
      ),
    enabled: !!token && !!worldId,
    placeholderData: [],
  });
}

/** Detail konkrétní verze. */
export function useEntitySchemaVersion(
  worldId: string,
  entityType: SystemEntityType,
  version: number | undefined,
) {
  const token = useAtomValue(accessTokenAtom);
  return useQuery({
    queryKey:
      version != null
        ? entitySchemaQueryKey.detail(worldId, entityType, version)
        : ['entity-schema', worldId, entityType, 'pending'],
    queryFn: () =>
      api.get<EntitySchemaVersion>(
        `/worlds/${worldId}/entity-schema-versions/${version}`,
        { entityType },
      ),
    enabled: !!token && !!worldId && version != null,
  });
}

/** Aktivní verze (nebo `null`). `enabled=false` = neposílá request. */
export function useActiveEntitySchema(
  worldId: string,
  entityType: SystemEntityType,
  enabled = true,
) {
  const token = useAtomValue(accessTokenAtom);
  return useQuery({
    queryKey: entitySchemaQueryKey.active(worldId, entityType),
    queryFn: () =>
      api.get<EntitySchemaVersion | null>(
        `/worlds/${worldId}/entity-schema-versions/active`,
        { entityType },
      ),
    enabled: !!token && !!worldId && enabled,
  });
}

/** POST nová verze (PJ+). Archivuje předchozí. */
export function useCreateEntitySchemaVersion(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateEntitySchemaVersionInput) =>
      api.post<EntitySchemaVersion>(
        `/worlds/${worldId}/entity-schema-versions`,
        input,
      ),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['entity-schema', worldId] });
      // Bestie se renderují z nového schématu → refetch bestiáře.
      void qc.invalidateQueries({ queryKey: ['bestiae'] });
    },
  });
}

function toSchema(
  v: EntitySchemaVersion,
  systemId: string,
  entityType: SystemEntityType,
): SystemEntitySchema {
  return { systemId, entityType, version: v.version, sections: v.sections };
}

/**
 * Vyřeší schéma entity pro daný svět + systém. Dedikované systémy → statický
 * registry. `vlastni`/`generic` → world verze z BE (token fallbackuje na
 * world `bestie`, ať jedno schéma pokryje katalog i statblok na mapě).
 *
 * VŽDY vrátí schéma (nikdy neblokuje): dokud world verze nedorazí (nebo když
 * svět vlastní schéma nemá), použije se registry `generic:*` fallback a po
 * doručení se překreslí. Bez blokujícího „Načítám" stavu (jednodušší + testy
 * nepotřebují stub query).
 */
export function useResolvedEntitySchema(
  worldId: string,
  systemId: string,
  entityType: SystemEntityType,
): SystemEntitySchema | null {
  const isCustom = resolveSystemId(systemId) === 'generic';
  const bestieQ = useActiveEntitySchema(worldId, 'bestie', isCustom);
  const tokenQ = useActiveEntitySchema(
    worldId,
    'token',
    isCustom && entityType === 'token',
  );

  if (isCustom) {
    const worldVersion =
      entityType === 'token' ? (tokenQ.data ?? bestieQ.data) : bestieQ.data;
    if (worldVersion) return toSchema(worldVersion, systemId, entityType);
  }
  return systemEntitySchemaRegistry.get(systemId, entityType);
}
