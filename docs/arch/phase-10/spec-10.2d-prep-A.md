# Spec 10.2d-prep-A — Per-system schema engine

**Status:** ✅ HOTOVO — 15 commitů na main (2026-05-27)
**Modul:** taktická mapa / plugin registry
**Velikost:** **L** (cca 18 nových souborů, 4 modifikace, ~35 testů)
**Závisí na:** 10.2-prep-3 (plugin registry — slot pro entity schémata)

---

## 1. Účel

Foundation pro **per-system staty** napříč všemi entitami na mapě (PC tokeny, NPC postavy, Bestie) a později i pro NPC/PC deníky. Místo hardcoded HP/armor pole v `MapToken` zavádíme **schema-driven storage**: jedna kolekce metadata definující jaká pole existují per `(systemId, entityType)`, generic renderer to staví dynamicky.

📚 **Why engine:** D&D má AC + hit dice + saving throws, CoC má SAN + build + dodge, DrD2 má HP/Zbroj/Zranění/Pohyb/Iniciativa. Bez engine bychom museli hardcodit unie struct per systém + per-typ entity. Engine = jeden generic form/statbar/validator + 1 schema config soubor per systém.

Po 10.2d-prep-A máme: `MapToken.systemStats: Record<string, unknown>` storage + DrD2 baseline schema (mirror legacy) + dynamic form + statbar komponenty. Bestiář (10.2d-prep-B) na tomto staví; tokeny (10.2d) totéž; NPC deníky (8.5 reload) později taky.

## 2. Scope

### V scope

#### Schema definice (typy a interfaces)

- **`SystemEntitySchema`** — definice polí per (systemId, entityType):
  ```ts
  interface SystemEntitySchema {
    systemId: string;       // 'drd2', 'dnd5e', 'coc'
    entityType: SystemEntityType;
    version: number;        // pro migration
    sections: SchemaSection[];
  }
  type SystemEntityType =
    | 'bestie'           // NpcTemplate (10.2d-prep-B)
    | 'token'            // MapToken — generic instance stats (10.2d)
    | 'character-pc'     // Character{isNpc:false}.systemStats (later)
    | 'character-npc'    // Character{isNpc:true}.systemStats (later)
    | 'diary-npc'        // NPC deník (8.5 reload)
    | 'diary-pc';        // PC deník (later)

  interface SchemaSection {
    key: string;
    label: string;           // 'Hlavní staty', 'Boj', 'Speciální'
    fields: SchemaField[];
  }

  interface SchemaField {
    key: string;             // 'health.current', 'armor'
    label: string;           // 'HP', 'Zbroj'
    type: 'number' | 'string' | 'enum' | 'list' | 'boolean' | 'computed';
    default?: unknown;
    min?: number;
    max?: number;
    required?: boolean;
    enumValues?: string[];
    formula?: string;        // pro computed fields (jednoduchý expression engine)
    combatBehavior?: CombatBehavior; // jak combat tracker pole používá
    description?: string;    // tooltip help
  }

  type CombatBehavior =
    | 'damageable'      // při damage se odečítá (health.current)
    | 'armor-reducer'   // tlumí příchozí damage (DrD Zbroj)
    | 'initiative'      // řadí v combat trackeru
    | 'movement'        // dosah pohybu (A* range)
    | 'roll-target'     // hodit proti (D&D AC) — info-only v MVP
    | 'static';         // jen display, žádná combat interakce
  ```

- **`SystemEntitySchemaRegistry`** — get/list schémata:
  ```ts
  interface SystemEntitySchemaRegistry {
    get(systemId: string, entityType: SystemEntityType): SystemEntitySchema | null;
    list(systemId: string): SystemEntitySchema[];
    listSystems(): string[];
  }
  ```

#### Schema konfigurace (FE assets)

