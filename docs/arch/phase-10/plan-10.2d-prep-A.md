# Plan 10.2d-prep-A — Per-system schema engine

**Spec:** [`spec-10.2d-prep-A.md`](spec-10.2d-prep-A.md)
**Status:** ✅ HOTOVO — 15 commitů (2026-05-27): C1 `dee4a93`, C2+C3 `d14c830`, C4 `7695678`, C5 `50f0e87`, C6+C7+C8 `5ef31fa`, C9 `e096f08`, C10+C11 `8826e43`, C12 `741c2c8d`, C13+C14 `e11ee4c`, C15 tests + 31 zelených
**Velikost:** **L** (~18 nových souborů, ~5 modifikací, ~35 testů, BE + FE refactor)

**Schema sharing:** FE TypeScript + build-script JSON export (volba A z spec §3.1)

---

## 1 — Pořadí commitů (přímo na `main`)

| Commit | Co | Repo | Klíčové soubory | Závisí na |
|---|---|---|---|---|
| **C1** | Schema types + interfaces | FE | `schemas/types.ts` | — |
| **C2** | Schema registry + bootstrap | FE | `schemas/registry.ts`, `schemas/bootstrap.ts` | C1 |
| **C3** | DrD2 baseline schémata (bestie + token; kostra ostatních) | FE | `schemas/drd2/*.ts` | C1 |
| **C4** | Export-schemas build script | repo root | `scripts/export-schemas.ts`, `shared/schemas/*.json` | C3 |
| **C5** | FE formula evaluator (mini-parser) | FE | `schema-form/formula.ts` | C1 |
| **C6** | FE generic field komponenty | FE | `schema-form/fields/*.tsx` | C1, C5 |
| **C7** | FE EntitySchemaForm | FE | `schema-form/EntitySchemaForm.tsx` + css | C6 |
| **C8** | FE EntityStatbar | FE | `schema-form/EntityStatbar.tsx` + css | C6 |
| **C9** | FE validateSystemStats (mirror BE pro optimistic) | FE | `utils/validateSystemStats.ts` | C1 |
| **C10** | BE schema registry + types | BE | `system-entity-schema/*` | C4 (JSON files exist) |
| **C11** | BE SystemStatsValidator service | BE | `system-stats-validator.service.ts` | C10 |
| **C12** | BE MapToken refactor (schema → systemStats) + atomic op integrace | BE | `map-scene.schema.ts`, `map-operations.service.ts` | C11 |
| **C13** | FE MapToken type refactor + adjust 10.2c kód | FE | `types.ts`, `applyOperationToScene.ts` | C12 |
| **C14** | App bootstrap volá `bootstrapSchemas()` | FE | `main.tsx` (nebo equivalent) | C2, C3 |
| **C15** | Tests (unit + BE integration) | both | `__tests__/*` | C11, C12, C13 |
| **C16** | Status + docs update | both | spec status → HOTOVO | C15 |

⚠️ **Velikostně nejtěžší:** C10–C13 (BE/FE token refactor) je kritický řetězec — musíme BE+FE udělat v koordinaci, jinak jeden pushne broken state. Plán: C10–C12 BE first (čistý merge na main), pak C13 FE update (sám čistý merge). Mezi C12 a C13 BE běží s prázdnými systemStats fallback (BC handler), aby FE měl chvíli na adaptaci.

⚠️ **`feedback_be_restart_required`:** po C10, C11, C12 restart `nest --watch` v BE.
⚠️ **`feedback_be_precommit_prettier`:** před BE commitem `pnpm prettier --write`.

---

## 2 — Detail změn

### C1 — Schema types + interfaces (FE)

Nový `src/features/world/tactical-map/schemas/types.ts` — kopíruje spec §4 typy (SystemEntitySchema, SchemaField, SchemaSection, CombatBehavior, atd.).

📚 _Žádná logika, jen typy + JSDoc. Test: ne (typy se testují implicitně přes použití)._

### C2 — Schema registry + bootstrap (FE)

`schemas/registry.ts`:
```ts
class SystemEntitySchemaRegistry {
  private map = new Map<string, SystemEntitySchema>(); // key = `${systemId}:${entityType}`
  register(schema: SystemEntitySchema): void { ... }
  get(systemId: string, entityType: SystemEntityType): SystemEntitySchema | null { ... }
  list(systemId: string): SystemEntitySchema[] { ... }
  listSystems(): string[] { ... }
}
export const systemEntitySchemaRegistry = new SystemEntitySchemaRegistry();
```

