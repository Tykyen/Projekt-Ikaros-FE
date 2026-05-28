/**
 * 10.2d-prep-A — schema registry (FE singleton).
 *
 * In-memory mapování `(systemId, entityType) → SystemEntitySchema`. Bootstrap
 * při app startup volá `register()` pro každé baseline schéma. Konzumenti
 * (`EntitySchemaForm`, `EntityStatbar`, validate helpers) přes `get()`
 * dotazují aktuální schéma.
 *
 * BE má vlastní mirror registry (10.2d-prep-A C10), který čte JSON z
 * `shared/schemas/` (exportované přes `pnpm export-schemas`).
 *
 * Spec: docs/arch/phase-10/spec-10.2d-prep-A.md §3.6.
 * Plán: docs/arch/phase-10/plan-10.2d-prep-A.md C2.
 */
import type { SystemEntitySchema, SystemEntityType } from './types';

function makeKey(systemId: string, entityType: SystemEntityType): string {
  return `${systemId}:${entityType}`;
}

class SystemEntitySchemaRegistry {
  private map = new Map<string, SystemEntitySchema>();

  /**
   * Zaregistruje schéma. Duplikát na stejný (systemId, entityType) →
   * fail-fast throw (chytá redundantní bootstrap calls).
   */
  register(schema: SystemEntitySchema): void {
    const key = makeKey(schema.systemId, schema.entityType);
    if (this.map.has(key)) {
      throw new Error(
        `[schema-registry] Duplicate registration for ${key}. ` +
          `Existing schema must be unregistered first.`,
      );
    }
    this.map.set(key, schema);
  }

  /**
   * Get schema; vrátí null pokud neregistrované.
   *
   * 10.2c-edit-9d: fallback path — pokud (systemId, entityType) chybí,
   * zkus `(generic, entityType)`. Konzumenti (TokenStatbarModal,
   * EntitySchemaForm) tak dostanou alespoň generic schema místo prázdného
   * stavu „Schema pro <systemId>:token chybí" pro libovolný neznámý systém.
   *
   * Vrátí stále null, pokud ani generic není registrován (= bootstrap
   * neproběhl správně).
   */
  get(
    systemId: string,
    entityType: SystemEntityType,
  ): SystemEntitySchema | null {
    const direct = this.map.get(makeKey(systemId, entityType));
    if (direct) return direct;
    if (systemId !== 'generic') {
      return this.map.get(makeKey('generic', entityType)) ?? null;
    }
    return null;
  }

  /** List všech schémat pro daný systemId (filter per entityType). */
  list(systemId: string): SystemEntitySchema[] {
    const result: SystemEntitySchema[] = [];
    for (const schema of this.map.values()) {
      if (schema.systemId === systemId) result.push(schema);
    }
    return result;
  }

  /** List všech registrovaných systemId (unique). */
  listSystems(): string[] {
    const systems = new Set<string>();
    for (const schema of this.map.values()) {
      systems.add(schema.systemId);
    }
    return Array.from(systems).sort();
  }

  /**
   * Test-only helper — vyčistí registry. Production kód nepoužívá.
   * Bootstrap běží jednou při app start; opětovné volání by throw.
   */
  _clearForTesting(): void {
    this.map.clear();
  }
}

/**
 * Globální singleton. Bootstrap (`bootstrap.ts`) registruje baseline
 * schémata při app startup; konzumenti přes hooky přímo importují.
 */
export const systemEntitySchemaRegistry = new SystemEntitySchemaRegistry();