- **`schemas/drd2.ts`** — baseline schémata pro DrD2 (mirror Matrix legacy):
  - `bestie`: name, image, notes, health (current/max/base), armor, injury, movement, initiative (current/base), abilities[]
  - `token`: stejné jako bestie + `inCombat: boolean` (combat tracker flag) + `selectedCharacterId?`
  - `character-pc` a `character-npc`: rozšířený statblok pro PC/NPC postavy (defer pole pro 10.2e, v 10.2d-prep-A jen kostra)
- **`schemas/index.ts`** — registry impl. (jednoduchý in-memory map; baseline DrD2 register at startup)

⚠️ MVP zahrnuje **jen DrD2 schémata**. D&D 5e / CoC / GURPS / Fate = další pluginy, přidá se config-only později ([[project-takticka-mapa-multi-system]]). Engine architektura připravená.

#### FE — Dynamic renderer komponenty

- **`<EntitySchemaForm schema={schema} value={obj} onChange={onUpdate} />`** — generický form:
  - Iteruje `schema.sections` → renderuje section header + fields
  - Per `field.type`: NumberInput, TextInput, EnumSelect, ListEditor (add/remove), CheckBox, ComputedDisplay (read-only z formula)
  - Validace inline (min/max, required)
  - Layout: responsivní grid (mobil 1 sloupec, desktop adaptivně podle počtu polí v sekci, max 5 na řádku jako DrD2 baseline)
- **`<EntityStatbar schema={schema} value={obj} editable />`** — view komponenta:
  - Render fields s `combatBehavior='damageable'` jako progress bar (current/max)
  - Ostatní fields jako label + value
  - `editable=true` → inline edit přes EntitySchemaForm mode

#### BE — Validator + integrace

- **`SystemStatsValidator.service.ts`** — validuje `systemStats` proti schematu:
  - `validateForCreate(systemStats, schema)`: required + default fill + type check + min/max
  - `validateForPatch(patch, schema, currentStats)`: type check fields v patch
  - Strict mode: neznámé pole odmítá (chrání proti drift)
- Integrace v `MapOperationsService.applyAtomic` pro op `token.add` a `token.update`:
  - Při `token.add`: získat schema(world.system, 'token'), validateForCreate
  - Při `token.update`: validateForPatch
- ⚠️ **BE schema source:** schémata definovaná **na FE jako TypeScript const** + BE má z FE generovaný JSON copy (build step) NEBO BE drží vlastní mirror. Pro MVP: **JSON soubor sdílený přes Git submodule / copy script** v `Projekt-ikaros/shared/schemas/*.json`. Decision TBD v plán fázi.

#### MapToken refactor

- Odstranit fixed pole z `MapToken`:
  - ❌ `currentHp, maxHp, baseHp, armor, baseArmor, injury, initiative, initiativeBase, movement, abilities, customData`
- Přidat:
  - ✅ `systemStats: Record<string, unknown>` — vše per-system staty zde
  - ✅ `inCombat: boolean` — universal flag (combat tracker spravuje), žije mimo systemStats (engine-level pole)
- Zachovat (universal token attrs):
  - `id, characterId, characterSlug, q, r, isNpc, templateId, instanceName, characterData?`

- ⚠️ **Migrace dat:** žádná production data zatím (BE 10.2-prep-1 hotový, ale tokeny prázdné). Drop-and-recreate kolekce při deploy.

#### Testy

- Schema validator — required, default, min/max, enum check, unknown key reject
- Schema registry — get/list
- DrD2 schema integrity — všechna pole legitimní (test loaduje schema a invariantně kontroluje strukturu)
- EntitySchemaForm — render per field type, onChange callback, validace inline
- EntityStatbar — render per behavior tag (damageable=bar, ostatní=label)
- Computed field — formula eval (jednoduchá; `+`, `-`, ref na field key)
- BE validator integrace v MapOperationsService (mock schema, validate token.add/update)

### Mimo scope