`schemas/bootstrap.ts`:
```ts
import { drd2Schemas } from './drd2';
export function bootstrapSchemas(): void {
  for (const schema of drd2Schemas) {
    systemEntitySchemaRegistry.register(schema);
  }
}
```

Test (`registry.spec.ts`): register → get/list/listSystems vrací správné entries; duplicate register na (systemId, entityType) → throw nebo override (decide MVP: throw, fail-fast).

### C3 — DrD2 baseline schémata (FE)

**`schemas/drd2/bestie.ts`** (mirror legacy screenshot):
```ts
export const drd2BestieSchema: SystemEntitySchema = {
  systemId: 'drd2',
  entityType: 'bestie',
  version: 1,
  sections: [
    {
      key: 'identity',
      label: 'Identita',
      fields: [
        { key: 'name', label: 'Jméno', type: 'string', required: true },
        { key: 'imageUrl', label: 'Avatar', type: 'string' },  // URL/file ref
      ],
    },
    {
      key: 'main-stats',
      label: 'Hlavní staty',
      fields: [
        { key: 'health.max', label: 'MAX HP', type: 'number', default: 10, min: 1, required: true, combatBehavior: 'damageable' },
        { key: 'armor', label: 'Zbroj', type: 'number', default: 0, min: 0, combatBehavior: 'armor-reducer' },
        { key: 'injury', label: 'Zranění', type: 'number', default: 0, min: 0 },
        { key: 'movement', label: 'Pohyb', type: 'number', default: 5, min: 0, combatBehavior: 'movement' },
        { key: 'initiative.base', label: 'Iniciativa', type: 'number', default: 0, combatBehavior: 'initiative' },
      ],
    },
    {
      key: 'abilities',
      label: 'Schopnosti',
      fields: [
        {
          key: 'abilities',
          label: 'Schopnosti',
          type: 'list',
          listItemFields: [
            { key: 'label', label: 'Název', type: 'string', required: true },
            { key: 'value', label: 'Popis', type: 'string' },
          ],
        },
      ],
    },
    {
      key: 'notes',
      label: 'Poznámky',
      fields: [
        { key: 'notes', label: 'Poznámky', type: 'string', default: '' },  // multiline rendered via type='string' + listItemFields heuristic, nebo extra 'textarea' type — TBD C6
      ],
    },
  ],
};
```

**`schemas/drd2/token.ts`** — bestie schema + dodá:
- `health.current` (default = derived `health.max` při spawn)
- `health.base` (default = `health.max`)
- `initiative.current` (default = `initiative.base`)
- `armor.current` (default = `armor`) — pro buffy v boji
- `inCombat` flag je mimo schema (universal flag v MapToken root)

**`schemas/drd2/character-pc.ts`, `character-npc.ts`, `diary-pc.ts`, `diary-npc.ts`** — kostra:
```ts
export const drd2CharacterPcSchema: SystemEntitySchema = {
  systemId: 'drd2',
  entityType: 'character-pc',
  version: 1,
  sections: [],  // TODO 8.x reload
};
```

**`schemas/drd2/index.ts`** — barrel export `drd2Schemas: SystemEntitySchema[]`.

Test (`drd2-bestie.spec.ts`):
- Schema má required `name`
- 5 main-stats fields v očekávaném pořadí
- `health.max` má `combatBehavior: 'damageable'`
- `abilities` field je type='list' s listItemFields

### C4 — Export-schemas build script

**`scripts/export-schemas.ts`** (root projektu):
```ts
import { writeFileSync, mkdirSync } from 'fs';
import { drd2Schemas } from '../src/features/world/tactical-map/schemas/drd2';

mkdirSync('../shared/schemas', { recursive: true });
for (const schema of drd2Schemas) {
  const filename = `${schema.systemId}-${schema.entityType}.json`;
  writeFileSync(`../shared/schemas/${filename}`, JSON.stringify(schema, null, 2));
}
console.log(`Exported ${drd2Schemas.length} schémat`);
```

`package.json` script: `"export-schemas": "tsx scripts/export-schemas.ts"`.

**`shared/schemas/`** — výstup commit nebudeme ignorovat (BE čte tyhle JSON soubory).

⚠️ **Convention**: vždy spustit `pnpm export-schemas` před commitem, který mění schémata. CI check: ověřit, že JSON files jsou up-to-date (compare-with-source job v lint/build).

### C5 — Formula evaluator (mini-parser)

