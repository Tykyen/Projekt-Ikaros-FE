/**
 * 10.2d-prep-A C4 — export-schemas build script.
 *
 * Schémata jsou canonical v `src/features/world/tactical-map/schemas/<system>/*.json`.
 * Tento script jen **kopíruje** JSON files do BE assets folder, aby je BE
 * mohl číst při startup (SchemaRegistry.onModuleInit).
 *
 * Spuštění: `npm run export-schemas` v FE root.
 *
 * Spec: docs/arch/phase-10/spec-10.2d-prep-A.md §3.1.
 * Plán: docs/arch/phase-10/plan-10.2d-prep-A.md C4.
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FE_ROOT = resolve(__dirname, '..');

const SOURCE_ROOT = resolve(FE_ROOT, 'src', 'features', 'world', 'tactical-map', 'schemas');
const BE_TARGET = resolve(
  FE_ROOT,
  '..',
  'Projekt-ikaros',
  'backend',
  'assets',
  'schemas',
);

/**
 * Iteruje per-system subdirs (`drd2/`, případně `dnd5e/`, ...) a kopíruje
 * každý `*.json` do BE target. Validuje, že JSON má `systemId` a
 * `entityType` pole.
 */
function discoverSchemas() {
  const systems = readdirSync(SOURCE_ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
  const result = [];
  for (const system of systems) {
    const systemDir = resolve(SOURCE_ROOT, system);
    const jsonFiles = readdirSync(systemDir).filter((f) => f.endsWith('.json'));
    for (const f of jsonFiles) {
      const content = readFileSync(resolve(systemDir, f), 'utf-8');
      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch (e) {
        console.error(`[export-schemas] FAIL parse ${system}/${f}: ${e.message}`);
        process.exit(1);
      }
      if (!parsed.systemId || !parsed.entityType) {
        console.error(
          `[export-schemas] FAIL ${system}/${f}: missing systemId/entityType`,
        );
        process.exit(1);
      }
      result.push({ system, file: f, content });
    }
  }
  return result;
}

const schemas = discoverSchemas();
if (schemas.length === 0) {
  console.error('[export-schemas] No JSON schemas found.');
  process.exit(1);
}

mkdirSync(BE_TARGET, { recursive: true });
for (const { system, file, content } of schemas) {
  // Flat naming: `<systemId>-<entityType>.json` (filename in BE).
  const parsed = JSON.parse(content);
  const target = join(BE_TARGET, `${parsed.systemId}-${parsed.entityType}.json`);
  writeFileSync(target, content);
}

console.log(
  `[export-schemas] OK — copied ${schemas.length} schémata do ${BE_TARGET}`,
);