- Schémata pro D&D 5e / CoC / GURPS / Fate — další pluginy (config-only, ne kód)
- Dynamic statbar v boji (10.2e — používá `<EntityStatbar>`)
- NPC deník schémata (`diary-npc`) plný impl — 8.5 reload
- PC/NPC postava schémata plný impl — 8.x reload
- Bestiář kolekce — 10.2d-prep-B
- Token render na mapě — 10.2d
- Combat tracker damage logic — 10.2f

## 3. Klíčová rozhodnutí

### 3.1 Schema source of truth — FE TypeScript + JSON export

**Návrh:** schémata definovaná v FE jako TypeScript const (typesafe + IDE autocomplete + možné JIT updates v dev). Build step (`pnpm export-schemas`) generuje JSON do `shared/schemas/*.json`, který BE konzumuje.

🔀 **Alt zamítnuto:** BE definovaný (BE → FE deduce schema). Důvod: schémata jsou hlavně UI/UX rozhodnutí (jaké fields, jaký layout), FE má bohatší typing.

⚠️ Schema versioning: každý schema má `version: number`. Při bump version (breaking change v pole) musí být migrace operation. MVP: version 1, žádná migrace.

### 3.2 Universal vs. per-system fields

Pure schema-driven (žádná fixed pole v `MapToken.systemStats`) — všechno přes schema. Engine ví, jak fungovat přes **behavior tagy** (`combatBehavior: 'damageable'` apod.), ne přes hardcoded názvy polí.

💡 _Důsledek:_ combat tracker (10.2f) najde fields s tagem `damageable` v aktivním systemu a aplikuje damage. Nikoli hardcoded `health.current`. Permits totální per-system flexibilitu.

### 3.3 Computed fields

`formula?: string` — jednoduchý expression engine. MVP podporuje:
- Reference na jiné field key: `health.max + 5`
- Arithmetic: `+ - * /`
- Function: `min(a, b)`, `max(a, b)`

⚠️ NE: variable assignments, conditionals, loops. Pokud někdo potřebuje composite logic, custom field renderer (plugin slot, ne v MVP).

🔀 **Alt zamítnuto:** turing-complete expression jazyk. Příliš složité pro MVP; ad-hoc field formulas vyřešíme custom renderers.

### 3.4 Schema lookup per token

Token nemá `systemId` field. Schema se odvodí z `world.system` (kontextuální). Implications:
- Token spawned ve světě X (system Y) drží `systemStats` ve tvaru Y schemy
- Změna `world.system` z Y na Z = problém: existující tokeny mají Y-shape data, nový engine očekává Z-shape. **Řešení MVP:** changing world.system po vytvoření tokenů je **zakázáno** (UI block + BE 403). Solid project [[project-takticka-mapa-multi-system]] design said "změna world.system přepíná layout VŠEM" — to platí, ale jen pokud žádné tokeny.

⚠️ TBD: pokud uživatel chce změnit world.system po vytvoření tokenů, potřebujeme migration UI (mapovat staré stat pole na nové). Defer post-MVP.

### 3.5 FE generic form layout

Mobile-first (per CLAUDE.md `mobil-desktop` skill po impl):
- Desktop: section header + grid fields (max 5 per row, auto-fit)
- Mobile: stacked, 1 sloupec, sections collapsible

Layout reference (DrD2 baseline mirror legacy edit modal):
```
Section "Hlavní staty"
  [Avatar upload]
  [Name input]
  [Max HP] [Zbroj] [Zranění] [Pohyb] [Iniciativa]  ← 5 sloupců na desktopu
Section "Schopnosti"
  [+ Přidat ability]
  abilities list (label, value, [×])
Section "Poznámky"
  [Textarea]
```

### 3.6 Plugin registry rozšíření

10.2-prep-3 zavedl plugin registry pro per-system mapové elementy. Rozšíříme o:
- `registry.registerEntitySchemas(systemId, schemas: SystemEntitySchema[])`
- `registry.getEntitySchema(systemId, entityType)`

