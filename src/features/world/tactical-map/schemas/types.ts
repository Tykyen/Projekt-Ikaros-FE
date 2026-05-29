/**
 * 10.2d-prep-A — per-system schema engine typy.
 *
 * Definuje strukturu `SystemEntitySchema` — schema-driven storage pro entity
 * na taktické mapě (bestie, tokeny, NPC/PC postavy, deníky). Cíl: jeden engine
 * + jeden generic form renderer + jedno schema config soubor per systém
 * (D&D, CoC, DrD2, ...).
 *
 * Schema = sections (skupiny polí) → fields (jednotlivé pole). Pole má
 * `type` (jak rendert), `combatBehavior` (jak interaguje s combat tracker
 * generic logic), optional `formula` (computed). Engine validuje +
 * generuje form přes registry.
 *
 * Spec: docs/arch/phase-10/spec-10.2d-prep-A.md §4.
 * Plán: docs/arch/phase-10/plan-10.2d-prep-A.md C1.
 */

/**
 * Typ entity, kterou schema popisuje. Per `systemId` může existovat víc
 * schémat — jedno per entity-type (bestie statblok ≠ NPC deník struktura).
 */
export type SystemEntityType =
  | 'bestie' // Bestie statblok (model `Bestie`/`bestiae`, 10.2d)
  | 'token' // MapToken — generic instance stats (10.2d)
  | 'character-pc' // Character{isNpc:false}.systemStats (later)
  | 'character-npc' // Character{isNpc:true}.systemStats (later)
  | 'diary-pc' // PC deník (later)
  | 'diary-npc'; // NPC deník (8.5 reload)

/**
 * Datový typ pole. Engine renderuje různé komponenty per typ.
 *
 * - `number` — number input s min/max validation
 * - `string` — text input (single line; multiline via `subtype` extension defer)
 * - `enum` — select s `enumValues`
 * - `list` — array of objects, sub-fields v `listItemFields`
 * - `boolean` — checkbox
 * - `computed` — read-only, hodnota z `formula` (simple expression)
 */
export type SchemaFieldType =
  | 'number'
  | 'string'
  | 'enum'
  | 'list'
  | 'boolean'
  | 'computed';

/**
 * Behavior tag — jak combat tracker (10.2f) s polem zachází generic způsobem,
 * bez hardcoded názvů. Engine najde fields s tagem `damageable` a aplikuje
 * damage; s tagem `initiative` řadí v combatu; atd.
 *
 * Tohle umožňuje per-system flexibilitu (CoC pole `sanity` může mít tag
 * `damageable` stejně jako D&D `health.current`).
 *
 * - `damageable` — při příchozí damage se odečítá (health.current)
 * - `armor-reducer` — tlumí příchozí damage (DrD Zbroj)
 * - `initiative` — řadí v combat trackeru
 * - `movement` — dosah pohybu (A* range)
 * - `roll-target` — hodit proti (D&D AC) — info-only v MVP
 * - `static` — jen display, žádná combat interakce
 */
export type CombatBehavior =
  | 'damageable'
  | 'armor-reducer'
  | 'initiative'
  | 'movement'
  | 'roll-target'
  | 'static';

/**
 * Definice jednoho pole entity. Klíč může být dot-path (`health.current`)
 * pro vnořené hodnoty v `systemStats`.
 */
export interface SchemaField {
  /** Klíč pole, dot-path pro nested (`health.current`). */
  key: string;
  /** Lokalizovaný label (čeština). */
  label: string;
  type: SchemaFieldType;
  /** Default value pro create (filled při validateForCreate). */
  default?: unknown;
  /** Min hodnota (jen `type: 'number'`). */
  min?: number;
  /** Max hodnota (jen `type: 'number'`). */
  max?: number;
  /** Required pro validateForCreate (chybějící → invalid). */
  required?: boolean;
  /** Enum hodnoty (jen `type: 'enum'`). */
  enumValues?: string[];
  /**
   * Expression pro computed field (např. `'health.max - injury'`).
   * Engine evaluator support: `+ - * /`, `min(a,b)`, `max(a,b)`, ref na
   * jiné field key. NO conditionals, loops, assignments.
   */
  formula?: string;
  /** Jak combat tracker pole používá (10.2f). */
  combatBehavior?: CombatBehavior;
  /** Tooltip help text. */
  description?: string;
  /** Sub-fields pro list items (jen `type: 'list'`). */
  listItemFields?: SchemaField[];
}

/**
 * Sekce schématu — skupina příbuzných polí (např. „Hlavní staty", „Boj").
 * Renderuje se jako form sekce s header label + grid fields.
 */
export interface SchemaSection {
  key: string;
  label: string;
  fields: SchemaField[];
  /** Pokud true, render header s toggle (collapse/expand). */
  collapsible?: boolean;
  /** Pokud collapsible+true → default zavřeno. */
  initiallyCollapsed?: boolean;
}

/**
 * Schema pro konkrétní (systemId, entityType) kombinaci.
 *
 * Příklad: `(systemId='drd2', entityType='bestie')` → fields HP/Zbroj/
 * Zranění/Pohyb/Iniciativa + abilities + notes.
 *
 * Schémata jsou registrována v `SystemEntitySchemaRegistry` při app
 * bootstrap. BE čte mirror přes JSON v `shared/schemas/`.
 */
export interface SystemEntitySchema {
  systemId: string;
  entityType: SystemEntityType;
  /**
   * Schema version — při bump (breaking change pole) musí být migrace.
   * MVP version=1.
   */
  version: number;
  sections: SchemaSection[];
}
