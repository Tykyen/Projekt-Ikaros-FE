/**
 * 16.2g F2 — per-svět verzované schéma entit (bestie/token) pro „Vlastní
 * Systém". Zrcadlí BE `entity_schema_versions`. Analogické `diarySchema.types`,
 * ale drží bohatší `SystemEntitySchema.sections` (s `combatBehavior`).
 */
import type { SchemaSection, SystemEntityType } from './types';

export interface EntitySchemaVersion {
  id: string;
  worldId: string;
  entityType: string;
  version: number;
  system: string;
  sections: SchemaSection[];
  archivedAt: string | null;
}

export interface EntitySchemaVersionMeta {
  entityType: string;
  version: number;
  system: string;
  archivedAt: string | null;
}

export interface CreateEntitySchemaVersionInput {
  entityType: SystemEntityType;
  sections: SchemaSection[];
}

export const entitySchemaQueryKey = {
  active: (worldId: string, entityType: string) =>
    ['entity-schema', worldId, entityType, 'active'] as const,
  list: (worldId: string, entityType: string) =>
    ['entity-schema', worldId, entityType, 'list'] as const,
  detail: (worldId: string, entityType: string, version: number) =>
    ['entity-schema', worldId, entityType, version] as const,
};
