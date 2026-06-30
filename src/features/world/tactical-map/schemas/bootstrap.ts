/**
 * 10.2d-prep-A — bootstrap baseline schémat při app startup.
 *
 * Volá se z `src/main.tsx` (nebo equivalent app init) jednou před prvním
 * render. Loaduje DrD2 schémata (mirror Matrix legacy MVP); další systémy
 * (D&D 5e, CoC, GURPS, ...) přijdou jako další pluginy config-only.
 *
 * Spec: docs/arch/phase-10/spec-10.2d-prep-A.md §3.6.
 * Plán: docs/arch/phase-10/plan-10.2d-prep-A.md C2, C14.
 */
import { systemEntitySchemaRegistry } from './registry';
import { drd2Schemas } from './drd2';
import { drd16Schemas } from './drd16';
import { drdplusSchemas } from './drdplus';
import { genericSchemas } from './generic';
import { matrixSchemas } from './matrix';
import { piSchemas } from './pi';
import { dnd5eSchemas } from './dnd5e';
import { jadSchemas } from './jad';
import { cocSchemas } from './coc';
import { faeSchemas } from './fae';
import { fateSchemas } from './fate';
import { gurpsSchemas } from './gurps';
import { shadowrunSchemas } from './shadowrun';

let bootstrapped = false;

/**
 * Idempotent bootstrap. Multiple calls = no-op (užitečné pro test setup).
 *
 * 10.2c-edit-9d: zaregistrován i `generic` system — fallback pro libovolný
 * neznámý systemId přes `registry.get`.
 * 10.2c-edit-9h: doplněna per-system schémata pro Matrix, D&D 5e, CoC, Fate,
 * GURPS (bestie + token). Generic fallback zůstává pro neznámé systémy.
 */
export function bootstrapSchemas(): void {
  if (bootstrapped) return;
  for (const schema of genericSchemas) {
    systemEntitySchemaRegistry.register(schema);
  }
  for (const schema of drd2Schemas) {
    systemEntitySchemaRegistry.register(schema);
  }
  for (const schema of drd16Schemas) {
    systemEntitySchemaRegistry.register(schema);
  }
  for (const schema of drdplusSchemas) {
    systemEntitySchemaRegistry.register(schema);
  }
  for (const schema of matrixSchemas) {
    systemEntitySchemaRegistry.register(schema);
  }
  for (const schema of piSchemas) {
    systemEntitySchemaRegistry.register(schema);
  }
  for (const schema of dnd5eSchemas) {
    systemEntitySchemaRegistry.register(schema);
  }
  for (const schema of jadSchemas) {
    systemEntitySchemaRegistry.register(schema);
  }
  for (const schema of cocSchemas) {
    systemEntitySchemaRegistry.register(schema);
  }
  for (const schema of fateSchemas) {
    systemEntitySchemaRegistry.register(schema);
  }
  for (const schema of faeSchemas) {
    systemEntitySchemaRegistry.register(schema);
  }
  for (const schema of gurpsSchemas) {
    systemEntitySchemaRegistry.register(schema);
  }
  for (const schema of shadowrunSchemas) {
    systemEntitySchemaRegistry.register(schema);
  }
  bootstrapped = true;
}
