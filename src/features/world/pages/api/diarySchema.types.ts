/**
 * 8.5 — Typy pro `diary_schema_versions` (verzovaná šablona deníku světa).
 * Zrcadlí BE `src/modules/worlds/diary-schema-versions/*` + DTO.
 *
 * Vztah k `CustomDiaryBlock` (per-postava override v `characters.types.ts`):
 * `DiarySchemaBlock` je „hnízděný" tvar (config v nested objektu), `CustomDiaryBlock`
 * je „rozplácnutý" (config fields vedle sebe). Konverze přes `flattenSchemaBlock` /
 * `nestCustomBlock` v `WorldDiarySchemaEditorPage/utils/schemaMappers.ts`.
 */

export const DIARY_BLOCK_TYPES = [
  'stat',
  'bar',
  'list',
  'text',
  'number',
  'textarea',
  /** D-DIARY-3 — image typ; URL drží `config.imageUrl` (default
   *  pro všechny postavy) nebo `customData[id]` (per-postava override). */
  'image',
  /** D-DIARY-3 — relation: link na jinou postavu (slug v customData). */
  'relation',
  /** D-DIARY-3 — formula: computed value z výrazu nad number/stat/bar bloky. */
  'formula',
] as const;

export type DiaryBlockType = (typeof DIARY_BLOCK_TYPES)[number];

/**
 * Konfigurace bloku — různá pole pro různé typy.
 * - `stat / number`: minValue, maxValue (volitelné), description
 * - `bar`: minValue, maxValue, color
 * - `list`: options[]
 * - `text / textarea`: description
 * - `layoutArea` — všechny typy, volitelný grouping
 */
export interface DiaryBlockConfig {
  description?: string;
  minValue?: number;
  maxValue?: number;
  color?: string;
  options?: string[];
  layoutArea?: string;
  /** D-DIARY-3 — defaultní obrázek pro `image` blok. */
  imageUrl?: string;
}

export interface DiarySchemaBlock {
  /**
   * Stabilní UUID — generuje FE při create bloku, BE ho jen ukládá.
   * Umožňuje rename `key` bez ztráty dat v `customData` postav (volá se
   * `POST .../diary/remap`).
   */
  id?: string;
  key: string;
  label: string;
  type: DiaryBlockType;
  config?: DiaryBlockConfig;
  order: number;
}

export interface DiarySchemaVersion {
  id: string;
  worldId: string;
  version: number;
  system: string;
  schema: DiarySchemaBlock[];
  /** `null` = aktivní verze. Jiná hodnota = archivovaná. */
  archivedAt: string | null;
}

export interface DiarySchemaVersionMeta {
  version: number;
  system: string;
  archivedAt: string | null;
}

export interface CreateDiarySchemaVersionInput {
  schema: DiarySchemaBlock[];
}

/** 8.5 D-DIARY-1 — POST .../diary/remap */
export interface RemapDiaryKeysInput {
  mapping: Record<string, string>;
}

/** Query key factory. */
export const diarySchemaQueryKey = {
  list: (worldId: string) => ['diary-schema', worldId, 'list'] as const,
  detail: (worldId: string, version: number) =>
    ['diary-schema', worldId, version] as const,
};