Schémata bootstrap při app init (`schemas/index.ts` načte všechny baseline DrD2 a registruje).

## 4. Datový model

```ts
// src/features/world/tactical-map/schemas/types.ts
export type SystemEntityType =
  | 'bestie' | 'token'
  | 'character-pc' | 'character-npc'
  | 'diary-pc' | 'diary-npc';

export type SchemaFieldType =
  | 'number' | 'string' | 'enum' | 'list' | 'boolean' | 'computed';

export type CombatBehavior =
  | 'damageable' | 'armor-reducer' | 'initiative' | 'movement'
  | 'roll-target' | 'static';

export interface SchemaField {
  key: string;
  label: string;
  type: SchemaFieldType;
  default?: unknown;
  min?: number;
  max?: number;
  required?: boolean;
  enumValues?: string[];
  formula?: string;
  combatBehavior?: CombatBehavior;
  description?: string;
  listItemFields?: SchemaField[];  // pro type='list'
}

export interface SchemaSection {
  key: string;
  label: string;
  fields: SchemaField[];
  collapsible?: boolean;
  initiallyCollapsed?: boolean;
}

export interface SystemEntitySchema {
  systemId: string;
  entityType: SystemEntityType;
  version: number;
  sections: SchemaSection[];
}

// Updated MapToken:
export interface MapToken {
  id: string;
  characterId: string;
  characterSlug: string;
  q: number;
  r: number;
  isNpc: boolean;
  templateId?: string;
  instanceName?: string;
  inCombat: boolean;       // universal
  systemStats: Record<string, unknown>;  // schema-driven
  characterData?: {
    name: string;
    imageUrl?: string;
    diaryData: Record<string, unknown>;
  };
}
```

## 5. Soubory (nové)

```
src/features/world/tactical-map/schemas/
├─ types.ts                       # SchemaField, SchemaSection, SystemEntitySchema, ...
├─ registry.ts                    # SystemEntitySchemaRegistry impl
├─ drd2/
│  ├─ index.ts                    # exports všech DrD2 schémat
│  ├─ bestie.ts                   # SystemEntitySchema pro bestii
│  ├─ token.ts                    # SystemEntitySchema pro token
│  ├─ character-pc.ts             # placeholder (kostra)
│  ├─ character-npc.ts            # placeholder
│  ├─ diary-pc.ts                 # placeholder
│  └─ diary-npc.ts                # placeholder
├─ bootstrap.ts                   # register baseline schémata při app init
└─ __tests__/
   ├─ drd2-bestie.spec.ts
   ├─ drd2-token.spec.ts
   └─ registry.spec.ts

src/features/world/tactical-map/components/schema-form/
├─ EntitySchemaForm.tsx           # generic form renderer
├─ EntitySchemaForm.module.css
├─ EntityStatbar.tsx              # view komponenta
├─ EntityStatbar.module.css
├─ fields/
│  ├─ NumberField.tsx
│  ├─ TextField.tsx
│  ├─ EnumField.tsx
│  ├─ ListField.tsx
│  ├─ BooleanField.tsx
│  └─ ComputedField.tsx
├─ formula.ts                     # jednoduchý expression evaluator
└─ __tests__/
   ├─ EntitySchemaForm.spec.tsx
   ├─ EntityStatbar.spec.tsx
   └─ formula.spec.ts

src/features/world/tactical-map/utils/
└─ validateSystemStats.ts         # FE-side mirror BE validator (pro optimistic)

# BE
backend/src/modules/maps/schemas/system-entity-schema/
├─ system-entity-schema.types.ts
├─ system-stats-validator.service.ts
├─ schema-registry.service.ts     # in-memory load z shared/schemas/
└─ __tests__/
   └─ system-stats-validator.spec.ts

shared/schemas/                   # JSON export, sdílený FE↔BE
├─ drd2-bestie.json
├─ drd2-token.json
└─ ...

scripts/
└─ export-schemas.ts              # FE TypeScript → JSON build step
```