`schema-form/formula.ts`:
```ts
// Grammar:
//   expr := term (('+' | '-') term)*
//   term := factor (('*' | '/') factor)*
//   factor := number | identifier ('.' identifier)* | '(' expr ')' | func '(' args ')'
//   func := 'min' | 'max' | 'floor' | 'ceil'
export function evaluateFormula(formula: string, ctx: Record<string, unknown>): number | null { ... }
```

Test (`formula.spec.ts`):
- `evaluateFormula('health.max - injury', { health: {max: 10}, injury: 3 })` → 7
- `evaluateFormula('min(armor, 5)', { armor: 8 })` → 5
- `evaluateFormula('a + b * c', { a:1, b:2, c:3 })` → 7 (precedence)
- Invalid syntax → null + console.warn (žádný throw, render zobrazí `—`)

⚠️ NE eval, ne `Function()` constructor. Vlastní lexer + parser (~150 LOC).

### C6 — FE generic field komponenty

Per `field.type`, samostatný komponentový soubor v `schema-form/fields/`:

- `NumberField.tsx` — `<input type="number">` + min/max client validation
- `TextField.tsx` — `<input type="text">` nebo `<textarea>` (pokud `field.description?.includes('multiline')` nebo TBD: extra `subtype: 'textarea'`)
- `EnumField.tsx` — `<select>` s `enumValues`
- `BooleanField.tsx` — `<input type="checkbox">`
- `ListField.tsx` — array of objects renderer; `+ Přidat` / `[×]` per řádek, sub-fields per `listItemFields`
- `ComputedField.tsx` — read-only, vypočítá z `formula` + context value

Každá komponenta:
- props: `field: SchemaField, value, onChange, error?`
- není přímo závislá na schema (jen na field config)
- inline validace (min/max/required) na blur

Style: shared `Field.module.css` (label + input layout).

### C7 — EntitySchemaForm

`schema-form/EntitySchemaForm.tsx`:
```tsx
interface Props {
  schema: SystemEntitySchema;
  value: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
  errors?: Record<string, string>;
}
export function EntitySchemaForm({ schema, value, onChange, errors }: Props) {
  return (
    <div className={styles.form}>
      {schema.sections.map(section => (
        <SchemaFormSection
          key={section.key}
          section={section}
          value={value}
          onChange={onChange}
          errors={errors}
        />
      ))}
    </div>
  );
}
```

Section komponent:
- Header (label)
- Grid layout: pokud `>=2 number fields v sekci a desktop` → grid template 5 sloupců (mirror legacy)
- Pokud mobil → stack 1 sloupec
- Collapsible per `section.collapsible`

CSS responsivně (per CLAUDE.md `mobil-desktop`):
```css
.section-fields {
  display: grid;
  grid-template-columns: 1fr;  /* mobil default */
  gap: 12px;
}
@media (min-width: 768px) {
  .section-fields.main-stats {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    /* max 5 sloupců — mirror legacy */
  }
}
```

Value flat path access: `value['health.max']` (pro vnořené keys používáme dot-path read/write helpers).

Test (`EntitySchemaForm.spec.tsx`):
- Render DrD2 bestie schema → očekávané labels (MAX HP, ZBROJ, ZRANĚNÍ, POHYB, INICIATIVA)
- Change v field → onChange callback s patchnutým objektem
- Required missing → error highlight
- List field — add/remove řádky

### C8 — EntityStatbar (view komponenta)

`schema-form/EntityStatbar.tsx`:
- Iteruje fields v schema
- Pro `combatBehavior='damageable'` → progress bar (current/max)
- Pro ostatní → label + value (read-only)
- Prop `editable=true` → inline edit (přepne na `<EntitySchemaForm>` mode)

Layout mirror legacy side panel:
```
[Avatar large]
[Name + status tag]
[HP bar: progress 3/3]
ZBROJ: 0      ZRANĚNÍ: 0
POHYB: 5      INICIATIVA: 0
─── Schopnosti ───
Exorcismus    2
Nemrtvá magie +2
─── Poznámky ───
<free text>
```

Test (`EntityStatbar.spec.tsx`):
- Damageable field → progress bar element exists
- Static field → label + value text
- `editable=true` → form fields rendered

### C9 — FE validateSystemStats (optimistic)

`utils/validateSystemStats.ts`:
```ts
export function validateForCreate(stats: Record<string, unknown>, schema: SystemEntitySchema): {
  valid: boolean;
  errors: Record<string, string>;
  filled: Record<string, unknown>;  // s defaults
} { ... }
export function validateForPatch(patch: Record<string, unknown>, schema: SystemEntitySchema, current: Record<string, unknown>): {
  valid: boolean;
  errors: Record<string, string>;
} { ... }
```

Mirror BE logic — FE pro optimistic apply před server roundtrip. Pokud invalid, mutation se nezavolá.

Test: stejné scenarios jako BE (required missing, type mismatch, min/max).

### C10 — BE schema registry + types

**`backend/src/modules/maps/schemas/system-entity-schema/system-entity-schema.types.ts`** — kopie FE typů (TS interfaces shared cross-repo).

**`backend/src/modules/maps/schemas/system-entity-schema/schema-registry.service.ts`**:
```ts
@Injectable()
export class SchemaRegistryService {
  private map = new Map<string, SystemEntitySchema>();
  
  onModuleInit(): void {
    // Load všechny JSON z shared/schemas/
    const dir = path.resolve(__dirname, '../../../../../../shared/schemas');
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
    for (const f of files) {
      const schema = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8'));
      this.map.set(`${schema.systemId}:${schema.entityType}`, schema);
    }
  }
  
  get(systemId: string, entityType: SystemEntityType): SystemEntitySchema | null { ... }
}
```

⚠️ **Path resolve**: shared/schemas/ je v repo root (Projekt-ikaros monorepo? Nebo dvě repa?). Ověřit při C4. Pokud jsou repa odděleně, build step musí kopírovat JSON i do BE repa (přes `cp` v `export-schemas`).

Test: registry mock-loads N schémat → get vrací správné.

### C11 — BE SystemStatsValidator service

**`backend/src/modules/maps/schemas/system-entity-schema/system-stats-validator.service.ts`**:
```ts
@Injectable()
export class SystemStatsValidatorService {
  constructor(private readonly registry: SchemaRegistryService) {}
  
  validateForCreate(stats: Record<string, unknown>, systemId: string, entityType: SystemEntityType): {
    valid: boolean;
    errors: Record<string, string>;
    filled: Record<string, unknown>;
  } { ... }
  
  validateForPatch(patch: Record<string, unknown>, systemId: string, entityType: SystemEntityType, current: Record<string, unknown>): {
    valid: boolean;
    errors: Record<string, string>;
  } { ... }
}
```

Test (`system-stats-validator.spec.ts`):
- Required missing → invalid + error key
- Default fill funguje
- Min/max enforcement
- Unknown key → invalid (strict mode)
- Type check (number vs string)

### C12 — BE MapToken refactor + atomic op integrace

**`backend/src/modules/maps/schemas/map-scene.schema.ts`**: token sub-schema redukovat:
```ts
@Schema({ _id: true })
class MapTokenSchemaClass {
  @Prop({ required: true }) characterId: string;
  @Prop({ required: true }) characterSlug: string;
  @Prop({ required: true }) q: number;
  @Prop({ required: true }) r: number;
  @Prop({ required: true }) isNpc: boolean;
  @Prop() templateId?: string;
  @Prop() instanceName?: string;
  @Prop({ default: false }) inCombat: boolean;
  @Prop({ type: Object, default: {} }) systemStats: Record<string, unknown>;
  // Odstraněno: currentHp, maxHp, baseHp, armor, baseArmor, injury, initiative, initiativeBase, movement, abilities, customData, personalDiarySchema
}
```

⚠️ **Migrace data**: production data zatím prázdné. Drop collection při deploy + recreate (komunikováno v release notes).

**`map-operations.service.ts`** — atomic ops integrate validator:
- `applyAtomic(scene, op, world)` — pro `token.add`:
  ```ts
  case 'token.add': {
    const schema = registry.get(world.system, 'token');
    if (!schema) throw new BadRequestException(`No schema for ${world.system}:token`);
    const result = validator.validateForCreate(op.token.systemStats, world.system, 'token');
    if (!result.valid) throw new BadRequestException({ errors: result.errors });
    const token = { ...op.token, systemStats: result.filled };
    scene.tokens.push(token);
    break;
  }
  case 'token.update': {
    const target = scene.tokens.find(t => t.id === op.tokenId);
    if (!target) throw new NotFoundException(...);
    if ('systemStats' in op.patch) {
      const result = validator.validateForPatch(op.patch.systemStats, world.system, 'token', target.systemStats);
      if (!result.valid) throw new BadRequestException({ errors: result.errors });
    }
    Object.assign(target, op.patch);
    break;
  }
  ```

Test (`map-operations.service.spec.ts` rozšíření): token.add s invalid stats → 400; token.update s unknown key → 400.

### C13 — FE MapToken type refactor