Modifikace:
- `src/features/world/tactical-map/types.ts` — `MapToken` refactor (odstranit fixed pole, přidat `systemStats`)
- `backend/src/modules/maps/schemas/map-scene.schema.ts` — token sub-schema update
- `backend/src/modules/maps/operations/map-operations.service.ts` — `token.add` a `token.update` integrate validator
- `Projekt-ikaros-FE/src/main.tsx` (nebo equivalent init) — volat `bootstrapSchemas()` při startup

## 6. Bezpečnost

- BE validator je autoritativní (FE může mít stale schema; BE shared/schemas/ je golden source)
- `validateForCreate` reject neznámé fields → ochrana proti rogue payloads
- Schema version mismatch (token created v old version, schema new) → BE odmítne nebo migrace path (defer)

## 7. Testovací scénáře

### Unit

- DrD2 bestie schema integrity — všechna pole mají label, type, required nebo default
- DrD2 token schema obsahuje universal slots (health, armor, movement, initiative)
- `validateForCreate` — required missing → throw; default fill; min/max enforced
- `validateForPatch` — unknown key → throw; type mismatch → throw
- `formula.evaluate('health.max - injury', { health: {max: 10}, injury: 3 })` → 7
- Registry — get/list/listSystems vrací správné entries
- EntitySchemaForm — renderuje sekce, fields, callback změny
- EntityStatbar — fields s `damageable` → progress bar render

### Integration

- BE `POST /maps/:id/operations { token.add }` — validate proti DrD2 schema → 201 / 400 dle valid/invalid payload
- FE form fill → submit → submit shape matchne validator expectation
- Schema bootstrap při app init → registry obsahuje DrD2 entries

## 8. Open questions

1. **Schema sharing mechanism** — Git submodule vs build-script JSON export vs runtime fetch z BE? **MVP doporučuji build-script JSON** (`pnpm export-schemas` v FE před commitem; BE čte JSON soubory ze submodule/copy). TBD plán.
2. **Computed field formula syntax** — vlastní mini-parser nebo `expr-eval` npm? **MVP doporučuji custom mini-parser** (≤200 LOC, žádné runtime risks; ne plný JS eval).
3. **Schema versioning & migrace** — pokud schema změní (v2 přidá pole), staré tokeny v DB? **MVP version=1, migrace defer.**
4. **PC/NPC character schémata** — v 10.2d-prep-A jen kostra (`sections: []`) nebo plný? **MVP kostra** (Pages UI 9.1 zatím nepoužívá per-system staty; rozšíříme až 8.x reload).
5. **List field UX** — array of objects (např. abilities). Inline add/remove řádek vs modal-in-modal? **MVP inline řádek** (lepší UX, mirror legacy).
6. **Character.diaryData migrace na schema** — aktuálně volný `Record<string, unknown>`; ovlivní 10.2d-prep-A nebo defer? **Defer 8.x reload.**

## 9. Akceptační kritéria

- [ ] `SystemEntitySchema` typy definované + export
- [ ] DrD2 baseline schémata pro `bestie`, `token`, kostra ostatních (`character-*`, `diary-*`)
- [ ] Schema registry — get/list operations
- [ ] `EntitySchemaForm` renderuje DrD2 token schema → identický layout jako legacy edit modal (visual reference: screenshot uživatele)
- [ ] `EntityStatbar` renderuje token statby → mirror legacy side panel layout
- [ ] BE `SystemStatsValidator` — `validateForCreate`, `validateForPatch` testy
- [ ] BE `token.add` a `token.update` ops integrate validator (reject invalid payload → 400)
- [ ] `MapToken` typ + BE schema refactored na `systemStats`
- [ ] Build script `export-schemas` generuje JSON ze TS schémat
- [ ] Bootstrap při app init registruje DrD2 schémata
- [ ] 35+ testů zelených (unit + integration)
- [ ] tsc -b + vite build clean + BE tsc clean