**`src/features/world/tactical-map/types.ts`**:
- Redukovat `MapToken` interface (spec §4)
- Update všechny call sites — `applyOperationToScene.ts`, `useMapScene.ts`, jakékoli FE kód, který používal fixed pole
- Token.add op `MapOperation.token` field bude obsahovat `systemStats` instead of fixed pole

Search and replace:
- `token.currentHp` → `token.systemStats['health.current']`
- `token.maxHp` → `token.systemStats['health.max']`
- ... atd. (~10 míst)

Test: `applyOperationToScene.spec.ts` update — patcher používá nový shape.

### C14 — App bootstrap

`src/main.tsx` (nebo wherever app init):
```tsx
import { bootstrapSchemas } from '@/features/world/tactical-map/schemas/bootstrap';
bootstrapSchemas();
```

Test: jednoduchý smoke (po render `<App>` schema registry obsahuje DrD2 entries).

### C15 — Tests + finalize

Souhrn nových testů:
- C2 registry.spec.ts (4-5 testů)
- C3 drd2-*.spec.ts (3 testy)
- C5 formula.spec.ts (8-10 testů — coverage operators, precedence, errors)
- C6 fields/*.spec.tsx (per komponenta, 2-3 testy = ~15)
- C7 EntitySchemaForm.spec.tsx (5-6 testů)
- C8 EntityStatbar.spec.tsx (4-5 testů)
- C9 validateSystemStats.spec.ts (8-10 testů)
- C11 system-stats-validator.spec.ts (8 testů)
- C12 map-operations.service.spec.ts rozšíření (4 testy)

Total ~ 50 testů (přesahuje spec §9 35+ minimum).

### C16 — Status update

- `spec-10.2d-prep-A.md` → status: ✅ HOTOVO + sumarizace commitů
- Doplnit do `roadmap-fe.md` v sekci 10.2 (v C16 nebo později při souhrnu)

---

## 3 — Otevřená rozhodnutí

| # | Rozhodnutí | Návrh | Důsledek pokud změna |
|---|---|---|---|
| 1 | shared/schemas/ location (FE repo vs BE repo vs separate) | FE repo + build copies do BE repa (or BE konfig path) | Pokud separate repo: +1 commit setup git submodule |
| 2 | Textarea jako separate field type vs heuristic | MVP: extra subtype `'textarea'` (čisté) | Změna typu z `'string'`: bumpne schema version |
| 3 | dot-path access (`value['health.max']`) vs deep nested (`value.health.max`) | Flat dot-path (jednodušší read/write) | Pokud nested: deep merge logic complexity |
| 4 | Default values při spawn (computed default např. `health.current = health.max`) | Default v schema je literal value; computed default = `formula` field (existing engine) | Pokud chceme „auto-fill na current = max při token.add": spec §4 token schema má `health.current.default` jako static, BE musí mít spawn-time post-process |

## 4 — Risk register

- **Schema-FE-source vs BE-runtime mismatch:** dev forgot `pnpm export-schemas` → BE loads stale JSON. Mitigace: CI lint check + `husky` pre-commit hook detekce out-of-date JSON.
- **MapToken refactor breaks 10.2c tests:** existing FE testy v `__tests__/applyOperationToScene` pracují s fixed pole. C13 musí update všechny ~26 testů. Riziko: zapomenu některý.
- **Computed field cycle:** `a = b + 1, b = a - 1` → infinite loop. Mitigace: detection v evaluator (visited set, max depth 10).
- **List field deep nesting:** pokud listItemFields obsahuje typ 'list' (rekurze)? MVP: zákaz (validate, throw při registrace).

## 5 — Testovací matice → akceptace

| Akceptační kritérium (spec §9) | Test typ | Soubor |
|---|---|---|
| `SystemEntitySchema` typy export | — | TS kompilace |
| DrD2 schémata + kostra | unit | `drd2-bestie.spec.ts` |
| Schema registry | unit | `registry.spec.ts` |
| EntitySchemaForm DrD2 token = legacy layout | integration | `EntitySchemaForm.spec.tsx` |
| EntityStatbar mirror legacy | integration | `EntityStatbar.spec.tsx` |
| BE validator | unit | `system-stats-validator.spec.ts` |
| BE token.add/update integrate | integration | `map-operations.service.spec.ts` |
| MapToken refactored | TS | kompilace + applyOperationToScene tests update |
| Export script generuje JSON | manual | `pnpm export-schemas` výstup |
| Bootstrap registers DrD2 | smoke | startup |
| 35+ testů | — | `__tests__/` |

---

**Po dokončení 10.2d-prep-A** → 10.2d-prep-B (bestiář) může začít. Engine je foundation pro vše ostatní v 10.2d.
